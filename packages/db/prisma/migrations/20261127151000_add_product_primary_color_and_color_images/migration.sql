-- AlterTable
ALTER TABLE "Product" ADD COLUMN "primaryColorId" TEXT,
ADD COLUMN "colorImages" JSONB NOT NULL DEFAULT '[]';
