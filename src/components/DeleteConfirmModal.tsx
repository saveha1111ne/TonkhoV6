import React from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-black text-slate-900 mb-2">
          Xác Nhận Xóa Dữ Liệu
        </h3>

        <p className="text-sm font-semibold text-slate-700 mb-6">
          Bạn có chắc chắn muốn xóa dữ liệu này không?
          {itemName && (
            <span className="block mt-1 font-mono text-xs text-rose-600 font-bold bg-rose-50 py-1 px-2 rounded-lg border border-rose-200">
              {itemName}
            </span>
          )}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95"
          >
            HỦY
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold text-white shadow-lg shadow-rose-600/30 transition active:scale-95"
          >
            XÓA
          </button>
        </div>
      </div>
    </div>
  );
};
