-- CreateEnum
CREATE TYPE "CollectionStatus" AS ENUM ('DRAFT', 'COMING_SOON', 'ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "tagline" TEXT,
    "taglineEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "story" TEXT,
    "storyEn" TEXT,
    "season" TEXT,
    "seasonEn" TEXT,
    "coverImage" TEXT,
    "bannerImage" TEXT,
    "gallery" TEXT[],
    "accentColor" TEXT,
    "status" "CollectionStatus" NOT NULL DEFAULT 'DRAFT',
    "launchAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "homepageOrder" INTEGER NOT NULL DEFAULT 0,
    "showInLookbook" BOOLEAN NOT NULL DEFAULT true,
    "seoTitle" TEXT,
    "seoTitleEn" TEXT,
    "seoDescription" TEXT,
    "seoDescriptionEn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionProduct" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Collection_code_key" ON "Collection"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_status_idx" ON "Collection"("status");

-- CreateIndex
CREATE INDEX "Collection_showOnHomepage_homepageOrder_idx" ON "Collection"("showOnHomepage", "homepageOrder");

-- CreateIndex
CREATE INDEX "CollectionProduct_productId_idx" ON "CollectionProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionProduct_collectionId_productId_key" ON "CollectionProduct"("collectionId", "productId");

-- AddForeignKey
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionProduct" ADD CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

