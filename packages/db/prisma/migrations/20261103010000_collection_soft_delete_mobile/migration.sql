-- DropIndex
DROP INDEX "Collection_status_idx";

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "autoPushOosToBottom" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bannerImageMobile" TEXT,
ADD COLUMN     "coverImageMobile" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Collection_status_deletedAt_idx" ON "Collection"("status", "deletedAt");

