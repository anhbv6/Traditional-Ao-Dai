-- CreateEnum
CREATE TYPE "FabricMovementType" AS ENUM ('CUT', 'RESTOCK', 'WASTE', 'ADJUST');

-- AlterTable
ALTER TABLE "Fabric" ADD COLUMN     "colorId" TEXT,
ADD COLUMN     "receivedMeters" DECIMAL(8,2);

-- CreateTable
CREATE TABLE "FabricMovement" (
    "id" TEXT NOT NULL,
    "fabricId" TEXT NOT NULL,
    "type" "FabricMovementType" NOT NULL,
    "delta" DECIMAL(8,2) NOT NULL,
    "balanceAfter" DECIMAL(8,2) NOT NULL,
    "orderCode" TEXT,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FabricMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FabricMovement_fabricId_createdAt_idx" ON "FabricMovement"("fabricId", "createdAt");

-- CreateIndex
CREATE INDEX "FabricMovement_actorId_idx" ON "FabricMovement"("actorId");

-- CreateIndex
CREATE INDEX "FabricMovement_orderCode_idx" ON "FabricMovement"("orderCode");

-- CreateIndex
CREATE INDEX "Fabric_colorId_idx" ON "Fabric"("colorId");

-- AddForeignKey
ALTER TABLE "Fabric" ADD CONSTRAINT "Fabric_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "AttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabricMovement" ADD CONSTRAINT "FabricMovement_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "Fabric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FabricMovement" ADD CONSTRAINT "FabricMovement_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
