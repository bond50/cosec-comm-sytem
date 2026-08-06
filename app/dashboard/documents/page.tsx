import { Archive, FileStack, FolderOpen, FolderPlus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DocumentsWorkspace } from "@/app/dashboard/documents/documents-workspace";
import { getDocumentCategories } from "@/features/documents/queries/document-categories";
import {
  getDocumentCreateOptions,
  getDocumentsList,
} from "@/features/documents/queries/documents";
import { requireDocumentWorkspaceAccess } from "@/features/auth/utils/require-organization-permission";
import { hasFoundationPermission } from "@/features/auth/utils/role-access";

export default async function DocumentsPage() {
  const access = await requireDocumentWorkspaceAccess();
  const [documents, categories, createOptions] = await Promise.all([
    getDocumentsList(access.organization.id),
    getDocumentCategories(access.organization.id),
    getDocumentCreateOptions(access.organization.id),
  ]);

  const canManage = hasFoundationPermission(
    access.organizationRoles,
    "documents.manage",
  );
  const canArchive = hasFoundationPermission(
    access.organizationRoles,
    "documents.archive",
  );
  const archivedCount = documents.filter(
    (document) => document.isArchived,
  ).length;
  const digitalOrHybridCount = documents.filter(
    (document) => document.medium === "DIGITAL" || document.medium === "HYBRID",
  ).length;

  const statCards = [
    {
      label: "Total records",
      value: documents.length,
      tone: "bg-[#e6f1f8] text-[#1868a6]",
      icon: FileStack,
    },
    {
      label: "Categories",
      value: categories.length,
      tone: "bg-[#e6f1f8] text-[#1868a6]",
      icon: FolderPlus,
    },
    {
      label: "Archived",
      value: archivedCount,
      tone: "bg-slate-100 text-slate-600",
      icon: FolderOpen,
    },
    {
      label: "Digital coverage",
      value: digitalOrHybridCount,
      tone: "bg-[#f0fbf5] text-[#0f6b3a]",
      icon: Archive,
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <header className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[1.5rem] font-semibold tracking-[-0.03em] text-slate-950">
              Manage documents
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {access.organization.name} · Physical and digital records
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card
              key={stat.label}
              className="rounded-2xl border-slate-200 shadow-sm"
            >
              <CardContent className="flex items-center justify-between gap-4 px-5 py-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <DocumentsWorkspace
        documents={documents}
        canManage={canManage}
        canArchive={canArchive}
        categories={categories}
        correspondences={createOptions.correspondences}
        holders={createOptions.holders}
        sourceDepartmentOptions={createOptions.sourceDepartmentOptions}
      />
    </div>
  );
}
