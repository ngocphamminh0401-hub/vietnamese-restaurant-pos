
export enum UserRole {
  ADMIN = 'ADMIN',
  WAITER = 'WAITER',
  CHEF = 'CHEF',
  CASHIER = 'CASHIER'
}

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  staffId?: string;
  createdAt?: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  action: 'LOGIN' | 'LOGOUT';
  timestamp: string;
}

export interface Area {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  PAYMENT_REQUESTED = 'PAYMENT_REQUESTED'
}

export enum TableArea {
  TAKEAWAY = 'TAKEAWAY',
  FLOOR_1 = 'FLOOR_1',
  FLOOR_2 = 'FLOOR_2',
  VIP = 'VIP'
}

export enum ItemStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED'
}

export enum ReservationStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  CHECKED_IN = 'CHECKED_IN',
  CANCELLED = 'CANCELLED'
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: 'PERSONAL' | 'COMPANY';
  phone: string;
  address?: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: 'PERSONAL' | 'COMPANY';
  phone: string;
  address?: string;
  email?: string;
}

export interface Staff {
  id: string;
  code: string;
  name: string;
  phone: string;
  role: 'MANAGER' | 'WAITER' | 'CHEF' | 'CASHIER';
  department: string;
  cccd: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  startDate: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface WorkShift {
  id: string;
  staffId: string;
  date: string;
  shiftName: 'SÁNG' | 'CHIỀU' | 'TỐI';
  startTime: string;
  endTime: string;
}

export interface TimeRecord {
  id: string;
  staffId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'LATE' | 'ON_TIME' | 'ABSENT' | 'LEAVE';
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  unit?: string;
  isActive?: boolean;
  isOutOfStock?: boolean;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  quantity: number;
  minStock: number;
  supplierId?: string | null;
  createdAt?: string;
  // Legacy fields for backward compatibility
  costPrice?: number;
  stockQuantity?: number;
}

export interface InventoryTransaction {
  id: string;
  code: string;
  type: 'IMPORT' | 'EXPORT';
  items: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  note?: string;
  createdAt?: string;
  createdBy?: string;
  // Import specific
  supplierId?: string;
  supplierName?: string;
  // Export specific
  reason?: string;
  // Legacy fields
  date?: string;
  partnerName?: string;
  status?: 'COMPLETED' | 'DRAFT' | 'CANCELLED';
}

export interface InventoryCheck {
  id: string;
  code: string;
  date: string;
  status: 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  creator: string;
  note?: string;
  totalVariance: number;
}

export interface OrderItem {
  id?: string; // UUID from database
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  returnedQuantity: number;
  status: ItemStatus;
  note?: string;
  cancelReason?: string;
  timestamp: number;
}

export interface Order {
  id: string;
  tableId: number; 
  items: OrderItem[];
  startTime: number;
  isPaid: boolean;
  status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  guestCount?: number;
  note?: string;
  reservationId?: string;
  discountAmount?: number; 
  discountPercent?: number;
  discountType?: 'AMOUNT' | 'PERCENT';
  discountReason?: string;
  finalAmount?: number;    
  cancelReason?: string;
}

export interface Reservation {
  id: string;
  code: string;
  status: ReservationStatus;
  customerName: string;
  phoneNumber: string;
  address?: string;
  arrivalTime: string;
  guestCount: number;
  durationHours: number;
  depositAmount?: number;
  depositMethod?: 'CASH' | 'TRANSFER' | 'CARD';
  note?: string;
  preOrderItems?: string[]; 
  tableId?: number; // Legacy - for backward compatibility
  tableIds?: number[]; // New - support multiple tables
  tables?: Array<{ id: string; tableId: number }>; // Relation data from backend
}

export interface Table {
  id: number;
  name: string;
  status: TableStatus;
  areaId: string;
  area?: Area; // Populated area object
  capacity: number;
  currentOrderId?: string | null;
  reservation?: Reservation;
  note?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export enum NotificationType {
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_MERGED = 'ORDER_MERGED',
  ORDER_SPLIT = 'ORDER_SPLIT',
  ITEM_OUT_OF_STOCK = 'ITEM_OUT_OF_STOCK',
  ITEM_BACK_IN_STOCK = 'ITEM_BACK_IN_STOCK'
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any; // JSON data
  targetRoles: string; // Comma-separated roles
  isRead: boolean;
  userId?: string;
  username?: string;
  createdAt: string;
}
