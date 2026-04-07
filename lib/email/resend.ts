// lib/email/resend.ts
import "server-only";
import { Resend } from "resend";
import type { ReactElement } from "react";

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: ReactElement;
  from?: string;
  replyTo?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  suppressReplies?: boolean;
};

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY not set");
  }
  _resend = new Resend(key);
  return _resend;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  react,
  from,
  replyTo,
  cc,
  bcc,
  suppressReplies = true,
}: SendEmailArgs) {
  const fromAddr =
    from ?? process.env.EMAIL_FROM ?? "Sloya Website <no-reply@example.com>";

  const payloadBase = {
    from: fromAddr,
    to,
    subject,
  };
  const sharedFields = {
    ...(cc ? { cc } : {}),
    ...(bcc ? { bcc } : {}),
  };

  if (!suppressReplies) {
    const rt = replyTo ?? process.env.EMAIL_REPLY_TO;
    if (rt) {
      Object.assign(sharedFields, { reply_to: rt });
    }
  }

  const resend = getResend();
  const payload = react
    ? {
        ...payloadBase,
        ...sharedFields,
        react,
      }
    : {
        ...payloadBase,
        ...sharedFields,
        html,
        text,
      };

  const { data, error } = await resend.emails.send(
    payload as Parameters<Resend["emails"]["send"]>[0],
  );
  if (error) {
    throw new Error(error.message ?? "Resend send failed");
  }
  return data;
}
