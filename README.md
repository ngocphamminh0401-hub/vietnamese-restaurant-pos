# Vietnam Restaurant POS

Hệ thống quản lý nhà hàng và điểm bán hàng (POS) toàn diện, xây dựng bằng React + TypeScript cho frontend và Node.js/Express + PostgreSQL cho backend. Hỗ trợ đa vai trò: phục vụ, bếp, thu ngân và quản lý.

## Tính năng chính

### Vai trò & giao diện

| Vai trò | Chức năng |
|---------|-----------|
| **Phục vụ** | Quản lý bàn theo sơ đồ, tạo và cập nhật order, đặt bàn/reservations, thông báo hết hàng real-time |
| **Bếp** | Màn hình bếp kiểu Kanban, cập nhật trạng thái món, đánh dấu hết hàng, lọc theo ưu tiên |
| **Thu ngân** | Xử lý thanh toán, áp dụng giảm giá, lịch sử giao dịch |
| **Quản lý** | Dashboard tổng quan, quản lý menu/kho hàng, nhân viên, đối tác, báo cáo doanh thu |

### Tính năng nổi bật
- **Real-time**: Socket.io đồng bộ trạng thái tức thì giữa các màn hình (bếp, phục vụ, thu ngân)
- **Quản lý đặt bàn**: Tạo, phân bổ, check-in reservation với thông tin đặt cọc
- **Quản lý kho**: Nhập/xuất hàng, cảnh báo tồn kho thấp, kiểm kê
- **Quản lý nhân sự**: Hồ sơ nhân viên, lịch làm việc, chấm công, lịch sử đăng nhập
- **Báo cáo**: Báo cáo cuối ngày, phân tích doanh thu, top món bán chạy

## Công nghệ sử dụng

**Frontend**
- React 19 + TypeScript
- Vite (build tool & dev server)
- Tailwind CSS
- Socket.io-client
- Lucide React (icons)

**Backend**
- Node.js + Express 5
- Prisma ORM
- Socket.io
- PostgreSQL

## Yêu cầu hệ thống

- Node.js v18+
- PostgreSQL 14+
- npm hoặc yarn

## Cài đặt & chạy

### 1. Clone repository

```bash
git clone <repo-url>
cd vietnam-restaurant-pos
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ mẫu:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin kết nối PostgreSQL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/pos_db?schema=public"
```

Tạo bảng và seed dữ liệu mẫu:

```bash
npx prisma db push
npm run db:seed
```

Khởi động backend (port 3001):

```bash
npm run dev
```

### 3. Cài đặt Frontend

Mở terminal mới tại thư mục gốc:

```bash
npm install
npm run dev
```

Truy cập ứng dụng tại **http://localhost:5173**

> Vite tự động proxy `/api` và `/socket.io` đến backend tại `:3001`

### Tài khoản mặc định

| Tài khoản | Mật khẩu | Vai trò |
|-----------|----------|---------|
| `admin` | `123` | Quản lý (toàn quyền) |

## Cấu trúc dự án

```
vietnam-restaurant-pos/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express server & API routes
│   │   └── db.ts              # Prisma client
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   ├── seed.ts            # Seed dữ liệu mẫu
│   │   └── migrations/        # Migration history
│   └── package.json
├── components/
│   ├── WaiterView.tsx         # Giao diện phục vụ
│   ├── KitchenView.tsx        # Màn hình bếp
│   ├── CashierView.tsx        # Giao diện thu ngân
│   ├── ManagerView.tsx        # Dashboard quản lý
│   ├── LoginView.tsx          # Màn hình đăng nhập
│   ├── manager/               # Các module quản lý
│   └── waiter/                # Components phục vụ
├── context/
│   ├── POSContext.tsx         # Global state (orders, tables, menu)
│   └── AuthContext.tsx        # Authentication state
├── types.ts                   # TypeScript interfaces
├── constants.ts               # Dữ liệu cố định
├── App.tsx                    # Root component
└── vite.config.ts
```

## Database Schema

19 model chính trong Prisma:

- **User / LoginHistory** — tài khoản và lịch sử đăng nhập
- **Area / Table** — khu vực và bàn ăn
- **Order / OrderItem** — đơn hàng và từng món
- **MenuItem / MenuCategory** — thực đơn và danh mục
- **Reservation / ReservationTable** — đặt bàn
- **Staff / Customer / Supplier** — nhân sự, khách hàng, nhà cung cấp
- **InventoryItem / ImportTransaction / ExportTransaction** — kho hàng và giao dịch nhập xuất
- **Notification** — thông báo real-time

## API chính

| Endpoint | Mô tả |
|----------|-------|
| `POST /api/auth/login` | Đăng nhập |
| `GET /api/init` | Load toàn bộ dữ liệu khởi động |
| `POST /api/orders/create` | Tạo order mới |
| `POST /api/orders/update-items` | Cập nhật món trong order |
| `POST /api/orders/pay` | Xử lý thanh toán |
| `POST /api/orders/merge` | Gộp order |
| `POST /api/orders/split` | Tách order |
| `POST /api/import/create` | Nhập hàng vào kho |
| `POST /api/export/create` | Xuất hàng khỏi kho |

**Socket.io events:**
- `DATA_UPDATED` — broadcast khi có thay đổi dữ liệu
- `NEW_NOTIFICATION` — thông báo hệ thống
- `ITEM_OUT_OF_STOCK` — cảnh báo hết hàng cho phục vụ

## Scripts

**Frontend:**
```bash
npm run dev      # Chạy dev server
npm run build    # Build production
npm run preview  # Preview bản build
```

**Backend:**
```bash
npm run dev      # Chạy với nodemon (hot-reload)
npm start        # Production
npm run db:seed  # Seed dữ liệu mẫu
```
