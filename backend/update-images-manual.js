// Script cập nhật hình ảnh thủ công cho món ăn
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ========================================
// CHỈNH SỬA HÌNH ẢNH TẠI ĐÂY
// ========================================
const manualImages = {
  // ĐỒ UỐNG
  'Trà Đá': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=300&q=80',
  'Coca': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=300&q=80',
  'Coca Cola': 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=300&q=80',
  'Nước lọc': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=300&q=80',
  'Nước Lọc': 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=300&q=80',
  'Cà Phê Sữa Đá': 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=300&q=80',
  'Nước Cam Ép': 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=300&q=80',

  // PHỞ & BÚN
  'Phở Bò': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=300&q=80',
  'Phở Gà': 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=300&q=80',
  'Bún Chả': 'https://images.unsplash.com/photo-1594614271360-055d78299553?auto=format&fit=crop&w=300&q=80',
  'Bún Bò Huế': 'https://images.unsplash.com/photo-1633469924738-52101af51d87?auto=format&fit=crop&w=300&q=80',

  // CƠM
  'Cơm Tấm': 'https://images.unsplash.com/photo-1603133872878-684f208fb74b?auto=format&fit=crop&w=300&q=80',
  'Cơm Sườn': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
  'Cơm Rang': 'https://images.unsplash.com/photo-1603133872878-684f208fb74b?auto=format&fit=crop&w=300&q=80',

  // LẨU
  'Lẩu dê': 'https://images.unsplash.com/photo-1583663295773-3f657b40b94b?auto=format&fit=crop&w=300&q=80',
  'Lẩu chân dê': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=300&q=80',
  'Lẩu xương tủy': 'https://images.unsplash.com/photo-1601000938259-9e92002320b2?auto=format&fit=crop&w=300&q=80',
  'Lẩu đuôi, lưỡi': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=300&q=80',

  // MÓN PHỤ
  'Gỏi Cuốn': 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=300&q=80',
  'Nem Rán': 'https://images.unsplash.com/photo-1564436872-f6d81182df12?auto=format&fit=crop&w=300&q=80',
  'Khoai Tây Chiên': 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=300&q=80',
};

// ========================================
// MẸO TÌM HÌNH ẢNH CHẤT LƯỢNG CAO
// ========================================
// 1. Truy cập: https://unsplash.com
// 2. Tìm kiếm món ăn (tiếng Anh): "vietnamese pho", "spring roll", "iced tea"
// 3. Chọn hình đẹp, click vào
// 4. Chuột phải vào hình > Copy image address
// 5. Paste vào object manualImages ở trên
// 6. Thêm "?auto=format&fit=crop&w=300&q=80" vào cuối URL

// ========================================
// CHẠY SCRIPT
// ========================================
async function updateManualImages() {
  try {
    console.log('🎨 BẮT ĐẦU CẬP NHẬT HÌNH ẢNH THỦ CÔNG\n');
    console.log(`📝 Có ${Object.keys(manualImages).length} món cần cập nhật\n`);

    let updated = 0;
    let notFound = 0;

    for (const [dishName, imageUrl] of Object.entries(manualImages)) {
      console.log(`🍽️  ${dishName}`);
      
      const result = await prisma.menuItem.updateMany({
        where: { name: dishName },
        data: { image: imageUrl }
      });

      if (result.count > 0) {
        console.log(`   ✅ Đã cập nhật (${result.count} món)\n`);
        updated += result.count;
      } else {
        console.log(`   ⚠️  Không tìm thấy món trong database\n`);
        notFound++;
      }
    }

    console.log('='.repeat(50));
    console.log('📊 KẾT QUẢ:');
    console.log(`   ✅ Đã cập nhật: ${updated} món`);
    console.log(`   ⚠️  Không tìm thấy: ${notFound} món`);
    console.log('='.repeat(50));
    console.log('\n✨ HOÀN THÀNH!\n');
    
    console.log('💡 Làm mới trình duyệt để xem thay đổi!\n');

  } catch (error) {
    console.error('❌ LỖI:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateManualImages();
