"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateNotificationPreferencesAction } from "@/features/notifications/actions/update-notification-preferences";
import type { NotificationPreferencesActionState } from "@/features/notifications/lib/notification-preferences.shared";

type NotificationPreferencesFormProps = {
  initialValues: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    remindersEnabled: boolean;
  };
};

const initialState: NotificationPreferencesActionState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex h-10 items-center justify-center rounded-xl bg-[#1868a6] px-4 text-sm font-medium text-white transition hover:bg-[#3447d4] disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving..." : "Save notification settings"}
    </button>
  );
}

export function NotificationPreferencesForm({
  initialValues,
}: NotificationPreferencesFormProps) {
  const [state, formAction] = useActionState(
    updateNotificationPreferencesAction,
    {
      ...initialState,
      values: initialValues,
    },
  );
  const values = state.values ?? initialValues;

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <input
              type="hidden"
              name="inAppEnabled"
              value={values.inAppEnabled ? "true" : "false"}
            />
            <input
              type="checkbox"
              defaultChecked={values.inAppEnabled}
              onChange={(event) => {
                const hidden = event.currentTarget.form?.elements.namedItem(
                  "inAppEnabled",
                ) as HTMLInputElement | null;
                if (hidden) {
                  hidden.value = event.currentTarget.checked ? "true" : "false";
                }
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                In-app notifications
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Show workflow updates in the dashboard bell and notification
                workspace.
              </p>
            </div>
          </div>
        </label>

        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <input
              type="hidden"
              name="emailEnabled"
              value={values.emailEnabled ? "true" : "false"}
            />
            <input
              type="checkbox"
              defaultChecked={values.emailEnabled}
              onChange={(event) => {
                const hidden = event.currentTarget.form?.elements.namedItem(
                  "emailEnabled",
                ) as HTMLInputElement | null;
                if (hidden) {
                  hidden.value = event.currentTarget.checked ? "true" : "false";
                }
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Email as secondary channel
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Send best-effort email in addition to in-app notifications.
              </p>
            </div>
          </div>
        </label>

        <label className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <input
              type="hidden"
              name="remindersEnabled"
              value={values.remindersEnabled ? "true" : "false"}
            />
            <input
              type="checkbox"
              defaultChecked={values.remindersEnabled}
              onChange={(event) => {
                const hidden = event.currentTarget.form?.elements.namedItem(
                  "remindersEnabled",
                ) as HTMLInputElement | null;
                if (hidden) {
                  hidden.value = event.currentTarget.checked ? "true" : "false";
                }
              }}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Reminder notifications
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Allow due-tomorrow, overdue, acknowledgement, and pending
                feedback reminders.
              </p>
            </div>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-slate-600">
          {state.message ? (
            <span className={state.ok ? "text-emerald-700" : "text-rose-700"}>
              {state.message}
            </span>
          ) : (
            "Preferences apply to the current organization only."
          )}
        </div>
        <SubmitButton />
      </div>
    </form>
  );
}
