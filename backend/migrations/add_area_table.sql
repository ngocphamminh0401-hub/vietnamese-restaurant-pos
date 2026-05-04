-- Migration: Add Area table and update Table schema
-- Tạo bảng Area để quản lý khu vực

-- Tạo bảng Area
CREATE TABLE IF NOT EXISTS "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Thêm dữ liệu mẫu cho Area
INSERT INTO "Area" ("id", "code", "name", "isActive", "sortOrder") VALUES
('area-1', 'FLOOR_1', 'Tầng 1', true, 1),
('area-2', 'FLOOR_2', 'Tầng 2', true, 2),
('area-3', 'VIP', 'VIP', true, 3),
('area-4', 'TAKEAWAY', 'Mang về', true, 4)
ON CONFLICT ("code") DO NOTHING;

-- Thêm cột areaId vào bảng Table (nếu chưa có)
ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "areaId" TEXT;

-- Migrate dữ liệu cũ: chuyển area sang areaId
UPDATE "Table" SET "areaId" = 
    CASE 
        WHEN "area" = 'FLOOR_1' THEN 'area-1'
        WHEN "area" = 'FLOOR_2' THEN 'area-2'
        WHEN "area" = 'VIP' THEN 'area-3'
        WHEN "area" = 'TAKEAWAY' THEN 'area-4'
        ELSE 'area-1'
    END
WHERE "areaId" IS NULL;

-- Xóa cột area cũ (nếu cần)
-- ALTER TABLE "Table" DROP COLUMN "area";

-- Thêm foreign key constraint
-- ALTER TABLE "Table" ADD CONSTRAINT "Table_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
