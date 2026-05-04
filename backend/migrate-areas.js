const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('🔄 Starting migration...');
    
    // Bước 1: Tạo bảng Area bằng raw SQL
    console.log('📝 Creating Area table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Area" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL UNIQUE,
        "name" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Bước 2: Thêm dữ liệu mẫu
    console.log('📝 Inserting default areas...');
    const areas = [
      { id: '550e8400-e29b-41d4-a716-446655440001', code: 'FLOOR_1', name: 'Tầng 1', sortOrder: 1 },
      { id: '550e8400-e29b-41d4-a716-446655440002', code: 'FLOOR_2', name: 'Tầng 2', sortOrder: 2 },
      { id: '550e8400-e29b-41d4-a716-446655440003', code: 'VIP', name: 'VIP', sortOrder: 3 },
      { id: '550e8400-e29b-41d4-a716-446655440004', code: 'TAKEAWAY', name: 'Mang về', sortOrder: 4 }
    ];
    
    for (const area of areas) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "Area" ("id", "code", "name", "isActive", "sortOrder", "createdAt")
        VALUES ($1, $2, $3, true, $4, CURRENT_TIMESTAMP)
        ON CONFLICT ("code") DO NOTHING
      `, area.id, area.code, area.name, area.sortOrder);
    }
    
    // Bước 3: Thêm cột areaId vào Table
    console.log('📝 Adding areaId column to Table...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "areaId" TEXT
    `);
    
    // Bước 4: Migrate dữ liệu từ area sang areaId
    console.log('📝 Migrating existing table data...');
    await prisma.$executeRawUnsafe(`
      UPDATE "Table" SET "areaId" = 
        CASE 
          WHEN "area" = 'FLOOR_1' THEN '550e8400-e29b-41d4-a716-446655440001'
          WHEN "area" = 'FLOOR_2' THEN '550e8400-e29b-41d4-a716-446655440002'
          WHEN "area" = 'VIP' THEN '550e8400-e29b-41d4-a716-446655440003'
          WHEN "area" = 'TAKEAWAY' THEN '550e8400-e29b-41d4-a716-446655440004'
          ELSE '550e8400-e29b-41d4-a716-446655440001'
        END
      WHERE "areaId" IS NULL
    `);
    
    // Bước 5: Thêm foreign key
    console.log('📝 Adding foreign key constraint...');
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Table" 
        ADD CONSTRAINT "Table_areaId_fkey" 
        FOREIGN KEY ("areaId") REFERENCES "Area"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE
      `);
    } catch (e) {
      console.log('ℹ️  Foreign key already exists or error:', e.message);
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Areas created:');
    const allAreas = await prisma.area.findMany();
    console.table(allAreas);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });
