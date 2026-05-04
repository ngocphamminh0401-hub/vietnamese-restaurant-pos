// Script để cập nhật hình ảnh cho các món đồ uống
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDrinkImages() {
  try {
    console.log('🔄 Bắt đầu cập nhật hình ảnh món đồ uống...');

    // Hình ảnh phù hợp cho các món đồ uống Việt Nam
    const drinkUpdates = [
      {
        name: 'Trà Đá',
        image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=300&q=80', // Vietnamese iced tea
        description: 'Trà đá Việt Nam'
      },
      {
        name: 'Coca',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=300&q=80', // Coca Cola
        description: 'Coca Cola'
      },
      {
        name: 'Coca Cola',
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=300&q=80', // Coca Cola
        description: 'Coca Cola'
      },
      {
        name: 'Nước lọc',
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=300&q=80', // Bottled water
        description: 'Nước lọc đóng chai'
      },
      {
        name: 'Nước Lọc',
        image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=300&q=80', // Bottled water
        description: 'Nước lọc đóng chai'
      },
      {
        name: 'Cà Phê Sữa Đá',
        image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=300&q=80', // Vietnamese iced coffee
        description: 'Cà phê sữa đá Việt Nam'
      },
      {
        name: 'Nước Cam Ép',
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=300&q=80', // Fresh orange juice
        description: 'Nước cam vắt tươi'
      }
    ];

    let updated = 0;
    let notFound = 0;

    for (const drink of drinkUpdates) {
      const result = await prisma.menuItem.updateMany({
        where: { name: drink.name },
        data: { image: drink.image }
      });

      if (result.count > 0) {
        console.log(`✅ Đã cập nhật hình ảnh cho: ${drink.name} (${result.count} món)`);
        updated += result.count;
      } else {
        console.log(`⚠️  Không tìm thấy món: ${drink.name}`);
        notFound++;
      }
    }

    console.log('\n📊 Tóm tắt:');
    console.log(`   ✅ Đã cập nhật: ${updated} món`);
    console.log(`   ⚠️  Không tìm thấy: ${notFound} món`);
    console.log('\n✨ Hoàn thành!');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDrinkImages();
