import React, { useState, useMemo } from 'react';
import { X, Search, Volume2, Trash2 } from 'lucide-react';
import { MenuItem } from '../../types';

interface ItemNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSubmit: (selectedItems: MenuItem[], message: string, notificationType: 'OUT_OF_STOCK' | 'BACK_IN_STOCK') => void;
}

export const ItemNotificationModal: React.FC<ItemNotificationModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onSubmit
}) => {
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationType, setNotificationType] = useState<'OUT_OF_STOCK' | 'BACK_IN_STOCK'>('OUT_OF_STOCK');

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => 
      item.isActive && 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.id.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [menuItems, searchTerm]);

  const handleToggleItem = (item: MenuItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSubmit = () => {
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn ít nhất một món');
      return;
    }

    const itemNames = selectedItems.map(i => i.name).join(', ');
    const message = notificationType === 'OUT_OF_STOCK' 
      ? `Món ${itemNames} tạm hết. Đề nghị khách chọn món khác.`
      : `Món ${itemNames} đã có trở lại. Có thể nhận order.`;

    onSubmit(selectedItems, message, notificationType);
    setSelectedItems([]);
    setSearchTerm('');
    setNotificationType('OUT_OF_STOCK');
    onClose();
  };

  const handleCancel = () => {
    setSelectedItems([]);
    setSearchTerm('');
    setNotificationType('OUT_OF_STOCK');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Gửi thông báo
          </h2>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Notification Type Selection */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="text-sm font-bold text-gray-700 mb-3">Loại thông báo</div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="notificationType"
                checked={notificationType === 'OUT_OF_STOCK'}
                onChange={() => setNotificationType('OUT_OF_STOCK')}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 font-medium">Không nhận gọi thêm (hết món)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="notificationType"
                checked={notificationType === 'BACK_IN_STOCK'}
                onChange={() => setNotificationType('BACK_IN_STOCK')}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 font-medium">Tiếp tục nhận gọi (còn món)</span>
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="text-sm font-bold text-gray-700 mb-2">Món</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-4 text-left font-bold text-gray-700 border-b">Mã hàng hóa</th>
                <th className="p-4 text-left font-bold text-gray-700 border-b">Tên hàng hóa</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-gray-500">
                    Không có hàng hóa nào
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItems.find(i => i.id === item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleToggleItem(item)}
                      className={`cursor-pointer hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}
                    >
                      <td className="p-4 border-b">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => {}}
                            className="w-4 h-4"
                          />
                          <span className="font-medium text-gray-700">{item.id}</span>
                        </div>
                      </td>
                      <td className="p-4 border-b text-gray-700">{item.name}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <div className="p-4 bg-indigo-50 border-t border-indigo-100">
            <div className="text-sm font-bold text-indigo-800 mb-2">
              Đã chọn {selectedItems.length} món:
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedItems.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-indigo-200"
                >
                  {item.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleItem(item);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Volume2 size={18} />
            Gửi đi
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            <Trash2 size={18} />
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};
