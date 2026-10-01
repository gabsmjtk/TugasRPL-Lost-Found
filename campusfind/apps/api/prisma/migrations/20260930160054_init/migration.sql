-- CreateTable
CREATE TABLE `User` (
    `Id` VARCHAR(191) NOT NULL,
    `Name` VARCHAR(191) NOT NULL,
    `StudentNumber` VARCHAR(191) NULL,
    `Email` VARCHAR(191) NOT NULL,
    `PasswordHash` VARCHAR(191) NOT NULL,
    `Role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_StudentNumber_key`(`StudentNumber`),
    UNIQUE INDEX `User_Email_key`(`Email`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `Id` VARCHAR(191) NOT NULL,
    `Name` VARCHAR(191) NOT NULL,
    `Description` VARCHAR(191) NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Category_Name_key`(`Name`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Report` (
    `Id` VARCHAR(191) NOT NULL,
    `ReporterId` VARCHAR(191) NOT NULL,
    `CategoryId` VARCHAR(191) NOT NULL,
    `Type` ENUM('LOST', 'FOUND') NOT NULL,
    `Status` ENUM('PENDING', 'OPEN', 'MATCHED', 'CLAIMED', 'RETURNED', 'REJECTED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING',
    `Title` VARCHAR(191) NOT NULL,
    `Brand` VARCHAR(191) NULL,
    `Color` VARCHAR(191) NULL,
    `Description` TEXT NOT NULL,
    `Location` VARCHAR(191) NOT NULL,
    `EventAt` DATETIME(3) NOT NULL,
    `VerifiedAt` DATETIME(3) NULL,
    `VerifiedById` VARCHAR(191) NULL,
    `ModeratorNote` TEXT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    INDEX `Report_Type_Status_idx`(`Type`, `Status`),
    INDEX `Report_CategoryId_idx`(`CategoryId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReportImage` (
    `Id` VARCHAR(191) NOT NULL,
    `ReportId` VARCHAR(191) NOT NULL,
    `FileName` VARCHAR(191) NOT NULL,
    `FilePath` VARCHAR(191) NOT NULL,
    `MimeType` VARCHAR(191) NOT NULL,
    `SortOrder` INTEGER NOT NULL DEFAULT 0,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Claim` (
    `Id` VARCHAR(191) NOT NULL,
    `ReportId` VARCHAR(191) NOT NULL,
    `ClaimantId` VARCHAR(191) NOT NULL,
    `ProofAnswer` TEXT NOT NULL,
    `OwnershipDescription` TEXT NOT NULL,
    `ContactPhone` VARCHAR(191) NOT NULL,
    `Status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `DecisionNote` TEXT NULL,
    `DecidedById` VARCHAR(191) NULL,
    `DecidedAt` DATETIME(3) NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `UpdatedAt` DATETIME(3) NOT NULL,

    INDEX `Claim_Status_idx`(`Status`),
    UNIQUE INDEX `Claim_ReportId_ClaimantId_key`(`ReportId`, `ClaimantId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Handover` (
    `Id` VARCHAR(191) NOT NULL,
    `ReportId` VARCHAR(191) NOT NULL,
    `ClaimId` VARCHAR(191) NOT NULL,
    `AdminId` VARCHAR(191) NOT NULL,
    `RecipientName` VARCHAR(191) NOT NULL,
    `HandoverLocation` VARCHAR(191) NOT NULL,
    `HandedOverAt` DATETIME(3) NOT NULL,
    `Note` TEXT NULL,
    `CorrectionNote` TEXT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `Id` VARCHAR(191) NOT NULL,
    `ActorId` VARCHAR(191) NOT NULL,
    `EntityType` VARCHAR(191) NOT NULL,
    `EntityId` VARCHAR(191) NOT NULL,
    `Action` VARCHAR(191) NOT NULL,
    `Details` TEXT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_ReporterId_fkey` FOREIGN KEY (`ReporterId`) REFERENCES `User`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_VerifiedById_fkey` FOREIGN KEY (`VerifiedById`) REFERENCES `User`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Report` ADD CONSTRAINT `Report_CategoryId_fkey` FOREIGN KEY (`CategoryId`) REFERENCES `Category`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportImage` ADD CONSTRAINT `ReportImage_ReportId_fkey` FOREIGN KEY (`ReportId`) REFERENCES `Report`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Claim` ADD CONSTRAINT `Claim_ReportId_fkey` FOREIGN KEY (`ReportId`) REFERENCES `Report`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Claim` ADD CONSTRAINT `Claim_ClaimantId_fkey` FOREIGN KEY (`ClaimantId`) REFERENCES `User`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Claim` ADD CONSTRAINT `Claim_DecidedById_fkey` FOREIGN KEY (`DecidedById`) REFERENCES `User`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Handover` ADD CONSTRAINT `Handover_ReportId_fkey` FOREIGN KEY (`ReportId`) REFERENCES `Report`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Handover` ADD CONSTRAINT `Handover_ClaimId_fkey` FOREIGN KEY (`ClaimId`) REFERENCES `Claim`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Handover` ADD CONSTRAINT `Handover_AdminId_fkey` FOREIGN KEY (`AdminId`) REFERENCES `User`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_ActorId_fkey` FOREIGN KEY (`ActorId`) REFERENCES `User`(`Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
