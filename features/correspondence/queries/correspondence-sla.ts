import "server-only";

import { CorrespondenceStatus } from "@prisma/client";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export const FINAL_CORRESPONDENCE_STATUSES: CorrespondenceStatus[] = [
  CorrespondenceStatus.COMPLETED,
  CorrespondenceStatus.CANCELLED,
  CorrespondenceStatus.CLOSED,
];

export type CorrespondenceSlaSnapshot = {
  dueDate: Date | null;
  isOverdue: boolean;
  daysRemaining: number | null;
};

export function getCorrespondenceSla(
  dueDate: Date | null | undefined,
  now: Date = new Date(),
): CorrespondenceSlaSnapshot {
  if (!dueDate) {
    return {
      dueDate: null,
      isOverdue: false,
      daysRemaining: null,
    };
  }

  const difference = dueDate.getTime() - now.getTime();

  return {
    dueDate,
    isOverdue: difference < 0,
    daysRemaining: Math.ceil(difference / DAY_IN_MS),
  };
}

export function withCorrespondenceSla<
  T extends { dueDate: Date | null; status: CorrespondenceStatus },
>(
  item: T,
  now: Date = new Date(),
): T & Pick<CorrespondenceSlaSnapshot, "isOverdue" | "daysRemaining"> {
  const { isOverdue, daysRemaining } = getCorrespondenceSla(item.dueDate, now);
  const isFinal = FINAL_CORRESPONDENCE_STATUSES.includes(item.status);

  return {
    ...item,
    isOverdue: isFinal ? false : isOverdue,
    daysRemaining,
  };
}
