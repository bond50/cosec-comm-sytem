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
      {pending ? "Saving routing decision..." : "Save routing decision"}
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
  const initialDepartmentId = assignedToDepartmentId ?? "";
  const initialUserId = assignedToUserId ?? "";
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState(initialDepartmentId);
  const [selectedUserId, setSelectedUserId] = useState(initialUserId);

  const initialState: CorrespondenceAssignActionState = {
    ...initialCorrespondenceAssignState,
    values: {
      correspondenceId,
      assignedToDepartmentId: assignedToDepartmentId ?? "",
      assignedToUserId: assignedToUserId ?? "",
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
  const filteredAssignees = assigneeOptions.filter(
    (assignee) => assignee.departmentId === selectedDepartmentId,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:col-span-2"
    >
      <input type="hidden" name="correspondenceId" value={correspondenceId} />
      <input type="hidden" name="status" value="DISPATCHED" />
      <input
        type="hidden"
        name="assignedToDepartmentId"
        value={selectedDepartmentId}
        readOnly
      />
      <input
        type="hidden"
        name="assignedToUserId"
        value={selectedUserId}
        readOnly
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel
            htmlFor={`assign-department-${correspondenceId}`}
            required
          >
            Destination department
          </FieldLabel>
          <Select
            value={selectedDepartmentId || undefined}
            onValueChange={(value) => {
              setSelectedDepartmentId(value);
              if (
                !assigneeOptions.some(
                  (assignee) =>
                    assignee.departmentId === value &&
                    assignee.id === selectedUserId,
                )
              ) {
                setSelectedUserId("");
              }
            }}
          >
            <SelectTrigger
              id={`assign-department-${correspondenceId}`}
              className="h-11 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.assignedToDepartmentId?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor={`assign-user-${correspondenceId}`}>
            Receiving officer
          </FieldLabel>
          <Select
            value={selectedUserId || "__none__"}
            onValueChange={(value) => {
              setSelectedUserId(value === "__none__" ? "" : value);
            }}
          >
            <SelectTrigger
              id={`assign-user-${correspondenceId}`}
              className="h-11 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
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
          <p className="mt-2 text-xs text-slate-500">
            Optional. Only active members of the receiving department are
            offered.
          </p>
          <FieldError>{fieldErrors.assignedToUserId?.[0]}</FieldError>
        </Field>
      </div>

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
          Required before the central office can dispatch this item.
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
