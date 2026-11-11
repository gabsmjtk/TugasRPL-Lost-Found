-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'OPEN', 'MATCHED', 'CLAIMED', 'RETURNED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "StudentNumber" TEXT,
    "Email" TEXT NOT NULL,
    "PasswordHash" TEXT NOT NULL,
    "Role" "Role" NOT NULL DEFAULT 'STUDENT',
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Category" (
    "Id" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Report" (
    "Id" TEXT NOT NULL,
    "ReporterId" TEXT NOT NULL,
    "CategoryId" TEXT NOT NULL,
    "Type" "ReportType" NOT NULL,
    "Status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "Title" TEXT NOT NULL,
    "Brand" TEXT,
    "Color" TEXT,
    "Description" TEXT NOT NULL,
    "Location" TEXT NOT NULL,
    "EventAt" TIMESTAMP(3) NOT NULL,
    "VerifiedAt" TIMESTAMP(3),
    "VerifiedById" TEXT,
    "ModeratorNote" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "ReportImage" (
    "Id" TEXT NOT NULL,
    "ReportId" TEXT NOT NULL,
    "FileName" TEXT NOT NULL,
    "FilePath" TEXT NOT NULL,
    "MimeType" TEXT NOT NULL,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportImage_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Claim" (
    "Id" TEXT NOT NULL,
    "ReportId" TEXT NOT NULL,
    "ClaimantId" TEXT NOT NULL,
    "ProofAnswer" TEXT NOT NULL,
    "OwnershipDescription" TEXT NOT NULL,
    "ContactPhone" TEXT NOT NULL,
    "Status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "DecisionNote" TEXT,
    "DecidedById" TEXT,
    "DecidedAt" TIMESTAMP(3),
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Handover" (
    "Id" TEXT NOT NULL,
    "ReportId" TEXT NOT NULL,
    "ClaimId" TEXT NOT NULL,
    "AdminId" TEXT NOT NULL,
    "RecipientName" TEXT NOT NULL,
    "HandoverLocation" TEXT NOT NULL,
    "HandedOverAt" TIMESTAMP(3) NOT NULL,
    "Note" TEXT,
    "CorrectionNote" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Handover_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "Id" TEXT NOT NULL,
    "ActorId" TEXT NOT NULL,
    "EntityType" TEXT NOT NULL,
    "EntityId" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "Details" TEXT,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_StudentNumber_key" ON "User"("StudentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Category_Name_key" ON "Category"("Name");

-- CreateIndex
CREATE INDEX "Report_Type_Status_idx" ON "Report"("Type", "Status");

-- CreateIndex
CREATE INDEX "Report_CategoryId_idx" ON "Report"("CategoryId");

-- CreateIndex
CREATE INDEX "Claim_Status_idx" ON "Claim"("Status");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_ReportId_ClaimantId_key" ON "Claim"("ReportId", "ClaimantId");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_ReporterId_fkey" FOREIGN KEY ("ReporterId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_VerifiedById_fkey" FOREIGN KEY ("VerifiedById") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_CategoryId_fkey" FOREIGN KEY ("CategoryId") REFERENCES "Category"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportImage" ADD CONSTRAINT "ReportImage_ReportId_fkey" FOREIGN KEY ("ReportId") REFERENCES "Report"("Id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_ReportId_fkey" FOREIGN KEY ("ReportId") REFERENCES "Report"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_ClaimantId_fkey" FOREIGN KEY ("ClaimantId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_DecidedById_fkey" FOREIGN KEY ("DecidedById") REFERENCES "User"("Id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_ReportId_fkey" FOREIGN KEY ("ReportId") REFERENCES "Report"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_ClaimId_fkey" FOREIGN KEY ("ClaimId") REFERENCES "Claim"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Handover" ADD CONSTRAINT "Handover_AdminId_fkey" FOREIGN KEY ("AdminId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_ActorId_fkey" FOREIGN KEY ("ActorId") REFERENCES "User"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
