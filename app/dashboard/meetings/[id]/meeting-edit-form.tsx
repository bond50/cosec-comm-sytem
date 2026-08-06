"use client";

import { MeetingStatus } from "@prisma/client";
import { useActionState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { updateMeetingAction } from "@/features/meetings/lib/update-meeting";
import { initialMeetingUpdateState } from "@/features/meetings/lib/meetings.shared";
import type { MeetingDetailItem } from "@/features/meetings/queries/meetings";

const MEETING_STATUS_OPTIONS = [
  { value: MeetingStatus.SCHEDULED, label: "Scheduled" },
  { value: MeetingStatus.HELD, label: "Held" },
  { value: MeetingStatus.ACTION_POINTS_ISSUED, label: "Action points issued" },
  { value: MeetingStatus.POSTPONED, label: "Postponed" },
  { value: MeetingStatus.CANCELLED, label: "Cancelled" },
  { value: MeetingStatus.CLOSED, label: "Closed" },
] as const;

function toDateTimeLocal(value: Date | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Saving..." : "Save meeting"}
    </Button>
  );
}

export function MeetingEditForm({
  meeting,
  users,
  correspondences,
}: {
  meeting: MeetingDetailItem;
  users: { id: string; label: string }[];
  correspondences: { id: string; label: string }[];
}) {
  const [state, formAction] = useActionState(
    updateMeetingAction,
    initialMeetingUpdateState,
  );
  const values = state.values?.meetingId
    ? state.values
    : {
        meetingId: meeting.id,
        title: meeting.title,
        description: meeting.description ?? "",
        agenda: meeting.agenda ?? "",
        discussionSummary: meeting.discussionSummary ?? "",
        resolutions: meeting.resolutions ?? "",
        decisions: meeting.decisions ?? "",
        venue: meeting.venue ?? "",
        startsAt: toDateTimeLocal(meeting.startsAt),
        endsAt: toDateTimeLocal(meeting.endsAt),
        organizerUserId: meeting.organizerUser?.id ?? "",
        chairpersonUserId: meeting.chairpersonUser?.id ?? "",
        correspondenceId: meeting.correspondence?.id ?? "",
        status: meeting.status,
      };
  const fieldErrors = state.fieldErrors ?? {};

  const organizerInputRef = useRef<HTMLInputElement>(null);
  const chairpersonInputRef = useRef<HTMLInputElement>(null);
  const correspondenceInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-2 px-6 py-5">
        <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
          Edit meeting
        </CardTitle>
        <CardDescription>
          Closing requires recorded resolutions or at least one action point.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="meetingId" value={meeting.id} />

          <div className="grid gap-5 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="edit-meeting-title" required>
                Title
              </FieldLabel>
              <Input
                id="edit-meeting-title"
                name="title"
                defaultValue={values.title ?? ""}
              />
              <FieldError>{fieldErrors.title?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-meeting-venue">Venue</FieldLabel>
              <Input
                id="edit-meeting-venue"
                name="venue"
                defaultValue={values.venue ?? ""}
              />
              <FieldError>{fieldErrors.venue?.[0]}</FieldError>
            </Field>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="edit-meeting-starts-at" required>
                Starts at
              </FieldLabel>
              <Input
                id="edit-meeting-starts-at"
                name="startsAt"
                type="datetime-local"
                defaultValue={values.startsAt ?? ""}
              />
              <FieldError>{fieldErrors.startsAt?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-meeting-ends-at">Ends at</FieldLabel>
              <Input
                id="edit-meeting-ends-at"
                name="endsAt"
                type="datetime-local"
                defaultValue={values.endsAt ?? ""}
              />
              <FieldError>{fieldErrors.endsAt?.[0]}</FieldError>
            </Field>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="edit-meeting-organizer">
                Organizer
              </FieldLabel>
              <input
                ref={organizerInputRef}
                type="hidden"
                name="organizerUserId"
                defaultValue={values.organizerUserId ?? ""}
              />
              <Select
                key={`edit-meeting-organizer-${values.organizerUserId ?? "__empty__"}`}
                defaultValue={values.organizerUserId || "__none__"}
                onValueChange={(value) => {
                  if (organizerInputRef.current) {
                    organizerInputRef.current.value =
                      value === "__none__" ? "" : value;
                  }
                }}
              >
                <SelectTrigger
                  id="edit-meeting-organizer"
                  className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
                >
                  <SelectValue placeholder="Select organizer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No organizer</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{fieldErrors.organizerUserId?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-meeting-chairperson">
                Chairperson
              </FieldLabel>
              <input
                ref={chairpersonInputRef}
                type="hidden"
                name="chairpersonUserId"
                defaultValue={values.chairpersonUserId ?? ""}
              />
              <Select
                key={`edit-meeting-chairperson-${values.chairpersonUserId ?? "__empty__"}`}
                defaultValue={values.chairpersonUserId || "__none__"}
                onValueChange={(value) => {
                  if (chairpersonInputRef.current) {
                    chairpersonInputRef.current.value =
                      value === "__none__" ? "" : value;
                  }
                }}
              >
                <SelectTrigger
                  id="edit-meeting-chairperson"
                  className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
                >
                  <SelectValue placeholder="Select chairperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No chairperson</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{fieldErrors.chairpersonUserId?.[0]}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-meeting-status">Status</FieldLabel>
              <input
                ref={statusInputRef}
                type="hidden"
                name="status"
                defaultValue={values.status ?? MeetingStatus.SCHEDULED}
              />
              <Select
                key={`edit-meeting-status-${values.status ?? MeetingStatus.SCHEDULED}`}
                defaultValue={values.status ?? MeetingStatus.SCHEDULED}
                onValueChange={(value) => {
                  if (statusInputRef.current) {
                    statusInputRef.current.value = value;
                  }
                }}
              >
                <SelectTrigger
                  id="edit-meeting-status"
                  className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {MEETING_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{fieldErrors.status?.[0]}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="edit-meeting-correspondence">
              Linked correspondence
            </FieldLabel>
            <input
              ref={correspondenceInputRef}
              type="hidden"
              name="correspondenceId"
              defaultValue={values.correspondenceId ?? ""}
            />
            <Select
              key={`edit-meeting-correspondence-${values.correspondenceId ?? "__empty__"}`}
              defaultValue={values.correspondenceId || "__none__"}
              onValueChange={(value) => {
                if (correspondenceInputRef.current) {
                  correspondenceInputRef.current.value =
                    value === "__none__" ? "" : value;
                }
              }}
            >
              <SelectTrigger
                id="edit-meeting-correspondence"
                className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
              >
                <SelectValue placeholder="Select correspondence when relevant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  No linked correspondence
                </SelectItem>
                {correspondences.map((correspondence) => (
                  <SelectItem key={correspondence.id} value={correspondence.id}>
                    {correspondence.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.correspondenceId?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-meeting-description">
              Description
            </FieldLabel>
            <Textarea
              id="edit-meeting-description"
              name="description"
              defaultValue={values.description ?? ""}
              rows={3}
            />
            <FieldError>{fieldErrors.description?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-meeting-agenda">Agenda</FieldLabel>
            <Textarea
              id="edit-meeting-agenda"
              name="agenda"
              defaultValue={values.agenda ?? ""}
              rows={4}
            />
            <FieldError>{fieldErrors.agenda?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-meeting-discussion-summary">
              Discussion summary
            </FieldLabel>
            <Textarea
              id="edit-meeting-discussion-summary"
              name="discussionSummary"
              defaultValue={values.discussionSummary ?? ""}
              rows={4}
              placeholder="Capture key discussion points, context, and concerns raised."
            />
            <FieldError>{fieldErrors.discussionSummary?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-meeting-resolutions">
              Resolutions
            </FieldLabel>
            <Textarea
              id="edit-meeting-resolutions"
              name="resolutions"
              defaultValue={values.resolutions ?? ""}
              rows={4}
              placeholder="Capture agreed decisions, resolutions, and required follow-up."
            />
            <FieldError>{fieldErrors.resolutions?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="edit-meeting-decisions">Decisions</FieldLabel>
            <Textarea
              id="edit-meeting-decisions"
              name="decisions"
              defaultValue={values.decisions ?? ""}
              rows={4}
              placeholder="Capture final decisions, approvals, and direction given by the chairperson."
            />
            <FieldError>{fieldErrors.decisions?.[0]}</FieldError>
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
      </CardContent>
    </Card>
  );
}
