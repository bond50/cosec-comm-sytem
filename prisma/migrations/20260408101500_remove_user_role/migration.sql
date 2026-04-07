-- User accounts are identity-only in the county deployment.
-- Operational authorization lives on organization_memberships.role.
ALTER TABLE "users" DROP COLUMN "role";
