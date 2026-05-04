import React, { useState } from 'react';
import { usePOS } from '../../../context/POSContext';
import { Search, Plus, UserCircle, Briefcase, Phone, MoreHorizontal, X } from 'lucide-react';
import { AddStaffModal } from './AddStaffModal';

export const StaffListManager: React.FC = () => {
    const { staff, addStaff } = usePOS();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStaff = staff.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );

    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'MANAGER': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Quản lý</span>;
            case 'CASHIER': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Thu ngân</span>;
            case 'CHEF': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold">Đầu bếp</span>;
            case 'WAITER': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">Phục vụ</span>;
            default: return null;
        }
    };

    return (
        <div className="flex h-full bg-white flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-xl text-gray-800">Danh sách Nhân viên</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm nhân viên..." 
                            className="w-64 pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition"
                >
                    <Plus size={16} className="mr-1"/> Thêm nhân viên
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStaff.map(s => (
                        <div key={s.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden">
                            <div className="p-5 flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                        <UserCircle size={32}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{s.name}</h4>
                                        <div className="text-xs text-gray-500 font-medium">{s.code}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => { setSelectedStaff(s); setShowDetailModal(true); }}
                                        className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition"
                                        title="Xem chi tiết"
                                    >
                                        <UserCircle size={18}/>
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedStaff(s); setShowEditModal(true); }}
                                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition"
                                        title="Sửa"
                                    >
                                        <MoreHorizontal size={18}/>
                                    </button>
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-gray-100 space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center"><Briefcase size={14} className="mr-2"/> Chức danh</span>
                                    {getRoleBadge(s.role)}
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500 flex items-center"><Phone size={14} className="mr-2"/> Điện thoại</span>
                                    <span className="font-medium text-gray-700">{s.phone}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Phòng ban</span>
                                    <span className="font-medium text-gray-700">{s.department}</span>
                                </div>
                            </div>
                             <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <span className={`text-xs font-bold flex items-center ${s.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                                    <div className={`w-2 h-2 rounded-full mr-2 ${s.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    {s.status === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ'}
                                </span>
                                <button 
                                    onClick={() => { setSelectedStaff(s); setShowDetailModal(true); }}
                                    className="text-blue-600 text-xs font-bold hover:underline"
                                >
                                    Chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AddStaffModal 
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSave={addStaff}
            />
            
            {/* Modal Sửa Nhân Viên */}
            {showEditModal && selectedStaff && (
                <AddStaffModal 
                    isOpen={showEditModal}
                    onClose={() => { setShowEditModal(false); setSelectedStaff(null); }}
                    onSave={addStaff}
                    initialData={selectedStaff}
                />
            )}
            
            {/* Modal Xem Chi Tiết */}
            {showDetailModal && selectedStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-white flex items-center">
                                <UserCircle size={24} className="mr-2" />
                                Thông tin chi tiết nhân viên
                            </h3>
                            <button onClick={() => { setShowDetailModal(false); setSelectedStaff(null); }} className="text-white hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-6 pb-6 border-b">
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                    {selectedStaff.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-2xl font-bold text-gray-900">{selectedStaff.name}</h4>
                                    <p className="text-gray-500 font-medium">{selectedStaff.code}</p>
                                    {getRoleBadge(selectedStaff.role)}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Số điện thoại</div>
                                    <div className="font-bold text-gray-900">{selectedStaff.phone}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Phòng ban</div>
                                    <div className="font-bold text-gray-900">{selectedStaff.department}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">CCCD</div>
                                    <div className="font-bold text-gray-900">{selectedStaff.cccd}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Giới tính</div>
                                    <div className="font-bold text-gray-900">
                                        {selectedStaff.gender === 'MALE' ? 'Nam' : selectedStaff.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Địa chỉ</div>
                                    <div className="font-bold text-gray-900">{selectedStaff.address}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Ngày vào làm</div>
                                    <div className="font-bold text-gray-900">{new Date(selectedStaff.startDate).toLocaleDateString('vi-VN')}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-xs text-gray-500 uppercase font-bold mb-1">Trạng thái</div>
                                    <div className={`font-bold ${selectedStaff.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedStaff.status === 'ACTIVE' ? 'Đang làm việc' : 'Đã nghỉ'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={() => { setShowDetailModal(false); setSelectedStaff(null); }}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition"
                            >
                                Đóng
                            </button>
                            <button 
                                onClick={() => { setShowDetailModal(false); setShowEditModal(true); }}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition"
                            >
                                Sửa thông tin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};