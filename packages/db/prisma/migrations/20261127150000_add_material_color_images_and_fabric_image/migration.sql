-- AlterTable
ALTER TABLE "Fabric" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "colorImages" JSONB NOT NULL DEFAULT '[]';
