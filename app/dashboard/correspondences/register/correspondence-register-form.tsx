"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import {
  Building2,
  Check,
  ChevronsUpDown,
  FileInput,
  Globe2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { createCorrespondenceAction } from "@/features/correspondence/lib/create-correspondence";
import { initialCorrespondenceCreateState } from "@/features/correspondence/lib/correspondence.shared";

const DELIVERY_METHOD_OPTIONS = [
  { value: "HAND", label: "Hand delivery" },
  { value: "EMAIL", label: "Email" },
  { value: "COURIER", label: "Courier" },
  { value: "POST", label: "Post" },
  { value: "INTERNAL_MAIL", label: "Internal mail" },
  { value: "PHONE", label: "Phone" },
  { value: "SYSTEM", label: "System" },
  { value: "OTHER", label: "Other" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENT", label: "Urgent" },
  { value: "VERY_URGENT", label: "Very urgent" },
  { value: "CRITICAL", label: "Critical" },
] as const;

const CONFIDENTIALITY_OPTIONS = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "CONFIDENTIAL", label: "Confidential" },
  { value: "HIGHLY_CONFIDENTIAL", label: "Highly confidential" },
] as const;

type SourceDepartmentOption = {
  id: string;
  label: string;
};

type CorrespondenceRegisterFormProps = {
  organizationName: string;
  senderOfficeSuggestions: string[];
  sourceDepartmentOptions: SourceDepartmentOption[];
  mode?: "card" | "dialog";
  onSuccess?: () => void;
};

function RegisterCorrespondenceSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      className="w-full sm:w-auto"
      size="lg"
      type="submit"
      disabled={pending}
    >
      {pending ? "Registering..." : "Register correspondence"}
    </Button>
  );
}

function SenderOfficeCombobox({
  defaultValue,
  suggestions,
  error,
}: {
  defaultValue: string;
  suggestions: string[];
  error?: string;
}) {
  const senderOfficeInputRef = useRef<HTMLInputElement>(null);
  const senderOfficeListId = useId();
  const [isSenderOfficeMenuOpen, setIsSenderOfficeMenuOpen] = useState(false);
  const [senderOfficeQuery, setSenderOfficeQuery] = useState(defaultValue);

  const normalizedSenderOfficeQuery = senderOfficeQuery.trim().toLowerCase();
  const filteredSenderOfficeSuggestions = suggestions.filter(
    (office, index, offices) => {
      const normalizedOffice = office.trim().toLowerCase();
      const matchesQuery =
        normalizedSenderOfficeQuery.length === 0 ||
        normalizedOffice.includes(normalizedSenderOfficeQuery);

      return (
        matchesQuery &&
        offices.findIndex(
          (candidate) => candidate.trim().toLowerCase() === normalizedOffice,
        ) === index
      );
    },
  );
  const hasExactSenderOfficeMatch = suggestions.some(
    (office) =>
      office.trim().toLowerCase() === normalizedSenderOfficeQuery &&
      normalizedSenderOfficeQuery.length > 0,
  );

  function selectSenderOffice(office: string) {
    setSenderOfficeQuery(office);
    setIsSenderOfficeMenuOpen(false);
    senderOfficeInputRef.current?.focus();
  }

  return (
    <Field>
      <FieldLabel htmlFor="correspondence-sender-office" required>
        Sender office
      </FieldLabel>
      <div className="relative">
        <Input
          ref={senderOfficeInputRef}
          id="correspondence-sender-office"
          name="senderOffice"
          value={senderOfficeQuery}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={senderOfficeListId}
          aria-expanded={isSenderOfficeMenuOpen}
          onChange={(event) => {
            setSenderOfficeQuery(event.target.value);
            setIsSenderOfficeMenuOpen(true);
          }}
          onFocus={() => {
            setIsSenderOfficeMenuOpen(true);
          }}
          onBlur={() => {
            window.setTimeout(() => {
              setIsSenderOfficeMenuOpen(false);
            }, 120);
          }}
          placeholder="County Department of Public Service"
          className="pr-11"
        />
        <button
          type="button"
          aria-label="Toggle sender office suggestions"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600"
          onMouseDown={(event) => {
            event.preventDefault();
          }}
          onClick={() => {
            senderOfficeInputRef.current?.focus();
            setIsSenderOfficeMenuOpen((open) => !open);
          }}
        >
          <ChevronsUpDown className="h-4 w-4" />
        </button>

        {isSenderOfficeMenuOpen &&
        (filteredSenderOfficeSuggestions.length > 0 ||
          normalizedSenderOfficeQuery.length > 0) ? (
          <div
            id={senderOfficeListId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
          >
            <div className="px-2 pb-2 pt-1 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Previous sender offices
            </div>

            {filteredSenderOfficeSuggestions.length > 0 ? (
              <div className="space-y-1">
                {filteredSenderOfficeSuggestions.map((office) => {
                  const isSelected =
                    office.trim().toLowerCase() === normalizedSenderOfficeQuery;

                  return (
                    <button
                      key={office}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onClick={() => {
                        selectSenderOffice(office);
                      }}
                    >
                      <span className="truncate">{office}</span>
                      {isSelected ? (
                        <Check className="ml-3 h-4 w-4 flex-none text-[#1868a6]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {normalizedSenderOfficeQuery.length > 0 &&
            !hasExactSenderOfficeMatch ? (
              <button
                type="button"
                className="mt-1 flex w-full items-center justify-between rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  selectSenderOffice(senderOfficeQuery);
                }}
              >
                <span className="truncate">
                  Use &quot;{senderOfficeQuery}&quot;
                </span>
                <span className="ml-3 flex-none text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                  New
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

export function CorrespondenceRegisterForm({
  organizationName,
  senderOfficeSuggestions,
  sourceDepartmentOptions,
  mode = "card",
  onSuccess,
}: CorrespondenceRegisterFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createCorrespondenceAction,
    initialCorrespondenceCreateState,
  );

  const values = state.values ?? initialCorrespondenceCreateState.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};

  const priorityInputRef = useRef<HTMLInputElement>(null);
  const confidentialityInputRef = useRef<HTMLInputElement>(null);
  const [deliveryMethod, setDeliveryMethod] = useState(
    values.deliveryMethod || "HAND",
  );
  const defaultSourceType =
    values.sourceType === "EXTERNAL" || sourceDepartmentOptions.length === 0
      ? "EXTERNAL"
      : "INTERNAL";
  const [sourceType, setSourceType] = useState(defaultSourceType);
  const [sourceDepartmentId, setSourceDepartmentId] = useState(
    values.sourceDepartmentId || sourceDepartmentOptions[0]?.id || "",
  );
  const selectedSourceDepartment =
    sourceDepartmentOptions.find(
      (department) => department.id === sourceDepartmentId,
    ) ?? null;
  const internalSenderOffice = selectedSourceDepartment?.label ?? "";

  const effectiveSenderOfficeSuggestions = state.ok
    ? Array.from(
        new Set(
          [state.data?.senderOffice ?? "", ...senderOfficeSuggestions].filter(
            (office) => office.trim().length > 0,
          ),
        ),
      )
    : senderOfficeSuggestions;

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router, state.ok]);

  const formFields = (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="type" value="INCOMING" />

      <Field>
        <FieldLabel htmlFor="correspondence-received-at" required>
          Physical received date and time
        </FieldLabel>
        <Input
          id="correspondence-received-at"
          name="receivedAt"
          type="datetime-local"
          defaultValue={values.receivedAt ?? ""}
        />
        <p className="text-xs leading-5 text-slate-500">
          Use the time the item physically arrived. Workflow actions later use
          server time automatically.
        </p>
        <FieldError>{fieldErrors.receivedAt?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel required>Source type</FieldLabel>
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
              <Globe2 className="h-4 w-4" /> External sender
            </span>
            <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
              Use free text for outside offices, citizens, suppliers, or
              agencies.
            </span>
          </button>
        </div>
      </Field>

      {sourceType === "INTERNAL" ? (
        <Field>
          <FieldLabel htmlFor="correspondence-source-department" required>
            Internal source department
          </FieldLabel>
          <input
            type="hidden"
            name="sourceDepartmentId"
            value={sourceDepartmentId}
            readOnly
          />
          <input
            type="hidden"
            name="senderOffice"
            value={internalSenderOffice}
            readOnly
          />
          <Select
            value={sourceDepartmentId}
            onValueChange={setSourceDepartmentId}
          >
            <SelectTrigger
              id="correspondence-source-department"
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
          <p className="text-xs leading-5 text-slate-500">
            This makes routing clues cleaner because the system knows the county
            sector.
          </p>
          <FieldError>
            {fieldErrors.sourceDepartmentId?.[0] ||
              fieldErrors.senderOffice?.[0]}
          </FieldError>
        </Field>
      ) : (
        <>
          <input type="hidden" name="sourceDepartmentId" value="" readOnly />
          <SenderOfficeCombobox
            key={values.senderOffice ?? "__empty__"}
            defaultValue={values.senderOffice ?? ""}
            suggestions={effectiveSenderOfficeSuggestions}
            error={fieldErrors.senderOffice?.[0]}
          />
        </>
      )}

      <Field>
        <FieldLabel htmlFor="correspondence-subject" required>
          Subject
        </FieldLabel>
        <Input
          id="correspondence-subject"
          name="subject"
          defaultValue={values.subject ?? ""}
          placeholder="Deployment"
        />
        <FieldError>{fieldErrors.subject?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="correspondence-description">
          Description
        </FieldLabel>
        <Textarea
          id="correspondence-description"
          name="description"
          defaultValue={values.description ?? ""}
          placeholder="Additional intake context, notes, or summary."
          rows={5}
        />
        <FieldError>{fieldErrors.description?.[0]}</FieldError>
      </Field>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="correspondence-sender-name" required>
            Sender name
          </FieldLabel>
          <Input
            id="correspondence-sender-name"
            name="senderName"
            defaultValue={values.senderName ?? ""}
            placeholder="CO PSM&ICT"
          />
          <FieldError>{fieldErrors.senderName?.[0]}</FieldError>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="correspondence-delivered-by">
          Delivered by
        </FieldLabel>
        <Input
          id="correspondence-delivered-by"
          name="deliveredBy"
          defaultValue={values.deliveredBy ?? ""}
          placeholder="Felix Otiato"
        />
        <FieldError>{fieldErrors.deliveredBy?.[0]}</FieldError>
      </Field>

      <div className="grid gap-5 xl:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="correspondence-delivery-method" required>
            Delivery method
          </FieldLabel>
          <input
            type="hidden"
            name="deliveryMethod"
            value={deliveryMethod}
            readOnly
          />
          <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
            <SelectTrigger
              id="correspondence-delivery-method"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select delivery method" />
            </SelectTrigger>
            <SelectContent>
              {DELIVERY_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.deliveryMethod?.[0]}</FieldError>
        </Field>

        {deliveryMethod === "OTHER" ? (
          <Field>
            <FieldLabel htmlFor="correspondence-delivery-method-other" required>
              Specify delivery method
            </FieldLabel>
            <Input
              id="correspondence-delivery-method-other"
              name="deliveryMethodOther"
              defaultValue={values.deliveryMethodOther ?? ""}
              placeholder="e.g. WhatsApp, Fax"
            />
            <FieldError>{fieldErrors.deliveryMethodOther?.[0]}</FieldError>
          </Field>
        ) : null}

        <Field>
          <FieldLabel htmlFor="correspondence-priority">Priority</FieldLabel>
          <input
            ref={priorityInputRef}
            type="hidden"
            name="priority"
            defaultValue={values.priority ?? "NORMAL"}
          />
          <Select
            key={`priority-${values.priority ?? "NORMAL"}`}
            defaultValue={values.priority ?? "NORMAL"}
            onValueChange={(value) => {
              if (priorityInputRef.current) {
                priorityInputRef.current.value = value;
              }
            }}
          >
            <SelectTrigger
              id="correspondence-priority"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.priority?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="correspondence-confidentiality">
            Confidentiality
          </FieldLabel>
          <input
            ref={confidentialityInputRef}
            type="hidden"
            name="confidentiality"
            defaultValue={values.confidentiality ?? "INTERNAL"}
          />
          <Select
            key={`confidentiality-${values.confidentiality ?? "INTERNAL"}`}
            defaultValue={values.confidentiality ?? "INTERNAL"}
            onValueChange={(value) => {
              if (confidentialityInputRef.current) {
                confidentialityInputRef.current.value = value;
              }
            }}
          >
            <SelectTrigger
              id="correspondence-confidentiality"
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select confidentiality" />
            </SelectTrigger>
            <SelectContent>
              {CONFIDENTIALITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.confidentiality?.[0]}</FieldError>
        </Field>
      </div>

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

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Assigns a reference number and logs the first audit/movement entry.
        </p>
        <RegisterCorrespondenceSubmitButton />
      </div>
    </form>
  );

  if (mode === "dialog") {
    return formFields;
  }

  const formContent = (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-6">
        <CardTitle className="text-[1.25rem] tracking-[-0.03em] text-slate-950">
          Correspondence registration form
        </CardTitle>
      </CardHeader>

      <CardContent className="px-6 pb-6">{formFields}</CardContent>
    </Card>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="grid gap-6 rounded-[24px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_48px_rgba(15,23,42,0.06)] xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Correspondence intake
          </div>
          <div className="space-y-2">
            <h1 className="text-[1.85rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
              Register incoming correspondence
            </h1>
            <p className="max-w-3xl text-sm text-slate-600">
              Central-office registry intake for {organizationName}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Back to dashboard
            </Link>
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Intake rules
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
                  <FileInput className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Incoming only
                  </div>
                  <div className="text-sm leading-6 text-slate-600">
                    Outgoing authoring stays out of phase 1.
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    Initial status
                  </div>
                  <div className="text-sm leading-6 text-slate-600">
                    Every newly registered item starts as <strong>New</strong>.
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-950">
                    System reference
                  </div>
                  <div className="text-sm leading-6 text-slate-600">
                    The system assigns a unique county reference such as
                    <strong> VCG/OCS/2026/04/000123</strong> at registration
                    time.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {formContent}
    </div>
  );
}
