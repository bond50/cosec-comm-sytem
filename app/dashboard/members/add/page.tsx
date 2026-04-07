import Link from "next/link";
import { CircleCheckBig, Link2, ShieldCheck, UserPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AddMemberForm } from "@/app/dashboard/members/add/add-member-form";
import { CreateMemberAccountForm } from "@/app/dashboard/members/add/create-member-account-form";
import { getMembershipsByOrganization } from "@/features/application/queries/memberships";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { getUsersForSelect } from "@/features/auth/queries/user";

export default async function AddMemberPage() {
  const access = await requirePagePermission("members.manage");

  const [memberships, users] = await Promise.all([
    getMembershipsByOrganization(access.organization.id),
    getUsersForSelect(),
  ]);

  const existingUserIds = new Set(
    memberships.map((membership) => membership.userId),
  );
  const availableUsers = users.filter((user) => !existingUserIds.has(user.id));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="grid gap-6 rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Member onboarding
          </div>
          <div className="space-y-2">
            <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
              Add members to {access.organization.name}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Create a usable member account or attach an existing user to this
              organization. Identity lives on the global user record; role and
              accountability live on the organization membership.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/members"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to members
            </Link>
            <Link
              href="/dashboard/access"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Review access model
            </Link>
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Onboarding options
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Create new account
                  </div>
                  <div className="text-sm leading-6 text-slate-600">
                    Use when the person does not already exist in the system.
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
                  <Link2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Attach existing user
                  </div>
                  <div className="text-sm leading-6 text-slate-600">
                    Use when the global user already exists but lacks this
                    organization membership.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Existing members
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                {memberships.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Current organization memberships
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Available existing users
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                {availableUsers.length}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Can be attached without creating a new account
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <Link2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          <CardContent className="flex items-start justify-between px-6 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Onboarding rule
              </p>
              <p className="mt-3 text-[1.1rem] font-semibold tracking-[-0.03em] text-slate-950">
                Membership first
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Access is organization-scoped even when identity is shared
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
              <CircleCheckBig className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <CreateMemberAccountForm />

        <div className="grid gap-6">
          {availableUsers.length ? (
            <AddMemberForm users={availableUsers} />
          ) : (
            <Card className="rounded-[22px] border-slate-200 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              <CardContent className="space-y-2 px-6 py-6 text-sm leading-6 text-slate-600">
                <p className="font-medium text-slate-900">
                  No unattached existing users are available right now.
                </p>
                <p>
                  Use the create-member form to provision the next account
                  directly inside this organization.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
