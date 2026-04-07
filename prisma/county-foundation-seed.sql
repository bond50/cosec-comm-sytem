-- County Government of Vihiga foundation seed
-- Use:
-- pnpm prisma db execute --file prisma/county-foundation-seed.sql --schema prisma/schema.prisma
--
-- Demo password for all seeded accounts:
-- ChangeMe123!
-- bcrypt hash generated for application credential login.

INSERT INTO "organizations" (
  "id",
  "name",
  "slug",
  "type",
  "is_active",
  "created_at",
  "updated_at"
)
VALUES (
  'org_vihiga_county',
  'County Government of Vihiga',
  'county-government-of-vihiga',
  'COUNTY',
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "type" = EXCLUDED."type",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = NOW();

INSERT INTO "departments" (
  "id",
  "organization_id",
  "name",
  "code",
  "description",
  "status",
  "created_at",
  "updated_at"
)
VALUES
  (
    'dept_registry_vihiga',
    'org_vihiga_county',
    'Registry and Records',
    'REG',
    'Handles correspondence intake, recording, and registry operations.',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'dept_admin_vihiga',
    'org_vihiga_county',
    'County Administration',
    'ADM',
    'Administrative coordination and county executive support.',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'dept_legal_vihiga',
    'org_vihiga_county',
    'Legal Affairs',
    'LGL',
    'Reviews legal and compliance-sensitive correspondence.',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'dept_transport_vihiga',
    'org_vihiga_county',
    'Department of Transport and Infrastructure',
    'TRN',
    'Operational department for transport and infrastructure matters.',
    'ACTIVE',
    NOW(),
    NOW()
  )
ON CONFLICT ("organization_id", "name") DO UPDATE
SET
  "code" = EXCLUDED."code",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "updated_at" = NOW();

INSERT INTO "users" (
  "id",
  "name",
  "email",
  "email_verified",
  "password",
  "is_active",
  "is_two_fa_enabled",
  "created_at",
  "updated_at"
)
VALUES
  (
    'usr_vihiga_sysadmin',
    'County System Admin',
    'sysadmin@vihiga.go.ke',
    NOW(),
    '$2b$10$SG5v5NwH0x4Q4Qn0Q5OnNe8XFeN4P4vAcJk6vYf3iP0s6v5rBkVw2',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'usr_vihiga_admin',
    'County Admin',
    'admin@vihiga.go.ke',
    NOW(),
    '$2b$10$SG5v5NwH0x4Q4Qn0Q5OnNe8XFeN4P4vAcJk6vYf3iP0s6v5rBkVw2',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'usr_vihiga_registry',
    'Registry Officer',
    'registry@vihiga.go.ke',
    NOW(),
    '$2b$10$SG5v5NwH0x4Q4Qn0Q5OnNe8XFeN4P4vAcJk6vYf3iP0s6v5rBkVw2',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'usr_vihiga_reviewer',
    'Reviewing Officer',
    'review@vihiga.go.ke',
    NOW(),
    '$2b$10$SG5v5NwH0x4Q4Qn0Q5OnNe8XFeN4P4vAcJk6vYf3iP0s6v5rBkVw2',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'usr_vihiga_management',
    'County Management',
    'management@vihiga.go.ke',
    NOW(),
    '$2b$10$SG5v5NwH0x4Q4Qn0Q5OnNe8XFeN4P4vAcJk6vYf3iP0s6v5rBkVw2',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'usr_vihiga_transport',
    'Transport Officer',
    'transport@vihiga.go.ke',
    NOW(),
    '$2b$10$SG5v5NwH0x4Q4Qn0Q5OnNe8XFeN4P4vAcJk6vYf3iP0s6v5rBkVw2',
    true,
    false,
    NOW(),
    NOW()
  )
ON CONFLICT ("email") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "email_verified" = EXCLUDED."email_verified",
  "password" = EXCLUDED."password",
  "is_active" = EXCLUDED."is_active",
  "is_two_fa_enabled" = EXCLUDED."is_two_fa_enabled",
  "updated_at" = NOW();

INSERT INTO "organization_memberships" (
  "id",
  "organization_id",
  "user_id",
  "department_id",
  "role",
  "status",
  "created_at",
  "updated_at"
)
VALUES
  (
    'mem_vihiga_sysadmin',
    'org_vihiga_county',
    'usr_vihiga_sysadmin',
    'dept_admin_vihiga',
    'SUPER_ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'mem_vihiga_admin',
    'org_vihiga_county',
    'usr_vihiga_admin',
    'dept_admin_vihiga',
    'ORG_ADMIN',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'mem_vihiga_registry',
    'org_vihiga_county',
    'usr_vihiga_registry',
    'dept_registry_vihiga',
    'REGISTRY_OFFICER',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'mem_vihiga_reviewer',
    'org_vihiga_county',
    'usr_vihiga_reviewer',
    'dept_legal_vihiga',
    'REVIEWING_OFFICER',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'mem_vihiga_management',
    'org_vihiga_county',
    'usr_vihiga_management',
    'dept_admin_vihiga',
    'MANAGEMENT',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'mem_vihiga_transport',
    'org_vihiga_county',
    'usr_vihiga_transport',
    'dept_transport_vihiga',
    'DEPARTMENT_USER',
    'ACTIVE',
    NOW(),
    NOW()
  )
ON CONFLICT ("organization_id", "user_id") DO UPDATE
SET
  "department_id" = EXCLUDED."department_id",
  "role" = EXCLUDED."role",
  "status" = EXCLUDED."status",
  "updated_at" = NOW();

UPDATE "departments"
SET
  "head_user_id" = CASE "id"
    WHEN 'dept_registry_vihiga' THEN 'usr_vihiga_registry'
    WHEN 'dept_admin_vihiga' THEN 'usr_vihiga_admin'
    WHEN 'dept_legal_vihiga' THEN 'usr_vihiga_reviewer'
    WHEN 'dept_transport_vihiga' THEN 'usr_vihiga_transport'
    ELSE "head_user_id"
  END,
  "updated_at" = NOW()
WHERE "organization_id" = 'org_vihiga_county';
