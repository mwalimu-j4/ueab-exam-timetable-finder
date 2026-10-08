ALTER TABLE "TimetableVersion" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'FINAL';
ALTER TABLE "TimetableVersion" ADD COLUMN "label" TEXT;
ALTER TABLE "TimetableVersion" ADD COLUMN "publishedAt" TIMESTAMP(3);
UPDATE "TimetableVersion" SET "publishedAt" = "uploadedAt" WHERE "isActive" = true AND "publishedAt" IS NULL;

CREATE TABLE "Student" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "pinHash" TEXT NOT NULL,
  "failedAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "lastSeenVersionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastLoginAt" TIMESTAMP(3),
  CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

CREATE TABLE "StudentSession" (
  "id" TEXT NOT NULL,
  "studentRefId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgentType" TEXT,
  CONSTRAINT "StudentSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudentSession_tokenHash_key" ON "StudentSession"("tokenHash");
CREATE INDEX "StudentSession_studentRefId_idx" ON "StudentSession"("studentRefId");
CREATE INDEX "StudentSession_expiresAt_idx" ON "StudentSession"("expiresAt");
ALTER TABLE "StudentSession" ADD CONSTRAINT "StudentSession_studentRefId_fkey"
  FOREIGN KEY ("studentRefId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SavedExam" (
  "id" TEXT NOT NULL,
  "studentRefId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "option" TEXT NOT NULL,
  "isDone" BOOLEAN NOT NULL DEFAULT false,
  "doneAt" TIMESTAMP(3),
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastKnownExamId" TEXT,
  "lastKnownSnapshot" JSONB,
  "changeFlag" TEXT,
  "changeSeenAt" TIMESTAMP(3),
  CONSTRAINT "SavedExam_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SavedExam_studentRefId_code_option_key" ON "SavedExam"("studentRefId", "code", "option");
CREATE INDEX "SavedExam_studentRefId_idx" ON "SavedExam"("studentRefId");
ALTER TABLE "SavedExam" ADD CONSTRAINT "SavedExam_studentRefId_fkey"
  FOREIGN KEY ("studentRefId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
