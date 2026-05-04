import React, { useEffect, useState } from 'react';
import { Table, Order, ItemStatus, TableStatus, OrderItem, MenuItem } from '../../types';
import { Receipt, Coffee, Minus, Plus, Trash2, User, FileText, ListChecks, Ticket, AlertCircle, Send, CheckCircle, ChefHat, Ban } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { io } from 'socket.io-client';

const socket = io('/', { path: '/socket.io' });

interface OrderRightPanelProps {
  selectedTable: Table;
  activeOrder: Order | undefined;
  menu: MenuItem[];
  isPaymentRequested: boolean;
  onRequestPayment: () => void;
  onSendToKitchen: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateQuantity: (item: any, delta: number) => void;
  onOpenGuestModal: () => void;
  onOpenNoteModal: () => void;
  onOpenCheckItemsModal: () => void;
  onToggleLinkReservation: () => void;
  onOpenItemNote: (item: MenuItem) => void;
}

interface GroupedOrderItem extends OrderItem {
  totalQuantity: number;
  draftQuantity: number;
  sentQuantity: number;
  originalIndices: number[];
  draftIndices: number[];
}

export const OrderRightPanel: React.FC<OrderRightPanelProps> = ({
  selectedTable,
  activeOrder,
  menu,
  isPaymentRequested,
  onRequestPayment,
  onSendToKitchen,
  onOpenGuestModal,
  onOpenNoteModal,
  onOpenCheckItemsModal,
  onToggleLinkReservation,
  onOpenItemNote
}) => {
  const { addItemToOrder, updateItemQuantity, removeItemFromOrder, reservations } = usePOS();
  const [readyItemsAlert, setReadyItemsAlert] = useState<string[]>([]);
  
  // Listen for DATA_UPDATED to check for ready items
  useEffect(() => {
    const handleDataUpdate = () => {
      if (activeOrder) {
        const readyItems = activeOrder.items.filter(item => item.status === ItemStatus.READY);
        if (readyItems.length > 0) {
          const readyNames = readyItems.map(item => `${item.quantity}x ${item.name}`);
          setReadyItemsAlert(readyNames);
          
          // Auto clear after 5 seconds
          setTimeout(() => setReadyItemsAlert([]), 5000);
        }
      }
    };
    
    socket.on('DATA_UPDATED', handleDataUpdate);
    return () => {
      socket.off('DATA_UPDATED', handleDataUpdate);
    };
  }, [activeOrder]);
  
  // Helper to get item status display
  const getItemStatusInfo = (item: OrderItem) => {
    if (item.status === ItemStatus.CANCELLED) {
      return { icon: Ban, label: 'Đã hủy', color: 'text-red-600 bg-red-50', textColor: 'text-red-600' };
    }
    if (item.status === ItemStatus.SERVED) {
      return { icon: CheckCircle, label: 'Đã phục vụ', color: 'text-blue-600 bg-blue-50', textColor: 'text-blue-600' };
    }
    if (item.status === ItemStatus.READY) {
      return { icon: CheckCircle, label: 'Đã xong - Sẵn sàng phục vụ', color: 'text-green-600 bg-green-50', textColor: 'text-green-600', pulse: true };
    }
    if (item.status === ItemStatus.COOKING) {
      return { icon: ChefHat, label: 'Đang nấu', color: 'text-orange-600 bg-orange-50', textColor: 'text-orange-600' };
    }
    if (item.status === ItemStatus.PENDING) {
      return { icon: ChefHat, label: 'Đang chờ bếp', color: 'text-yellow-600 bg-yellow-50', textColor: 'text-yellow-600' };
    }
    return null;
  };
  
  // Logic to group items by ID + Note (Ignoring Status for the Key)
  const groupedOrderItems = (activeOrder?.items || []).reduce((acc, item, originalIndex) => {
     // Key is ItemID + Note. This merges Pending and Draft.
     const key = `${item.itemId}-${item.note || ''}`;
     
     if (!acc[key]) {
        acc[key] = {
            ...item,
            totalQuantity: 0,
            draftQuantity: 0,
            sentQuantity: 0,
            returnedQuantity: 0,
            originalIndices: [], // Store all indices for this group
            draftIndices: [],    // Store indices of draft items
        };
     }
     
     acc[key].totalQuantity += item.quantity;
     acc[key].returnedQuantity += (item.returnedQuantity || 0);
     acc[key].originalIndices.push(originalIndex);

     if (item.status === ItemStatus.DRAFT) {
         acc[key].draftQuantity += item.quantity;
         acc[key].draftIndices.push(originalIndex);
     } else if ([ItemStatus.PENDING, ItemStatus.COOKING, ItemStatus.READY, ItemStatus.SERVED].includes(item.status)) {
         acc[key].sentQuantity += item.quantity;
     }

     return acc;
  }, {} as Record<string, GroupedOrderItem>);

  const displayItems: GroupedOrderItem[] = Object.values(groupedOrderItems);
  const hasUnsentItems = activeOrder?.items.some(i => i.status === ItemStatus.DRAFT);
  const hasReturnedItems = activeOrder?.items.some(i => (i.returnedQuantity || 0) > 0);
  const hasGuestInfo = activeOrder && activeOrder.guestCount && activeOrder.guestCount > 1;
  
  // Get customer name - check activeOrder.reservationId first, then selectedTable.reservation
  const getCustomerName = () => {
    if (activeOrder?.reservationId) {
      const reservation = reservations.find(r => r.id === activeOrder.reservationId);
      if (reservation) return `${reservation.code} - ${reservation.customerName}`;
    }
    if (selectedTable.reservation) {
      return `${selectedTable.reservation.code} - ${selectedTable.reservation.customerName}`;
    }
    return 'Khách lẻ';
  };
  const customerName = getCustomerName();

  // Calculate total (Quantity - Returned) * Price, excluding CANCELLED items
  const orderTotal = activeOrder ? activeOrder.items
    .filter(i => i.status !== ItemStatus.CANCELLED)
    .reduce((acc, i) => acc + (i.price * (i.quantity - (i.returnedQuantity || 0))), 0) : 0;
  
  // Handle quantity update (Prioritize Draft)
  const handleAggregatedQuantityUpdate = (displayItem: GroupedOrderItem, delta: number) => {
      if (isPaymentRequested) return;

      const menuItem = menu.find(m => m.id === displayItem.itemId);
      
      if (delta > 0) {
          // Add: Always create/add to DRAFT
          if(menuItem) {
              addItemToOrder(selectedTable.id, menuItem, displayItem.note);
          }
      } else {
          // Remove: Only remove from DRAFT
          if (displayItem.draftQuantity > 0 && displayItem.draftIndices.length > 0) {
              // Find the last draft item to reduce
              const lastDraftIndex = displayItem.draftIndices[displayItem.draftIndices.length - 1];
              updateItemQuantity(selectedTable.id, lastDraftIndex, -1);
          } else {
              // No drafts to remove, user is trying to remove Sent items.
              alert("Không thể giảm số lượng món đã gửi bếp. Vui lòng dùng chức năng Hủy món (nếu có quyền).");
          }
      }
  };

  // Handle remove entire row (Only if it's all draft, or just remove the draft portion?)
  // For simplicity: Remove only DRAFT portion.
  const handleRemoveRow = (displayItem: GroupedOrderItem) => {
      if (displayItem.draftIndices.length > 0) {
          [...displayItem.draftIndices].reverse().forEach((idx: number) => {
               removeItemFromOrder(selectedTable.id, idx);
          });
      }
  };

  return (
    <div className="w-[420px] bg-white flex flex-col shadow-2xl z-20 h-full">
      {/* Header */}
      <div className="h-16 bg-indigo-600 text-white flex items-center justify-between px-6 shadow-md shrink-0">
        <div className="flex flex-col">
            <div className="font-bold text-lg flex items-center"><Receipt className="mr-2 opacity-80" /> {selectedTable?.name}</div>
            <div className="text-xs text-indigo-200">{customerName}</div>
        </div>
        <div className="text-indigo-100 text-sm">{selectedTable?.status === TableStatus.AVAILABLE ? 'Mới' : 'Đang phục vụ'}</div>
      </div>
      
      {/* Ready Items Alert */}
      {readyItemsAlert.length > 0 && (
        <div className="bg-green-500 text-white px-4 py-3 shadow-lg shrink-0 animate-pulse">
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold mb-1">✨ Món đã xong - Sẵn sàng phục vụ!</div>
              <div className="text-sm opacity-90">
                {readyItemsAlert.join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
        {!displayItems || displayItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60"><Coffee className="w-16 h-16 mb-4 stroke-1" /><p className="font-medium">Chưa có món nào</p></div>
        ) : (
          displayItems.map((item, idx) => (
            <div key={`${item.itemId}-${idx}`} className={`relative flex flex-col p-3 rounded-lg border shadow-sm transition-all ${
               item.draftQuantity > 0 ? 'bg-white border-indigo-200 ring-1 ring-indigo-50' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-start mb-1">
                 <div className="flex-1 pr-2">
                   <span className="font-bold text-gray-800 block text-lg">{item.name}</span>
                   <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                      {item.sentQuantity > 0 && (
                          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">{item.sentQuantity} Đã gửi</span>
                      )}
                      {item.draftQuantity > 0 && (
                          <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">{item.draftQuantity} Mới</span>
                      )}
                      {item.returnedQuantity > 0 && (
                          <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Trả {item.returnedQuantity}</span>
                      )}
                      {item.note && <span className="text-gray-400 italic"> - {item.note}</span>}
                   </div>
                   
                   {/* Status indicators for each item */}
                   <div className="mt-2 space-y-1">
                     {item.originalIndices.map((origIdx) => {
                       const origItem = activeOrder?.items[origIdx];
                       if (!origItem) return null;
                       const statusInfo = getItemStatusInfo(origItem);
                       if (!statusInfo) return null;
                       
                       const StatusIcon = statusInfo.icon;
                       return (
                         <div key={origIdx} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${statusInfo.color} ${statusInfo.pulse ? 'animate-pulse' : ''}`}>
                           <StatusIcon size={12} className={statusInfo.textColor} />
                           <span className={`font-semibold ${statusInfo.textColor}`}>
                             {origItem.quantity}x - {statusInfo.label}
                           </span>
                           {origItem.cancelReason && (
                             <span className="text-xs text-red-500 italic ml-1">({origItem.cancelReason})</span>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
                 <span className="font-bold text-indigo-600 text-lg">{(item.price * (item.totalQuantity - item.returnedQuantity)).toLocaleString()}đ</span>
              </div>

              <div className="flex items-center justify-between mt-2">
                 {/* Logic for Quantity Control */}
                 <div className={`flex items-center bg-gray-100 rounded-lg p-1 ${isPaymentRequested ? 'opacity-50 pointer-events-none' : ''}`}>
                      <button 
                          onClick={() => handleAggregatedQuantityUpdate(item, -1)} 
                          // Disable minus if no drafts (cannot simple-remove sent items)
                          disabled={item.draftQuantity === 0}
                          className={`w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm transition ${item.draftQuantity === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-indigo-600'}`}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-12 text-center font-bold text-gray-800 text-lg bg-transparent">SL: {item.totalQuantity}</span>
                      <button 
                          onClick={() => handleAggregatedQuantityUpdate(item, 1)} 
                          className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-indigo-600 transition"
                      >
                        <Plus size={14} />
                      </button>
                 </div>

                 <div className="flex items-center gap-2">
                   {/* Nút Ghi chú - chỉ hiện cho món DRAFT */}
                   {item.draftQuantity > 0 && (
                      <button 
                        onClick={() => {
                          const menuItem = menu.find(m => m.id === item.itemId);
                          if (menuItem) onOpenItemNote(menuItem);
                        }} 
                        className={`p-2 rounded-full transition ${
                          item.note 
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                            : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                        }`}
                        title="Ghi chú cho món này"
                      >
                        <FileText size={18} />
                      </button>
                   )}
                   
                   {item.draftQuantity > 0 && (
                      <button onClick={() => handleRemoveRow(item)} className="text-rose-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-full transition" title="Xóa món mới gọi">
                        <Trash2 size={18} />
                      </button>
                   )}
                 </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Actions */}
      <div className="bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-30 shrink-0 relative">
         {/* Icons Row */}
         <div className="flex justify-between items-center mb-4">
           <div className="flex items-center space-x-3 text-gray-400">
               <button onClick={onOpenGuestModal} className={`hover:text-green-600 transition relative ${hasGuestInfo ? 'text-green-600' : ''}`} title="Số lượng khách">
                  <User size={20}/>
                  {activeOrder?.guestCount && <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-[9px] flex items-center justify-center rounded-full">{activeOrder.guestCount}</span>}
               </button>
               <button onClick={onOpenNoteModal} className={`hover:text-green-600 transition ${activeOrder?.note ? 'text-green-600' : ''}`} title="Ghi chú"><FileText size={20}/></button>
               <div className="w-px h-5 bg-gray-300 mx-2"></div>
               <button onClick={onOpenCheckItemsModal} className={`hover:text-green-600 transition ${hasReturnedItems ? 'text-green-600' : ''}`} title="Kiểm đồ"><ListChecks size={20}/></button>
               
               {/* Updated Ticket Button Style */}
               <button 
                  onClick={onToggleLinkReservation} 
                  className={`transition relative p-1 rounded-md ${activeOrder?.reservationId || selectedTable?.reservation ? 'bg-green-100 text-green-700 font-bold' : 'hover:text-green-600'}`} 
                  title="Phiếu đặt bàn"
               >
                  <Ticket size={20}/>
               </button>
           </div>
           <div className="text-right">
              <div className="text-xs text-gray-500 font-medium">Tổng tạm tính</div>
              <div className="text-2xl font-black text-gray-900 leading-none">{orderTotal.toLocaleString()}đ</div>
           </div>
        </div>

        {/* Big Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-50">
           <button
             type="button"
             onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 onRequestPayment();
             }}
             className={`flex items-center justify-center py-4 rounded-lg font-bold transition shadow-sm cursor-pointer select-none active:scale-95
              ${isPaymentRequested 
                  ? 'bg-gray-200 text-gray-400' 
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-md'}`}
           >
             <AlertCircle className={`w-5 h-5 mr-2 ${isPaymentRequested ? 'text-gray-400' : 'text-white'}`}/> 
             {isPaymentRequested ? 'Đã yêu cầu' : 'Yêu cầu thanh toán'}
           </button>

           <button 
             onClick={onSendToKitchen}
             disabled={!hasUnsentItems}
             className={`flex items-center justify-center py-4 rounded-lg font-bold shadow-sm transition-all border-2 border-transparent ${hasUnsentItems ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
           >
             <Send className="w-5 h-5 mr-2" /> Gửi Bếp
           </button>
        </div>
      </div>
    </div>
  );
};