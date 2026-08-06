-- CreateTable
CREATE TABLE "correspondence_sender_offices" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 1,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondence_sender_offices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "correspondence_sender_offices_organization_id_last_used_at_idx" ON "correspondence_sender_offices"("organization_id", "last_used_at");

-- CreateIndex
CREATE INDEX "correspondence_sender_offices_organization_id_usage_count_idx" ON "correspondence_sender_offices"("organization_id", "usage_count");

-- CreateIndex
CREATE UNIQUE INDEX "correspondence_sender_offices_organization_id_normalized_na_key" ON "correspondence_sender_offices"("organization_id", "normalized_name");

-- AddForeignKey
ALTER TABLE "correspondence_sender_offices" ADD CONSTRAINT "correspondence_sender_offices_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
