-- Nhóm thuộc tính chuyển từ enum cố định sang bảng để admin thêm được nhóm cha mới (đặc tính thiết kế).
-- 7 nhóm cũ thành nhóm hệ thống (isSystem, không xóa được), giữ đúng mã cũ. Có bước chuyển dữ liệu: mọi giá trị
-- thuộc tính được gắn sang nhóm tương ứng trước khi bỏ cột enum.

-- 1. Đổi tên kiểu enum cũ để bảng mới dùng được tên "AttributeGroup" (bảng tạo kiểu composite cùng tên)
ALTER TYPE "AttributeGroup" RENAME TO "AttributeGroup_old";

-- 2. Bảng nhóm thuộc tính
CREATE TABLE "AttributeGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "descriptionEn" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttributeGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AttributeGroup_code_key" ON "AttributeGroup"("code");
CREATE INDEX "AttributeGroup_position_idx" ON "AttributeGroup"("position");

-- 3. Nhóm hệ thống (khớp ATTRIBUTE_SYSTEM_GROUPS ở seed)
INSERT INTO "AttributeGroup" ("id", "code", "name", "nameEn", "description", "descriptionEn", "isSystem", "position", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'COLOR', 'Màu sắc', 'Colours',
   'Màu của biến thể SKU. Gom theo họ màu để khách lọc trên cửa hàng.',
   'SKU variant colours, grouped into colour families for store filters.', true, 0, NOW()),
  (gen_random_uuid()::text, 'SIZE', 'Kích thước', 'Sizes',
   'Ký hiệu size của biến thể SKU, xếp từ nhỏ đến lớn — khớp với hàng trong bảng size.',
   'SKU size labels from smallest to largest — matching size chart rows.', true, 1, NOW()),
  (gen_random_uuid()::text, 'NECKLINE', 'Kiểu cổ áo', 'Necklines',
   'Cổ trụ, cổ thuyền, cổ tim... dùng để lọc và mô tả sản phẩm.',
   'Mandarin, boat, V-neck... used to filter and describe products.', true, 2, NOW()),
  (gen_random_uuid()::text, 'SLEEVE', 'Kiểu tay áo', 'Sleeves',
   'Tay dài, tay lửng, tay raglan...', 'Long, three-quarter, raglan...', true, 3, NOW()),
  (gen_random_uuid()::text, 'PATTERN_TECHNIQUE', 'Kỹ thuật họa tiết', 'Pattern techniques',
   'Thêu tay, vẽ tay, đính kết, in, dệt hoa văn...', 'Hand embroidery, hand painting, beading, print, woven motifs...', true, 4, NOW()),
  (gen_random_uuid()::text, 'FLAP_LENGTH', 'Chiều dài tà', 'Flap lengths',
   'Tà ngắn qua gối, tà dài chấm gót, tà xẻ cao...', 'Knee-length, ankle-length, high slit...', true, 5, NOW()),
  (gen_random_uuid()::text, 'OCCASION', 'Dịp sử dụng', 'Occasions',
   'Cưới hỏi, lễ Tết, công sở, chụp ảnh...', 'Weddings, Tết, office, photoshoots...', true, 6, NOW());

-- 4. Giá trị thuộc tính gắn sang nhóm theo mã enum cũ
ALTER TABLE "AttributeValue" ADD COLUMN "groupId" TEXT;

UPDATE "AttributeValue" AS v
SET "groupId" = g."id"
FROM "AttributeGroup" AS g
WHERE g."code" = v."group"::text;

ALTER TABLE "AttributeValue" ALTER COLUMN "groupId" SET NOT NULL;

-- 5. Bỏ cột / chỉ mục / kiểu enum cũ, tạo chỉ mục theo groupId
DROP INDEX "AttributeValue_group_position_idx";
DROP INDEX "AttributeValue_group_code_key";
ALTER TABLE "AttributeValue" DROP COLUMN "group";
DROP TYPE "AttributeGroup_old";

CREATE INDEX "AttributeValue_groupId_position_idx" ON "AttributeValue"("groupId", "position");
CREATE UNIQUE INDEX "AttributeValue_groupId_code_key" ON "AttributeValue"("groupId", "code");

ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "AttributeGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
