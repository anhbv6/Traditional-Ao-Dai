-- CreateEnum
CREATE TYPE "Season" AS ENUM ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER');

-- CreateEnum
CREATE TYPE "AttributeGroup" AS ENUM ('COLOR', 'SIZE', 'NECKLINE', 'SLEEVE', 'PATTERN_TECHNIQUE', 'FLAP_LENGTH', 'OCCASION');

-- AlterTable
ALTER TABLE "Fabric" ADD COLUMN     "materialId" TEXT;

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "origin" TEXT,
    "originEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "composition" JSONB NOT NULL DEFAULT '[]',
    "processSteps" JSONB NOT NULL DEFAULT '[]',
    "closeupImages" TEXT[],
    "videoUrl" TEXT,
    "stretch" INTEGER,
    "thickness" INTEGER,
    "drape" INTEGER,
    "sheerness" INTEGER,
    "sheen" INTEGER,
    "seasons" "Season"[],
    "careCodes" TEXT[],
    "careNote" TEXT,
    "careNoteEn" TEXT,
    "widthCm" INTEGER,
    "metersPerTop" DECIMAL(5,2),
    "metersPerPants" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributeValue" (
    "id" TEXT NOT NULL,
    "group" "AttributeGroup" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "hex" TEXT,
    "family" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE INDEX "Material_isActive_position_idx" ON "Material"("isActive", "position");

-- CreateIndex
CREATE INDEX "AttributeValue_group_position_idx" ON "AttributeValue"("group", "position");

-- CreateIndex
CREATE UNIQUE INDEX "AttributeValue_group_code_key" ON "AttributeValue"("group", "code");

-- CreateIndex
CREATE INDEX "Fabric_materialId_idx" ON "Fabric"("materialId");

-- AddForeignKey
ALTER TABLE "Fabric" ADD CONSTRAINT "Fabric_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Thanh đo vật lý chỉ nhận 1–5
ALTER TABLE "Material" ADD CONSTRAINT "Material_metrics_range_check" CHECK (
    ("stretch" IS NULL OR "stretch" BETWEEN 1 AND 5) AND
    ("thickness" IS NULL OR "thickness" BETWEEN 1 AND 5) AND
    ("drape" IS NULL OR "drape" BETWEEN 1 AND 5) AND
    ("sheerness" IS NULL OR "sheerness" BETWEEN 1 AND 5) AND
    ("sheen" IS NULL OR "sheen" BETWEEN 1 AND 5)
);
