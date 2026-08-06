-- AlterTable
ALTER TABLE "organization_memberships" ADD COLUMN     "roles" "UserRole"[] DEFAULT ARRAY[]::"UserRole"[];

UPDATE "organization_memberships"
SET "roles" = ARRAY["role"]
WHERE "roles" IS NULL OR cardinality("roles") = 0;

ALTER TABLE "organization_memberships"
ALTER COLUMN "roles" SET NOT NULL;
