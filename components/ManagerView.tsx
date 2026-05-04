
import React, { useState } from 'react';
import { 
  LayoutDashboard, Package, Coffee, ArrowLeftRight, Users, UserCircle, FileBarChart, 
  ChevronDown
} from 'lucide-react';
import { ManagerDashboard } from './manager/ManagerDashboard';
import { AreaManager } from './manager/AreaManager';
import { TableManager } from './manager/TableManager';
import { TransactionManager } from './manager/TransactionManager';
import { ImportGoodsManager } from './manager/ImportGoodsManager';
import { ExportGoodsManager } from './manager/ExportGoodsManager';
import { CustomerManager } from './manager/CustomerManager';
import { SupplierManager } from './manager/SupplierManager';
import { StaffListManager } from './manager/staff/StaffListManager';
import { WorkScheduleManager } from './manager/staff/WorkScheduleManager';
import { TimekeepingManager } from './manager/staff/TimekeepingManager';
import { AccountManager } from './manager/AccountManager';
import { LoginHistoryList } from './manager/staff/LoginHistoryList'; // Mới
import { MenuManager } from './manager/goods/MenuManager';
import { InventoryItemManager } from './manager/goods/InventoryItemManager';
import { InventoryCheckManager } from './manager/goods/InventoryCheckManager';
import { EndOfDayReport } from './manager/reports/EndOfDayReport';
import { RevenueReport } from './manager/reports/RevenueReport';
import { NotificationCenter } from './manager/NotificationCenter';

type NavItem = {
  id: string;
  label: string;
  icon?: React.ElementType;
  subItems?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { id: 'OVERVIEW', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'GOODS', label: 'Hàng hóa', icon: Package, subItems: ['Danh mục món ăn', 'Danh mục hàng hóa', 'Kiểm kho'] },
  { id: 'TABLES', label: 'Phòng/Bàn', icon: Coffee, subItems: ['Quản lý khu vực', 'Danh sách phòng bàn'] },
  { id: 'TRANSACTIONS', label: 'Giao dịch', icon: ArrowLeftRight, subItems: ['Hóa đơn', 'Nhập hàng', 'Xuất hàng'] },
  { id: 'PARTNERS', label: 'Đối tác', icon: Users, subItems: ['Khách hàng', 'Nhà cung cấp'] },
  { id: 'STAFF', label: 'Nhân viên', icon: UserCircle, subItems: ['Danh sách nhân viên', 'Quản lý tài khoản', 'Lịch sử truy cập', 'Lịch làm việc', 'Bảng chấm công'] },
  { id: 'REPORTS', label: 'Báo cáo', icon: FileBarChart, subItems: ['Báo cáo cuối ngày', 'Báo cáo doanh thu'] },
];

const ManagerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [activeSubTab, setActiveSubTab] = useState('');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  const handleNavClick = (item: NavItem) => {
    setActiveTab(item.id);
    if (item.subItems && item.subItems.length > 0) {
      setActiveSubTab(item.subItems[0]);
    } else {
      setActiveSubTab('');
    }
  };

  const handleSubItemClick = (e: React.MouseEvent, parentId: string, subItem: string) => {
    e.stopPropagation();
    setActiveTab(parentId);
    setActiveSubTab(subItem);
    setHoveredTab(null);
  };

  const renderPlaceholder = (title: string, sub: string) => (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded shadow-sm border border-gray-200">
      <Package size={64} className="text-gray-200 mb-4" />
      <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
      {sub && <p className="text-gray-500 mt-2">Đang xem: <span className="font-medium text-blue-600">{sub}</span></p>}
      <p className="text-sm text-gray-400 mt-8">Tính năng đang được phát triển.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 overflow-hidden">
      
      {/* Navigation Bar */}
      <div className="bg-blue-700 text-white px-4 shadow-md z-20 shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between h-12">
          <div className="flex items-center space-x-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const hasSub = item.subItems && item.subItems.length > 0;
            const isHovered = hoveredTab === item.id;

            return (
              <div 
                key={item.id} 
                className="relative h-full"
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <button
                  onClick={() => handleNavClick(item)}
                  className={`px-4 h-full flex items-center font-bold text-sm transition-colors
                    ${isActive ? 'bg-blue-800 text-white' : 'hover:bg-blue-800 text-white/90'}
                  `}
                >
                  {item.label}
                  {hasSub && <ChevronDown size={14} className="ml-1 opacity-70" />}
                </button>

                {hasSub && (isHovered || isActive) && item.subItems && (
                  <div className={`absolute top-full left-0 w-48 bg-white text-gray-800 shadow-xl rounded-b-md border-t-0 border-gray-200 overflow-hidden z-50
                      ${isHovered ? 'block' : 'hidden'}
                  `}>
                    {item.subItems.map(sub => (
                      <div 
                        key={sub} 
                        onClick={(e) => handleSubItemClick(e, item.id, sub)}
                        className={`px-4 py-2.5 text-sm hover:bg-gray-100 cursor-pointer border-b border-gray-50 last:border-0
                            ${activeTab === item.id && activeSubTab === sub ? 'text-blue-700 font-bold bg-blue-50' : 'text-gray-600'}
                        `}
                      >
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          </div>
          
          {/* Notification Center */}
          <div className="flex items-center">
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Sub-Header Context */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shadow-sm shrink-0">
         <h2 className="text-xl font-bold text-gray-800 flex items-center">
            {NAV_ITEMS.find(i => i.id === activeTab)?.label}
            {activeSubTab && <span className="text-gray-400 mx-2 text-sm font-normal">/</span>}
            {activeSubTab && <span className="text-gray-600 text-lg font-normal">{activeSubTab}</span>}
         </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6">
          <div className="max-w-[1600px] mx-auto h-full overflow-hidden">
            {activeTab === 'OVERVIEW' 
                ? <ManagerDashboard />
                : (activeTab === 'GOODS' && activeSubTab === 'Danh mục món ăn')
                    ? <MenuManager />
                : (activeTab === 'GOODS' && activeSubTab === 'Danh mục hàng hóa')
                    ? <InventoryItemManager />
                : (activeTab === 'GOODS' && activeSubTab === 'Kiểm kho')
                    ? <InventoryCheckManager />
                : (activeTab === 'TABLES' && activeSubTab === 'Quản lý khu vực')
                    ? <AreaManager />
                : (activeTab === 'TABLES' && activeSubTab === 'Danh sách phòng bàn') 
                    ? <TableManager />
                : (activeTab === 'TRANSACTIONS' && activeSubTab === 'Hóa đơn')
                    ? <TransactionManager />
                : (activeTab === 'TRANSACTIONS' && activeSubTab === 'Nhập hàng')
                    ? <ImportGoodsManager />
                : (activeTab === 'TRANSACTIONS' && activeSubTab === 'Xuất hàng')
                    ? <ExportGoodsManager />
                : (activeTab === 'PARTNERS' && activeSubTab === 'Khách hàng')
                    ? <CustomerManager />
                : (activeTab === 'PARTNERS' && activeSubTab === 'Nhà cung cấp')
                    ? <SupplierManager />
                : (activeTab === 'STAFF' && activeSubTab === 'Danh sách nhân viên')
                    ? <StaffListManager />
                : (activeTab === 'STAFF' && activeSubTab === 'Quản lý tài khoản')
                    ? <AccountManager />
                : (activeTab === 'STAFF' && activeSubTab === 'Lịch sử truy cập') // Route mới
                    ? <LoginHistoryList />
                : (activeTab === 'STAFF' && activeSubTab === 'Lịch làm việc')
                    ? <WorkScheduleManager />
                : (activeTab === 'STAFF' && activeSubTab === 'Bảng chấm công')
                    ? <TimekeepingManager />
                : (activeTab === 'REPORTS' && activeSubTab === 'Báo cáo cuối ngày')
                    ? <EndOfDayReport />
                : (activeTab === 'REPORTS' && activeSubTab === 'Báo cáo doanh thu')
                    ? <RevenueReport />
                : renderPlaceholder(NAV_ITEMS.find(i => i.id === activeTab)?.label || '', activeSubTab)
            }
          </div>
      </div>
    </div>
  );
};

export default ManagerView;
