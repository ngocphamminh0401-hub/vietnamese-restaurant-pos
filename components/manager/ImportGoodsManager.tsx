import React, { useState } from 'react';
import { Search, Calendar, Plus, Eye } from 'lucide-react';
import { AddImportModal } from './AddImportModal';
import { ImportDetailModal } from './ImportDetailModal';
import { usePOS } from '../../context/POSContext';

export const ImportGoodsManager: React.FC = () => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const { inventoryTransactions } = usePOS();

    const importList = inventoryTransactions.filter((t: any) => t.type === 'IMPORT');

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
                                placeholder="Mã phiếu, NCC..." 
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
                        <div className="relative">
                            <input type="date" className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-700" />
                            <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                     <button className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 font-medium transition">
                        Xóa bộ lọc
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                     <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                        <h3 className="font-bold text-xl text-gray-800">Danh sách Phiếu nhập</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition"
                            >
                                <Plus size={16} className="mr-1"/> Thêm nhập hàng
                            </button>
                        </div>
                   </div>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                                    <tr>
                                        <th className="p-4 border-b">Mã phiếu</th>
                                        <th className="p-4 border-b">Nhà cung cấp</th>
                                        <th className="p-4 border-b">Ngày nhập</th>
                                        <th className="p-4 border-b text-right">Tổng tiền</th>
                                        <th className="p-4 border-b text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {importList.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-blue-600">{item.code}</td>
                                            <td className="p-4 text-gray-800">{item.supplierName}</td>
                                            <td className="p-4 text-gray-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                                            <td className="p-4 text-right font-bold text-gray-900">{(item.totalAmount || 0).toLocaleString()} ₫</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedTransaction(item);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium text-xs"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {importList.length === 0 && (
                                         <tr><td colSpan={5} className="p-8 text-center text-gray-400">Chưa có phiếu nhập hàng nào</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Import Goods Form */}
            <AddImportModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
            
            {/* Detail Modal */}
            <ImportDetailModal 
                isOpen={showDetailModal} 
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedTransaction(null);
                }}
                transaction={selectedTransaction}
            />
        </div>
    );
};