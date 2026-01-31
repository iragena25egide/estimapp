/*
  Warnings:

  - You are about to drop the column `boqReference` on the `MaterialTakeOff` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MaterialTakeOff" DROP COLUMN "boqReference",
ADD COLUMN     "boqItemId" TEXT;

-- AddForeignKey
ALTER TABLE "MaterialTakeOff" ADD CONSTRAINT "MaterialTakeOff_boqItemId_fkey" FOREIGN KEY ("boqItemId") REFERENCES "BoqItem"("id") ON DELETE SET NULL ON UPDATE SET NULL;
