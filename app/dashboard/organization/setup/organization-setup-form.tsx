"use client";

import { useActionState, useEffect, useRef } from "react";
import { OrganizationType } from "@prisma/client";
import { Building2 } from "lucide-react";
import { useFormStatus } from "react-dom";
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
import {
  initialCreateOrganizationState,
  slugifyOrganizationName,
} from "@/features/application/lib/organization-setup.shared";
import { createOrganizationAction } from "@/features/application/lib/organization-setup";

function SetupSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Creating organization..." : "Create organization"}
    </Button>
  );
}

type OrganizationSetupFormProps = {
  defaultName?: string;
  onCreated?: () => void;
};

export function OrganizationSetupForm({
  defaultName = "",
  onCreated,
}: OrganizationSetupFormProps) {
  const [state, formAction] = useActionState(createOrganizationAction, {
    ...initialCreateOrganizationState,
    values: {
      ...initialCreateOrganizationState.values,
      name: defaultName,
    },
  });

  useEffect(() => {
    if (state.ok) {
      onCreated?.();
    }
  }, [onCreated, state.ok]);

  const values = state.values ?? initialCreateOrganizationState.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};
  const typeInputRef = useRef<HTMLInputElement>(null);
  const slugInputRef = useRef<HTMLInputElement>(null);
  const resolvedName = values.name ?? defaultName;
  const resolvedSlug = values.slug ?? slugifyOrganizationName(resolvedName);

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-[1.25rem] tracking-[-0.03em] text-slate-950">
              Organization details
            </CardTitle>
            <p className="text-sm text-slate-600">
              Enter the organization name and type.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#1868a6]">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form
          key={`${resolvedName}:${resolvedSlug}:${values.type ?? OrganizationType.COUNTY}`}
          action={formAction}
          className="space-y-5"
        >
          <Field>
            <FieldLabel htmlFor="organization-name" required>
              Name
            </FieldLabel>
            <input
              ref={slugInputRef}
              type="hidden"
              name="slug"
              defaultValue={resolvedSlug}
            />
            <Input
              id="organization-name"
              name="name"
              defaultValue={resolvedName}
              onChange={(event) => {
                if (!slugInputRef.current) return;
                slugInputRef.current.value = slugifyOrganizationName(
                  event.target.value,
                );
              }}
              placeholder="County Government of Vihiga"
              autoComplete="organization"
            />
            <FieldError>{fieldErrors.name?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="organization-type" required>
              Type
            </FieldLabel>
            <input
              ref={typeInputRef}
              type="hidden"
              name="type"
              defaultValue={values.type ?? OrganizationType.COUNTY}
            />
            <Select
              key={`organization-type-${values.type ?? OrganizationType.COUNTY}`}
              defaultValue={values.type ?? OrganizationType.COUNTY}
              onValueChange={(value) => {
                if (typeInputRef.current) {
                  typeInputRef.current.value = value;
                }
              }}
            >
              <SelectTrigger
                id="organization-type"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select organization type" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(OrganizationType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.type?.[0]}</FieldError>
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

          <SetupSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
