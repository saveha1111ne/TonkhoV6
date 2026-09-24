import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Boxes, Building2, Package } from 'lucide-react';
import { KpiSummary } from '../services/inventoryService';

interface KpiCardsProps {
  kpis: KpiSummary;
  monthName: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis, monthName }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {/* 1. Tổng Nhập (Pastel Emerald) */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/60 to-emerald-100/50 border border-emerald-200/90 hover:border-emerald-400/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Tổng Nhập Kho
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
          {kpis.totalIn.toLocaleString('vi-VN')}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Phát sinh nhập trong {monthName}</span>
        </div>
      </div>

      {/* 2. Tổng Xuất (Pastel Amber) */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/60 to-amber-100/50 border border-amber-200/90 hover:border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
            Tổng Xuất Kho
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-amber-950 tracking-tight">
          {kpis.totalOut.toLocaleString('vi-VN')}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-700 font-semibold mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
          <span>Cung ứng công trình & đại lý</span>
        </div>
      </div>

      {/* 3. Tổng Tồn Kho (Pastel Sky / Blue) */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50/60 to-sky-100/60 border border-blue-200/90 hover:border-blue-400/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
            Tổng Tồn Kho Hệ Thống
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Boxes className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight">
          {kpis.totalStock.toLocaleString('vi-VN')}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
          <span>Khả dụng tức thời tại 4 kho</span>
        </div>
      </div>

      {/* 4. Số Chi Nhánh (Pastel Purple) */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-purple-50 via-fuchsia-50/50 to-purple-100/60 border border-purple-200/90 hover:border-purple-400/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
            Chi Nhánh Hoạt Động
          </span>
          <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-purple-950 tracking-tight">
          {kpis.branchCount} <span className="text-sm font-semibold text-purple-700">Kho</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-purple-700 font-semibold mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500"></span>
          <span>Hà Nội, ĐN, HCM, Cần Thơ</span>
        </div>
      </div>

      {/* 5. Số Mã SKU (Pastel Rose) */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-rose-50 via-pink-50/50 to-rose-100/60 border border-rose-200/90 hover:border-rose-400/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
            Mã Vật Tư (SKU)
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-black text-rose-950 tracking-tight">
          {kpis.skuCount} <span className="text-sm font-semibold text-rose-700">Mã</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-rose-700 font-semibold mt-1">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Kiểm soát định mức an toàn</span>
        </div>
      </div>
    </div>
  );
};
