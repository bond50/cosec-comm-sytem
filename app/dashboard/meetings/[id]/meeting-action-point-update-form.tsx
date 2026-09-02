"use client";

import { ActionPointStatus } from "@prisma/client";
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
import { updateMeetingActionPointAction } from "@/features/meetings/lib/update-meeting-action-point";
import { initialMeetingActionPointUpdateState } from "@/features/meetings/lib/meetings.shared";

const ACTION_POINT_STATUS_OPTIONS = [
  { value: ActionPointStatus.OPEN, label: "Open" },
  { value: ActionPointStatus.IN_PROGRESS, label: "In progress" },
  { value: ActionPointStatus.COMPLETED, label: "Completed" },
  { value: ActionPointStatus.CANCELLED, label: "Cancelled" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

export function MeetingActionPointUpdateForm({
  actionPoint,
  users,
  departments,
  restricted = false,
}: {
  actionPoint: {
    id: string;
    status: ActionPointStatus;
    dueDate: Date | null;
    remarks: string | null;
    assignedToUser: {
      id: string;
      name: string | null;
      email: string | null;
    } | null;
    assignedToDepartment: {
      id: string;
      name: string;
      code: string | null;
    } | null;
  };
  users: { id: string; label: string }[];
  departments: { id: string; label: string }[];
  /** Assignee/department self-service mode: only status and remarks are editable. */
  restricted?: boolean;
}) {
  const [state, formAction] = useActionState(updateMeetingActionPointAction, {
    ...initialMeetingActionPointUpdateState,
    values: {
      actionPointId: actionPoint.id,
      assignedToUserId: actionPoint.assignedToUser?.id ?? "",
      assignedToDepartmentId: actionPoint.assignedToDepartment?.id ?? "",
      dueDate: actionPoint.dueDate
        ? actionPoint.dueDate.toISOString().slice(0, 10)
        : "",
      status: actionPoint.status,
      remarks: actionPoint.remarks ?? "",
    },
  });
  const values = state.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};
  const userInputRef = useRef<HTMLInputElement>(null);
  const departmentInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl border border-slate-200 bg-white px-4 py-4"
    >
      <input type="hidden" name="actionPointId" value={actionPoint.id} />

      {restricted ? (
        <>
          <input
            type="hidden"
            name="assignedToUserId"
            value={values.assignedToUserId ?? ""}
          />
          <input
            type="hidden"
            name="assignedToDepartmentId"
            value={values.assignedToDepartmentId ?? ""}
          />
          <input type="hidden" name="dueDate" value={values.dueDate ?? ""} />
          <p className="text-xs text-slate-500">
            Assignee, department, and due date are set by a meeting manager. You
            can update status and remarks.
          </p>
        </>
      ) : null}

      <div className={restricted ? "grid gap-4" : "grid gap-4 lg:grid-cols-3"}>
        {restricted ? null : (
          <>
            <Field>
              <FieldLabel htmlFor={`action-point-user-${actionPoint.id}`}>
                Assignee
              </FieldLabel>
              <input
                ref={userInputRef}
                type="hidden"
                name="assignedToUserId"
                defaultValue={values.assignedToUserId ?? ""}
              />
              <Select
                key={`action-point-user-${values.assignedToUserId ?? "__empty__"}`}
                defaultValue={values.assignedToUserId || "__none__"}
                onValueChange={(value) => {
                  if (userInputRef.current) {
                    userInputRef.current.value =
                      value === "__none__" ? "" : value;
                  }
                }}
              >
                <SelectTrigger
                  id={`action-point-user-${actionPoint.id}`}
                  className="h-11 w-full rounded-[10px] border-slate-200 bg-white text-[14px] shadow-none"
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
              <FieldLabel htmlFor={`action-point-department-${actionPoint.id}`}>
                Department
              </FieldLabel>
              <input
                ref={departmentInputRef}
                type="hidden"
                name="assignedToDepartmentId"
                defaultValue={values.assignedToDepartmentId ?? ""}
              />
              <Select
                key={`action-point-department-${values.assignedToDepartmentId ?? "__empty__"}`}
                defaultValue={values.assignedToDepartmentId || "__none__"}
                onValueChange={(value) => {
                  if (departmentInputRef.current) {
                    departmentInputRef.current.value =
                      value === "__none__" ? "" : value;
                  }
                }}
              >
                <SelectTrigger
                  id={`action-point-department-${actionPoint.id}`}
                  className="h-11 w-full rounded-[10px] border-slate-200 bg-white text-[14px] shadow-none"
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
          </>
        )}

        <Field>
          <FieldLabel htmlFor={`action-point-status-${actionPoint.id}`}>
            Status
          </FieldLabel>
          <input
            ref={statusInputRef}
            type="hidden"
            name="status"
            defaultValue={values.status ?? actionPoint.status}
          />
          <Select
            key={`action-point-status-${values.status ?? actionPoint.status}`}
            defaultValue={values.status ?? actionPoint.status}
            onValueChange={(value) => {
              if (statusInputRef.current) {
                statusInputRef.current.value = value;
              }
            }}
          >
            <SelectTrigger
              id={`action-point-status-${actionPoint.id}`}
              className="h-11 w-full rounded-[10px] border-slate-200 bg-white text-[14px] shadow-none"
            >
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_POINT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{fieldErrors.status?.[0]}</FieldError>
        </Field>
      </div>
      {restricted ? null : (
        <p className="text-xs text-slate-500">
          Action points must remain assigned to a user, a department, or both.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        {restricted ? (
          <Field>
            <FieldLabel>Due date</FieldLabel>
            <p className="flex h-11 items-center text-sm text-slate-700">
              {values.dueDate || "Not set"}
            </p>
          </Field>
        ) : (
          <Field>
            <FieldLabel
              htmlFor={`action-point-due-date-${actionPoint.id}`}
              required
            >
              Due date
            </FieldLabel>
            <Input
              id={`action-point-due-date-${actionPoint.id}`}
              name="dueDate"
              type="date"
              defaultValue={values.dueDate ?? ""}
            />
            <FieldError>{fieldErrors.dueDate?.[0]}</FieldError>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor={`action-point-remarks-${actionPoint.id}`}>
            Remarks
          </FieldLabel>
          <Textarea
            id={`action-point-remarks-${actionPoint.id}`}
            name="remarks"
            defaultValue={values.remarks ?? ""}
            rows={2}
            placeholder="Progress notes or clarification"
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

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
