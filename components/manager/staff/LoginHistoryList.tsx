
import React, { useState, useEffect } from 'react';
import { Clock, User, LogIn, LogOut, Search, RefreshCw } from 'lucide-react';
import { LoginHistory } from '../../../types';

export const LoginHistoryList: React.FC = () => {
    const [history, setHistory] = useState<LoginHistory[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/history');
            if (res.ok) {
                const data = await res.json();
                setHistory(data);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filteredHistory = history.filter(h => 
        h.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        h.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-full bg-white flex-col rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex gap-4 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Tìm nhân viên..." 
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button 
                    onClick={fetchHistory}
                    disabled={loading}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 border-b border-slate-100">Nhân viên</th>
                            <th className="px-6 py-4 border-b border-slate-100">Hành động</th>
                            <th className="px-6 py-4 border-b border-slate-100">Thời gian</th>
                            <th className="px-6 py-4 border-b border-slate-100">Địa chỉ IP</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mr-3">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{item.displayName}</div>
                                            <div className="text-[10px] text-slate-400">@{item.username}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {item.action === 'LOGIN' ? (
                                        <span className="flex items-center text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-full w-fit">
                                            <LogIn size={12} className="mr-1"/> Đăng nhập
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-slate-500 font-bold text-xs bg-slate-100 px-2 py-1 rounded-full w-fit">
                                            <LogOut size={12} className="mr-1"/> Đăng xuất
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">
                                    <div className="flex items-center">
                                        <Clock size={14} className="mr-2 text-slate-400" />
                                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                                    { (item as any).ipAddress || '127.0.0.1' }
                                </td>
                            </tr>
                        ))}
                        {filteredHistory.length === 0 && (
                            <tr>
                                <td colSpan={4} className="py-20 text-center text-slate-400">Không có dữ liệu lịch sử nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
