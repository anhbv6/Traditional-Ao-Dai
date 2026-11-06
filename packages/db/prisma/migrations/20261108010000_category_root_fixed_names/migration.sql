-- Nhóm gốc (một cho mỗi nhóm hàng) có tên CỐ ĐỊNH hai ngôn ngữ — admin không đổi tên được nữa.
-- Phải khớp PRODUCT_GROUP_NAMES ở packages/shared/src/sizing.ts. Chỉ đổi dữ liệu.

UPDATE "Category" AS c
SET "name" = d."name", "nameEn" = d."nameEn", "updatedAt" = NOW()
FROM (VALUES
  ('AO_DAI', 'Áo dài', 'Ao dai'),
  ('PANTS', 'Quần', 'Pants'),
  ('ACCESSORY', 'Phụ kiện', 'Accessories'),
  ('FOOTWEAR', 'Giày guốc', 'Footwear'),
  ('MATERIAL', 'Nguyên liệu', 'Materials')
) AS d("group", "name", "nameEn")
WHERE c."parentId" IS NULL
  AND c."group"::text = d."group"
  AND (c."name" IS DISTINCT FROM d."name" OR c."nameEn" IS DISTINCT FROM d."nameEn");
