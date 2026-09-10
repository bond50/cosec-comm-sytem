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
import { Textarea } from "@/components/ui/textarea";
import {
  initialCorrespondenceDispatchState,
  type CorrespondenceDispatchActionState,
} from "@/features/correspondence/lib/correspondence.shared";
import { createDispatchAction } from "@/features/correspondence/lib/create-dispatch";

type DepartmentOption = {
  id: string;
  label: string;
};

type AssigneeOption = {
  id: string;
  label: string;
  departmentId: string | null;
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

function DispatchSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Routing..." : "Route to department"}
    </Button>
  );
}

type CorrespondenceDispatchFormProps = {
  correspondenceId: string;
  defaultDispatchDate: Date | null;
  departmentOptions: DepartmentOption[];
  assigneeOptions: AssigneeOption[];
};

export function CorrespondenceDispatchForm({
  correspondenceId,
  defaultDispatchDate,
  departmentOptions,
  assigneeOptions,
}: CorrespondenceDispatchFormProps) {
  const router = useRouter();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const initialState: CorrespondenceDispatchActionState = {
    ...initialCorrespondenceDispatchState,
    values: {
      correspondenceId,
      departmentId: "",
      userId: "",
      dispatchDate: toDateTimeLocalValue(defaultDispatchDate ?? new Date()),
      note: "",
      status: "SENT",
    },
  };

  const [state, formAction] = useActionState(
    createDispatchAction,
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
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
    >
      <input type="hidden" name="correspondenceId" value={correspondenceId} />
      <input type="hidden" name="status" value="SENT" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel
            htmlFor={`dispatch-department-${correspondenceId}`}
            required
          >
            Additional department
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
              id={`dispatch-department-${correspondenceId}`}
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
          <input
            type="hidden"
            name="departmentId"
            value={selectedDepartmentId}
            readOnly
          />
          <FieldError>{fieldErrors.departmentId?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor={`dispatch-user-${correspondenceId}`}>
            Receiving officer
          </FieldLabel>
          <Select
            value={selectedUserId || "__none__"}
            onValueChange={(value) =>
              setSelectedUserId(value === "__none__" ? "" : value)
            }
          >
            <SelectTrigger
              id={`dispatch-user-${correspondenceId}`}
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
          <input type="hidden" name="userId" value={selectedUserId} readOnly />
          <FieldError>{fieldErrors.userId?.[0]}</FieldError>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={`dispatch-date-${correspondenceId}`} required>
          Dispatch date
        </FieldLabel>
        <Input
          id={`dispatch-date-${correspondenceId}`}
          name="dispatchDate"
          type="datetime-local"
          defaultValue={values.dispatchDate || ""}
        />
        <FieldError>{fieldErrors.dispatchDate?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor={`dispatch-note-${correspondenceId}`}>
          Dispatch instructions
        </FieldLabel>
        <Textarea
          id={`dispatch-note-${correspondenceId}`}
          name="note"
          defaultValue={values.note || ""}
          rows={3}
          placeholder="Optional dispatch instructions for the receiving office."
        />
        <FieldError>{fieldErrors.note?.[0]}</FieldError>
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
        <DispatchSubmitButton />
      </div>
    </form>
  );
}
