-- CreateEnum
CREATE TYPE "OrderAccessScope" AS ENUM ('READ');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "depositAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "isTailored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippingDetail" JSONB;

-- AlterTable
ALTER TABLE "TailoringLog" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "OrderAccessToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scope" "OrderAccessScope" NOT NULL DEFAULT 'READ',
    "orderId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderAccessToken_tokenHash_key" ON "OrderAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "OrderAccessToken_orderId_idx" ON "OrderAccessToken"("orderId");

-- CreateIndex
CREATE INDEX "OrderAccessToken_expiresAt_idx" ON "OrderAccessToken"("expiresAt");

-- AddForeignKey
ALTER TABLE "OrderAccessToken" ADD CONSTRAINT "OrderAccessToken_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Chuyển dữ liệu: đơn cũ có món may đo → đánh dấu đơn may đo (để hiện timeline xưởng)
UPDATE "Order" o SET "isTailored" = true
WHERE EXISTS (SELECT 1 FROM "OrderItem" i WHERE i."orderId" = o."id" AND i."isCustomFit" = true);
