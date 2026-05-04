
import { useState, FormEvent, ChangeEvent } from 'react';
import { X, Save, FolderPlus } from 'lucide-react';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

export const AddCategoryModal = ({ isOpen, onClose, onSave }: AddCategoryModalProps) => {
    const [name, setName] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (name.trim()) {
            onSave(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">Thêm nhóm món mới</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tên nhóm món <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input 
                                    required
                                    autoFocus
                                    type="text" 
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                    value={name}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                    placeholder="Ví dụ: Đồ uống, Khai vị..."
                                />
                                <FolderPlus size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                            </div>
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
