-- Hình thức bán, mã sản phẩm, liên kết chất liệu / màu / đặc tính thiết kế.
-- Có bước chuyển dữ liệu: chất liệu dạng chữ → bản ghi Material, sinh mã cho sản phẩm cũ, gắn màu SKU với thuộc tính màu.

-- CreateEnum
CREATE TYPE "SaleMode" AS ENUM ('SINGLE', 'SET', 'CUSTOM');

-- AlterTable: thêm cột mới (code tạm cho phép null để điền dữ liệu)
ALTER TABLE "Product" ADD COLUMN     "code" TEXT,
ADD COLUMN     "leadTimeDays" INTEGER,
ADD COLUMN     "materialId" TEXT,
ADD COLUMN     "saleMode" "SaleMode" NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "setItems" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "ProductVariant" ADD COLUMN     "colorId" TEXT;

-- Chuyển dữ liệu 1: chất liệu chữ chưa có trong Material → tạo hồ sơ chất liệu tối thiểu (mã từ băm tên)
INSERT INTO "Material" ("id", "code", "name", "nameEn", "composition", "processSteps", "closeupImages", "seasons", "careCodes", "updatedAt")
SELECT gen_random_uuid()::text,
       'VAI-' || upper(substr(md5(lower(trim(p."material"))), 1, 6)),
       min(trim(p."material")),
       min(p."materialEn"),
       '[]'::jsonb, '[]'::jsonb, ARRAY[]::text[], ARRAY[]::"Season"[], ARRAY[]::text[],
       CURRENT_TIMESTAMP
FROM "Product" p
WHERE p."material" IS NOT NULL
  AND trim(p."material") <> ''
  AND NOT EXISTS (SELECT 1 FROM "Material" m WHERE lower(m."name") = lower(trim(p."material")))
GROUP BY lower(trim(p."material"));

-- Chuyển dữ liệu 2: gắn sản phẩm với chất liệu theo tên
UPDATE "Product" p
SET "materialId" = m."id"
FROM "Material" m
WHERE p."material" IS NOT NULL AND lower(m."name") = lower(trim(p."material"));

-- Chuyển dữ liệu 3: mã sản phẩm = tiền tố nhóm hàng + số thứ tự 4 chữ số theo ngày tạo
UPDATE "Product" p
SET "code" = numbered.prefix || lpad(numbered.rn::text, 4, '0')
FROM (
  SELECT p2."id",
         CASE c."group"
           WHEN 'AO_DAI' THEN 'AD'
           WHEN 'PANTS' THEN 'QD'
           WHEN 'ACCESSORY' THEN 'PK'
           WHEN 'FOOTWEAR' THEN 'GM'
           ELSE 'VA'
         END AS prefix,
         row_number() OVER (PARTITION BY c."group" ORDER BY p2."createdAt", p2."id") AS rn
  FROM "Product" p2
  JOIN "Category" c ON c."id" = p2."categoryId"
) numbered
WHERE p."id" = numbered."id";

-- Chuyển dữ liệu 4: màu SKU khớp tên với thuộc tính màu
UPDATE "ProductVariant" v
SET "colorId" = a."id"
FROM "AttributeValue" a
WHERE a."group" = 'COLOR' AND v."color" IS NOT NULL AND lower(a."name") = lower(trim(v."color"));

-- Chốt cột mã, bỏ cột chất liệu dạng chữ (đã chuyển sang Material)
ALTER TABLE "Product" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Product" DROP COLUMN "material",
DROP COLUMN "materialEn";

-- CreateTable
CREATE TABLE "ProductAttribute" (
    "productId" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("productId","attributeValueId")
);

-- CreateIndex
CREATE INDEX "ProductAttribute_attributeValueId_idx" ON "ProductAttribute"("attributeValueId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE INDEX "Product_materialId_idx" ON "Product"("materialId");

-- CreateIndex
CREATE INDEX "ProductVariant_colorId_idx" ON "ProductVariant"("colorId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "AttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
