-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('EMAIL', 'MEETING', 'ACADEMIC_ALERT', 'COUNSELING_REFERRAL', 'PEER_TUTORING', 'CHECK_IN', 'OTHER');

-- CreateEnum
CREATE TYPE "InterventionStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LMSProvider" AS ENUM ('CANVAS', 'GOOGLE_CLASSROOM', 'MOODLE', 'MOCK');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('LMS_DATA', 'CHAT_LOGS', 'ACADEMIC_RECORDS', 'ANALYTICS');

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "externalId" TEXT,
    "encryptedData" TEXT,
    "riskTier" TEXT DEFAULT 'green',
    "compositeScore" DOUBLE PRECISION DEFAULT 0,
    "riskTimeline" JSONB,
    "consentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_accounts" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "provider" "LMSProvider" NOT NULL,
    "providerId" TEXT,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lms_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lms_activities" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "studentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "courseName" TEXT,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION,
    "url" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lms_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_scores" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "level" "RiskLevel" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "compositeScore" DOUBLE PRECISION,
    "tier" TEXT,
    "factors" JSONB,
    "metadata" JSONB,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interventions" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "type" "InterventionType" NOT NULL,
    "status" "InterventionStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "note" TEXT,
    "assignedTo" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "outcome" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_settings" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT false,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'error',
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "context" JSONB,
    "route" TEXT,
    "duration" INTEGER,
    "userId" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_externalId_key" ON "students"("externalId");

-- CreateIndex
CREATE INDEX "students_email_idx" ON "students"("email");

-- CreateIndex
CREATE INDEX "students_externalId_idx" ON "students"("externalId");

-- CreateIndex
CREATE INDEX "students_riskTier_idx" ON "students"("riskTier");

-- CreateIndex
CREATE INDEX "students_compositeScore_idx" ON "students"("compositeScore");

-- CreateIndex
CREATE INDEX "lms_accounts_provider_idx" ON "lms_accounts"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "lms_accounts_studentId_provider_key" ON "lms_accounts"("studentId", "provider");

-- CreateIndex
CREATE INDEX "lms_activities_studentId_timestamp_idx" ON "lms_activities"("studentId", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "lms_activities_studentId_type_idx" ON "lms_activities"("studentId", "type");

-- CreateIndex
CREATE INDEX "lms_activities_courseId_idx" ON "lms_activities"("courseId");

-- CreateIndex
CREATE INDEX "lms_activities_timestamp_idx" ON "lms_activities"("timestamp" DESC);

-- CreateIndex
CREATE INDEX "risk_scores_studentId_computedAt_idx" ON "risk_scores"("studentId", "computedAt" DESC);

-- CreateIndex
CREATE INDEX "risk_scores_computedAt_idx" ON "risk_scores"("computedAt" DESC);

-- CreateIndex
CREATE INDEX "risk_scores_level_idx" ON "risk_scores"("level");

-- CreateIndex
CREATE INDEX "risk_scores_tier_idx" ON "risk_scores"("tier");

-- CreateIndex
CREATE INDEX "chat_messages_studentId_createdAt_idx" ON "chat_messages"("studentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "interventions_studentId_status_idx" ON "interventions"("studentId", "status");

-- CreateIndex
CREATE INDEX "interventions_status_idx" ON "interventions"("status");

-- CreateIndex
CREATE INDEX "interventions_type_idx" ON "interventions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "consent_settings_studentId_scope_key" ON "consent_settings"("studentId", "scope");

-- CreateIndex
CREATE INDEX "audit_logs_studentId_createdAt_idx" ON "audit_logs"("studentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "error_logs_level_idx" ON "error_logs"("level");

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "error_logs_route_idx" ON "error_logs"("route");

-- AddForeignKey
ALTER TABLE "lms_accounts" ADD CONSTRAINT "lms_accounts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_activities" ADD CONSTRAINT "lms_activities_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_scores" ADD CONSTRAINT "risk_scores_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interventions" ADD CONSTRAINT "interventions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_settings" ADD CONSTRAINT "consent_settings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
