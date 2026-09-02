import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOrganizationPermission } from "@/features/auth/utils/require-organization-permission";
import {
  ForbiddenError,
  MissingOrganizationError,
  UnauthorizedError,
} from "@/features/auth/utils/auth-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const attachment = await db.attachment.findUnique({
    where: { id },
    select: {
      organizationId: true,
      storagePath: true,
      correspondenceId: true,
      documentId: true,
      meetingId: true,
      actionPointId: true,
    },
  });

  if (!attachment) {
    return NextResponse.json(
      { message: "Attachment not found." },
      { status: 404 },
    );
  }

  const permission = attachment.documentId
    ? "documents.view"
    : attachment.meetingId || attachment.actionPointId
      ? "meetings.view"
      : "dashboard.view";

  try {
    const access = await requireOrganizationPermission(permission);

    if (access.organization.id !== attachment.organizationId) {
      return NextResponse.json(
        { message: "Attachment not found." },
        { status: 404 },
      );
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { message: "You must be signed in to open this file." },
        { status: 401 },
      );
    }

    if (
      error instanceof MissingOrganizationError ||
      error instanceof ForbiddenError
    ) {
      return NextResponse.json(
        { message: "You do not have access to this file." },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { message: "Could not verify access to this file." },
      { status: 500 },
    );
  }

  return NextResponse.redirect(attachment.storagePath);
}
