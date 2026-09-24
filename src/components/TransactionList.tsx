import React, { useState, useMemo } from 'react';
import { Branch, Item, Transaction, TransactionType } from '../types';
import { Search, Filter, Edit3, Trash2, ArrowDownLeft, ArrowUpRight, ShieldAlert, FileText } from 'lucide-react';

interface TransactionListProps {
  activeMonth: string;
  transactions: Transaction[];
  branches: Branch[];
  items: Item[];
  isAdmin: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  activeMonth,
  transactions,
  branches,
  items,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [monthScope, setMonthScope] = useState<'current' | 'all'>('current');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Month scope
      if (monthScope === 'current' && t.monthKey !== activeMonth) return false;

      // Type filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      // Branch filter
      if (branchFilter !== 'ALL' && t.branchId !== branchFilter) return false;

      // Search
      if (searchTerm) {
        const item = items.find((i) => i.id === t.itemId);
        const branch = branches.find((b) => b.id === t.branchId);
        const term = searchTerm.toLowerCase();

        const matchCode = t.code.toLowerCase().includes(term);
        const matchItem = item?.name.toLowerCase().includes(term) || item?.sku.toLowerCase().includes(term);
        const matchBranch = branch?.name.toLowerCase().includes(term);
        const matchPartner = t.partner.toLowerCase().includes(term);
        const matchNote = t.note.toLowerCase().includes(term);

        if (!matchCode && !matchItem && !matchBranch && !matchPartner && !matchNote) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, activeMonth, monthScope, typeFilter, branchFilter, searchTerm, items, branches]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Filters Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã phiếu, đối tác, vật tư..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tất Cả
            </button>
            <button
              onClick={() => setTypeFilter('IN')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                typeFilter === 'IN' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" /> Nhập Kho
            </button>
            <button
              onClick={() => setTypeFilter('OUT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                typeFilter === 'OUT' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" /> Xuất Kho
            </button>
          </div>

          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          >
            <option value="ALL">Mọi Chi Nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Scope Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMonthScope('current')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              monthScope === 'current' ? 'bg-blue-900 text-white shadow' : 'text-slate-600'
            }`}
          >
            Chỉ Tháng Này
          </button>
          <button
            onClick={() => setMonthScope('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              monthScope === 'all' ? 'bg-blue-900 text-white shadow' : 'text-slate-600'
            }`}
          >
            Toàn Lịch Sử
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th className="p-3.5 font-bold uppercase tracking-wider w-12 text-center">STT</th>
              <th className="p-3.5 font-bold uppercase tracking-wider min-w-[130px]">Mã Phiếu</th>
              <th className="p-3.5 font-bold uppercase tracking-wider min-w-[100px]">Loại</th>
              <th className="p-3.5 font-bold uppercase tracking-wider min-w-[110px]">Ngày Phát Sinh</th>
              <th className="p-3.5 font-bold uppercase tracking-wider min-w-[160px]">Chi Nhánh</th>
              <th className="p-3.5 font-bold uppercase tracking-wider min-w-[200px]">Vật Tư / SKU</th>
              <th className="p-3.5 font-bold uppercase tracking-wider text-right min-w-[110px]">Số Lượng</th>
              <th className="p-3.5 font-bold uppercase tracking-wider min-w-[180px]">Nguồn Hàng / Đối Tác</th>
              <th className="p-3.5 font-bold uppercase tracking-wider min-w-[160px]">Ghi Chú</th>
              <th className="p-3.5 font-bold uppercase tracking-wider text-center w-28">Thao Tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-500 font-medium">
                  Chưa có phiếu giao dịch nào được ghi nhận cho bộ lọc này.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx, idx) => {
                const branch = branches.find((b) => b.id === tx.branchId);
                const item = items.find((i) => i.id === tx.itemId);
                const isEntryIn = tx.type === 'IN';

                return (
                  <tr key={tx.id} className="hover:bg-blue-50/40 transition">
                    <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>

                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                        {tx.code}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isEntryIn
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {isEntryIn ? (
                          <>
                            <ArrowDownLeft className="w-3 h-3" /> Nhập Kho (NK)
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3 h-3" /> Xuất Kho (XK)
                          </>
                        )}
                      </span>
                    </td>

                    <td className="p-3 font-semibold text-slate-700">{tx.date}</td>

                    <td className="p-3">
                      <span className="font-bold text-slate-800">{branch?.name || tx.branchId}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        Mã: {branch?.code} ({branch?.region})
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item?.name || tx.itemId}</div>
                      <div className="text-[10px] font-mono text-blue-800">SKU: {item?.sku}</div>
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`text-sm font-black ${
                          isEntryIn ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isEntryIn ? '+' : '-'}
                        {tx.quantity.toLocaleString('vi-VN')}
                      </span>
                      <span className="text-xs text-slate-500 font-medium ml-1">
                        {item?.unit || ''}
                      </span>
                    </td>

                    <td className="p-3 text-slate-700 font-medium">{tx.partner || '—'}</td>

                    <td className="p-3 text-slate-500 italic max-w-xs truncate">
                      {tx.note || '—'}
                    </td>

                    {/* Actions: Edit / Delete with RBAC guard */}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={isAdmin ? () => onEdit(tx) : undefined}
                          disabled={!isAdmin}
                          className={`p-1.5 rounded-lg transition ${
                            isAdmin
                              ? 'text-blue-600 hover:text-blue-800 hover:bg-blue-100'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                          title={isAdmin ? 'Chỉnh sửa phiếu' : 'Bạn chỉ có quyền xem dữ liệu'}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={isAdmin ? () => onDelete(tx) : undefined}
                          disabled={!isAdmin}
                          className={`p-1.5 rounded-lg transition ${
                            isAdmin
                              ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-100'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                          title={isAdmin ? 'Xóa phiếu' : 'Bạn chỉ có quyền xem dữ liệu'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>
          Hiển thị <strong>{filteredTransactions.length}</strong> phiếu giao dịch
        </span>
        {!isAdmin && (
          <span className="flex items-center gap-1 text-amber-700 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Bạn đang ở chế độ Chỉ Xem (Read-only)
          </span>
        )}
      </div>
    </div>
  );
};
