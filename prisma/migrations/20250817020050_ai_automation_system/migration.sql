-- CreateEnum
CREATE TYPE "public"."ExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."AutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "trigger" JSONB NOT NULL,
    "conditions" JSONB,
    "actions" JSONB NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutomationExecution" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "status" "public"."ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "triggerData" JSONB NOT NULL,
    "results" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AutomationExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SmartSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "data" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dismissedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "SmartSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyBriefing" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sections" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationRule_userId_idx" ON "public"."AutomationRule"("userId");

-- CreateIndex
CREATE INDEX "AutomationRule_workspaceId_idx" ON "public"."AutomationRule"("workspaceId");

-- CreateIndex
CREATE INDEX "AutomationRule_enabled_idx" ON "public"."AutomationRule"("enabled");

-- CreateIndex
CREATE INDEX "AutomationExecution_ruleId_idx" ON "public"."AutomationExecution"("ruleId");

-- CreateIndex
CREATE INDEX "AutomationExecution_status_idx" ON "public"."AutomationExecution"("status");

-- CreateIndex
CREATE INDEX "AutomationExecution_triggeredAt_idx" ON "public"."AutomationExecution"("triggeredAt");

-- CreateIndex
CREATE INDEX "SmartSuggestion_userId_idx" ON "public"."SmartSuggestion"("userId");

-- CreateIndex
CREATE INDEX "SmartSuggestion_createdAt_idx" ON "public"."SmartSuggestion"("createdAt");

-- CreateIndex
CREATE INDEX "SmartSuggestion_dismissedAt_idx" ON "public"."SmartSuggestion"("dismissedAt");

-- CreateIndex
CREATE INDEX "DailyBriefing_userId_idx" ON "public"."DailyBriefing"("userId");

-- CreateIndex
CREATE INDEX "DailyBriefing_date_idx" ON "public"."DailyBriefing"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyBriefing_userId_date_key" ON "public"."DailyBriefing"("userId", "date");

-- AddForeignKey
ALTER TABLE "public"."AutomationRule" ADD CONSTRAINT "AutomationRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomationRule" ADD CONSTRAINT "AutomationRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "public"."Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutomationExecution" ADD CONSTRAINT "AutomationExecution_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "public"."AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SmartSuggestion" ADD CONSTRAINT "SmartSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyBriefing" ADD CONSTRAINT "DailyBriefing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
