"use client";

import { DocumentMedium, DocumentStatus } from "@prisma/client";
import { Building2, Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createDocumentAction } from "@/features/documents/lib/create-document";
import { initialDocumentCreateState } from "@/features/documents/lib/documents.shared";

const DOCUMENT_STATUS_OPTIONS = [
  { value: DocumentStatus.RECEIVED, label: "Received" },
  { value: DocumentStatus.DRAFT, label: "Draft" },
  { value: DocumentStatus.UNDER_REVIEW, label: "Under review" },
] as const;

const DOCUMENT_MEDIUM_OPTIONS = [
  { value: DocumentMedium.PHYSICAL, label: "Physical file" },
  { value: DocumentMedium.DIGITAL, label: "Digital file" },
  { value: DocumentMedium.HYBRID, label: "Physical + digital" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Creating..." : "Create document"}
    </Button>
  );
}

export function CreateDocumentForm({
  categories,
  correspondences,
  holders,
  sourceDepartmentOptions,
  mode = "card",
  onSuccess,
}: {
  categories: { id: string; name: string }[];
  correspondences: { id: string; referenceNumber: string; subject: string }[];
  holders: { id: string; label: string }[];
  sourceDepartmentOptions: { id: string; label: string }[];
  mode?: "card" | "dialog";
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createDocumentAction,
    initialDocumentCreateState,
  );
  const values = state.values ?? initialDocumentCreateState.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};

  const categoryInputRef = useRef<HTMLInputElement>(null);
  const correspondenceInputRef = useRef<HTMLInputElement>(null);
  const holderInputRef = useRef<HTMLInputElement>(null);
  const mediumInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);

  const [sourceType, setSourceType] = useState(
    values.sourceType === "INTERNAL" && sourceDepartmentOptions.length > 0
      ? "INTERNAL"
      : "EXTERNAL",
  );
  const [sourceDepartmentId, setSourceDepartmentId] = useState(
    values.sourceDepartmentId || sourceDepartmentOptions[0]?.id || "",
  );

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router, state.ok]);

  const formContent = (
    <form action={formAction} className="space-y-5">
      <Field>
        <FieldLabel htmlFor="document-title" required>
          Title
        </FieldLabel>
        <Input
          id="document-title"
          name="title"
          defaultValue={values.title ?? ""}
          placeholder="Registry file for ward infrastructure submissions"
        />
        <p className="mt-2 text-xs text-slate-500">
          The document reference number is generated automatically when the
          record is created.
        </p>
        <FieldError>{fieldErrors.title?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="document-description">Description</FieldLabel>
        <Textarea
          id="document-description"
          name="description"
          defaultValue={values.description ?? ""}
          rows={4}
          placeholder="Capture the purpose, context, or content summary."
        />
        <FieldError>{fieldErrors.description?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Origin</FieldLabel>
        <input type="hidden" name="sourceType" value={sourceType} readOnly />
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={sourceDepartmentOptions.length === 0}
            onClick={() => setSourceType("INTERNAL")}
            className={
              sourceType === "INTERNAL"
                ? "rounded-2xl border border-[#1868a6] bg-[#e6f1f8] px-4 py-3 text-left text-sm font-semibold text-[#124f7d]"
                : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Internal county office
            </span>
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
              Pick an executing department from the county structure.
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSourceType("EXTERNAL")}
            className={
              sourceType === "EXTERNAL"
                ? "rounded-2xl border border-[#0f8a4b] bg-[#f0fbf5] px-4 py-3 text-left text-sm font-semibold text-[#0f6b3a]"
                : "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
            }
          >
            <span className="flex items-center gap-2">
              <Globe2 className="h-4 w-4" /> External source
            </span>
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
              Use free text for outside offices, citizens, suppliers, or
              agencies.
            </span>
          </button>
        </div>
      </Field>

      <div className="grid gap-5 lg:grid-cols-2">
        {sourceType === "INTERNAL" ? (
          <Field>
            <FieldLabel htmlFor="document-source-department">
              Internal source department
            </FieldLabel>
            <input
              type="hidden"
              name="sourceDepartmentId"
              value={sourceDepartmentId}
              readOnly
            />
            <Select
              value={sourceDepartmentId}
              onValueChange={setSourceDepartmentId}
            >
              <SelectTrigger
                id="document-source-department"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select executing department" />
              </SelectTrigger>
              <SelectContent>
                {sourceDepartmentOptions.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.sourceDepartmentId?.[0]}</FieldError>
          </Field>
        ) : (
          <Field>
            <FieldLabel htmlFor="document-origin-office">
              Origin office
            </FieldLabel>
            <input type="hidden" name="sourceDepartmentId" value="" readOnly />
            <Input
              id="document-origin-office"
              name="originOffice"
              defaultValue={values.originOffice ?? ""}
              placeholder="County Department of Finance"
            />
            <FieldError>{fieldErrors.originOffice?.[0]}</FieldError>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="document-brought-by">Brought by</FieldLabel>
          <Input
            id="document-brought-by"
            name="broughtBy"
            defaultValue={values.broughtBy ?? ""}
            placeholder="Messenger or receiving contact"
          />
          <FieldError>{fieldErrors.broughtBy?.[0]}</FieldError>
        </Field>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="document-category">Category</FieldLabel>
          <input
            ref={categoryInputRef}
            type="hidden"
            name="categoryId"
            defaultValue={values.categoryId ?? ""}
          />
          <Select
            key={`document-category-${values.categoryId ?? "__empty__"}`}
            defaultValue={values.categoryId || "__none__"}
            onValueChange={(value) => {
              if (categoryInputRef.current) {
                categoryInputRef.current.value =
                  value === "__none__" ? "" : value;
              }
            }}
          >
            <SelectTrigger
              id="document-category"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No category</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.categoryId?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="document-status">Initial status</FieldLabel>
          <input
            ref={statusInputRef}
            type="hidden"
            name="status"
            defaultValue={values.status ?? DocumentStatus.RECEIVED}
          />
          <Select
            key={`document-status-${values.status ?? DocumentStatus.RECEIVED}`}
            defaultValue={values.status ?? DocumentStatus.RECEIVED}
            onValueChange={(value) => {
              if (statusInputRef.current) {
                statusInputRef.current.value = value;
              }
            }}
          >
            <SelectTrigger
              id="document-status"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select initial status" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.status?.[0]}</FieldError>
        </Field>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="document-medium">Document medium</FieldLabel>
          <input
            ref={mediumInputRef}
            type="hidden"
            name="medium"
            defaultValue={values.medium ?? DocumentMedium.PHYSICAL}
          />
          <Select
            key={`document-medium-${values.medium ?? DocumentMedium.PHYSICAL}`}
            defaultValue={values.medium ?? DocumentMedium.PHYSICAL}
            onValueChange={(value) => {
              if (mediumInputRef.current) {
                mediumInputRef.current.value = value;
              }
            }}
          >
            <SelectTrigger
              id="document-medium"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select document medium" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_MEDIUM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.medium?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="document-correspondence">
            Linked correspondence
          </FieldLabel>
          <input
            ref={correspondenceInputRef}
            type="hidden"
            name="correspondenceId"
            defaultValue={values.correspondenceId ?? ""}
          />
          <Select
            key={`document-correspondence-${values.correspondenceId ?? "__empty__"}`}
            defaultValue={values.correspondenceId || "__none__"}
            onValueChange={(value) => {
              if (correspondenceInputRef.current) {
                correspondenceInputRef.current.value =
                  value === "__none__" ? "" : value;
              }
            }}
          >
            <SelectTrigger
              id="document-correspondence"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select linked correspondence" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No linked correspondence</SelectItem>
              {correspondences.map((correspondence) => (
                <SelectItem key={correspondence.id} value={correspondence.id}>
                  {correspondence.referenceNumber} - {correspondence.subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.correspondenceId?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="document-current-holder">
            Current holder
          </FieldLabel>
          <input
            ref={holderInputRef}
            type="hidden"
            name="currentHolderUserId"
            defaultValue={values.currentHolderUserId ?? ""}
          />
          <Select
            key={`document-holder-${values.currentHolderUserId ?? "__empty__"}`}
            defaultValue={values.currentHolderUserId || "__none__"}
            onValueChange={(value) => {
              if (holderInputRef.current) {
                holderInputRef.current.value =
                  value === "__none__" ? "" : value;
              }
            }}
          >
            <SelectTrigger
              id="document-current-holder"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select current holder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No current holder</SelectItem>
              {holders.map((holder) => (
                <SelectItem key={holder.id} value={holder.id}>
                  {holder.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.currentHolderUserId?.[0]}</FieldError>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="document-current-location">
          Current location
        </FieldLabel>
        <Input
          id="document-current-location"
          name="currentLocation"
          defaultValue={values.currentLocation ?? ""}
          placeholder="Registry cabinet A / digital archive folder / office desk"
        />
        <FieldError>{fieldErrors.currentLocation?.[0]}</FieldError>
      </Field>

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              : "rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          }
        >
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );

  if (mode === "dialog") {
    return formContent;
  }

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-2 px-6 py-5">
        <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
          Create document
        </CardTitle>
        <CardDescription>
          Register a physical, digital, or hybrid document record and optionally
          link it to an existing correspondence item.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">{formContent}</CardContent>
    </Card>
  );
}
