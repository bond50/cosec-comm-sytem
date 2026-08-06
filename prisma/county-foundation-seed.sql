-- County Government of Vihiga county-accurate foundation seed.
--
-- Use after migrations:
-- pnpm run db:seed:county
--
-- UAT reset sequence:
-- pnpm prisma migrate reset --force
-- pnpm run db:seed:county
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
  'cseedvihigaorg000000000001',
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
  "kind",
  "status",
  "created_at",
  "updated_at"
)
VALUES
  (
    'cseeddeptcentral000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Office of the County Secretary and Head of Public Service',
    'OCS-HPS',
    'Central control office for registration, review, dispatch, oversight, and closure.',
    'CENTRAL_OFFICE',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseeddepthealth0000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Department of Health Services',
    'HLT',
    'Execution unit for dispatched health service correspondence and action points.',
    'EXECUTION',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseeddepttransport0000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Department of Transport and Infrastructure',
    'TRN',
    'Execution unit for dispatched transport and infrastructure correspondence and action points.',
    'EXECUTION',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseeddeptfinance000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Department of Finance and Economic Planning',
    'FIN',
    'Execution unit for dispatched finance, budget, and planning correspondence.',
    'EXECUTION',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseeddeptpublicservice001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Department of Public Service and Administration',
    'PSA',
    'Execution unit for public service and administration correspondence.',
    'EXECUTION',
    'ACTIVE',
    NOW(),
    NOW()
  )
ON CONFLICT ("organization_id", "name") DO UPDATE
SET
  "code" = EXCLUDED."code",
  "description" = EXCLUDED."description",
  "kind" = EXCLUDED."kind",
  "status" = EXCLUDED."status",
  "updated_at" = NOW();

UPDATE "departments"
SET "id" = 'cseeddeptcentral000000001'
WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
  AND "code" = 'OCS-HPS'
  AND "id" <> 'cseeddeptcentral000000001'
  AND NOT EXISTS (SELECT 1 FROM "departments" WHERE "id" = 'cseeddeptcentral000000001');

UPDATE "departments"
SET "id" = 'cseeddepthealth0000000001'
WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
  AND "code" = 'HLT'
  AND "id" <> 'cseeddepthealth0000000001'
  AND NOT EXISTS (SELECT 1 FROM "departments" WHERE "id" = 'cseeddepthealth0000000001');

UPDATE "departments"
SET "id" = 'cseeddepttransport0000001'
WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
  AND "code" = 'TRN'
  AND "id" <> 'cseeddepttransport0000001'
  AND NOT EXISTS (SELECT 1 FROM "departments" WHERE "id" = 'cseeddepttransport0000001');

UPDATE "departments"
SET "id" = 'cseeddeptfinance000000001'
WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
  AND "code" = 'FIN'
  AND "id" <> 'cseeddeptfinance000000001'
  AND NOT EXISTS (SELECT 1 FROM "departments" WHERE "id" = 'cseeddeptfinance000000001');

UPDATE "departments"
SET "id" = 'cseeddeptpublicservice001'
WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
  AND "code" = 'PSA'
  AND "id" <> 'cseeddeptpublicservice001'
  AND NOT EXISTS (SELECT 1 FROM "departments" WHERE "id" = 'cseeddeptpublicservice001');

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
    'cseeduseradmin00000000001',
    'County System Administrator',
    'admin@vihiga.go.ke',
    NOW(),
    '$2b$10$C3DldaQoxaOIRBCmNg2hiOv6YpvdFwJkHxM1wy.aagNHPJLgL6/wS',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'cseeduserregistry00000001',
    'Central Registry Officer',
    'registry@vihiga.go.ke',
    NOW(),
    '$2b$10$C3DldaQoxaOIRBCmNg2hiOv6YpvdFwJkHxM1wy.aagNHPJLgL6/wS',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'cseedusercountysec0000001',
    'County Secretary / Reviewing Officer',
    'county.secretary@vihiga.go.ke',
    NOW(),
    '$2b$10$C3DldaQoxaOIRBCmNg2hiOv6YpvdFwJkHxM1wy.aagNHPJLgL6/wS',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'cseeduserhealth000000001',
    'Health Department Officer',
    'health.officer@vihiga.go.ke',
    NOW(),
    '$2b$10$C3DldaQoxaOIRBCmNg2hiOv6YpvdFwJkHxM1wy.aagNHPJLgL6/wS',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'cseedusertransport000001',
    'Transport Department Officer',
    'transport.officer@vihiga.go.ke',
    NOW(),
    '$2b$10$C3DldaQoxaOIRBCmNg2hiOv6YpvdFwJkHxM1wy.aagNHPJLgL6/wS',
    true,
    false,
    NOW(),
    NOW()
  ),
  (
    'cseeduserfinance00000001',
    'Finance Department Officer',
    'finance.officer@vihiga.go.ke',
    NOW(),
    '$2b$10$C3DldaQoxaOIRBCmNg2hiOv6YpvdFwJkHxM1wy.aagNHPJLgL6/wS',
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

UPDATE "users"
SET "id" = 'cseeduseradmin00000000001'
WHERE "email" = 'admin@vihiga.go.ke'
  AND "id" <> 'cseeduseradmin00000000001'
  AND NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = 'cseeduseradmin00000000001');

UPDATE "users"
SET "id" = 'cseeduserregistry00000001'
WHERE "email" = 'registry@vihiga.go.ke'
  AND "id" <> 'cseeduserregistry00000001'
  AND NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = 'cseeduserregistry00000001');

UPDATE "users"
SET "id" = 'cseedusercountysec0000001'
WHERE "email" = 'county.secretary@vihiga.go.ke'
  AND "id" <> 'cseedusercountysec0000001'
  AND NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = 'cseedusercountysec0000001');

UPDATE "users"
SET "id" = 'cseeduserhealth000000001'
WHERE "email" = 'health.officer@vihiga.go.ke'
  AND "id" <> 'cseeduserhealth000000001'
  AND NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = 'cseeduserhealth000000001');

UPDATE "users"
SET "id" = 'cseedusertransport000001'
WHERE "email" = 'transport.officer@vihiga.go.ke'
  AND "id" <> 'cseedusertransport000001'
  AND NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = 'cseedusertransport000001');

UPDATE "users"
SET "id" = 'cseeduserfinance00000001'
WHERE "email" = 'finance.officer@vihiga.go.ke'
  AND "id" <> 'cseeduserfinance00000001'
  AND NOT EXISTS (SELECT 1 FROM "users" WHERE "id" = 'cseeduserfinance00000001');

INSERT INTO "organization_memberships" (
  "id",
  "organization_id",
  "user_id",
  "department_id",
  "role",
  "roles",
  "status",
  "created_at",
  "updated_at"
)
VALUES
  (
    'cseedmemadmin000000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    (SELECT "id" FROM "users" WHERE "email" = 'admin@vihiga.go.ke'),
    (
      SELECT "id"
      FROM "departments"
      WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
        AND "code" = 'OCS-HPS'
    ),
    'ORG_ADMIN',
    ARRAY['ORG_ADMIN']::"UserRole"[],
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseedmemregistry000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    (SELECT "id" FROM "users" WHERE "email" = 'registry@vihiga.go.ke'),
    (
      SELECT "id"
      FROM "departments"
      WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
        AND "code" = 'OCS-HPS'
    ),
    'REGISTRY_OFFICER',
    ARRAY['REGISTRY_OFFICER']::"UserRole"[],
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseedmemcountysec00000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    (SELECT "id" FROM "users" WHERE "email" = 'county.secretary@vihiga.go.ke'),
    (
      SELECT "id"
      FROM "departments"
      WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
        AND "code" = 'OCS-HPS'
    ),
    'REVIEWING_OFFICER',
    ARRAY['REVIEWING_OFFICER', 'MANAGEMENT']::"UserRole"[],
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseedmemhealth0000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    (SELECT "id" FROM "users" WHERE "email" = 'health.officer@vihiga.go.ke'),
    (
      SELECT "id"
      FROM "departments"
      WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
        AND "code" = 'HLT'
    ),
    'DEPARTMENT_USER',
    ARRAY['DEPARTMENT_USER']::"UserRole"[],
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseedmemtransport0000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    (SELECT "id" FROM "users" WHERE "email" = 'transport.officer@vihiga.go.ke'),
    (
      SELECT "id"
      FROM "departments"
      WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
        AND "code" = 'TRN'
    ),
    'DEPARTMENT_USER',
    ARRAY['DEPARTMENT_USER']::"UserRole"[],
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    'cseedmemfinance000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    (SELECT "id" FROM "users" WHERE "email" = 'finance.officer@vihiga.go.ke'),
    (
      SELECT "id"
      FROM "departments"
      WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga')
        AND "code" = 'FIN'
    ),
    'DEPARTMENT_USER',
    ARRAY['DEPARTMENT_USER']::"UserRole"[],
    'ACTIVE',
    NOW(),
    NOW()
  )
ON CONFLICT ("organization_id", "user_id") DO UPDATE
SET
  "department_id" = EXCLUDED."department_id",
  "role" = EXCLUDED."role",
  "roles" = EXCLUDED."roles",
  "status" = EXCLUDED."status",
  "updated_at" = NOW();

UPDATE "departments"
SET
  "head_user_id" = CASE "code"
    WHEN 'OCS-HPS' THEN (SELECT "id" FROM "users" WHERE "email" = 'county.secretary@vihiga.go.ke')
    WHEN 'HLT' THEN (SELECT "id" FROM "users" WHERE "email" = 'health.officer@vihiga.go.ke')
    WHEN 'TRN' THEN (SELECT "id" FROM "users" WHERE "email" = 'transport.officer@vihiga.go.ke')
    WHEN 'FIN' THEN (SELECT "id" FROM "users" WHERE "email" = 'finance.officer@vihiga.go.ke')
    ELSE "head_user_id"
  END,
  "updated_at" = NOW()
WHERE "organization_id" = (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga');

INSERT INTO "document_categories" (
  "id",
  "organization_id",
  "name",
  "description",
  "created_at",
  "updated_at"
)
VALUES
  (
    'cseedcatletters000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Official Letters',
    'Formal county correspondence received or issued through the central office.',
    NOW(),
    NOW()
  ),
  (
    'cseedcatmemos0000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Internal Memos',
    'Internal memos and instructions requiring tracking or follow-up.',
    NOW(),
    NOW()
  ),
  (
    'cseedcatreports000000001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Reports and Returns',
    'Departmental reports, returns, and supporting documents.',
    NOW(),
    NOW()
  )
ON CONFLICT ("organization_id", "name") DO UPDATE
SET
  "description" = EXCLUDED."description",
  "updated_at" = NOW();

INSERT INTO "correspondence_sender_offices" (
  "id",
  "organization_id",
  "name",
  "normalized_name",
  "usage_count",
  "last_used_at",
  "created_at",
  "updated_at"
)
VALUES
  (
    'cseedsendergovernor00001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Office of the Governor',
    'office of the governor',
    1,
    NOW(),
    NOW(),
    NOW()
  ),
  (
    'cseedsenderassembly00001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'County Assembly of Vihiga',
    'county assembly of vihiga',
    1,
    NOW(),
    NOW(),
    NOW()
  ),
  (
    'cseedsenderpublic001',
    (SELECT "id" FROM "organizations" WHERE "slug" = 'county-government-of-vihiga'),
    'Member of the Public',
    'member of the public',
    1,
    NOW(),
    NOW(),
    NOW()
  )
ON CONFLICT ("organization_id", "normalized_name") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "usage_count" = GREATEST("correspondence_sender_offices"."usage_count", EXCLUDED."usage_count"),
  "last_used_at" = NOW(),
  "updated_at" = NOW();
