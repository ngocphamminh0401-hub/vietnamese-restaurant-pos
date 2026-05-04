import React, { useState } from 'react';
import { usePOS } from '../../../context/POSContext';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { AddInventoryItemModal } from './AddInventoryItemModal';
import { InventoryItem } from '../../../types';

export const InventoryItemManager: React.FC = () => {
    const { inventoryItems, deleteInventoryItem } = usePOS();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);

    console.log('InventoryItemManager render - items count:', inventoryItems.length, inventoryItems);

    const filteredItems = inventoryItems.filter(i => 
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (item: InventoryItem) => {
        setEditingItem(item);
        setShowAddModal(true);
    };

    const handleAdd = () => {
        setEditingItem(undefined);
        setShowAddModal(true);
    };

    return (
        <div className="flex h-full bg-white flex-col">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-xl text-gray-800">Danh mục Hàng hóa</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tên, mã hàng..." 
                            className="w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition">
                    <Plus size={16} className="mr-1"/> Thêm hàng hóa
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-blue-50 text-gray-700 font-bold border-b border-blue-100">
                            <tr>
                                <th className="p-4 border-b">Mã hàng</th>
                                <th className="p-4 border-b">Tên hàng hóa</th>
                                <th className="p-4 border-b">Nhóm hàng</th>
                                <th className="p-4 border-b text-center">ĐVT</th>
                                <th className="p-4 border-b text-right">Giá vốn</th>
                                <th className="p-4 border-b text-right">Tồn kho</th>
                                <th className="p-4 border-b text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-medium text-blue-600">{item.code}</td>
                                    <td className="p-4 font-bold text-gray-800">{item.name}</td>
                                    <td className="p-4 text-gray-600">{item.category}</td>
                                    <td className="p-4 text-center text-gray-500">{item.unit}</td>
                                    <td className="p-4 text-right text-gray-900">{(item.price ?? 0).toLocaleString()}</td>
                                    <td className={`p-4 text-right font-bold ${(item.quantity ?? 0) <= (item.minStock ?? 0) ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.quantity ?? 0}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteInventoryItem(item.id)} className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddInventoryItemModal 
                isOpen={showAddModal} 
                onClose={() => {
                    setShowAddModal(false);
                    setEditingItem(undefined);
                }}
                initialData={editingItem}
            />
        </div>
    );
};