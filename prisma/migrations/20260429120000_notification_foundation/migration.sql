-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('ACTION_REQUIRED', 'UPDATE', 'REMINDER');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "audit_log_id" TEXT,
ADD COLUMN     "dedupe_key" TEXT,
ADD COLUMN     "emailed_at" TIMESTAMP(3),
ADD COLUMN     "kind" "NotificationKind" NOT NULL DEFAULT 'UPDATE';

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "reminders_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_preferences_organization_id_reminders_enabled_idx" ON "notification_preferences"("organization_id", "reminders_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_organization_id_user_id_key" ON "notification_preferences"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "notifications_organization_id_user_id_kind_read_at_idx" ON "notifications"("organization_id", "user_id", "kind", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_organization_id_user_id_dedupe_key_key" ON "notifications"("organization_id", "user_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_audit_log_id_fkey" FOREIGN KEY ("audit_log_id") REFERENCES "audit_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
