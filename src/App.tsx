/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { 
  User, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  collection, 
  setDoc, 
  getDocs, 
  deleteDoc 
} from 'firebase/firestore';

import { 
  auth, 
  db, 
  loginWithGoogle, 
  logoutUser, 
  handleFirestoreError, 
  OperationType 
} from './firebase';

import { 
  Branch, 
  Item, 
  MonthlyBalance, 
  Transaction, 
  TransactionType 
} from './types';

import { 
  INITIAL_BRANCHES, 
  INITIAL_ITEMS, 
  INITIAL_MONTHLY_BALANCES, 
  INITIAL_TRANSACTIONS 
} from './data/initialData';

import { 
  DEFAULT_ADMIN_EMAILS, 
  isUserAdmin 
} from './config/adminConfig';

import { 
  calculateKpis, 
  executeMonthlyCarryForward, 
  getMonthLabel 
} from './services/inventoryService';

import { 
  exportToMultiSheetExcel, 
  exportToUtf8Csv 
} from './services/excelService';

import { 
  syncToGoogleSheetsWebhook 
} from './services/googleSheetsService';

import { 
  generateAndDownloadStandaloneHtml 
} from './services/standaloneHtmlService';

// Components
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { MatrixReport } from './components/MatrixReport';
import { TransactionList } from './components/TransactionList';
import { TransactionModal } from './components/TransactionModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CarryForwardModal } from './components/CarryForwardModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { FirestoreRulesModal } from './components/FirestoreRulesModal';
import { AdminConfigModal } from './components/AdminConfigModal';

import { 
  BarChart3, 
  Table2, 
  FileText, 
  Building, 
  Package, 
  Plus, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Phone
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [customAdmins, setCustomAdmins] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cic_custom_admins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Main Inventory Data State
  const [branches, setBranches] = useState<Branch[]>(() => {
    try {
      const saved = localStorage.getItem('cic_branches');
      return saved ? JSON.parse(saved) : INITIAL_BRANCHES;
    } catch {
      return INITIAL_BRANCHES;
    }
  });

  const [items, setItems] = useState<Item[]>(() => {
    try {
      const saved = localStorage.getItem('cic_items');
      return saved ? JSON.parse(saved) : INITIAL_ITEMS;
    } catch {
      return INITIAL_ITEMS;
    }
  });

  const [monthlyBalances, setMonthlyBalances] = useState<MonthlyBalance[]>(() => {
    try {
      const saved = localStorage.getItem('cic_monthly_balances');
      return saved ? JSON.parse(saved) : INITIAL_MONTHLY_BALANCES;
    } catch {
      return INITIAL_MONTHLY_BALANCES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('cic_transactions');
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Settings & Navigation
  const [activeMonth, setActiveMonth] = useState('2026-09');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'matrix' | 'transactions' | 'catalog'>('dashboard');

  const [webhookUrl, setWebhookUrl] = useState(() => {
    return localStorage.getItem('cic_webhook_url') || '';
  });
  const [autoSyncWebhook, setAutoSyncWebhook] = useState(() => {
    return localStorage.getItem('cic_auto_sync') === 'true';
  });

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('IN');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  const [isCarryForwardOpen, setIsCarryForwardOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isGoogleSheetsOpen, setIsGoogleSheetsOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAdminConfigOpen, setIsAdminConfigOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cic_branches', JSON.stringify(branches));
      localStorage.setItem('cic_items', JSON.stringify(items));
      localStorage.setItem('cic_monthly_balances', JSON.stringify(monthlyBalances));
      localStorage.setItem('cic_transactions', JSON.stringify(transactions));
      localStorage.setItem('cic_custom_admins', JSON.stringify(customAdmins));
      localStorage.setItem('cic_webhook_url', webhookUrl);
      localStorage.setItem('cic_auto_sync', String(autoSyncWebhook));
    } catch (e) {
      console.warn('Storage sync warn:', e);
    }
  }, [branches, items, monthlyBalances, transactions, customAdmins, webhookUrl, autoSyncWebhook]);

  // Determine RBAC Admin status
  const isAdmin = useMemo(() => {
    // If not logged in, user is read-only.
    // However, for testing in development if user email matches or defaults:
    if (!currentUser) return false;
    return isUserAdmin(currentUser.email, customAdmins);
  }, [currentUser, customAdmins]);

  // Available months list derived from transactions & balances
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add('2026-08');
    set.add('2026-09');
    monthlyBalances.forEach((b) => set.add(b.monthKey));
    transactions.forEach((t) => set.add(t.monthKey));
    return Array.from(set).sort();
  }, [monthlyBalances, transactions]);

  // KPI Calculations
  const kpis = useMemo(() => {
    return calculateKpis(activeMonth, branches, items, monthlyBalances, transactions);
  }, [activeMonth, branches, items, monthlyBalances, transactions]);

  // Auth Handlers
  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        const adminCheck = isUserAdmin(user.email, customAdmins);
        showToast(
          'success',
          adminCheck
            ? `Xin chào ${user.displayName || user.email}! Bạn đã đăng nhập với quyền QUẢN TRỊ VIÊN (Admin).`
            : `Đăng nhập thành công với tài khoản ${user.email} (Quyền: Chỉ xem dữ liệu).`
        );
      }
    } catch (err: any) {
      showToast('error', 'Đăng nhập không thành công: ' + (err?.message || 'Cửa sổ đăng nhập đã bị đóng.'));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast('info', 'Đã đăng xuất. Bạn đang ở chế độ xem dữ liệu (Read-only).');
    } catch (err: any) {
      showToast('error', 'Lỗi đăng xuất: ' + err?.message);
    }
  };

  // Transaction Create / Update
  const handleSaveTransaction = async (
    txData: Omit<Transaction, 'id' | 'createdAt'> & { id?: string }
  ) => {
    if (!isAdmin) {
      showToast('error', 'Bạn chỉ có quyền xem dữ liệu (Chỉ Quản trị viên mới được lập/sửa phiếu)!');
      return;
    }

    if (txData.id) {
      // Update existing
      const updated = transactions.map((t) =>
        t.id === txData.id
          ? {
              ...t,
              code: txData.code,
              type: txData.type,
              date: txData.date,
              monthKey: txData.monthKey,
              branchId: txData.branchId,
              itemId: txData.itemId,
              quantity: txData.quantity,
              partner: txData.partner,
              note: txData.note,
            }
          : t
      );
      setTransactions(updated);
      showToast('success', `Đã cập nhật phiếu ${txData.code} thành công!`);

      // Firestore sync if connected
      try {
        await setDoc(doc(db, 'transactions', txData.id), {
          ...txData,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `transactions/${txData.id}`);
      }
    } else {
      // Create new
      const newTx: Transaction = {
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        code: txData.code,
        type: txData.type,
        date: txData.date,
        monthKey: txData.monthKey,
        branchId: txData.branchId,
        itemId: txData.itemId,
        quantity: txData.quantity,
        partner: txData.partner,
        note: txData.note,
        createdBy: currentUser?.email || 'admin@cic.com',
        createdAt: new Date().toISOString(),
      };

      const updated = [newTx, ...transactions];
      setTransactions(updated);
      showToast(
        'success',
        `Đã lập phiếu ${newTx.type === 'IN' ? 'Nhập kho' : 'Xuất kho'} ${newTx.code} thành công!`
      );

      // Firestore sync
      try {
        await setDoc(doc(db, 'transactions', newTx.id), newTx);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `transactions/${newTx.id}`);
      }

      // Auto-sync to Google Sheets Webhook if enabled
      if (autoSyncWebhook && webhookUrl) {
        syncToGoogleSheetsWebhook(
          webhookUrl,
          activeMonth,
          branches,
          items,
          monthlyBalances,
          updated
        ).then((res) => {
          if (res.success) {
            console.log('Auto-synced to Google Sheets:', res.message);
          }
        });
      }
    }
  };

  // Delete Transaction
  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    if (!isAdmin) {
      showToast('error', 'Bạn chỉ có quyền xem dữ liệu (Chỉ Quản trị viên mới được xóa phiếu)!');
      return;
    }

    const updated = transactions.filter((t) => t.id !== deletingTx.id);
    setTransactions(updated);
    showToast('info', `Đã xóa phiếu ${deletingTx.code}.`);

    try {
      await deleteDoc(doc(db, 'transactions', deletingTx.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `transactions/${deletingTx.id}`);
    }

    setDeletingTx(null);
  };

  // Monthly Carry-Forward (THÊM THÁNG MỚI)
  const handleExecuteCarryForward = (fromMonth: string, toMonth: string) => {
    if (!isAdmin) {
      showToast('error', 'Bạn chỉ có quyền xem dữ liệu (Chỉ Quản trị viên mới được kết chuyển tháng)!');
      return;
    }

    const newBalances = executeMonthlyCarryForward(
      fromMonth,
      toMonth,
      branches,
      items,
      monthlyBalances,
      transactions
    );

    setMonthlyBalances(newBalances);
    setActiveMonth(toMonth);
    showToast(
      'success',
      `Kết chuyển thành công! Toàn bộ Tồn cuối kỳ ${getMonthLabel(fromMonth)} đã trở thành Tồn đầu kỳ ${getMonthLabel(toMonth)}.`
    );

    // Save to Firestore
    try {
      newBalances
        .filter((b) => b.monthKey === toMonth)
        .forEach(async (bal) => {
          await setDoc(doc(db, 'monthlyBalances', bal.id), bal);
        });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'monthlyBalances');
    }
  };

  // Excel / CSV Import
  const handleImportExcelData = (
    newItems: Item[],
    newTransactions: Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>[]
  ) => {
    if (!isAdmin) {
      showToast('error', 'Bạn chỉ có quyền xem dữ liệu!');
      return;
    }

    let addedItemsCount = 0;
    if (newItems.length > 0) {
      const mergedItems = [...items];
      newItems.forEach((newItem) => {
        if (!mergedItems.some((i) => i.sku.toUpperCase() === newItem.sku.toUpperCase())) {
          mergedItems.push(newItem);
          addedItemsCount++;
        }
      });
      setItems(mergedItems);
    }

    let addedTxCount = 0;
    if (newTransactions.length > 0) {
      const mergedTx = [...transactions];
      newTransactions.forEach((tx) => {
        const fullTx: Transaction = {
          ...tx,
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          createdBy: currentUser?.email || 'excel_import@cic.com',
          createdAt: new Date().toISOString(),
        };
        mergedTx.unshift(fullTx);
        addedTxCount++;
      });
      setTransactions(mergedTx);
    }

    showToast(
      'success',
      `Nạp dữ liệu thành công! Đã thêm ${addedItemsCount} mã SKU mới và ${addedTxCount} phiếu giao dịch.`
    );
  };

  // Add Branch / Item Catalog
  const handleAddBranch = (name: string, code: string, region: string) => {
    if (!isAdmin) {
      showToast('error', 'Bạn chỉ có quyền xem dữ liệu!');
      return;
    }
    const newBr: Branch = {
      id: `br_${code.toLowerCase()}_${Date.now()}`,
      name,
      code: code.toUpperCase(),
      region,
    };
    setBranches([...branches, newBr]);
    showToast('success', `Đã thêm chi nhánh mới: ${name} (${code})`);
  };

  const handleAddItem = (sku: string, name: string, category: string, unit: string, minStock: number) => {
    if (!isAdmin) {
      showToast('error', 'Bạn chỉ có quyền xem dữ liệu!');
      return;
    }
    const newItem: Item = {
      id: `item_${sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      sku: sku.toUpperCase(),
      name,
      category,
      unit,
      minStock,
    };
    setItems([...items, newItem]);
    showToast('success', `Đã thêm mã vật tư SKU mới: [${sku}] ${name}`);
  };

  // Quick state for Add Branch / Item inline form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchRegion, setNewBranchRegion] = useState('Miền Bắc');

  const [newItemSku, setNewItemSku] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Sắt Thép & Kim Khí');
  const [newItemUnit, setNewItemUnit] = useState('Cái');
  const [newItemMin, setNewItemMin] = useState<number | ''>(10);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-4 duration-200">
          <div
            className={`p-4 rounded-2xl shadow-2xl border text-xs sm:text-sm font-semibold flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-500 shadow-emerald-900/40'
                : toast.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-500 shadow-rose-900/40'
                : 'bg-blue-950 text-blue-100 border-blue-500 shadow-blue-900/40'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        isAdmin={isAdmin}
        activeMonth={activeMonth}
        availableMonths={availableMonths}
        onSelectMonth={(m) => setActiveMonth(m)}
        onOpenCarryForward={() => setIsCarryForwardOpen(true)}
        onOpenTransactionModal={(type) => {
          setTxModalType(type);
          setEditingTx(null);
          setIsTxModalOpen(true);
        }}
        onExportExcel={() =>
          exportToMultiSheetExcel(activeMonth, branches, items, monthlyBalances, transactions)
        }
        onExportCsv={() =>
          exportToUtf8Csv(activeMonth, branches, items, monthlyBalances, transactions)
        }
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenGoogleSheetsModal={() => setIsGoogleSheetsOpen(true)}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onOpenAdminConfigModal={() => setIsAdminConfigOpen(true)}
        onDownloadStandaloneHtml={() =>
          generateAndDownloadStandaloneHtml(
            activeMonth,
            branches,
            items,
            monthlyBalances,
            transactions,
            [...DEFAULT_ADMIN_EMAILS, ...customAdmins]
          )
        }
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* RBAC Notice Banner if not logged in or read-only */}
      {!isAdmin && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                {currentUser
                  ? `Tài khoản ${currentUser.email} đang ở chế độ CHỈ XEM (Read-only). Các nút thêm/sửa/xóa bị khóa.`
                  : 'Bạn đang truy cập ở chế độ KHÁCH XEM (Read-only). Vui lòng đăng nhập với tài khoản Quản trị viên để thực hiện thao tác nhập/xuất kho.'}
              </span>
            </div>
            {!currentUser && (
              <button
                onClick={handleLogin}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-1 rounded-lg transition active:scale-95 flex-shrink-0"
              >
                Đăng Nhập Google (Admin)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto scrollbar-none py-2 gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard & Biểu Đồ</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Table2 className="w-4 h-4" />
              <span>Báo Cáo Ma Trận 4 Chi Nhánh</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Sổ Phiếu Nhập / Xuất ({transactions.filter((t) => t.monthKey === activeMonth).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'catalog'
                  ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Danh Mục SKU & Chi Nhánh</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Kỳ đang mở:</span>
            <span className="font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
              {getMonthLabel(activeMonth)}
            </span>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* TAB 1: DASHBOARD & BIỂU ĐỒ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 5 Pastel KPI Cards */}
            <KpiCards kpis={kpis} monthName={getMonthLabel(activeMonth)} />

            {/* 4 Interactive SVG Visual Charts */}
            <ChartsSection
              activeMonth={activeMonth}
              availableMonths={availableMonths}
              branches={branches}
              items={items}
              monthlyBalances={monthlyBalances}
              transactions={transactions}
            />

            {/* Quick overview of latest activity */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">
                  Cần lập thêm phiếu xuất kho hoặc kết chuyển sang tháng kế tiếp?
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hệ thống tự động đồng bộ thời gian thực theo chuẩn ERP và cảnh báo ngay khi xuất vượt tồn kho an toàn.
                </p>
              </div>
              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={
                    isAdmin
                      ? () => {
                          setTxModalType('IN');
                          setEditingTx(null);
                          setIsTxModalOpen(true);
                        }
                      : undefined
                  }
                  disabled={!isAdmin}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                    isAdmin
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Lập Phiếu Nhập
                </button>
                <button
                  onClick={
                    isAdmin
                      ? () => {
                          setTxModalType('OUT');
                          setEditingTx(null);
                          setIsTxModalOpen(true);
                        }
                      : undefined
                  }
                  disabled={!isAdmin}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow ${
                    isAdmin
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-700/20 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> Lập Phiếu Xuất
                </button>
                <button
                  onClick={() => setActiveTab('matrix')}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  Xem Ma Trận Chi Tiết →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BÁO CÁO MA TRẬN 4 CHI NHÁNH */}
        {activeTab === 'matrix' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  BÁO CÁO MA TRẬN TỒN KHO ĐA CHI NHÁNH
                </h2>
                <p className="text-xs text-slate-500">
                  Phân tích 2 chiều: Danh mục vật tư (SKU) x 4 Chi nhánh kho ({getMonthLabel(activeMonth)})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    exportToMultiSheetExcel(activeMonth, branches, items, monthlyBalances, transactions)
                  }
                  className="bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow active:scale-95"
                >
                  📊 Xuất Excel Ma Trận
                </button>
              </div>
            </div>

            <MatrixReport
              activeMonth={activeMonth}
              branches={branches}
              items={items}
              monthlyBalances={monthlyBalances}
              transactions={transactions}
            />
          </div>
        )}

        {/* TAB 3: NHẬT KÝ NHẬP / XUẤT KHO */}
        {activeTab === 'transactions' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  SỔ CHI TIẾT PHIẾU NHẬP KHO & XUẤT KHO
                </h2>
                <p className="text-xs text-slate-500">
                  Quản lý toàn bộ giao dịch luân chuyển vật tư, người giao, người nhận và định danh phiếu ERP
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={
                    isAdmin
                      ? () => {
                          setTxModalType('IN');
                          setEditingTx(null);
                          setIsTxModalOpen(true);
                        }
                      : undefined
                  }
                  disabled={!isAdmin}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                    isAdmin
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  + Phiếu Nhập Mới
                </button>
                <button
                  onClick={
                    isAdmin
                      ? () => {
                          setTxModalType('OUT');
                          setEditingTx(null);
                          setIsTxModalOpen(true);
                        }
                      : undefined
                  }
                  disabled={!isAdmin}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                    isAdmin
                      ? 'bg-amber-600 hover:bg-amber-700 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  + Phiếu Xuất Mới
                </button>
              </div>
            </div>

            <TransactionList
              activeMonth={activeMonth}
              transactions={transactions}
              branches={branches}
              items={items}
              isAdmin={isAdmin}
              onEdit={(tx) => {
                setEditingTx(tx);
                setTxModalType(tx.type);
                setIsTxModalOpen(true);
              }}
              onDelete={(tx) => {
                setDeletingTx(tx);
                setIsDeleteModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB 4: DANH MỤC SKU & CHI NHÁNH */}
        {activeTab === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Section 1: Chi Nhánh Kho */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-700" />
                    Danh Sách 4 Chi Nhánh Tiêu Chuẩn & Mạng Lưới Kho
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hỗ trợ thêm chi nhánh mới linh hoạt theo nhu cầu mở rộng mạng lưới
                  </p>
                </div>
              </div>

              {/* Branch Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {branches.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-blue-50/30 transition hover:border-blue-300"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white bg-blue-900 px-2 py-0.5 rounded">
                        Mã: {b.code}
                      </span>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        {b.region}
                      </span>
                    </div>
                    <div className="font-extrabold text-slate-900 text-sm">{b.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {b.isDefault ? 'Chi nhánh tiêu chuẩn hệ thống' : 'Chi nhánh mở rộng'}
                    </div>
                  </div>
                ))}
              </div>

              {/* Inline Add Branch (Admin only) */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    + Thêm Chi Nhánh Kho Mới
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <input
                      type="text"
                      placeholder="Tên chi nhánh (VD: Hải Phòng - Kho Đông Bắc)..."
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:col-span-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Mã (VD: HP hoặc R3)..."
                      value={newBranchCode}
                      onChange={(e) => setNewBranchCode(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <select
                      value={newBranchRegion}
                      onChange={(e) => setNewBranchRegion(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Miền Bắc">Miền Bắc</option>
                      <option value="Miền Trung">Miền Trung</option>
                      <option value="Miền Nam">Miền Nam</option>
                      <option value="Tây Nam Bộ">Tây Nam Bộ</option>
                      <option value="Tây Nguyên">Tây Nguyên</option>
                    </select>
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newBranchName || !newBranchCode) {
                          showToast('error', 'Vui lòng nhập tên và mã chi nhánh!');
                          return;
                        }
                        handleAddBranch(newBranchName, newBranchCode, newBranchRegion);
                        setNewBranchName('');
                        setNewBranchCode('');
                      }}
                      className="bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95"
                    >
                      Lưu Chi Nhánh Mới
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Danh Mục Vật Tư SKU */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-700" />
                    Danh Mục Vật Tư & Mã SKU ({items.length} mã)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Quản lý thông số đơn vị tính, nhóm hàng và định mức tồn kho tối thiểu (Min Stock)
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3">Mã SKU</th>
                      <th className="p-3">Tên Vật Tư / Hàng Hóa</th>
                      <th className="p-3">Nhóm Hàng</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3 text-right">Định Mức Tồn Min</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-900">{it.sku}</td>
                        <td className="p-3 font-bold text-slate-800">{it.name}</td>
                        <td className="p-3 text-slate-600">{it.category}</td>
                        <td className="p-3 text-center font-medium text-slate-600">{it.unit}</td>
                        <td className="p-3 text-right font-black text-blue-950">
                          {it.minStock} {it.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Inline Add Item (Admin only) */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    + Thêm Mã Vật Tư SKU Mới
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    <input
                      type="text"
                      placeholder="Mã SKU (VD: THEP-D20)..."
                      value={newItemSku}
                      onChange={(e) => setNewItemSku(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Tên vật tư (VD: Thép Vằn D20 Hòa Phát)..."
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs sm:col-span-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="ĐVT (Cây, Tấn, Thùng)..."
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Tồn tối thiểu..."
                      value={newItemMin}
                      onChange={(e) =>
                        setNewItemMin(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                  <div className="mt-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (!newItemSku || !newItemName) {
                          showToast('error', 'Vui lòng nhập đầy đủ mã SKU và tên vật tư!');
                          return;
                        }
                        handleAddItem(
                          newItemSku,
                          newItemName,
                          newItemCategory,
                          newItemUnit || 'Cái',
                          typeof newItemMin === 'number' ? newItemMin : 10
                        );
                        setNewItemSku('');
                        setNewItemName('');
                      }}
                      className="bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow active:scale-95"
                    >
                      Lưu Mã SKU Mới
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 px-4 sm:px-6 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <div className="font-extrabold text-white text-sm">
              HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC
            </div>
            <div className="text-slate-400 mt-1">
              Phát triển và vận hành chuyên sâu cho Logistics & Quản trị kho — <strong>Version: By Ha Nhung Log</strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:0901601600"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Hotline 24/7: 0901601600</span>
            </a>

            <button
              onClick={() =>
                generateAndDownloadStandaloneHtml(
                  activeMonth,
                  branches,
                  items,
                  monthlyBalances,
                  transactions,
                  [...DEFAULT_ADMIN_EMAILS, ...customAdmins]
                )
              }
              className="text-amber-400 hover:text-amber-300 font-semibold bg-slate-800/80 px-3 py-1.5 rounded-xl border border-amber-500/30 transition"
            >
              💾 Tải file HTML Offline
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Transaction Modal (Create / Edit) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSubmit={handleSaveTransaction}
        initialType={txModalType}
        editingTransaction={editingTx}
        activeMonth={activeMonth}
        branches={branches}
        items={items}
        monthlyBalances={monthlyBalances}
        transactions={transactions}
        currentUserEmail={currentUser?.email || undefined}
        isAdmin={isAdmin}
      />

      {/* 2. Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingTx ? `${deletingTx.code} (${deletingTx.date})` : undefined}
      />

      {/* 3. Carry Forward Modal */}
      <CarryForwardModal
        isOpen={isCarryForwardOpen}
        onClose={() => setIsCarryForwardOpen(false)}
        activeMonth={activeMonth}
        branches={branches}
        items={items}
        monthlyBalances={monthlyBalances}
        transactions={transactions}
        onConfirm={handleExecuteCarryForward}
      />

      {/* 4. Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportData={handleImportExcelData}
      />

      {/* 5. Google Sheets Webhook Modal */}
      <GoogleSheetsModal
        isOpen={isGoogleSheetsOpen}
        onClose={() => setIsGoogleSheetsOpen(false)}
        webhookUrl={webhookUrl}
        autoSync={autoSyncWebhook}
        onSaveConfig={(url, auto) => {
          setWebhookUrl(url);
          setAutoSyncWebhook(auto);
          showToast('success', 'Đã lưu cấu hình Google Sheets Webhook!');
        }}
        activeMonth={activeMonth}
        branches={branches}
        items={items}
        monthlyBalances={monthlyBalances}
        transactions={transactions}
      />

      {/* 6. Firestore Rules Security Modal */}
      <FirestoreRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        customAdmins={customAdmins}
      />

      {/* 7. Admin Configuration Modal */}
      <AdminConfigModal
        isOpen={isAdminConfigOpen}
        onClose={() => setIsAdminConfigOpen(false)}
        customAdmins={customAdmins}
        onAddAdmin={(email) => {
          setCustomAdmins([...customAdmins, email]);
          showToast('success', `Đã phân quyền Admin cho ${email}`);
        }}
        onRemoveAdmin={(email) => {
          setCustomAdmins(customAdmins.filter((e) => e !== email));
          showToast('info', `Đã thu hồi quyền Admin của ${email}`);
        }}
        currentUserEmail={currentUser?.email || undefined}
      />
    </div>
  );
}
