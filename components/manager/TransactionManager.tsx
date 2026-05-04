
import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Search, Calendar, Download, Printer, Eye, CheckCircle2, Clock } from 'lucide-react';
import { OrderItem } from '../../types';

export const TransactionManager: React.FC = () => {
    const { orders, reservations } = usePOS();
    
    // Filter States
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'ACTIVE'>('ALL');

    // Helpers
    const calculateTotal = (items: OrderItem[]) => items.reduce((sum, item) => sum + (item.price * (item.quantity - (item.returnedQuantity || 0))), 0);

    const getCustomerName = (reservationId?: string) => {
        if (!reservationId) return 'Khách lẻ';
        const res = reservations.find(r => r.id === reservationId);
        return res ? res.customerName : 'Khách lẻ';
    };

    // Apply Filters
    const filteredOrders = orders.filter(order => {
        // Filter by status
        const matchesStatus = 
            statusFilter === 'ALL' ? true :
            statusFilter === 'PAID' ? order.isPaid :
            statusFilter === 'ACTIVE' ? !order.isPaid : true;

        // Filter by date
        const orderDate = new Date(order.startTime).toISOString().slice(0, 10);
        const matchesDate = !dateFilter || orderDate === dateFilter;
        
        // Filter by search
        const customerName = getCustomerName(order.reservationId).toLowerCase();
        const matchesSearch = 
            order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
            customerName.includes(searchQuery.toLowerCase());

        return matchesStatus && matchesDate && matchesSearch;
    });

    // Sort by recent
    filteredOrders.sort((a, b) => b.startTime - a.startTime);

    // Statistics
    const totalPaid = filteredOrders.filter(o => o.isPaid).length;
    const totalActive = filteredOrders.filter(o => !o.isPaid).length;

    return (
        <div className="flex h-full bg-white flex-col">
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar Filter */}
                <div className="w-72 bg-gray-50 border-r border-gray-200 p-5 flex flex-col space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Mã HĐ, tên khách..." 
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                        <div className="relative">
                            <input 
                                type="date"
                                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                            />
                            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                        <div className="space-y-2">
                            <button
                                onClick={() => setStatusFilter('ALL')}
                                className={`w-full py-2.5 px-3 rounded-lg font-medium transition text-left flex items-center justify-between ${
                                    statusFilter === 'ALL' 
                                        ? 'bg-blue-600 text-white shadow-md' 
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span>Tất cả hóa đơn</span>
                                <span className="text-xs font-bold">{orders.length}</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('PAID')}
                                className={`w-full py-2.5 px-3 rounded-lg font-medium transition text-left flex items-center justify-between ${
                                    statusFilter === 'PAID' 
                                        ? 'bg-green-600 text-white shadow-md' 
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center">
                                    <CheckCircle2 size={16} className="mr-2"/>
                                    Đã thanh toán
                                </span>
                                <span className="text-xs font-bold">{totalPaid}</span>
                            </button>
                            <button
                                onClick={() => setStatusFilter('ACTIVE')}
                                className={`w-full py-2.5 px-3 rounded-lg font-medium transition text-left flex items-center justify-between ${
                                    statusFilter === 'ACTIVE' 
                                        ? 'bg-orange-600 text-white shadow-md' 
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <span className="flex items-center">
                                    <Clock size={16} className="mr-2"/>
                                    Đang phục vụ
                                </span>
                                <span className="text-xs font-bold">{totalActive}</span>
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => { setSearchQuery(''); setDateFilter(''); setStatusFilter('ALL'); }}
                        className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 font-medium transition"
                    >
                        Xóa bộ lọc
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                     <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                        <h3 className="font-bold text-xl text-gray-800">Danh sách Hóa đơn</h3>
                        <div className="flex gap-2">
                             <div className="text-sm mr-4 flex items-center text-gray-600">
                                Tổng số tiền: <span className="ml-2 font-bold text-blue-600 text-lg">
                                    {filteredOrders.reduce((acc, o) => acc + calculateTotal(o.items), 0).toLocaleString()}
                                </span>
                             </div>
                            <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition">
                                <Download size={16} className="mr-1"/> Xuất Excel
                            </button>
                        </div>
                   </div>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                                    <tr>
                                        <th className="p-4 border-b w-10 text-center"><input type="checkbox" /></th>
                                        <th className="p-4 border-b">Mã hóa đơn</th>
                                        <th className="p-4 border-b">Thời gian (Giờ đi)</th>
                                        <th className="p-4 border-b">Khách hàng</th>
                                        <th className="p-4 border-b text-right">Tổng tiền hàng</th>
                                        <th className="p-4 border-b text-right">Giảm giá</th>
                                        <th className="p-4 border-b text-right">Khách đã trả</th>
                                        <th className="p-4 border-b text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredOrders.map(order => {
                                        const total = calculateTotal(order.items);
                                        const discount = 0; // Currently not tracked in global state
                                        const final = total - discount;
                                        const customer = getCustomerName(order.reservationId);

                                        return (
                                            <tr key={order.id} className={`hover:bg-gray-50 transition group ${!order.isPaid ? 'bg-orange-50/30' : ''}`}>
                                                <td className="p-4 text-center"><input type="checkbox" /></td>
                                                <td className="p-4 font-medium text-blue-600 cursor-pointer hover:underline">
                                                    #{order.id.slice(-6).toUpperCase()}
                                                </td>
                                                <td className="p-4 text-gray-600">
                                                    {new Date(order.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})} 
                                                    <span className="text-gray-400 text-xs ml-1">
                                                        {new Date(order.startTime).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-800 font-medium">{customer}</td>
                                                <td className="p-4 text-center">
                                                    {order.isPaid ? (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            <CheckCircle2 size={12} className="mr-1"/>
                                                            Đã thanh toán
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                                            <Clock size={12} className="mr-1"/>
                                                            Đang phục vụ
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right text-gray-600">{total.toLocaleString()}</td>
                                                <td className="p-4 text-right text-gray-500">{discount}</td>
                                                <td className="p-4 text-right font-bold text-gray-900">{order.isPaid ? final.toLocaleString() : '-'}</td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-1.5 text-gray-500 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded" title="Xem chi tiết">
                                                            <Eye size={16}/>
                                                        </button>
                                                        {order.isPaid && (
                                                            <button className="p-1.5 text-gray-500 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded" title="In lại">
                                                                <Printer size={16}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-gray-400">
                                                <div className="mb-2">Không tìm thấy hóa đơn nào</div>
                                                <div className="text-xs">Thử thay đổi bộ lọc hoặc tìm kiếm</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
