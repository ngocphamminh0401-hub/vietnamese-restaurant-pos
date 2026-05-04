import React, { useState, useEffect } from 'react';
import { X, MapPin, DollarSign } from 'lucide-react';
import { Area } from '../../types';

// Modal component for adding/editing area
interface AddAreaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (areaData: {
        code: string;
        name: string;
        sortOrder: number;
        isActive: boolean;
    }) => void;
    initialData?: Area | null;
}

export const AddAreaModal: React.FC<AddAreaModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        sortOrder: 1,
        isActive: true
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                code: initialData.code,
                name: initialData.name,
                sortOrder: initialData.sortOrder,
                isActive: initialData.isActive
            });
        } else {
            setFormData({ code: '', name: '', sortOrder: 1, isActive: true });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code.trim() || !formData.name.trim()) {
            alert('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        onSave(formData);
        setFormData({ code: '', name: '', sortOrder: 1, isActive: true });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">
                        {initialData ? 'Cập nhật Khu vực' : 'Thêm Khu vực'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20}/>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">
                                Mã khu vực <span className="text-red-500">*</span>
                            </label>
                            <input 
                                required 
                                type="text" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                value={formData.code}
                                onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                placeholder="VD: TANG_1, VIP"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">
                                Tên khu vực <span className="text-red-500">*</span>
                            </label>
                            <div className="flex-1 relative">
                                <input 
                                    required 
                                    type="text" 
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="VD: Tầng 1, Tầng 2, VIP"
                                />
                                <MapPin size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Số thứ tự</label>
                            <input 
                                type="number" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-right"
                                value={formData.sortOrder}
                                onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Trạng thái</label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                                />
                                <span className="text-sm text-gray-700">Đang hoạt động</span>
                            </label>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow-sm hover:bg-green-700 flex items-center"
                        >
                            <div className="bg-white/20 p-0.5 rounded mr-2">
                                <DollarSign size={12} className="text-white"/>
                            </div> 
                            Lưu
                        </button>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-6 py-2 bg-gray-500 text-white font-bold rounded shadow-sm hover:bg-gray-600 flex items-center"
                        >
                            <div className="bg-white/20 p-0.5 rounded mr-2">
                                <X size={12} className="text-white"/>
                            </div> 
                            Bỏ qua
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
