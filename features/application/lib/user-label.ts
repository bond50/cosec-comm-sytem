type LabeledUser =
  | {
      name?: string | null;
      email?: string | null;
      designation?: string | null;
    }
  | null
  | undefined;

/**
 * The single place that decides how a person's name is displayed. Appends
 * their designation (job title) wherever one is set, e.g.
 * "Allan Sindani, Chief Officer Health" — keep every list, table, and
 * detail panel that shows a member's name going through this instead of
 * inlining `user.name || user.email` so the designation stays consistent
 * everywhere.
 */
export function formatUserLabel(user: LabeledUser): string;
export function formatUserLabel(user: LabeledUser, fallback: string): string;
export function formatUserLabel(
  user: LabeledUser,
  fallback: null,
): string | null;
export function formatUserLabel(
  user: LabeledUser,
  fallback: string | null = "Not assigned",
): string | null {
  if (!user) return fallback;

  const base = user.name || user.email;
  if (!base) return fallback;

  return user.designation ? `${base}, ${user.designation}` : base;
}
