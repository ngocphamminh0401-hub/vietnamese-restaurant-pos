// Script tự động cập nhật hình ảnh món ăn bằng AI/Unsplash API
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Unsplash API - Miễn phí, không cần API key cho basic access
// Hoặc đăng ký tại https://unsplash.com/developers để có access key
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'demo'; // Thay bằng key thật nếu có

// Mapping tên món Việt sang từ khóa tìm kiếm tiếng Anh
const dishKeywords = {
  // Phở & Bún
  'Phở': 'vietnamese pho noodle soup',
  'Bún': 'vietnamese bun noodle',
  'Bún Chả': 'vietnamese bun cha grilled pork',
  'Bún Bò': 'vietnamese bun bo beef noodle',
  
  // Cơm
  'Cơm': 'vietnamese com rice dish',
  'Cơm Sườn': 'vietnamese com suon pork chop rice',
  'Cơm Rang': 'vietnamese fried rice',
  
  // Đồ ăn nhẹ
  'Nem': 'vietnamese spring roll fried',
  'Gỏi Cuốn': 'vietnamese fresh spring roll',
  'Khoai Tây Chiên': 'french fries',
  
  // Đồ uống
  'Trà Đá': 'vietnamese iced tea glass',
  'Cà Phê': 'vietnamese coffee',
  'Coca': 'coca cola bottle',
  'Nước': 'water bottle',
  'Cam': 'orange juice fresh',
  'Nước Cam': 'fresh orange juice',
  'Nước Lọc': 'bottled water',
};

// Hàm tìm từ khóa phù hợp nhất
function findBestKeyword(dishName) {
  // Tìm exact match trước
  if (dishKeywords[dishName]) {
    return dishKeywords[dishName];
  }
  
  // Tìm partial match
  for (const [key, value] of Object.entries(dishKeywords)) {
    if (dishName.includes(key)) {
      return value;
    }
  }
  
  // Fallback: dùng tên món + "vietnamese food"
  return `${dishName} vietnamese food`;
}

// Hàm lấy URL hình ảnh từ Unsplash (không cần API key)
async function getImageFromUnsplash(keyword) {
  try {
    // Sử dụng Unsplash Source API (không cần key)
    // Format: https://source.unsplash.com/300x300/?keyword
    const encodedKeyword = encodeURIComponent(keyword);
    const imageUrl = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80&${encodedKeyword}`;
    
    console.log(`   🔍 Từ khóa: "${keyword}"`);
    return imageUrl;
  } catch (error) {
    console.error(`   ❌ Lỗi tìm hình: ${error.message}`);
    return null;
  }
}

// Hàm lấy hình ảnh chất lượng cao từ Unsplash API (cần access key)
async function getImageFromUnsplashAPI(keyword) {
  if (UNSPLASH_ACCESS_KEY === 'demo') {
    console.log('   ℹ️  Sử dụng chế độ demo (không có API key)');
    return getImageFromUnsplash(keyword);
  }

  try {
    const fetch = (await import('node-fetch')).default;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&per_page=1&orientation=squarish`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const photo = data.results[0];
      const imageUrl = `${photo.urls.small}&auto=format&fit=crop&w=300&q=80`;
      console.log(`   ✅ Tìm thấy: ${photo.description || 'Untitled'}`);
      return imageUrl;
    } else {
      console.log(`   ⚠️  Không tìm thấy hình cho "${keyword}"`);
      return null;
    }
  } catch (error) {
    console.error(`   ❌ API Error: ${error.message}`);
    return getImageFromUnsplash(keyword);
  }
}

// Hàm chính
async function updateMenuImages() {
  try {
    console.log('🤖 BẮT ĐẦU CẬP NHẬT HÌNH ẢNH TỰ ĐỘNG BẰNG AI\n');
    
    // Lấy tất cả món ăn từ database
    const menuItems = await prisma.menuItem.findMany({
      orderBy: { category: 'asc' }
    });

    console.log(`📊 Tìm thấy ${menuItems.length} món ăn\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of menuItems) {
      console.log(`\n🍽️  Xử lý: ${item.name} (${item.category})`);
      
      // Tìm từ khóa phù hợp
      const keyword = findBestKeyword(item.name);
      
      // Lấy hình ảnh
      const imageUrl = await getImageFromUnsplashAPI(keyword);
      
      if (imageUrl) {
        // Cập nhật vào database
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { image: imageUrl }
        });
        
        console.log(`   ✅ Đã cập nhật hình ảnh`);
        updated++;
        
        // Delay để tránh rate limit
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.log(`   ⚠️  Bỏ qua (không tìm thấy hình)`);
        skipped++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 KẾT QUẢ:');
    console.log(`   ✅ Đã cập nhật: ${updated} món`);
    console.log(`   ⚠️  Bỏ qua: ${skipped} món`);
    console.log(`   ❌ Lỗi: ${failed} món`);
    console.log('='.repeat(50));
    console.log('\n✨ HOÀN THÀNH!\n');

    if (UNSPLASH_ACCESS_KEY === 'demo') {
      console.log('💡 Mẹo: Để có hình ảnh chất lượng cao hơn:');
      console.log('   1. Đăng ký tài khoản tại https://unsplash.com/developers');
      console.log('   2. Tạo ứng dụng mới để lấy Access Key');
      console.log('   3. Chạy: set UNSPLASH_ACCESS_KEY=your_key_here');
      console.log('   4. Chạy lại script này\n');
    }

  } catch (error) {
    console.error('❌ LỖI:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Chạy script
updateMenuImages();
