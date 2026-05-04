# Kiến trúc Hệ thống Vietnam Restaurant POS

Hệ thống được thiết kế theo mô hình **Client-Server** thời gian thực, tối ưu cho việc vận hành trong môi trường nhà hàng với độ trễ thấp.

## 1. Thành phần Công nghệ (Tech Stack)

### Frontend (Client)
- **Framework:** React 19 (Vite)
- **Styling:** Tailwind CSS
- **State Management:** React Context API (`POSContext`)
- **Real-time:** Socket.io-client

### Backend (Server)
- **Runtime:** Node.js (Express)
- **ORM:** Prisma
- **Real-time:** Socket.io
- **Language:** TypeScript

### Database
- **Engine:** PostgreSQL (Mạnh mẽ, hỗ trợ quan hệ dữ liệu phức tạp và quy mô lớn).
- **Connection:** Thông qua biến môi trường `DATABASE_URL`.

## 2. Luồng dữ liệu chính (Data Flow)

1.  **Waiter (Phục vụ):** Chọn bàn -> Tạo Order. `POSContext` gửi request tới API -> Server lưu vào PostgreSQL -> Server phát tín hiệu `DATA_UPDATED` qua Socket.
2.  **Kitchen (Bếp):** Nhận tín hiệu Socket -> Fetch lại dữ liệu. Đầu bếp cập nhật trạng thái món -> API -> PostgreSQL -> Socket -> Waiter thấy trạng thái mới.
3.  **Cashier (Thu ngân):** Xử lý thanh toán -> API cập nhật đơn hàng thành `COMPLETED` trong PostgreSQL và giải phóng bàn.
4.  **Manager (Quản lý):** Truy vấn báo cáo trực tiếp từ PostgreSQL để phân tích doanh thu.

## 3. Cấu hình triển khai
Để kết nối PostgreSQL, cần tạo file `backend/.env` với nội dung:
`DATABASE_URL="postgresql://user:password@localhost:5432/pos_db?schema=public"`

Sau đó chạy lệnh:
1. `cd backend`
2. `npx prisma db push` để tạo cấu trúc bảng.
