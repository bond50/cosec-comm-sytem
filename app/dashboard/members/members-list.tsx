import Link from "next/link";
import { MembersDirectoryTable } from "@/app/dashboard/members/members-directory-table";
import type { OrganizationMembershipListItem } from "@/features/application/queries/memberships";

type MembersListProps = {
  organizationName: string;
  memberships: OrganizationMembershipListItem[];
  canManageMembers: boolean;
};

export function MembersList({
  organizationName,
  memberships,
  canManageMembers,
}: MembersListProps) {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Members
          </p>
          <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">
            Member workspace
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Memberships for {organizationName}.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/access"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Roles & access
          </Link>
          {canManageMembers ? (
            <Link
              href="/dashboard/members/add"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[#465fff] bg-[#465fff] px-4 text-sm font-medium text-white transition hover:bg-[#3641f5]"
            >
              Add member
            </Link>
          ) : null}
        </div>
      </header>

      <MembersDirectoryTable
        memberships={memberships}
        canManageMembers={canManageMembers}
      />
    </div>
  );
}
