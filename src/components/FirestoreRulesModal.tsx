import React, { useState } from 'react';
import { ShieldCheck, Lock, Copy, Check, X } from 'lucide-react';
import { DEFAULT_ADMIN_EMAILS } from '../config/adminConfig';

interface FirestoreRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAdmins: string[];
}

export const FirestoreRulesModal: React.FC<FirestoreRulesModalProps> = ({
  isOpen,
  onClose,
  customAdmins,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const allAdmins = [...DEFAULT_ADMIN_EMAILS, ...customAdmins];

  const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Chặn toàn bộ truy cập mặc định (Default Deny)
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    // 2. Kiểm tra quyền Quản trị viên (Admin)
    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email in [
          '${allAdmins.join("',\n          '")}'
        ] ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }

    // 3. Phân quyền: Mọi người đều XEM được (Read-only), chỉ Admin mới được GHI/SỬA/XÓA
    match /transactions/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /items/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /branches/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /monthlyBalances/{id} {
      allow read: if true;
      allow create, update, delete: if isAdmin();
    }

    match /config/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(rulesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
                Bảo Mật Cơ Sở Dữ Liệu
              </span>
              <h2 className="text-xl font-black mt-0.5">Cấu Hình Bảo Mật Firestore Rules (RBAC)</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs sm:text-sm flex-1">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-blue-950">
              <Lock className="w-4 h-4 text-blue-700" /> Cơ chế bảo mật đa tầng (Client + Cloud Firestore):
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 font-medium">
              <li>
                <strong>Tại Client (Giao diện):</strong> Người dùng chưa đăng nhập hoặc đăng nhập bằng tài khoản không có trong danh sách Quản trị viên chỉ có quyền <em>XEM (Read-only)</em>. Toàn bộ nút Thêm / Sửa / Xóa / Kết chuyển sẽ bị ẩn hoặc vô hiệu hóa kèm thông báo.
              </li>
              <li>
                <strong>Tại Server (Firestore Security Rules):</strong> Mọi request ghi dữ liệu (Create, Update, Delete) trực tiếp từ client đều bị từ chối với mã lỗi <code>PERMISSION_DENIED</code> nếu <code>request.auth.token.email</code> không nằm trong danh sách Quản trị viên.
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Mã nguồn Rules đã triển khai trên Firebase:
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'ĐÃ CHÉP' : 'SAO CHÉP'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-blue-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
              {rulesText}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 font-bold text-white transition shadow active:scale-95 text-xs"
          >
            ĐÃ HIỂU
          </button>
        </div>
      </div>
    </div>
  );
};
