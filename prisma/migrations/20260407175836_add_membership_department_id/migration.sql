-- AlterTable
ALTER TABLE "organization_memberships" ADD COLUMN     "department_id" TEXT;

-- CreateIndex
CREATE INDEX "departments_organization_id_idx" ON "departments"("organization_id");

-- CreateIndex
CREATE INDEX "organization_memberships_organization_id_department_id_idx" ON "organization_memberships"("organization_id", "department_id");

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
