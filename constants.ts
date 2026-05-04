
import { MenuItem, Table, TableStatus, Customer, Supplier, Staff, WorkShift, TimeRecord, InventoryItem, InventoryCheck, Order, ItemStatus } from './types';

export const CATEGORIES = ['Phở & Bún', 'Cơm', 'Đồ ăn nhẹ', 'Đồ uống'];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'm1',
    name: 'Phở Bò Tái',
    price: 55000,
    category: 'Phở & Bún',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=300&q=80',
    unit: 'Bát',
    isActive: true
  },
  {
    id: 'm2',
    name: 'Phở Gà Ta',
    price: 50000,
    category: 'Phở & Bún',
    image: 'https://images.unsplash.com/photo-1633469924738-52101af51d87?auto=format&fit=crop&w=300&q=80',
    unit: 'Bát',
    isActive: true
  },
  {
    id: 'm3',
    name: 'Bún Chả Hà Nội',
    price: 60000,
    category: 'Phở & Bún',
    image: 'https://images.unsplash.com/photo-1594614271360-055d78299553?auto=format&fit=crop&w=300&q=80',
    unit: 'Suất',
    isActive: true
  },
  {
    id: 'm4',
    name: 'Cơm Rang Dưa Bò',
    price: 65000,
    category: 'Cơm',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb74b?auto=format&fit=crop&w=300&q=80',
    unit: 'Đĩa',
    isActive: true
  },
  {
    id: 'm5',
    name: 'Cơm Sườn Bì Chả',
    price: 70000,
    category: 'Cơm',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80',
    unit: 'Đĩa',
    isActive: true
  },
  {
    id: 'm6',
    name: 'Nem Rán (3 cái)',
    price: 30000,
    category: 'Đồ ăn nhẹ',
    image: 'https://images.unsplash.com/photo-1564436872-f6d81182df12?auto=format&fit=crop&w=300&q=80',
    unit: 'Đĩa',
    isActive: true
  },
  {
    id: 'm7',
    name: 'Khoai Tây Chiên',
    price: 40000,
    category: 'Đồ ăn nhẹ',
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=300&q=80',
    unit: 'Đĩa',
    isActive: true
  },
  {
    id: 'm8',
    name: 'Trà Đá',
    price: 5000,
    category: 'Đồ uống',
    image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?auto=format&fit=crop&w=300&q=80',
    unit: 'Cốc',
    isActive: true
  },
  {
    id: 'm9',
    name: 'Cà Phê Sữa Đá',
    price: 25000,
    category: 'Đồ uống',
    image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=300&q=80',
    unit: 'Cốc',
    isActive: true
  },
  {
    id: 'm10',
    name: 'Nước Cam Ép',
    price: 45000,
    category: 'Đồ uống',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=300&q=80',
    unit: 'Cốc',
    isActive: true
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
    { id: 'inv1', code: 'NL001', name: 'Thịt Bò Thăn', category: 'Thực phẩm tươi', unit: 'kg', price: 250000, quantity: 15.5, costPrice: 250000, stockQuantity: 15.5, minStock: 5 },
    { id: 'inv2', code: 'NL002', name: 'Gà Ta Nguyên Con', category: 'Thực phẩm tươi', unit: 'kg', price: 120000, quantity: 10, costPrice: 120000, stockQuantity: 10, minStock: 3 },
    { id: 'inv3', code: 'NL003', name: 'Bánh Phở Tươi', category: 'Thực phẩm khô', unit: 'kg', price: 25000, quantity: 30, costPrice: 25000, stockQuantity: 30, minStock: 10 },
    { id: 'inv4', code: 'DU001', name: 'Bia Hà Nội', category: 'Đồ uống đóng chai', unit: 'két', price: 230000, quantity: 20, costPrice: 230000, stockQuantity: 20, minStock: 5 },
    { id: 'inv5', code: 'DU002', name: 'Coca Cola', category: 'Đồ uống đóng chai', unit: 'thùng', price: 180000, quantity: 12, costPrice: 180000, stockQuantity: 12, minStock: 5 },
];

export const INITIAL_CHECKS: InventoryCheck[] = [
    { id: 'chk1', code: 'KK001', date: '2023-10-25', status: 'COMPLETED', creator: 'Trần Văn Bếp', note: 'Kiểm kê cuối tháng', totalVariance: -150000 },
    { id: 'chk2', code: 'KK002', date: '2023-11-01', status: 'DRAFT', creator: 'Lê Thị Thu Ngân', note: '', totalVariance: 0 },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', code: 'KH001', name: 'Nguyễn Văn A', type: 'PERSONAL', phone: '0901234567', address: 'Hà Nội' },
  { id: 'c2', code: 'KH002', name: 'Công ty ABC', type: 'COMPANY', phone: '0909888777', address: 'Đống Đa, HN' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', code: 'NCC001', name: 'Thực phẩm Sạch HN', type: 'COMPANY', phone: '0243999888', address: 'Hoàn Kiếm, HN', email: 'contact@cleanfood.vn' },
  { id: 's2', code: 'NCC002', name: 'Đại lý Bia Việt', type: 'PERSONAL', phone: '0903334444', address: 'Cầu Giấy, HN' }
];

export const INITIAL_STAFF: Staff[] = [
  { id: 'st1', code: 'NV001', name: 'Trần Văn Bếp', phone: '0988111222', role: 'CHEF', department: 'Bếp', cccd: '001234567890', gender: 'MALE', startDate: '2023-01-01', address: 'Hà Nội', status: 'ACTIVE' },
  { id: 'st2', code: 'NV002', name: 'Lê Thị Thu Ngân', phone: '0988333444', role: 'CASHIER', department: 'Kế toán', cccd: '001234567891', gender: 'FEMALE', startDate: '2023-02-15', address: 'Hà Nội', status: 'ACTIVE' },
  { id: 'st3', code: 'NV003', name: 'Nguyễn Văn Phục Vụ', phone: '0988555666', role: 'WAITER', department: 'Bàn', cccd: '001234567892', gender: 'MALE', startDate: '2023-03-10', address: 'Hà Nội', status: 'ACTIVE' }
];

// Mock shifts for current week
const today = new Date();
const dateString = today.toISOString().slice(0, 10);

export const INITIAL_SHIFTS: WorkShift[] = [
  { id: 'sh1', staffId: 'st1', date: dateString, shiftName: 'SÁNG', startTime: '06:00', endTime: '14:00' },
  { id: 'sh2', staffId: 'st2', date: dateString, shiftName: 'CHIỀU', startTime: '14:00', endTime: '22:00' },
  { id: 'sh3', staffId: 'st3', date: dateString, shiftName: 'SÁNG', startTime: '06:00', endTime: '14:00' }
];

export const INITIAL_TIME_RECORDS: TimeRecord[] = [
  { id: 'tr1', staffId: 'st1', date: dateString, checkIn: '05:55', status: 'ON_TIME' },
  { id: 'tr2', staffId: 'st3', date: dateString, checkIn: '06:15', status: 'LATE' }
];

export const INITIAL_ORDERS: Order[] = [
    {
        id: 'ord-demo-1',
        tableId: 101,
        startTime: Date.now() - 3600000, // 1 hour ago
        isPaid: false,
        status: 'ACTIVE',
        guestCount: 2,
        items: [
            { itemId: 'm1', name: 'Phở Bò Tái', price: 55000, quantity: 2, returnedQuantity: 0, status: ItemStatus.SERVED, timestamp: Date.now() - 3500000 },
            { itemId: 'm8', name: 'Trà Đá', price: 5000, quantity: 2, returnedQuantity: 0, status: ItemStatus.SERVED, timestamp: Date.now() - 3500000 }
        ]
    }
];

export const INITIAL_TABLES: Table[] = [
  // Takeaway (Virtual Tables) - Only 1 as requested
  { id: 901, name: 'Mang về', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440004', capacity: 0, currentOrderId: null },
  
  // Floor 1
  { id: 101, name: 'Bàn 101', status: TableStatus.OCCUPIED, areaId: '550e8400-e29b-41d4-a716-446655440001', capacity: 4, currentOrderId: 'ord-demo-1' },
  { id: 102, name: 'Bàn 102', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440001', capacity: 4, currentOrderId: null },
  { id: 103, name: 'Bàn 103', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440001', capacity: 6, currentOrderId: null },
  { id: 104, name: 'Bàn 104', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440001', capacity: 2, currentOrderId: null },

  // Floor 2
  { id: 201, name: 'Bàn 201', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440002', capacity: 8, currentOrderId: null },
  { id: 202, name: 'Bàn 202', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440002', capacity: 8, currentOrderId: null },
  { id: 203, name: 'Bàn 203', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440002', capacity: 4, currentOrderId: null },

  // VIP
  { id: 301, name: 'VIP 1', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440003', capacity: 10, currentOrderId: null },
  { id: 302, name: 'VIP 2', status: TableStatus.AVAILABLE, areaId: '550e8400-e29b-41d4-a716-446655440003', capacity: 12, currentOrderId: null },
];
