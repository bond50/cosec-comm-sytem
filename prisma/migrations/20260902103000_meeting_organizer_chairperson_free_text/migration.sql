-- Meeting organizer/chairperson often aren't system users (visiting officials,
-- external partners), so the fixed member-only dropdown couldn't represent
-- them. Replace the User foreign keys with free-text fields, backfilling
-- existing links from the linked user's name/email first.

-- 1. Add the new free-text columns.
ALTER TABLE "meetings" ADD COLUMN "organizer" TEXT;
ALTER TABLE "meetings" ADD COLUMN "chairperson" TEXT;

-- 2. Backfill from the existing user links before they're dropped.
UPDATE "meetings" m
SET "organizer" = COALESCE(u."name", u."email")
FROM "users" u
WHERE u."id" = m."organizer_user_id";

UPDATE "meetings" m
SET "chairperson" = COALESCE(u."name", u."email")
FROM "users" u
WHERE u."id" = m."chairperson_user_id";

-- 3. Drop the old foreign keys and columns.
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_organizer_user_id_fkey";
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_chairperson_user_id_fkey";
ALTER TABLE "meetings" DROP COLUMN "organizer_user_id";
ALTER TABLE "meetings" DROP COLUMN "chairperson_user_id";
