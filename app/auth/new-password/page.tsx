import { NewPasswordForm } from "@/features/auth/components/new-password-form";

type NewPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    email?: string;
  }>;
};

export default async function NewPasswordPage({
  searchParams,
}: NewPasswordPageProps) {
  const { token, email } = await searchParams;

  return <NewPasswordForm token={token} email={email} />;
}
