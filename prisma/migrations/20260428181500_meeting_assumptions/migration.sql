ALTER TABLE "meetings" ADD COLUMN "correspondence_id" TEXT;

UPDATE "meeting_action_points"
SET "due_date" = "created_at"
WHERE "due_date" IS NULL;

ALTER TABLE "meeting_action_points" ALTER COLUMN "due_date" SET NOT NULL;

CREATE INDEX "meetings_organization_id_correspondence_id_idx" ON "meetings"("organization_id", "correspondence_id");

ALTER TABLE "meetings" ADD CONSTRAINT "meetings_correspondence_id_fkey" FOREIGN KEY ("correspondence_id") REFERENCES "correspondences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
