
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Table, Order, MenuItem, TableStatus, ItemStatus, OrderItem, Reservation, ReservationStatus, Customer, Supplier, Staff, WorkShift, TimeRecord, InventoryItem, InventoryTransaction, Area, Notification } from '../types';
import { INITIAL_TABLES, MENU_ITEMS, INITIAL_SHIFTS, INITIAL_TIME_RECORDS, CATEGORIES, INITIAL_ORDERS } from '../constants';
import { useAuth } from './AuthContext';

// Use relative path to leverage Vite proxy
const API_URL = '/api'; 
const socket = io('/', { path: '/socket.io' }); // Connect to relative path

interface POSContextType {
  areas: Area[];
  tables: Table[];
  orders: Order[];
  menu: MenuItem[];
  reservations: Reservation[];
  customers: Customer[];
  suppliers: Supplier[];
  staff: Staff[];
  shifts: WorkShift[];
  timeRecords: TimeRecord[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  categories: string[];
  // Actions
  startOrder: (tableId: number, reservationId?: string) => void;
  addItemToOrder: (tableId: number, item: MenuItem, note?: string) => void;
  removeItemFromOrder: (tableId: number, itemIndex: number) => void;
  updateItemQuantity: (tableId: number, itemIndex: number, delta: number) => void;
  updateItemReturned: (tableId: number, itemIndex: number, delta: number) => void;
  sendOrderToKitchen: (tableId: number) => void;
  requestPayment: (tableId: number) => void;
  updateItemStatus: (orderId: string, itemIndex: number, status: ItemStatus) => void;
  cancelOrderItem: (orderId: string, itemId: string, cancelReason: string) => Promise<void>;
  
  // Advanced Payment Actions
  finalizePayment: (tableId: number, paymentData: { discountAmount: number, discountPercent: number, discountType: 'AMOUNT'|'PERCENT', discountReason: string, finalAmount: number }) => void;
  cancelOrder: (orderId: string, tableId: number, reason: string) => Promise<void>;
  mergeOrders: (sourceTableIds: number[], targetTableId: number) => Promise<void>;
  splitOrder: (sourceTableId: number, targetTableId: number, itemsToMove: OrderItem[]) => Promise<void>;

  releaseTable: (tableId: number) => void;
  // Reservation Actions
  addReservation: (tableId: number | undefined, reservation: Omit<Reservation, 'id' | 'code' | 'status' | 'tableId'>) => void;
  updateReservation: (id: string, reservation: Partial<Reservation>) => void;
  cancelReservation: (id: string, reason: string) => void;
  checkInReservation: (reservationId: string, tableId: number) => void;
  // Customer Actions
  addCustomer: (customer: Omit<Customer, 'id' | 'code'>) => void;
  // Supplier Actions
  addSupplier: (supplier: Omit<Supplier, 'id' | 'code'>) => void;
  // Staff Actions
  addStaff: (staff: Omit<Staff, 'id' | 'code' | 'status'>) => void;
  // Menu Actions
  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  toggleMenuItemOutOfStock: (itemId: string, isOutOfStock: boolean) => Promise<void>;
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  // Inventory Actions
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'code'>) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  // Inventory Transaction Actions
  addInventoryTransaction: (transaction: Omit<InventoryTransaction, 'id' | 'code' | 'createdAt'>) => Promise<any>;
  // Order Info Updates
  updateOrderInfo: (tableId: number, info: { guestCount?: number; note?: string }) => void;
  getActiveOrder: (tableId: number) => Order | undefined;
  // Area Actions
  addArea: (area: Omit<Area, 'id' | 'createdAt'>) => Promise<void>;
  updateArea: (id: string, area: Partial<Area>) => Promise<void>;
  deleteArea: (id: string) => Promise<void>;
  // Table Actions
  addTable: (table: Omit<Table, 'id' | 'status' | 'currentOrderId'>) => void;
  // Notification Actions
  notifications: Notification[];
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  getUnreadNotifications: () => Notification[];
  // System Actions
  resetSystem: () => void;
  error: string | null;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Get current user
  const { user } = useAuth();
  
  // State
  const [areas, setAreas] = useState<Area[]>([]);  // Load from DB
  const [tables, setTables] = useState<Table[]>(INITIAL_TABLES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [menu, setMenu] = useState<MenuItem[]>(MENU_ITEMS);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);  // Load from DB
  const [notifications, setNotifications] = useState<Notification[]>([]);  // Load from DB
  
  // Generic Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);  // Load from DB
  const [staff, setStaff] = useState<Staff[]>([]);  // Load from DB
  const [shifts] = useState<WorkShift[]>(INITIAL_SHIFTS);
  const [timeRecords] = useState<TimeRecord[]>(INITIAL_TIME_RECORDS);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryTransactions, setInventoryTransactions]= useState<InventoryTransaction[]>([]);
  const [categories, setCategories] = useState<string[]>(CATEGORIES);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  // --- API Sync Functions ---
  // Không dùng useCallback để tránh stale closure
  const fetchData = async () => {
    try {
        console.log('🔄 Fetching data from API...');
        const res = await fetch(`${API_URL}/init`);
        if (!res.ok) throw new Error('Failed to fetch initial data');
        const data = await res.json();
        
        // Load areas
        if (data.areas !== undefined) {
            setAreas([...data.areas]);
            setLastUpdate(Date.now());
        }
        
        // Always update from database, even if empty
        if (data.areas !== undefined) {
            setAreas([...data.areas]);
            setLastUpdate(Date.now());
        }
        if (data.tables) {
            setTables([...(data.tables.length > 0 ? data.tables : INITIAL_TABLES)]);
            setLastUpdate(Date.now()); // Force re-render
        }
        if (data.orders) setOrders(data.orders.length > 0 ? data.orders : INITIAL_ORDERS);
        if (data.reservations) {
            console.log('📅 Setting reservations:', data.reservations.length);
            setReservations([...data.reservations]); // Force new array reference
            setLastUpdate(Date.now()); // Force re-render
        }
        if (data.menu) setMenu(data.menu.length > 0 ? data.menu : MENU_ITEMS);
        
        // Load from database
        if (data.inventoryItems !== undefined) {
            console.log('📦 Setting inventory items:', data.inventoryItems.length);
            setInventoryItems([...data.inventoryItems]); // Force new array reference
            setLastUpdate(Date.now()); // Trigger re-render
        }
        if (data.staff !== undefined) setStaff(data.staff);
        if (data.customers !== undefined) setCustomers(data.customers);
        if (data.suppliers !== undefined) setSuppliers(data.suppliers);
        
        // Load import/export transactions
        if (data.importTransactions !== undefined || data.exportTransactions !== undefined) {
            const allTransactions = [
                ...(data.importTransactions || []).map((t: any) => ({ ...t, type: 'IMPORT' })),
                ...(data.exportTransactions || []).map((t: any) => ({ ...t, type: 'EXPORT' }))
            ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setInventoryTransactions(allTransactions);
        }
        
        // Load categories
        if (data.categories !== undefined) setCategories(data.categories);
        
        // Load notifications
        if (data.notifications !== undefined) {
            console.log('🔔 Setting notifications:', data.notifications.length);
            setNotifications([...data.notifications]);
        }
        
        console.log('Data loaded from database:', { 
            staffCount: data.staff?.length || 0,
            customersCount: data.customers?.length || 0,
            suppliersCount: data.suppliers?.length || 0,
            inventoryCount: data.inventoryItems?.length || 0,
            importCount: data.importTransactions?.length || 0,
            exportCount: data.exportTransactions?.length || 0,
            categoriesCount: data.categories?.length || 0,
            menuCount: data.menu?.length || 0,
            notificationsCount: data.notifications?.length || 0
        });
        
        setError(null);
    } catch (err) {
        console.error("Failed to connect to backend", err);
        // Do not block UI if backend fails, just show notification
        setError("Không thể kết nối đến máy chủ. Dữ liệu đang hiển thị ở chế độ Offline (Mẫu).");
    }
  };

  useEffect(() => {
    // Load initial data
    fetchData();
  }, []);

  // Setup socket listeners riêng biệt - luôn có ref tới fetchData mới nhất
  useEffect(() => {
    const handleDataUpdate = () => {
        console.log('📡 DATA_UPDATED event received, fetching data...');
        fetchData();
    };
    
    const handleNewNotification = (notification: any) => {
        console.log('🔔 NEW_NOTIFICATION received:', notification);
        console.log('📊 Notification details:', {
            id: notification.id,
            title: notification.title,
            targetRoles: notification.targetRoles,
            type: notification.type
        });
        setNotifications(prev => {
            console.log('📝 Adding to notifications. Current count:', prev.length);
            return [notification, ...prev];
        });
    };
    
    socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
    });

    socket.on('connect_error', (error: any) => {
        console.warn("⚠️ Socket connection failed:", error);
    });

    socket.on('DATA_UPDATED', handleDataUpdate);
    socket.on('NEW_NOTIFICATION', handleNewNotification);

    return () => {
        socket.off('DATA_UPDATED', handleDataUpdate);
        socket.off('NEW_NOTIFICATION', handleNewNotification);
        socket.off('connect_error');
        socket.off('connect');
    };
  }); // Không có deps - luôn gọi fetchData version mới nhất

  // Helper to find order
  const getActiveOrder = useCallback((tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return undefined;
    return orders.find(o => o.id === table.currentOrderId);
  }, [tables, orders]);

  // --- ACTIONS ---

  const startOrder = async (tableId: number, reservationId?: string) => {
    console.log('🍽️ startOrder called for table:', tableId);
    const newOrderId = `ORD-${Date.now()}`;
    const newOrder: Order = {
      id: newOrderId,
      tableId,
      items: [],
      startTime: Date.now(),
      isPaid: false,
      status: 'ACTIVE',
      reservationId: reservationId
    };
    
    console.log('📝 Creating new order:', newOrderId);
    
    // Optimistic Update
    setOrders(prev => [...prev, newOrder]);
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.OCCUPIED, currentOrderId: newOrderId } : t));

    // API Call
    try {
        await fetch(`${API_URL}/orders/create`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ order: newOrder, tableId })
        });
    } catch (e) { setError("Lỗi kết nối khi tạo đơn"); }
  };

  const releaseTable = async (tableId: number) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.AVAILABLE, currentOrderId: null } : t));
    try {
        await fetch(`${API_URL}/tables/update`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: tableId, updates: { status: TableStatus.AVAILABLE, currentOrderId: null } })
        });
    } catch (e) { console.error(e); }
  };

  // Generic Order Item Updater (Add/Remove/Qty)
  const syncOrderItems = async (orderId: string, items: OrderItem[], tableId: number, info?: any) => {
      try {
        await fetch(`${API_URL}/orders/update-items`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ orderId, items, tableId, info })
        });
      } catch (e) { console.error(e); }
  };

  const addItemToOrder = (tableId: number, item: MenuItem, note: string = '') => {
    const order = getActiveOrder(tableId);
    if (!order) return;

    const existingItemIndex = order.items.findIndex(i => 
      i.itemId === item.id && i.status === ItemStatus.DRAFT && (i.note || '') === (note || '')
    );

    let newItems = [...order.items];
    if (existingItemIndex > -1) {
      newItems[existingItemIndex] = { ...newItems[existingItemIndex], quantity: newItems[existingItemIndex].quantity + 1 };
    } else {
      newItems.push({
        itemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        returnedQuantity: 0,
        status: ItemStatus.DRAFT,
        note,
        timestamp: Date.now()
      });
    }

    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: newItems } : o));
    syncOrderItems(order.id, newItems, tableId);
  };

  const removeItemFromOrder = (tableId: number, itemIndex: number) => {
     const order = getActiveOrder(tableId);
     if (!order) return;
     const newItems = [...order.items];
     newItems.splice(itemIndex, 1);
     
     setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: newItems } : o));
     syncOrderItems(order.id, newItems, tableId);
  };

  const updateItemQuantity = (tableId: number, itemIndex: number, delta: number) => {
    const order = getActiveOrder(tableId);
    if (!order) return;
    
    const newItems = [...order.items];
    const item = newItems[itemIndex];
    const newQty = item.quantity + delta;
    if (newQty > 0) newItems[itemIndex] = { ...item, quantity: newQty };
    
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: newItems } : o));
    syncOrderItems(order.id, newItems, tableId);
  };

  const updateItemReturned = (tableId: number, itemIndex: number, delta: number) => {
    const order = getActiveOrder(tableId);
    if (!order) return;
    
    const newItems = [...order.items];
    const item = newItems[itemIndex];
    const newReturned = (item.returnedQuantity || 0) + delta;
    
    if (newReturned >= 0 && newReturned <= item.quantity) {
      newItems[itemIndex] = { ...item, returnedQuantity: newReturned };
    }
    
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: newItems } : o));
    syncOrderItems(order.id, newItems, tableId);
  };

  const sendOrderToKitchen = (tableId: number) => {
    const order = getActiveOrder(tableId);
    if (!order) return;
    
    const newItems = order.items.map(item => 
      item.status === ItemStatus.DRAFT ? { ...item, status: ItemStatus.PENDING } : item
    );
    
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, items: newItems } : o));
    syncOrderItems(order.id, newItems, tableId);
  };

  const updateItemStatus = (orderId: string, itemIndex: number, status: ItemStatus) => {
    const order = orders.find(o => o.id === orderId);
    if(!order) return;

    const newItems = [...order.items];
    newItems[itemIndex] = { ...newItems[itemIndex], status };
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: newItems } : o));
    syncOrderItems(orderId, newItems, order.tableId); 
  };

  const cancelOrderItem = async (orderId: string, itemId: string, cancelReason: string) => {
    try {
      console.log('🚫 Cancelling item:', itemId, 'Reason:', cancelReason);
      const res = await fetch(`${API_URL}/orders/cancel-item`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          orderId, 
          itemId, 
          cancelReason,
          userId: user?.id,
          username: user?.displayName || user?.username
        })
      });
      
      if (!res.ok) throw new Error('Failed to cancel item');
      
      // Optimistic update
      setOrders(prev => prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            items: o.items.map(item => 
              item.id === itemId 
                ? { ...item, status: ItemStatus.CANCELLED, cancelReason }
                : item
            )
          };
        }
        return o;
      }));
      
      console.log('✅ Item cancelled successfully');
      await fetchData();
    } catch (e) {
      console.error('❌ Cancel item error:', e);
      throw e;
    }
  };

  const requestPayment = async (tableId: number) => {
     setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.PAYMENT_REQUESTED } : t));
     try {
        await fetch(`${API_URL}/tables/update`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: tableId, updates: { status: TableStatus.PAYMENT_REQUESTED } })
        });
     } catch (e) { console.error(e); }
  };

  const finalizePayment = async (tableId: number, paymentData: { discountAmount: number, discountPercent: number, discountType: 'AMOUNT'|'PERCENT', discountReason: string, finalAmount: number }) => {
    const order = getActiveOrder(tableId);
    if(!order) return;

    // Local update
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.AVAILABLE, currentOrderId: null, reservation: undefined } : t));
    setOrders(prev => prev.map(o => o.id === order.id ? { 
        ...o, 
        isPaid: true, 
        status: 'COMPLETED',
        ...paymentData
    } : o));

    try {
        await fetch(`${API_URL}/orders/pay`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ orderId: order.id, tableId, ...paymentData })
        });
    } catch (e) { console.error(e); }
  };

  // --- NEW FEATURES ---

  const cancelOrder = async (orderId: string, tableId: number, reason: string) => {
      // Local Update
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status: TableStatus.AVAILABLE, currentOrderId: null } : t));
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED', cancelReason: reason } : o));

      try {
        await fetch(`${API_URL}/orders/cancel`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                orderId, 
                tableId, 
                reason,
                userId: user?.id,
                username: user?.displayName || user?.username
            })
        });
    } catch (e) { console.error(e); }
  };

  const mergeOrders = async (sourceTableIds: number[], targetTableId: number) => {
      const targetOrder = getActiveOrder(targetTableId);
      if(!targetOrder) return;

      try {
          const res = await fetch(`${API_URL}/orders/merge`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  sourceTableIds, 
                  targetTableId, 
                  targetOrderId: targetOrder.id,
                  userId: user?.id,
                  username: user?.displayName || user?.username
              })
          });
          if (!res.ok) throw new Error("Merge failed");
          // State will refresh via socket
      } catch(e) { 
          console.error(e); 
          throw e; // Re-throw for UI handling
      }
  };

  const splitOrder = async (sourceTableId: number, targetTableId: number, itemsToMove: OrderItem[]) => {
      const sourceOrder = getActiveOrder(sourceTableId);
      if(!sourceOrder) return;
      
      try {
          const res = await fetch(`${API_URL}/orders/split`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ 
                  sourceTableId, 
                  targetTableId, 
                  itemsToMove, 
                  sourceOrderId: sourceOrder.id,
                  userId: user?.id,
                  username: user?.displayName || user?.username
              })
          });
          if (!res.ok) throw new Error("Split failed");
          // State refresh via socket
      } catch(e) { 
          console.error(e); 
          throw e;
      }
  };

  // Reservation Logic
  const addReservation = async (tableId: number | undefined, reservationData: any) => {
     const newCode = `RE${Math.floor(1000 + Math.random() * 9000)}`;
     const tableIds = reservationData.tableIds || (tableId ? [tableId] : []);
     
     const dataToSend = {
        code: newCode,
        customerName: reservationData.customerName,
        phoneNumber: reservationData.phoneNumber,
        address: reservationData.address || '',
        arrivalTime: reservationData.arrivalTime,
        guestCount: reservationData.guestCount,
        durationHours: reservationData.durationHours,
        depositAmount: reservationData.depositAmount || 0,
        depositMethod: reservationData.depositMethod || null,
        note: reservationData.note || '',
        preOrderItems: reservationData.preOrderItems || [],
        tableIds: tableIds
     };

     try {
        console.log('📤 Creating reservation:', dataToSend);
        const res = await fetch(`${API_URL}/reservations/create`, {
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify(dataToSend)
        });
        if (!res.ok) throw new Error('Failed to create reservation');
        const result = await res.json();
        console.log('✅ Reservation created:', result);
        
        // MẮT XÍCH 1: Cập nhật State ngay lập tức (Optimistic Update)
        setReservations(prev => [...prev, {
            ...result,
            preOrderItems: result.preOrderItems || []
        }]);
        console.log('🔄 State updated immediately, fetching full data...');
        
        // Sau đó fetch lại để đảm bảo đồng bộ hoàn toàn với DB
        await fetchData();
     } catch (e) { 
        console.error('Error creating reservation:', e);
        throw e;
     }
  };

  const updateReservation = async (id: string, updates: Partial<Reservation>) => {
      const res = reservations.find(r => r.id === id);
      if(!res) return;
      const updatedRes = { ...res, ...updates };
      
      setReservations(prev => prev.map(r => r.id === id ? updatedRes : r));
      try {
        await fetch(`${API_URL}/reservations/save`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedRes)
        });
      } catch (e) { console.error(e); }
  };

  const cancelReservation = async (id: string, reason: string) => {
      const res = reservations.find(r => r.id === id);
      if(!res) return;
      const updatedRes = { ...res, status: ReservationStatus.CANCELLED, note: `${res.note || ''} [Hủy: ${reason}]` };
      
      setReservations(prev => prev.map(r => r.id === id ? updatedRes : r));
      if (res.tableId) {
          setTables(prev => prev.map(t => t.id === res.tableId ? { ...t, status: TableStatus.AVAILABLE, reservation: undefined } : t));
          try {
            await fetch(`${API_URL}/tables/update`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ id: res.tableId, updates: { status: TableStatus.AVAILABLE } })
            });
          } catch (e) { console.error(e); }
      }
      try {
        await fetch(`${API_URL}/reservations/save`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedRes)
        });
      } catch (e) { console.error(e); }
  };

  const checkInReservation = async (reservationId: string, tableId: number) => {
      const res = reservations.find(r => r.id === reservationId);
      if (!res) return;
      
      // Check if table already has an order
      const existingOrder = getActiveOrder(tableId);
      
      if (existingOrder) {
          // Link reservation to existing order (không tạo order mới)
          console.log('🔗 Linking reservation to existing order:', existingOrder.id);
          
          // Optimistic update
          setOrders(prev => prev.map(o => 
              o.id === existingOrder.id 
                  ? { ...o, reservationId, guestCount: res.guestCount, note: res.note }
                  : o
          ));
          setReservations(prev => prev.map(r => 
              r.id === reservationId 
                  ? { ...r, status: ReservationStatus.CHECKED_IN, tableId }
                  : r
          ));
          
          try {
              await fetch(`${API_URL}/orders/link-reservation`, {
                  method: 'POST',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({
                      orderId: existingOrder.id,
                      reservationId,
                      guestCount: res.guestCount,
                      note: res.note
                  })
              });
          } catch (e) { console.error(e); }
      } else {
          // Create new order with reservation
          console.log('🆕 Creating new order with reservation');
          const updatedRes = { ...res, status: ReservationStatus.CHECKED_IN, tableId };
          setReservations(prev => prev.map(r => r.id === reservationId ? updatedRes : r));
          
          try {
            await fetch(`${API_URL}/reservations/save`, {
                method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedRes)
            });
          } catch (e) { console.error(e); }
         
         startOrder(tableId, reservationId);
         setTimeout(() => updateOrderInfo(tableId, { guestCount: res.guestCount, note: res.note }), 500);
      }
  };

  // CRUD Helpers
  const addCustomer = async (c: any) => {
     try {
         const customerData = { 
             code: `KH${Math.floor(10000+Math.random()*90000)}`, 
             ...c 
         };
         const res = await fetch(`${API_URL}/customers/create`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(customerData)
         });
         if (!res.ok) throw new Error('Failed to create customer');
         const result = await res.json();
         console.log('Customer created:', result);
         await fetchData();
     } catch (e) {
         console.error('Error adding customer:', e);
         throw e;
     }
  };

  const addSupplier = async (s: any) => {
     try {
         const supplierData = { 
             code: `NCC${Math.floor(1000+Math.random()*9000)}`, 
             ...s 
         };
         const res = await fetch(`${API_URL}/suppliers/create`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(supplierData)
         });
         if (!res.ok) throw new Error('Failed to create supplier');
         const result = await res.json();
         console.log('Supplier created:', result);
         await fetchData();
     } catch (e) {
         console.error('Error adding supplier:', e);
         throw e;
     }
  };

  const addStaff = async (s: any) => {
    try {
      const staffData = { 
        code: `NV${Math.floor(100+Math.random()*900)}`, 
        status: 'ACTIVE', 
        ...s 
      };
      console.log('Sending staff data:', staffData);
      const res = await fetch(`${API_URL}/staff/create`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(staffData)
      });
      console.log('Response status:', res.status);
      if (!res.ok) {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        throw new Error('Failed to create staff');
      }
      const result = await res.json();
      console.log('Staff created:', result);
      
      // Refresh data immediately to show new staff
      await fetchData();
    } catch (e) { 
      console.error('Error adding staff:', e); 
      alert('Có lỗi xảy ra khi thêm nhân viên. Vui lòng kiểm tra console.');
      throw e; // Re-throw to let modal know it failed
    }
  };

  const addMenuItem = async (item: any) => {
    try {
      const res = await fetch(`${API_URL}/menu/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error('Failed to add menu item');
      await fetchData();
    } catch (e) { 
      console.error('Error adding menu item:', e); 
      throw e;
    }
  };

  const updateMenuItem = async (id: string, updates: any) => {
    try {
      const res = await fetch(`${API_URL}/menu/update/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update menu item');
      await fetchData();
    } catch (e) { 
      console.error('Error updating menu item:', e); 
      throw e;
    }
  };

  const deleteMenuItem = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/menu/delete/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete menu item');
      await fetchData();
    } catch (e) { 
      console.error('Error deleting menu item:', e); 
      throw e;
    }
  };

  const toggleMenuItemOutOfStock = async (itemId: string, isOutOfStock: boolean) => {
    try {
      const res = await fetch(`${API_URL}/menu/toggle-out-of-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          isOutOfStock,
          userId: user?.id,
          username: user?.displayName || user?.username
        })
      });
      if (!res.ok) throw new Error('Failed to toggle out of stock status');
      await fetchData();
    } catch (e) {
      console.error('Error toggling out of stock:', e);
      throw e;
    }
  };

  const addCategory = async (cat: string) => {
      try {
          if(categories.includes(cat)) return;
          const res = await fetch(`${API_URL}/categories/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: cat })
          });
          if (!res.ok) throw new Error('Failed to add category');
          await fetchData();
      } catch (e) {
          console.error('Error adding category:', e);
          throw e;
      }
  };
  
  const deleteCategory = async (cat: string) => {
      try {
          await fetch(`${API_URL}/categories/delete/${encodeURIComponent(cat)}`, {
              method: 'DELETE'
          });
          await fetchData();
      } catch (e) {
          console.error('Error deleting category:', e);
          throw e;
      }
  };

  const addInventoryItem = async (item: any) => {
      try {
          const itemData = { 
              code: `NL${Math.floor(100+Math.random()*900)}`, 
              ...item 
          };
          console.log('📤 Creating inventory item:', itemData);
          const res = await fetch(`${API_URL}/inventory/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(itemData)
          });
          if (!res.ok) throw new Error('Failed to create inventory item');
          const result = await res.json();
          console.log('✅ Inventory item created:', result);
          console.log('🔄 Calling fetchData to refresh...');
          await fetchData();
          console.log('✅ Data refreshed!');
      } catch (e) {
          console.error('Error adding inventory item:', e);
          throw e;
      }
  };
  
  const updateInventoryItem = async (id: string, updates: any) => {
      try {
          const res = await fetch(`${API_URL}/inventory/update/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
          });
          if (!res.ok) throw new Error('Failed to update inventory item');
          await fetchData();
      } catch (e) {
          console.error('Error updating inventory item:', e);
          throw e;
      }
  };
  
  const deleteInventoryItem = async (id: string) => {
      try {
          const res = await fetch(`${API_URL}/inventory/delete/${id}`, {
              method: 'DELETE'
          });
          if (!res.ok) throw new Error('Failed to delete inventory item');
          await fetchData();
      } catch (e) {
          console.error('Error deleting inventory item:', e);
          throw e;
      }
  };

  const addInventoryTransaction = async (transaction: any) => {
      try {
          const isImport = transaction.type === 'IMPORT';
          const code = `${isImport ? 'PN' : 'PX'}${Math.floor(1000 + Math.random() * 9000)}`;
          
          const endpoint = isImport ? '/import/create' : '/export/create';
          const data = isImport ? {
              code,
              supplierId: transaction.supplierId,
              supplierName: transaction.supplierName,
              items: transaction.items,
              totalAmount: transaction.totalAmount,
              note: transaction.note,
              createdBy: transaction.createdBy || 'Admin'
          } : {
              code,
              reason: transaction.reason || 'OTHER',
              items: transaction.items,
              totalAmount: transaction.totalAmount,
              note: transaction.note,
              createdBy: transaction.createdBy || 'Admin'
          };
          
          const res = await fetch(`${API_URL}${endpoint}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
          });
          
          if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || 'Failed to create transaction');
          }
          
          const result = await res.json();
          console.log('Transaction created:', result);
          await fetchData();
          return result;
      } catch (e: any) {
          console.error('Error adding inventory transaction:', e);
          alert(e.message || 'Có lỗi xảy ra khi tạo phiếu');
          throw e;
      }
  };

  const updateOrderInfo = (tableId: number, info: any) => {
      const order = getActiveOrder(tableId);
      if (!order) return;
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...info } : o));
      syncOrderItems(order.id, order.items, tableId, info);
  };

  const addTable = async (newTableData: any) => {
    const tableData = {
        ...newTableData,
        status: TableStatus.AVAILABLE,
        currentOrderId: null,
        isActive: true
    };
    try {
        const res = await fetch(`${API_URL}/tables/create`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(tableData)
        });
        if (!res.ok) throw new Error('Failed to create table');
        console.log('Table created successfully');
        await fetchData();
    } catch (e) { 
        console.error('Error creating table:', e); 
        throw e;
    }
  };

  // --- AREA MANAGEMENT ---
  const addArea = async (areaData: any) => {
    try {
        const res = await fetch(`${API_URL}/areas/create`, {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(areaData)
        });
        if (!res.ok) throw new Error('Failed to create area');
        console.log('Area created successfully');
        await fetchData();
    } catch (e) { 
        console.error('Error creating area:', e); 
        throw e;
    }
  };

  const updateArea = async (areaId: string, areaData: any) => {
    try {
        const res = await fetch(`${API_URL}/areas/update/${areaId}`, {
            method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(areaData)
        });
        if (!res.ok) throw new Error('Failed to update area');
        console.log('Area updated successfully');
        await fetchData();
    } catch (e) { 
        console.error('Error updating area:', e); 
        throw e;
    }
  };

  const deleteArea = async (areaId: string) => {
    try {
        const res = await fetch(`${API_URL}/areas/delete/${areaId}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to delete area');
        }
        console.log('Area deleted successfully');
        await fetchData();
    } catch (e: any) { 
        console.error('Error deleting area:', e); 
        throw e;
    }
  };

  const resetSystem = async () => {
    if(window.confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu?")) {
        try {
            await fetch(`${API_URL}/reset`, { method: 'POST' });
            window.location.reload();
        } catch (e) { console.error(e); }
    }
  };

  // Notification Actions
  const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    try {
        console.log('📤 Creating notification:', notification);
        const res = await fetch(`${API_URL}/notifications/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notification)
        });
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Failed to create notification. Status:', res.status);
            console.error('❌ Response:', errorText);
            throw new Error(`API Error ${res.status}: ${errorText}`);
        }
        
        const newNotification = await res.json();
        console.log('✅ Notification created successfully:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        return newNotification;
    } catch (e: any) {
        console.error('❌ Error creating notification:', e);
        console.error('Error message:', e.message);
        throw e;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
        await fetch(`${API_URL}/notifications/mark-read/${id}`, { method: 'PUT' });
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
        console.error('Error marking notification as read:', e);
    }
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.isRead);
  };

  const contextValue = {
      areas, tables, orders, menu, reservations, customers, suppliers, staff, shifts, timeRecords, inventoryItems, inventoryTransactions, categories,
      notifications,
      startOrder, addItemToOrder, removeItemFromOrder, updateItemQuantity, updateItemReturned,
      sendOrderToKitchen, requestPayment, updateItemStatus, cancelOrderItem, finalizePayment, releaseTable, cancelOrder, mergeOrders, splitOrder,
      addReservation, updateReservation, cancelReservation, checkInReservation,
      addCustomer, addSupplier, addStaff, 
      addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemOutOfStock, addCategory, deleteCategory,
      addInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryTransaction,
      updateOrderInfo, getActiveOrder,
      addArea, updateArea, deleteArea, addTable, 
      createNotification, markNotificationAsRead, getUnreadNotifications,
      resetSystem, error,
      _lastUpdate: lastUpdate // Internal use to force updates
  };

  return (
    <POSContext.Provider value={contextValue}>
      {children}
    </POSContext.Provider>
  );
};
