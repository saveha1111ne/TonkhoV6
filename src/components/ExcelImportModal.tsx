import React, { useState, useRef } from 'react';
import { Item, Transaction } from '../types';
import { parseUploadedInventoryFile, downloadExcelTemplate } from '../services/excelService';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (newItems: Item[], newTransactions: Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportData,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<{
    newItems: Item[];
    newTransactions: Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>[];
    warnings: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);
    try {
      const result = await parseUploadedInventoryFile(selectedFile);
      setPreview(result);
    } catch (err) {
      console.error(err);
      setPreview({
        newItems: [],
        newTransactions: [],
        warnings: ['Lỗi đọc file: định dạng không tương thích hoặc file bị hỏng.'],
      });
    } finally {
      setParsing(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    onImportData(preview.newItems, preview.newTransactions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-6 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
              Đồng Bộ Dữ Liệu
            </span>
            <h2 className="text-xl font-black mt-0.5">Nạp Dữ Liệu Từ File Excel / CSV</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Action to download template */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-emerald-900">Chưa có file mẫu chuẩn?</div>
              <div className="text-xs text-emerald-700">
                Tải file mẫu Excel (.xlsx) chuẩn gồm 2 sheet Danh mục Vật tư & Phiếu giao dịch.
              </div>
            </div>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow active:scale-95 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Tải File Mẫu Excel</span>
            </button>
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50 hover:bg-emerald-50/40"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <div className="font-bold text-slate-800 text-sm">
              {file ? file.name : 'Bấm để chọn hoặc kéo thả file Excel / CSV vào đây'}
            </div>
            <div className="text-xs text-slate-400 mt-1">Hỗ trợ định dạng .xlsx, .xls, .csv</div>
          </div>

          {/* Parsing spinner */}
          {parsing && (
            <div className="text-center py-4 text-slate-600 font-semibold text-xs">
              Đang phân tích cấu trúc file...
            </div>
          )}

          {/* Preview of detected data */}
          {preview && (
            <div className="space-y-3">
              {preview.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>{preview.warnings.join(', ')}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="text-xs text-blue-700 font-semibold">Mã Vật Tư Mới Nhận Diện</div>
                  <div className="text-xl font-black text-blue-900">{preview.newItems.length} mã</div>
                </div>
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                  <div className="text-xs text-teal-700 font-semibold">Phiếu Giao Dịch Nhận Diện</div>
                  <div className="text-xl font-black text-teal-900">{preview.newTransactions.length} phiếu</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              ĐÓNG
            </button>
            <button
              type="button"
              disabled={!preview || (preview.newItems.length === 0 && preview.newTransactions.length === 0)}
              onClick={handleApply}
              className={`px-6 py-2.5 rounded-xl font-bold text-white transition shadow ${
                preview && (preview.newItems.length > 0 || preview.newTransactions.length > 0)
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 active:scale-95'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              NẠP VÀO HỆ THỐNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
