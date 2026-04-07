import { verifyEmailToken } from "@/features/auth/actions/new-verification";
import { ActivationStatus } from "@/features/auth/components/activation-status";

type ActivatePageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ActivatePage({
  searchParams,
}: ActivatePageProps) {
  const { token } = await searchParams;
  const result = await verifyEmailToken(token);

  return <ActivationStatus success={result.success} error={result.error} />;
}
