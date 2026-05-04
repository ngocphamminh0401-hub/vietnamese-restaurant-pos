
import React, { useState } from 'react';
import { usePOS } from '../../../context/POSContext';
import { Search, Plus, Edit2, Trash2, FolderPlus, AlertTriangle, CheckCircle } from 'lucide-react';
import { AddMenuItemModal } from './AddMenuItemModal';
import { AddCategoryModal } from './AddCategoryModal';
import { MenuItem } from '../../../types';

export const MenuManager: React.FC = () => {
    const { menu, categories, deleteMenuItem, toggleMenuItemOutOfStock, addCategory, deleteCategory } = usePOS();
    const [activeTab, setActiveTab] = useState<'ITEMS' | 'CATEGORIES'>('ITEMS');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | undefined>(undefined);

    const filteredMenu = menu.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleEdit = (item: MenuItem) => {
        setEditingItem(item);
        setShowAddModal(true);
    };

    const handleAdd = () => {
        setEditingItem(undefined);
        setShowAddModal(true);
    };

    const handleAddCategory = (name: string) => {
        addCategory(name);
    };

    const handleToggleOutOfStock = async (item: MenuItem) => {
        const newStatus = !item.isOutOfStock;
        const confirmMsg = newStatus 
            ? `Đánh dấu "${item.name}" là HẾT?\nHệ thống sẽ gửi thông báo đến phục vụ và quản lý, đồng thời cập nhật trạng thái là "Ngừng kinh doanh".`
            : `Đánh dấu "${item.name}" là CÒN?\nMón này sẽ được phục vụ có thể order lại.`;
        
        if (!window.confirm(confirmMsg)) return;
        
        try {
            await toggleMenuItemOutOfStock(item.id, newStatus);
            alert(newStatus ? '✅ Đã đánh dấu món HẾT' : '✅ Đã đánh dấu món CÒN');
        } catch (e) {
            alert('❌ Có lỗi xảy ra');
        }
    };

    return (
        <div className="flex h-full bg-white flex-col">
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar for Tabs */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="p-4">
                        <h3 className="font-bold text-gray-700 mb-4">Quản lý Thực đơn</h3>
                        <div className="space-y-2">
                             <button onClick={() => setActiveTab('ITEMS')} className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${activeTab === 'ITEMS' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>Danh sách món ăn</button>
                             <button onClick={() => setActiveTab('CATEGORIES')} className={`w-full text-left px-4 py-2 rounded-lg font-medium transition ${activeTab === 'CATEGORIES' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-600'}`}>Nhóm món (Danh mục)</button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    {activeTab === 'ITEMS' && (
                        <>
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Tìm món ăn..." 
                                            className="w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition">
                                    <Plus size={16} className="mr-1"/> Thêm món
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-6">
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                                            <tr>
                                                <th className="p-4 border-b w-16">Ảnh</th>
                                                <th className="p-4 border-b">Tên món</th>
                                                <th className="p-4 border-b">Danh mục</th>
                                                <th className="p-4 border-b text-right">Giá bán</th>
                                                <th className="p-4 border-b text-center">ĐVT</th>
                                                <th className="p-4 border-b text-center">Trạng thái</th>
                                                <th className="p-4 border-b text-center">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredMenu.map(item => (
                                                <tr key={item.id} className={`hover:bg-gray-50 transition ${item.isOutOfStock ? 'bg-orange-50/30' : ''}`}>
                                                    <td className="p-4"><img src={item.image} alt="" className="w-10 h-10 rounded object-cover bg-gray-200"/></td>
                                                    <td className="p-4 font-bold text-gray-800">{item.name}</td>
                                                    <td className="p-4 text-gray-600">{item.category}</td>
                                                    <td className="p-4 text-right font-medium text-gray-900">{item.price.toLocaleString()}</td>
                                                    <td className="p-4 text-center text-gray-500">{item.unit}</td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            {item.isActive ? 
                                                                <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs font-bold">Kinh doanh</span> : 
                                                                <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs font-bold">Ngừng bán</span>
                                                            }
                                                            {item.isOutOfStock && (
                                                                <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                                                    <AlertTriangle size={12}/>
                                                                    Hết món
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleToggleOutOfStock(item)} 
                                                                className={`p-1.5 rounded hover:opacity-80 ${item.isOutOfStock ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}
                                                                title={item.isOutOfStock ? 'Đánh dấu còn món' : 'Đánh dấu hết món'}
                                                            >
                                                                {item.isOutOfStock ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
                                                            </button>
                                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><Edit2 size={16}/></button>
                                                            <button onClick={() => deleteMenuItem(item.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'CATEGORIES' && (
                        <>
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                                <h3 className="font-bold text-xl text-gray-800">Danh sách Nhóm món</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowCategoryModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition">
                                        <Plus size={16} className="mr-1"/> Thêm nhóm
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto p-6 bg-white">
                                <div className="max-w-4xl border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                                            <tr>
                                                <th className="p-4 border-b">Tên nhóm món</th>
                                                <th className="p-4 border-b text-center w-32">Số lượng món</th>
                                                <th className="p-4 border-b text-center w-32">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {categories.map((cat, idx) => {
                                                const itemCount = menu.filter(m => m.category === cat).length;
                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 transition">
                                                        <td className="p-4 font-medium text-gray-800 flex items-center">
                                                            <FolderPlus size={18} className="text-blue-500 mr-3 opacity-70"/>
                                                            {cat}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">{itemCount} món</span>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <button onClick={() => deleteCategory(cat)} className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition" title="Xóa nhóm">
                                                                <Trash2 size={16}/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <AddMenuItemModal 
                isOpen={showAddModal} 
                onClose={() => setShowAddModal(false)}
                initialData={editingItem}
            />

            <AddCategoryModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSave={handleAddCategory}
            />
        </div>
    );
};
