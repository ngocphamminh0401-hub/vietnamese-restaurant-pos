
import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { UserAccount, UserRole } from '../../types';
import { Search, Plus, Shield, Edit2, Trash2, Key, Filter, CheckCircle, XCircle, X } from 'lucide-react';

export const AccountManager: React.FC = () => {
  const { staff } = usePOS();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);
  const [showStaffSuggestions, setShowStaffSuggestions] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    displayName: '',
    role: UserRole.WAITER,
    isActive: true
  });

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = (acc: UserAccount | null = null) => {
    if (acc) {
      setEditingAccount(acc);
      setFormData({
        username: acc.username,
        password: '', 
        displayName: acc.displayName,
        role: acc.role,
        isActive: acc.isActive
      });
    } else {
      setEditingAccount(null);
      setFormData({
        username: '',
        password: '',
        displayName: '',
        role: UserRole.WAITER,
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingAccount ? `/api/users/update/${editingAccount.id}` : '/api/users/create';
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchAccounts();
        setShowModal(false);
      } else {
        const err = await res.json();
        alert(err.error || "Lỗi khi lưu tài khoản.");
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    if (id === 'admin') {
      alert("Không thể xóa tài khoản Admin mặc định.");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
    try {
      const res = await fetch(`/api/users/delete/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAccounts();
    } catch (e) { console.error(e); }
  };

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          acc.displayName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || acc.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-full flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header & Filters */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center flex-1 min-w-[300px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm tên đăng nhập hoặc tên hiển thị..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative w-48">
            <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <select 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">Tất cả quyền</option>
              <option value={UserRole.ADMIN}>Quản trị (Admin)</option>
              <option value={UserRole.WAITER}>Phục vụ (Waiter)</option>
              <option value={UserRole.CHEF}>Đầu bếp (Chef)</option>
              <option value={UserRole.CASHIER}>Thu ngân (Cashier)</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center shadow-md transition-all active:scale-95"
        >
          <Plus size={18} className="mr-2"/> Thêm tài khoản
        </button>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 border-b border-slate-100">Người dùng</th>
              <th className="px-6 py-4 border-b border-slate-100">Quyền hạn</th>
              <th className="px-6 py-4 border-b border-slate-100">Ngày tạo</th>
              <th className="px-6 py-4 border-b border-slate-100 text-center">Trạng thái</th>
              <th className="px-6 py-4 border-b border-slate-100 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAccounts.map(acc => (
              <tr key={acc.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold mr-3 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {acc.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{acc.displayName}</div>
                      <div className="text-xs text-slate-400">@{acc.username}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border
                    ${acc.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      acc.role === UserRole.WAITER ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      acc.role === UserRole.CHEF ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      'bg-emerald-50 text-emerald-700 border-emerald-100'}
                  `}>
                    {acc.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500 italic text-xs">
                  {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('vi-VN') : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    {acc.isActive ? (
                      <CheckCircle size={18} className="text-emerald-500" />
                    ) : (
                      <XCircle size={18} className="text-rose-400" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(acc)}
                      className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                      title="Sửa tài khoản"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                      title="Xóa tài khoản"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredAccounts.length === 0 && (
              <tr>
                <td colSpan={5} className="py-20 text-center text-slate-400">Không tìm thấy tài khoản nào phù hợp.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal CRUD Account */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center">
                <Shield size={18} className="mr-2 text-indigo-600" />
                {editingAccount ? 'Cập nhật tài khoản' : 'Thêm tài khoản mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tên hiển thị (Tên nhân viên)</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    value={formData.displayName}
                    onChange={(e) => {
                      setFormData({...formData, displayName: e.target.value});
                      setShowStaffSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowStaffSuggestions(formData.displayName.length > 0)}
                    onBlur={() => setTimeout(() => setShowStaffSuggestions(false), 200)}
                    placeholder="VD: Nguyễn Văn A"
                    autoComplete="off"
                  />
                  {showStaffSuggestions && formData.displayName && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {staff
                        .filter(s => s.name.toLowerCase().includes(formData.displayName.toLowerCase()))
                        .slice(0, 5)
                        .map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({...formData, displayName: s.name});
                              setShowStaffSuggestions(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between text-sm"
                          >
                            <span className="font-medium text-slate-700">{s.name}</span>
                            <span className="text-xs text-slate-400">{s.code}</span>
                          </button>
                        ))}
                      {staff.filter(s => s.name.toLowerCase().includes(formData.displayName.toLowerCase())).length === 0 && (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">Không tìm thấy nhân viên</div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Tên đăng nhập (Username)</label>
                  <input 
                    required
                    disabled={!!editingAccount}
                    type="text" 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="VD: van_a"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">
                    {editingAccount ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu'}
                  </label>
                  <div className="relative">
                    <Key size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input 
                      required={!editingAccount}
                      type="password" 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Quyền hạn</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    >
                      <option value={UserRole.ADMIN}>Quản trị (Admin)</option>
                      <option value={UserRole.WAITER}>Phục vụ (Waiter)</option>
                      <option value={UserRole.CHEF}>Đầu bếp (Chef)</option>
                      <option value={UserRole.CASHIER}>Thu ngân (Cashier)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Trạng thái</label>
                    <div className="flex items-center h-[44px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.isActive}
                          onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-3 text-sm font-medium text-slate-700">{formData.isActive ? 'Kích hoạt' : 'Khóa'}</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98]"
                >
                  HỦY BỎ
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                >
                  {editingAccount ? 'CẬP NHẬT' : 'TẠO TÀI KHOẢN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
