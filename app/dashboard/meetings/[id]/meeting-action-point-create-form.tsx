"use client";

import { useActionState, useRef } from "react";
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
import { createMeetingActionPointAction } from "@/features/meetings/lib/create-meeting-action-point";
import { initialMeetingActionPointCreateState } from "@/features/meetings/lib/meetings.shared";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Adding..." : "Add action point"}
    </Button>
  );
}

export function MeetingActionPointCreateForm({
  meetingId,
  users,
  departments,
}: {
  meetingId: string;
  users: { id: string; label: string }[];
  departments: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState(createMeetingActionPointAction, {
    ...initialMeetingActionPointCreateState,
    values: {
      ...initialMeetingActionPointCreateState.values,
      meetingId,
    },
  });
  const values = state.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};
  const userInputRef = useRef<HTMLInputElement>(null);
  const departmentInputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
    >
      <input type="hidden" name="meetingId" value={meetingId} />

      <Field>
        <FieldLabel htmlFor={`meeting-action-point-${meetingId}`} required>
          Action point
        </FieldLabel>
        <Textarea
          id={`meeting-action-point-${meetingId}`}
          name="actionPoint"
          defaultValue={values.actionPoint ?? ""}
          rows={3}
          placeholder="Record the agreed follow-up action."
        />
        <FieldError>{fieldErrors.actionPoint?.[0]}</FieldError>
      </Field>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`meeting-action-user-${meetingId}`}>
            Assign to user
          </FieldLabel>
          <input
            ref={userInputRef}
            type="hidden"
            name="assignedToUserId"
            defaultValue={values.assignedToUserId ?? ""}
          />
          <Select
            key={`meeting-action-user-${values.assignedToUserId ?? "__empty__"}`}
            defaultValue={values.assignedToUserId || "__none__"}
            onValueChange={(value) => {
              if (userInputRef.current) {
                userInputRef.current.value = value === "__none__" ? "" : value;
              }
            }}
          >
            <SelectTrigger
              id={`meeting-action-user-${meetingId}`}
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select assignee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No assignee</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.assignedToUserId?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor={`meeting-action-department-${meetingId}`}>
            Assign to department
          </FieldLabel>
          <input
            ref={departmentInputRef}
            type="hidden"
            name="assignedToDepartmentId"
            defaultValue={values.assignedToDepartmentId ?? ""}
          />
          <Select
            key={`meeting-action-department-${values.assignedToDepartmentId ?? "__empty__"}`}
            defaultValue={values.assignedToDepartmentId || "__none__"}
            onValueChange={(value) => {
              if (departmentInputRef.current) {
                departmentInputRef.current.value =
                  value === "__none__" ? "" : value;
              }
            }}
          >
            <SelectTrigger
              id={`meeting-action-department-${meetingId}`}
              className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
            >
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No department</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.assignedToDepartmentId?.[0]}</FieldError>
        </Field>
      </div>
      <p className="text-xs text-slate-500">
        Assign each action point to a user, a department, or both.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`meeting-action-due-date-${meetingId}`} required>
            Due date
          </FieldLabel>
          <Input
            id={`meeting-action-due-date-${meetingId}`}
            name="dueDate"
            type="date"
            defaultValue={values.dueDate ?? ""}
          />
          <FieldError>{fieldErrors.dueDate?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor={`meeting-action-remarks-${meetingId}`}>
            Remarks
          </FieldLabel>
          <Input
            id={`meeting-action-remarks-${meetingId}`}
            name="remarks"
            defaultValue={values.remarks ?? ""}
            placeholder="Optional clarification"
          />
          <FieldError>{fieldErrors.remarks?.[0]}</FieldError>
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

      <SubmitButton />
    </form>
  );
}
