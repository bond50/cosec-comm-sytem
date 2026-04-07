"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { OrganizationType } from "@prisma/client";
import { Building2, ShieldCheck } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initialCreateOrganizationState } from "@/features/application/lib/organization-setup.shared";
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
};

export function OrganizationSetupForm({
  defaultName = "",
}: OrganizationSetupFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(createOrganizationAction, {
    ...initialCreateOrganizationState,
    values: {
      ...initialCreateOrganizationState.values,
      name: defaultName,
    },
  });

  useEffect(() => {
    if (state.ok) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [router, state.ok]);

  const values = state.values ?? initialCreateOrganizationState.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};
  const typeInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-[22px] border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <CardHeader className="space-y-2 px-6 py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-[1.25rem] tracking-[-0.03em] text-slate-950">
              Create your organization
            </CardTitle>
            <CardDescription className="max-w-xl leading-6">
              Set up the first organization for this account. You will be added
              as the active{" "}
              <span className="font-medium text-slate-700">ORG_ADMIN</span>.
            </CardDescription>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2ff] text-[#465fff]">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        <div className="grid gap-3 pt-1 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
            This creates the first organization record and immediately makes
            your account the administering member for it.
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700">
            Use a stable organization name and slug because they anchor
            tenant-scoped routing, queries, and future selection.
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form action={formAction} className="space-y-5">
          <Field>
            <FieldLabel htmlFor="organization-name" required>
              Name
            </FieldLabel>
            <Input
              id="organization-name"
              name="name"
              defaultValue={values.name ?? ""}
              placeholder="County Government of Vihiga"
              autoComplete="organization"
            />
            <FieldError>{fieldErrors.name?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="organization-slug" required>
              Slug
            </FieldLabel>
            <Input
              id="organization-slug"
              name="slug"
              defaultValue={values.slug ?? ""}
              placeholder="county-government-of-vihiga"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            <FieldDescription>
              Lowercase letters, numbers, and hyphens only.
            </FieldDescription>
            <FieldError>{fieldErrors.slug?.[0]}</FieldError>
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

          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-slate-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <div>
              After setup, the rest of the dashboard becomes organization-aware
              and every core query will be scoped to this tenant.
            </div>
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

          <SetupSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
