import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Search, Filter, Plus } from 'lucide-react';
import { AddTableModal } from './AddTableModal';

export const TableManager: React.FC = () => {
    const { tables, areas, addTable } = usePOS();
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Filters
    const [tableSearch, setTableSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [areaFilter, setAreaFilter] = useState<string>('ALL');

    const filteredTables = tables.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(tableSearch.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? t.isActive !== false : t.isActive === false);
        const matchesArea = areaFilter === 'ALL' || t.areaId === areaFilter;
        return matchesSearch && matchesStatus && matchesArea;
    });

    const resetFilters = () => {
        setTableSearch('');
        setStatusFilter('ALL');
        setAreaFilter('ALL');
    };

    const handleSaveTable = async (tableData: any) => {
        try {
            await addTable({ ...tableData, isActive: true });
            setShowAddModal(false);
        } catch (error) {
            console.error('Failed to add table:', error);
            alert('Không thể thêm phòng/bàn. Vui lòng thử lại.');
        }
    };

    return (
        <div className="flex h-full bg-white flex-col">
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar Filter (Layout similar to Reservation View) */}
                <div className="w-72 bg-gray-50 border-r border-gray-200 p-5 flex flex-col space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Tên phòng/bàn..." 
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={tableSearch}
                                onChange={(e) => setTableSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực</label>
                        <div className="relative">
                            <select 
                                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                                value={areaFilter}
                                onChange={(e) => setAreaFilter(e.target.value)}
                            >
                                <option value="ALL">--Tất cả--</option>
                                {areas.filter(a => a.isActive).map(area => (
                                    <option key={area.id} value={area.id}>{area.name}</option>
                                ))}
                            </select>
                            <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                        <div className="relative">
                            <select 
                                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                            >
                                <option value="ALL">Tất cả</option>
                                <option value="ACTIVE">Đang hoạt động</option>
                                <option value="INACTIVE">Ngừng hoạt động</option>
                            </select>
                            <Filter className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <button 
                        onClick={resetFilters}
                        className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 bg-white hover:bg-gray-50 font-medium transition"
                    >
                        Xóa bộ lọc
                    </button>
                </div>

                {/* Main Table Content */}
                <div className="flex-1 flex flex-col bg-white">
                     <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                        <h3 className="font-bold text-xl text-gray-800">Danh sách Phòng/Bàn</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition">
                                <Plus size={16} className="mr-1"/> Thêm phòng/bàn
                            </button>
                        </div>
                   </div>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                                    <tr>
                                        <th className="p-4 border-b">Tên phòng/bàn</th>
                                        <th className="p-4 border-b">Ghi chú</th>
                                        <th className="p-4 border-b">Khu vực</th>
                                        <th className="p-4 border-b text-right">Số ghế</th>
                                        <th className="p-4 border-b">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTables.map(t => (
                                        <tr key={t.id} className="hover:bg-gray-50 transition">
                                            <td className="p-4 font-medium text-gray-900">{t.name}</td>
                                            <td className="p-4 text-gray-500 italic">{t.note || '-'}</td>
                                            <td className="p-4 text-gray-800">{t.area?.name || '-'}</td>
                                            <td className="p-4 text-right text-gray-800">{t.capacity}</td>
                                            <td className="p-4 text-gray-800">
                                                {t.isActive !== false ? (
                                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Hoạt động</span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs font-bold">Ngừng</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTables.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400">Không tìm thấy phòng/bàn nào</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AddTableModal 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)} 
                onSave={handleSaveTable} 
                areas={areas}
            />
        </div>
    );
};