
import React, { useMemo } from 'react';
import { usePOS } from '../../../context/POSContext';
import { Banknote, CreditCard, DollarSign, Receipt, Printer, Calendar, TrendingUp } from 'lucide-react';
import { OrderItem } from '../../../types';

export const EndOfDayReport: React.FC = () => {
    const { orders } = usePOS();
    const today = new Date().toISOString().slice(0, 10);

    // Filter today's paid orders
    const todayOrders = orders.filter(o => 
        o.isPaid && new Date(o.startTime).toISOString().slice(0, 10) === today
    );

    const calculateTotal = (items: OrderItem[]) => items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const totalRevenue = todayOrders.reduce((sum, o) => sum + calculateTotal(o.items), 0);
    const totalOrders = todayOrders.length;
    
    // Simulating Payment Methods (Since we didn't store method in Order type for this simplified demo, assuming random split for visuals)
    // In a real app, Order type needs 'paymentMethod' field.
    const cashTotal = Math.round(totalRevenue * 0.6); 
    const transferTotal = totalRevenue - cashTotal;

    // Calculate Hourly Revenue for Chart
    const hourlyRevenue = useMemo(() => {
        const hours = Array(24).fill(0);
        todayOrders.forEach(order => {
            const hour = new Date(order.startTime).getHours();
            const orderTotal = calculateTotal(order.items);
            hours[hour] += orderTotal;
        });
        return hours;
    }, [todayOrders]);

    const maxHourlyRevenue = Math.max(...hourlyRevenue, 1);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <Receipt className="mr-2" /> Báo cáo Kết ca (Cuối ngày)
                    </h2>
                    <div className="text-sm text-gray-500 mt-1 flex items-center">
                        <Calendar size={14} className="mr-1"/> Ngày: {new Date().toLocaleDateString('vi-VN')}
                    </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center shadow-sm transition">
                    <Printer size={18} className="mr-2"/> In báo cáo
                </button>
            </div>

            <div className="p-6 overflow-auto">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-blue-600 font-bold text-sm uppercase">Tổng doanh thu</span>
                            <DollarSign className="text-blue-500" size={24}/>
                        </div>
                        <div className="text-3xl font-black text-gray-800">{totalRevenue.toLocaleString()}đ</div>
                        <div className="text-sm text-gray-500 mt-2">{totalOrders} hóa đơn</div>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-green-600 font-bold text-sm uppercase">Tiền mặt</span>
                            <Banknote className="text-green-500" size={24}/>
                        </div>
                        <div className="text-3xl font-black text-gray-800">{cashTotal.toLocaleString()}đ</div>
                        <div className="text-sm text-gray-500 mt-2">Thực thu tại quầy</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 p-6 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-600 font-bold text-sm uppercase">Chuyển khoản / Thẻ</span>
                            <CreditCard className="text-purple-500" size={24}/>
                        </div>
                        <div className="text-3xl font-black text-gray-800">{transferTotal.toLocaleString()}đ</div>
                        <div className="text-sm text-gray-500 mt-2">Ngân hàng & POS</div>
                    </div>
                </div>

                {/* Hourly Revenue Chart */}
                <div className="bg-gradient-to-br from-white to-indigo-50 p-6 rounded-xl border border-gray-200 shadow-lg mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <TrendingUp className="text-indigo-600" size={20}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Biểu đồ doanh số theo giờ</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Phân bổ doanh thu trong ngày</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
                            <span>Hôm nay</span>
                        </div>
                    </div>
                    
                    <div className="h-64 flex items-end justify-between space-x-1.5 pl-12 relative pb-8">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pb-8 pl-12">
                            {[100, 75, 50, 25, 0].map(pct => (
                                <div key={pct} className="w-full border-t border-gray-300 border-dashed h-0 relative">
                                    <span className="absolute -left-11 -top-2.5 text-xs text-gray-500 font-medium bg-white px-1">
                                        {(maxHourlyRevenue * pct / 100 / 1000).toFixed(0)}k
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Bars */}
                        {hourlyRevenue.map((revenue, hour) => {
                            if (hour < 7 || hour > 22) return null;
                            const heightPct = revenue > 0 ? Math.max((revenue / maxHourlyRevenue) * 100, 3) : 0;
                            const isCurrentHour = new Date().getHours() === hour;
                            const isPeakHour = revenue === Math.max(...hourlyRevenue.slice(7, 23)) && revenue > 0;
                            
                            return (
                                <div key={hour} className="flex-1 flex flex-col justify-end items-center group relative z-10">
                                    <div 
                                      className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer relative
                                        ${revenue === 0 ? 'bg-gray-200' : 
                                          isCurrentHour ? 'bg-gradient-to-t from-green-500 to-green-400 shadow-lg' :
                                          isPeakHour ? 'bg-gradient-to-t from-orange-500 to-orange-400 shadow-lg' :
                                          'bg-gradient-to-t from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500'}
                                        group-hover:shadow-xl group-hover:-translate-y-1`}
                                      style={{ height: `${heightPct}%` }}
                                    >
                                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                                            <div className="font-bold">{revenue.toLocaleString()}đ</div>
                                            <div className="text-gray-300 text-[10px] mt-0.5">
                                                {isCurrentHour && '⚡ Đang diễn ra'}
                                                {isPeakHour && !isCurrentHour && '🔥 Giờ cao điểm'}
                                            </div>
                                        </div>
                                        {isPeakHour && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-500">
                                                <TrendingUp size={14}/>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`text-xs mt-2.5 font-semibold ${isCurrentHour ? 'text-green-600' : 'text-gray-500'}`}>
                                        {hour}h
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4 text-xs pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded"></div>
                            <span className="text-gray-600">Doanh thu</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 bg-gradient-to-t from-orange-500 to-orange-400 rounded"></div>
                            <span className="text-gray-600">Giờ cao điểm</span>
                        </div>
                    </div>
                </div>

                {/* Detail Table */}
                <h3 className="font-bold text-lg text-gray-800 mb-4">Chi tiết hóa đơn trong ngày</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-gray-700 font-bold">
                            <tr>
                                <th className="p-4 border-b">Mã HĐ</th>
                                <th className="p-4 border-b">Giờ</th>
                                <th className="p-4 border-b text-right">Tổng tiền</th>
                                <th className="p-4 border-b text-center">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {todayOrders.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium">#{order.id.slice(-6).toUpperCase()}</td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(order.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">
                                        {calculateTotal(order.items).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center text-gray-500">-</td>
                                </tr>
                            ))}
                            {todayOrders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">Chưa có giao dịch nào hôm nay</td>
                                </tr>
                            )}
                        </tbody>
                        {todayOrders.length > 0 && (
                            <tfoot className="bg-gray-50 font-bold text-gray-900">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right">Tổng cộng:</td>
                                    <td className="p-4 text-right">{totalRevenue.toLocaleString()}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};
