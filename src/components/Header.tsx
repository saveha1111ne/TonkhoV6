import React from 'react';
import { 
  Phone, 
  Download, 
  FileSpreadsheet, 
  Share2, 
  ShieldCheck, 
  ShieldAlert, 
  LogIn, 
  LogOut, 
  PlusCircle, 
  Calendar, 
  Plus, 
  Layers, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  currentUser: User | null;
  isAdmin: boolean;
  activeMonth: string;
  availableMonths: string[];
  onSelectMonth: (month: string) => void;
  onOpenCarryForward: () => void;
  onOpenTransactionModal: (type: 'IN' | 'OUT') => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  onOpenImportModal: () => void;
  onOpenGoogleSheetsModal: () => void;
  onOpenRulesModal: () => void;
  onOpenAdminConfigModal: () => void;
  onDownloadStandaloneHtml: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isAdmin,
  activeMonth,
  availableMonths,
  onSelectMonth,
  onOpenCarryForward,
  onOpenTransactionModal,
  onExportExcel,
  onExportCsv,
  onOpenImportModal,
  onOpenGoogleSheetsModal,
  onOpenRulesModal,
  onOpenAdminConfigModal,
  onDownloadStandaloneHtml,
  onLogin,
  onLogout,
}) => {
  const [exportDropdownOpen, setExportDropdownOpen] = React.useState(false);

  return (
    <header className="bg-gradient-to-r from-[#0a192f] via-[#0f2b5c] to-[#1e40af] text-white shadow-xl border-b border-blue-900/50">
      {/* Top bar: Brand info, Hotline, User status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-400 p-0.5 shadow-lg shadow-blue-500/30 flex items-center justify-center font-black text-xl text-white tracking-tighter">
            CIC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest text-blue-300 uppercase bg-blue-950/70 border border-blue-400/30 px-2 py-0.5 rounded-full">
                Version: By Ha Nhung Log
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ERP Real-time
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white mt-0.5">
              HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC
            </h1>
          </div>
        </div>

        {/* Right side: Hotline button & Auth Profile */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Direct call hotline button */}
          <a
            href="tel:0901601600"
            className="group flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-900/30 transition transform active:scale-95"
            title="Bấm để gọi nhanh Hotline hỗ trợ kỹ thuật"
          >
            <Phone className="w-4 h-4 animate-bounce group-hover:rotate-12 transition-transform" />
            <span>Hotline: 0901601600</span>
          </a>

          {/* User Profile & Role Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-inner">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-blue-400/50 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white max-w-[140px] truncate leading-tight">
                  {currentUser.displayName || currentUser.email}
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-300">
                      <ShieldCheck className="w-3 h-3 text-amber-400" /> Quản trị viên (Admin)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                      <ShieldAlert className="w-3 h-3 text-slate-400" /> Chỉ xem (Read-only)
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl backdrop-blur transition active:scale-95"
              title="Đăng nhập Google để kiểm tra quyền Quản trị viên"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>Đăng nhập Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Secondary Action Toolbar: Month Selector, Add Transactions, Excel, Standalone HTML */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Month Selector & Carry Forward */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center bg-slate-900/90 border border-blue-500/30 rounded-xl p-1 shadow-sm">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-200 px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Kỳ Báo Cáo:
            </span>
            <div className="flex items-center gap-1">
              {availableMonths.map((m) => {
                const isActive = m === activeMonth;
                const [year, month] = m.split('-');
                return (
                  <button
                    key={m}
                    onClick={() => onSelectMonth(m)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/40'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    T{month}/{year.slice(2)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Button: THÊM THÁNG MỚI (ERP Carry Forward) */}
          <button
            onClick={isAdmin ? onOpenCarryForward : undefined}
            disabled={!isAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
              isAdmin
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-purple-900/30 active:scale-95'
                : 'bg-slate-800/60 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
            title={
              isAdmin
                ? 'Tự động kết chuyển Tồn cuối tháng trước sang Tồn đầu tháng mới'
                : 'Bạn chỉ có quyền xem dữ liệu (Chỉ Quản trị viên mới được kết chuyển tháng mới)'
            }
          >
            <Plus className="w-3.5 h-3.5" />
            <span>THÊM THÁNG MỚI</span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 1. Lập Phiếu Nhập Kho (NK) */}
          <button
            onClick={isAdmin ? () => onOpenTransactionModal('IN') : undefined}
            disabled={!isAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
              isAdmin
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 active:scale-95'
                : 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
            title={isAdmin ? 'Lập phiếu Nhập kho mới' : 'Bạn chỉ có quyền xem dữ liệu'}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Nhập Kho (NK)</span>
          </button>

          {/* 2. Lập Phiếu Xuất Kho (XK) */}
          <button
            onClick={isAdmin ? () => onOpenTransactionModal('OUT') : undefined}
            disabled={!isAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
              isAdmin
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40 active:scale-95'
                : 'bg-slate-800/50 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
            title={isAdmin ? 'Lập phiếu Xuất kho mới' : 'Bạn chỉ có quyền xem dữ liệu'}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>- Xuất Kho (XK)</span>
          </button>

          {/* 3. Export Dropdown (Excel .xlsx / CSV UTF-8) */}
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center gap-1.5 bg-blue-700/80 hover:bg-blue-600 text-white font-semibold text-xs px-3 py-1.5 rounded-xl border border-blue-400/30 transition shadow"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-200" />
              <span>Xuất Dữ Liệu</span>
              <ChevronDown className="w-3 h-3 text-blue-200" />
            </button>

            {exportDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs"
                onMouseLeave={() => setExportDropdownOpen(false)}
              >
                <button
                  onClick={() => {
                    setExportDropdownOpen(false);
                    onExportExcel();
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-800/60 text-slate-200 hover:text-white flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold">Xuất Excel đa sheet (.xlsx)</div>
                    <div className="text-[10px] text-slate-400">6 Sheet: Tổng quan, Ma trận, Sổ NK, Sổ XK...</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setExportDropdownOpen(false);
                    onExportCsv();
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-blue-800/60 text-slate-200 hover:text-white flex items-center gap-2 transition border-t border-slate-800"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold">Xuất file CSV (UTF-8 BOM)</div>
                    <div className="text-[10px] text-slate-400">Chuẩn dấu tiếng Việt rõ nét trên Windows/macOS</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* 4. Nhập Excel / CSV */}
          <button
            onClick={isAdmin ? onOpenImportModal : undefined}
            disabled={!isAdmin}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
              isAdmin
                ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-600 shadow active:scale-95'
                : 'bg-slate-800/30 text-slate-600 border-slate-800 cursor-not-allowed'
            }`}
            title={isAdmin ? 'Nạp danh mục hoặc phiếu từ Excel/CSV' : 'Bạn chỉ có quyền xem dữ liệu'}
          >
            <Download className="w-3.5 h-3.5 rotate-180 text-blue-300" />
            <span className="hidden sm:inline">Nạp Excel</span>
          </button>

          {/* 5. Google Sheets Webhook */}
          <button
            onClick={onOpenGoogleSheetsModal}
            className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 font-semibold text-xs px-3 py-1.5 rounded-xl transition shadow"
            title="Đồng bộ Webhook Google Apps Script"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">Google Sheets</span>
          </button>

          {/* 6. TẢI FILE HTML ĐỘC LẬP (OFFLINE) */}
          <button
            onClick={onDownloadStandaloneHtml}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl shadow-lg shadow-orange-900/30 transition transform active:scale-95"
            title="Tải file inventory-cic.html chạy trực tiếp offline trên Chrome không cần mạng hay server!"
          >
            <span>💾 TẢI FILE HTML ĐỘC LẬP</span>
          </button>

          {/* 7. Settings / RBAC Info */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-2">
            <button
              onClick={onOpenRulesModal}
              className="p-1.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Hướng dẫn cấu hình bảo mật Firestore Rules"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={onOpenAdminConfigModal}
                className="p-1.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Cấu hình danh sách Admin"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
