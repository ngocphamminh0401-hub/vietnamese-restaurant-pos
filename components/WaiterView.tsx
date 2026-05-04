
import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { TableStatus, MenuItem, TableArea, ReservationStatus, Customer, Table, ItemStatus } from '../types';
import { AlertCircle, Minus, Plus, ArrowLeft, CalendarClock, Search, Edit2, X, Save, CheckCircle2, ShoppingBag, Trash2, LayoutGrid, Filter, FileText } from 'lucide-react';
import { ReservationForm } from './waiter/ReservationForm';
import { OrderRightPanel } from './waiter/OrderRightPanel';
import { AddCustomerModal } from './manager/AddCustomerModal';
import { OutOfStockBanner } from './waiter/OutOfStockBanner';
import { NotificationBell } from './waiter/NotificationBell';

const WaiterView: React.FC = () => {
  const { tables, menu, reservations, customers, addCustomer, addReservation, updateReservation, cancelReservation, checkInReservation, startOrder, getActiveOrder, addItemToOrder, requestPayment, sendOrderToKitchen, removeItemFromOrder, updateItemReturned, updateOrderInfo, releaseTable, cancelOrderItem } = usePOS();
  
  console.log('🔄 WaiterView render - reservations count:', reservations.length);
  
  // Track reservations changes
  useEffect(() => {
    console.log('✨ Reservations updated in WaiterView:', reservations.length);
  }, [reservations]);
  
  // Lấy danh sách categories động từ menu
  const availableCategories = React.useMemo(() => {
    const categories = Array.from(new Set(menu.map(item => item.category)));
    return categories.length > 0 ? categories : ['Phở & Bún']; // Fallback nếu menu rỗng
  }, [menu]);
  
  // Navigation State
  const [viewMode, setViewMode] = useState<'MAP' | 'RESERVATION'>('MAP');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  
  // Order View State
  const [selectedCategory, setSelectedCategory] = useState<string>(availableCategories[0]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);

  // Cập nhật selectedCategory khi availableCategories thay đổi
  useEffect(() => {
    if (!availableCategories.includes(selectedCategory)) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  // Table Map States
  const [activeTab, setActiveTab] = useState<TableArea | 'ALL'>('ALL');
  const [tableFilter, setTableFilter] = useState<'ALL' | 'OCCUPIED' | 'AVAILABLE'>('ALL');
  
  // Reservation Filter States
  const [resSearchQuery, setResSearchQuery] = useState('');
  const [resDateFilter, setResDateFilter] = useState<string>(''); // KHÔNG filter theo ngày mặc định - hiển thị tất cả
  const [resStatusFilter, setResStatusFilter] = useState<string>('ALL');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  // NEW: State to hold pre-fill data for add customer modal
  const [newCustomerInitialData, setNewCustomerInitialData] = useState<{name?: string, phone?: string}>({});

  // Action Modals State
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isCheckItemsModalOpen, setIsCheckItemsModalOpen] = useState(false);
  const [isLinkReservationOpen, setIsLinkReservationOpen] = useState(false);
  
  const [tempGuestCount, setTempGuestCount] = useState(1);
  const [tempNote, setTempNote] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  
  // Item Note Modal
  const [isItemNoteModalOpen, setIsItemNoteModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [itemNote, setItemNote] = useState('');
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  const initialFormState = {
    code: '',
    customerName: '',
    phoneNumber: '',
    address: '',
    arrivalTime: '', 
    guestCount: 1, 
    durationHours: 1,
    depositAmount: 0,
    depositMethod: 'CASH' as 'CASH' | 'TRANSFER' | 'CARD',
    note: '',
    tableId: 0,
    preOrderItems: [] as string[]
  };

  const [reservationForm, setReservationForm] = useState(initialFormState);

  const selectedTable = tables.find(t => t.id === selectedTableId);
  const activeOrder = selectedTableId ? getActiveOrder(selectedTableId) : undefined;
  
  // Derived state
  const isPaymentRequested = selectedTable?.status === TableStatus.PAYMENT_REQUESTED;
  // Kiểm tra đơn hàng có món hợp lệ (loại trừ món đã hủy)
  const hasItems = activeOrder && activeOrder.items.some(item => item.status !== ItemStatus.CANCELLED);

  // Filter Tables
  const filteredTables = tables.filter(t => {
      if (activeTab !== 'ALL' && t.area?.code !== activeTab) return false;
      if (tableFilter === 'OCCUPIED' && t.status === TableStatus.AVAILABLE) return false;
      if (tableFilter === 'AVAILABLE' && t.status !== TableStatus.AVAILABLE) return false;
      return true;
  });

  const availableTables = tables.filter(t => t.status === TableStatus.AVAILABLE);

  // Filter Reservations
  const filteredReservations = reservations.filter(res => {
     const matchesSearch = res.customerName.toLowerCase().includes(resSearchQuery.toLowerCase()) || 
                           res.phoneNumber.includes(resSearchQuery) || 
                           res.code.toLowerCase().includes(resSearchQuery.toLowerCase());
     
     const resDate = res.arrivalTime.split('T')[0];
     const matchesDate = resDateFilter ? resDate === resDateFilter : true;
     
     const matchesStatus = resStatusFilter === 'ALL' ? true : res.status === resStatusFilter;

     return matchesSearch && matchesDate && matchesStatus;
  });
  
  console.log('📋 Filtered reservations:', filteredReservations.length, '| Date filter:', resDateFilter, '| Status filter:', resStatusFilter);
  console.log('📋 Sample reservation dates:', reservations.slice(0, 3).map(r => r.arrivalTime.split('T')[0]));
  
  // Sort by time
  filteredReservations.sort((a,b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());

  // Notification Timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'info' | 'error') => {
    setNotification({ message, type });
  };

  // --- Handlers ---
  
  // When saving a new customer from the modal, add to global state AND auto-fill the reservation form
  const handleSaveNewCustomer = (customerData: Omit<Customer, 'id' | 'code'>) => {
      addCustomer(customerData);
      setReservationForm(prev => ({
          ...prev,
          customerName: customerData.name,
          phoneNumber: customerData.phone,
          address: customerData.address || ''
      }));
      setIsAddCustomerModalOpen(false);
      showNotification('Đã thêm khách hàng mới và cập nhật vào phiếu!', 'success');
  };

  const handleOpenAddCustomer = (name?: string, phone?: string) => {
      setNewCustomerInitialData({ name, phone });
      setIsAddCustomerModalOpen(true);
  };

  const handleBack = () => {
    if (selectedTableId && activeOrder && activeOrder.items.length === 0) {
        releaseTable(selectedTableId);
    }
    setSelectedTableId(null);
  };

  const handleRequestPayment = () => {
      if (!selectedTableId) return;
      if (isPaymentRequested) {
         showNotification('Bàn này đã gửi yêu cầu thanh toán rồi!', 'info');
         return;
      }
      if (!hasItems) {
          showNotification('Vui lòng gọi món trước khi thanh toán!', 'error');
          return;
      }
      setIsPaymentConfirmOpen(true);
  };

  const confirmPayment = () => {
      if (selectedTableId) {
          requestPayment(selectedTableId);
          showNotification('Đã gửi yêu cầu thanh toán!', 'success');
      }
      setIsPaymentConfirmOpen(false);
  };

  const openCreateModal = (preSelectedTableId?: number) => {
    setReservationForm({
      ...initialFormState,
      arrivalTime: new Date().toISOString().slice(0, 16),
      tableId: preSelectedTableId || 0
    });
    setIsCreateModalOpen(true);
  };

  const openUpdateModal = (res: any) => {
    setReservationForm({
      code: res.code,
      customerName: res.customerName,
      phoneNumber: res.phoneNumber,
      address: res.address || '',
      arrivalTime: res.arrivalTime,
      guestCount: res.guestCount,
      durationHours: res.durationHours,
      depositAmount: res.depositAmount || 0,
      depositMethod: res.depositMethod || 'CASH',
      note: res.note || '',
      tableId: res.tableId || 0,
      preOrderItems: res.preOrderItems || []
    });
    setActiveReservationId(res.id);
    setIsUpdateModalOpen(true);
  };

  const openCancelModal = (resId: string) => {
    setActiveReservationId(resId);
    setCancelReason('');
    setIsCancelModalOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReservation(reservationForm.tableId || undefined, { ...reservationForm });
    setIsCreateModalOpen(false);
    showNotification('Đã tạo đặt bàn thành công!', 'success');
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeReservationId) {
      updateReservation(activeReservationId, { ...reservationForm });
      setIsUpdateModalOpen(false);
      showNotification('Cập nhật đặt bàn thành công!', 'success');
    }
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeReservationId) {
      cancelReservation(activeReservationId, cancelReason);
      setIsCancelModalOpen(false);
      showNotification('Đã hủy đặt bàn.', 'info');
    }
  };

  const handleSaveGuestCount = () => {
      if(selectedTableId) updateOrderInfo(selectedTableId, { guestCount: tempGuestCount });
      setIsGuestModalOpen(false);
  };

  const handleSaveNote = () => {
      if(selectedTableId) updateOrderInfo(selectedTableId, { note: tempNote });
      setIsNoteModalOpen(false);
  };

  const handleLinkReservation = (reservationId: string) => {
      if (selectedTableId) {
          checkInReservation(reservationId, selectedTableId);
          setIsLinkReservationOpen(false);
          showNotification('Đã nhận bàn thành công!', 'success');
      }
  };

  const getTableColor = (table: Table) => {
    if (table.area?.code === TableArea.TAKEAWAY) {
        return 'bg-sky-100 border-sky-300 text-sky-800 hover:bg-sky-200';
    }
    
    // Check if table is occupied but has no items (Active but empty)
    if (table.status === TableStatus.OCCUPIED) {
        const order = getActiveOrder(table.id);
        const hasOrderItems = order && order.items.length > 0;
        
        if (!hasOrderItems) {
            // "Vào bàn nhưng chưa gọi món" -> Keep it white-ish but maybe with a distinct border or slight tint
            return 'bg-white border-green-500 text-green-700 hover:bg-green-50 border-2 border-dashed';
        }
        return 'bg-green-500 border-green-600 text-white hover:bg-green-600'; 
    }

    switch (table.status) {
      case TableStatus.AVAILABLE: return 'bg-white border-gray-300 text-gray-800 hover:bg-gray-50'; 
      case TableStatus.RESERVED: return 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200';
      case TableStatus.PAYMENT_REQUESTED: return 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse hover:bg-rose-200';
      default: return 'bg-white';
    }
  };

  const handleTableClick = (id: number) => {
    console.log('🖱️ Table clicked:', id);
    const table = tables.find(t => t.id === id);
    console.log('📍 Table found:', table?.name, 'Status:', table?.status);
    
    if (table?.status === TableStatus.AVAILABLE) {
      console.log('✅ Starting order for table:', id);
      startOrder(id);
    } else {
      console.log('ℹ️ Table not available, status:', table?.status);
    }
    setSelectedTableId(id);
  };

  const handleAddItem = (item: MenuItem) => {
    if (selectedTable?.status === TableStatus.PAYMENT_REQUESTED) {
        showNotification("Bàn đang chờ thanh toán, không thể gọi thêm món!", "info");
        return;
    }
    if (!item.isActive) {
        showNotification("Món này đã ngừng kinh doanh!", "error");
        return;
    }
    if (item.isOutOfStock) {
        showNotification("Món này đã hết! Vui lòng chọn món khác.", "error");
        return;
    }
    // Thêm món trực tiếp không qua modal
    if (selectedTableId) addItemToOrder(selectedTableId, item, '');
  };
  
  const handleOpenItemNoteModal = (item: MenuItem) => {
    setSelectedMenuItem(item);
    // Tìm note hiện tại của món này nếu có
    const existingItem = activeOrder?.items.find(i => i.itemId === item.id && i.status === ItemStatus.DRAFT);
    setItemNote(existingItem?.note || '');
    setIsItemNoteModalOpen(true);
  };
  
  const handleSaveItemNote = async () => {
    if (selectedTableId && selectedMenuItem && activeOrder) {
      // Tìm tất cả items draft của món này
      const itemIndices = activeOrder.items
        .map((item, idx) => ({ item, idx }))
        .filter(({item}) => item.itemId === selectedMenuItem.id && item.status === ItemStatus.DRAFT)
        .map(({idx}) => idx);
      
      if (itemIndices.length > 0) {
        // Cập nhật note cho tất cả items draft của món này
        const newItems = [...activeOrder.items];
        itemIndices.forEach(idx => {
          newItems[idx] = { ...newItems[idx], note: itemNote.trim() };
        });
        
        // Sync with backend
        try {
          await fetch('http://localhost:3001/api/orders/update-items', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ orderId: activeOrder.id, items: newItems, tableId: selectedTableId })
          });
          showNotification(itemNote.trim() ? 'Đã lưu ghi chú!' : 'Đã xóa ghi chú!', 'success');
        } catch (e) {
          console.error(e);
          showNotification('Lỗi khi lưu ghi chú!', 'error');
        }
      }
      
      setIsItemNoteModalOpen(false);
      setSelectedMenuItem(null);
      setItemNote('');
    }
  };

  const handleCheckItemUpdate = (idx: number, delta: number) => {
     if(selectedTableId) {
         updateItemReturned(selectedTableId, idx, delta);
     }
  };
  
  const resetFilters = () => {
      setResSearchQuery('');
      setResDateFilter(new Date().toISOString().slice(0, 10));
      setResStatusFilter('ALL');
  };

  // --- RENDER HELPERS FOR RESERVATION VIEW ---
  const getStatusBadge = (status: ReservationStatus) => {
      switch(status) {
          case ReservationStatus.PENDING: 
            return <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">Chờ xếp bàn</span>;
          case ReservationStatus.ASSIGNED: 
            return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Đã xếp bàn</span>;
          case ReservationStatus.CHECKED_IN: 
            return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Đã nhận bàn</span>;
          case ReservationStatus.CANCELLED: 
            return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Đã hủy</span>;
          default: return null;
      }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white relative">
      
      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className={`fixed top-20 right-8 z-[100] px-6 py-3 rounded-lg shadow-xl text-white font-medium animate-in slide-in-from-right fade-in duration-300 flex items-center ${
            notification.type === 'success' ? 'bg-emerald-600' : 
            notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          {notification.type === 'success' && <CheckCircle2 className="mr-2 w-5 h-5"/>}
          {notification.type === 'error' && <AlertCircle className="mr-2 w-5 h-5"/>}
          {notification.message}
        </div>
      )}

      {/* --- MODALS --- */}
      {/* 1. Create/Update Reservation Modal */}
      {(isCreateModalOpen || isUpdateModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-100">
              <h3 className="text-gray-800 font-bold text-xl">{isUpdateModalOpen ? 'Cập nhật đặt bàn' : 'Thêm mới đặt bàn'}</h3>
              <button onClick={() => { setIsCreateModalOpen(false); setIsUpdateModalOpen(false); }} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <form onSubmit={isUpdateModalOpen ? handleUpdateSubmit : handleCreateSubmit}>
              <div className="p-8 relative">
                <ReservationForm 
                    formState={reservationForm} 
                    setFormState={setReservationForm} 
                    availableTables={availableTables} 
                    customers={customers}
                    onOpenAddCustomer={handleOpenAddCustomer}
                    isUpdate={isUpdateModalOpen}
                />
              </div>
              <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                 <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center shadow-sm">
                    <Save size={18} className="mr-2"/> Lưu
                 </button>
                 <button type="button" onClick={() => { setIsCreateModalOpen(false); setIsUpdateModalOpen(false); }} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-500 font-bold flex items-center shadow-sm">
                    <X size={18} className="mr-2"/> Bỏ qua
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal (Shared with Manager) */}
      <AddCustomerModal 
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onSave={handleSaveNewCustomer}
        initialData={newCustomerInitialData}
      />

      {/* Cancel Confirmation */}
      {isCancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-red-50 p-4 border-b border-red-100 flex items-center text-red-700">
                      <AlertCircle className="mr-2" size={20}/>
                      <h3 className="font-bold">Hủy đặt bàn</h3>
                  </div>
                  <form onSubmit={handleCancelSubmit}>
                    <div className="p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lý do hủy</label>
                        <textarea 
                            required
                            className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                            rows={3}
                            placeholder="VD: Khách báo hủy, sai thông tin..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="p-4 bg-gray-50 flex gap-3">
                        <button type="button" onClick={() => setIsCancelModalOpen(false)} className="flex-1 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50">Đóng</button>
                        <button type="submit" className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Xác nhận Hủy</button>
                    </div>
                  </form>
              </div>
          </div>
      )}

      {/* Payment Confirmation Modal */}
      {isPaymentConfirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
             <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận thanh toán?</h3>
                <p className="text-gray-500 mb-6">Bạn có chắc chắn muốn gửi yêu cầu thanh toán cho bàn <strong>{selectedTable?.name}</strong> tới thu ngân?</p>
                <div className="flex gap-3">
                   <button onClick={() => setIsPaymentConfirmOpen(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition">Hủy bỏ</button>
                   <button onClick={confirmPayment} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition">Đồng ý</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Action Modals (Guest, Note, CheckItems, LinkRes) - Simplified for brevity in this update */}
      {isGuestModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-xl w-80 p-6 animate-in zoom-in duration-200">
                  <h4 className="font-bold text-lg mb-4 text-center">Số lượng khách</h4>
                  <div className="flex items-center justify-center gap-4 mb-6">
                      <button onClick={() => setTempGuestCount(Math.max(1, tempGuestCount - 1))} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Minus/></button>
                      <span className="text-3xl font-bold w-12 text-center">{tempGuestCount}</span>
                      <button onClick={() => setTempGuestCount(tempGuestCount + 1)} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"><Plus/></button>
                  </div>
                  <button onClick={() => { handleSaveGuestCount(); setIsGuestModalOpen(false); }} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold">Xác nhận</button>
              </div>
          </div>
      )}
      {isNoteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-xl w-96 p-6 animate-in zoom-in duration-200">
                  <h4 className="font-bold text-lg mb-4">Ghi chú đơn hàng</h4>
                  <textarea className="w-full border rounded-lg p-3 min-h-[120px] mb-4 outline-none focus:ring-2 focus:ring-indigo-500" 
                    placeholder="VD: Khách dị ứng tôm, làm ít cay..." value={tempNote} onChange={e => setTempNote(e.target.value)}></textarea>
                  <button onClick={() => { handleSaveNote(); setIsNoteModalOpen(false); }} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold">Lưu ghi chú</button>
              </div>
          </div>
      )}
      
      {/* Item Note Modal */}
      {isItemNoteModalOpen && selectedMenuItem && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-lg shadow-xl w-96 p-6 animate-in zoom-in duration-200">
                  <h4 className="font-bold text-lg mb-2">Ghi chú món: {selectedMenuItem.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">Nhập ghi chú cho bếp (để trống nếu không cần)</p>
                  <textarea 
                    autoFocus
                    className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] mb-4 outline-none focus:ring-2 focus:ring-yellow-500" 
                    placeholder="VD: Làm cay, không hành, thêm cơm..."
                    value={itemNote} 
                    onChange={e => setItemNote(e.target.value)}
                  ></textarea>
                  <div className="flex gap-3">
                    <button onClick={() => { setIsItemNoteModalOpen(false); setSelectedMenuItem(null); }} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300">Hủy</button>
                    <button onClick={handleSaveItemNote} className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 flex items-center justify-center gap-1">
                      <FileText size={16} />
                      Lưu ghi chú
                    </button>
                  </div>
              </div>
          </div>
      )}
      
      {isCheckItemsModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                  <div className="flex justify-between items-center p-4 border-b">
                      <h3 className="font-bold text-lg">Kiểm đồ - {selectedTable?.name}</h3>
                      <button onClick={() => setIsCheckItemsModalOpen(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-sm font-semibold sticky top-0">
                           <tr><th className="p-3">Đồ ăn</th><th className="p-3 text-center">SL gọi</th><th className="p-3 text-center">SL trả</th><th className="p-3 text-center">SL dùng</th><th className="p-3 text-center">Hủy món</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                           {activeOrder?.items.map((item, idx) => (
                              <tr key={idx} className={`hover:bg-gray-50 ${item.status === ItemStatus.CANCELLED ? 'bg-red-50 opacity-60' : ''}`}>
                                 <td className="p-3">
                                    <div className="font-bold text-gray-800">{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.status}</div>
                                    {item.note && <div className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded mt-1">📝 {item.note}</div>}
                                    {item.cancelReason && <div className="text-xs text-red-600 italic mt-1">Lý do: {item.cancelReason}</div>}
                                 </td>
                                 <td className="p-3 text-center font-medium">{item.quantity}</td>
                                 <td className="p-3 text-center">
                                    {item.status !== ItemStatus.CANCELLED ? (
                                       <div className="flex items-center justify-center gap-2">
                                          <button onClick={() => handleCheckItemUpdate(idx, -1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-red-400 hover:text-red-500 transition"><Minus size={12}/></button>
                                          <span className="text-gray-800 w-6 font-bold">{item.returnedQuantity || 0}</span>
                                          <button onClick={() => handleCheckItemUpdate(idx, 1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition"><Plus size={12}/></button>
                                       </div>
                                    ) : (
                                       <span className="text-red-500 text-xs">Đã hủy</span>
                                    )}
                                 </td>
                                 <td className="p-3 text-center font-bold text-gray-800">{item.quantity - (item.returnedQuantity || 0)}</td>
                                 <td className="p-3 text-center">
                                    {item.status !== ItemStatus.CANCELLED && item.status !== ItemStatus.DRAFT ? (
                                       <button 
                                          onClick={() => {
                                             const reason = window.prompt('Lý do hủy món:', 'Khách không muốn dùng');
                                             if (reason && activeOrder && item.id) {
                                                cancelOrderItem(activeOrder.id, item.id, reason);
                                             }
                                          }}
                                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium"
                                       >
                                          Hủy
                                       </button>
                                    ) : item.status === ItemStatus.CANCELLED ? (
                                       <span className="text-red-500 text-xs font-bold">ĐÃ HỦY</span>
                                    ) : (
                                       <span className="text-gray-400 text-xs">-</span>
                                    )}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="p-4 border-t text-right"><button onClick={() => setIsCheckItemsModalOpen(false)} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow-sm">Cập nhật</button></div>
              </div>
          </div>
      )}
      {isLinkReservationOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-transparent backdrop-blur-[1px] p-4">
              <div className="absolute inset-0" onClick={() => setIsLinkReservationOpen(false)}></div>
              <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden animate-in fade-in zoom-in duration-100 border border-green-500 relative z-10 top-[-100px]">
                  <div className="p-3 border-b"><div className="flex items-center bg-white border rounded-full px-3 py-1.5 focus-within:ring-1 focus-within:ring-green-500"><Search size={16} className="text-gray-400 mr-2"/><input autoFocus type="text" className="flex-1 outline-none text-sm" placeholder="Tìm phiếu đặt trước" value={linkSearchQuery} onChange={e => setLinkSearchQuery(e.target.value)}/></div></div>
                  <div className="max-h-60 overflow-y-auto bg-gray-50">
                      {reservations.filter(r => r.status !== ReservationStatus.CHECKED_IN).map(r => (<div key={r.id} onClick={() => { handleLinkReservation(r.id); setIsLinkReservationOpen(false); }} className="p-3 border-b hover:bg-green-50 cursor-pointer group"><div className="flex justify-between items-center"><span className="font-bold text-gray-800 text-sm">{r.code} - {r.customerName}</span><CheckCircle2 size={16} className="text-transparent group-hover:text-green-600"/></div><div className="text-xs text-gray-500 mt-1">{r.phoneNumber}</div></div>))}
                      {reservations.filter(r => r.status !== ReservationStatus.CHECKED_IN).length === 0 && (<div className="p-4 text-center text-xs text-gray-400">Không có phiếu đặt bàn khả dụng</div>)}
                  </div>
              </div>
          </div>
      )}


      {/* --- MAIN CONTENT SWITCHER --- */}
      
      {selectedTableId ? (
        /* --- VIEW: ORDERING --- */
        <div className="flex w-full h-full bg-white">
          {/* LEFT: Menu Area */}
          <div className="flex-1 flex flex-col border-r border-gray-200 bg-gray-50">
             <div className="h-16 bg-white border-b px-4 flex items-center justify-between shadow-sm z-10">
              <button onClick={handleBack} className="flex items-center text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"><ArrowLeft className="w-5 h-5 mr-1" /> Trở lại</button>
              <div className="flex items-center space-x-4">
                 <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto max-w-3xl">
                    {availableCategories.map(cat => (
                      <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap ${selectedCategory === cat ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>{cat}</button>
                    ))}
                 </div>
              </div>
              <div className="w-24"></div>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-6 ${isPaymentRequested ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {menu.filter(item => item.category === selectedCategory).map(item => {
                  const isDisabled = !item.isActive || item.isOutOfStock;
                  return (
                  <div 
                    key={item.id} 
                    onClick={() => !isDisabled ? handleAddItem(item) : null} 
                    className={`bg-white rounded-xl border overflow-hidden transition-all group relative ${
                      !isDisabled 
                        ? 'border-gray-200 cursor-pointer hover:shadow-lg hover:border-indigo-300' 
                        : 'border-gray-300 opacity-60 cursor-not-allowed bg-gray-50'
                    }`}
                  >
                    <div className="h-40 bg-gray-200 relative overflow-hidden">
                      <img src={item.image} alt={item.name} className={`w-full h-full object-cover ${!isDisabled ? 'group-hover:scale-105' : 'grayscale'} transition-transform duration-500`} />
                      {!item.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">TẠM NGỪNG BÁN</span>
                        </div>
                      )}
                      {item.isOutOfStock && item.isActive && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <AlertCircle size={14}/> HẾT MÓN
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                         <span className="text-white font-bold">{item.price.toLocaleString()}đ</span>
                      </div>
                    </div>
                    <div className="p-4"><h4 className={`font-bold ${!isDisabled ? 'text-gray-800' : 'text-gray-400'}`}>{item.name}</h4></div>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Order Panel */}
          {selectedTable && (
            <OrderRightPanel 
                selectedTable={selectedTable}
                activeOrder={activeOrder}
                menu={menu}
                isPaymentRequested={isPaymentRequested}
                onRequestPayment={handleRequestPayment}
                onSendToKitchen={() => { if(selectedTableId) { sendOrderToKitchen(selectedTableId); showNotification('Đã gửi yêu cầu xuống bếp!', 'success'); } }}
                onRemoveItem={(idx) => { if(selectedTableId) removeItemFromOrder(selectedTableId, idx); }}
                onUpdateQuantity={() => {}}
                onOpenGuestModal={() => { setTempGuestCount(activeOrder?.guestCount || 1); setIsGuestModalOpen(true); }}
                onOpenNoteModal={() => { setTempNote(activeOrder?.note || ''); setIsNoteModalOpen(true); }}
                onOpenCheckItemsModal={() => setIsCheckItemsModalOpen(true)}
                onToggleLinkReservation={() => setIsLinkReservationOpen(!isLinkReservationOpen)}
                onOpenItemNote={handleOpenItemNoteModal}
            />
          )}
        </div>
      ) : viewMode === 'MAP' ? (
        /* --- VIEW: MAP --- */
        <div className="flex w-full h-full bg-gray-50 flex-col">
            {/* Header Sơ đồ bàn */}
            <div className="bg-white h-16 border-b px-6 flex items-center justify-between shrink-0 shadow-sm z-20 relative">
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => setViewMode('MAP')}
                        className="text-base font-bold flex items-center py-2 border-b-2 transition-colors text-indigo-600 border-indigo-600"
                    >
                        <LayoutGrid className="mr-2" size={20}/> Sơ đồ bàn
                    </button>
                    <button 
                        onClick={() => setViewMode('RESERVATION')}
                        className="text-base font-bold flex items-center py-2 border-b-2 transition-colors text-gray-500 border-transparent hover:text-gray-700"
                    >
                        <CalendarClock className="mr-2" size={20}/> Đặt bàn
                    </button>
                </div>
                <NotificationBell />
            </div>

            <div className="px-6 pt-4 pb-2">
                <div className="flex items-center space-x-2 mb-4">
                    <button onClick={() => setActiveTab('ALL')} className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === 'ALL' ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Tất cả</button>
                    <button onClick={() => setActiveTab(TableArea.FLOOR_1)} className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === TableArea.FLOOR_1 ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Tầng 1</button>
                    <button onClick={() => setActiveTab(TableArea.FLOOR_2)} className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === TableArea.FLOOR_2 ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>Tầng 2</button>
                    <button onClick={() => setActiveTab(TableArea.VIP)} className={`px-4 py-2 rounded-full text-sm font-bold transition ${activeTab === TableArea.VIP ? 'bg-green-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'}`}>VIP</button>
                </div>
                
                <div className="flex items-center space-x-6 text-sm font-medium text-gray-700">
                    <label className="flex items-center cursor-pointer">
                        <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${tableFilter === 'ALL' ? 'border-green-600' : 'border-gray-300'}`}>
                            {tableFilter === 'ALL' && <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>}
                        </div>
                        <input type="radio" name="tFilter" className="hidden" onChange={() => setTableFilter('ALL')} checked={tableFilter === 'ALL'}/>
                        Tất cả ({tables.length})
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${tableFilter === 'OCCUPIED' ? 'border-green-600' : 'border-gray-300'}`}>
                            {tableFilter === 'OCCUPIED' && <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>}
                        </div>
                        <input type="radio" name="tFilter" className="hidden" onChange={() => setTableFilter('OCCUPIED')} checked={tableFilter === 'OCCUPIED'}/>
                        Sử dụng ({tables.filter(t => t.status !== TableStatus.AVAILABLE).length})
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${tableFilter === 'AVAILABLE' ? 'border-green-600' : 'border-gray-300'}`}>
                            {tableFilter === 'AVAILABLE' && <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>}
                        </div>
                        <input type="radio" name="tFilter" className="hidden" onChange={() => setTableFilter('AVAILABLE')} checked={tableFilter === 'AVAILABLE'}/>
                        Còn trống ({tables.filter(t => t.status === TableStatus.AVAILABLE).length})
                    </label>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {(activeTab === 'ALL' || activeTab === TableArea.TAKEAWAY) && (
                    <div className="mb-8">
                        {activeTab === 'ALL' && <h3 className="text-gray-500 font-bold mb-3 uppercase text-xs tracking-wider">Mang về</h3>}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {filteredTables.filter(t => t.area?.code === TableArea.TAKEAWAY).map(table => (
                                <button
                                key={table.id}
                                onClick={() => handleTableClick(table.id)}
                                className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all h-32 relative shadow-sm hover:shadow-md ${getTableColor(table)}`}
                                >
                                <ShoppingBag className="w-8 h-8 mb-2 opacity-70" />
                                <span className="font-bold text-lg">{table.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredTables.filter(t => t.area?.code !== TableArea.TAKEAWAY).map(table => (
                        <button
                        key={table.id}
                        onClick={() => handleTableClick(table.id)}
                        className={`p-6 rounded-2xl border flex flex-col items-center justify-center transition-all h-40 relative shadow-sm hover:shadow-md ${getTableColor(table)}`}
                        >
                            <div className={`absolute inset-2 border-2 rounded-xl opacity-20 pointer-events-none ${table.status === TableStatus.OCCUPIED && getActiveOrder(table.id)?.items.length ? 'border-white' : 'border-gray-400'}`}></div>
                            <div className="absolute top-0 w-1/2 h-1 bg-gray-300 rounded-b-md"></div>
                            <div className="absolute bottom-0 w-1/2 h-1 bg-gray-300 rounded-t-md"></div>

                            <span className="font-bold text-2xl mb-1 relative z-10">{table.name}</span>
                            {table.status === TableStatus.PAYMENT_REQUESTED && (
                                <div className="absolute top-2 right-2 animate-bounce z-20">
                                <AlertCircle className="text-rose-600 w-6 h-6" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      ) : (
        /* --- VIEW: RESERVATION MANAGEMENT (FULL SCREEN) --- */
        <div className="flex w-full h-full bg-white flex-col">
            {/* Header Navigation */}
            <div className="bg-white h-16 border-b px-6 flex items-center justify-between shrink-0 shadow-sm z-20 relative">
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => setViewMode('MAP')}
                        className="text-base font-bold flex items-center py-2 border-b-2 transition-colors text-gray-500 border-transparent hover:text-gray-700"
                    >
                        <LayoutGrid className="mr-2" size={20}/> Sơ đồ bàn
                    </button>
                    <button 
                        onClick={() => setViewMode('RESERVATION')}
                        className="text-base font-bold flex items-center py-2 border-b-2 transition-colors text-indigo-600 border-indigo-600"
                    >
                        <CalendarClock className="mr-2" size={20}/> Đặt bàn
                    </button>
                </div>
                <NotificationBell />
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar Filter */}
                <div className="w-72 bg-gray-50 border-r border-gray-200 p-5 flex flex-col space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Mã đặt bàn, tên, SĐT..." 
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white"
                                value={resSearchQuery}
                                onChange={(e) => setResSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-700"
                                value={resDateFilter}
                                onChange={(e) => setResDateFilter(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <div className="relative">
                            <select 
                                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white appearance-none"
                                value={resStatusFilter}
                                onChange={(e) => setResStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Tất cả</option>
                                <option value="PENDING">Chờ xếp bàn</option>
                                <option value="ASSIGNED">Đã xếp bàn</option>
                                <option value="CHECKED_IN">Đã nhận bàn</option>
                                <option value="CANCELLED">Đã hủy</option>
                            </select>
                            <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <button 
                        onClick={resetFilters}
                        className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 font-medium transition"
                    >
                        Xóa bộ lọc
                    </button>
                </div>

                {/* Main Table Content */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Quản lý đặt bàn</h2>
                        <button 
                            onClick={() => openCreateModal()} 
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 transition flex items-center shadow-sm"
                        >
                            <Plus size={18} className="mr-2"/> Đặt bàn mới
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-600 font-semibold text-sm">
                                    <tr>
                                        <th className="p-4 border-b w-32">Mã đặt bàn</th>
                                        <th className="p-4 border-b">Thời gian</th>
                                        <th className="p-4 border-b">Thông tin khách</th>
                                        <th className="p-4 border-b text-center">Số khách</th>
                                        <th className="p-4 border-b text-center">Trạng thái</th>
                                        <th className="p-4 border-b">Ghi chú</th>
                                        <th className="p-4 border-b text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {filteredReservations.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-400">Không tìm thấy dữ liệu đặt bàn</td>
                                        </tr>
                                    ) : (
                                        filteredReservations.map(res => (
                                            <tr key={res.id} className="hover:bg-gray-50 transition">
                                                <td className="p-4 font-bold text-indigo-700">{res.code}</td>
                                                <td className="p-4 text-gray-600">{res.arrivalTime.replace('T', ' ')}</td>
                                                <td className="p-4">
                                                    <div className="font-bold text-gray-800">{res.customerName}</div>
                                                    <div className="text-gray-500 text-xs">{res.phoneNumber}</div>
                                                </td>
                                                <td className="p-4 text-center text-gray-700">{res.guestCount}</td>
                                                <td className="p-4 text-center">
                                                    {getStatusBadge(res.status)}
                                                </td>
                                                <td className="p-4 text-gray-500 italic max-w-xs truncate">{res.note || '-'}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => openUpdateModal(res)}
                                                            className="p-2 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition"
                                                            title="Cập nhật"
                                                        >
                                                            <Edit2 size={16}/>
                                                        </button>
                                                        <button 
                                                            onClick={() => openCancelModal(res.id)}
                                                            className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition"
                                                            title="Hủy / Xóa"
                                                        >
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* Out of Stock Banner */}
      <OutOfStockBanner />
    </div>
  );
};

export default WaiterView;
