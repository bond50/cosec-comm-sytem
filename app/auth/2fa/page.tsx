import { ChallengeForm } from "@/features/auth/components/challenge-form";

type ChallengePageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function ChallengePage({
  searchParams,
}: ChallengePageProps) {
  const { next } = await searchParams;

  return <ChallengeForm next={next} />;
}
