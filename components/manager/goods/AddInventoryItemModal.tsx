import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { InventoryItem } from '../../../types';
import { usePOS } from '../../../context/POSContext';

interface AddInventoryItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: InventoryItem;
}

export const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({ isOpen, onClose, initialData }) => {
    const { addInventoryItem, updateInventoryItem } = usePOS();
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '',
        category: '',
        unit: '',
        price: 0,
        minStock: 0,
        quantity: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    name: '',
                    category: '',
                    unit: '',
                    price: 0,
                    minStock: 0,
                    quantity: 0
                });
            }
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Validate required fields
            if (!formData.name || !formData.unit) {
                alert('Vui lòng nhập đầy đủ thông tin bắt buộc');
                setIsSubmitting(false);
                return;
            }
            
            // Map form fields to match backend schema
            const dataToSave = {
                name: formData.name,
                unit: formData.unit,
                quantity: formData.quantity || 0,
                minStock: formData.minStock || 0,
                price: formData.price || 0,
                category: formData.category || '',
                supplierId: null
            };
            
            if (initialData && initialData.id) {
                await updateInventoryItem(initialData.id, dataToSave);
                console.log('✓ Inventory item updated');
            } else {
                await addInventoryItem(dataToSave);
                console.log('✓ Inventory item created, data should be refreshed');
            }
            onClose();
        } catch (error) {
            console.error('Failed to save inventory item:', error);
            alert('Lỗi: ' + (error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">{initialData ? 'Cập nhật hàng hóa' : 'Thêm hàng hóa mới'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                         <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Mã hàng hóa</label>
                            <input 
                                disabled
                                type="text" 
                                className="flex-1 px-3 py-2 border border-gray-200 rounded bg-gray-100 text-gray-500 text-sm"
                                value={initialData ? initialData.code : 'Mã tự động'}
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Tên hàng hóa <span className="text-red-500">*</span></label>
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
                            <label className="w-32 text-sm font-bold text-gray-700">Nhóm hàng</label>
                            <input 
                                type="text" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                placeholder="Thực phẩm tươi, khô..."
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Đơn vị tính</label>
                            <input 
                                type="text" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                placeholder="kg, lít, chai..."
                                value={formData.unit}
                                onChange={e => setFormData({...formData, unit: e.target.value})}
                            />
                        </div>

                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Giá vốn</label>
                            <input 
                                type="number" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                value={formData.price}
                                onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1 flex items-center">
                                <label className="w-32 text-sm font-bold text-gray-700">Tồn kho</label>
                                <input 
                                    disabled={!!initialData}
                                    type="number" 
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm disabled:bg-gray-100"
                                    value={formData.quantity}
                                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                                />
                            </div>
                            <div className="flex-1 flex items-center">
                                <label className="w-20 text-sm font-bold text-gray-700 text-right pr-2">Tối thiểu</label>
                                <input 
                                    type="number" 
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.minStock}
                                    onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                                />
                            </div>
                        </div>

                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500 text-white font-bold rounded hover:bg-gray-600" disabled={isSubmitting}>Hủy bỏ</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center disabled:opacity-50" disabled={isSubmitting}>
                            <Save size={16} className="mr-2"/> {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};