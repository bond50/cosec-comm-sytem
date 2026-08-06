import { NextResponse } from "next/server";
import { runNotificationReminderJob } from "@/features/notifications/lib/run-notification-jobs";

export async function POST(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();

  if (!configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "CRON_SECRET is not configured.",
      },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const bearerToken = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  const providedSecret =
    bearerToken ||
    request.headers.get("x-cron-secret")?.trim() ||
    new URL(request.url).searchParams.get("secret")?.trim() ||
    "";

  if (!providedSecret || providedSecret !== configuredSecret) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unauthorized scheduled job request.",
      },
      { status: 401 },
    );
  }

  try {
    const result = await runNotificationReminderJob();

    return NextResponse.json({
      ok: true,
      job: "notification-reminders",
      ranAt: new Date().toISOString(),
      ...result,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Notification reminder job failed.",
      },
      { status: 500 },
    );
  }
}
