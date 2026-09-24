import React, { useState, useEffect, useMemo } from 'react';
import { Branch, Item, MonthlyBalance, Transaction, TransactionType } from '../types';
import { generateTransactionCode, getItemBranchStock } from '../services/inventoryService';
import { X, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }) => void;
  initialType: TransactionType;
  editingTransaction?: Transaction | null;
  activeMonth: string;
  branches: Branch[];
  items: Item[];
  monthlyBalances: MonthlyBalance[];
  transactions: Transaction[];
  currentUserEmail?: string;
  isAdmin: boolean;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialType,
  editingTransaction,
  activeMonth,
  branches,
  items,
  monthlyBalances,
  transactions,
  currentUserEmail,
  isAdmin,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [code, setCode] = useState('');
  const [date, setDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [itemId, setItemId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [partner, setPartner] = useState('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Sync state when modal opens or editingTransaction changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setType(editingTransaction.type);
      setCode(editingTransaction.code);
      setDate(editingTransaction.date);
      setBranchId(editingTransaction.branchId);
      setItemId(editingTransaction.itemId);
      setQuantity(editingTransaction.quantity);
      setPartner(editingTransaction.partner);
      setNote(editingTransaction.note);
      setErrorMsg('');
    } else {
      const today = new Date();
      // Keep inside activeMonth if possible
      const [year, month] = activeMonth.split('-');
      const defaultDate = `${year}-${month}-${String(today.getDate()).padStart(2, '0')}`;
      
      const defaultType = initialType;
      const initialBranchId = branches[0]?.id || '';
      const initialItemId = items[0]?.id || '';
      const autoCode = generateTransactionCode(defaultType, defaultDate, transactions);

      setType(defaultType);
      setCode(autoCode);
      setDate(defaultDate);
      setBranchId(initialBranchId);
      setItemId(initialItemId);
      setQuantity('');
      setPartner('');
      setNote('');
      setErrorMsg('');
    }
  }, [isOpen, editingTransaction, initialType, activeMonth, branches, items, transactions]);

  // Recalculate code when type or date changes (only if creating new)
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (!editingTransaction && date) {
      setCode(generateTransactionCode(newType, date, transactions));
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (!editingTransaction && newDate) {
      setCode(generateTransactionCode(type, newDate, transactions));
    }
  };

  // Selected item and branch
  const selectedItem = useMemo(() => items.find((i) => i.id === itemId), [items, itemId]);
  const selectedBranch = useMemo(() => branches.find((b) => b.id === branchId), [branches, branchId]);

  // Calculate available stock at the selected branch
  const availableStock = useMemo(() => {
    if (!selectedBranch || !selectedItem) return 0;
    const stock = getItemBranchStock(activeMonth, selectedBranch, selectedItem, monthlyBalances, transactions);
    // If editing existing transaction of type OUT, add back its quantity
    if (editingTransaction && editingTransaction.type === 'OUT' && editingTransaction.itemId === itemId && editingTransaction.branchId === branchId) {
      return stock.endingStock + editingTransaction.quantity;
    }
    return stock.endingStock;
  }, [selectedBranch, selectedItem, activeMonth, monthlyBalances, transactions, editingTransaction, itemId, branchId]);

  // Validation
  const numericQuantity = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 0;
  const isOverStock = type === 'OUT' && numericQuantity > availableStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Bạn chỉ có quyền xem dữ liệu (Chỉ Quản trị viên mới được lập hoặc sửa phiếu)!');
      return;
    }

    if (!code.trim()) {
      setErrorMsg('Mã phiếu không được để trống.');
      return;
    }
    if (!date) {
      setErrorMsg('Vui lòng chọn ngày giao dịch.');
      return;
    }
    if (!branchId) {
      setErrorMsg('Vui lòng chọn chi nhánh kho.');
      return;
    }
    if (!itemId) {
      setErrorMsg('Vui lòng chọn mã vật tư.');
      return;
    }
    if (numericQuantity <= 0) {
      setErrorMsg('Số lượng phải lớn hơn 0.');
      return;
    }

    const monthKey = date.slice(0, 7);

    onSubmit({
      id: editingTransaction ? editingTransaction.id : undefined,
      code: code.trim(),
      type,
      date,
      monthKey,
      branchId,
      itemId,
      quantity: numericQuantity,
      partner: partner.trim() || (type === 'IN' ? 'Nhà cung cấp' : 'Khách hàng / Công trình'),
      note: note.trim(),
      createdBy: editingTransaction ? editingTransaction.createdBy : currentUserEmail || 'admin@cic.com',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between text-white ${
            type === 'IN'
              ? 'bg-gradient-to-r from-emerald-800 to-teal-700'
              : 'bg-gradient-to-r from-amber-700 to-orange-700'
          }`}
        >
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/80">
              {editingTransaction ? 'Hiệu Chỉnh Dữ Liệu' : 'Lập Phiếu Giao Dịch ERP'}
            </div>
            <h2 className="text-xl font-black">
              {editingTransaction
                ? `Sửa Phiếu ${editingTransaction.code}`
                : type === 'IN'
                ? 'Lập Phiếu Nhập Kho Mới (NK)'
                : 'Lập Phiếu Xuất Kho Mới (XK)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only warning if non-admin */}
        {!isAdmin && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Bạn chỉ có quyền xem dữ liệu. Vui lòng đăng nhập tài khoản Quản trị viên để lưu thay đổi!</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Toggle (IN / OUT) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Loại Giao Dịch
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('IN')}
                className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition flex items-center justify-center gap-2 ${
                  type === 'IN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>📥 Nhập Kho (NK)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('OUT')}
                className={`py-2.5 rounded-xl font-bold text-xs sm:text-sm border transition flex items-center justify-center gap-2 ${
                  type === 'OUT'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>📤 Xuất Kho (XK)</span>
              </button>
            </div>
          </div>

          {/* Row 1: Code & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã Phiếu (Tự động) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày Giao Dịch <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Branch & Item */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chi Nhánh Kho <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code} - {b.region})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Vật Tư / Hàng Hóa (SKU) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    [{it.sku}] {it.name} ({it.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Stock Indicator Box (Especially critical for Xuất kho) */}
          <div
            className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
              type === 'OUT'
                ? isOverStock
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {isOverStock ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
              )}
              <div>
                <div className="font-bold">
                  Tồn kho khả dụng tại {selectedBranch?.name || 'Chi nhánh'}:
                </div>
                <div className="text-[11px] opacity-80">
                  {selectedItem?.name} ({selectedItem?.sku})
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-black">
                {availableStock.toLocaleString('vi-VN')} {selectedItem?.unit}
              </span>
              {type === 'OUT' && (
                <div className="text-[10px] font-semibold text-slate-600">
                  Sau xuất: {(availableStock - numericQuantity).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>

          {/* Warning banner if xuất vượt tồn */}
          {isOverStock && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>
                CẢNH BÁO: Số lượng xuất ({numericQuantity} {selectedItem?.unit}) vượt quá tồn kho khả dụng ({availableStock} {selectedItem?.unit})! Vui lòng kiểm tra lại.
              </span>
            </div>
          )}

          {/* Row 3: Quantity & Partner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Lượng ({selectedItem?.unit || 'Đơn vị'}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="Nhập số lượng..."
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className={`w-full px-3.5 py-2.5 rounded-xl border font-bold text-base text-slate-900 focus:outline-none ${
                  isOverStock
                    ? 'border-rose-400 bg-rose-50/50 focus:ring-2 focus:ring-rose-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-blue-600'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'IN' ? 'Nguồn Hàng / Người Giao' : 'Người Nhận / Dự Án / Khách Hàng'}
              </label>
              <input
                type="text"
                placeholder={type === 'IN' ? 'Ví dụ: Tập đoàn Hòa Phát...' : 'Ví dụ: Đội thi công hầm chui...'}
                value={partner}
                onChange={(e) => setPartner(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi Chú Nghiệp Vụ
            </label>
            <input
              type="text"
              placeholder="Ghi chú chi tiết mục đích nhập/xuất hoặc hợp đồng..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              HỦY
            </button>
            <button
              type="submit"
              disabled={!isAdmin}
              className={`px-6 py-2.5 rounded-xl font-bold text-white transition shadow-lg ${
                isAdmin
                  ? type === 'IN'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 active:scale-95'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30 active:scale-95'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              {editingTransaction ? 'CẬP NHẬT PHIẾU' : type === 'IN' ? 'LƯU PHIẾU NHẬP' : 'LƯU PHIẾU XUẤT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
