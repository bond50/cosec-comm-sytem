"use client";

import { useState } from "react";
import { Link2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddMemberForm } from "@/app/dashboard/members/add/add-member-form";
import { CreateMemberAccountForm } from "@/app/dashboard/members/add/create-member-account-form";
import { MembersDirectoryTable } from "@/app/dashboard/members/members-directory-table";
import type { DepartmentSummary } from "@/features/application/queries/departments";
import type { OrganizationMembershipListItem } from "@/features/application/queries/memberships";

type MembersWorkspaceProps = {
  memberships: OrganizationMembershipListItem[];
  canManageMembers: boolean;
  departments: DepartmentSummary[];
  availableUsers: {
    id: string;
    name: string;
    email: string;
  }[];
  initialCreateOpen?: boolean;
};

export function MembersWorkspace({
  memberships,
  canManageMembers,
  departments,
  availableUsers,
  initialCreateOpen = false,
}: MembersWorkspaceProps) {
  const [createOpen, setCreateOpen] = useState(initialCreateOpen);
  const [attachOpen, setAttachOpen] = useState(false);

  return (
    <>
      <MembersDirectoryTable
        memberships={memberships}
        canManageMembers={canManageMembers}
        departments={departments}
        toolbarPrimaryAction={
          canManageMembers ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {availableUsers.length ? (
                <Button
                  variant="outline"
                  onClick={() => setAttachOpen(true)}
                  className="h-10 w-full rounded-xl sm:w-auto"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Attach existing user
                </Button>
              ) : null}
              <Button
                onClick={() => setCreateOpen(true)}
                className="h-10 w-full rounded-xl bg-[#1868a6] px-4 text-sm font-semibold hover:bg-[#3648d8] sm:w-auto"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add member
              </Button>
            </div>
          ) : null
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Create member account</DialogTitle>
            <DialogDescription>
              Create identity and organization access in one step.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <CreateMemberAccountForm
              departments={departments}
              mode="dialog"
              onSuccess={() => setCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={attachOpen} onOpenChange={setAttachOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Attach existing user</DialogTitle>
            <DialogDescription>
              Add an existing platform user into this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <AddMemberForm
              users={availableUsers}
              departments={departments}
              mode="dialog"
              onSuccess={() => setAttachOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
