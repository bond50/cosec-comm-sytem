import { AuthAccessForm } from "@/features/auth/components/auth-access-form";

type LoginPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { email } = await searchParams;

  return <AuthAccessForm initialEmail={email ?? ""} />;
}
