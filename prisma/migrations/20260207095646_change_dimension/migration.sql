/*
  Warnings:

  - You are about to drop the column `boqItemNo` on the `DimensionSheet` table. All the data in the column will be lost.
  - You are about to drop the column `drawingRef` on the `DimensionSheet` table. All the data in the column will be lost.
  - You are about to drop the column `formula` on the `DimensionSheet` table. All the data in the column will be lost.
  - You are about to drop the column `netQuantity` on the `DimensionSheet` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `DimensionSheet` table. All the data in the column will be lost.
  - You are about to drop the column `units` on the `DimensionSheet` table. All the data in the column will be lost.
  - You are about to drop the column `wastePct` on the `DimensionSheet` table. All the data in the column will be lost.
  - Added the required column `code` to the `DimensionSheet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rate` to the `DimensionSheet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `DimensionSheet` table without a default value. This is not possible if the table is not empty.
  - Made the column `drawingId` on table `DimensionSheet` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DimensionSheet" DROP CONSTRAINT "DimensionSheet_drawingId_fkey";

-- DropForeignKey
ALTER TABLE "DimensionSheet" DROP CONSTRAINT "DimensionSheet_projectId_fkey";

-- AlterTable
ALTER TABLE "DimensionSheet" DROP COLUMN "boqItemNo",
DROP COLUMN "drawingRef",
DROP COLUMN "formula",
DROP COLUMN "netQuantity",
DROP COLUMN "projectId",
DROP COLUMN "units",
DROP COLUMN "wastePct",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "rate" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "drawingId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DimensionSheet" ADD CONSTRAINT "DimensionSheet_drawingId_fkey" FOREIGN KEY ("drawingId") REFERENCES "DrawingRegister"("id") ON DELETE CASCADE ON UPDATE CASCADE;
