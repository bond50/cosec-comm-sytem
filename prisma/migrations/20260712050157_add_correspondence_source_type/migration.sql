-- CreateEnum
CREATE TYPE "CorrespondenceSourceType" AS ENUM ('INTERNAL', 'EXTERNAL');

-- AlterTable
ALTER TABLE "correspondences" ADD COLUMN     "source_department_id" TEXT,
ADD COLUMN     "source_type" "CorrespondenceSourceType" NOT NULL DEFAULT 'EXTERNAL';

-- CreateIndex
CREATE INDEX "correspondences_organization_id_source_department_id_idx" ON "correspondences"("organization_id", "source_department_id");

-- AddForeignKey
ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_source_department_id_fkey" FOREIGN KEY ("source_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
