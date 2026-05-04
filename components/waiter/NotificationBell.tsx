import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePOS } from '../../context/POSContext';
import { useAuth } from '../../context/AuthContext';
import { Notification, NotificationType } from '../../types';

export const NotificationBell: React.FC = () => {
  const { notifications, markNotificationAsRead } = usePOS();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    console.log('🔔 NotificationBell mounted/updated:', {
      userRole: user?.role,
      userRoleType: typeof user?.role,
      notificationCount: notifications.length,
      notifications: notifications.map(n => ({
        id: n.id,
        title: n.title,
        targetRoles: n.targetRoles,
        targetRolesType: typeof n.targetRoles
      }))
    });
  }, [user, notifications]);

  // Filter notifications for current user role
  const userNotifications = notifications.filter(n => {
    if (!user) return false;
    const targetRoles = n.targetRoles.split(',').map(r => r.trim());
    
    // Check if user role matches
    const roleMatches = targetRoles.includes(user.role);
    
    // If user is WAITER, only show item stock notifications
    if (user.role === 'WAITER') {
      const isItemNotification = n.type === 'ITEM_OUT_OF_STOCK' || n.type === 'ITEM_BACK_IN_STOCK';
      console.log('🔍 Filtering notification for WAITER:', {
        notificationId: n.id,
        title: n.title,
        type: n.type,
        isItemNotification,
        roleMatches,
        willShow: roleMatches && isItemNotification
      });
      return roleMatches && isItemNotification;
    }
    
    // For other roles (MANAGER, etc.), show all notifications
    console.log('🔍 Filtering notification:', {
      notificationId: n.id,
      title: n.title,
      targetRoles,
      userRole: user.role,
      matches: roleMatches
    });
    return roleMatches;
  });

  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.ITEM_OUT_OF_STOCK:
        return <AlertTriangle size={18} className="text-red-500" />;
      case NotificationType.ITEM_BACK_IN_STOCK:
        return <CheckCircle size={18} className="text-green-500" />;
      default:
        return <Bell size={18} className="text-blue-500" />;
    }
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell size={24} className="text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-gray-700" />
                <h3 className="font-bold text-gray-800">Thông báo</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {userNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell size={48} className="mb-2 opacity-20" />
                  <p>Không có thông báo</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {userNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type as NotificationType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-bold text-gray-800 text-sm">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-400">
                              {getTimeAgo(notification.createdAt)}
                            </span>
                            {notification.username && (
                              <>
                                <span className="text-xs text-gray-300">•</span>
                                <span className="text-xs text-gray-400">
                                  {notification.username}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {userNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    userNotifications
                      .filter(n => !n.isRead)
                      .forEach(n => markNotificationAsRead(n.id));
                  }}
                  className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
