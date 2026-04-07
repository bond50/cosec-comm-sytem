"use client";

import { useActionState, useEffect, useEffectEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  requestChallengeCodeAction,
  verifyChallengeCodeAction,
  type ChallengeActionState,
} from "@/features/auth/actions/challenge";
import { AuthFeedback } from "@/features/auth/components/auth-feedback";
import { ChallengeResendForm } from "@/features/auth/components/challenge-resend-form";
import { ChallengeVerifyForm } from "@/features/auth/components/challenge-verify-form";
import { AuthShell } from "@/features/auth/components/auth-shell";

const initialState: ChallengeActionState = {};

type ChallengeFormProps = {
  next?: string;
  organizationName?: string;
};

export function ChallengeForm({ next, organizationName }: ChallengeFormProps) {
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
      title="Security challenge"
      description="Enter the verification code sent to your email to continue."
      organizationName={organizationName}
    >
      <div className="space-y-5">
        <AuthFeedback
          title="Additional verification required"
          message="This extra step protects access to county communication workflows."
        />

        <div className="space-y-5">
          <ChallengeVerifyForm
            action={verifyAction}
            next={next}
            error={serverError}
            success={serverSuccess}
          />

          <ChallengeResendForm
            formRef={resendFormRef}
            action={resendAction}
            next={next}
          />
        </div>
      </div>
    </AuthShell>
  );
}
