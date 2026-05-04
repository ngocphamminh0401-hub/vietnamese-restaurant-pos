
import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Building2, Save } from 'lucide-react';
import { Customer } from '../../types';

interface AddCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Omit<Customer, 'id' | 'code'>) => void;
    initialData?: { name?: string; phone?: string };
    editingCustomer?: Customer | null;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onSave, initialData, editingCustomer }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        type: 'PERSONAL' as 'PERSONAL' | 'COMPANY'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset or Pre-fill when modal opens
    useEffect(() => {
        if (isOpen) {
            if (editingCustomer) {
                // Edit mode: populate with customer data
                setFormData({
                    name: editingCustomer.name,
                    phone: editingCustomer.phone,
                    address: editingCustomer.address || '',
                    type: editingCustomer.type
                });
            } else {
                // Add mode: use initial data or empty
                setFormData({
                    name: initialData?.name || '',
                    phone: initialData?.phone || '',
                    address: '',
                    type: 'PERSONAL'
                });
            }
        }
    }, [isOpen, initialData, editingCustomer]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
            // Reset and close
            setFormData({ name: '', phone: '', address: '', type: 'PERSONAL' });
            onClose();
        } catch (error) {
            console.error('Failed to save customer:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // Changed z-50 to z-[60] to ensure it appears above the Reservation Modal (which is z-50)
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">
                        {editingCustomer ? 'Cập nhật Khách hàng' : 'Thêm mới Khách hàng'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        {/* Customer Type */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Loại khách hàng</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center transition ${formData.type === 'PERSONAL' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="ctype" 
                                        className="hidden" 
                                        checked={formData.type === 'PERSONAL'} 
                                        onChange={() => setFormData({...formData, type: 'PERSONAL'})}
                                    />
                                    <User size={18} className="mr-2"/> Cá nhân
                                </label>
                                <label className={`flex-1 cursor-pointer border rounded-lg p-3 flex items-center justify-center transition ${formData.type === 'COMPANY' ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold' : 'border-gray-200 hover:bg-gray-50'}`}>
                                    <input 
                                        type="radio" 
                                        name="ctype" 
                                        className="hidden" 
                                        checked={formData.type === 'COMPANY'} 
                                        onChange={() => setFormData({...formData, type: 'COMPANY'})}
                                    />
                                    <Building2 size={18} className="mr-2"/> Công ty
                                </label>
                            </div>
                        </div>

                        {/* Code (Auto) */}
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Mã khách hàng</label>
                            <input 
                                disabled 
                                type="text" 
                                value="Mã tự động" 
                                className="flex-1 px-3 py-2 border border-gray-200 rounded bg-gray-100 text-gray-500 text-sm font-medium cursor-not-allowed"
                            />
                        </div>

                        {/* Name */}
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Tên khách hàng <span className="text-red-500">*</span></label>
                            <div className="flex-1 relative">
                                <input 
                                    required
                                    autoFocus
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Nhập tên khách hàng"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                                <User size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Điện thoại <span className="text-red-500">*</span></label>
                            <div className="flex-1 relative">
                                <input 
                                    required
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Nhập số điện thoại"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                />
                                <Phone size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Địa chỉ</label>
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Nhập địa chỉ"
                                    value={formData.address}
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                                <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400"/>
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
