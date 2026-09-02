import Link from "next/link";
import { notFound } from "next/navigation";
import { FileStack, Paperclip } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArchiveDocumentButton } from "@/app/dashboard/documents/archive-document-button";
import { DocumentEditForm } from "@/app/dashboard/documents/[id]/document-edit-form";
import { DocumentAttachmentUploadForm } from "@/app/dashboard/documents/[id]/document-attachment-upload-form";
import {
  getDocumentCreateOptions,
  getDocumentDetail,
} from "@/features/documents/queries/documents";
import { requirePagePermission } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

function getDocumentMediumLabel(medium: string) {
  switch (medium) {
    case "DIGITAL":
      return "Digital file";
    case "HYBRID":
      return "Physical + digital file";
    default:
      return "Physical file";
  }
}

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requirePagePermission("documents.view");
  const { id } = await params;
  const document = await getDocumentDetail(access.organization.id, id);

  if (!document) {
    notFound();
  }

  const canArchive = hasFoundationPermission(
    access.organizationRoles,
    "documents.archive",
  );
  const canManage = hasFoundationPermission(
    access.organizationRoles,
    "documents.manage",
  );
  const canUploadAttachment = hasFoundationPermission(
    access.organizationRoles,
    "attachments.upload",
  );
  const editOptions =
    canManage && !document.isArchived
      ? await getDocumentCreateOptions(access.organization.id)
      : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Document detail
            </p>
            <h1 className="text-[1.85rem] font-semibold tracking-[-0.04em] text-slate-950">
              {document.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-[#e6f1f8] text-[#1868a6]">
                {document.status.replaceAll("_", " ")}
              </Badge>
              {document.isArchived ? (
                <Badge className="rounded-full bg-slate-100 text-slate-700">
                  Archived
                </Badge>
              ) : null}
              {document.referenceNumber ? (
                <Badge variant="outline" className="rounded-full">
                  {document.referenceNumber}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/documents"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Back to documents
            </Link>
            {canArchive ? (
              <ArchiveDocumentButton
                documentId={document.id}
                isArchived={document.isArchived}
              />
            ) : null}
          </div>
        </div>

        {document.description ? (
          <p className="max-w-3xl text-sm leading-6 text-slate-600">
            {document.description}
          </p>
        ) : null}
      </div>

      <section className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
              Registry profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-950">Category:</span>{" "}
              {document.category?.name || "Uncategorized"}
            </div>
            <div>
              <span className="font-medium text-slate-950">Medium:</span>{" "}
              {getDocumentMediumLabel(document.medium)}
            </div>
            <div>
              <span className="font-medium text-slate-950">Source:</span>{" "}
              {document.sourceType === "INTERNAL" && document.sourceDepartment
                ? `${
                    document.sourceDepartment.code
                      ? `${document.sourceDepartment.name} (${document.sourceDepartment.code})`
                      : document.sourceDepartment.name
                  } · Internal county office`
                : document.originOffice
                  ? `${document.originOffice} · External source`
                  : "Not recorded"}
            </div>
            <div>
              <span className="font-medium text-slate-950">Brought by:</span>{" "}
              {document.broughtBy || "Not recorded"}
            </div>
            <div>
              <span className="font-medium text-slate-950">
                Current holder:
              </span>{" "}
              {document.currentHolderUser?.name ||
                document.currentHolderUser?.email ||
                "Not assigned"}
            </div>
            <div>
              <span className="font-medium text-slate-950">
                Current location:
              </span>{" "}
              {document.currentLocation || "Not recorded"}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
              Accountability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6 text-sm text-slate-600">
            <div>
              <span className="font-medium text-slate-950">Created:</span>{" "}
              {document.createdAt.toLocaleString()}
            </div>
            <div>
              <span className="font-medium text-slate-950">Created by:</span>{" "}
              {document.createdByUser?.name ||
                document.createdByUser?.email ||
                "System"}
            </div>
            <div>
              <span className="font-medium text-slate-950">Archived at:</span>{" "}
              {document.archivedAt?.toLocaleString() || "Not archived"}
            </div>
            <div>
              <span className="font-medium text-slate-950">
                Searchable archive:
              </span>{" "}
              {document.isArchived
                ? "Yes, retained in registry search"
                : "Will remain searchable after archive"}
            </div>
            <div>
              <span className="font-medium text-slate-950">Archived by:</span>{" "}
              {document.archivedByUser?.name ||
                document.archivedByUser?.email ||
                "Not archived"}
            </div>
          </CardContent>
        </Card>
      </section>

      {editOptions ? (
        <DocumentEditForm
          document={document}
          categories={editOptions.categories}
          correspondences={editOptions.correspondences}
          holders={editOptions.holders}
          sourceDepartmentOptions={editOptions.sourceDepartmentOptions}
        />
      ) : null}

      <section className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em] text-slate-950">
              <FileStack className="h-5 w-5 text-[#1868a6]" />
              Linked correspondence
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 text-sm text-slate-600">
            {document.correspondence ? (
              <Link
                href={`/dashboard/correspondences/${document.correspondence.id}`}
                className="font-medium text-[#1868a6] transition hover:text-[#3447d4]"
              >
                {document.correspondence.referenceNumber} -{" "}
                {document.correspondence.subject}
              </Link>
            ) : (
              "This document is not linked to a correspondence record."
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="px-6 py-5">
            <CardTitle className="flex items-center gap-2 text-lg tracking-[-0.03em] text-slate-950">
              <Paperclip className="h-5 w-5 text-[#1868a6]" />
              Attached files
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6 text-sm text-slate-600">
            {canUploadAttachment && !document.isArchived ? (
              <DocumentAttachmentUploadForm documentId={document.id} />
            ) : null}
            {canUploadAttachment && document.isArchived ? (
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Archived document records are read-only. Attachments cannot be
                added after archive.
              </p>
            ) : null}
            {document.attachments.length === 0 ? (
              <p>No files are attached to this document yet.</p>
            ) : (
              document.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={`/api/attachments/${attachment.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
                >
                  <div className="font-medium text-slate-900">
                    {attachment.originalName}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Uploaded {attachment.createdAt.toLocaleString()} by{" "}
                    {attachment.uploadedByUser?.name ||
                      attachment.uploadedByUser?.email ||
                      "Unknown user"}
                  </div>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
