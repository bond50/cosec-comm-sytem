import "server-only";

import type { Prisma } from "@prisma/client";

function toSegments(value: string) {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function getCountyGovernmentPrefix(input: { name: string; slug: string }) {
  const countyGovernmentPattern =
    /county\s+government\s+of\s+([a-zA-Z0-9\s-]+)/i;
  const countyGovernmentMatch = input.name.match(countyGovernmentPattern);
  if (countyGovernmentMatch?.[1]) {
    const countyInitials = toSegments(countyGovernmentMatch[1])
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("");

    if (countyInitials.length > 0) {
      return `${countyInitials}CG`;
    }
  }

  const fallbackInitials = toSegments(`${input.name} ${input.slug}`)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);

  return fallbackInitials || "ORG";
}

export async function generateDocumentReferenceNumber(
  tx: Prisma.TransactionClient,
  input: {
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    now?: Date;
  },
) {
  const now = input.now ?? new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `${getCountyGovernmentPrefix({
    name: input.organizationName,
    slug: input.organizationSlug,
  })}/OCS/DOC/${year}/${month}`;

  const monthlyCount = await tx.document.count({
    where: {
      organizationId: input.organizationId,
      createdAt: {
        gte: new Date(year, now.getMonth(), 1),
        lt: new Date(year, now.getMonth() + 1, 1),
      },
    },
  });

  let sequence = monthlyCount + 1;

  while (sequence < monthlyCount + 10000) {
    const candidate = `${prefix}/${String(sequence).padStart(6, "0")}`;
    const exists = await tx.document.findFirst({
      where: {
        organizationId: input.organizationId,
        referenceNumber: candidate,
      },
      select: {
        id: true,
      },
    });

    if (!exists) {
      return candidate;
    }

    sequence += 1;
  }

  throw new Error(
    "Unable to generate a unique county document reference number.",
  );
}
