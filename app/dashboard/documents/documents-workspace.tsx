"use client";

import { useState } from "react";
import { FilePlus2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateDocumentForm } from "@/app/dashboard/documents/create-document-form";
import { DocumentsDirectoryTable } from "@/app/dashboard/documents/documents-directory-table";
import { ManageDocumentCategories } from "@/app/dashboard/documents/manage-document-categories";
import type { DocumentCategoryItem } from "@/features/documents/queries/document-categories";
import type { DocumentRegistryItem } from "@/features/documents/queries/documents";

type DocumentsWorkspaceProps = {
  documents: DocumentRegistryItem[];
  canManage: boolean;
  canArchive: boolean;
  categories: DocumentCategoryItem[];
  correspondences: { id: string; referenceNumber: string; subject: string }[];
  holders: { id: string; label: string }[];
  sourceDepartmentOptions: { id: string; label: string }[];
};

export function DocumentsWorkspace({
  documents,
  canManage,
  canArchive,
  categories,
  correspondences,
  holders,
  sourceDepartmentOptions,
}: DocumentsWorkspaceProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  return (
    <>
      <DocumentsDirectoryTable
        documents={documents}
        canArchive={canArchive}
        toolbarPrimaryAction={
          canManage ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setCategoryOpen(true)}
                className="h-10 w-full rounded-xl sm:w-auto"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                Manage categories
              </Button>
              <Button
                onClick={() => setCreateOpen(true)}
                className="h-10 w-full rounded-xl bg-[#1868a6] px-4 text-sm font-semibold hover:bg-[#3648d8] sm:w-auto"
              >
                <FilePlus2 className="mr-2 h-4 w-4" />
                Add document
              </Button>
            </div>
          ) : null
        }
      />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Create document</DialogTitle>
            <DialogDescription>
              Register a physical, digital, or hybrid document record.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <CreateDocumentForm
              categories={categories}
              correspondences={correspondences}
              holders={holders}
              sourceDepartmentOptions={sourceDepartmentOptions}
              mode="dialog"
              onSuccess={() => setCreateOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent className="max-w-2xl overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-200 px-6 py-5">
            <DialogTitle>Manage categories</DialogTitle>
            <DialogDescription>
              Organize registry records into repeatable document classes.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <ManageDocumentCategories categories={categories} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
