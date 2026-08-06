"use client";

import { useMemo, useState } from "react";
import type { ColumnFiltersState } from "@tanstack/react-table";
import { FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CorrespondencesDirectoryTable } from "@/app/dashboard/correspondences/correspondences-directory-table";
import { CorrespondenceRegisterForm } from "@/app/dashboard/correspondences/register/correspondence-register-form";
import type { CorrespondenceListItemWithSla } from "@/features/correspondence/queries/correspondence-list";

type CorrespondencesWorkspaceProps = {
  organizationName: string;
  correspondences: CorrespondenceListItemWithSla[];
  canRegister: boolean;
  senderOfficeSuggestions: string[];
  sourceDepartmentOptions: {
    id: string;
    label: string;
  }[];
  initialColumnFilters?: ColumnFiltersState;
};

export function CorrespondencesWorkspace({
  organizationName,
  correspondences,
  canRegister,
  senderOfficeSuggestions,
  sourceDepartmentOptions,
  initialColumnFilters = [],
}: CorrespondencesWorkspaceProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const stableInitialColumnFilters = useMemo(
    () => initialColumnFilters,
    [initialColumnFilters],
  );

  return (
    <>
      <CorrespondencesDirectoryTable
        correspondences={correspondences}
        canRegister={canRegister}
        initialColumnFilters={stableInitialColumnFilters}
        toolbarPrimaryAction={
          canRegister ? (
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-10 w-full rounded-xl bg-[#1868a6] px-4 text-sm font-semibold hover:bg-[#0f4c79] sm:w-auto"
            >
              <FilePlus2 className="mr-2 h-4 w-4" />
              Register correspondence
            </Button>
          ) : null
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-5xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Register correspondence</DialogTitle>
            <DialogDescription>
              Capture a new incoming correspondence record for this office.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[85vh] overflow-y-auto px-6 py-5">
            <CorrespondenceRegisterForm
              organizationName={organizationName}
              senderOfficeSuggestions={senderOfficeSuggestions}
              sourceDepartmentOptions={sourceDepartmentOptions}
              mode="dialog"
              onSuccess={() => setCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
