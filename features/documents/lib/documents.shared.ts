import { DocumentMedium, DocumentStatus } from "@prisma/client";
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

const documentCreateStatusValues = [
  DocumentStatus.RECEIVED,
  DocumentStatus.DRAFT,
  DocumentStatus.UNDER_REVIEW,
] as const;

const documentUpdateStatusValues = [
  DocumentStatus.RECEIVED,
  DocumentStatus.DRAFT,
  DocumentStatus.UNDER_REVIEW,
  DocumentStatus.DISPATCHED,
  DocumentStatus.PENDING_ACTION,
  DocumentStatus.RESPONDED,
] as const;

const documentMediumValues = [
  DocumentMedium.PHYSICAL,
  DocumentMedium.DIGITAL,
  DocumentMedium.HYBRID,
] as const;

export const documentSourceTypeValues = ["INTERNAL", "EXTERNAL"] as const;

export const documentCategoryCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Category name is required." })
    .max(120, { message: "Category name is too long." }),
  description: optionalTrimmedString(400, "Description is too long."),
});

export const documentCategoryUpdateSchema = documentCategoryCreateSchema.extend(
  {
    categoryId: z
      .string()
      .trim()
      .cuid({ message: "Invalid document category." }),
  },
);

export const documentCategoryDeleteSchema = z.object({
  categoryId: z.string().trim().cuid({ message: "Invalid document category." }),
});

export const documentCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, { message: "Document title is required." })
    .max(240, { message: "Document title is too long." }),
  description: optionalTrimmedString(4000, "Description is too long."),
  categoryId: optionalCuid("Select a valid category."),
  correspondenceId: optionalCuid("Select a valid correspondence."),
  sourceType: z
    .enum(documentSourceTypeValues, {
      message: "Select whether the origin is internal or external.",
    })
    .default("EXTERNAL"),
  sourceDepartmentId: optionalCuid("Select a valid source department."),
  originOffice: optionalTrimmedString(160, "Origin office is too long."),
  broughtBy: optionalTrimmedString(160, "Brought by is too long."),
  medium: z
    .enum(documentMediumValues, {
      message: "Select whether the document is physical, digital, or both.",
    })
    .default(DocumentMedium.PHYSICAL),
  currentHolderUserId: optionalCuid("Select a valid current holder."),
  currentLocation: optionalTrimmedString(160, "Current location is too long."),
  status: z
    .enum(documentCreateStatusValues, {
      message: "Select a valid initial document status.",
    })
    .default(DocumentStatus.RECEIVED),
});

export const documentArchiveSchema = z.object({
  documentId: z.string().trim().cuid({ message: "Invalid document record." }),
});

export const documentUpdateSchema = documentCreateSchema.extend({
  documentId: z.string().trim().cuid({ message: "Invalid document record." }),
  status: z
    .enum(documentUpdateStatusValues, {
      message: "Select a valid document status.",
    })
    .default(DocumentStatus.RECEIVED),
});

export const documentAttachmentSchema = z.object({
  documentId: z.string().trim().cuid({ message: "Invalid document record." }),
  fileName: z.string().trim().optional(),
});

export type DocumentCategoryCreateFormValues = {
  name: string;
  description: string;
};

export type DocumentCategoryUpdateFormValues =
  DocumentCategoryCreateFormValues & {
    categoryId: string;
  };

export type DocumentCategoryDeleteFormValues = {
  categoryId: string;
};

export type DocumentCreateFormValues = {
  title: string;
  description: string;
  categoryId: string;
  correspondenceId: string;
  sourceType: string;
  sourceDepartmentId: string;
  originOffice: string;
  broughtBy: string;
  medium: string;
  currentHolderUserId: string;
  currentLocation: string;
  status: string;
};

export type DocumentArchiveFormValues = {
  documentId: string;
};

export type DocumentUpdateFormValues = DocumentCreateFormValues & {
  documentId: string;
};

export type DocumentAttachmentFormValues = {
  documentId: string;
  fileName: string;
};

export type DocumentCategoryCreateActionState = CorrespondenceActionState<
  DocumentCategoryCreateFormValues,
  { categoryId: string; organizationId: string }
>;

export type DocumentCategoryUpdateActionState = CorrespondenceActionState<
  DocumentCategoryUpdateFormValues,
  { categoryId: string; organizationId: string }
>;

export type DocumentCategoryDeleteActionState = CorrespondenceActionState<
  DocumentCategoryDeleteFormValues,
  { categoryId: string; organizationId: string }
>;

export type DocumentCreateActionState = CorrespondenceActionState<
  DocumentCreateFormValues,
  { documentId: string; organizationId: string }
>;

export type DocumentArchiveActionState = CorrespondenceActionState<
  DocumentArchiveFormValues,
  { documentId: string; organizationId: string }
>;

export type DocumentUpdateActionState = CorrespondenceActionState<
  DocumentUpdateFormValues,
  { documentId: string; organizationId: string }
>;

export type DocumentAttachmentActionState = CorrespondenceActionState<
  DocumentAttachmentFormValues,
  { documentId: string; attachmentId: string; organizationId: string }
>;

export function getDocumentFieldErrors(
  error: z.ZodError,
): Record<string, string[] | undefined> {
  return z.flattenError(error).fieldErrors;
}

function getString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

export function getDocumentCategoryCreateValuesFromFormData(
  formData: FormData,
): DocumentCategoryCreateFormValues {
  return {
    name: getString(formData, "name").trim(),
    description: getString(formData, "description"),
  };
}

export function getDocumentCategoryUpdateValuesFromFormData(
  formData: FormData,
): DocumentCategoryUpdateFormValues {
  return {
    categoryId: getString(formData, "categoryId").trim(),
    ...getDocumentCategoryCreateValuesFromFormData(formData),
  };
}

export function getDocumentCategoryDeleteValuesFromFormData(
  formData: FormData,
): DocumentCategoryDeleteFormValues {
  return {
    categoryId: getString(formData, "categoryId").trim(),
  };
}

export function getDocumentCreateValuesFromFormData(
  formData: FormData,
): DocumentCreateFormValues {
  return {
    title: getString(formData, "title").trim(),
    description: getString(formData, "description"),
    categoryId: getString(formData, "categoryId").trim(),
    correspondenceId: getString(formData, "correspondenceId").trim(),
    sourceType: getString(formData, "sourceType").trim(),
    sourceDepartmentId: getString(formData, "sourceDepartmentId").trim(),
    originOffice: getString(formData, "originOffice"),
    broughtBy: getString(formData, "broughtBy"),
    medium: getString(formData, "medium"),
    currentHolderUserId: getString(formData, "currentHolderUserId").trim(),
    currentLocation: getString(formData, "currentLocation"),
    status: getString(formData, "status"),
  };
}

export function getDocumentArchiveValuesFromFormData(
  formData: FormData,
): DocumentArchiveFormValues {
  return {
    documentId: getString(formData, "documentId").trim(),
  };
}

export function getDocumentUpdateValuesFromFormData(
  formData: FormData,
): DocumentUpdateFormValues {
  return {
    documentId: getString(formData, "documentId").trim(),
    ...getDocumentCreateValuesFromFormData(formData),
  };
}

export function getDocumentAttachmentValuesFromFormData(
  formData: FormData,
): DocumentAttachmentFormValues {
  const file = formData.get("file");

  return {
    documentId: getString(formData, "documentId").trim(),
    fileName: file instanceof File ? file.name : "",
  };
}

export const initialDocumentCategoryCreateState: DocumentCategoryCreateActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      name: "",
      description: "",
    },
  };

export const initialDocumentCategoryUpdateState: DocumentCategoryUpdateActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      categoryId: "",
      name: "",
      description: "",
    },
  };

export const initialDocumentCategoryDeleteState: DocumentCategoryDeleteActionState =
  {
    ok: false,
    message: "",
    fieldErrors: {},
    values: {
      categoryId: "",
    },
  };

export const initialDocumentCreateState: DocumentCreateActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    title: "",
    description: "",
    categoryId: "",
    correspondenceId: "",
    sourceType: "EXTERNAL",
    sourceDepartmentId: "",
    originOffice: "",
    broughtBy: "",
    medium: DocumentMedium.PHYSICAL,
    currentHolderUserId: "",
    currentLocation: "",
    status: DocumentStatus.RECEIVED,
  },
};

export const initialDocumentArchiveState: DocumentArchiveActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    documentId: "",
  },
};

export const initialDocumentUpdateState: DocumentUpdateActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    documentId: "",
    title: "",
    description: "",
    categoryId: "",
    correspondenceId: "",
    sourceType: "EXTERNAL",
    sourceDepartmentId: "",
    originOffice: "",
    broughtBy: "",
    medium: DocumentMedium.PHYSICAL,
    currentHolderUserId: "",
    currentLocation: "",
    status: DocumentStatus.RECEIVED,
  },
};

export const initialDocumentAttachmentState: DocumentAttachmentActionState = {
  ok: false,
  message: "",
  fieldErrors: {},
  values: {
    documentId: "",
    fileName: "",
  },
};
