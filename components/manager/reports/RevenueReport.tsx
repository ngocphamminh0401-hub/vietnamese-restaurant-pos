
import React, { useMemo, useState } from 'react';
import { usePOS } from '../../../context/POSContext';
import { BarChart3, TrendingUp, CalendarDays, Printer, Calendar } from 'lucide-react';

export const RevenueReport: React.FC = () => {
    const { orders } = usePOS();
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().slice(0, 10);
    });
    const [endDate, setEndDate] = useState<string>(() => {
        return new Date().toISOString().slice(0, 10);
    });
    
    // Applied dates for display
    const [appliedStartDate, setAppliedStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        return d.toISOString().slice(0, 10);
    });
    const [appliedEndDate, setAppliedEndDate] = useState<string>(() => {
        return new Date().toISOString().slice(0, 10);
    });

    const handleApplyFilter = () => {
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
    };

    // Group orders by Date
    const revenueByDate = useMemo(() => {
        const grouped: Record<string, { date: string, revenue: number, count: number }> = {};
        
        // Populate date range
        const start = new Date(appliedStartDate);
        const end = new Date(appliedEndDate);
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().slice(0, 10);
            grouped[dateStr] = { date: dateStr, revenue: 0, count: 0 };
            currentDate.setDate(currentDate.getDate() + 1);
        }

        orders.forEach(order => {
            if (order.isPaid) {
                const dateStr = new Date(order.startTime).toISOString().slice(0, 10);
                if (grouped[dateStr]) {
                    const total = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
                    grouped[dateStr].revenue += total;
                    grouped[dateStr].count += 1;
                }
            }
        });

        // Convert to array and sort by date ascending
        return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [orders, appliedStartDate, appliedEndDate]);

    const maxRevenue = Math.max(...revenueByDate.map(d => d.revenue), 100000); // Min scale
    const totalRevenueRange = revenueByDate.reduce((sum, d) => sum + d.revenue, 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <TrendingUp className="mr-2" /> Báo cáo Doanh thu
                    </h2>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors print:hidden"
                    >
                        <Printer size={18} />
                        In báo cáo
                    </button>
                </div>
                
                {/* Date Filter */}
                <div className="mt-4 flex items-center gap-4 print:hidden">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-500" />
                        <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            max={new Date().toISOString().slice(0, 10)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <button
                        onClick={handleApplyFilter}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                        Hiển thị
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-auto">
                <div className="mb-8 p-6 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                         <div className="text-indigo-800 font-bold text-sm uppercase mb-1">
                             Tổng doanh thu ({new Date(appliedStartDate).toLocaleDateString('vi-VN')} - {new Date(appliedEndDate).toLocaleDateString('vi-VN')})
                         </div>
                         <div className="text-4xl font-black text-gray-900">{totalRevenueRange.toLocaleString()}đ</div>
                    </div>
                    <BarChart3 size={48} className="text-indigo-300"/>
                </div>

                {/* Enhanced Bar Chart Visualization */}
                <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border border-gray-200 shadow-lg mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BarChart3 className="text-blue-600" size={20}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-lg">Biểu đồ doanh thu theo ngày</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Xu hướng doanh thu trong khoảng thời gian</p>
                            </div>
                        </div>
                        <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {revenueByDate.length} ngày
                        </div>
                    </div>
                    
                    <div className="h-80 flex items-end justify-between gap-1.5 pl-12 relative pb-8">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pb-8 pl-12">
                            {[100, 75, 50, 25, 0].map(pct => (
                                <div key={pct} className="w-full border-t border-gray-300 border-dashed h-0 relative">
                                    <span className="absolute -left-11 -top-2.5 text-xs text-gray-500 font-medium bg-white px-1">
                                        {(maxRevenue * pct / 100 / 1000).toFixed(0)}k
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Bars */}
                        {revenueByDate.map((day) => {
                            const heightPct = day.revenue > 0 ? Math.max((day.revenue / maxRevenue) * 100, 3) : 0;
                            const dateLabel = new Date(day.date).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'});
                            const isToday = day.date === new Date().toISOString().slice(0, 10);
                            const isPeakDay = day.revenue === Math.max(...revenueByDate.map(d => d.revenue)) && day.revenue > 0;
                            const isWeekend = [0, 6].includes(new Date(day.date).getDay());
                            
                            return (
                                <div key={day.date} className="flex-1 flex flex-col justify-end items-center group relative z-10">
                                    <div 
                                      className={`w-full rounded-t-lg transition-all duration-300 cursor-pointer relative
                                        ${day.revenue === 0 ? 'bg-gray-200' :
                                          isToday ? 'bg-gradient-to-t from-green-500 to-green-400 shadow-lg shadow-green-300' :
                                          isPeakDay ? 'bg-gradient-to-t from-orange-500 to-orange-400 shadow-lg shadow-orange-300' :
                                          isWeekend ? 'bg-gradient-to-t from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500' :
                                          'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500'}
                                        group-hover:shadow-xl group-hover:-translate-y-1`}
                                      style={{ height: `${heightPct}%` }}
                                    >
                                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                                            <div className="font-bold">{day.revenue.toLocaleString()}đ</div>
                                            <div className="text-gray-300 text-[10px] mt-0.5">
                                                {day.count} hóa đơn
                                            </div>
                                            <div className="text-gray-300 text-[10px]">
                                                {isToday && '⚡ Hôm nay'}
                                                {isPeakDay && !isToday && '🔥 Ngày cao điểm'}
                                                {isWeekend && !isToday && !isPeakDay && '📅 Cuối tuần'}
                                            </div>
                                        </div>
                                        {isPeakDay && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-500">
                                                <TrendingUp size={14}/>
                                            </div>
                                        )}
                                    </div>
                                    <div className={`text-xs mt-2.5 font-semibold ${isToday ? 'text-green-600' : 'text-gray-500'}`}>
                                        {dateLabel}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4 text-xs pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
                            <span className="text-gray-600">Ngày thường</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 bg-gradient-to-t from-purple-500 to-purple-400 rounded"></div>
                            <span className="text-gray-600">Cuối tuần</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 bg-gradient-to-t from-green-500 to-green-400 rounded"></div>
                            <span className="text-gray-600">Hôm nay</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                            <div className="w-3 h-3 bg-gradient-to-t from-orange-500 to-orange-400 rounded"></div>
                            <span className="text-gray-600">Cao điểm</span>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                     <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 text-gray-700 font-bold">
                            <tr>
                                <th className="p-4 border-b">Ngày</th>
                                <th className="p-4 border-b text-center">Số hóa đơn</th>
                                <th className="p-4 border-b text-right">Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                             {revenueByDate.slice().reverse().map(day => (
                                 <tr key={day.date} className="hover:bg-gray-50">
                                     <td className="p-4 font-medium flex items-center">
                                         <CalendarDays size={16} className="mr-2 text-gray-400"/>
                                         {new Date(day.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                     </td>
                                     <td className="p-4 text-center">{day.count}</td>
                                     <td className="p-4 text-right font-bold text-gray-900">{day.revenue.toLocaleString()}đ</td>
                                 </tr>
                             ))}
                        </tbody>
                     </table>
                </div>
            </div>
        </div>
    );
};
