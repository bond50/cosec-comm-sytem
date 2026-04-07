-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'REGISTRY_OFFICER', 'REVIEWING_OFFICER', 'DEPARTMENT_USER', 'MANAGEMENT', 'USER');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('COUNTY', 'MINISTRY', 'AGENCY', 'NGO', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DepartmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CorrespondenceType" AS ENUM ('INCOMING', 'OUTGOING');

-- CreateEnum
CREATE TYPE "CorrespondencePriority" AS ENUM ('NORMAL', 'URGENT', 'VERY_URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "CorrespondenceConfidentiality" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL');

-- CreateEnum
CREATE TYPE "CorrespondenceStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'DISPATCHED', 'IN_PROGRESS', 'AWAITING_FEEDBACK', 'COMPLETED', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('HAND', 'EMAIL', 'COURIER', 'POST', 'INTERNAL_MAIL', 'PHONE', 'SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('SENT', 'ACKNOWLEDGED', 'IN_PROGRESS', 'FEEDBACK_RECEIVED', 'CLOSED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'DISPATCHED', 'PENDING_ACTION', 'RESPONDED', 'ARCHIVED', 'DRAFT');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'HELD', 'POSTPONED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ActionPointStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "AttachmentOwnerType" AS ENUM ('CORRESPONDENCE', 'DOCUMENT', 'MEETING', 'ACTION_POINT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REVIEW', 'DISPATCH', 'ACKNOWLEDGE', 'COMPLETE', 'CLOSE');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_tokens" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor_confirmations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "two_factor_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limiter_flexible" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "rate_limiter_flexible_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "login_rate_limit_locks" (
    "account_key" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "locked_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_rate_limit_locks_pkey" PRIMARY KEY ("account_key")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL DEFAULT 'COUNTY',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "password" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "image" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_two_fa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_memberships" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "status" "DepartmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "head_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondences" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "reference_number" TEXT NOT NULL,
    "type" "CorrespondenceType" NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "sender_name" TEXT NOT NULL,
    "sender_office" TEXT NOT NULL,
    "delivered_by" TEXT,
    "delivery_method" "DeliveryMethod" NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL,
    "received_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "instructions" TEXT,
    "priority" "CorrespondencePriority" NOT NULL DEFAULT 'NORMAL',
    "confidentiality" "CorrespondenceConfidentiality" NOT NULL DEFAULT 'INTERNAL',
    "status" "CorrespondenceStatus" NOT NULL DEFAULT 'NEW',
    "due_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "assigned_to_user_id" TEXT,
    "assigned_to_department_id" TEXT,
    "assigned_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence_dispatches" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "correspondence_id" TEXT NOT NULL,
    "dispatched_to_department_id" TEXT,
    "dispatched_to_user_id" TEXT,
    "dispatch_date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'SENT',
    "acknowledged_at" TIMESTAMP(3),
    "acknowledged_by_user_id" TEXT,
    "feedback_received_at" TIMESTAMP(3),
    "feedback_note" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "correspondence_dispatches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "correspondence_movements" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "correspondence_id" TEXT NOT NULL,
    "from_department_id" TEXT,
    "from_user_id" TEXT,
    "to_department_id" TEXT,
    "to_user_id" TEXT,
    "status" "CorrespondenceStatus" NOT NULL,
    "note" TEXT,
    "moved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "correspondence_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_categories" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "correspondence_id" TEXT,
    "category_id" TEXT,
    "reference_number" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "origin_office" TEXT,
    "brought_by" TEXT,
    "current_holder_user_id" TEXT,
    "current_location" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'RECEIVED',
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "archived_by_user_id" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "owner_type" "AttachmentOwnerType" NOT NULL,
    "correspondence_id" TEXT,
    "document_id" TEXT,
    "meeting_id" TEXT,
    "action_point_id" TEXT,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "agenda" TEXT,
    "discussion_summary" TEXT,
    "resolutions" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "venue" TEXT,
    "organizer_user_id" TEXT,
    "chairperson_user_id" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_action_points" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "action_point" TEXT NOT NULL,
    "assigned_to_user_id" TEXT,
    "assigned_to_department_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" "ActionPointStatus" NOT NULL DEFAULT 'OPEN',
    "remarks" TEXT,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_action_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "message" TEXT,
    "correspondence_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_email_token_key" ON "verification_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_email_token_key" ON "password_reset_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_tokens_token_key" ON "two_factor_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_tokens_email_token_key" ON "two_factor_tokens"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_confirmations_user_id_key" ON "two_factor_confirmations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "organization_memberships_organization_id_role_idx" ON "organization_memberships"("organization_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "organization_memberships_organization_id_user_id_key" ON "organization_memberships"("organization_id", "user_id");

-- CreateIndex
CREATE INDEX "departments_organization_id_status_idx" ON "departments"("organization_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_name_key" ON "departments"("organization_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organization_id_code_key" ON "departments"("organization_id", "code");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_type_idx" ON "correspondences"("organization_id", "type");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_status_idx" ON "correspondences"("organization_id", "status");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_priority_idx" ON "correspondences"("organization_id", "priority");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_confidentiality_idx" ON "correspondences"("organization_id", "confidentiality");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_due_date_idx" ON "correspondences"("organization_id", "due_date");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_assigned_to_department_id_idx" ON "correspondences"("organization_id", "assigned_to_department_id");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_assigned_to_user_id_idx" ON "correspondences"("organization_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "correspondences_organization_id_received_at_idx" ON "correspondences"("organization_id", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "correspondences_organization_id_reference_number_key" ON "correspondences"("organization_id", "reference_number");

-- CreateIndex
CREATE INDEX "correspondence_dispatches_organization_id_correspondence_id_idx" ON "correspondence_dispatches"("organization_id", "correspondence_id");

-- CreateIndex
CREATE INDEX "correspondence_dispatches_organization_id_dispatch_date_idx" ON "correspondence_dispatches"("organization_id", "dispatch_date");

-- CreateIndex
CREATE INDEX "correspondence_dispatches_organization_id_status_idx" ON "correspondence_dispatches"("organization_id", "status");

-- CreateIndex
CREATE INDEX "correspondence_dispatches_organization_id_dispatched_to_dep_idx" ON "correspondence_dispatches"("organization_id", "dispatched_to_department_id");

-- CreateIndex
CREATE INDEX "correspondence_dispatches_organization_id_dispatched_to_use_idx" ON "correspondence_dispatches"("organization_id", "dispatched_to_user_id");

-- CreateIndex
CREATE INDEX "correspondence_movements_organization_id_correspondence_id__idx" ON "correspondence_movements"("organization_id", "correspondence_id", "moved_at");

-- CreateIndex
CREATE INDEX "correspondence_movements_organization_id_status_idx" ON "correspondence_movements"("organization_id", "status");

-- CreateIndex
CREATE INDEX "correspondence_movements_organization_id_to_department_id_idx" ON "correspondence_movements"("organization_id", "to_department_id");

-- CreateIndex
CREATE INDEX "correspondence_movements_organization_id_to_user_id_idx" ON "correspondence_movements"("organization_id", "to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_organization_id_name_key" ON "document_categories"("organization_id", "name");

-- CreateIndex
CREATE INDEX "documents_organization_id_status_idx" ON "documents"("organization_id", "status");

-- CreateIndex
CREATE INDEX "documents_organization_id_is_archived_idx" ON "documents"("organization_id", "is_archived");

-- CreateIndex
CREATE INDEX "documents_organization_id_correspondence_id_idx" ON "documents"("organization_id", "correspondence_id");

-- CreateIndex
CREATE INDEX "attachments_organization_id_owner_type_idx" ON "attachments"("organization_id", "owner_type");

-- CreateIndex
CREATE INDEX "attachments_organization_id_correspondence_id_idx" ON "attachments"("organization_id", "correspondence_id");

-- CreateIndex
CREATE INDEX "attachments_organization_id_document_id_idx" ON "attachments"("organization_id", "document_id");

-- CreateIndex
CREATE INDEX "attachments_organization_id_meeting_id_idx" ON "attachments"("organization_id", "meeting_id");

-- CreateIndex
CREATE INDEX "attachments_organization_id_action_point_id_idx" ON "attachments"("organization_id", "action_point_id");

-- CreateIndex
CREATE INDEX "meetings_organization_id_status_idx" ON "meetings"("organization_id", "status");

-- CreateIndex
CREATE INDEX "meetings_organization_id_starts_at_idx" ON "meetings"("organization_id", "starts_at");

-- CreateIndex
CREATE INDEX "meeting_action_points_organization_id_meeting_id_idx" ON "meeting_action_points"("organization_id", "meeting_id");

-- CreateIndex
CREATE INDEX "meeting_action_points_organization_id_due_date_idx" ON "meeting_action_points"("organization_id", "due_date");

-- CreateIndex
CREATE INDEX "meeting_action_points_organization_id_status_idx" ON "meeting_action_points"("organization_id", "status");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_entity_type_entity_id_idx" ON "audit_logs"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_action_idx" ON "audit_logs"("organization_id", "action");

-- CreateIndex
CREATE INDEX "audit_logs_organization_id_created_at_idx" ON "audit_logs"("organization_id", "created_at");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor_confirmations" ADD CONSTRAINT "two_factor_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_user_id_fkey" FOREIGN KEY ("head_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_received_by_user_id_fkey" FOREIGN KEY ("received_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_assigned_to_department_id_fkey" FOREIGN KEY ("assigned_to_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondences" ADD CONSTRAINT "correspondences_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_dispatches" ADD CONSTRAINT "correspondence_dispatches_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_dispatches" ADD CONSTRAINT "correspondence_dispatches_correspondence_id_fkey" FOREIGN KEY ("correspondence_id") REFERENCES "correspondences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_dispatches" ADD CONSTRAINT "correspondence_dispatches_dispatched_to_department_id_fkey" FOREIGN KEY ("dispatched_to_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_dispatches" ADD CONSTRAINT "correspondence_dispatches_dispatched_to_user_id_fkey" FOREIGN KEY ("dispatched_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_dispatches" ADD CONSTRAINT "correspondence_dispatches_acknowledged_by_user_id_fkey" FOREIGN KEY ("acknowledged_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_dispatches" ADD CONSTRAINT "correspondence_dispatches_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_movements" ADD CONSTRAINT "correspondence_movements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_movements" ADD CONSTRAINT "correspondence_movements_correspondence_id_fkey" FOREIGN KEY ("correspondence_id") REFERENCES "correspondences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_movements" ADD CONSTRAINT "correspondence_movements_from_department_id_fkey" FOREIGN KEY ("from_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_movements" ADD CONSTRAINT "correspondence_movements_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_movements" ADD CONSTRAINT "correspondence_movements_to_department_id_fkey" FOREIGN KEY ("to_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_movements" ADD CONSTRAINT "correspondence_movements_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "correspondence_movements" ADD CONSTRAINT "correspondence_movements_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_correspondence_id_fkey" FOREIGN KEY ("correspondence_id") REFERENCES "correspondences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_current_holder_user_id_fkey" FOREIGN KEY ("current_holder_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_archived_by_user_id_fkey" FOREIGN KEY ("archived_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_correspondence_id_fkey" FOREIGN KEY ("correspondence_id") REFERENCES "correspondences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_action_point_id_fkey" FOREIGN KEY ("action_point_id") REFERENCES "meeting_action_points"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_organizer_user_id_fkey" FOREIGN KEY ("organizer_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_chairperson_user_id_fkey" FOREIGN KEY ("chairperson_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_points" ADD CONSTRAINT "meeting_action_points_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_points" ADD CONSTRAINT "meeting_action_points_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_points" ADD CONSTRAINT "meeting_action_points_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_points" ADD CONSTRAINT "meeting_action_points_assigned_to_department_id_fkey" FOREIGN KEY ("assigned_to_department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_points" ADD CONSTRAINT "meeting_action_points_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_correspondence_id_fkey" FOREIGN KEY ("correspondence_id") REFERENCES "correspondences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
