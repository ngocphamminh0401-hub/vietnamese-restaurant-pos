import React from 'react';
import { X, Package, Calendar, User, FileText } from 'lucide-react';

interface ImportDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: any;
}

export const ImportDetailModal: React.FC<ImportDetailModalProps> = ({ isOpen, onClose, transaction }) => {
    if (!isOpen || !transaction) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="h-8 w-8" />
                        <div>
                            <h2 className="text-2xl font-bold">Chi tiết phiếu nhập</h2>
                            <p className="text-blue-100 text-sm">Mã phiếu: {transaction.code}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Transaction Info */}
                    <div className="grid grid-cols-2 gap-6 mb-6 bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Nhà cung cấp</p>
                                <p className="font-semibold text-gray-800">{transaction.supplierName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Ngày nhập</p>
                                <p className="font-semibold text-gray-800">
                                    {new Date(transaction.createdAt).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <User className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Người tạo</p>
                                <p className="font-semibold text-gray-800">{transaction.createdBy}</p>
                            </div>
                        </div>
                        {transaction.note && (
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-100 p-3 rounded-lg">
                                    <FileText className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Ghi chú</p>
                                    <p className="font-semibold text-gray-800">{transaction.note}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">STT</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tên hàng hóa</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Đơn vị</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Số lượng</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Đơn giá</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transaction.items && transaction.items.map((item: any, index: number) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-700">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-gray-800">{item.itemName}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-600">{item.unit}</td>
                                        <td className="px-4 py-3 text-right text-gray-800 font-medium">
                                            {item.quantity.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">
                                            {item.price.toLocaleString()} ₫
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-blue-600">
                                            {item.subtotal.toLocaleString()} ₫
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                <tr>
                                    <td colSpan={5} className="px-4 py-4 text-right font-bold text-gray-700 text-lg">
                                        Tổng cộng:
                                    </td>
                                    <td className="px-4 py-4 text-right font-bold text-blue-600 text-xl">
                                        {transaction.totalAmount.toLocaleString()} ₫
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
