import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { Area } from '../../types';
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { AddAreaModal } from './AddAreaModal';

export const AreaManager: React.FC = () => {
    const { areas, addArea, updateArea, deleteArea } = usePOS();
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);

    const handleSaveArea = async (areaData: any) => {
        try {
            if (editingArea) {
                await updateArea(editingArea.id, areaData);
            } else {
                await addArea(areaData);
            }
            setShowAddModal(false);
            setEditingArea(null);
        } catch (error) {
            console.error('Failed to save area:', error);
            alert('Không thể lưu khu vực. Vui lòng thử lại.');
        }
    };

    const handleEditArea = (area: Area) => {
        setEditingArea(area);
        setShowAddModal(true);
    };

    const handleDeleteArea = async (areaId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa khu vực này?')) {
            try {
                await deleteArea(areaId);
            } catch (error: any) {
                alert(error.message || 'Không thể xóa khu vực. Khu vực có thể đang được sử dụng.');
            }
        }
    };

    const handleCloseModal = () => {
        setShowAddModal(false);
        setEditingArea(null);
    };

    return (
        <div className="flex h-full bg-white flex-col">
            <div className="flex flex-1 overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white shrink-0">
                        <h3 className="font-bold text-xl text-gray-800">Quản lý Khu vực</h3>
                        <button 
                            onClick={() => setShowAddModal(true)} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center shadow-sm transition"
                        >
                            <Plus size={16} className="mr-1"/> Thêm khu vực
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {areas.map(area => (
                                <div 
                                    key={area.id} 
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition bg-white"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <MapPin size={20} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{area.name}</h4>
                                                <p className="text-xs text-gray-500">Mã: {area.code}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditArea(area)}
                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                                                title="Sửa"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteArea(area.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                                                title="Xóa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Thứ tự:</span>
                                            <span className="font-medium">{area.sortOrder}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Trạng thái:</span>
                                            {area.isActive ? (
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                                                    Hoạt động
                                                </span>
                                            ) : (
                                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-xs font-bold">
                                                    Ngừng
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {areas.length === 0 && (
                                <div className="col-span-full p-8 text-center text-gray-400">
                                    Chưa có khu vực nào. Nhấn "Thêm khu vực" để bắt đầu.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AddAreaModal 
                isOpen={showAddModal} 
                onClose={handleCloseModal} 
                onSave={handleSaveArea}
                initialData={editingArea}
            />
        </div>
    );
};
