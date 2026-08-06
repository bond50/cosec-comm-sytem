import "server-only";

import { AttachmentOwnerType, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const correspondenceAttachmentSelect = {
  id: true,
  originalName: true,
  fileName: true,
  mimeType: true,
  fileSize: true,
  storagePath: true,
  createdAt: true,
  uploadedByUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.AttachmentSelect;

export const correspondenceLinkedDocumentSelect = {
  id: true,
  referenceNumber: true,
  title: true,
  status: true,
  currentLocation: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

export const correspondenceLinkedMeetingSelect = {
  id: true,
  title: true,
  startsAt: true,
  status: true,
  _count: {
    select: {
      actionPoints: true,
    },
  },
} satisfies Prisma.MeetingSelect;

export type CorrespondenceAttachmentItem = Prisma.AttachmentGetPayload<{
  select: typeof correspondenceAttachmentSelect;
}>;

export type CorrespondenceLinkedDocumentItem = Prisma.DocumentGetPayload<{
  select: typeof correspondenceLinkedDocumentSelect;
}>;

export type CorrespondenceLinkedMeetingItem = Prisma.MeetingGetPayload<{
  select: typeof correspondenceLinkedMeetingSelect;
}>;

export async function getCorrespondenceAssets(
  correspondenceId: string,
  organizationId: string,
): Promise<{
  attachments: CorrespondenceAttachmentItem[];
  linkedDocuments: CorrespondenceLinkedDocumentItem[];
  linkedMeetings: CorrespondenceLinkedMeetingItem[];
}> {
  if (!correspondenceId || !organizationId) {
    return {
      attachments: [],
      linkedDocuments: [],
      linkedMeetings: [],
    };
  }

  const [attachments, linkedDocuments, linkedMeetings] = await Promise.all([
    db.attachment.findMany({
      where: {
        organizationId,
        correspondenceId,
        ownerType: AttachmentOwnerType.CORRESPONDENCE,
      },
      orderBy: [{ createdAt: "desc" }],
      select: correspondenceAttachmentSelect,
    }),
    db.document.findMany({
      where: {
        organizationId,
        correspondenceId,
      },
      orderBy: [{ createdAt: "desc" }],
      select: correspondenceLinkedDocumentSelect,
    }),
    db.meeting.findMany({
      where: {
        organizationId,
        correspondenceId,
      },
      orderBy: [{ startsAt: "desc" }],
      select: correspondenceLinkedMeetingSelect,
    }),
  ]);

  return {
    attachments,
    linkedDocuments,
    linkedMeetings,
  };
}
