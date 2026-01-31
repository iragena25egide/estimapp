/*
  Warnings:

  - You are about to drop the column `name` on the `BoqItem` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `BoqItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `BoqItem` table. All the data in the column will be lost.
  - You are about to drop the column `areaM2` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `clientEmail` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `houseType` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `quality` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `firstname` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastname` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Estimation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EstimationItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LaborRate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Material` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `amount` to the `BoqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `BoqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `equipmentRate` to the `BoqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `itemNo` to the `BoqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `laborRate` to the `BoqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialRate` to the `BoqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalRate` to the `BoqItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `client` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractType` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatorName` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectType` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('LUMP_SUM', 'BOQ', 'COST_PLUS');

-- CreateEnum
CREATE TYPE "Discipline" AS ENUM ('ARCH', 'STRUCT', 'MEP');

-- CreateEnum
CREATE TYPE "DrawingStatus" AS ENUM ('ISSUED', 'REVISED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "DrawingFileType" AS ENUM ('IMAGE', 'PLN');

-- DropForeignKey
ALTER TABLE "Estimation" DROP CONSTRAINT "Estimation_projectId_fkey";

-- DropForeignKey
ALTER TABLE "EstimationItem" DROP CONSTRAINT "EstimationItem_estimationId_fkey";

-- AlterTable
ALTER TABLE "BoqItem" DROP COLUMN "name",
DROP COLUMN "total",
DROP COLUMN "unitPrice",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "equipmentRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "itemNo" TEXT NOT NULL,
ADD COLUMN     "laborRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "materialRate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "section" TEXT,
ADD COLUMN     "totalRate" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "areaM2",
DROP COLUMN "clientEmail",
DROP COLUMN "clientName",
DROP COLUMN "description",
DROP COLUMN "houseType",
DROP COLUMN "quality",
DROP COLUMN "status",
ADD COLUMN     "client" TEXT NOT NULL,
ADD COLUMN     "completionDate" TIMESTAMP(3),
ADD COLUMN     "contractType" "ContractType" NOT NULL,
ADD COLUMN     "estimatorName" TEXT NOT NULL,
ADD COLUMN     "projectType" TEXT NOT NULL,
ADD COLUMN     "revisionNo" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" DROP COLUMN "firstname",
DROP COLUMN "lastname",
DROP COLUMN "password",
DROP COLUMN "profilePicture",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Estimation";

-- DropTable
DROP TABLE "EstimationItem";

-- DropTable
DROP TABLE "LaborRate";

-- DropTable
DROP TABLE "Material";

-- DropEnum
DROP TYPE "ProjectStatus";

-- DropEnum
DROP TYPE "Quality";

-- CreateTable
CREATE TABLE "LocalAuth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocalAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAuth" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleAuth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawingRegister" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "drawingNo" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "revision" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "scale" TEXT NOT NULL,
    "status" "DrawingStatus" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" "DrawingFileType" NOT NULL,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,

    CONSTRAINT "DrawingRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationRegister" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "specSection" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discipline" "Discipline" NOT NULL,
    "revision" TEXT NOT NULL,
    "remarks" TEXT,

    CONSTRAINT "SpecificationRegister_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimensionSheet" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "drawingId" TEXT,
    "boqItemNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "drawingRef" TEXT,
    "formula" TEXT,
    "length" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "units" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "wastePct" DOUBLE PRECISION,
    "netQuantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DimensionSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateAnalysis" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "boqItemNo" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "materialCost" DOUBLE PRECISION NOT NULL,
    "laborCost" DOUBLE PRECISION NOT NULL,
    "equipmentCost" DOUBLE PRECISION NOT NULL,
    "wastage" DOUBLE PRECISION NOT NULL,
    "overheads" DOUBLE PRECISION NOT NULL,
    "profitPercent" DOUBLE PRECISION NOT NULL,
    "finalUnitRate" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RateAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialTakeOff" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "specification" TEXT,
    "unit" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "boqReference" TEXT,
    "deliveryLocation" TEXT,
    "requiredDate" TIMESTAMP(3),

    CONSTRAINT "MaterialTakeOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaborProductivity" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "trade" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "productivityRate" DOUBLE PRECISION NOT NULL,
    "manHours" DOUBLE PRECISION NOT NULL,
    "laborRatePerHour" DOUBLE PRECISION NOT NULL,
    "totalLaborCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LaborProductivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentCost" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "capacity" TEXT,
    "hireRatePerDay" DOUBLE PRECISION NOT NULL,
    "durationDays" DOUBLE PRECISION NOT NULL,
    "fuelCost" DOUBLE PRECISION,
    "operatorCost" DOUBLE PRECISION,
    "totalCost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "EquipmentCost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LocalAuth_userId_key" ON "LocalAuth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAuth_userId_key" ON "GoogleAuth"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GoogleAuth_googleId_key" ON "GoogleAuth"("googleId");

-- AddForeignKey
ALTER TABLE "LocalAuth" ADD CONSTRAINT "LocalAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleAuth" ADD CONSTRAINT "GoogleAuth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawingRegister" ADD CONSTRAINT "DrawingRegister_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationRegister" ADD CONSTRAINT "SpecificationRegister_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DimensionSheet" ADD CONSTRAINT "DimensionSheet_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DimensionSheet" ADD CONSTRAINT "DimensionSheet_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "DrawingRegister"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateAnalysis" ADD CONSTRAINT "RateAnalysis_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialTakeOff" ADD CONSTRAINT "MaterialTakeOff_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LaborProductivity" ADD CONSTRAINT "LaborProductivity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentCost" ADD CONSTRAINT "EquipmentCost_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
