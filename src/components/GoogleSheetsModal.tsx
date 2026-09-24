import React, { useState } from 'react';
import { SAMPLE_GOOGLE_APPS_SCRIPT, syncToGoogleSheetsWebhook } from '../services/googleSheetsService';
import { Branch, Item, MonthlyBalance, Transaction } from '../types';
import { Share2, Copy, Check, ExternalLink, RefreshCw, X, AlertCircle } from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  autoSync: boolean;
  onSaveConfig: (url: string, auto: boolean) => void;
  activeMonth: string;
  branches: Branch[];
  items: Item[];
  monthlyBalances: MonthlyBalance[];
  transactions: Transaction[];
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  autoSync,
  onSaveConfig,
  activeMonth,
  branches,
  items,
  monthlyBalances,
  transactions,
}) => {
  const [url, setUrl] = useState(webhookUrl || '');
  const [auto, setAuto] = useState(autoSync);
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(SAMPLE_GOOGLE_APPS_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleTestSync = async () => {
    if (!url.trim()) {
      setSyncResult({ success: false, message: 'Vui lòng nhập URL Webhook Google Apps Script!' });
      return;
    }
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncToGoogleSheetsWebhook(url, activeMonth, branches, items, monthlyBalances, transactions);
      setSyncResult(res);
      onSaveConfig(url, auto);
    } catch (e: any) {
      setSyncResult({ success: false, message: e?.message || 'Lỗi khi đồng bộ!' });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveAndClose = () => {
    onSaveConfig(url, auto);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
                Tích Hợp Đám Mây
              </span>
              <h2 className="text-xl font-black mt-0.5">Đồng Bộ Liên Tục Với Google Sheets</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs sm:text-sm flex-1">
          {/* Status Message */}
          {syncResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                syncResult.success
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{syncResult.message}</span>
            </div>
          )}

          {/* Webhook URL Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              URL Webhook Google Apps Script Web App:
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Auto-Sync Switch */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 text-sm">Chế độ tự động đẩy số liệu</div>
              <div className="text-xs text-slate-500">
                Tự động gửi phiếu lên Google Sheet ngay khi tạo hoặc sửa phiếu Nhập / Xuất kho.
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Manual Sync Trigger */}
          <button
            type="button"
            disabled={syncing}
            onClick={handleTestSync}
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Đang gửi dữ liệu...' : '🚀 Đồng Bộ Thủ Công Ngay Bây Giờ'}</span>
          </button>

          {/* 4-Step Instructions & 1-Click Copy Code */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Mã nguồn Google Apps Script mẫu (1-Click Copy)
              </div>
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'ĐÃ SAO CHÉP!' : 'SAO CHÉP MÃ NGUỒN'}</span>
              </button>
            </div>

            {/* Steps */}
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 font-medium">
              <li>Mở Google Sheets mới &gt; Tiện ích mở rộng (Extensions) &gt; Apps Script.</li>
              <li>Dán mã nguồn mẫu vừa sao chép ở trên vào editor.</li>
              <li>Bấm <strong>Triển khai (Deploy)</strong> &gt; <strong>Triển khai mới (New deployment)</strong> &gt; chọn <em>Ứng dụng web (Web app)</em>.</li>
              <li>Mục <em>Ai có quyền truy cập</em>: chọn <strong>Bất kỳ ai (Anyone)</strong> &gt; Dán URL tạo được vào ô trên!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            ĐÓNG
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-6 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 font-bold text-white transition shadow active:scale-95"
          >
            LƯU CẤU HÌNH
          </button>
        </div>
      </div>
    </div>
  );
};
