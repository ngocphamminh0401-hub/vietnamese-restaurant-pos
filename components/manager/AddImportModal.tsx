import React, { useState } from 'react';
import { X, Plus, Trash2, Save, Package } from 'lucide-react';
import { usePOS } from '../../context/POSContext';

interface AddImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ImportItem {
    itemId: string;
    itemName: string;
    unit: string;
    quantity: number;
    price: number;
}

export const AddImportModal: React.FC<AddImportModalProps> = ({ isOpen, onClose }) => {
    const { suppliers, inventoryItems, addInventoryTransaction } = usePOS();
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [items, setItems] = useState<ImportItem[]>([]);
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(0);
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
            unit: item.unit,
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
                items: items.map(({ itemId, itemName, unit, quantity, price }) => ({ itemId, itemName, unit, quantity, price })),
                totalAmount,
                note,
                createdBy: 'Admin'
            });
            
            // Reset form
            setSelectedSupplier('');
            setItems([]);
            setNote('');
            alert('Tạo phiếu nhập hàng thành công!');
            onClose();
        } catch (error: any) {
            alert(error.message || 'Có lỗi xảy ra khi tạo phiếu nhập');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-blue-50">
                    <div className="flex items-center gap-2">
                        <Package size={24} className="text-blue-600"/>
                        <h3 className="font-bold text-lg text-gray-800">Phiếu nhập hàng</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Supplier Selection */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nhà cung cấp *</label>
                        <select 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                            disabled={isSubmitting}
                        >
                            <option value="">-- Chọn nhà cung cấp --</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name} - {s.phone}</option>
                            ))}
                        </select>
                    </div>

                    {/* Add Item Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Plus size={18} className="text-green-600"/>
                            Thêm hàng hóa
                        </h4>
                        <div className="grid grid-cols-12 gap-3">
                            <div className="col-span-5">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Hàng hóa</label>
                                <select 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={selectedItem}
                                    onChange={(e) => {
                                        setSelectedItem(e.target.value);
                                        const item = inventoryItems.find(i => i.id === e.target.value);
                                        if (item) setPrice(item.price || 0);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <option value="">-- Chọn hàng hóa --</option>
                                    {inventoryItems.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Số lượng</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    min="0"
                                    step="0.01"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="col-span-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Đơn giá</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    min="0"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="col-span-2 flex items-end">
                                <button 
                                    onClick={addItem}
                                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    <Plus size={16} className="inline mr-1"/> Thêm
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div>
                        <h4 className="font-bold text-gray-700 mb-3">Danh sách hàng hóa nhập</h4>
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed">
                                <Package size={48} className="mx-auto mb-2 opacity-30"/>
                                <p>Chưa có hàng hóa nào. Vui lòng thêm hàng hóa bên trên.</p>
                            </div>
                        ) : (
                            <div className="border border-gray-300 rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">STT</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên hàng hóa</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">ĐVT</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Số lượng</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Đơn giá</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">Thành tiền</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {items.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.itemName}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.unit}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-800">{item.quantity.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-800">{item.price.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-blue-600">
                                                    {(item.quantity * item.price).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button 
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                                                        disabled={isSubmitting}
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                                        <tr>
                                            <td colSpan={5} className="px-4 py-3 text-right font-bold text-gray-800 uppercase">
                                                Tổng cộng:
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">
                                                {totalAmount.toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                        <textarea 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            rows={3}
                            placeholder="Nhập ghi chú (không bắt buộc)..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isSubmitting}
                        ></textarea>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Tổng số mặt hàng: <span className="font-bold">{items.length}</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleSubmit}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                            disabled={isSubmitting || items.length === 0}
                        >
                            <Save size={16}/> {isSubmitting ? 'Đang lưu...' : 'Lưu phiếu nhập'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
