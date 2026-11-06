-- Nhóm gốc (cố định theo nhóm hàng) không còn bảng size — bảng size gắn ở từng loại sản phẩm.
-- Chuyển dữ liệu: loại con chưa gắn bảng đang thừa hưởng bảng của nhóm gốc (cùng nhóm hàng) → gắn thẳng bảng đó,
-- để sản phẩm đang dùng bảng size không bị mất bảng; sau đó bỏ bảng size ở nhóm gốc.

UPDATE "Category" AS c
SET "defaultSizeChartId" = p."defaultSizeChartId"
FROM "Category" AS p
WHERE c."parentId" = p."id"
  AND c."defaultSizeChartId" IS NULL
  AND p."defaultSizeChartId" IS NOT NULL
  AND c."group" = p."group";

UPDATE "Category"
SET "defaultSizeChartId" = NULL
WHERE "parentId" IS NULL
  AND "defaultSizeChartId" IS NOT NULL;
