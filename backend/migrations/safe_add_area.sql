-- Safe Migration Script
-- Chạy script này trực tiếp trong PostgreSQL để migrate dữ liệu an toàn

-- Bước 1: Tạo bảng Area
CREATE TABLE IF NOT EXISTS "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bước 2: Thêm dữ liệu mẫu cho Area
INSERT INTO "Area" ("id", "code", "name", "isActive", "sortOrder", "createdAt") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'FLOOR_1', 'Tầng 1', true, 1, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440002', 'FLOOR_2', 'Tầng 2', true, 2, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440003', 'VIP', 'VIP', true, 3, CURRENT_TIMESTAMP),
('550e8400-e29b-41d4-a716-446655440004', 'TAKEAWAY', 'Mang về', true, 4, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

-- Bước 3: Thêm cột areaId (nullable trước)
ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "areaId" TEXT;

-- Bước 4: Migrate dữ liệu cũ từ area sang areaId
UPDATE "Table" SET "areaId" = 
    CASE 
        WHEN "area" = 'FLOOR_1' THEN '550e8400-e29b-41d4-a716-446655440001'
        WHEN "area" = 'FLOOR_2' THEN '550e8400-e29b-41d4-a716-446655440002'
        WHEN "area" = 'VIP' THEN '550e8400-e29b-41d4-a716-446655440003'
        WHEN "area" = 'TAKEAWAY' THEN '550e8400-e29b-41d4-a716-446655440004'
        ELSE '550e8400-e29b-41d4-a716-446655440001' -- Default to Floor 1
    END
WHERE "areaId" IS NULL;

-- Bước 5: Thêm foreign key constraint
ALTER TABLE "Table" 
    ADD CONSTRAINT IF NOT EXISTS "Table_areaId_fkey" 
    FOREIGN KEY ("areaId") REFERENCES "Area"("id") 
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Bước 6: Xóa cột area cũ (sau khi đã migrate xong và test)
-- Uncomment dòng này sau khi đã test:
-- ALTER TABLE "Table" DROP COLUMN IF EXISTS "area";
