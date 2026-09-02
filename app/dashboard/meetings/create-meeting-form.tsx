"use client";

import { MeetingStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMeetingAction } from "@/features/meetings/lib/create-meeting";
import { initialMeetingCreateState } from "@/features/meetings/lib/meetings.shared";

const MEETING_STATUS_OPTIONS = [
  { value: MeetingStatus.SCHEDULED, label: "Scheduled" },
  { value: MeetingStatus.POSTPONED, label: "Postponed" },
] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      {pending ? "Creating..." : "Create meeting"}
    </Button>
  );
}

export function CreateMeetingForm({
  correspondences,
  mode = "card",
  onSuccess,
}: {
  correspondences: { id: string; label: string }[];
  mode?: "card" | "dialog";
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createMeetingAction,
    initialMeetingCreateState,
  );
  const values = state.values ?? initialMeetingCreateState.values ?? {};
  const fieldErrors = state.fieldErrors ?? {};
  const correspondenceInputRef = useRef<HTMLInputElement>(null);
  const statusInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onSuccess?.();
  }, [onSuccess, router, state.ok]);

  const formContent = (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="meeting-title" required>
            Title
          </FieldLabel>
          <Input
            id="meeting-title"
            name="title"
            defaultValue={values.title ?? ""}
            placeholder="County executive review meeting"
          />
          <FieldError>{fieldErrors.title?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="meeting-venue">Venue</FieldLabel>
          <Input
            id="meeting-venue"
            name="venue"
            defaultValue={values.venue ?? ""}
            placeholder="Boardroom / Zoom / County Hall"
          />
          <FieldError>{fieldErrors.venue?.[0]}</FieldError>
        </Field>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="meeting-starts-at" required>
            Starts at
          </FieldLabel>
          <Input
            id="meeting-starts-at"
            name="startsAt"
            type="datetime-local"
            defaultValue={values.startsAt ?? ""}
          />
          <FieldError>{fieldErrors.startsAt?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="meeting-ends-at">Ends at</FieldLabel>
          <Input
            id="meeting-ends-at"
            name="endsAt"
            type="datetime-local"
            defaultValue={values.endsAt ?? ""}
          />
          <FieldError>{fieldErrors.endsAt?.[0]}</FieldError>
        </Field>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Field>
          <FieldLabel htmlFor="meeting-organizer">Organizer</FieldLabel>
          <Input
            id="meeting-organizer"
            name="organizer"
            defaultValue={values.organizer ?? ""}
            placeholder="Anyone — doesn't need a COSEC account"
          />
          <FieldError>{fieldErrors.organizer?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="meeting-chairperson">Chairperson</FieldLabel>
          <Input
            id="meeting-chairperson"
            name="chairperson"
            defaultValue={values.chairperson ?? ""}
            placeholder="Anyone — doesn't need a COSEC account"
          />
          <FieldError>{fieldErrors.chairperson?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="meeting-status">Status</FieldLabel>
          <input
            ref={statusInputRef}
            type="hidden"
            name="status"
            defaultValue={values.status ?? MeetingStatus.SCHEDULED}
          />
          <Select
            key={`meeting-status-${values.status ?? MeetingStatus.SCHEDULED}`}
            defaultValue={values.status ?? MeetingStatus.SCHEDULED}
            onValueChange={(value) => {
              if (statusInputRef.current) {
                statusInputRef.current.value = value;
              }
            }}
          >
            <SelectTrigger
              id="meeting-status"
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
        <FieldLabel htmlFor="meeting-correspondence">
          Linked correspondence
        </FieldLabel>
        <input
          ref={correspondenceInputRef}
          type="hidden"
          name="correspondenceId"
          defaultValue={values.correspondenceId ?? ""}
        />
        <Select
          key={`meeting-correspondence-${values.correspondenceId ?? "__empty__"}`}
          defaultValue={values.correspondenceId || "__none__"}
          onValueChange={(value) => {
            if (correspondenceInputRef.current) {
              correspondenceInputRef.current.value =
                value === "__none__" ? "" : value;
            }
          }}
        >
          <SelectTrigger
            id="meeting-correspondence"
            className="h-12 w-full rounded-[10px] border-slate-200 bg-white text-[15px] shadow-none"
          >
            <SelectValue placeholder="Select correspondence when relevant" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">No linked correspondence</SelectItem>
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
        <FieldLabel htmlFor="meeting-description">Description</FieldLabel>
        <Textarea
          id="meeting-description"
          name="description"
          defaultValue={values.description ?? ""}
          rows={3}
          placeholder="Purpose and context for the meeting."
        />
        <FieldError>{fieldErrors.description?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="meeting-agenda">Agenda</FieldLabel>
        <Textarea
          id="meeting-agenda"
          name="agenda"
          defaultValue={values.agenda ?? ""}
          rows={4}
          placeholder="Agenda items to be covered."
        />
        <FieldError>{fieldErrors.agenda?.[0]}</FieldError>
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
  );

  if (mode === "dialog") {
    return formContent;
  }

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardHeader className="space-y-2 px-6 py-5">
        <CardTitle className="text-lg tracking-[-0.03em] text-slate-950">
          Create meeting
        </CardTitle>
        <CardDescription>
          Schedule a meeting record for the current organization. Link it to a
          correspondence when the meeting is part of a correspondence decision
          or follow-up.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">{formContent}</CardContent>
    </Card>
  );
}
