CREATE TYPE "DepartmentKind" AS ENUM ('CENTRAL_OFFICE', 'EXECUTION');

ALTER TABLE "departments"
ADD COLUMN "kind" "DepartmentKind" NOT NULL DEFAULT 'EXECUTION';

CREATE INDEX "departments_organization_id_kind_idx"
ON "departments"("organization_id", "kind");

UPDATE "departments"
SET "kind" = 'CENTRAL_OFFICE'
WHERE LOWER(TRIM("name")) = LOWER(TRIM('Office of the County Secretary and Head of Public Service'));
