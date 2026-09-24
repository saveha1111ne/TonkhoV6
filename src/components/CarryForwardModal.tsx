import React, { useState } from 'react';
import { Branch, Item, MonthlyBalance, Transaction } from '../types';
import { getNextMonthKey, getMonthLabel } from '../services/inventoryService';
import { Calendar, ArrowRight, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface CarryForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMonth: string;
  branches: Branch[];
  items: Item[];
  monthlyBalances: MonthlyBalance[];
  transactions: Transaction[];
  onConfirm: (fromMonth: string, toMonth: string) => void;
}

export const CarryForwardModal: React.FC<CarryForwardModalProps> = ({
  isOpen,
  onClose,
  activeMonth,
  branches,
  items,
  monthlyBalances,
  transactions,
  onConfirm,
}) => {
  const nextMonthKey = getNextMonthKey(activeMonth);
  const [targetMonth, setTargetMonth] = useState(nextMonthKey);

  if (!isOpen) return null;

  const totalCalculations = branches.length * items.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-blue-300">
              Nghiệp Vụ ERP Tự Động
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <h2 className="text-xl font-black mt-1">THÊM THÁNG MỚI & KẾT CHUYỂN TỒN KHO</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Explanation Banner */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-blue-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Cơ chế kết chuyển tự động chuẩn ERP:</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Toàn bộ <strong>Tồn cuối kỳ</strong> của tháng trước sẽ tự động trở thành <strong>Tồn đầu kỳ</strong> của tháng mới cho tất cả các chi nhánh và mã vật tư mà <strong>không làm thay đổi lịch sử</strong> các tháng cũ.
            </p>
          </div>

          {/* Month transition preview */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
            <div className="text-center flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tháng Nguồn</div>
              <div className="text-base font-black text-slate-800 mt-0.5">
                {getMonthLabel(activeMonth)}
              </div>
              <div className="text-[11px] text-slate-500">Lấy Tồn Cuối Kỳ</div>
            </div>

            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 shadow-inner">
              <ArrowRight className="w-5 h-5" />
            </div>

            <div className="text-center flex-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Tháng Mới Đích</div>
              <input
                type="month"
                value={targetMonth}
                onChange={(e) => setTargetMonth(e.target.value)}
                className="mt-0.5 font-black text-sm text-blue-900 bg-white border border-blue-300 rounded-lg px-2 py-1 text-center w-full focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
              <div className="text-[11px] text-blue-700 font-semibold">Tạo Tồn Đầu Kỳ</div>
            </div>
          </div>

          {/* Summary Details */}
          <div className="border border-slate-200 rounded-xl p-3 bg-white text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>Số lượng chi nhánh áp dụng:</span>
              <strong className="text-slate-900">{branches.length} chi nhánh</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Số lượng mã vật tư SKU:</span>
              <strong className="text-slate-900">{items.length} mã vật tư</strong>
            </div>
            <div className="flex justify-between text-slate-600 border-t border-slate-100 pt-1.5 font-bold text-blue-900">
              <span>Tổng số lượng bản ghi ERP kết chuyển:</span>
              <span>{totalCalculations} vị trí kho x SKU</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              HỦY
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm(activeMonth, targetMonth);
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 font-bold text-white shadow-lg shadow-blue-700/30 transition active:scale-95"
            >
              XÁC NHẬN KẾT CHUYỂN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
