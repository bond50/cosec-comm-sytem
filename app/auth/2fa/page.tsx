import { auth } from "@/auth";
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
  const session = await auth();
  const challengeKey = session?.user?.id ?? "anonymous";

  return <ChallengeForm next={next} challengeKey={challengeKey} />;
}
