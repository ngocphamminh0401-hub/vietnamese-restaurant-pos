import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { usePOS } from '../../context/POSContext';

interface AddImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ImportItem {
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
}

export const AddImportModal: React.FC<AddImportModalProps> = ({ isOpen, onClose }) => {
    const { suppliers, inventoryItems, addInventoryTransaction } = usePOS();
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [items, setItems] = useState<ImportItem[]>([]);
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(0);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const addItem = () => {
        if (!selectedItem || quantity <= 0 || price <= 0) {
            alert('Vui lòng chọn hàng hóa và nhập số lượng, giá hợp lệ');
            return;
        }
        const item = inventoryItems.find(i => i.id === selectedItem);
        if (!item) return;

        setItems([...items, {
            itemId: item.id,
            itemName: item.name,
            quantity,
            price
        }]);
        setSelectedItem('');
        setQuantity(1);
        setPrice(0);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const handleSubmit = async () => {
        if (!selectedSupplier) {
            alert('Vui lòng chọn nhà cung cấp');
            return;
        }
        if (items.length === 0) {
            alert('Vui lòng thêm ít nhất 1 hàng hóa');
            return;
        }

        setIsSubmitting(true);
        try {
            const supplier = suppliers.find(s => s.id === selectedSupplier);
            await addInventoryTransaction({
                type: 'IMPORT',
                supplierId: selectedSupplier,
                supplierName: supplier?.name || '',
                items,
                totalAmount,
                note,
                createdBy: 'Admin'
            });
            alert('Tạo phiếu nhập hàng thành công!');
            onClose();
        } catch (error) {
            console.error('Failed to create import:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800">Phiếu nhập hàng</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nhà cung cấp *</label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                        >
                            <option value="">-- Chọn nhà cung cấp --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                            ))}
                        </select>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-700 mb-3">Thêm hàng hóa</h4>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Hàng hóa</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedItem}
                                    onChange={(e) => {
                                        setSelectedItem(e.target.value);
                                        const item = inventoryItems.find(i => i.id === e.target.value);
                                        if (item) setPrice(item.price || 0);
                                    }}
                                >
                                    <option value="">-- Chọn hàng hóa --</option>
                                    {inventoryItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.unit}) - Tồn: {item.quantity}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Số lượng</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    min="1"
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Đơn giá</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    min="0"
                                />
                            </div>
                            <div className="col-span-2 flex items-end">
                                <button 
                                    type="button"
                                    onClick={addItem}
                                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                                >
                                    <Plus size={16} className="mr-1"/> Thêm
                                </button>
                            </div>
                        </div>
                    </div>

                    {items.length > 0 && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Hàng hóa</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Số lượng</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Đơn giá</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Thành tiền</th>
                                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={index} className="border-t border-gray-100">
                                            <td className="px-4 py-3 text-sm">{item.itemName}</td>
                                            <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                                            <td className="px-4 py-3 text-sm text-right">{item.price.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold">{(item.quantity * item.price).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button 
                                                    onClick={() => removeItem(index)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-50 font-bold">
                                        <td colSpan={3} className="px-4 py-3 text-right text-sm">TỔNG CỘNG:</td>
                                        <td className="px-4 py-3 text-right text-blue-600">{totalAmount.toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                        <textarea 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            rows={3}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Nhập ghi chú..."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-2 bg-gray-500 text-white font-bold rounded hover:bg-gray-600"
                        disabled={isSubmitting}
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 flex items-center disabled:opacity-50"
                        disabled={isSubmitting}
                    >
                        <Save size={16} className="mr-2"/> {isSubmitting ? 'Đang lưu...' : 'Lưu phiếu nhập'}
                    </button>
                </div>
            </div>
        </div>
    );
};
