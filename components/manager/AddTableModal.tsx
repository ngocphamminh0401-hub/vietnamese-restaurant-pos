import React, { useState } from 'react';
import { X, DollarSign, PenLine } from 'lucide-react';
import { Area } from '../../types';

interface AddTableModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tableData: {
        name: string;
        areaId: string;
        capacity: number;
        note: string;
        sortOrder: number;
    }) => void;
    areas: Area[];
}

export const AddTableModal: React.FC<AddTableModalProps> = ({ isOpen, onClose, onSave, areas }) => {
    const [newTable, setNewTable] = useState({
        name: '',
        areaId: '',
        sortOrder: 1,
        capacity: 4,
        note: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTable.areaId) {
            alert('Vui lòng chọn khu vực');
            return;
        }
        onSave({
            name: newTable.name,
            areaId: newTable.areaId,
            capacity: newTable.capacity,
            note: newTable.note,
            sortOrder: newTable.sortOrder,
        });
        // Reset form
        setNewTable({ name: '', areaId: '', sortOrder: 1, capacity: 4, note: '' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">Thêm phòng/bàn</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Tên phòng bàn <span className="text-red-500">*</span></label>
                            <input 
                                required 
                                type="text" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                value={newTable.name}
                                onChange={(e) => setNewTable({...newTable, name: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Khu vực</label>
                            <div className="flex-1 flex items-center gap-2">
                                <select 
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                    value={newTable.areaId}
                                    onChange={(e) => setNewTable({...newTable, areaId: e.target.value})}
                                >
                                    <option value="">--Lựa chọn--</option>
                                    {areas.filter(a => a.isActive).map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Số thứ tự</label>
                            <input 
                                type="number" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-right"
                                value={newTable.sortOrder}
                                onChange={(e) => setNewTable({...newTable, sortOrder: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Số ghế</label>
                            <input 
                                type="number" 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                value={newTable.capacity}
                                onChange={(e) => setNewTable({...newTable, capacity: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 text-sm font-bold text-gray-700">Ghi chú</label>
                            <div className="flex-1 relative">
                                <input 
                                    type="text" 
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={newTable.note}
                                    onChange={(e) => setNewTable({...newTable, note: e.target.value})}
                                />
                                <PenLine size={14} className="absolute left-2.5 top-2.5 text-gray-400"/>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                        <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded shadow-sm hover:bg-green-700 flex items-center">
                            <div className="bg-white/20 p-0.5 rounded mr-2"><DollarSign size={12} className="text-white"/></div> Lưu
                        </button>
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-500 text-white font-bold rounded shadow-sm hover:bg-gray-600 flex items-center">
                            <div className="bg-white/20 p-0.5 rounded mr-2"><X size={12} className="text-white"/></div> Bỏ qua
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};