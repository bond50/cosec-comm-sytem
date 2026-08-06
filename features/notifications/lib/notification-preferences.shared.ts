import { z } from "zod";

export type NotificationPreferencesActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    remindersEnabled: boolean;
  };
};

export const notificationPreferencesSchema = z.object({
  inAppEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  remindersEnabled: z.boolean(),
});

export function getNotificationPreferencesValuesFromFormData(
  formData: FormData,
) {
  return {
    inAppEnabled: formData.get("inAppEnabled") === "true",
    emailEnabled: formData.get("emailEnabled") === "true",
    remindersEnabled: formData.get("remindersEnabled") === "true",
  };
}
