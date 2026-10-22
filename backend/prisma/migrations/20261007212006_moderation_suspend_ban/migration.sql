-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bannedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedUntil" TIMESTAMP(3),
ADD COLUMN     "suspensionReason" TEXT;

-- CreateTable
CREATE TABLE "BannedIdentity" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "matricula" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BannedIdentity_email_idx" ON "BannedIdentity"("email");

-- CreateIndex
CREATE INDEX "BannedIdentity_matricula_idx" ON "BannedIdentity"("matricula");
