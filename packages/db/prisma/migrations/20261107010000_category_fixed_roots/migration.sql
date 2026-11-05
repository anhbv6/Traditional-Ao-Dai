-- Nhóm gốc cố định: đúng MỘT nhóm gốc cho mỗi nhóm hàng (Áo dài, Quần, Phụ kiện, Giày guốc, Nguyên liệu).
-- Admin chỉ thêm / sửa LOẠI SẢN PHẨM bên trong (VD Áo dài truyền thống, Áo dài ngũ thân...). Chỉ chuyển dữ liệu.

-- 1. Mỗi nhóm hàng giữ nhóm gốc đứng đầu; các nhóm gốc còn lại cùng nhóm hàng gộp vào đó.
CREATE TEMP TABLE "_root_merge" AS
SELECT r."id" AS "fromId", k."id" AS "toId", r."position" AS "fromPosition"
FROM "Category" r
JOIN LATERAL (
  SELECT x."id" FROM "Category" x
  WHERE x."parentId" IS NULL AND x."group" = r."group"
  ORDER BY x."position", x."createdAt", x."id" LIMIT 1
) k ON TRUE
WHERE r."parentId" IS NULL AND r."id" <> k."id";

-- 2. Loại con của nhóm gốc bị gộp → nối vào cuối nhóm gốc giữ lại (giữ thứ tự cũ)
WITH moved AS (
  SELECT c."id", m."toId",
         ROW_NUMBER() OVER (PARTITION BY m."toId" ORDER BY m."fromPosition", c."position", c."id") - 1
           + COALESCE((SELECT MAX(s."position") + 1 FROM "Category" s WHERE s."parentId" = m."toId"), 0) AS "position"
  FROM "Category" c
  JOIN "_root_merge" m ON m."fromId" = c."parentId"
)
UPDATE "Category" c
SET "parentId" = moved."toId", "position" = moved."position", "updatedAt" = NOW()
FROM moved
WHERE c."id" = moved."id";

-- 3. Sản phẩm gắn thẳng vào nhóm gốc bị gộp → sang nhóm gốc giữ lại
UPDATE "Product" p
SET "categoryId" = m."toId", "updatedAt" = NOW()
FROM "_root_merge" m
WHERE p."categoryId" = m."fromId";

-- 4. Xóa nhóm gốc đã gộp (đã trống)
DELETE FROM "Category" c USING "_root_merge" m WHERE c."id" = m."fromId";

-- 5. Nhóm gốc áo dài gọi chung "Áo dài" (nữ / nam / trẻ em là các loại bên trong)
UPDATE "Category"
SET "name" = 'Áo dài', "nameEn" = 'Ao dai',
    "slug" = CASE WHEN EXISTS (SELECT 1 FROM "Category" o WHERE o."slug" = 'ao-dai') THEN "slug" ELSE 'ao-dai' END,
    "updatedAt" = NOW()
WHERE "parentId" IS NULL AND "group" = 'AO_DAI';

-- 6. Nhóm hàng chưa có nhóm gốc → tạo (cùng slug với seed)
INSERT INTO "Category" ("id", "name", "nameEn", "slug", "group", "position", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, d."name", d."nameEn", d."slug", d."group"::"ProductGroup", 0, true, NOW(), NOW()
FROM (VALUES
  ('Áo dài', 'Ao dai', 'ao-dai', 'AO_DAI'),
  ('Quần (đồ lẻ)', 'Pants (separates)', 'quan-ao-dai', 'PANTS'),
  ('Phụ kiện', 'Accessories', 'phu-kien-ao-dai', 'ACCESSORY'),
  ('Giày, guốc', 'Footwear', 'giay-guoc', 'FOOTWEAR'),
  ('Nguyên liệu', 'Materials', 'nguyen-lieu', 'MATERIAL')
) AS d("name", "nameEn", "slug", "group")
WHERE NOT EXISTS (SELECT 1 FROM "Category" r WHERE r."parentId" IS NULL AND r."group"::text = d."group")
  AND NOT EXISTS (SELECT 1 FROM "Category" s WHERE s."slug" = d."slug");

-- 7. Thứ tự nhóm gốc theo thứ tự nhóm hàng
UPDATE "Category"
SET "position" = CASE "group"
    WHEN 'AO_DAI' THEN 0 WHEN 'PANTS' THEN 1 WHEN 'ACCESSORY' THEN 2 WHEN 'FOOTWEAR' THEN 3 ELSE 4 END
WHERE "parentId" IS NULL;

DROP TABLE "_root_merge";
