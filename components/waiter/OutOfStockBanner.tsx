import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('/', { path: '/socket.io' });

interface OutOfStockNotification {
  itemName: string;
  itemId: string;
  affectedTables: string[];
}

export const OutOfStockBanner: React.FC = () => {
  const [notifications, setNotifications] = useState<OutOfStockNotification[]>([]);

  useEffect(() => {
    // Listen for out of stock events
    socket.on('ITEM_OUT_OF_STOCK', (data: OutOfStockNotification) => {
      setNotifications((prev) => [...prev, data]);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.itemId !== data.itemId));
      }, 10000);
    });

    return () => {
      socket.off('ITEM_OUT_OF_STOCK');
    };
  }, []);

  const removeNotification = (itemId: string) => {
    setNotifications((prev) => prev.filter((n) => n.itemId !== itemId));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.itemId}
            className="bg-orange-500 text-white rounded-lg shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-300"
          >
            <div className="flex-shrink-0 mt-0.5">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-lg mb-1">
                ⚠️ Món đã hết: {notification.itemName}
              </h4>
              {notification.affectedTables.length > 0 && (
                <p className="text-sm opacity-90">
                  Bàn bị ảnh hưởng: <strong>{notification.affectedTables.join(', ')}</strong>
                </p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.itemId)}
              className="flex-shrink-0 p-1 hover:bg-orange-600 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
