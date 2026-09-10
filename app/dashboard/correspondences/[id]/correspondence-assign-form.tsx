"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
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
import {
  initialCorrespondenceAssignState,
  type CorrespondenceAssignActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { assignCorrespondenceAction } from "@/features/correspondence/lib/assign-correspondence";

type DepartmentOption = {
  id: string;
  label: string;
};

type AssigneeOption = {
  id: string;
  label: string;
  departmentId: string | null;
};

type CorrespondenceAssignFormProps = {
  correspondenceId: string;
  assignedToDepartmentId: string | null;
  assignedToUserId: string | null;
  dueDate: Date | null;
  departmentOptions: DepartmentOption[];
  assigneeOptions: AssigneeOption[];
};

function toDateTimeLocalValue(value: Date | null) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function AssignSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Saving routing decision..."
        : "Save & dispatch routing decision"}
    </Button>
  );
}

export function CorrespondenceAssignForm({
  correspondenceId,
  assignedToDepartmentId,
  assignedToUserId,
  dueDate,
  departmentOptions,
  assigneeOptions,
}: CorrespondenceAssignFormProps) {
  const router = useRouter();
  const initialDepartmentIds = assignedToDepartmentId
    ? [assignedToDepartmentId]
    : [];
  const [selectedDepartmentIds, setSelectedDepartmentIds] =
    useState<string[]>(initialDepartmentIds);
  const [selectedUserIds, setSelectedUserIds] = useState<
    Record<string, string>
  >(
    assignedToDepartmentId && assignedToUserId
      ? { [assignedToDepartmentId]: assignedToUserId }
      : {},
  );

  const initialState: CorrespondenceAssignActionState = {
    ...initialCorrespondenceAssignState,
    values: {
      correspondenceId,
      targets: initialDepartmentIds.map((departmentId) => ({
        departmentId,
        userId: assignedToUserId ?? "",
      })),
      dueDate: toDateTimeLocalValue(dueDate),
      status: "DISPATCHED",
    },
  };

  const [state, formAction] = useActionState(
    assignCorrespondenceAction,
    initialState,
  );

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  const values = state.values ?? initialState.values!;
  const fieldErrors = state.fieldErrors ?? {};

  function toggleDepartment(departmentId: string, checked: boolean) {
    setSelectedDepartmentIds((current) =>
      checked
        ? [...current, departmentId]
        : current.filter((id) => id !== departmentId),
    );

    if (!checked) {
      setSelectedUserIds((current) => {
        const next = { ...current };
        delete next[departmentId];
        return next;
      });
    }
  }

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:col-span-2"
    >
      <input type="hidden" name="correspondenceId" value={correspondenceId} />
      <input type="hidden" name="status" value="DISPATCHED" />

      <Field>
        <FieldLabel>Destination departments</FieldLabel>
        <p className="mb-2 text-xs text-slate-500">
          Select one or more departments to route this correspondence to
          simultaneously.
        </p>
        <div className="space-y-3 rounded-[10px] border border-slate-200 bg-white p-3">
          {departmentOptions.map((department) => {
            const checked = selectedDepartmentIds.includes(department.id);
            const filteredAssignees = assigneeOptions.filter(
              (assignee) => assignee.departmentId === department.id,
            );

            return (
              <div key={department.id} className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      toggleDepartment(department.id, event.target.checked)
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#1868a6] focus:ring-[#1868a6]"
                  />
                  {checked ? (
                    <input
                      type="hidden"
                      name="assignedToDepartmentIds"
                      value={department.id}
                    />
                  ) : null}
                  {department.label}
                </label>

                {checked ? (
                  <div className="ml-6">
                    <Select
                      value={selectedUserIds[department.id] || "__none__"}
                      onValueChange={(value) =>
                        setSelectedUserIds((current) => ({
                          ...current,
                          [department.id]: value === "__none__" ? "" : value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 w-full rounded-[10px] border-slate-200 bg-white text-sm shadow-none">
                        <SelectValue placeholder="No named receiving officer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">
                          No named receiving officer
                        </SelectItem>
                        {filteredAssignees.map((assignee) => (
                          <SelectItem key={assignee.id} value={assignee.id}>
                            {assignee.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      type="hidden"
                      name={`assignedToUserId__${department.id}`}
                      value={selectedUserIds[department.id] || ""}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        <FieldError>{fieldErrors.targets?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`assign-due-date-${correspondenceId}`} required>
          Due date
        </FieldLabel>
        <Input
          id={`assign-due-date-${correspondenceId}`}
          name="dueDate"
          type="datetime-local"
          defaultValue={values.dueDate || ""}
        />
        <p className="mt-2 text-xs text-slate-500">
          Applies to every department this item is routed to.
        </p>
        <FieldError>{fieldErrors.dueDate?.[0]}</FieldError>
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

      <div className="flex items-center justify-end">
        <AssignSubmitButton />
      </div>
    </form>
  );
}
