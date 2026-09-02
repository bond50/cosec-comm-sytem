import "server-only";

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatUserLabel } from "@/features/application/lib/user-label";

export const documentRegistrySelect = {
  id: true,
  title: true,
  referenceNumber: true,
  status: true,
  medium: true,
  isArchived: true,
  currentLocation: true,
  createdAt: true,
  archivedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  correspondence: {
    select: {
      id: true,
      referenceNumber: true,
      subject: true,
    },
  },
  currentHolderUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
  _count: {
    select: {
      attachments: true,
    },
  },
} satisfies Prisma.DocumentSelect;

export type DocumentRegistryItem = Prisma.DocumentGetPayload<{
  select: typeof documentRegistrySelect;
}>;

export async function getDocumentsList(organizationId: string) {
  if (!organizationId) return [];

  return db.document.findMany({
    where: {
      organizationId,
    },
    orderBy: [{ isArchived: "asc" }, { createdAt: "desc" }],
    select: documentRegistrySelect,
  });
}

export const documentDetailSelect = {
  id: true,
  title: true,
  referenceNumber: true,
  description: true,
  originOffice: true,
  sourceType: true,
  broughtBy: true,
  currentLocation: true,
  status: true,
  medium: true,
  isArchived: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  sourceDepartment: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  correspondence: {
    select: {
      id: true,
      referenceNumber: true,
      subject: true,
    },
  },
  currentHolderUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
  archivedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
  createdByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      designation: true,
    },
  },
  attachments: {
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      storagePath: true,
      createdAt: true,
      uploadedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
          designation: true,
        },
      },
    },
  },
} satisfies Prisma.DocumentSelect;

export type DocumentDetailItem = Prisma.DocumentGetPayload<{
  select: typeof documentDetailSelect;
}>;

export async function getDocumentDetail(
  organizationId: string,
  documentId: string,
) {
  if (!organizationId || !documentId) return null;

  return db.document.findFirst({
    where: {
      id: documentId,
      organizationId,
    },
    select: documentDetailSelect,
  });
}

export async function getDocumentCreateOptions(organizationId: string) {
  if (!organizationId) {
    return {
      categories: [],
      correspondences: [],
      holders: [],
      sourceDepartmentOptions: [],
    };
  }

  const [categories, correspondences, holders, sourceDepartments] =
    await Promise.all([
      db.documentCategory.findMany({
        where: {
          organizationId,
        },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
        },
      }),
      db.correspondence.findMany({
        where: {
          organizationId,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 50,
        select: {
          id: true,
          referenceNumber: true,
          subject: true,
        },
      }),
      db.organizationMembership.findMany({
        where: {
          organizationId,
          status: "ACTIVE",
        },
        orderBy: [{ user: { name: "asc" } }],
        select: {
          userId: true,
          user: {
            select: {
              name: true,
              email: true,
              designation: true,
            },
          },
        },
      }),
      db.department.findMany({
        where: {
          organizationId,
          status: "ACTIVE",
          kind: "EXECUTION",
        },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
          code: true,
        },
      }),
    ]);

  return {
    categories,
    correspondences,
    holders: holders.map((membership) => ({
      id: membership.userId,
      label: formatUserLabel(membership.user, "Unnamed document holder"),
    })),
    sourceDepartmentOptions: sourceDepartments.map((department) => ({
      id: department.id,
      label: department.code
        ? `${department.name} (${department.code})`
        : department.name,
    })),
  };
}
