import React, { useState, useMemo } from 'react';
import { Branch, Item, MonthlyBalance, Transaction, MatrixDisplayMode } from '../types';
import { getItemBranchStock } from '../services/inventoryService';
import { Search, Filter, AlertTriangle, Eye, ArrowDownLeft, ArrowUpRight, Boxes, CheckCircle2 } from 'lucide-react';

interface MatrixReportProps {
  activeMonth: string;
  branches: Branch[];
  items: Item[];
  monthlyBalances: MonthlyBalance[];
  transactions: Transaction[];
  onOpenItemDetail?: (item: Item) => void;
}

export const MatrixReport: React.FC<MatrixReportProps> = ({
  activeMonth,
  branches,
  items,
  monthlyBalances,
  transactions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [displayMode, setDisplayMode] = useState<MatrixDisplayMode>('all');
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => set.add(it.category));
    return Array.from(set);
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchSearch =
        it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        it.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || it.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [items, searchTerm, selectedCategory]);

  // Filtered branches to display in table columns
  const visibleBranches = useMemo(() => {
    if (selectedBranchFilter === 'ALL') return branches;
    return branches.filter((b) => b.id === selectedBranchFilter);
  }, [branches, selectedBranchFilter]);

  // Calculate Column Totals for the table footer
  const columnTotals = useMemo(() => {
    const totals: {
      [branchId: string]: { initial: number; in: number; out: number; ending: number };
    } = {};

    for (const b of visibleBranches) {
      totals[b.id] = { initial: 0, in: 0, out: 0, ending: 0 };
    }

    let grandEnding = 0;

    for (const it of filteredItems) {
      for (const b of visibleBranches) {
        const s = getItemBranchStock(activeMonth, b, it, monthlyBalances, transactions);
        totals[b.id].initial += s.initialStock;
        totals[b.id].in += s.totalIn;
        totals[b.id].out += s.totalOut;
        totals[b.id].ending += s.endingStock;
        grandEnding += s.endingStock;
      }
    }

    return { totals, grandEnding };
  }, [activeMonth, visibleBranches, filteredItems, monthlyBalances, transactions]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search box */}
          <div className="relative min-w-[220px] sm:min-w-[280px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên vật tư, mã SKU, nhóm hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="ALL">Tất Cả Nhóm Hàng ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Branch filter */}
          <select
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="ALL">Tất Cả 4 Chi Nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                Kho {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Display Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-2xl self-start lg:self-auto">
          <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Chế Độ:</span>
          <button
            onClick={() => setDisplayMode('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              displayMode === 'all'
                ? 'bg-blue-900 text-white shadow-md'
                : 'text-slate-700 hover:bg-white/80'
            }`}
          >
            Cả 3 chỉ số
          </button>
          <button
            onClick={() => setDisplayMode('ending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              displayMode === 'ending'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white/80'
            }`}
          >
            Tồn Cuối
          </button>
          <button
            onClick={() => setDisplayMode('in')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              displayMode === 'in'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white/80'
            }`}
          >
            Nhập Kỳ
          </button>
          <button
            onClick={() => setDisplayMode('out')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              displayMode === 'out'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-white/80'
            }`}
          >
            Xuất Kỳ
          </button>
        </div>
      </div>

      {/* Main 2D Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th className="p-3.5 font-bold uppercase tracking-wider border-r border-slate-200 w-12 text-center">
                STT
              </th>
              <th className="p-3.5 font-bold uppercase tracking-wider border-r border-slate-200 min-w-[120px]">
                Mã SKU
              </th>
              <th className="p-3.5 font-bold uppercase tracking-wider border-r border-slate-200 min-w-[200px]">
                Tên Vật Tư / Hàng Hóa
              </th>
              <th className="p-3.5 font-bold uppercase tracking-wider border-r border-slate-200 w-24 text-center">
                ĐVT
              </th>
              <th className="p-3.5 font-bold uppercase tracking-wider border-r border-slate-200 w-28 text-center">
                Định Mức Min
              </th>

              {/* Dynamic Branch Columns */}
              {visibleBranches.map((b) => (
                <th
                  key={b.id}
                  className="p-3.5 font-extrabold uppercase tracking-wider border-r border-slate-200 text-center min-w-[150px] bg-slate-50"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-blue-900 text-white text-[10px] font-mono flex items-center justify-center">
                      {b.code}
                    </span>
                    <span>{b.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{b.region}</div>
                </th>
              ))}

              <th className="p-3.5 font-black uppercase tracking-wider text-right min-w-[140px] bg-blue-50/60 text-blue-950">
                Tổng Tồn Toàn Hệ Thống
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6 + visibleBranches.length}
                  className="p-8 text-center text-slate-500 font-medium"
                >
                  Không tìm thấy mã vật tư nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredItems.map((it, idx) => {
                let rowTotalEnding = 0;

                return (
                  <tr
                    key={it.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    <td className="p-3 text-center text-slate-400 font-mono border-r border-slate-200">
                      {idx + 1}
                    </td>

                    <td className="p-3 border-r border-slate-200">
                      <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {it.sku}
                      </span>
                    </td>

                    <td className="p-3 border-r border-slate-200">
                      <div className="font-bold text-slate-800 text-sm group-hover:text-blue-900 transition">
                        {it.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{it.category}</div>
                    </td>

                    <td className="p-3 text-center border-r border-slate-200 font-medium text-slate-600">
                      {it.unit}
                    </td>

                    <td className="p-3 text-center border-r border-slate-200">
                      <span className="font-semibold text-slate-500">
                        {it.minStock} {it.unit}
                      </span>
                    </td>

                    {/* Branch Cells */}
                    {visibleBranches.map((b) => {
                      const stock = getItemBranchStock(
                        activeMonth,
                        b,
                        it,
                        monthlyBalances,
                        transactions
                      );
                      rowTotalEnding += stock.endingStock;
                      const isLowStock = stock.endingStock < it.minStock && stock.endingStock > 0;
                      const isZeroStock = stock.endingStock <= 0;

                      return (
                        <td
                          key={b.id}
                          className="p-2.5 border-r border-slate-200 text-center align-middle"
                        >
                          {/* Mode 1: CẢ 3 CHỈ SỐ */}
                          {displayMode === 'all' && (
                            <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/80 space-y-1 text-[11px] shadow-2xs">
                              <div className="flex justify-between text-slate-400 font-medium">
                                <span>Đầu:</span>
                                <span>{stock.initialStock}</span>
                              </div>
                              <div className="flex justify-between text-emerald-700 font-semibold">
                                <span className="flex items-center gap-0.5">
                                  <ArrowDownLeft className="w-2.5 h-2.5" /> Nhập:
                                </span>
                                <span>+{stock.totalIn}</span>
                              </div>
                              <div className="flex justify-between text-amber-700 font-semibold">
                                <span className="flex items-center gap-0.5">
                                  <ArrowUpRight className="w-2.5 h-2.5" /> Xuất:
                                </span>
                                <span>-{stock.totalOut}</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-1 font-black text-xs text-blue-950">
                                <span>Cuối:</span>
                                <span
                                  className={
                                    isZeroStock
                                      ? 'text-rose-600'
                                      : isLowStock
                                      ? 'text-amber-600'
                                      : 'text-blue-900'
                                  }
                                >
                                  {stock.endingStock}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Mode 2: CHỈ TỒN CUỐI */}
                          {displayMode === 'ending' && (
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-sm font-black ${
                                  isZeroStock
                                    ? 'text-rose-600'
                                    : isLowStock
                                    ? 'text-amber-600'
                                    : 'text-blue-950'
                                }`}
                              >
                                {stock.endingStock.toLocaleString('vi-VN')}
                              </span>
                              {isZeroStock ? (
                                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                  Hết hàng
                                </span>
                              ) : isLowStock ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Dưới min
                                </span>
                              ) : null}
                            </div>
                          )}

                          {/* Mode 3: CHỈ NHẬP */}
                          {displayMode === 'in' && (
                            <div className="text-sm font-bold text-emerald-700">
                              {stock.totalIn > 0 ? `+${stock.totalIn.toLocaleString('vi-VN')}` : '0'}
                            </div>
                          )}

                          {/* Mode 4: CHỈ XUẤT */}
                          {displayMode === 'out' && (
                            <div className="text-sm font-bold text-amber-700">
                              {stock.totalOut > 0 ? `-${stock.totalOut.toLocaleString('vi-VN')}` : '0'}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Total System Ending Stock */}
                    <td className="p-3 text-right bg-blue-50/40">
                      <span className="text-sm sm:text-base font-black text-blue-950">
                        {rowTotalEnding.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs text-slate-400 font-medium ml-1">{it.unit}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          <tfoot>
            <tr className="bg-slate-100 font-black text-slate-800 border-t-2 border-slate-300">
              <td
                colSpan={5}
                className="p-3.5 text-center uppercase tracking-wider text-xs border-r border-slate-300"
              >
                TỔNG CỘNG THEO CHI NHÁNH ({filteredItems.length} MÃ)
              </td>

              {visibleBranches.map((b) => {
                const bTotal = columnTotals.totals[b.id];
                return (
                  <td key={b.id} className="p-3 text-center border-r border-slate-300">
                    {displayMode === 'all' && (
                      <div className="text-[11px] space-y-0.5">
                        <div className="text-emerald-700 font-bold">
                          +{bTotal?.in.toLocaleString('vi-VN')}
                        </div>
                        <div className="text-amber-700 font-bold">
                          -{bTotal?.out.toLocaleString('vi-VN')}
                        </div>
                        <div className="text-blue-950 font-black text-xs border-t border-slate-300 pt-0.5">
                          {bTotal?.ending.toLocaleString('vi-VN')}
                        </div>
                      </div>
                    )}
                    {displayMode === 'ending' && (
                      <span className="text-sm font-black text-blue-950">
                        {bTotal?.ending.toLocaleString('vi-VN')}
                      </span>
                    )}
                    {displayMode === 'in' && (
                      <span className="text-sm font-black text-emerald-700">
                        +{bTotal?.in.toLocaleString('vi-VN')}
                      </span>
                    )}
                    {displayMode === 'out' && (
                      <span className="text-sm font-black text-amber-700">
                        -{bTotal?.out.toLocaleString('vi-VN')}
                      </span>
                    )}
                  </td>
                );
              })}

              <td className="p-3 text-right bg-blue-100/70 text-blue-950 font-black text-base">
                {columnTotals.grandEnding.toLocaleString('vi-VN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
