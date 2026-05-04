// Script sắp xếp lại thứ tự danh mục món ăn
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Thứ tự mong muốn: Lẩu → Món chính → Món phụ → Đồ uống
const categoryOrder = [
  { name: 'Lẩu', sortOrder: 0 },
  { name: 'Món chính', sortOrder: 1 },
  { name: 'Món phụ', sortOrder: 2 },
  { name: 'Đồ uống', sortOrder: 3 }
];

async function reorderCategories() {
  try {
    console.log('🔄 BẮT ĐẦU SẮP XẾP LẠI DANH MỤC MÓN ĂN\n');

    let updated = 0;
    let created = 0;

    for (const cat of categoryOrder) {
      // Kiểm tra xem category đã tồn tại chưa
      const existing = await prisma.menuCategory.findFirst({
        where: { name: cat.name }
      });

      if (existing) {
        // Cập nhật sortOrder
        await prisma.menuCategory.update({
          where: { id: existing.id },
          data: { sortOrder: cat.sortOrder }
        });
        console.log(`✅ Đã cập nhật: ${cat.name} → Thứ tự ${cat.sortOrder}`);
        updated++;
      } else {
        // Tạo mới nếu chưa có
        await prisma.menuCategory.create({
          data: {
            name: cat.name,
            sortOrder: cat.sortOrder
          }
        });
        console.log(`➕ Đã tạo mới: ${cat.name} → Thứ tự ${cat.sortOrder}`);
        created++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 KẾT QUẢ:');
    console.log(`   ✅ Đã cập nhật: ${updated} danh mục`);
    console.log(`   ➕ Đã tạo mới: ${created} danh mục`);
    console.log('='.repeat(50));

    // Hiển thị danh sách sau khi sắp xếp
    console.log('\n📋 THỨ TỰ MỚI:');
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    categories.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.name} (sortOrder: ${cat.sortOrder})`);
    });

    console.log('\n✨ HOÀN THÀNH!\n');
    console.log('💡 Làm mới trình duyệt để thấy thứ tự mới!\n');

  } catch (error) {
    console.error('❌ LỖI:', error);
  } finally {
    await prisma.$disconnect();
  }
}

reorderCategories();
