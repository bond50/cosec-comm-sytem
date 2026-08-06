"use client";

import { useActionState, useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  requestChallengeCodeAction,
  verifyChallengeCodeAction,
  type ChallengeActionState,
} from "@/features/auth/actions/challenge";
import { AuthSubmitButton } from "@/features/auth/components/auth-submit-button";
import { ChallengeResendForm } from "@/features/auth/components/challenge-resend-form";
import { ChallengeVerifyForm } from "@/features/auth/components/challenge-verify-form";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { Send } from "lucide-react";

const initialState: ChallengeActionState = {};
const INITIAL_CHALLENGE_RESEND_THROTTLE_MS = 60_000;

type ChallengeFormProps = {
  next?: string;
  organizationName?: string;
  challengeKey: string;
};

function getChallengeStorageKey(challengeKey: string) {
  return `cosec:challenge-code-requested:${challengeKey}`;
}

export function ChallengeForm({
  next,
  organizationName,
  challengeKey,
}: ChallengeFormProps) {
  const verifyFormId = "challenge-verify-form";
  const resendFormId = "challenge-resend-form";
  const router = useRouter();
  const resendFormRef = useRef<HTMLFormElement>(null);
  const hasRequestedInitialCode = useRef(false);
  const [verifyState, verifyAction] = useActionState(
    verifyChallengeCodeAction,
    initialState,
  );
  const [resendState, resendAction] = useActionState(
    requestChallengeCodeAction,
    initialState,
  );
  const replaceRoute = useEffectEvent((target: string) => {
    router.replace(target);
  });
  const requestInitialCode = useEffectEvent(() => {
    if (hasRequestedInitialCode.current) {
      return;
    }

    if (typeof window !== "undefined") {
      const storageKey = getChallengeStorageKey(challengeKey);
      const lastRequestedAt = Number.parseInt(
        window.sessionStorage.getItem(storageKey) ?? "",
        10,
      );

      if (
        Number.isFinite(lastRequestedAt) &&
        Date.now() - lastRequestedAt < INITIAL_CHALLENGE_RESEND_THROTTLE_MS
      ) {
        hasRequestedInitialCode.current = true;
        return;
      }

      window.sessionStorage.setItem(storageKey, String(Date.now()));
    }

    hasRequestedInitialCode.current = true;
    resendFormRef.current?.requestSubmit();
  });

  useEffect(() => {
    requestInitialCode();
  }, []);

  useEffect(() => {
    const redirectTo = verifyState.redirectTo ?? resendState.redirectTo;
    if (redirectTo) {
      replaceRoute(redirectTo);
    }
  }, [resendState.redirectTo, verifyState.redirectTo]);

  const serverError = verifyState.error ?? resendState.error;
  const serverSuccess = verifyState.success ?? resendState.success;

  return (
    <AuthShell
      title="Verify sign-in"
      description=""
      organizationName={organizationName}
    >
      <div className="space-y-4">
        <ChallengeVerifyForm
          formId={verifyFormId}
          action={verifyAction}
          next={next}
          error={serverError}
          success={serverSuccess}
        />

        <div className="grid grid-cols-2 gap-3">
          <AuthSubmitButton form={verifyFormId} className="w-full min-w-0">
            Verify
          </AuthSubmitButton>
          <AuthSubmitButton
            form={resendFormId}
            className="w-full min-w-0 whitespace-nowrap"
            variant="outline"
            icon={<Send />}
          >
            Resend code
          </AuthSubmitButton>
        </div>

        <ChallengeResendForm
          formId={resendFormId}
          formRef={resendFormRef}
          action={resendAction}
          next={next}
        />
      </div>
    </AuthShell>
  );
}
