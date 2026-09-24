import React, { useState } from 'react';
import { Branch, Item, MonthlyBalance, Transaction } from '../types';
import { getItemBranchStock, getMonthLabel } from '../services/inventoryService';
import { BarChart3, PieChart, TrendingUp, ArrowUpDown, Info } from 'lucide-react';

interface ChartsSectionProps {
  activeMonth: string;
  availableMonths: string[];
  branches: Branch[];
  items: Item[];
  monthlyBalances: MonthlyBalance[];
  transactions: Transaction[];
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  activeMonth,
  availableMonths,
  branches,
  items,
  monthlyBalances,
  transactions,
}) => {
  const [hoveredBranch, setHoveredBranch] = useState<string | null>(null);
  const [hoveredDoughnutIndex, setHoveredDoughnutIndex] = useState<number | null>(null);

  // 1. Data for Chart 1: Stock by Branch for activeMonth
  const branchStocks = branches.map((b) => {
    let stockCount = 0;
    for (const it of items) {
      stockCount += getItemBranchStock(activeMonth, b, it, monthlyBalances, transactions).endingStock;
    }
    return {
      id: b.id,
      name: b.name,
      code: b.code,
      region: b.region,
      stock: stockCount,
    };
  });

  const totalStockAll = branchStocks.reduce((sum, b) => sum + b.stock, 0);
  const maxBranchStock = Math.max(...branchStocks.map((b) => b.stock), 1);

  // 2. Data for Chart 2: Regional Doughnut distribution
  const regionMap = new Map<string, number>();
  for (const b of branchStocks) {
    const curr = regionMap.get(b.region) || 0;
    regionMap.set(b.region, curr + b.stock);
  }
  const regionalData = Array.from(regionMap.entries()).map(([region, stock], idx) => {
    const pct = totalStockAll > 0 ? (stock / totalStockAll) * 100 : 0;
    // Color palette for regions
    const colors = ['#2563eb', '#0d9488', '#f59e0b', '#8b5cf6', '#ec4899'];
    return {
      region,
      stock,
      percentage: pct,
      color: colors[idx % colors.length],
    };
  });

  // Calculate SVG stroke dashes for Doughnut
  let accumulatedPercent = 0;
  const circumference = 2 * Math.PI * 40; // r=40 -> ~251.3
  const doughnutSegments = regionalData.map((d) => {
    const strokeDasharray = `${(d.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += d.percentage;
    return {
      ...d,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  // 3. Data for Chart 3: Monthly In vs Out comparison across all available months
  const monthlyInOut = availableMonths.map((m) => {
    const [y, mon] = m.split('-');
    const mTransactions = transactions.filter((t) => t.monthKey === m);
    const totalIn = mTransactions.filter((t) => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
    const totalOut = mTransactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);
    return {
      monthKey: m,
      label: `T${mon}/${y.slice(2)}`,
      totalIn,
      totalOut,
    };
  });
  const maxInOut = Math.max(...monthlyInOut.flatMap((m) => [m.totalIn, m.totalOut]), 1);

  // 4. Data for Chart 4: Total Inventory trend across months
  const monthlyTotalStock = availableMonths.map((m) => {
    const [y, mon] = m.split('-');
    let sum = 0;
    for (const b of branches) {
      for (const it of items) {
        sum += getItemBranchStock(m, b, it, monthlyBalances, transactions).endingStock;
      }
    }
    return {
      monthKey: m,
      label: `T${mon}/${y.slice(2)}`,
      stock: sum,
    };
  });
  const maxStockTrend = Math.max(...monthlyTotalStock.map((m) => m.stock), 1);
  const minStockTrend = Math.min(...monthlyTotalStock.map((m) => m.stock), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
      {/* ========================================================================= */}
      {/* BIỂU ĐỒ 1: SO SÁNH SẢN LƯỢNG TỒN KHO GIỮA 4 CHI NHÁNH */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                1. So Sánh Sản Lượng Tồn Kho Giữa 4 Chi Nhánh
              </h3>
              <p className="text-xs text-slate-500">Kỳ hiện tại: {getMonthLabel(activeMonth)}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            Tổng: {totalStockAll.toLocaleString('vi-VN')} SP
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {branchStocks.map((b) => {
            const pct = totalStockAll > 0 ? ((b.stock / totalStockAll) * 100).toFixed(1) : '0';
            const widthPct = Math.min(100, Math.max(8, (b.stock / maxBranchStock) * 100));
            const isHovered = hoveredBranch === b.id;

            return (
              <div
                key={b.id}
                onMouseEnter={() => setHoveredBranch(b.id)}
                onMouseLeave={() => setHoveredBranch(null)}
                className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                  isHovered ? 'bg-blue-50/70 ring-1 ring-blue-300' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-900 text-white font-mono text-[11px] font-bold flex items-center justify-center">
                      {b.code}
                    </span>
                    <span className="text-slate-800 font-bold">{b.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal">({b.region})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-blue-950">
                      {b.stock.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">SP</span>
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Bar */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-500 transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BIỂU ĐỒ 2: BIỂU ĐỒ TỶ TRỌNG DOUGHNUT PHÂN BỔ HÀNG HÓA THEO VÙNG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                2. Tỷ Trọng Phân Bổ Hàng Hóa Theo Vùng (Doughnut)
              </h3>
              <p className="text-xs text-slate-500">Cơ cấu hàng hóa 4 vùng địa lý</p>
            </div>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
            {regionalData.length} Vùng
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* SVG Doughnut */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#f1f5f9"
                strokeWidth="14"
              />
              {doughnutSegments.map((seg, idx) => (
                <circle
                  key={seg.region}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={hoveredDoughnutIndex === idx ? '18' : '14'}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredDoughnutIndex(idx)}
                  onMouseLeave={() => setHoveredDoughnutIndex(null)}
                />
              ))}
            </svg>

            {/* Doughnut Center Metric */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {hoveredDoughnutIndex !== null ? doughnutSegments[hoveredDoughnutIndex].region : 'TOÀN MẠNG'}
              </div>
              <div className="text-lg font-black text-slate-900 leading-tight">
                {hoveredDoughnutIndex !== null
                  ? `${doughnutSegments[hoveredDoughnutIndex].percentage.toFixed(1)}%`
                  : '100%'}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                {hoveredDoughnutIndex !== null
                  ? `${doughnutSegments[hoveredDoughnutIndex].stock.toLocaleString('vi-VN')} SP`
                  : `${totalStockAll.toLocaleString('vi-VN')} SP`}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 w-full space-y-2.5">
            {regionalData.map((d, idx) => {
              const isHov = hoveredDoughnutIndex === idx;
              return (
                <div
                  key={d.region}
                  onMouseEnter={() => setHoveredDoughnutIndex(idx)}
                  onMouseLeave={() => setHoveredDoughnutIndex(null)}
                  className={`flex items-center justify-between p-2 rounded-xl transition cursor-pointer ${
                    isHov ? 'bg-slate-100 ring-1 ring-slate-300' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-md flex-shrink-0"
                      style={{ backgroundColor: d.color }}
                    ></span>
                    <span className="text-xs font-bold text-slate-800">{d.region}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900">
                      {d.percentage.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                      ({d.stock.toLocaleString('vi-VN')} SP)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BIỂU ĐỒ 3: SO SÁNH TƯƠNG QUAN NHẬP - XUẤT THEO TỪNG THÁNG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ArrowUpDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                3. Tương Quan Nhập - Xuất Theo Từng Tháng
              </h3>
              <p className="text-xs text-slate-500">So sánh lưu chuyển hàng hóa qua các kỳ</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Nhập Kho
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Xuất Kho
            </span>
          </div>
        </div>

        {/* Dual Bars Container */}
        <div className="pt-4 flex items-end justify-around gap-4 h-48 border-b border-slate-200 pb-2">
          {monthlyInOut.map((m) => {
            const inHeight = Math.max(12, Math.round((m.totalIn / maxInOut) * 140));
            const outHeight = Math.max(12, Math.round((m.totalOut / maxInOut) * 140));
            const isCurrent = m.monthKey === activeMonth;

            return (
              <div key={m.monthKey} className="flex-1 flex flex-col items-center group">
                <div className="flex items-end justify-center gap-2 w-full">
                  {/* In Bar */}
                  <div className="flex flex-col items-center group/bar relative">
                    <span className="text-[10px] font-bold text-emerald-800 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.totalIn}
                    </span>
                    <div
                      className="w-7 sm:w-10 rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 shadow group-hover/bar:brightness-110 transition-all"
                      style={{ height: `${inHeight}px` }}
                      title={`Nhập: ${m.totalIn.toLocaleString('vi-VN')} SP`}
                    ></div>
                  </div>

                  {/* Out Bar */}
                  <div className="flex flex-col items-center group/bar relative">
                    <span className="text-[10px] font-bold text-amber-800 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.totalOut}
                    </span>
                    <div
                      className="w-7 sm:w-10 rounded-t-lg bg-gradient-to-t from-amber-600 to-orange-400 shadow group-hover/bar:brightness-110 transition-all"
                      style={{ height: `${outHeight}px` }}
                      title={`Xuất: ${m.totalOut.toLocaleString('vi-VN')} SP`}
                    ></div>
                  </div>
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isCurrent
                        ? 'bg-blue-900 text-white shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    {m.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BIỂU ĐỒ 4: XU HƯỚNG BIẾN ĐỘNG TỔNG TỒN KHO TOÀN HỆ THỐNG */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                4. Xu Hướng Biến Động Tổng Tồn Kho Toàn Hệ Thống
              </h3>
              <p className="text-xs text-slate-500">Diễn biến tồn trữ an toàn theo trục thời gian</p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Độ Ổn Định Cao
          </span>
        </div>

        {/* SVG Area / Line Chart */}
        <div className="pt-2 relative">
          <div className="h-44 w-full flex items-center justify-center">
            <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="stockAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="380" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="80" x2="380" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="20" y1="130" x2="380" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Compute points for the line */}
              {(() => {
                const count = monthlyTotalStock.length;
                if (count === 0) return null;
                const step = count > 1 ? 340 / (count - 1) : 0;
                const points = monthlyTotalStock.map((m, idx) => {
                  const x = 30 + idx * step;
                  // Normalized Y between 30 and 130
                  const range = maxStockTrend - minStockTrend || 1;
                  const norm = (m.stock - minStockTrend) / range;
                  const y = 130 - norm * 90;
                  return { x, y, stock: m.stock, label: m.label, monthKey: m.monthKey };
                });

                const pathD = points.reduce((acc, p, idx) => {
                  return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
                }, '');

                const areaD = `${pathD} L ${points[points.length - 1].x} 140 L ${points[0].x} 140 Z`;

                return (
                  <g>
                    {/* Fill Area */}
                    <path d={areaD} fill="url(#stockAreaGradient)" />
                    {/* Line */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Dots and Labels */}
                    {points.map((p) => {
                      const isCurrent = p.monthKey === activeMonth;
                      return (
                        <g key={p.monthKey}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isCurrent ? '6' : '4.5'}
                            fill={isCurrent ? '#1e40af' : '#3b82f6'}
                            stroke="#ffffff"
                            strokeWidth="2.5"
                            className="shadow"
                          />
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="bold"
                            fill="#1e3a8a"
                          >
                            {p.stock.toLocaleString('vi-VN')} SP
                          </text>
                          <text
                            x={p.x}
                            y="152"
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill={isCurrent ? '#1e3a8a' : '#64748b'}
                          >
                            {p.label}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
