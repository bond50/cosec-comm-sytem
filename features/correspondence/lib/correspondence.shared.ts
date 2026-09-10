import {
  CorrespondenceConfidentiality,
  CorrespondencePriority,
  CorrespondenceStatus,
  CorrespondenceType,
  DispatchStatus,
  DeliveryMethod,
} from "@prisma/client";
import * as z from "zod";
import type { CorrespondenceActionState } from "@/features/correspondence/lib/correspondence-action-state";

const correspondenceTypeValues = [
  CorrespondenceType.INCOMING,
  CorrespondenceType.OUTGOING,
] as const;

const createCorrespondenceTypeValues = [CorrespondenceType.INCOMING] as const;

const correspondencePriorityValues = [
  CorrespondencePriority.NORMAL,
  CorrespondencePriority.URGENT,
  CorrespondencePriority.VERY_URGENT,
  CorrespondencePriority.CRITICAL,
] as const;

const correspondenceConfidentialityValues = [
  CorrespondenceConfidentiality.PUBLIC,
  CorrespondenceConfidentiality.INTERNAL,
  CorrespondenceConfidentiality.CONFIDENTIAL,
  CorrespondenceConfidentiality.HIGHLY_CONFIDENTIAL,
] as const;

const deliveryMethodValues = [
  DeliveryMethod.HAND,
  DeliveryMethod.EMAIL,
  DeliveryMethod.COURIER,
  DeliveryMethod.POST,
  DeliveryMethod.INTERNAL_MAIL,
  DeliveryMethod.PHONE,
  DeliveryMethod.SYSTEM,
  DeliveryMethod.OTHER,
] as const;

const correspondenceSourceTypeValues = ["INTERNAL", "EXTERNAL"] as const;

const reviewStatusValues = [CorrespondenceStatus.UNDER_REVIEW] as const;
const assignStatusValues = [CorrespondenceStatus.DISPATCHED] as const;
const closeStatusValues = [
  CorrespondenceStatus.CLOSED,
  CorrespondenceStatus.CANCELLED,
] as const;
const reopenStatusValues = [CorrespondenceStatus.UNDER_REVIEW] as const;
const dispatchStatusValues = [DispatchStatus.SENT] as const;
const acknowledgeStatusValues = [
  DispatchStatus.ACKNOWLEDGED,
  DispatchStatus.IN_PROGRESS,
] as const;
const feedbackStatusValues = [DispatchStatus.FEEDBACK_RECEIVED] as const;

function optionalTrimmedString(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, { message })
    .optional()
    .transform((value) => value || undefined);
}

function requiredRecordId(message: string) {
  return z.string().trim().min(1, { message });
}

function optionalRecordId() {
  return z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined);
}

function requiredDateString(message: string) {
  return z
    .string()
    .trim()
    .min(1, { message })
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Enter a valid date and time.",
    });
}

export function normalizeReferenceNumber(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export const correspondenceCreateSchema = z
  .object({
    type: z.enum(createCorrespondenceTypeValues, {
      message: "Phase 1 only supports incoming correspondence.",
    }),
    subject: z
      .string()
      .trim()
      .min(2, { message: "Subject is required." })
      .max(240, { message: "Subject is too long." }),
    description: optionalTrimmedString(4000, "Description is too long."),
    sourceType: z.enum(correspondenceSourceTypeValues, {
      message: "Select whether the source is internal or external.",
    }),
    sourceDepartmentId: optionalRecordId(),
    senderName: z
      .string()
      .trim()
      .min(2, { message: "Sender name is required." })
      .max(160, { message: "Sender name is too long." }),
    senderOffice: z
      .string()
      .trim()
      .min(2, { message: "Sender office is required." })
      .max(160, { message: "Sender office is too long." }),
    deliveredBy: optionalTrimmedString(160, "Delivered by is too long."),
    deliveryMethod: z.enum(deliveryMethodValues, {
      message: "Select a valid delivery method.",
    }),
    deliveryMethodOther: optionalTrimmedString(
      160,
      "Delivery method detail is too long.",
    ),
    receivedAt: requiredDateString("Received date and time is required."),
    priority: z
      .enum(correspondencePriorityValues, {
        message: "Select a valid priority.",
      })
      .default(CorrespondencePriority.NORMAL),
    confidentiality: z
      .enum(correspondenceConfidentialityValues, {
        message: "Select a valid confidentiality level.",
      })
      .default(CorrespondenceConfidentiality.INTERNAL),
  })
  .check((ctx) => {
    if (
      ctx.value.deliveryMethod === DeliveryMethod.OTHER &&
      !ctx.value.deliveryMethodOther
    ) {
      ctx.issues.push({
        code: "custom",
        message: "Specify the delivery method.",
        path: ["deliveryMethodOther"],
        input: ctx.value.deliveryMethodOther,
      });
    }

    if (ctx.value.sourceType === "INTERNAL" && !ctx.value.sourceDepartmentId) {
      ctx.issues.push({
        code: "custom",
        message: "Select the internal source department.",
        path: ["sourceDepartmentId"],
        input: ctx.value.sourceDepartmentId,
      });
    }
  });

export const correspondenceUpdateSchema = z.object({
  correspondenceId: z
    .string()
    .trim()
    .cuid({ message: "Invalid correspondence identifier." }),
  referenceNumber: z
    .string()
    .trim()
    .min(1, { message: "Reference number is required." })
    .max(120, { message: "Reference number is too long." })
    .transform(normalizeReferenceNumber),
  type: z.enum(correspondenceTypeValues, {
    message: "Select a valid correspondence type.",
  }),
  subject: z
    .string()
    .trim()
    .min(2, { message: "Subject is required." })
    .max(240, { message: "Subject is too long." }),
  description: optionalTrimmedString(4000, "Description is too long."),
  senderName: z
    .string()
    .trim()
    .min(2, { message: "Sender name is required." })
    .max(160, { message: "Sender name is too long." }),
  senderOffice: z
    .string()
    .trim()
    .min(2, { message: "Sender office is required." })
    .max(160, { message: "Sender office is too long." }),
  deliveredBy: optionalTrimmedString(160, "Delivered by is too long."),
  deliveryMethod: z.enum(deliveryMethodValues, {
    message: "Select a valid delivery method.",
  }),
  receivedAt: requiredDateString("Received date and time is required."),
  priority: z.enum(correspondencePriorityValues, {
    message: "Select a valid priority.",
  }),
  confidentiality: z.enum(correspondenceConfidentialityValues, {
    message: "Select a valid confidentiality level.",
  }),
});

export const correspondenceReviewSchema = z.object({
  correspondenceId: z
    .string()
    .trim()
    .cuid({ message: "Invalid correspondence identifier." }),
  instructions: z
    .string()
    .trim()
    .min(2, { message: "Instructions are required for review." })
    .max(4000, { message: "Instructions are too long." }),
  status: z
    .enum(reviewStatusValues, {
      message: "Review must keep the record under review.",
    })
    .default(CorrespondenceStatus.UNDER_REVIEW),
});

const correspondenceAssignTargetSchema = z.object({
  departmentId: requiredRecordId("Select a valid department."),
  userId: optionalRecordId(),
});

export const correspondenceAssignSchema = z
  .object({
    correspondenceId: requiredRecordId("Invalid correspondence identifier."),
    targets: z
      .array(correspondenceAssignTargetSchema)
      .min(1, { message: "Select at least one destination department." }),
    dueDate: requiredDateString(
      "Due date is required before dispatching correspondence.",
    ),
    status: z
      .enum(assignStatusValues, {
        message: "Assignment must dispatch the record.",
      })
      .default(CorrespondenceStatus.DISPATCHED),
  })
  .check((ctx) => {
    const seen = new Set<string>();
    for (const target of ctx.value.targets) {
      if (seen.has(target.departmentId)) {
        ctx.issues.push({
          code: "custom",
          message: "Each department can only be selected once.",
          path: ["targets"],
          input: target.departmentId,
        });
      }
      seen.add(target.departmentId);
    }
  });

export const correspondenceDispatchSchema = z.object({
  correspondenceId: z
    .string()
    .trim()
    .cuid({ message: "Invalid correspondence identifier." }),
  departmentId: requiredRecordId("Select a valid department."),
  userId: optionalRecordId(),
  dispatchDate: requiredDateString("Dispatch date and time is required."),
  note: optionalTrimmedString(4000, "Dispatch note is too long."),
  status: z
    .enum(dispatchStatusValues, {
      message: "Dispatch creation must start with a sent status.",
    })
    .default(DispatchStatus.SENT),
});

export const correspondenceDispatchAcknowledgeSchema = z.object({
  dispatchId: z
    .string()
    .trim()
    .cuid({ message: "Invalid dispatch identifier." }),
  acknowledgedAt: requiredDateString(
    "Acknowledgement date and time is required.",
  ),
  status: z
    .enum(acknowledgeStatusValues, {
      message: "Acknowledgement must move the dispatch into an active state.",
    })
    .default(DispatchStatus.ACKNOWLEDGED),
});

export const correspondenceDispatchFeedbackSchema = z.object({
  dispatchId: z
    .string()
    .trim()
    .cuid({ message: "Invalid dispatch identifier." }),
  feedbackNote: z
    .string()
    .trim()
    .min(2, { message: "Feedback note is required." })
    .max(4000, { message: "Feedback note is too long." }),
  status: z
    .enum(feedbackStatusValues, {
      message: "Feedback receipt must mark the dispatch as feedback received.",
    })
    .default(DispatchStatus.FEEDBACK_RECEIVED),
});

export const correspondenceCloseSchema = z.object({
  correspondenceId: z
    .string()
    .trim()
    .cuid({ message: "Invalid correspondence identifier." }),
  closedAt: requiredDateString("Closure date and time is required."),
  status: z.enum(closeStatusValues, {
    message: "Close actions must set the record to closed or cancelled.",
  }),
  closureNote: z
    .string()
    .trim()
    .min(2, { message: "Record the closure or cancellation reason." })
    .max(4000, { message: "Closure note is too long." }),
});

export const correspondenceReopenSchema = z.object({
  correspondenceId: z
    .string()
    .trim()
    .cuid({ message: "Invalid correspondence identifier." }),
  reopenedAt: requiredDateString("Reopen date and time is required."),
  status: z
    .enum(reopenStatusValues, {
      message: "Reopen actions must return the record to review.",
    })
    .default(CorrespondenceStatus.UNDER_REVIEW),
  justification: z
    .string()
    .trim()
    .min(2, { message: "Reopen justification is required." })
    .max(4000, { message: "Reopen justification is too long." }),
});

export const reviewableCorrespondenceStatuses = [
  CorrespondenceStatus.NEW,
  CorrespondenceStatus.UNDER_REVIEW,
] as const;

export const assignableCorrespondenceStatuses = [
  CorrespondenceStatus.UNDER_REVIEW,
] as const;

export type CorrespondenceCreateValues = z.infer<
  typeof correspondenceCreateSchema
>;
export type CorrespondenceUpdateValues = z.infer<
  typeof correspondenceUpdateSchema
>;
export type CorrespondenceReviewValues = z.infer<
  typeof correspondenceReviewSchema
>;
export type CorrespondenceAssignValues = z.infer<
  typeof correspondenceAssignSchema
>;
export type CorrespondenceDispatchValues = z.infer<
  typeof correspondenceDispatchSchema
>;
export type CorrespondenceDispatchAcknowledgeValues = z.infer<
  typeof correspondenceDispatchAcknowledgeSchema
>;
export type CorrespondenceDispatchFeedbackValues = z.infer<
  typeof correspondenceDispatchFeedbackSchema
>;
export type CorrespondenceCloseValues = z.infer<
  typeof correspondenceCloseSchema
>;
export type CorrespondenceReopenValues = z.infer<
  typeof correspondenceReopenSchema
>;

export type CorrespondenceCreateFormValues = {
  type: string;
  sourceType: string;
  sourceDepartmentId: string;
  subject: string;
  description: string;
  senderName: string;
  senderOffice: string;
  deliveredBy: string;
  deliveryMethod: string;
  deliveryMethodOther: string;
  receivedAt: string;
  priority: string;
  confidentiality: string;
};

export type CorrespondenceUpdateFormValues = {
  correspondenceId: string;
  referenceNumber: string;
  type: string;
  subject: string;
  description: string;
  senderName: string;
  senderOffice: string;
  deliveredBy: string;
  deliveryMethod: string;
  receivedAt: string;
  priority: string;
  confidentiality: string;
};

export type CorrespondenceReviewFormValues = {
  correspondenceId: string;
  instructions: string;
  status: string;
};

export type CorrespondenceAssignTargetFormValue = {
  departmentId: string;
  userId: string | undefined;
};

export type CorrespondenceAssignFormValues = {
  correspondenceId: string;
  targets: CorrespondenceAssignTargetFormValue[];
  dueDate: string;
  status: string;
};

export type CorrespondenceAttachmentFormValues = {
  correspondenceId: string;
  fileName: string;
};

export type CorrespondenceDispatchFormValues = {
  correspondenceId: string;
  departmentId: string;
  userId: string;
  dispatchDate: string;
  note: string;
  status: string;
};

export type CorrespondenceDispatchAcknowledgeFormValues = {
  dispatchId: string;
  acknowledgedAt: string;
  status: string;
};

export type CorrespondenceDispatchFeedbackFormValues = {
  dispatchId: string;
  feedbackNote: string;
  status: string;
};

export type CorrespondenceCloseFormValues = {
  correspondenceId: string;
  closedAt: string;
  status: string;
  closureNote: string;
};

export type CorrespondenceReopenFormValues = {
  correspondenceId: string;
  reopenedAt: string;
  status: string;
  justification: string;
};

export type CorrespondenceCreateActionState = CorrespondenceActionState<
  CorrespondenceCreateFormValues,
  {
    correspondenceId: string;
    organizationId: string;
    referenceNumber: string;
    senderOffice: string;
  }
>;

export type CorrespondenceUpdateActionState = CorrespondenceActionState<
  CorrespondenceUpdateFormValues,
  { correspondenceId: string; organizationId: string }
>;

export type CorrespondenceReviewActionState = CorrespondenceActionState<
  CorrespondenceReviewFormValues,
  { correspondenceId: string; organizationId: string }
>;

export type CorrespondenceAssignActionState = CorrespondenceActionState<
  CorrespondenceAssignFormValues,
  { correspondenceId: string; organizationId: string }
>;

export type CorrespondenceDispatchActionState = CorrespondenceActionState<
  CorrespondenceDispatchFormValues,
  { correspondenceId: string; dispatchId: string; organizationId: string }
>;

export type CorrespondenceDispatchAcknowledgeActionState =
  CorrespondenceActionState<
    CorrespondenceDispatchAcknowledgeFormValues,
    { correspondenceId: string; dispatchId: string; organizationId: string }
  >;

export type CorrespondenceDispatchFeedbackActionState =
  CorrespondenceActionState<
    CorrespondenceDispatchFeedbackFormValues,
    { correspondenceId: string; dispatchId: string; organizationId: string }
  >;

export type CorrespondenceCloseActionState = CorrespondenceActionState<
  CorrespondenceCloseFormValues,
  { correspondenceId: string; organizationId: string }
>;

export type CorrespondenceReopenActionState = CorrespondenceActionState<
  CorrespondenceReopenFormValues,
  { correspondenceId: string; organizationId: string }
>;

export type CorrespondenceAttachmentActionState = CorrespondenceActionState<
  CorrespondenceAttachmentFormValues,
  { correspondenceId: string; attachmentId: string; organizationId: string }
>;

export function getCorrespondenceFieldErrors(
  error: z.ZodError,
): Record<string, string[] | undefined> {
  return z.flattenError(error).fieldErrors;
}

function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export function getCorrespondenceCreateValuesFromFormData(
  formData: FormData,
): CorrespondenceCreateFormValues {
  return {
    type: getString(formData, "type"),
    subject: getString(formData, "subject").trim(),
    sourceType: getString(formData, "sourceType"),
    sourceDepartmentId: getString(formData, "sourceDepartmentId").trim(),
    description: getString(formData, "description"),
    senderName: getString(formData, "senderName").trim(),
    senderOffice: getString(formData, "senderOffice").trim(),
    deliveredBy: getString(formData, "deliveredBy"),
    deliveryMethod: getString(formData, "deliveryMethod"),
    deliveryMethodOther: getString(formData, "deliveryMethodOther").trim(),
    receivedAt: getString(formData, "receivedAt"),
    priority: getString(formData, "priority"),
    confidentiality: getString(formData, "confidentiality"),
  };
}

export function getCorrespondenceUpdateValuesFromFormData(
  formData: FormData,
): CorrespondenceUpdateFormValues {
  return {
    correspondenceId: getString(formData, "correspondenceId").trim(),
    referenceNumber: getString(formData, "referenceNumber").trim(),
    type: getString(formData, "type"),
    subject: getString(formData, "subject").trim(),
    description: getString(formData, "description"),
    senderName: getString(formData, "senderName").trim(),
    senderOffice: getString(formData, "senderOffice").trim(),
    deliveredBy: getString(formData, "deliveredBy"),
    deliveryMethod: getString(formData, "deliveryMethod"),
    receivedAt: getString(formData, "receivedAt"),
    priority: getString(formData, "priority"),
    confidentiality: getString(formData, "confidentiality"),
  };
}

export function getCorrespondenceReviewValuesFromFormData(
  formData: FormData,
): CorrespondenceReviewFormValues {
  return {
    correspondenceId: getString(formData, "correspondenceId").trim(),
    instructions: getString(formData, "instructions"),
    status: getString(formData, "status"),
  };
}

export function getCorrespondenceAssignValuesFromFormData(
  formData: FormData,
): CorrespondenceAssignFormValues {
  const departmentIds = formData
    .getAll("assignedToDepartmentIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const targets = departmentIds.map((departmentId) => ({
    departmentId,
    userId: getString(formData, `assignedToUserId__${departmentId}`).trim(),
  }));

  return {
    correspondenceId: getString(formData, "correspondenceId").trim(),
    targets,
    dueDate: getString(formData, "dueDate"),
    status: getString(formData, "status"),
  };
}

export function getCorrespondenceDispatchValuesFromFormData(
  formData: FormData,
): CorrespondenceDispatchFormValues {
  return {
    correspondenceId: getString(formData, "correspondenceId").trim(),
    departmentId: getString(formData, "departmentId").trim(),
    userId: getString(formData, "userId").trim(),
    dispatchDate: getString(formData, "dispatchDate"),
    note: getString(formData, "note"),
    status: getString(formData, "status"),
  };
}

export function getCorrespondenceDispatchAcknowledgeValuesFromFormData(
  formData: FormData,
): CorrespondenceDispatchAcknowledgeFormValues {
  return {
    dispatchId: getString(formData, "dispatchId").trim(),
    acknowledgedAt: getString(formData, "acknowledgedAt"),
    status: getString(formData, "status"),
  };
}

export function getCorrespondenceDispatchFeedbackValuesFromFormData(
  formData: FormData,
): CorrespondenceDispatchFeedbackFormValues {
  return {
    dispatchId: getString(formData, "dispatchId").trim(),
    feedbackNote: getString(formData, "feedbackNote"),
    status: getString(formData, "status"),
  };
}

export function getCorrespondenceCloseValuesFromFormData(
  formData: FormData,
): CorrespondenceCloseFormValues {
  return {
    correspondenceId: getString(formData, "correspondenceId").trim(),
    closedAt: getString(formData, "closedAt"),
    status: getString(formData, "status"),
    closureNote: getString(formData, "closureNote"),
  };
}

export function getCorrespondenceReopenValuesFromFormData(
  formData: FormData,
): CorrespondenceReopenFormValues {
  return {
    correspondenceId: getString(formData, "correspondenceId").trim(),
    reopenedAt: getString(formData, "reopenedAt"),
    status: getString(formData, "status"),
    justification: getString(formData, "justification"),
  };
}

export function getCorrespondenceAttachmentValuesFromFormData(
  formData: FormData,
): CorrespondenceAttachmentFormValues {
  const file = formData.get("file");

  return {
    correspondenceId: getString(formData, "correspondenceId").trim(),
    fileName: file instanceof File ? file.name : "",
  };
}

export const initialCorrespondenceCreateState: CorrespondenceCreateActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      type: CorrespondenceType.INCOMING,
      subject: "",
      sourceType: "INTERNAL",
      sourceDepartmentId: "",
      description: "",
      senderName: "",
      senderOffice: "",
      deliveredBy: "",
      deliveryMethod: DeliveryMethod.HAND,
      deliveryMethodOther: "",
      receivedAt: "",
      priority: CorrespondencePriority.NORMAL,
      confidentiality: CorrespondenceConfidentiality.INTERNAL,
    },
  };

export const initialCorrespondenceUpdateState: CorrespondenceUpdateActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
  };

export const initialCorrespondenceReviewState: CorrespondenceReviewActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      correspondenceId: "",
      instructions: "",
      status: CorrespondenceStatus.UNDER_REVIEW,
    },
  };

export const initialCorrespondenceAssignState: CorrespondenceAssignActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      correspondenceId: "",
      targets: [],
      dueDate: "",
      status: CorrespondenceStatus.DISPATCHED,
    },
  };

export const initialCorrespondenceDispatchState: CorrespondenceDispatchActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      correspondenceId: "",
      departmentId: "",
      userId: "",
      dispatchDate: "",
      note: "",
      status: DispatchStatus.SENT,
    },
  };

export const initialCorrespondenceDispatchAcknowledgeState: CorrespondenceDispatchAcknowledgeActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      dispatchId: "",
      acknowledgedAt: "",
      status: DispatchStatus.ACKNOWLEDGED,
    },
  };

export const initialCorrespondenceDispatchFeedbackState: CorrespondenceDispatchFeedbackActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      dispatchId: "",
      feedbackNote: "",
      status: DispatchStatus.FEEDBACK_RECEIVED,
    },
  };

export const initialCorrespondenceAttachmentState: CorrespondenceAttachmentActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      correspondenceId: "",
      fileName: "",
    },
  };

export const initialCorrespondenceCloseState: CorrespondenceCloseActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    correspondenceId: "",
    closedAt: "",
    status: CorrespondenceStatus.CLOSED,
    closureNote: "",
  },
};

export const initialCorrespondenceReopenState: CorrespondenceReopenActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      correspondenceId: "",
      reopenedAt: "",
      status: CorrespondenceStatus.UNDER_REVIEW,
      justification: "",
    },
  };
