import React, { useState, useEffect } from 'react';
import { X, Save, Image, DollarSign, LayoutList } from 'lucide-react';
import { MenuItem } from '../../../types';
import { usePOS } from '../../../context/POSContext';

interface AddMenuItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: MenuItem;
}

export const AddMenuItemModal: React.FC<AddMenuItemModalProps> = ({ isOpen, onClose, initialData }) => {
    const { addMenuItem, updateMenuItem, categories } = usePOS();
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: '',
        price: 0,
        category: categories[0] || 'Khác',
        unit: 'Đĩa',
        image: 'https://picsum.photos/200/200',
        isActive: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
             setFormData({
                name: '',
                price: 0,
                category: categories[0] || 'Khác',
                unit: 'Đĩa',
                image: 'https://picsum.photos/200/200',
                isActive: true
            });
        }
    }, [initialData, isOpen, categories]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.price) return;

        if (initialData && initialData.id) {
            updateMenuItem(initialData.id, formData);
        } else {
            addMenuItem(formData as Omit<MenuItem, 'id'>);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">{initialData ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Tên món <span className="text-red-500">*</span></label>
                            <input 
                                required
                                autoFocus
                                type="text" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Giá bán <span className="text-red-500">*</span></label>
                            <div className="flex-1 relative">
                                <input 
                                    required
                                    type="number" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.price}
                                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                                />
                                <DollarSign size={14} className="absolute right-3 top-3 text-gray-400"/>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Danh mục</label>
                            <div className="flex-1 relative">
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <LayoutList size={14} className="absolute right-8 top-3 text-gray-400 pointer-events-none"/>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Đơn vị tính</label>
                            <input 
                                type="text" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                placeholder="Đĩa, Bát, Cốc..."
                                value={formData.unit}
                                onChange={e => setFormData({...formData, unit: e.target.value})}
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Hình ảnh (URL)</label>
                             <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.image}
                                    onChange={e => setFormData({...formData, image: e.target.value})}
                                />
                                <Image size={14} className="absolute right-3 top-3 text-gray-400"/>
                             </div>
                        </div>

                         <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Trạng thái</label>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className="mr-2 h-4 w-4 text-blue-600 rounded" 
                                    checked={formData.isActive}
                                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                />
                                <span className="text-sm text-gray-700">Đang kinh doanh</span>
                            </label>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500 text-white font-bold rounded hover:bg-gray-600">Hủy bỏ</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center">
                            <Save size={16} className="mr-2"/> Lưu
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};