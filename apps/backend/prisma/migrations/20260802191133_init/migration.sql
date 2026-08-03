-- CreateEnum
CREATE TYPE "Role" AS ENUM ('super_admin', 'admin', 'candidate', 'volunteer');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending_approval', 'active', 'suspended', 'banned', 'deleted');

-- CreateEnum
CREATE TYPE "ElectionType" AS ENUM ('assembly', 'general', 'local');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late');

-- CreateEnum
CREATE TYPE "AiToolType" AS ENUM ('speech', 'manifesto', 'social', 'opposition', 'campaign_plan', 'readiness_analysis');

-- CreateEnum
CREATE TYPE "AiUsageStatus" AS ENUM ('success', 'error', 'quota_blocked');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('new', 'contacted', 'qualified', 'lost', 'converted');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('contact_form', 'service_inquiry', 'demo_request', 'email_campaign', 'referral');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'success', 'warning', 'error');

-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('pending', 'approved', 'rejected', 'inactive');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'candidate',
    "status" "UserStatus" NOT NULL DEFAULT 'pending_approval',
    "state" TEXT,
    "constituency_id" UUID,
    "constituency_name" TEXT,
    "party" TEXT,
    "totp_secret_encrypted" TEXT,
    "password_reset_token_hash" TEXT,
    "password_reset_expires_at" TIMESTAMP(3),
    "profile_photo_url" TEXT,
    "profile_photo_public_id" TEXT,
    "social_links" JSONB,
    "bio" TEXT,
    "slug" TEXT,
    "profile_visibility" BOOLEAN NOT NULL DEFAULT false,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "invited_by_user_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_fingerprint" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_inputs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "state" TEXT NOT NULL,
    "constituency" TEXT NOT NULL,
    "election_type" "ElectionType" NOT NULL,
    "budget" BIGINT NOT NULL,
    "party" TEXT,
    "social_media_score" INTEGER NOT NULL,
    "volunteer_count" INTEGER NOT NULL,
    "past_victory" BOOLEAN NOT NULL,
    "past_victory_details" TEXT,
    "extra" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_inputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "readiness_reports" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "input_id" UUID NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "organization_score" INTEGER NOT NULL,
    "digital_score" INTEGER NOT NULL,
    "resources_score" INTEGER NOT NULL,
    "voter_score" INTEGER NOT NULL,
    "visibility_score" INTEGER NOT NULL,
    "strengths" TEXT[],
    "weaknesses" TEXT[],
    "recommendations" TEXT[],
    "ai_analysis_raw" JSONB,
    "public_share_token" TEXT,
    "public_share_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "readiness_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "constituencies" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "population" INTEGER NOT NULL,
    "gender_ratio" DOUBLE PRECISION NOT NULL,
    "literacy_rate" DOUBLE PRECISION NOT NULL,
    "urban_percent" DOUBLE PRECISION NOT NULL,
    "past_winner" TEXT,
    "past_winner_party" TEXT,
    "victory_margin_votes" INTEGER,
    "victory_margin_percent" DOUBLE PRECISION,
    "demographics" JSONB,
    "election_history" JSONB,
    "data_source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "constituencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_plans" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "budget" BIGINT NOT NULL,
    "election_type" "ElectionType" NOT NULL,
    "state" TEXT NOT NULL,
    "constituency" TEXT NOT NULL,
    "days_until_election" INTEGER NOT NULL,
    "plan_data" JSONB NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_metrics" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "volunteers_active" INTEGER NOT NULL,
    "booths_covered" DOUBLE PRECISION NOT NULL,
    "sentiment_score" DOUBLE PRECISION NOT NULL,
    "survey_count" INTEGER NOT NULL,
    "social_reach" BIGINT NOT NULL,
    "funds_utilized" DOUBLE PRECISION NOT NULL,
    "metric_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteers" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "assigned_booth" TEXT,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'pending',
    "invited_by_email" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "candidate_id" UUID NOT NULL,
    "volunteer_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigned_booth" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "due_date" TIMESTAMP(3),
    "completion_notes" TEXT,
    "completion_photos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booth_reports" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "volunteer_id" UUID NOT NULL,
    "booth_id" TEXT NOT NULL,
    "turnout_estimate" INTEGER,
    "issues_reported" TEXT,
    "photos" TEXT[],
    "geolocation" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "booth_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "volunteer_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "check_in" TIMESTAMP(3),
    "check_out" TIMESTAMP(3),
    "geolocation" JSONB,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rally_reports" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "volunteer_id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "rally_name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "crowd_estimate" INTEGER,
    "photos" TEXT[],
    "issues_faced" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rally_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_logs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "tool_type" "AiToolType" NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_inr" DOUBLE PRECISION NOT NULL,
    "status" "AiUsageStatus" NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" "LeadSource" NOT NULL,
    "service_interest" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'new',
    "assigned_to" UUID,
    "notes" TEXT,
    "converted_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "features" TEXT[],
    "price_info" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_slug_key" ON "users"("slug");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "readiness_inputs_user_id_idx" ON "readiness_inputs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "readiness_reports_public_share_token_key" ON "readiness_reports"("public_share_token");

-- CreateIndex
CREATE INDEX "readiness_reports_user_id_idx" ON "readiness_reports"("user_id");

-- CreateIndex
CREATE INDEX "constituencies_state_idx" ON "constituencies"("state");

-- CreateIndex
CREATE UNIQUE INDEX "constituencies_name_state_key" ON "constituencies"("name", "state");

-- CreateIndex
CREATE INDEX "campaign_plans_user_id_idx" ON "campaign_plans"("user_id");

-- CreateIndex
CREATE INDEX "campaign_metrics_user_id_metric_date_idx" ON "campaign_metrics"("user_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_metrics_user_id_metric_date_key" ON "campaign_metrics"("user_id", "metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "volunteers_user_id_key" ON "volunteers"("user_id");

-- CreateIndex
CREATE INDEX "volunteers_candidate_id_idx" ON "volunteers"("candidate_id");

-- CreateIndex
CREATE INDEX "tasks_candidate_id_idx" ON "tasks"("candidate_id");

-- CreateIndex
CREATE INDEX "tasks_volunteer_id_idx" ON "tasks"("volunteer_id");

-- CreateIndex
CREATE INDEX "booth_reports_volunteer_id_idx" ON "booth_reports"("volunteer_id");

-- CreateIndex
CREATE INDEX "booth_reports_booth_id_idx" ON "booth_reports"("booth_id");

-- CreateIndex
CREATE INDEX "attendance_volunteer_id_date_idx" ON "attendance"("volunteer_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_volunteer_id_date_key" ON "attendance"("volunteer_id", "date");

-- CreateIndex
CREATE INDEX "rally_reports_candidate_id_idx" ON "rally_reports"("candidate_id");

-- CreateIndex
CREATE INDEX "ai_usage_logs_user_id_created_at_idx" ON "ai_usage_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_usage_logs_tool_type_idx" ON "ai_usage_logs"("tool_type");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "services_slug_key" ON "services"("slug");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_constituency_id_fkey" FOREIGN KEY ("constituency_id") REFERENCES "constituencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_inputs" ADD CONSTRAINT "readiness_inputs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_reports" ADD CONSTRAINT "readiness_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "readiness_reports" ADD CONSTRAINT "readiness_reports_input_id_fkey" FOREIGN KEY ("input_id") REFERENCES "readiness_inputs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_plans" ADD CONSTRAINT "campaign_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_metrics" ADD CONSTRAINT "campaign_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booth_reports" ADD CONSTRAINT "booth_reports_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rally_reports" ADD CONSTRAINT "rally_reports_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rally_reports" ADD CONSTRAINT "rally_reports_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
