-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "source_department_id" TEXT,
ADD COLUMN     "source_type" "CorrespondenceSourceType" NOT NULL DEFAULT 'EXTERNAL';

-- CreateIndex
CREATE INDEX "documents_organization_id_source_department_id_idx" ON "documents"("organization_id", "source_department_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_department_id_fkey" FOREIGN KEY ("source_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
