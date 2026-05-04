
import React, { useState, useEffect } from 'react';
import { usePOS } from '../context/POSContext';
import { TableStatus, OrderItem, ItemStatus } from '../types';
import { DollarSign, Printer, CreditCard, UserCheck, FileText, CheckCircle, X, Calendar, Clock, Banknote, MoreHorizontal, SplitSquareHorizontal, Trash2, ShieldAlert, ArrowRightCircle, Loader2, CheckSquare } from 'lucide-react';
import { OutOfStockBanner } from './waiter/OutOfStockBanner';

const CashierView: React.FC = () => {
  const { tables, finalizePayment, getActiveOrder, reservations, cancelOrder, mergeOrders, splitOrder } = usePOS();
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // New Feature Modals
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSplitMergeModal, setShowSplitMergeModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Split/Merge Modal State
  const [splitMergeMode, setSplitMergeMode] = useState<'SPLIT'|'MERGE'>('MERGE');
  const [splitSelection, setSplitSelection] = useState<{[itemId: string]: number}>({});
  const [targetTableId, setTargetTableId] = useState<number | null>(null); // For Split Mode: The destination. For Merge Mode: unused (we use selectedTableId as target)
  const [mergeSourceIds, setMergeSourceIds] = useState<number[]>([]); // For Merge Mode: The list of tables to pull from

  // Payment Form State
  const [paymentState, setPaymentState] = useState({
      discountAmount: 0,
      discountPercent: 0,
      discountType: 'AMOUNT' as 'AMOUNT' | 'PERCENT',
      discountReason: '',
      amountPaid: 0,
      method: 'CASH' as 'CASH' | 'TRANSFER' | 'CARD',
  });

  // Cancel Modal State
  const [cancelReason, setCancelReason] = useState('');
  const [managerPin, setManagerPin] = useState('');

  // Filter tables that are occupied or requesting payment
  const activeTables = tables.filter(t => t.status === TableStatus.OCCUPIED || t.status === TableStatus.PAYMENT_REQUESTED);
  
  const selectedTable = tables.find(t => t.id === selectedTableId);
  const activeOrder = selectedTableId ? getActiveOrder(selectedTableId) : undefined;

  // Calculate total considering returned quantity and excluding CANCELLED items
  const calculateTotal = (items: OrderItem[]) => items
    .filter(item => item.status !== ItemStatus.CANCELLED)
    .reduce((sum, item) => sum + (item.price * (item.quantity - (item.returnedQuantity || 0))), 0);

  // Get Customer Name Logic
  const getCustomerName = () => {
      if (activeOrder && activeOrder.reservationId) {
          const res = reservations.find(r => r.id === activeOrder.reservationId);
          if (res) return `${res.code} - ${res.customerName}`;
      }
      // Also check if selectedTable has a reservation (backward compatibility)
      if (selectedTable?.reservation) {
          return `${selectedTable.reservation.code} - ${selectedTable.reservation.customerName}`;
      }
      return 'Khách lẻ';
  };

  // Initialize payment state when modal opens
  useEffect(() => {
      if (showPaymentModal && activeOrder) {
          const total = calculateTotal(activeOrder.items);
          setPaymentState({
              discountAmount: 0,
              discountPercent: 0,
              discountType: 'AMOUNT',
              discountReason: '',
              amountPaid: total,
              method: 'CASH'
          });
      }
  }, [showPaymentModal, activeOrder]);

  // Derived Values
  const totalAmount = activeOrder ? calculateTotal(activeOrder.items) : 0;
  const finalAmount = Math.max(0, totalAmount - paymentState.discountAmount);
  const changeAmount = Math.max(0, paymentState.amountPaid - finalAmount);

  // Update amountPaid when finalAmount changes
  useEffect(() => {
      if (showPaymentModal && finalAmount > 0 && paymentState.amountPaid !== finalAmount) {
          setPaymentState(prev => ({ ...prev, amountPaid: finalAmount }));
      }
  }, [finalAmount, showPaymentModal]);

  // Handlers
  const handlePrintBill = () => {
    // Show notification requested by user
    const msg = "Đang kết nối đến máy in...";
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenPayment = () => {
      if (selectedTableId) {
          // Kiểm tra đơn hàng có món không (loại trừ món đã hủy)
          const validItems = activeOrder?.items.filter(item => item.status !== ItemStatus.CANCELLED) || [];
          if (validItems.length === 0) {
              setNotification('Không thể thanh toán đơn hàng không có món!');
              setTimeout(() => setNotification(null), 3000);
              return;
          }
          setShowPaymentModal(true);
      }
  };

  const handleFinalize = () => {
    if (selectedTableId) {
        // Kiểm tra đơn hàng có món không (loại trừ món đã hủy)
        const validItems = activeOrder?.items.filter(item => item.status !== ItemStatus.CANCELLED) || [];
        if (validItems.length === 0) {
            setNotification('Không thể thanh toán đơn hàng không có món!');
            setTimeout(() => setNotification(null), 3000);
            setShowPaymentModal(false);
            return;
        }
        finalizePayment(selectedTableId, {
            discountAmount: paymentState.discountAmount,
            discountPercent: paymentState.discountPercent,
            discountType: paymentState.discountType,
            discountReason: paymentState.discountReason,
            finalAmount: finalAmount
        });
        setShowPaymentModal(false);
        setSelectedTableId(null);
    }
  };

  // --- New Handlers for Discount Form ---
  const handleDiscountSave = (val: number, type: 'AMOUNT'|'PERCENT', reason: string) => {
      let amt = 0;
      if (type === 'PERCENT') {
          amt = totalAmount * (val / 100);
      } else {
          amt = val;
      }
      setPaymentState(prev => ({
          ...prev,
          discountAmount: amt,
          discountPercent: type === 'PERCENT' ? val : 0,
          discountType: type,
          discountReason: reason
      }));
      setShowDiscountModal(false);
  };

  // --- Handlers for Cancellation ---
  const handleCancelOrder = async () => {
      if (managerPin !== '1234') {
          alert("Mã PIN quản lý không đúng!");
          return;
      }
      if (!cancelReason.trim()) {
          alert("Vui lòng nhập lý do hủy!");
          return;
      }
      if (selectedTableId && activeOrder) {
          await cancelOrder(activeOrder.id, selectedTableId, cancelReason);
          alert(`Đã hủy đơn hàng và gửi thông báo tới quản lý. Lý do: ${cancelReason}`);
          setShowCancelModal(false);
          setSelectedTableId(null);
          setCancelReason('');
          setManagerPin('');
      }
  };

  // --- Handlers for Split / Merge ---
  const handleToggleMergeSource = (tableId: number) => {
      setMergeSourceIds(prev => 
          prev.includes(tableId) 
              ? prev.filter(id => id !== tableId)
              : [...prev, tableId]
      );
  };

  const handleMerge = async () => {
      if (!selectedTableId || mergeSourceIds.length === 0) {
          alert("Vui lòng chọn ít nhất một bàn để gộp!");
          return;
      }

      setIsProcessing(true);
      try {
         // Current selected table is the TARGET
         // mergeSourceIds are the SOURCES
         await mergeOrders(mergeSourceIds, selectedTableId);
         
         // 1. Close Split/Merge Modal
         setShowSplitMergeModal(false);
         setMergeSourceIds([]);
         setTargetTableId(null);
         
         // 2. Automatically open Payment Modal for the merged table (current selected)
         setTimeout(() => {
             setShowPaymentModal(true);
             setNotification("Đã gộp đơn thành công. Vui lòng thanh toán.");
             setIsProcessing(false);
         }, 800);
      } catch (error) {
          console.error(error);
          setIsProcessing(false);
          alert("Có lỗi xảy ra khi gộp bàn.");
      }
  };

  const handleSplit = async () => {
      if (!selectedTableId || !targetTableId || !activeOrder) {
          alert("Vui lòng chọn bàn đích và món cần tách!");
          return;
      }

      // Construct items to move
      const itemsToMove: any[] = [];
      activeOrder.items.forEach((item, idx) => {
          // Using index as key in selection for simplicity, though unique ID is better
          const key = `${item.itemId}-${idx}`; // Simple key
          if (splitSelection[key] && splitSelection[key] > 0) {
              itemsToMove.push({
                  ...item,
                  quantity: splitSelection[key]
              });
          }
      });

      if (itemsToMove.length === 0) {
          alert("Chưa chọn món để tách!");
          return;
      }

      setIsProcessing(true);
      try {
          await splitOrder(selectedTableId, targetTableId, itemsToMove);
          alert("Đã tách bàn thành công!");
          setShowSplitMergeModal(false);
          setTargetTableId(null);
          setSplitSelection({});
      } catch(e) {
          alert("Lỗi khi tách bàn");
      } finally {
          setIsProcessing(false);
      }
  };


  const generateMoneySuggestions = (total: number) => {
      const suggestions = [total];
      if (total % 10000 !== 0) suggestions.push(Math.ceil(total / 10000) * 10000);
      if (total % 50000 !== 0) suggestions.push(Math.ceil(total / 50000) * 50000);
      if (total % 100000 !== 0) suggestions.push(Math.ceil(total / 100000) * 100000);
      if (total < 200000) suggestions.push(200000);
      if (total < 500000) suggestions.push(500000);
      return Array.from(new Set(suggestions)).sort((a, b) => a - b).slice(0, 5);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 relative">
      
      {/* Printer Notification Toast */}
      {notification && (
          <div className="absolute top-4 right-4 bg-gray-800 text-white px-6 py-3 rounded shadow-lg z-[80] flex items-center animate-in slide-in-from-top-5">
              <Printer className="mr-2" size={20}/>
              {notification}
          </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. DISCOUNT MODAL */}
      {showDiscountModal && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><DollarSign size={20} className="mr-2 text-indigo-600"/> Giảm giá đơn hàng</h3>
                  <div className="space-y-4">
                      {/* Toggle Type */}
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button 
                            onClick={() => setPaymentState(p => ({...p, discountType: 'AMOUNT'}))}
                            className={`flex-1 py-2 text-sm font-bold rounded ${paymentState.discountType === 'AMOUNT' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                          >VNĐ</button>
                          <button 
                            onClick={() => setPaymentState(p => ({...p, discountType: 'PERCENT'}))}
                            className={`flex-1 py-2 text-sm font-bold rounded ${paymentState.discountType === 'PERCENT' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                          >%</button>
                      </div>

                      {/* Value Input */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Giá trị giảm</label>
                          <input 
                            autoFocus
                            type="number" 
                            className="w-full border border-gray-300 rounded-lg p-3 text-lg font-bold text-right outline-none focus:ring-2 focus:ring-indigo-500"
                            value={paymentState.discountType === 'PERCENT' ? paymentState.discountPercent : paymentState.discountAmount}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                if (paymentState.discountType === 'PERCENT') setPaymentState(p => ({...p, discountPercent: val}));
                                else setPaymentState(p => ({...p, discountAmount: val}));
                            }}
                          />
                      </div>

                      {/* Reason */}
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Lý do giảm giá</label>
                          <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 outline-none bg-white text-sm"
                            value={paymentState.discountReason}
                            onChange={(e) => setPaymentState(p => ({...p, discountReason: e.target.value}))}
                          >
                              <option value="">-- Chọn lý do --</option>
                              <option value="Khách quen">Khách quen</option>
                              <option value="Voucher">Voucher / Coupon</option>
                              <option value="Sự cố">Xin lỗi sự cố</option>
                              <option value="Nhân viên">Suất nhân viên</option>
                              <option value="Khác">Khác</option>
                          </select>
                      </div>

                      {/* Summary */}
                      <div className="bg-gray-50 p-3 rounded flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Tổng giảm:</span>
                          <span className="font-bold text-red-600 text-lg">
                              {paymentState.discountType === 'PERCENT' 
                                ? (totalAmount * (paymentState.discountPercent / 100)).toLocaleString() 
                                : paymentState.discountAmount.toLocaleString()
                              } đ
                          </span>
                      </div>

                      <div className="flex gap-3">
                           <button onClick={() => setShowDiscountModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded">Hủy</button>
                           <button onClick={() => handleDiscountSave(
                               paymentState.discountType === 'PERCENT' ? paymentState.discountPercent : paymentState.discountAmount,
                               paymentState.discountType,
                               paymentState.discountReason
                           )} className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded">Lưu</button>
                      </div>
                  </div>
              </div>
           </div>
      )}

      {/* 2. CANCEL MODAL */}
      {showCancelModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 overflow-hidden">
                   <div className="bg-red-600 p-4 text-white flex items-center">
                       <ShieldAlert className="mr-2"/> <h3 className="font-bold text-lg">Hủy hóa đơn</h3>
                   </div>
                   <div className="p-6 space-y-4">
                       <p className="text-sm text-gray-600">Hành động này cần được quản lý phê duyệt. Vui lòng nhập mã PIN.</p>
                       
                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Mã PIN Quản lý (Demo: 1234)</label>
                           <input type="password" className="w-full border rounded p-2 text-center tracking-widest font-bold" value={managerPin} onChange={e => setManagerPin(e.target.value)} />
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-gray-500 mb-1">Lý do hủy</label>
                           <textarea className="w-full border rounded p-2 text-sm h-20" placeholder="Nhập lý do chi tiết..." value={cancelReason} onChange={e => setCancelReason(e.target.value)}></textarea>
                       </div>

                       <div className="flex gap-3 pt-2">
                           <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded">Đóng</button>
                           <button onClick={handleCancelOrder} className="flex-1 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700">Xác nhận Hủy</button>
                       </div>
                   </div>
               </div>
          </div>
      )}

      {/* 3. SPLIT / MERGE MODAL */}
      {showSplitMergeModal && selectedTable && activeOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              {/* Responsive Height and Min-Height + Flex Layout */}
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] min-h-[500px] flex flex-col animate-in zoom-in-95 duration-200">
                  <div className="flex border-b border-gray-200">
                      <button onClick={() => setSplitMergeMode('MERGE')} className={`flex-1 py-4 font-bold text-center ${splitMergeMode === 'MERGE' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>Gộp bàn (Ghép đơn)</button>
                      <button onClick={() => setSplitMergeMode('SPLIT')} className={`flex-1 py-4 font-bold text-center ${splitMergeMode === 'SPLIT' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500'}`}>Tách bàn (Tách đơn)</button>
                  </div>
                  
                  {/* min-h-0 is crucial for nested flex scrolling */}
                  <div className="flex-1 overflow-hidden flex p-6 gap-6 min-h-0">
                       
                       {/* LEFT: Logic depends on mode */}
                       <div className="flex-1 border rounded-lg p-4 bg-gray-50 flex flex-col min-h-0">
                           <h4 className="font-bold text-gray-800 mb-2 border-b pb-2 flex items-center shrink-0">
                               {splitMergeMode === 'MERGE' ? (
                                   <>Chọn các bàn muốn gộp (Nguồn) <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{mergeSourceIds.length} đã chọn</span></>
                               ) : (
                                   `Bàn hiện tại: ${selectedTable.name}`
                               )}
                           </h4>
                           
                           {splitMergeMode === 'MERGE' ? (
                               // MERGE MODE: List OTHER active tables to select as Sources
                               <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                   {activeTables.filter(t => t.id !== selectedTableId).length === 0 ? (
                                       <div className="text-center text-gray-400 mt-10">Không có bàn nào khác đang hoạt động</div>
                                   ) : (
                                       activeTables.filter(t => t.id !== selectedTableId).map(t => (
                                           <div 
                                                key={t.id} 
                                                onClick={() => handleToggleMergeSource(t.id)}
                                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition ${mergeSourceIds.includes(t.id) ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white hover:bg-gray-100'}`}
                                           >
                                               <div>
                                                   <div className="font-bold text-gray-800">{t.name}</div>
                                                   <div className="text-xs text-gray-500">Mã đơn: {t.currentOrderId}</div>
                                               </div>
                                               {mergeSourceIds.includes(t.id) ? <CheckSquare className="text-indigo-600" /> : <div className="w-5 h-5 border rounded"></div>}
                                           </div>
                                       ))
                                   )}
                               </div>
                           ) : (
                               // SPLIT MODE: Show current order items to split
                               <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                                   {activeOrder.items.map((item, idx) => (
                                       <div key={idx} className="bg-white p-2 rounded border shadow-sm flex justify-between items-center text-sm">
                                           <span>{item.name}</span>
                                           <div className="flex items-center gap-2">
                                               <span className="font-bold">x{item.quantity}</span>
                                               <input 
                                                    type="number" 
                                                    min="0" 
                                                    max={item.quantity} 
                                                    className="w-12 border rounded text-center"
                                                    placeholder="0"
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        setSplitSelection(prev => ({...prev, [`${item.itemId}-${idx}`]: val}));
                                                    }}
                                                />
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           )}
                       </div>

                       {/* CENTER: Action Icon */}
                       <div className="flex flex-col justify-center items-center shrink-0">
                           {splitMergeMode === 'MERGE' ? (
                               <>
                                <ArrowRightCircle size={32} className="text-gray-400 mb-2"/>
                                <span className="text-xs font-bold text-gray-400">Gộp vào</span>
                               </>
                           ) : (
                               <>
                                <ArrowRightCircle size={32} className="text-gray-400 mb-2"/>
                                <span className="text-xs font-bold text-gray-400">Sang</span>
                               </>
                           )}
                       </div>

                       {/* RIGHT: Target Selection or Current Table Status */}
                       <div className="flex-1 border rounded-lg p-4 flex flex-col bg-white min-h-0">
                           <h4 className="font-bold text-gray-800 mb-2 border-b pb-2 shrink-0">
                               {splitMergeMode === 'MERGE' ? (
                                   `Bàn chính (Đích): ${selectedTable.name}`
                               ) : (
                                   'Chọn bàn trống (Đích):'
                               )}
                           </h4>

                           {splitMergeMode === 'MERGE' ? (
                                // MERGE MODE: Just show summary of current table (Target)
                                <div className="flex-1 flex flex-col items-center justify-center text-center p-4 overflow-y-auto">
                                    <div className="bg-green-50 p-6 rounded-full mb-4">
                                        <FileText size={48} className="text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-1">{selectedTable.name}</h3>
                                    <p className="text-gray-500 mb-4">Hóa đơn hiện tại: {totalAmount.toLocaleString()}đ</p>
                                    <div className="text-sm bg-gray-100 p-3 rounded-lg text-gray-600">
                                        Các bàn được chọn bên trái sẽ được gộp vào hóa đơn của bàn này. Các bàn nguồn sẽ được giải phóng.
                                    </div>
                                </div>
                           ) : (
                                // SPLIT MODE: Select target available table
                                <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 content-start pr-1">
                                    {tables
                                        .filter(t => t.id !== selectedTableId && t.status === TableStatus.AVAILABLE)
                                        .map(t => (
                                        <button 
                                            key={t.id} 
                                            onClick={() => setTargetTableId(t.id)}
                                            className={`p-3 rounded border text-sm font-bold transition flex flex-col items-center justify-center ${targetTableId === t.id ? 'bg-indigo-600 text-white ring-2 ring-offset-1 ring-indigo-500' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                        >
                                            <span>{t.name}</span>
                                        </button>
                                    ))}
                                    {tables.filter(t => t.id !== selectedTableId && t.status === TableStatus.AVAILABLE).length === 0 && (
                                        <div className="col-span-2 text-center text-gray-400 text-xs py-4">Không có bàn trống</div>
                                    )}
                                </div>
                           )}
                       </div>
                  </div>

                  <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
                      <button onClick={() => setShowSplitMergeModal(false)} className="px-6 py-2 bg-gray-200 font-bold rounded text-gray-700 hover:bg-gray-300">Hủy</button>
                      <button 
                        onClick={splitMergeMode === 'MERGE' ? handleMerge : handleSplit}
                        disabled={splitMergeMode === 'MERGE' ? mergeSourceIds.length === 0 : !targetTableId}
                        className={`px-6 py-2 font-bold rounded text-white transition flex items-center shadow-sm 
                            ${(splitMergeMode === 'MERGE' ? mergeSourceIds.length > 0 : targetTableId) 
                                ? 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer' 
                                : 'bg-gray-400 cursor-not-allowed opacity-70'}`}
                      >
                          {isProcessing && <Loader2 size={16} className="mr-2 animate-spin"/>}
                          Xác nhận {splitMergeMode === 'MERGE' ? 'Gộp & Thanh toán' : 'Tách bàn'}
                      </button>
                  </div>
              </div>
          </div>
      )}


      {/* PAYMENT MODAL (Existing structure with updates) */}
      {showPaymentModal && selectedTable && activeOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden animate-in zoom-in-95 duration-200">
                  
                  {/* LEFT COLUMN: Order Details */}
                  <div className="w-[60%] border-r border-gray-200 flex flex-col bg-gray-50">
                      <div className="p-6 bg-white border-b border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <h3 className="text-xl font-bold text-gray-800">Thanh toán #{activeOrder.id.slice(-6)} <span className="text-gray-400 mx-2">•</span> {selectedTable.name} / {selectedTable.area?.name || ''}</h3>
                              </div>
                              <div className="text-right text-gray-500 text-sm">
                                  <div>{new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} <Calendar className="inline w-3 h-3 mb-0.5 ml-1"/><Clock className="inline w-3 h-3 mb-0.5 ml-1"/></div>
                              </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center text-gray-700 font-medium">
                                    <UserCheck size={16} className="mr-1"/> {getCustomerName()}
                                </div>
                                <span className="text-blue-600 font-medium cursor-pointer hover:underline">Thanh toán từng phần</span>
                          </div>
                      </div>

                      {/* Items Table */}
                      <div className="flex-1 overflow-y-auto p-0">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-100 text-gray-500 font-semibold sticky top-0 shadow-sm">
                                  <tr>
                                      <th className="py-3 px-6">ĐỒ UỐNG / MÓN ĂN</th>
                                      <th className="py-3 px-4 text-center">SL</th>
                                      <th className="py-3 px-4 text-right">ĐƠN GIÁ</th>
                                      <th className="py-3 px-6 text-right">THÀNH TIỀN</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                  {(() => {
                                      // Group items by name and price, excluding CANCELLED items
                                      const groupedItems = activeOrder.items
                                          .filter(item => item.status !== ItemStatus.CANCELLED)
                                          .reduce((acc, item) => {
                                              const key = `${item.name}-${item.price}`;
                                              if (!acc[key]) {
                                                  acc[key] = {
                                                      name: item.name,
                                                      price: item.price,
                                                      totalQuantity: 0,
                                                      totalReturned: 0,
                                                      statuses: new Set()
                                                  };
                                              }
                                              acc[key].totalQuantity += item.quantity;
                                              acc[key].totalReturned += (item.returnedQuantity || 0);
                                              acc[key].statuses.add(item.status);
                                              return acc;
                                          }, {} as Record<string, any>);
                                      
                                      return Object.values(groupedItems).map((item: any, idx) => (
                                          <tr key={idx} className="hover:bg-gray-50">
                                              <td className="py-4 px-6">
                                                  <div className="font-medium text-gray-900 text-base flex items-center gap-2">
                                                    {item.name}
                                                    {item.statuses.has(ItemStatus.SERVED) && (
                                                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-bold">ĐÃ PHỤC VỤ</span>
                                                    )}
                                                    {item.statuses.has(ItemStatus.READY) && (
                                                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded font-bold animate-pulse">ĐÃ XONG</span>
                                                    )}
                                                    {item.statuses.has(ItemStatus.COOKING) && (
                                                      <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded font-bold">ĐANG NẤU</span>
                                                    )}
                                                  </div>
                                                  <div className="text-xs text-gray-400">
                                                    lon/bát/đĩa
                                                  </div>
                                              </td>
                                              <td className="py-4 px-4 text-center text-gray-600">
                                                  {item.totalQuantity}
                                                  {item.totalReturned > 0 ? <span className="text-red-500 text-xs block font-bold">(Trả {item.totalReturned})</span> : null}
                                              </td>
                                              <td className="py-4 px-4 text-right text-gray-600">{item.price.toLocaleString()}</td>
                                              <td className="py-4 px-6 text-right font-bold text-gray-900">{(item.price * (item.totalQuantity - item.totalReturned)).toLocaleString()}</td>
                                          </tr>
                                      ));
                                  })()}
                              </tbody>
                          </table>
                      </div>

                      <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
                           <div className="flex items-center space-x-2">
                               <span className="font-bold text-gray-800">Tổng tiền hàng</span>
                               <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{activeOrder.items.filter((item: OrderItem) => item.status !== ItemStatus.CANCELLED).length}</span>
                           </div>
                           <span className="text-xl font-bold text-gray-900">{totalAmount.toLocaleString()}</span>
                      </div>
                  </div>

                  {/* RIGHT COLUMN: Transaction Details */}
                  <div className="w-[40%] flex flex-col bg-white h-full relative">
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                          <h3 className="font-bold text-lg text-gray-800">Chi tiết giao dịch</h3>
                          <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600"><X/></button>
                      </div>
                      
                      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                          {/* Summary Rows */}
                          <div className="space-y-4">
                              <div className="flex justify-between items-center text-base">
                                  <span className="font-bold text-gray-700">Tổng tiền hàng</span>
                                  <span className="font-bold text-gray-900">{totalAmount.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded" onClick={() => setShowDiscountModal(true)}>
                                  <div className="flex flex-col">
                                      <span className="text-gray-600 font-bold flex items-center">Giảm giá (F6) <DollarSign size={14} className="ml-1 text-blue-500"/></span>
                                      {paymentState.discountReason && <span className="text-xs text-gray-400 italic">{paymentState.discountReason}</span>}
                                  </div>
                                  <div className="text-right">
                                      <div className="font-bold text-red-600">
                                          {paymentState.discountAmount > 0 ? `-${paymentState.discountAmount.toLocaleString()}` : '0'}
                                      </div>
                                      {paymentState.discountType === 'PERCENT' && <div className="text-xs text-gray-400">{paymentState.discountPercent}%</div>}
                                  </div>
                              </div>
                              <div className="flex justify-between items-center text-green-600 text-lg">
                                  <span className="font-bold">Khách cần trả</span>
                                  <span className="font-bold">{finalAmount.toLocaleString()}</span>
                              </div>
                          </div>

                          {/* Payment Methods */}
                          <div>
                                <div className="flex space-x-4">
                                    <label className={`flex-1 cursor-pointer flex items-center justify-center py-2 rounded-lg border transition ${paymentState.method === 'CASH' ? 'border-green-500 text-green-700 bg-green-50 font-bold' : 'border-gray-200 text-gray-600'}`}>
                                        <input type="radio" name="payMethod" className="hidden" checked={paymentState.method === 'CASH'} onChange={() => setPaymentState({...paymentState, method: 'CASH'})} />
                                        <Banknote size={18} className="mr-2"/> Tiền mặt
                                    </label>
                                    <label className={`flex-1 cursor-pointer flex items-center justify-center py-2 rounded-lg border transition ${paymentState.method === 'TRANSFER' ? 'border-green-500 text-green-700 bg-green-50 font-bold' : 'border-gray-200 text-gray-600'}`}>
                                        <input type="radio" name="payMethod" className="hidden" checked={paymentState.method === 'TRANSFER'} onChange={() => setPaymentState({...paymentState, method: 'TRANSFER', amountPaid: finalAmount})} />
                                        <CreditCard size={18} className="mr-2"/> Chuyển khoản
                                    </label>
                                    <label className={`flex-1 cursor-pointer flex items-center justify-center py-2 rounded-lg border transition ${paymentState.method === 'CARD' ? 'border-green-500 text-green-700 bg-green-50 font-bold' : 'border-gray-200 text-gray-600'}`}>
                                        <input type="radio" name="payMethod" className="hidden" checked={paymentState.method === 'CARD'} onChange={() => setPaymentState({...paymentState, method: 'CARD', amountPaid: finalAmount})} />
                                        <span className="mr-2">💳</span> Thẻ
                                    </label>
                                    <button className="w-10 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"><MoreHorizontal size={18}/></button>
                                </div>
                          </div>

                          {/* Payment Input - Chỉ hiển thị khi thanh toán bằng tiền mặt */}
                          {paymentState.method === 'CASH' && (
                              <div>
                                  <div className="flex justify-between mb-2">
                                      <span className="text-gray-700 font-medium">💵 Tiền khách đưa (F8)</span>
                                      <span className="font-bold text-indigo-600 bg-indigo-50 px-2 rounded">{paymentState.amountPaid.toLocaleString()}</span>
                                  </div>
                                  <input 
                                    type="number" 
                                    autoFocus
                                    className="w-full text-right text-3xl font-bold text-gray-800 border rounded-lg p-3 focus:ring-2 focus:ring-green-500 outline-none"
                                    value={paymentState.amountPaid || ''}
                                    onChange={(e) => setPaymentState({...paymentState, amountPaid: Number(e.target.value)})}
                                    placeholder="0"
                                  />

                                  {/* Quick Money Suggestions */}
                                  <div className="flex flex-wrap gap-2 mt-3">
                                      {generateMoneySuggestions(finalAmount).map(amount => (
                                          <button 
                                              key={amount}
                                              onClick={() => setPaymentState({...paymentState, amountPaid: amount})}
                                              className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium hover:border-indigo-500 hover:text-indigo-600 transition shadow-sm"
                                          >
                                              {amount.toLocaleString()}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          )}

                          {/* Change */}
                          {paymentState.method === 'CASH' && (
                              <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200 bg-yellow-50 -mx-6 px-6 py-4 mt-4 rounded-lg">
                                  <span className="text-gray-700 font-bold text-lg">💰 Tiền trả lại khách</span>
                                  <span className="text-2xl font-bold text-orange-600">{changeAmount.toLocaleString()} đ</span>
                              </div>
                          )}
                          {paymentState.method !== 'CASH' && changeAmount > 0 && (
                              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                  <span className="text-gray-600">Tiền thừa</span>
                                  <span className="text-xl font-bold text-gray-800">{changeAmount.toLocaleString()}</span>
                              </div>
                          )}

                      </div>
                      
                      {/* Footer Button */}
                      <div className="p-6 border-t border-gray-100 mt-auto">
                          <button 
                            onClick={handleFinalize}
                            disabled={paymentState.amountPaid < finalAmount}
                            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center transition
                                ${paymentState.amountPaid >= finalAmount ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'}
                            `}
                          >
                            Thanh toán
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Left: Active Tables List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-700 flex items-center">
            <UserCheck className="mr-2" /> Bàn đang phục vụ
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {activeTables.length === 0 ? (
            <p className="text-gray-400 text-center mt-10 text-sm">Không có bàn nào đang hoạt động</p>
          ) : (
            activeTables.map(table => (
              <div 
                key={table.id}
                onClick={() => setSelectedTableId(table.id)}
                className={`p-3 rounded-lg cursor-pointer border transition-all ${
                  selectedTableId === table.id ? 'bg-indigo-50 border-indigo-500 shadow-sm' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-gray-800">{table.name}</span>
                  {table.status === TableStatus.PAYMENT_REQUESTED && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                      Yêu cầu TT
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  ID Đơn: {table.currentOrderId || 'N/A'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Bill Preview & Actions */}
      <div className="flex-1 p-8 overflow-y-auto flex justify-center">
        {selectedTable && activeOrder ? (
          <div className="w-full max-w-md bg-white shadow-xl rounded-xl overflow-hidden border border-gray-200 flex flex-col h-fit">
            {/* Header */}
            <div className="bg-gray-800 text-white p-6 text-center">
              <h3 className="text-2xl font-bold uppercase tracking-widest">Hóa Đơn</h3>
              <p className="text-gray-400 text-sm mt-1">Nhà hàng Demo POS</p>
            </div>

            {/* Bill Info */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 text-sm text-gray-600">
              <div className="flex justify-between mb-1">
                <span>Bàn:</span>
                <span className="font-bold text-gray-800">{selectedTable.name}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Khách hàng:</span>
                <span className="font-bold text-gray-800">{getCustomerName()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Mã đơn:</span>
                <span>{activeOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian vào:</span>
                <span>{new Date(activeOrder.startTime).toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Items */}
            <div className="p-6 flex-1 min-h-[300px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b">
                    <th className="pb-2 font-medium">Món</th>
                    <th className="pb-2 font-medium text-center">SL</th>
                    <th className="pb-2 font-medium text-right">Đơn giá</th>
                    <th className="pb-2 font-medium text-right">Tổng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeOrder.items.filter((item: OrderItem) => item.status !== ItemStatus.CANCELLED).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 text-gray-800">{item.name}</td>
                      <td className="py-3 text-center text-gray-600">
                          {item.quantity}
                          {item.returnedQuantity ? <div className="text-red-500 text-[10px]">(Trả {item.returnedQuantity})</div> : null}
                      </td>
                      <td className="py-3 text-right text-gray-600">{item.price.toLocaleString()}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{(item.price * (item.quantity - (item.returnedQuantity || 0))).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-6 space-y-2">
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-lg font-bold text-gray-800">Tổng thanh toán</span>
                <span className="text-2xl font-bold text-indigo-600">{calculateTotal(activeOrder.items).toLocaleString()} đ</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 grid grid-cols-2 gap-2 bg-white border-t border-gray-100">
               {/* New Action Buttons */}
              <button onClick={() => setShowSplitMergeModal(true)} className="col-span-1 flex items-center justify-center py-2 bg-orange-50 text-orange-700 rounded font-bold hover:bg-orange-100 transition border border-orange-200">
                  <SplitSquareHorizontal size={16} className="mr-1"/> Tách / Ghép
              </button>
              <button onClick={() => setShowCancelModal(true)} className="col-span-1 flex items-center justify-center py-2 bg-red-50 text-red-700 rounded font-bold hover:bg-red-100 transition border border-red-200">
                  <Trash2 size={16} className="mr-1"/> Hủy hóa đơn
              </button>

              <button 
                onClick={handlePrintBill}
                className="col-span-1 flex items-center justify-center py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                <Printer className="w-5 h-5 mr-2" /> In Tạm Tính
              </button>
              <button 
                onClick={handleOpenPayment}
                className="col-span-1 flex items-center justify-center py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700 transition"
              >
                <CheckCircle className="w-5 h-5 mr-2" /> Thanh Toán
              </button>
            </div>
          </div>
        ) : (
           <div className="flex flex-col items-center justify-center text-gray-300 h-full">
             <FileText className="w-24 h-24 mb-4 opacity-20" />
             <p className="text-xl font-light">Chọn bàn để xử lý thanh toán</p>
           </div>
        )}
      </div>
      
      {/* Out of Stock Banner */}
      <OutOfStockBanner />
    </div>
  );
};

export default CashierView;
