
import React, { useState, useEffect } from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import WaiterView from './components/WaiterView';
import KitchenView from './components/KitchenView';
import CashierView from './components/CashierView';
import ManagerView from './components/ManagerView';
import LoginView from './components/LoginView';
import { User, ChefHat, DollarSign, Briefcase, WifiOff, LogOut, ShieldCheck } from 'lucide-react';
import { UserRole } from './types';

enum View {
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
  MANAGER = 'MANAGER'
}

const MainApp: React.FC = () => {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { error } = usePOS();
  const [currentView, setCurrentView] = useState<View>(View.WAITER);

  // Tự động chuyển màn hình dựa trên Role sau khi đăng nhập
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case UserRole.WAITER: setCurrentView(View.WAITER); break;
        case UserRole.CHEF: setCurrentView(View.KITCHEN); break;
        case UserRole.CASHIER: setCurrentView(View.CASHIER); break;
        case UserRole.ADMIN: setCurrentView(View.MANAGER); break;
        default: setCurrentView(View.WAITER);
      }
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium text-sm">Đang khởi động hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Helper to check if user has access to a specific view
  const canAccess = (view: View) => {
    // ADMIN có quyền truy cập tất cả
    if (user.role === UserRole.ADMIN) return true;
    
    // Các role khác chỉ truy cập view của mình
    switch (user.role) {
      case UserRole.WAITER: return view === View.WAITER;
      case UserRole.CHEF: return view === View.KITCHEN;
      case UserRole.CASHIER: return view === View.CASHIER;
      default: return false;
    }
  };
  
  // Helper để check xem có thể chuyển view không (chỉ ADMIN được phép chuyển)
  const canSwitchView = () => user.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
        {error && (
            <div className="bg-red-600 text-white text-xs font-bold text-center py-1 flex justify-center items-center shrink-0">
                <WifiOff size={14} className="mr-1"/> {error}
            </div>
        )}
        
        {/* Navigation Header */}
        <header className="bg-white shadow-sm z-50 relative shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <span className="text-2xl font-black text-indigo-600 tracking-tighter mr-8">
                  POS<span className="text-gray-400 font-light">PRO</span>
                </span>
                
                <nav className="flex space-x-2">
                  {canAccess(View.WAITER) && (
                    <button
                      onClick={() => canSwitchView() && setCurrentView(View.WAITER)}
                      disabled={!canSwitchView() && currentView !== View.WAITER}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        currentView === View.WAITER 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : canSwitchView() ? 'text-gray-500 hover:bg-slate-100' : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title={!canSwitchView() ? 'Bạn không có quyền chuyển view' : ''}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Phục Vụ
                    </button>
                  )}

                  {canAccess(View.KITCHEN) && (
                    <button
                      onClick={() => canSwitchView() && setCurrentView(View.KITCHEN)}
                      disabled={!canSwitchView() && currentView !== View.KITCHEN}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        currentView === View.KITCHEN 
                          ? 'bg-orange-500 text-white shadow-md' 
                          : canSwitchView() ? 'text-gray-500 hover:bg-slate-100' : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title={!canSwitchView() ? 'Bạn không có quyền chuyển view' : ''}
                    >
                      <ChefHat className="w-4 h-4 mr-2" />
                      Bếp
                    </button>
                  )}

                  {canAccess(View.CASHIER) && (
                    <button
                      onClick={() => canSwitchView() && setCurrentView(View.CASHIER)}
                      disabled={!canSwitchView() && currentView !== View.CASHIER}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        currentView === View.CASHIER 
                          ? 'bg-emerald-600 text-white shadow-md' 
                          : canSwitchView() ? 'text-gray-500 hover:bg-slate-100' : 'text-gray-300 cursor-not-allowed'
                      }`}
                      title={!canSwitchView() ? 'Bạn không có quyền chuyển view' : ''}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Thu Ngân
                    </button>
                  )}

                  {user.role === UserRole.ADMIN && (
                    <button
                      onClick={() => setCurrentView(View.MANAGER)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                        currentView === View.MANAGER 
                          ? 'bg-blue-800 text-white shadow-md' 
                          : 'text-gray-500 hover:bg-slate-100'
                      }`}
                    >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Quản lý
                    </button>
                  )}
                </nav>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm">
                   <div className="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full flex items-center">
                      <ShieldCheck className="text-indigo-600 mr-2" size={16} />
                      <span className="text-indigo-900 font-bold">{user.displayName}</span>
                      <span className="text-indigo-400 text-[10px] ml-2 uppercase tracking-widest">{user.role}</span>
                   </div>
                </div>
                <button 
                  onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn đăng xuất?')) {
                      logout();
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  title="Đăng xuất"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
          {currentView === View.WAITER && canAccess(View.WAITER) && <WaiterView />}
          {currentView === View.KITCHEN && canAccess(View.KITCHEN) && <KitchenView />}
          {currentView === View.CASHIER && canAccess(View.CASHIER) && <CashierView />}
          {currentView === View.MANAGER && user.role === UserRole.ADMIN && <ManagerView />}
        </main>
      </div>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <POSProvider>
        <MainApp />
      </POSProvider>
    </AuthProvider>
  );
};

export default App;
