import React, { useState } from 'react';
import { X, User, Phone, MapPin, CreditCard, Calendar, Briefcase, Save } from 'lucide-react';
import { Staff } from '../../../types';

interface AddStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (staff: Omit<Staff, 'id' | 'code' | 'status'>) => void;
    initialData?: Staff;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        role: (initialData?.role || 'WAITER') as Staff['role'],
        department: initialData?.department || 'Bàn',
        cccd: initialData?.cccd || '',
        gender: (initialData?.gender || 'MALE') as Staff['gender'],
        startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        address: initialData?.address || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
            // Reset and close only after successful save
            setFormData({ name: '', phone: '', role: 'WAITER', department: 'Bàn', cccd: '', gender: 'MALE', startDate: new Date().toISOString().slice(0, 10), address: '' });
            onClose();
        } catch (error) {
            console.error('Failed to save staff:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">{initialData ? 'Cập nhật Nhân viên' : 'Thêm mới Nhân viên'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 grid grid-cols-2 gap-6">
                        {/* Column 1 */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Mã nhân viên</label>
                                <input disabled type="text" value="Mã tự động" className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-100 text-gray-500 text-sm font-medium cursor-not-allowed"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Tên nhân viên <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input required autoFocus type="text" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm" placeholder="Nhập tên nhân viên"
                                        value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    />
                                    <User size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input required type="text" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm" placeholder="Nhập SĐT"
                                        value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                    <Phone size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Số CCCD/CMND <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input required type="text" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm" placeholder="Nhập CCCD"
                                        value={formData.cccd} onChange={(e) => setFormData({...formData, cccd: e.target.value})}
                                    />
                                    <CreditCard size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Giới tính</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center cursor-pointer text-sm"><input type="radio" name="gender" className="mr-2" checked={formData.gender === 'MALE'} onChange={() => setFormData({...formData, gender: 'MALE'})}/> Nam</label>
                                    <label className="flex items-center cursor-pointer text-sm"><input type="radio" name="gender" className="mr-2" checked={formData.gender === 'FEMALE'} onChange={() => setFormData({...formData, gender: 'FEMALE'})}/> Nữ</label>
                                    <label className="flex items-center cursor-pointer text-sm"><input type="radio" name="gender" className="mr-2" checked={formData.gender === 'OTHER'} onChange={() => setFormData({...formData, gender: 'OTHER'})}/> Khác</label>
                                </div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-4">
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Chức danh</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                    value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                                >
                                    <option value="MANAGER">Quản lý</option>
                                    <option value="CASHIER">Thu ngân</option>
                                    <option value="WAITER">Phục vụ</option>
                                    <option value="CHEF">Đầu bếp</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Phòng ban</label>
                                <div className="relative">
                                     <input type="text" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm" placeholder="Nhập phòng ban"
                                        value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    />
                                    <Briefcase size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Ngày vào làm</label>
                                <div className="relative">
                                    <input type="date" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                        value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                    />
                                    <Calendar size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Địa chỉ</label>
                                <div className="relative">
                                    <input type="text" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm" placeholder="Nhập địa chỉ"
                                        value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                    <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2 bg-gray-500 text-white font-bold rounded hover:bg-gray-600 disabled:opacity-50">Hủy bỏ</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                            <Save size={16} className="mr-2"/> {isSubmitting ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};