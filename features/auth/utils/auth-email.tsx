// features/auth/utils/auth-email.tsx
import * as React from "react";
import { sendEmail } from "@/lib/email/resend";

import { TwoFactorCode } from "@/features/auth/components/emails/two-factor-code";
import { ActionEmail } from "@/features/auth/components/emails/action-email";

const CLIENT_URL =
  process.env.CLIENT_URL ?? process.env.NEXT_PUBLIC_CLIENT_URL ?? "";

export type AuthEmailDeliveryResult = {
  ok: boolean;
  simulated?: boolean;
  actionUrl?: string;
  code?: string;
  error?: string;
};

function buildActionUrl(path: string) {
  return CLIENT_URL ? `${CLIENT_URL}${path}` : path;
}

async function deliverAuthEmail(
  send: () => Promise<void>,
  fallback: Omit<AuthEmailDeliveryResult, "ok" | "simulated">,
): Promise<AuthEmailDeliveryResult> {
  try {
    await send();
    return { ok: true };
  } catch {
    if (process.env.NODE_ENV === "development") {
      return {
        ok: true,
        simulated: true,
        ...fallback,
      };
    }

    return {
      ok: false,
      error:
        "Email delivery is unavailable right now. Please try again shortly.",
    };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const confirmLink = buildActionUrl(
    `/auth/new-verification?token=${encodeURIComponent(token)}`,
  );

  return deliverAuthEmail(
    () =>
      sendEmail({
        to: email,
        subject: "Verify your email",
        suppressReplies: true,
        react: (
          <ActionEmail
            title="Verify your email"
            lead="Click the button below to confirm your address."
            buttonLabel="Verify Email"
            url={confirmLink}
            preview="Verify your email"
          />
        ),
      }).then(() => undefined),
    {
      actionUrl: confirmLink,
    },
  );
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = buildActionUrl(
    `/auth/new-password?token=${encodeURIComponent(token)}`,
  );

  return deliverAuthEmail(
    () =>
      sendEmail({
        to: email,
        subject: "Reset your password",
        suppressReplies: true,
        react: (
          <ActionEmail
            title="Reset your password"
            lead="Click the button below to choose a new password."
            buttonLabel="Reset Password"
            url={resetLink}
            preview="Reset your password"
          />
        ),
      }).then(() => undefined),
    {
      actionUrl: resetLink,
    },
  );
}

export async function sendTwoFactorEmail(email: string, token: string) {
  return deliverAuthEmail(
    () =>
      sendEmail({
        to: email,
        subject: "Your 2FA Code",
        suppressReplies: true,
        react: <TwoFactorCode code={token} />,
      }).then(() => undefined),
    {
      code: token,
    },
  );
}
