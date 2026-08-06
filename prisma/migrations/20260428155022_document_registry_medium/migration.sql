-- CreateEnum
CREATE TYPE "DocumentMedium" AS ENUM ('PHYSICAL', 'DIGITAL', 'HYBRID');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "medium" "DocumentMedium" NOT NULL DEFAULT 'PHYSICAL';

-- CreateIndex
CREATE INDEX "documents_organization_id_medium_idx" ON "documents"("organization_id", "medium");
