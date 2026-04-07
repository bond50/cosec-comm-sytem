import { AuthAccessForm } from "@/features/auth/components/auth-access-form";

type RegisterPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { email } = await searchParams;

  return <AuthAccessForm initialEmail={email ?? ""} />;
}
