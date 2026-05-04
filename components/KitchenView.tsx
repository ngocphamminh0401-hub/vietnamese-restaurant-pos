import React, { useState } from 'react';
import { usePOS } from '../context/POSContext';
import { ItemStatus } from '../types';
import { ChefHat, Check, Flame, Bell, ArrowRight, Clock, Layers, LayoutGrid, List, CheckCircle2, AlertTriangle, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ItemNotificationModal } from './manager/ItemNotificationModal';

type FilterMode = 'PRIORITY' | 'ITEM' | 'TABLE';

const KitchenView: React.FC = () => {
  const { orders, tables, updateItemStatus, menu, createNotification } = usePOS();
  const { user } = useAuth();
  
  // Filter for Pending column only
  const [pendingFilter, setPendingFilter] = useState<FilterMode>('PRIORITY');

  // Cancel Modal State
  const [cancelModal, setCancelModal] = useState<{isOpen: boolean, orderId: string, idx: number, name: string} | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Out of Stock Modal State
  const [outOfStockModal, setOutOfStockModal] = useState<{isOpen: boolean, itemName: string, itemId: string} | null>(null);
  const [outOfStockResult, setOutOfStockResult] = useState<string>('');

  // Notification Modal State - simplified to just isOpen
  const [notificationModal, setNotificationModal] = useState<boolean>(false);


  const getTable = (tableId: number) => tables.find(t => t.id === tableId);
  const getTableName = (tableId: number) => getTable(tableId)?.name || `Bàn ${tableId}`;
  
  // Helper to flatten orders
  const getAllItems = () => {
    const items: any[] = [];
    orders.forEach(order => {
      if (!order.isPaid) {
        order.items.forEach((item, index) => {
           // Only show items relevant to kitchen
           if (item.status !== ItemStatus.DRAFT && item.status !== ItemStatus.SERVED && item.status !== ItemStatus.CANCELLED) {
             items.push({
               ...item,
               orderId: order.id,
               tableId: order.tableId,
               originalIndex: index,
               orderTime: order.startTime,
               itemTimestamp: item.timestamp
             });
           }
        });
      }
    });
    return items.sort((a, b) => a.itemTimestamp - b.itemTimestamp);
  };

  const allItems = getAllItems();

  // Split Columns
  const pendingList = allItems.filter(i => i.status === ItemStatus.PENDING || i.status === ItemStatus.COOKING);
  const readyList = allItems.filter(i => i.status === ItemStatus.READY);
  
  // Count items with notes
  const itemsWithNotes = pendingList.filter(i => i.note && i.note.trim().length > 0).length;

  // Helper: Time Elapsed
  const getTimeElapsed = (timestamp: number) => {
    const min = Math.floor((Date.now() - timestamp) / 60000);
    if (min < 1) return 'vài giây trước';
    if (min < 60) return `${min} phút trước`;
    return `${Math.floor(min/60)} giờ trước`;
  };

  // Helper: Batch Action
  const handleBatchStatusUpdate = (items: any[], status: ItemStatus) => {
      items.forEach(item => {
          updateItemStatus(item.orderId, item.originalIndex, status);
      });
  };

  const openCancelModal = (orderId: string, idx: number, name: string) => {
      setCancelReason('');
      setCancelModal({ isOpen: true, orderId, idx, name });
  };

  const confirmCancel = async () => {
      if (cancelModal) {
          console.log(`Item cancelled. Reason: ${cancelReason}`);
          
          // Get order and item info
          const order = orders.find(o => o.id === cancelModal.orderId);

          const item = order?.items[cancelModal.idx];
          
          if (!item) {
              console.error('Item not found');
              setCancelModal(null);
              return;
          }
          
          // Call API to cancel item with reason
          try {
              const response = await fetch('/api/orders/cancel-item', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      orderId: cancelModal.orderId,
                      itemId: item.id,
                      cancelReason: cancelReason || 'Bếp hủy',
                      userId: user?.id,
                      username: user?.displayName || user?.username
                  })
              });
              
              if (!response.ok) {
                  throw new Error('Failed to cancel item');
              }
              
              console.log('✅ Item cancelled successfully with reason');
          } catch (error) {
              console.error('Failed to cancel item:', error);
          }
          
          setCancelModal(null);
      }
  };
  
  const openOutOfStockModal = (itemName: string, itemId: string) => {
      setOutOfStockResult('');
      setOutOfStockModal({ isOpen: true, itemName, itemId });
  };
  
  const confirmOutOfStock = async () => {
      if (!outOfStockModal) return;
      
      try {
          const response = await fetch('/api/menu/out-of-stock', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  itemName: outOfStockModal.itemName,
                  itemId: outOfStockModal.itemId,
                  userId: user?.id,
                  username: user?.displayName || user?.username
              })
          });
          
          if (response.ok) {
              const data = await response.json();
              if (data.affectedTables > 0) {
                  setOutOfStockResult(`Đã thông báo cho ${data.affectedTables} bàn: ${data.tables.join(', ')}`);
              } else {
                  setOutOfStockResult('Không có bàn nào đang order món này');
              }
              setTimeout(() => {
                  setOutOfStockModal(null);
                  setOutOfStockResult('');
              }, 3000);
          }
      } catch (e) {
          console.error('Out of stock error:', e);
          setOutOfStockResult('Có lỗi xảy ra');
      }
  };

  const handleNotificationSubmit = async (selectedItems: any[], message: string, notificationType: 'OUT_OF_STOCK' | 'BACK_IN_STOCK') => {
      try {
          const type = notificationType === 'OUT_OF_STOCK' 
              ? 'ITEM_OUT_OF_STOCK'
              : 'ITEM_BACK_IN_STOCK';
          
          const title = notificationType === 'OUT_OF_STOCK' 
              ? 'Thông báo hết món' 
              : 'Thông báo còn món';
          
          const itemNames = selectedItems.map(i => i.name).join(', ');
          const itemIds = selectedItems.map(i => i.id);
          
          console.log('🔔 Submitting notification:', { type, title, message, itemNames, itemIds });
          
          const notificationData = {
              type,
              title,
              message,
              data: JSON.stringify({ itemIds, itemNames }),
              targetRoles: 'WAITER,MANAGER',
              userId: user?.id || '',
              username: user?.displayName || user?.username || 'Unknown'
          };
          
          console.log('📤 Notification payload:', notificationData);
          
          await createNotification(notificationData as any);
          
          console.log('✅ Notification sent successfully');
          alert(`✅ Đã gửi thông báo ${notificationType === 'OUT_OF_STOCK' ? 'hết món' : 'còn món'}: ${itemNames}`);
      } catch (e: any) {
          console.error('❌ Notification error:', e);
          console.error('Error details:', e.message, e.stack);
          alert(`❌ Có lỗi xảy ra khi gửi thông báo: ${e.message || 'Unknown error'}`);
      }
  };

  // --- RENDERERS FOR PENDING COLUMN ---

  const renderPendingPriority = () => (
      <div className="divide-y divide-gray-50">
          {pendingList.map(item => (
              <div key={`${item.orderId}-${item.originalIndex}`} className={`bg-white p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group border-l-4 ${item.status === ItemStatus.COOKING ? 'border-orange-500 bg-orange-50/30' : 'border-transparent'}`}>
                  <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-gray-800 text-lg">{item.name}</span>
                          <span className="font-bold text-xl text-gray-900 mx-4">x{item.quantity}</span>
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span className="font-medium text-gray-700 bg-gray-200 px-2 py-0.5 rounded text-xs">{getTableName(item.tableId)}</span>
                          <span className="text-xs flex items-center"><Clock size={10} className="mr-1"/> {getTimeElapsed(item.itemTimestamp)}</span>
                      </div>
                      {item.note && (
                          <div className="mt-2 text-sm bg-yellow-50 border-2 border-yellow-400 p-3 rounded-lg relative shadow-lg animate-pulse" style={{boxShadow: '0 0 15px rgba(234, 179, 8, 0.5)'}}>
                              <div className="absolute -top-3 -right-3 bg-yellow-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                                  <Bell size={12} className="animate-pulse" />
                                  GHI CHÚ
                              </div>
                              <div className="flex items-start gap-2">
                                  <span className="text-2xl">📝</span>
                                  <div className="flex-1">
                                      <span className="font-black text-yellow-900 block mb-1">Ghi chú từ khách:</span>
                                      <span className="text-yellow-900 font-semibold text-base">{item.note}</span>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                      {item.status === ItemStatus.PENDING ? (
                          <button onClick={() => updateItemStatus(item.orderId, item.originalIndex, ItemStatus.COOKING)} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 font-bold text-sm">Nấu</button>
                      ) : (
                          <button onClick={() => updateItemStatus(item.orderId, item.originalIndex, ItemStatus.READY)} className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-bold text-sm animate-pulse">Xong</button>
                      )}
                       <button onClick={() => openCancelModal(item.orderId, item.originalIndex, item.name)} className="p-2 text-gray-300 hover:text-red-500 transition-colors" title="Hủy món"><Bell size={18}/></button>
                  </div>
              </div>
          ))}
      </div>
  );

  const renderPendingItem = () => {
      const grouped = pendingList.reduce((acc: any, item) => {
          const key = item.itemId; 
          if (!acc[key]) acc[key] = { ...item, totalQty: 0, subItems: [] };
          acc[key].totalQty += item.quantity;
          acc[key].subItems.push(item);
          return acc;
      }, {});
      return (
          <div className="p-4 grid grid-cols-1 gap-4">
              {Object.values(grouped).map((group: any) => (
                  <div key={group.itemId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                          <div><h3 className="font-bold text-xl text-gray-800">{group.name}</h3></div>
                          <span className="bg-indigo-100 text-indigo-800 text-2xl font-black px-3 py-1 rounded-lg">{group.totalQty}</span>
                      </div>
                      <div className="space-y-2 mb-4">
                          {group.subItems.map((sub: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-700 w-16 truncate">{getTableName(sub.tableId)}</span>
                                      <span className="text-gray-400 text-xs">{getTimeElapsed(sub.itemTimestamp)}</span>
                                      {sub.note && <span className="text-red-500 text-xs italic">({sub.note})</span>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="font-bold">x{sub.quantity}</span>
                                      <button onClick={() => updateItemStatus(sub.orderId, sub.originalIndex, ItemStatus.READY)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Xong</button>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <button onClick={() => handleBatchStatusUpdate(group.subItems, ItemStatus.READY)} className="w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Hoàn thành tất cả ({group.totalQty})</button>
                  </div>
              ))}
          </div>
      );
  };

  const renderPendingTable = () => {
      const grouped = pendingList.reduce((acc: any, item) => {
          const key = item.tableId;
          if (!acc[key]) acc[key] = { tableId: item.tableId, items: [] };
          acc[key].items.push(item);
          return acc;
      }, {});
      return (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.values(grouped).map((group: any) => (
                  <div key={group.tableId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
                          <span className="font-bold text-lg">{getTableName(group.tableId)}</span>
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded">{getTimeElapsed(group.items[0].itemTimestamp)}</span>
                      </div>
                      <div className="p-2 divide-y divide-gray-100">
                          {group.items.map((item: any) => (
                              <div key={`${item.orderId}-${item.originalIndex}`} className={`py-2 flex justify-between items-center ${item.status === ItemStatus.CANCELLED ? 'opacity-50 bg-red-50' : ''}`}>
                                  <div className="flex-1">
                                      <div className="font-bold text-gray-800">
                                          {item.name} <span className="text-indigo-600 ml-1">x{item.quantity}</span>
                                          {item.status === ItemStatus.CANCELLED && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">ĐÃ HỦY</span>}
                                      </div>
                                      {item.note && (
                                          <div className="mt-1 text-sm bg-yellow-50 border-2 border-yellow-400 p-2 rounded-lg relative shadow-lg animate-pulse" style={{boxShadow: '0 0 15px rgba(234, 179, 8, 0.5)'}}>
                                              <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                                                  <Bell size={10} />
                                                  GHI CHÚ
                                              </div>
                                              <div className="flex items-start gap-2">
                                                  <span className="text-xl">📝</span>
                                                  <div className="flex-1">
                                                      <span className="font-bold text-yellow-800 block">Ghi chú:</span>
                                                      <span className="text-yellow-900 font-semibold">{item.note}</span>
                                                  </div>
                                              </div>
                                          </div>
                                      )}
                                      {item.cancelReason && (
                                          <div className="text-xs text-red-600 italic mt-1">Lý do hủy: {item.cancelReason}</div>
                                      )}
                                  </div>
                                  {item.status !== ItemStatus.CANCELLED && (
                                      <div className="flex gap-1 ml-2">
                                         <button onClick={() => updateItemStatus(item.orderId, item.originalIndex, ItemStatus.READY)} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200" title="Đánh dấu món đã xong"><Check size={16}/></button>
                                         <button onClick={() => openCancelModal(item.orderId, item.originalIndex, item.name)} className="p-1.5 text-gray-300 hover:text-red-500" title="Hủy món này"><Bell size={16}/></button>
                                         <button onClick={() => openOutOfStockModal(item.name, item.itemId)} className="p-1.5 text-gray-300 hover:text-orange-500" title="Báo hết món"><AlertTriangle size={16}/></button>
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      );
  };

  // --- RENDERERS FOR READY COLUMN (Simplified) ---

  const renderReadyList = () => (
    <div className="divide-y divide-gray-50">
        {readyList.map(item => (
             <div key={`${item.orderId}-${item.originalIndex}`} className="bg-white p-4 hover:bg-green-50 transition-colors flex items-center justify-between group">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800 text-lg">{item.name}</span>
                        <span className="font-bold text-xl text-green-600 mx-4">x{item.quantity}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <span className="font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs">{getTableName(item.tableId)}</span>
                        <span className="text-xs flex items-center"><Clock size={10} className="mr-1"/> {getTimeElapsed(item.itemTimestamp)}</span>
                    </div>
                </div>
                <div className="pl-4">
                    <button 
                        onClick={() => updateItemStatus(item.orderId, item.originalIndex, ItemStatus.SERVED)}
                        className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-bold rounded shadow hover:bg-green-700 transition"
                    >
                        Cung ứng <ArrowRight size={16} className="ml-1"/>
                    </button>
                </div>
             </div>
        ))}
    </div>
  );

  // Helper Component for Filter Buttons
  const FilterButtons = ({ mode, setMode, activeColorClass }: { mode: FilterMode, setMode: (m: FilterMode) => void, activeColorClass: string }) => (
      <div className="flex bg-gray-100 rounded-lg p-1">
          <button 
              onClick={() => setMode('PRIORITY')}
              className={`flex items-center px-3 py-1.5 text-xs font-bold rounded-md transition ${mode === 'PRIORITY' ? `bg-white ${activeColorClass} shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
          >
              <List size={14} className="mr-1"/> Ưu tiên
          </button>
          <button 
              onClick={() => setMode('ITEM')}
              className={`flex items-center px-3 py-1.5 text-xs font-bold rounded-md transition ${mode === 'ITEM' ? `bg-white ${activeColorClass} shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
          >
              <Layers size={14} className="mr-1"/> Theo món
          </button>
          <button 
              onClick={() => setMode('TABLE')}
              className={`flex items-center px-3 py-1.5 text-xs font-bold rounded-md transition ${mode === 'TABLE' ? `bg-white ${activeColorClass} shadow-sm` : 'text-gray-500 hover:text-gray-700'}`}
          >
              <LayoutGrid size={14} className="mr-1"/> Theo bàn
          </button>
      </div>
  );

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-100 flex overflow-hidden relative">
      
      {/* CANCEL MODAL */}
      {cancelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-red-50 p-4 border-b border-red-100 flex items-center text-red-700">
                      <Bell className="mr-2" size={20}/>
                      <h3 className="font-bold">Hủy món: {cancelModal.name}</h3>
                  </div>
                  <div className="p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Lý do hủy món</label>
                      <textarea 
                        autoFocus
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                        rows={3}
                        placeholder="VD: Hết nguyên liệu, khách đổi ý..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      ></textarea>
                  </div>
                  <div className="p-4 bg-gray-50 flex gap-3">
                      <button onClick={() => setCancelModal(null)} className="flex-1 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50">Đóng</button>
                      <button onClick={confirmCancel} disabled={!cancelReason.trim()} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">Xác nhận Hủy</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* OUT OF STOCK MODAL */}
      {outOfStockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center text-orange-700">
                      <AlertTriangle className="mr-2" size={20}/>
                      <h3 className="font-bold">Báo hết món: {outOfStockModal.itemName}</h3>
                  </div>
                  <div className="p-6">
                      {outOfStockResult ? (
                          <div className="flex items-center text-green-700 bg-green-50 p-4 rounded-lg">
                              <Check className="mr-2 flex-shrink-0" size={20}/>
                              <span className="font-medium">{outOfStockResult}</span>
                          </div>
                      ) : (
                          <div className="text-gray-700">
                              <p className="mb-3">Hệ thống sẽ thông báo cho tất cả bàn đang order món này.</p>
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                                  <div className="flex items-start">
                                      <AlertTriangle className="text-yellow-600 mr-2 mt-0.5 flex-shrink-0" size={18}/>
                                      <p className="text-sm text-yellow-800">
                                          <strong>Lưu ý:</strong> Nhân viên sẽ nhận được thông báo món này đã hết.
                                      </p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
                  <div className="p-4 bg-gray-50 flex gap-3">
                      <button 
                          onClick={() => setOutOfStockModal(null)} 
                          className="flex-1 py-2 bg-white border border-gray-300 rounded-lg font-bold text-gray-700 hover:bg-gray-50"
                      >
                          {outOfStockResult ? 'Đóng' : 'Hủy'}
                      </button>
                      {!outOfStockResult && (
                          <button 
                              onClick={confirmOutOfStock} 
                              className="flex-1 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
                          >
                              Xác nhận Báo hết
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* LEFT COLUMN: PENDING & COOKING */}
      <div className="flex-1 w-1/2 flex flex-col border-r border-gray-200 bg-gray-50/50">
        <div className="bg-white h-14 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-3">
                <h2 className="font-bold text-gray-800 flex items-center"><Flame className="text-orange-500 mr-2" size={20}/> Chờ chế biến ({pendingList.length})</h2>
                {itemsWithNotes > 0 && (
                    <div className="flex items-center gap-1.5 bg-yellow-100 border-2 border-yellow-500 text-yellow-900 px-3 py-1 rounded-full font-black text-xs animate-pulse shadow-lg" style={{boxShadow: '0 0 10px rgba(234, 179, 8, 0.5)'}}>
                        <Bell size={14} className="animate-bounce text-yellow-600" />
                        <span>{itemsWithNotes} món có ghi chú</span>
                    </div>
                )}
            </div>
            <FilterButtons mode={pendingFilter} setMode={setPendingFilter} activeColorClass="text-indigo-600" />
        </div>

        <div className="flex-1 overflow-y-auto">
            {pendingList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <ChefHat size={48} className="mb-2 opacity-20"/>
                    <p>Bếp đang rảnh tay</p>
                </div>
            ) : (
                <>
                    {pendingFilter === 'PRIORITY' && renderPendingPriority()}
                    {pendingFilter === 'ITEM' && renderPendingItem()}
                    {pendingFilter === 'TABLE' && renderPendingTable()}
                </>
            )}
        </div>
      </div>

      {/* RIGHT COLUMN: READY / SERVING */}
      <div className="flex-1 w-1/2 flex flex-col bg-white border-l border-gray-200 shadow-xl z-10">
         <div className="bg-white text-gray-800 h-14 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
            <h2 className="font-bold flex items-center"><CheckCircle2 className="text-green-600 mr-2" size={20}/> Đã xong / Cung ứng ({readyList.length})</h2>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setNotificationModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-bold"
                >
                    <Volume2 size={18} />
                    Báo hết/còn món
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0 bg-gray-50/30">
             {readyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Check size={48} className="mb-2 opacity-20"/>
                    <p>Chưa có món chờ cung ứng</p>
                </div>
            ) : (
                renderReadyList()
            )}
        </div>
      </div>

      {/* NOTIFICATION MODAL */}
      {notificationModal && (
        <ItemNotificationModal
          isOpen={notificationModal}
          onClose={() => setNotificationModal(false)}
          menuItems={menu}
          onSubmit={handleNotificationSubmit}
        />
      )}

    </div>
  );
};

export default KitchenView;