
import React, { useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import { DollarSign, ShoppingBag, Users, TrendingUp, Clock, ChefHat, Utensils } from 'lucide-react';
import { OrderItem } from '../../types';

export const ManagerDashboard: React.FC = () => {
  const { orders, tables } = usePOS();

  // --- 1. Data Processing Logic ---
  
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Filter orders for today
  const todayOrders = useMemo(() => {
    return orders.filter(o => {
        const orderDate = new Date(o.startTime).toISOString().slice(0, 10);
        return orderDate === todayStr;
    });
  }, [orders, todayStr]);

  const paidOrders = useMemo(() => todayOrders.filter(o => o.isPaid), [todayOrders]);

  // Calculate Summary Stats
  const totalRevenue = paidOrders.reduce((acc, order) => {
      const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return acc + orderTotal;
  }, 0);

  const totalOrders = paidOrders.length;
  const totalCustomers = paidOrders.reduce((acc, o) => acc + (o.guestCount || 1), 0);
  const averageBill = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate Hourly Revenue for Chart
  const hourlyRevenue = useMemo(() => {
      const hours = Array(24).fill(0);
      paidOrders.forEach(order => {
          const hour = new Date(order.startTime).getHours();
          const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          hours[hour] += orderTotal;
      });
      return hours;
  }, [paidOrders]);

  const maxHourlyRevenue = Math.max(...hourlyRevenue, 1); // Avoid division by zero

  // Calculate Top Selling Items
  const topItems = useMemo(() => {
      const itemMap: Record<string, { name: string, quantity: number, revenue: number, image: string }> = {};
      
      paidOrders.forEach(order => {
          order.items.forEach((item: OrderItem) => {
              if (!itemMap[item.itemId]) {
                  itemMap[item.itemId] = { 
                      name: item.name, 
                      quantity: 0, 
                      revenue: 0,
                      image: `https://picsum.photos/seed/${item.itemId}/50/50` // Placeholder logic based on ID
                  };
              }
              itemMap[item.itemId].quantity += item.quantity;
              itemMap[item.itemId].revenue += item.price * item.quantity;
          });
      });

      return Object.values(itemMap)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
  }, [paidOrders]);

  // Recent Activities (Latest 10 orders actions)
  const recentActivities = useMemo(() => {
      return [...orders]
          .sort((a, b) => b.startTime - a.startTime)
          .slice(0, 10)
          .map(order => {
              const table = tables.find(t => t.id === order.tableId);
              const total = order.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
              return {
                  id: order.id,
                  type: order.isPaid ? 'PAYMENT' : 'ORDER',
                  tableName: table ? table.name : 'Mang về',
                  time: new Date(order.startTime),
                  total: total,
                  status: order.isPaid ? 'Đã thanh toán' : 'Đang phục vụ',
                  itemCount: order.items.length
              };
          });
  }, [orders, tables]);


  // --- 2. Helper Components ---

  const StatCard = ({ title, value, icon: Icon, colorClass, subValue }: any) => (
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition">
          <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
              <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
              {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
          </div>
          <div className={`p-3 rounded-lg ${colorClass}`}>
              <Icon size={24} />
          </div>
      </div>
  );

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto pr-2 pb-6">
      
      {/* 1. Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Doanh thu hôm nay" 
            value={`${totalRevenue.toLocaleString()}đ`} 
            icon={DollarSign} 
            colorClass="bg-blue-100 text-blue-600"
            subValue="Tổng tiền thực thu"
          />
          <StatCard 
            title="Đơn hàng đã xong" 
            value={totalOrders} 
            icon={ShoppingBag} 
            colorClass="bg-green-100 text-green-600"
            subValue={`${orders.length - totalOrders} đơn đang phục vụ`}
          />
          <StatCard 
            title="Tổng khách hàng" 
            value={totalCustomers} 
            icon={Users} 
            colorClass="bg-orange-100 text-orange-600"
            subValue="Dựa trên số khách/bàn"
          />
          <StatCard 
            title="Giá trị TB / Đơn" 
            value={`${averageBill.toLocaleString()}đ`} 
            icon={TrendingUp} 
            colorClass="bg-purple-100 text-purple-600"
            subValue="Trung bình mỗi hóa đơn"
          />
      </div>

      {/* 2. Charts & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[420px]">
          
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-gradient-to-br from-white to-blue-50 p-6 rounded-xl border border-gray-200 shadow-lg flex flex-col">
              <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                          <TrendingUp className="text-blue-600" size={20}/>
                      </div>
                      <div>
                          <h3 className="font-bold text-gray-800 text-lg">Biểu đồ doanh số theo giờ</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Theo dõi xu hướng bán hàng trong ngày</p>
                      </div>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                      <span>Hôm nay</span>
                  </div>
              </div>
              
              <div className="flex-1 flex items-end justify-between space-x-1.5 pl-12 relative pb-8">
                  {/* Grid lines background */}
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
                      if (hour < 7 || hour > 22) return null; // Only show active hours (7h - 22h)
                      const heightPct = revenue > 0 ? Math.max((revenue / maxHourlyRevenue) * 100, 3) : 0;
                      const isCurrentHour = new Date().getHours() === hour;
                      const isPeakHour = revenue === Math.max(...hourlyRevenue.slice(7, 23));
                      
                      return (
                          <div key={hour} className="flex-1 flex flex-col justify-end items-center group relative z-10">
                              <div 
                                className={`
                                  w-full rounded-t-lg transition-all duration-300 cursor-pointer relative
                                  ${revenue === 0 ? 'bg-gray-200' : 
                                    isCurrentHour ? 'bg-gradient-to-t from-green-500 to-green-400 shadow-lg shadow-green-300' :
                                    isPeakHour ? 'bg-gradient-to-t from-orange-500 to-orange-400 shadow-lg shadow-orange-300' :
                                    'bg-gradient-to-t from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500'}
                                  group-hover:shadow-xl group-hover:-translate-y-1
                                `}
                                style={{ height: `${heightPct}%` }}
                              >
                                  {/* Tooltip */}
                                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                                      <div className="font-bold">{revenue.toLocaleString()}đ</div>
                                      <div className="text-gray-300 text-[10px] mt-0.5">
                                          {isCurrentHour && '⚡ Đang diễn ra'}
                                          {isPeakHour && !isCurrentHour && '🔥 Giờ cao điểm'}
                                      </div>
                                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                  
                                  {/* Peak indicator */}
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
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 text-xs pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 bg-gradient-to-t from-blue-500 to-blue-400 rounded"></div>
                      <span className="text-gray-600">Doanh thu</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 bg-gradient-to-t from-green-500 to-green-400 rounded"></div>
                      <span className="text-gray-600">Giờ hiện tại</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                      <div className="w-3 h-3 bg-gradient-to-t from-orange-500 to-orange-400 rounded"></div>
                      <span className="text-gray-600">Giờ cao điểm</span>
                  </div>
              </div>
          </div>

          {/* Top Items Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center">
                  <Utensils className="mr-2 text-orange-500" size={20}/>
                  Món bán chạy
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                  {topItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                          <ChefHat size={40} className="mb-2 opacity-20"/>
                          <p className="text-sm">Chưa có dữ liệu bán hàng</p>
                      </div>
                  ) : (
                      topItems.map((item, idx) => (
                          <div key={idx} className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm mr-3 shrink-0">
                                  {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex justify-between mb-1">
                                      <span className="font-medium text-gray-800 truncate">{item.name}</span>
                                      <span className="font-bold text-gray-900">{item.quantity}</span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                                      <div 
                                          className="bg-orange-500 h-1.5 rounded-full" 
                                          style={{ width: `${(item.quantity / topItems[0].quantity) * 100}%` }}
                                      ></div>
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1 text-right">{item.revenue.toLocaleString()}đ</div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>

      {/* 3. Recent Activity Log */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[300px]">
          <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-lg">Hoạt động gần đây</h3>
              <button className="text-sm text-blue-600 font-medium hover:underline">Xem tất cả</button>
          </div>
          <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-gray-500 font-semibold sticky top-0 shadow-sm z-10">
                      <tr>
                          <th className="p-4 border-b">Thời gian</th>
                          <th className="p-4 border-b">Hành động</th>
                          <th className="p-4 border-b">Khu vực / Bàn</th>
                          <th className="p-4 border-b text-right">Giá trị</th>
                          <th className="p-4 border-b text-center">Trạng thái</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {recentActivities.map((act) => (
                          <tr key={act.id} className="hover:bg-gray-50 transition">
                              <td className="p-4 text-gray-500 whitespace-nowrap">
                                  <div className="flex items-center">
                                      <Clock size={14} className="mr-2"/>
                                      {act.time.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                      <span className="text-xs ml-1 bg-gray-100 px-1 rounded">{act.time.toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'})}</span>
                                  </div>
                              </td>
                              <td className="p-4">
                                  <div className="font-medium text-gray-800 flex items-center">
                                      {act.type === 'PAYMENT' ? (
                                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                      ) : (
                                          <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                      )}
                                      {act.type === 'PAYMENT' ? 'Thanh toán đơn hàng' : 'Mở bàn / Gọi món'}
                                  </div>
                                  <div className="text-xs text-gray-400 pl-4">#{act.id.slice(-6).toUpperCase()} • {act.itemCount} món</div>
                              </td>
                              <td className="p-4 font-medium text-gray-700">{act.tableName}</td>
                              <td className="p-4 text-right font-bold text-gray-900">{act.total.toLocaleString()}đ</td>
                              <td className="p-4 text-center">
                                  {act.type === 'PAYMENT' ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          Hoàn thành
                                      </span>
                                  ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          Đang phục vụ
                                      </span>
                                  )}
                              </td>
                          </tr>
                      ))}
                      {recentActivities.length === 0 && (
                          <tr><td colSpan={5} className="p-10 text-center text-gray-400">Chưa có hoạt động nào trong ngày</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};
