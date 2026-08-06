import "server-only";

import type { Prisma } from "@prisma/client";

const CENTRAL_OFFICE_REFERENCE_CODE = "OCS";

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

  const slugSegments = toSegments(input.slug).map((segment) =>
    segment.toUpperCase(),
  );
  if (slugSegments.length >= 3) {
    const countyIndex = slugSegments.findIndex(
      (segment) => segment === "COUNTY",
    );
    const governmentIndex = slugSegments.findIndex(
      (segment) => segment === "GOVERNMENT",
    );

    if (countyIndex >= 0 && governmentIndex >= 0) {
      const candidateSegments = slugSegments.filter(
        (segment) =>
          !["COUNTY", "GOVERNMENT", "OF", "THE", "AND"].includes(segment),
      );
      const countyInitials = candidateSegments
        .map((segment) => segment[0] ?? "")
        .join("");

      if (countyInitials.length > 0) {
        return `${countyInitials}CG`;
      }
    }
  }

  const fallbackInitials = toSegments(`${input.name} ${input.slug}`)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);

  return fallbackInitials || "ORG";
}

export async function generateCorrespondenceReferenceNumber(
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
  })}/${CENTRAL_OFFICE_REFERENCE_CODE}/${year}/${month}`;

  const monthlyCount = await tx.correspondence.count({
    where: {
      organizationId: input.organizationId,
      receivedAt: {
        gte: new Date(year, now.getMonth(), 1),
        lt: new Date(year, now.getMonth() + 1, 1),
      },
    },
  });

  let sequence = monthlyCount + 1;

  while (sequence < monthlyCount + 10000) {
    const candidate = `${prefix}/${String(sequence).padStart(6, "0")}`;
    const exists = await tx.correspondence.findFirst({
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
    "Unable to generate a unique county correspondence reference number.",
  );
}
