
import React, { useState } from 'react';
import { Customer, Table } from '../../types';
import { Search, PlusCircle, User, Edit2, UserPlus, Phone, AlignLeft } from 'lucide-react';

interface ReservationFormProps {
    formState: any;
    setFormState: (state: any) => void;
    availableTables: Table[];
    isUpdate?: boolean;
    customers: Customer[];
    onOpenAddCustomer: (name?: string, phone?: string) => void;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({ formState, setFormState, availableTables, isUpdate = false, customers, onOpenAddCustomer }) => {
    // Name Search States
    const [suggestions, setSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Phone Search States
    const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
    const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
    
    let statusText = "Chờ xếp bàn";
    if (formState.tableId > 0) statusText = "Đã xếp bàn";
    
    // --- Name Search Handlers ---
    const handleCustomerSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormState({...formState, customerName: val});
        
        if(val.length > 0) {
            const matches = customers.filter(c => c.name.toLowerCase().includes(val.toLowerCase()) || c.phone.includes(val));
            setSuggestions(matches);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // --- Phone Search Handlers ---
    const handlePhoneSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormState({...formState, phoneNumber: val});

        if(val.length > 1) {
            // Search strictly by phone for the phone field
            const matches = customers.filter(c => c.phone.includes(val));
            setPhoneSuggestions(matches);
            setShowPhoneSuggestions(true);
        } else {
            setPhoneSuggestions([]);
            setShowPhoneSuggestions(false);
        }
    };

    const selectCustomer = (c: Customer) => {
        setFormState({
            ...formState,
            customerName: c.name,
            phoneNumber: c.phone,
            address: c.address || ''
        });
        setShowSuggestions(false);
        setShowPhoneSuggestions(false);
    };

    const handleAddNew = () => {
        onOpenAddCustomer(formState.customerName, formState.phoneNumber);
        setShowSuggestions(false);
        setShowPhoneSuggestions(false);
    };

    return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
       {/* Left Column */}
       <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
            <div className="relative group">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                required 
                type="text" 
                placeholder="Tìm khách hàng (Tên/SĐT) - F4" 
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 transition-colors" 
                value={formState.customerName} 
                onChange={handleCustomerSearch} 
                onFocus={() => { if(formState.customerName) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
              />
              <button type="button" onClick={() => onOpenAddCustomer(formState.customerName, formState.phoneNumber)} className="absolute right-2 top-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full p-0.5" title="Thêm khách hàng mới">
                <PlusCircle size={20}/>
              </button>
              
              {/* Name Suggestions Dropdown */}
              {showSuggestions && (
                  <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                      {suggestions.length > 0 ? (
                          suggestions.map(c => (
                              <div 
                                key={c.id} 
                                onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }}
                                className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 group transition-colors"
                              >
                                  <div className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{c.name}</div>
                                  <div className="text-xs text-gray-500 flex justify-between">
                                      <span className="flex items-center"><Phone size={10} className="mr-1"/>{c.phone}</span>
                                      <span className="text-gray-400">{c.code}</span>
                                  </div>
                              </div>
                          ))
                      ) : (
                          formState.customerName.length > 1 && (
                            <div 
                                onMouseDown={(e) => { e.preventDefault(); handleAddNew(); }}
                                className="p-4 text-center cursor-pointer hover:bg-blue-50 text-blue-600 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center">
                                    <UserPlus size={24} className="mb-2"/>
                                    <span className="text-sm font-medium">Không tìm thấy khách hàng.</span>
                                    <span className="text-xs font-bold mt-1">Thêm mới ngay?</span>
                                </div>
                            </div>
                          )
                      )}
                  </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
            <div className="relative">
                <input 
                    required 
                    type="tel" 
                    placeholder="Nhập số điện thoại khách hàng" 
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    value={formState.phoneNumber} 
                    onChange={handlePhoneSearch} 
                    onFocus={() => { if(formState.phoneNumber) setShowPhoneSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowPhoneSuggestions(false), 200)}
                    autoComplete="off"
                />
                <Phone size={16} className="absolute left-3 top-2.5 text-gray-400"/>

                {/* Phone Suggestions Dropdown */}
                {showPhoneSuggestions && phoneSuggestions.length > 0 && (
                    <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-40 overflow-y-auto">
                        {phoneSuggestions.map(c => (
                            <div 
                                key={c.id} 
                                onMouseDown={(e) => { e.preventDefault(); selectCustomer(c); }}
                                className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 group transition-colors"
                            >
                                <div className="font-bold text-gray-800 text-sm group-hover:text-indigo-700">{c.name}</div>
                                <div className="text-xs text-gray-500 flex justify-between">
                                    <span className="font-bold text-indigo-600">{c.phone}</span>
                                    <span className="text-gray-400">{c.code}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Giờ đến</label>
             <div className="relative">
                <input required type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formState.arrivalTime} 
                onChange={e => setFormState({...formState, arrivalTime: e.target.value})} 
                />
             </div>
          </div>

          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tiền đặt cọc</label>
                <input type="number" placeholder="Nhập số tiền" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                  value={formState.depositAmount || ''} 
                  onChange={e => setFormState({...formState, depositAmount: parseInt(e.target.value) || 0})} 
                />
             </div>
             <div className="w-1/3">
                <label className="block text-sm font-semibold text-gray-700 mb-1">&nbsp;</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                   value={formState.depositMethod} 
                   onChange={e => setFormState({...formState, depositMethod: e.target.value})}
                >
                   <option value="CASH">Tiền mặt</option>
                   <option value="TRANSFER">Chuyển khoản</option>
                   <option value="CARD">Thẻ</option>
                </select>
             </div>
          </div>

          <div className="pt-2">
             <div className="flex items-center text-sm font-semibold text-gray-700 mb-1">
                <AlignLeft size={16} className="mr-1"/> Món đặt trước
             </div>
             <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder:text-gray-400"
                rows={3}
                placeholder="Nhập danh sách món ăn khách đặt trước..."
                value={Array.isArray(formState.preOrderItems) ? formState.preOrderItems.join('\n') : ''}
                onChange={(e) => setFormState({...formState, preOrderItems: [e.target.value]})}
             />
          </div>
       </div>

       {/* Right Column */}
       <div className="space-y-4">
          <div className="flex gap-4">
             <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã đặt bàn</label>
                <input disabled type="text" placeholder="Mã tự động" className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 font-bold" 
                    value={isUpdate ? formState.code : "Mã tự động"} 
                />
             </div>
             <div className="flex-1">
                 <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái</label>
                 <div className={`w-full px-3 py-2 border border-transparent rounded-lg text-sm font-bold flex items-center
                    ${statusText === 'Đã nhận bàn' ? 'bg-green-100 text-green-700' : 
                      statusText === 'Đã xếp bàn' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`
                 }>
                    {statusText}
                 </div>
             </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-1">Số lượng khách</label>
             <div className="relative">
                <User size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input 
                    type="number" 
                    min="1" 
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-900"
                    value={formState.guestCount} 
                    onChange={e => setFormState({...formState, guestCount: parseInt(e.target.value) || 0})} 
                    placeholder="Nhập số lượng..."
                />
             </div>
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn bàn (có thể chọn nhiều)</label>
             <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {availableTables.length === 0 ? (
                   <div className="text-sm text-gray-500 text-center py-2">Không có bàn trống</div>
                ) : (
                   availableTables.map(table => (
                      <label key={table.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                         <input 
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            checked={(formState.tableIds || []).includes(table.id)}
                            onChange={(e) => {
                               const currentIds = formState.tableIds || [];
                               if (e.target.checked) {
                                  setFormState({...formState, tableIds: [...currentIds, table.id]});
                               } else {
                                  setFormState({...formState, tableIds: currentIds.filter((id: number) => id !== table.id)});
                               }
                            }}
                         />
                         <span className="text-sm font-medium text-gray-700">
                            {table.name} <span className="text-gray-500">({table.capacity} người)</span>
                         </span>
                      </label>
                   ))
                )}
             </div>
             {(formState.tableIds || []).length > 0 && (
                <div className="mt-2 text-xs text-blue-600 font-medium">
                   Đã chọn: {(formState.tableIds || []).length} bàn
                </div>
             )}
          </div>

          <div>
             <div className="relative border-b border-gray-300">
               <Edit2 size={14} className="absolute left-0 top-3 text-gray-400" />
               <input type="text" placeholder="Ghi chú chung" className="w-full pl-6 py-2 outline-none bg-transparent placeholder:text-gray-400"
                  value={formState.note} 
                  onChange={e => setFormState({...formState, note: e.target.value})} 
               />
             </div>
          </div>
       </div>
    </div>
    );
};
