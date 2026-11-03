-- CreateEnum
CREATE TYPE "ProductGroup" AS ENUM ('AO_DAI', 'PANTS', 'ACCESSORY', 'FOOTWEAR', 'MATERIAL');

-- CreateEnum
CREATE TYPE "SurchargeType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "defaultSizeChartId" TEXT,
ADD COLUMN     "group" "ProductGroup" NOT NULL DEFAULT 'AO_DAI',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sizeChartId" TEXT;

-- CreateTable
CREATE TABLE "SizeChart" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "group" "ProductGroup" NOT NULL,
    "description" TEXT,
    "descriptionEn" TEXT,
    "measurementGuide" TEXT,
    "measurementGuideEn" TEXT,
    "guideImage" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bigsizeSurchargeType" "SurchargeType",
    "bigsizeSurchargeValue" DECIMAL(12,2),
    "bigsizeExtraFabric" DECIMAL(6,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeChartColumn" (
    "id" TEXT NOT NULL,
    "sizeChartId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "validMin" DOUBLE PRECISION,
    "validMax" DOUBLE PRECISION,
    "bigsizeFrom" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeChartColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeChartRow" (
    "id" TEXT NOT NULL,
    "sizeChartId" TEXT NOT NULL,
    "sizeLabel" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeChartRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SizeChart_group_isActive_idx" ON "SizeChart"("group", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SizeChartColumn_sizeChartId_key_key" ON "SizeChartColumn"("sizeChartId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "SizeChartRow_sizeChartId_sizeLabel_key" ON "SizeChartRow"("sizeChartId", "sizeLabel");

-- CreateIndex
CREATE INDEX "Category_parentId_position_idx" ON "Category"("parentId", "position");

-- CreateIndex
CREATE INDEX "Category_defaultSizeChartId_idx" ON "Category"("defaultSizeChartId");

-- CreateIndex
CREATE INDEX "Product_sizeChartId_idx" ON "Product"("sizeChartId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_defaultSizeChartId_fkey" FOREIGN KEY ("defaultSizeChartId") REFERENCES "SizeChart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SizeChartColumn" ADD CONSTRAINT "SizeChartColumn_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SizeChartRow" ADD CONSTRAINT "SizeChartRow_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Chuyển dữ liệu: danh mục có sẵn nhận nhóm hàng đúng bản chất (mặc định AO_DAI)
UPDATE "Category" SET "group" = 'ACCESSORY' WHERE "slug" = 'phu-kien-ao-dai';
