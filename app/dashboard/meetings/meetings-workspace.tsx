"use client";

import { useState } from "react";
import { CalendarPlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateMeetingForm } from "@/app/dashboard/meetings/create-meeting-form";
import { MeetingsDirectoryTable } from "@/app/dashboard/meetings/meetings-directory-table";
import type { MeetingRegistryItem } from "@/features/meetings/queries/meetings";

type MeetingsWorkspaceProps = {
  meetings: MeetingRegistryItem[];
  canManage: boolean;
  users: { id: string; label: string }[];
  correspondences: { id: string; label: string }[];
};

export function MeetingsWorkspace({
  meetings,
  canManage,
  users,
  correspondences,
}: MeetingsWorkspaceProps) {
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <MeetingsDirectoryTable
        meetings={meetings}
        toolbarPrimaryAction={
          canManage ? (
            <Button
              onClick={() => setCreateOpen(true)}
              className="h-10 w-full rounded-xl bg-[#1868a6] px-4 text-sm font-semibold hover:bg-[#3648d8] sm:w-auto"
            >
              <CalendarPlus2 className="mr-2 h-4 w-4" />
              Add meeting
            </Button>
          ) : null
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Create meeting</DialogTitle>
            <DialogDescription>
              Schedule a meeting record for the current organization.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <CreateMeetingForm
              users={users}
              correspondences={correspondences}
              mode="dialog"
              onSuccess={() => setCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
