# Hướng dẫn sử dụng AI để cập nhật hình ảnh món ăn

## 🤖 Tính năng

Script `ai-update-images.js` tự động tìm và cập nhật hình ảnh cho tất cả món ăn trong menu dựa trên tên món, sử dụng Unsplash API.

## 🚀 Cách sử dụng

### Phương án 1: Chế độ Demo (Không cần API key)

```bash
cd backend
node ai-update-images.js
```

Script sẽ sử dụng Unsplash Source để tự động tạo URL hình ảnh.

### Phương án 2: Sử dụng API chính thức (Khuyến nghị)

#### Bước 1: Lấy Unsplash API Key

1. Truy cập https://unsplash.com/developers
2. Đăng nhập hoặc tạo tài khoản
3. Nhấn "New Application"
4. Điền thông tin ứng dụng:
   - Application name: "Vietnam Restaurant POS"
   - Description: "Automatically update food images"
5. Chấp nhận điều khoản và tạo ứng dụng
6. Copy **Access Key**

#### Bước 2: Cấu hình API Key

**Windows PowerShell:**
```powershell
$env:UNSPLASH_ACCESS_KEY="your_access_key_here"
cd backend
node ai-update-images.js
```

**Windows CMD:**
```cmd
set UNSPLASH_ACCESS_KEY=your_access_key_here
cd backend
node ai-update-images.js
```

**Linux/Mac:**
```bash
export UNSPLASH_ACCESS_KEY=your_access_key_here
cd backend
node ai-update-images.js
```

#### Bước 3: Lưu vĩnh viễn (Optional)

Tạo file `.env` trong thư mục `backend`:

```env
UNSPLASH_ACCESS_KEY=your_access_key_here
```

Cài đặt dotenv:
```bash
npm install dotenv
```

Thêm vào đầu file `ai-update-images.js`:
```javascript
require('dotenv').config();
```

## 📝 Tùy chỉnh từ khóa tìm kiếm

Mở file `ai-update-images.js` và chỉnh sửa object `dishKeywords`:

```javascript
const dishKeywords = {
  'Phở Bò': 'vietnamese beef pho noodle soup',
  'Cơm Sườn': 'vietnamese grilled pork chop rice',
  'Trà Đá': 'vietnamese iced tea',
  // Thêm món mới...
};
```

## 🎨 Chọn hình ảnh thủ công

Nếu muốn chọn hình ảnh thủ công từ Unsplash:

1. Truy cập https://unsplash.com
2. Tìm kiếm món ăn (ví dụ: "vietnamese pho")
3. Chọn hình ảnh phù hợp
4. Nhấn nút Download để lấy URL
5. Copy URL và cập nhật trực tiếp trong database hoặc Manager View

## 🔧 Xử lý lỗi

### Lỗi: "Rate limit exceeded"
- Đợi 1 giờ hoặc đăng ký API key để tăng limit
- Script có delay 500ms giữa các request

### Lỗi: "No images found"
- Thử thay đổi từ khóa tìm kiếm trong `dishKeywords`
- Sử dụng từ khóa tiếng Anh đơn giản hơn

### Hình ảnh không đúng món
- Cập nhật từ khóa cụ thể hơn trong `dishKeywords`
- Thêm "vietnamese" vào đầu từ khóa

## 💡 Mẹo

1. **Chạy script sau khi thêm món mới vào menu**
2. **Backup database trước khi chạy lần đầu**
3. **Kiểm tra kết quả trên giao diện sau khi cập nhật**
4. **Sử dụng API key để có hình chất lượng cao nhất**

## 🌟 Nâng cấp

Để sử dụng AI tạo hình (như DALL-E, Midjourney):

1. Đăng ký OpenAI API
2. Sửa hàm `getImageFromUnsplashAPI` thành `getImageFromOpenAI`
3. Gọi DALL-E API với prompt: `"Food photography of ${dishName}, vietnamese cuisine, professional, appetizing"`

## 📞 Hỗ trợ

- Unsplash API Docs: https://unsplash.com/documentation
- Rate Limits: 50 requests/hour (demo), 5000 requests/hour (registered)
