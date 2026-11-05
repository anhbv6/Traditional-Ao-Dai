-- Nhóm hàng (ProductGroup) giờ do NHÓM GỐC quyết định; loại con luôn thừa hưởng, không chọn riêng.
-- Chỉ chuyển dữ liệu (không đổi schema): đưa các loại con đang lệch nhóm hàng với nhóm gốc về đúng chỗ.

-- 1. Loại con nhóm Giày / guốc đang nằm dưới nhóm gốc khác (VD "Guốc mộc" trong "Phụ kiện") mà chưa có
--    nhóm gốc FOOTWEAR → tạo nhóm gốc "Giày, guốc" (cùng slug với seed) xếp cuối.
INSERT INTO "Category" ("id", "name", "nameEn", "slug", "group", "position", "isActive", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'Giày, guốc', 'Footwear', 'giay-guoc', 'FOOTWEAR',
       COALESCE((SELECT MAX("position") + 1 FROM "Category" WHERE "parentId" IS NULL), 0), true, NOW(), NOW()
WHERE EXISTS (
    SELECT 1 FROM "Category" c JOIN "Category" p ON p."id" = c."parentId"
    WHERE c."group" = 'FOOTWEAR' AND p."group" <> 'FOOTWEAR'
  )
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "parentId" IS NULL AND "group" = 'FOOTWEAR')
  AND NOT EXISTS (SELECT 1 FROM "Category" WHERE "slug" = 'giay-guoc');

-- 2. Loại con lệch nhóm → chuyển sang nhóm gốc đầu tiên CÙNG nhóm hàng (nếu có), xếp cuối danh sách của cha mới.
WITH target AS (
  SELECT c."id",
         (SELECT r."id" FROM "Category" r
           WHERE r."parentId" IS NULL AND r."group" = c."group"
           ORDER BY r."position", r."createdAt" LIMIT 1) AS "rootId"
  FROM "Category" c
  JOIN "Category" p ON p."id" = c."parentId"
  WHERE c."group" <> p."group"
),
moved AS (
  SELECT t."id", t."rootId",
         ROW_NUMBER() OVER (PARTITION BY t."rootId" ORDER BY t."id") - 1
           + COALESCE((SELECT MAX(s."position") + 1 FROM "Category" s WHERE s."parentId" = t."rootId"), 0) AS "position"
  FROM target t
  WHERE t."rootId" IS NOT NULL
)
UPDATE "Category" c
SET "parentId" = m."rootId", "position" = m."position", "updatedAt" = NOW()
FROM moved m
WHERE c."id" = m."id";

-- 3. Còn lệch (không có nhóm gốc nào cùng nhóm hàng) → theo nhóm hàng của nhóm gốc hiện tại;
--    bảng size của nhóm cũ không áp được nữa nên gỡ.
UPDATE "Category" c
SET "group" = p."group",
    "defaultSizeChartId" = CASE
      WHEN c."defaultSizeChartId" IS NOT NULL
       AND (SELECT sc."group" FROM "SizeChart" sc WHERE sc."id" = c."defaultSizeChartId") = p."group"
      THEN c."defaultSizeChartId" ELSE NULL END,
    "updatedAt" = NOW()
FROM "Category" p
WHERE p."id" = c."parentId" AND c."group" <> p."group";
