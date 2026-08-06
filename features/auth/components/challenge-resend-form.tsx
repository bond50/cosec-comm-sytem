"use client";

type ChallengeResendFormProps = {
  action: (formData: FormData) => void;
  formId: string;
  next?: string;
  formRef: React.RefObject<HTMLFormElement | null>;
};

export function ChallengeResendForm({
  action,
  formId,
  next,
  formRef,
}: ChallengeResendFormProps) {
  return (
    <form ref={formRef} id={formId} action={action}>
      <input type="hidden" name="next" value={next ?? ""} />
      <span className="hidden" aria-hidden="true" />
    </form>
  );
}
