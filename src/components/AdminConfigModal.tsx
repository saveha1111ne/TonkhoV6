import React, { useState } from 'react';
import { UserCheck, Plus, Trash2, Shield, X, CheckCircle2 } from 'lucide-react';
import { DEFAULT_ADMIN_EMAILS } from '../config/adminConfig';

interface AdminConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAdmins: string[];
  onAddAdmin: (email: string) => void;
  onRemoveAdmin: (email: string) => void;
  currentUserEmail?: string;
}

export const AdminConfigModal: React.FC<AdminConfigModalProps> = ({
  isOpen,
  onClose,
  customAdmins,
  onAddAdmin,
  onRemoveAdmin,
  currentUserEmail,
}) => {
  const [newEmail, setNewEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ!');
      return;
    }

    if (DEFAULT_ADMIN_EMAILS.includes(email) || customAdmins.includes(email)) {
      setErrorMsg('Email này đã tồn tại trong danh sách Quản trị viên!');
      return;
    }

    onAddAdmin(email);
    setNewEmail('');
    setErrorMsg('');
    setSuccessMsg(`Đã thêm thành công: ${email}`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
                Phân Quyền RBAC
              </span>
              <h2 className="text-xl font-black mt-0.5">Danh Sách Quản Trị Viên (Admin)</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <p className="text-slate-600 text-xs">
            Các tài khoản email dưới đây được cấp toàn quyền thao tác trên hệ thống: Lập phiếu, Sửa, Xóa, Kết chuyển tháng, và Xuất / Nhập file Excel.
          </p>

          {/* Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-semibold text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Add form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="email"
              placeholder="Nhập email nhân sự mới (ví dụ: staff@cic.com)..."
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            <button
              type="submit"
              className="flex items-center gap-1 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Admin</span>
            </button>
          </form>

          {/* Admin List */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {/* Default System Admins */}
            {DEFAULT_ADMIN_EMAILS.map((email) => (
              <div key={email} className="p-3 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">{email}</span>
                  {email === currentUserEmail && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Bạn (Hiện tại)
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-semibold italic">Hệ thống mặc định</span>
              </div>
            ))}

            {/* Custom Added Admins */}
            {customAdmins.map((email) => (
              <div key={email} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{email}</span>
                  {email === currentUserEmail && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Bạn
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveAdmin(email)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Xóa quyền Admin"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
            >
              HOÀN TẤT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
