"use client";

import { useRef } from "react";
import { Building2 } from "lucide-react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DepartmentSummary } from "@/features/application/queries/departments";
import { getDepartmentKindLabel } from "@/features/application/lib/department-model";

type MembershipDepartmentFieldProps = {
  id: string;
  name?: string;
  value: string;
  departments: DepartmentSummary[];
  error?: string;
  hint?: string;
  label?: string;
  onValueChange?: (nextValue: string) => void;
};

export function MembershipDepartmentField({
  id,
  name = "departmentId",
  value,
  departments,
  error,
  hint,
  label = "Department",
  onValueChange,
}: MembershipDepartmentFieldProps) {
  const departmentInputRef = useRef<HTMLInputElement>(null);

  return (
    <Field>
      <div className="flex items-center gap-1.5">
        <FieldLabel htmlFor={id} required>
          {label}
        </FieldLabel>
        {hint ? <InfoTooltip text={hint} /> : null}
      </div>
      <input
        ref={departmentInputRef}
        type="hidden"
        name={name}
        defaultValue={value}
      />
      <Select
        key={`${id}-${value || "none"}`}
        defaultValue={value}
        onValueChange={(nextValue) => {
          if (departmentInputRef.current) {
            departmentInputRef.current.value = nextValue;
          }
          onValueChange?.(nextValue);
        }}
      >
        <SelectTrigger
          id={id}
          className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
        >
          <SelectValue placeholder="Select department" />
        </SelectTrigger>
        <SelectContent>
          {departments.map((department) => (
            <SelectItem key={department.id} value={department.id}>
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                <span>{department.name}</span>
                <span className="text-xs text-slate-400">
                  {getDepartmentKindLabel(department.kind)}
                  {department.code ? ` · ${department.code}` : ""}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError>{error}</FieldError>
    </Field>
  );
}
