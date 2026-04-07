"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { cookies } from "next/headers";
import * as z from "zod";

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACCESS_COOKIE = "auth-access-turnstile";
const TURNSTILE_ACCESS_MAX_AGE_SECONDS = 10 * 60;

const turnstileVerifyResponseSchema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()).optional(),
});

type TurnstileVerificationResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
      errorCodes?: string[];
    };

function getRemoteIpFromHeaders(headerStore: Headers): string | undefined {
  const cfConnectingIp = headerStore.get("cf-connecting-ip")?.trim();
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  const forwardedFor = headerStore.get("x-forwarded-for");
  if (forwardedFor) {
    const firstForwardedIp = forwardedFor.split(",")[0]?.trim();
    if (firstForwardedIp) {
      return firstForwardedIp;
    }
  }

  const realIp = headerStore.get("x-real-ip")?.trim();
  return realIp || undefined;
}

function getFailureMessage(errorCodes: string[] | undefined): string {
  if (!errorCodes?.length) {
    return "Security verification could not be completed. Please try again.";
  }

  if (
    errorCodes.includes("missing-input-response") ||
    errorCodes.includes("invalid-input-response")
  ) {
    return "Complete the security check before continuing.";
  }

  if (errorCodes.includes("timeout-or-duplicate")) {
    return "The security check expired. Please complete it again.";
  }

  if (
    errorCodes.includes("missing-input-secret") ||
    errorCodes.includes("invalid-input-secret")
  ) {
    return "Security verification is not configured correctly.";
  }

  return "Security verification failed. Please try again.";
}

function getSigningSecret(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY?.trim() || undefined;
}

function signGatePayload(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`auth-access-turnstile:${payload}`)
    .digest("base64url");
}

function encodeGateValue(email: string, expiresAt: number, secret: string) {
  const payload = JSON.stringify({ email, expiresAt });
  const encodedPayload = Buffer.from(payload, "utf8").toString("base64url");
  const signature = signGatePayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

function decodeGateValue(
  value: string,
  secret: string,
): { email: string; expiresAt: number } | null {
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signGatePayload(encodedPayload, secret);
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as { email?: unknown; expiresAt?: unknown };

    if (
      typeof decoded.email !== "string" ||
      typeof decoded.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      email: decoded.email,
      expiresAt: decoded.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function grantTurnstileAccess(email: string): Promise<void> {
  const secret = getSigningSecret();
  if (!secret) {
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const expiresAt = Date.now() + TURNSTILE_ACCESS_MAX_AGE_SECONDS * 1000;
  const cookieStore = await cookies();

  cookieStore.set(
    TURNSTILE_ACCESS_COOKIE,
    encodeGateValue(normalizedEmail, expiresAt, secret),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TURNSTILE_ACCESS_MAX_AGE_SECONDS,
    },
  );
}

export async function hasTurnstileAccess(email: string): Promise<boolean> {
  const secret = getSigningSecret();
  if (!secret) {
    return false;
  }

  const cookieStore = await cookies();
  const rawValue = cookieStore.get(TURNSTILE_ACCESS_COOKIE)?.value;
  if (!rawValue) {
    return false;
  }

  const decoded = decodeGateValue(rawValue, secret);
  if (!decoded) {
    return false;
  }

  if (decoded.expiresAt < Date.now()) {
    return false;
  }

  return decoded.email === email.trim().toLowerCase();
}

export async function clearTurnstileAccess(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TURNSTILE_ACCESS_COOKIE);
}

export async function verifyTurnstileToken(
  token: string,
): Promise<TurnstileVerificationResult> {
  const secret = getSigningSecret();

  if (!secret) {
    return {
      ok: false,
      message: "Security verification is not configured correctly.",
      errorCodes: ["missing-input-secret"],
    };
  }

  const responseToken = token.trim();
  if (!responseToken) {
    return {
      ok: false,
      message: "Complete the security check before continuing.",
      errorCodes: ["missing-input-response"],
    };
  }

  const headerStore = await headers();
  const remoteIp = getRemoteIpFromHeaders(headerStore);
  const requestBody = new URLSearchParams({
    secret,
    response: responseToken,
  });

  if (remoteIp) {
    requestBody.set("remoteip", remoteIp);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: requestBody.toString(),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        message:
          "Security verification could not be completed. Please try again.",
      };
    }

    const json = await response.json();
    const parsed = turnstileVerifyResponseSchema.safeParse(json);

    if (!parsed.success) {
      return {
        ok: false,
        message:
          "Security verification could not be completed. Please try again.",
      };
    }

    if (!parsed.data.success) {
      return {
        ok: false,
        message: getFailureMessage(parsed.data["error-codes"]),
        errorCodes: parsed.data["error-codes"],
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      message:
        "Security verification could not be completed. Please try again.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
