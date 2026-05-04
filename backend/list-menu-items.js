// Script hiển thị danh sách tất cả món ăn và URL hình ảnh hiện tại
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listAllMenuItems() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📋 DANH SÁCH TẤT CẢ MÓN ĂN VÀ HÌNH ẢNH HIỆN TẠI');
    console.log('='.repeat(80) + '\n');

    const menuItems = await prisma.menuItem.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    let currentCategory = '';
    
    menuItems.forEach((item, index) => {
      if (item.category !== currentCategory) {
        currentCategory = item.category;
        console.log('\n' + '─'.repeat(80));
        console.log(`📂 ${currentCategory.toUpperCase()}`);
        console.log('─'.repeat(80));
      }
      
      console.log(`\n${index + 1}. ${item.name}`);
      console.log(`   💰 Giá: ${item.price.toLocaleString()}đ`);
      console.log(`   📊 Trạng thái: ${item.isActive ? '✅ Đang bán' : '❌ Ngừng bán'}`);
      console.log(`   🖼️  Hình: ${item.image.substring(0, 80)}...`);
    });

    console.log('\n' + '='.repeat(80));
    console.log(`📊 TỔNG CỘNG: ${menuItems.length} món`);
    console.log('='.repeat(80) + '\n');

    // Thống kê theo danh mục
    const categories = {};
    menuItems.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });

    console.log('📈 THỐNG KÊ THEO DANH MỤC:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} món`);
    });
    console.log();

  } catch (error) {
    console.error('❌ LỖI:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listAllMenuItems();
