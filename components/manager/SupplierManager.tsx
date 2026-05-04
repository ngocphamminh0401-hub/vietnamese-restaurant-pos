import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Search, Plus, User, Building2, MapPin, Phone, Edit2, Trash2 } from 'lucide-react';
import { AddSupplierModal } from './AddSupplierModal';
import { Supplier } from '../../types';

export const SupplierManager: React.FC = () => {
    const { suppliers, addSupplier } = usePOS();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'PERSONAL' | 'COMPANY'>('ALL');

    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.phone.includes(searchTerm) ||
            s.code.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = typeFilter === 'ALL' || s.type === typeFilter;

        return matchesSearch && matchesType;
    });

    const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id' | 'code'>) => {
        if (editingSupplier) {
            // Update existing supplier
            try {
                const response = await fetch(`/api/suppliers/${editingSupplier.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(supplierData)
                });
                if (response.ok) {
                    window.location.reload(); // Reload to get updated data
                }
            } catch (e) {
                console.error('Failed to update supplier:', e);
            }
            setEditingSupplier(null);
        } else {
            // Add new supplier
            addSupplier(supplierData);
        }
        setShowAddModal(false);
    };

    const handleDeleteSupplier = async () => {
        if (!deletingSupplier) return;
        try {
            const response = await fetch(`/api/suppliers/${deletingSupplier.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                window.location.reload(); // Reload to get updated data
            }
        } catch (e) {
            console.error('Failed to delete supplier:', e);
        }
        setDeletingSupplier(null);
    };

    const handleEditClick = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setShowAddModal(true);
    };

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
                                placeholder="Tên, SĐT, Mã..." 
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại nhà cung cấp</label>
                        <div className="space-y-2">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="sFilter" className="mr-2 text-blue-600 focus:ring-blue-500" checked={typeFilter === 'ALL'} onChange={() => setTypeFilter('ALL')} />
                                <span className="text-sm text-gray-700">Tất cả</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="sFilter" className="mr-2 text-blue-600 focus:ring-blue-500" checked={typeFilter === 'PERSONAL'} onChange={() => setTypeFilter('PERSONAL')} />
                                <span className="text-sm text-gray-700">Cá nhân</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="sFilter" className="mr-2 text-blue-600 focus:ring-blue-500" checked={typeFilter === 'COMPANY'} onChange={() => setTypeFilter('COMPANY')} />
                                <span className="text-sm text-gray-700">Công ty</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                     <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                        <h3 className="font-bold text-xl text-gray-800">Danh sách Nhà cung cấp</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition"
                            >
                                <Plus size={16} className="mr-1"/> Thêm nhà cung cấp
                            </button>
                        </div>
                   </div>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                                    <tr>
                                        <th className="p-4 border-b">Mã NCC</th>
                                        <th className="p-4 border-b">Tên nhà cung cấp</th>
                                        <th className="p-4 border-b">Điện thoại</th>
                                        <th className="p-4 border-b">Loại</th>
                                        <th className="p-4 border-b">Địa chỉ</th>
                                        <th className="p-4 border-b text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSuppliers.map(s => (
                                        <tr key={s.id} className="hover:bg-gray-50 transition group">
                                            <td className="p-4 font-medium text-blue-600 cursor-pointer">{s.code}</td>
                                            <td className="p-4 font-bold text-gray-800">{s.name}</td>
                                            <td className="p-4 text-gray-600">
                                                <div className="flex items-center"><Phone size={14} className="mr-1.5 text-gray-400"/> {s.phone}</div>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {s.type === 'PERSONAL' ? (
                                                    <span className="flex items-center text-xs bg-green-100 text-green-700 px-2 py-1 rounded w-fit font-bold"><User size={12} className="mr-1"/> Cá nhân</span>
                                                ) : (
                                                    <span className="flex items-center text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded w-fit font-bold"><Building2 size={12} className="mr-1"/> Công ty</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                 <div className="flex items-center"><MapPin size={14} className="mr-1.5 text-gray-400"/> {s.address || '-'}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => handleEditClick(s)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                                        title="Sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => setDeletingSupplier(s)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSuppliers.length === 0 && (
                                         <tr><td colSpan={6} className="p-10 text-center text-gray-400">Không tìm thấy nhà cung cấp nào</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AddSupplierModal 
                isOpen={showAddModal} 
                onClose={() => {
                    setShowAddModal(false);
                    setEditingSupplier(null);
                }} 
                onSave={handleSaveSupplier}
                editingSupplier={editingSupplier}
            />

            {/* Delete Confirmation Modal */}
            {deletingSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa nhà cung cấp <strong>{deletingSupplier.name}</strong>?
                            <br />
                            <span className="text-sm text-red-600">Hành động này không thể hoàn tác.</span>
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setDeletingSupplier(null)}
                                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleDeleteSupplier}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};