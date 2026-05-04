import React from 'react';
import { AlertCircle } from 'lucide-react';

export const InventoryCheckManager: React.FC = () => {
    return (
        <div className="flex h-full bg-white flex-col">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-xl text-gray-800">Kiểm kho</h3>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
                <div className="text-center text-gray-500 max-w-md">
                    <AlertCircle size={64} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-bold text-gray-700 mb-2">Chức năng kiểm kho</h3>
                    <p className="text-sm">
                        Chức năng kiểm kho đã được tắt. Số lượng tồn kho được quản lý tự động qua các phiếu nhập hàng và xuất hàng.
                    </p>
                    <p className="text-sm mt-2">
                        Xem tồn kho hiện tại tại: <span className="font-bold text-blue-600">Quản lý → Hàng hóa → Danh mục hàng hóa</span>
                    </p>
                </div>
            </div>
        </div>
    );
};