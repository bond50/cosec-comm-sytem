import { ActionPointStatus, MeetingStatus } from "@prisma/client";
import * as z from "zod";
import type { CorrespondenceActionState } from "@/features/correspondence/lib/correspondence-action-state";

function optionalTrimmedString(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, { message })
    .optional()
    .transform((value) => value || undefined);
}

function optionalCuid(message: string) {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined)
    .refine((value) => !value || /^c[a-z0-9]{24,}$/i.test(value), { message });
}

const meetingCreateStatusValues = [
  MeetingStatus.SCHEDULED,
  MeetingStatus.POSTPONED,
] as const;

const meetingUpdateStatusValues = [
  MeetingStatus.SCHEDULED,
  MeetingStatus.HELD,
  MeetingStatus.ACTION_POINTS_ISSUED,
  MeetingStatus.POSTPONED,
  MeetingStatus.CANCELLED,
  MeetingStatus.CLOSED,
  MeetingStatus.COMPLETED,
] as const;

const actionPointStatusValues = [
  ActionPointStatus.OPEN,
  ActionPointStatus.IN_PROGRESS,
  ActionPointStatus.COMPLETED,
  ActionPointStatus.CANCELLED,
] as const;

export const meetingCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { message: "Meeting title is required." })
      .max(240, { message: "Meeting title is too long." }),
    description: optionalTrimmedString(4000, "Description is too long."),
    agenda: optionalTrimmedString(4000, "Agenda is too long."),
    venue: optionalTrimmedString(160, "Venue is too long."),
    startsAt: z
      .string()
      .trim()
      .min(1, { message: "Start date and time are required." }),
    endsAt: z.string().trim().optional(),
    organizerUserId: optionalCuid("Select a valid organizer."),
    chairpersonUserId: optionalCuid("Select a valid chairperson."),
    correspondenceId: optionalCuid("Select a valid linked correspondence."),
    status: z
      .enum(meetingCreateStatusValues, {
        message: "Select a valid meeting status.",
      })
      .default(MeetingStatus.SCHEDULED),
  })
  .superRefine((values, ctx) => {
    const startsAt = values.startsAt ? new Date(values.startsAt) : null;
    const endsAt = values.endsAt ? new Date(values.endsAt) : null;

    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "Enter a valid start date and time.",
      });
    }

    if (values.endsAt && (!endsAt || Number.isNaN(endsAt.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Enter a valid end date and time.",
      });
    }

    if (
      startsAt &&
      endsAt &&
      !Number.isNaN(startsAt.getTime()) &&
      !Number.isNaN(endsAt.getTime()) &&
      endsAt < startsAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date and time must be after the start date and time.",
      });
    }
  });

export const meetingActionPointCreateSchema = z
  .object({
    meetingId: z.string().trim().cuid({ message: "Invalid meeting record." }),
    actionPoint: z
      .string()
      .trim()
      .min(3, { message: "Action point is required." })
      .max(1000, { message: "Action point is too long." }),
    assignedToUserId: optionalCuid("Select a valid assignee."),
    assignedToDepartmentId: optionalCuid("Select a valid department."),
    dueDate: z.string().trim().min(1, { message: "Due date is required." }),
    remarks: optionalTrimmedString(1000, "Remarks are too long."),
  })
  .superRefine((values, ctx) => {
    const dueDate = values.dueDate ? new Date(values.dueDate) : null;

    if (!values.assignedToUserId && !values.assignedToDepartmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignedToUserId"],
        message: "Assign the action point to a user, department, or both.",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignedToDepartmentId"],
        message: "Assign the action point to a user, department, or both.",
      });
    }

    if (values.dueDate && (!dueDate || Number.isNaN(dueDate.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Enter a valid due date.",
      });
    }
  });

export const meetingUpdateSchema = z
  .object({
    meetingId: z.string().trim().cuid({ message: "Invalid meeting record." }),
    title: z
      .string()
      .trim()
      .min(3, { message: "Meeting title is required." })
      .max(240, { message: "Meeting title is too long." }),
    description: optionalTrimmedString(4000, "Description is too long."),
    agenda: optionalTrimmedString(4000, "Agenda is too long."),
    discussionSummary: optionalTrimmedString(
      4000,
      "Discussion summary is too long.",
    ),
    resolutions: optionalTrimmedString(4000, "Resolutions are too long."),
    decisions: optionalTrimmedString(4000, "Decisions are too long."),
    venue: optionalTrimmedString(160, "Venue is too long."),
    startsAt: z
      .string()
      .trim()
      .min(1, { message: "Start date and time are required." }),
    endsAt: z.string().trim().optional(),
    organizerUserId: optionalCuid("Select a valid organizer."),
    chairpersonUserId: optionalCuid("Select a valid chairperson."),
    correspondenceId: optionalCuid("Select a valid linked correspondence."),
    status: z
      .enum(meetingUpdateStatusValues, {
        message: "Select a valid meeting status.",
      })
      .default(MeetingStatus.SCHEDULED),
  })
  .superRefine((values, ctx) => {
    const startsAt = values.startsAt ? new Date(values.startsAt) : null;
    const endsAt = values.endsAt ? new Date(values.endsAt) : null;

    if (!startsAt || Number.isNaN(startsAt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startsAt"],
        message: "Enter a valid start date and time.",
      });
    }

    if (values.endsAt && (!endsAt || Number.isNaN(endsAt.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "Enter a valid end date and time.",
      });
    }

    if (
      startsAt &&
      endsAt &&
      !Number.isNaN(startsAt.getTime()) &&
      !Number.isNaN(endsAt.getTime()) &&
      endsAt < startsAt
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endsAt"],
        message: "End date and time must be after the start date and time.",
      });
    }
  });

export const meetingActionPointUpdateSchema = z
  .object({
    actionPointId: z
      .string()
      .trim()
      .cuid({ message: "Invalid action point record." }),
    assignedToUserId: optionalCuid("Select a valid assignee."),
    assignedToDepartmentId: optionalCuid("Select a valid department."),
    dueDate: z.string().trim().min(1, { message: "Due date is required." }),
    status: z.enum(actionPointStatusValues, {
      message: "Select a valid action point status.",
    }),
    remarks: optionalTrimmedString(1000, "Remarks are too long."),
  })
  .superRefine((values, ctx) => {
    const dueDate = values.dueDate ? new Date(values.dueDate) : null;

    if (!values.assignedToUserId && !values.assignedToDepartmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignedToUserId"],
        message: "Assign the action point to a user, department, or both.",
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignedToDepartmentId"],
        message: "Assign the action point to a user, department, or both.",
      });
    }

    if (values.dueDate && (!dueDate || Number.isNaN(dueDate.getTime()))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueDate"],
        message: "Enter a valid due date.",
      });
    }
  });

export const meetingAttachmentSchema = z.object({
  meetingId: z.string().trim().cuid({ message: "Invalid meeting record." }),
  fileName: z.string().trim().optional(),
});

export type MeetingCreateFormValues = {
  title: string;
  description: string;
  agenda: string;
  venue: string;
  startsAt: string;
  endsAt: string;
  organizerUserId: string;
  chairpersonUserId: string;
  correspondenceId: string;
  status: string;
};

export type MeetingActionPointCreateFormValues = {
  meetingId: string;
  actionPoint: string;
  assignedToUserId: string;
  assignedToDepartmentId: string;
  dueDate: string;
  remarks: string;
};

export type MeetingUpdateFormValues = MeetingCreateFormValues & {
  meetingId: string;
  discussionSummary: string;
  resolutions: string;
  decisions: string;
};

export type MeetingActionPointUpdateFormValues = {
  actionPointId: string;
  assignedToUserId: string;
  assignedToDepartmentId: string;
  dueDate: string;
  status: string;
  remarks: string;
};

export type MeetingAttachmentFormValues = {
  meetingId: string;
  fileName: string;
};

export type MeetingCreateActionState = CorrespondenceActionState<
  MeetingCreateFormValues,
  { meetingId: string; organizationId: string }
>;

export type MeetingActionPointCreateActionState = CorrespondenceActionState<
  MeetingActionPointCreateFormValues,
  { meetingId: string; actionPointId: string; organizationId: string }
>;

export type MeetingUpdateActionState = CorrespondenceActionState<
  MeetingUpdateFormValues,
  { meetingId: string; organizationId: string }
>;

export type MeetingActionPointUpdateActionState = CorrespondenceActionState<
  MeetingActionPointUpdateFormValues,
  { meetingId: string; actionPointId: string; organizationId: string }
>;

export type MeetingAttachmentActionState = CorrespondenceActionState<
  MeetingAttachmentFormValues,
  { meetingId: string; attachmentId: string; organizationId: string }
>;

export function getMeetingFieldErrors(
  error: z.ZodError,
): Record<string, string[] | undefined> {
  return z.flattenError(error).fieldErrors;
}

function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export function getMeetingCreateValuesFromFormData(
  formData: FormData,
): MeetingCreateFormValues {
  return {
    title: getString(formData, "title").trim(),
    description: getString(formData, "description"),
    agenda: getString(formData, "agenda"),
    venue: getString(formData, "venue"),
    startsAt: getString(formData, "startsAt").trim(),
    endsAt: getString(formData, "endsAt").trim(),
    organizerUserId: getString(formData, "organizerUserId").trim(),
    chairpersonUserId: getString(formData, "chairpersonUserId").trim(),
    correspondenceId: getString(formData, "correspondenceId").trim(),
    status: getString(formData, "status"),
  };
}

export function getMeetingActionPointCreateValuesFromFormData(
  formData: FormData,
): MeetingActionPointCreateFormValues {
  return {
    meetingId: getString(formData, "meetingId").trim(),
    actionPoint: getString(formData, "actionPoint").trim(),
    assignedToUserId: getString(formData, "assignedToUserId").trim(),
    assignedToDepartmentId: getString(
      formData,
      "assignedToDepartmentId",
    ).trim(),
    dueDate: getString(formData, "dueDate").trim(),
    remarks: getString(formData, "remarks"),
  };
}

export function getMeetingUpdateValuesFromFormData(
  formData: FormData,
): MeetingUpdateFormValues {
  return {
    meetingId: getString(formData, "meetingId").trim(),
    title: getString(formData, "title").trim(),
    description: getString(formData, "description"),
    agenda: getString(formData, "agenda"),
    discussionSummary: getString(formData, "discussionSummary"),
    resolutions: getString(formData, "resolutions"),
    decisions: getString(formData, "decisions"),
    venue: getString(formData, "venue"),
    startsAt: getString(formData, "startsAt").trim(),
    endsAt: getString(formData, "endsAt").trim(),
    organizerUserId: getString(formData, "organizerUserId").trim(),
    chairpersonUserId: getString(formData, "chairpersonUserId").trim(),
    correspondenceId: getString(formData, "correspondenceId").trim(),
    status: getString(formData, "status"),
  };
}

export function getMeetingActionPointUpdateValuesFromFormData(
  formData: FormData,
): MeetingActionPointUpdateFormValues {
  return {
    actionPointId: getString(formData, "actionPointId").trim(),
    assignedToUserId: getString(formData, "assignedToUserId").trim(),
    assignedToDepartmentId: getString(
      formData,
      "assignedToDepartmentId",
    ).trim(),
    dueDate: getString(formData, "dueDate").trim(),
    status: getString(formData, "status").trim(),
    remarks: getString(formData, "remarks"),
  };
}

export function getMeetingAttachmentValuesFromFormData(
  formData: FormData,
): MeetingAttachmentFormValues {
  const file = formData.get("file");

  return {
    meetingId: getString(formData, "meetingId").trim(),
    fileName: file instanceof File ? file.name : "",
  };
}

export const initialMeetingCreateState: MeetingCreateActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    title: "",
    description: "",
    agenda: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    organizerUserId: "",
    chairpersonUserId: "",
    correspondenceId: "",
    status: MeetingStatus.SCHEDULED,
  },
};

export const initialMeetingActionPointCreateState: MeetingActionPointCreateActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      meetingId: "",
      actionPoint: "",
      assignedToUserId: "",
      assignedToDepartmentId: "",
      dueDate: "",
      remarks: "",
    },
  };

export const initialMeetingUpdateState: MeetingUpdateActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    meetingId: "",
    title: "",
    description: "",
    agenda: "",
    discussionSummary: "",
    resolutions: "",
    decisions: "",
    venue: "",
    startsAt: "",
    endsAt: "",
    organizerUserId: "",
    chairpersonUserId: "",
    correspondenceId: "",
    status: MeetingStatus.SCHEDULED,
  },
};

export const initialMeetingActionPointUpdateState: MeetingActionPointUpdateActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      actionPointId: "",
      assignedToUserId: "",
      assignedToDepartmentId: "",
      dueDate: "",
      status: ActionPointStatus.OPEN,
      remarks: "",
    },
  };

export const initialMeetingAttachmentState: MeetingAttachmentActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    meetingId: "",
    fileName: "",
  },
};
