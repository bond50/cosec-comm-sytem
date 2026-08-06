"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateDepartmentForm } from "@/components/forms/create-department-form";
import { DepartmentsDirectoryTable } from "@/app/dashboard/departments/departments-directory-table";
import type { DepartmentSummary } from "@/features/application/queries/departments";

type DepartmentsWorkspaceProps = {
  departments: DepartmentSummary[];
  canManageDepartments: boolean;
  initialCreateOpen?: boolean;
};

export function DepartmentsWorkspace({
  departments,
  canManageDepartments,
  initialCreateOpen = false,
}: DepartmentsWorkspaceProps) {
  const [createOpen, setCreateOpen] = useState(initialCreateOpen);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[1.65rem]">
          Manage entities
        </h1>
        {canManageDepartments ? (
          <Link
            href="/dashboard/organization/setup"
            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Setup wizard
          </Link>
        ) : null}
      </div>

      <DepartmentsDirectoryTable
        departments={departments}
        canManageDepartments={canManageDepartments}
        onCreate={() => setCreateOpen(true)}
      />

      {canManageDepartments ? (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl overflow-hidden p-0">
            <DialogHeader className="border-b border-slate-200 px-6 py-5">
              <DialogTitle>Create entity</DialogTitle>
              <DialogDescription>
                Add an execution entity such as a department or municipality.
                The central office is created during organization setup.
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-5">
              <CreateDepartmentForm
                mode="dialog"
                onSuccess={() => setCreateOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
