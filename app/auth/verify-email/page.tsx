import { VerifyEmailForm } from "@/features/auth/components/verify-email-form";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email } = await searchParams;

  return <VerifyEmailForm initialEmail={email} />;
}
