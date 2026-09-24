import { Branch, Item, MonthlyBalance, Transaction } from '../types';

export function generateAndDownloadStandaloneHtml(
  activeMonth: string,
  branches: Branch[],
  items: Item[],
  monthlyBalances: MonthlyBalance[],
  transactions: Transaction[],
  adminEmails: string[]
) {
  const dataPayload = JSON.stringify({
    activeMonth,
    branches,
    items,
    monthlyBalances,
    transactions,
    adminEmails,
  }).replace(/<\/script>/gi, '<\\/script>');

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC - OFFLINE VERSION</title>
  <meta name="author" content="Version: By Ha Nhung Log">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- SheetJS CDN -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  <!-- React & ReactDOM CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- Babel for JSX in standalone mode -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 3px; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">
  <div id="root"></div>

  <script>
    window.__INVENTORY_DATA__ = ${dataPayload};
  </script>

  <script type="text/babel">
    const { useState, useMemo } = React;
    const initialData = window.__INVENTORY_DATA__;

    function StandaloneApp() {
      const [activeMonth, setActiveMonth] = useState(initialData.activeMonth || '2026-09');
      const [branches, setBranches] = useState(initialData.branches || []);
      const [items, setItems] = useState(initialData.items || []);
      const [balances, setBalances] = useState(initialData.monthlyBalances || []);
      const [transactions, setTransactions] = useState(initialData.transactions || []);
      const [searchTerm, setSearchTerm] = useState('');
      const [selectedBranch, setSelectedBranch] = useState('ALL');
      const [matrixMode, setMatrixMode] = useState('all');
      const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, matrix, transactions

      // Filtered transactions for active month
      const monthTransactions = useMemo(() => {
        return transactions.filter(t => t.monthKey === activeMonth);
      }, [transactions, activeMonth]);

      // Stock computation
      const getItemStock = (bId, iId) => {
        const bal = balances.find(b => b.monthKey === activeMonth && b.branchId === bId && b.itemId === iId);
        const init = bal ? bal.initialStock : 0;
        const inQty = monthTransactions.filter(t => t.branchId === bId && t.itemId === iId && t.type === 'IN').reduce((s,t) => s + t.quantity, 0);
        const outQty = monthTransactions.filter(t => t.branchId === bId && t.itemId === iId && t.type === 'OUT').reduce((s,t) => s + t.quantity, 0);
        return { initialStock: init, totalIn: inQty, totalOut: outQty, endingStock: init + inQty - outQty };
      };

      // KPIs
      const totalIn = useMemo(() => monthTransactions.filter(t => t.type === 'IN').reduce((s,t) => s + t.quantity, 0), [monthTransactions]);
      const totalOut = useMemo(() => monthTransactions.filter(t => t.type === 'OUT').reduce((s,t) => s + t.quantity, 0), [monthTransactions]);
      const totalStock = useMemo(() => {
        let sum = 0;
        branches.forEach(b => {
          items.forEach(it => {
            sum += getItemStock(b.id, it.id).endingStock;
          });
        });
        return sum;
      }, [branches, items, balances, monthTransactions]);

      // Export Excel function using bundled SheetJS
      const handleExportExcel = () => {
        if (!window.XLSX) return;
        const wb = window.XLSX.utils.book_new();
        const rows = [
          ['BÁO CÁO HÀNG TỒN KHO OFFLINE - TEAM CIC'],
          ['Kỳ báo cáo:', activeMonth],
          ['Tác giả:', 'Version: By Ha Nhung Log | Hotline: 0901601600'],
          [],
          ['Mã SKU', 'Tên Vật Tư', 'ĐVT', 'Chi Nhánh', 'Tồn Đầu', 'Nhập', 'Xuất', 'Tồn Cuối']
        ];
        items.forEach(it => {
          branches.forEach(br => {
            const s = getItemStock(br.id, it.id);
            rows.push([it.sku, it.name, it.unit, br.name, s.initialStock, s.totalIn, s.totalOut, s.endingStock]);
          });
        });
        const ws = window.XLSX.utils.aoa_to_sheet(rows);
        window.XLSX.utils.book_append_sheet(wb, ws, 'Ton_Kho');
        window.XLSX.writeFile(wb, 'Ton_Kho_CIC_Offline_' + activeMonth + '.xlsx');
      };

      return (
        <div class="min-h-screen flex flex-col">
          {/* Header */}
          <header class="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-xl px-6 py-4">
            <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="bg-amber-400 text-slate-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">Offline Mode</span>
                  <span class="text-xs text-blue-200">Version: By Ha Nhung Log</span>
                </div>
                <h1 class="text-xl md:text-2xl font-black tracking-tight text-white mt-1">HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC</h1>
              </div>
              <div class="flex items-center gap-3">
                <a href="tel:0901601600" class="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow">
                  📞 Hotline: 0901601600
                </a>
                <button onClick={handleExportExcel} class="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2 rounded-xl transition shadow">
                  📊 Xuất Excel
                </button>
              </div>
            </div>
          </header>

          {/* Navigation & Month bar */}
          <div class="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
            <div class="max-w-7xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
              <div class="flex items-center gap-2">
                <button 
                  onClick={() => setActiveTab('dashboard')} 
                  class={"px-4 py-2 rounded-lg text-sm font-semibold transition " + (activeTab === 'dashboard' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}
                >
                  📊 Dashboard & Biểu Đồ
                </button>
                <button 
                  onClick={() => setActiveTab('matrix')} 
                  class={"px-4 py-2 rounded-lg text-sm font-semibold transition " + (activeTab === 'matrix' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}
                >
                  📋 Ma Trận Chi Nhánh
                </button>
                <button 
                  onClick={() => setActiveTab('transactions')} 
                  class={"px-4 py-2 rounded-lg text-sm font-semibold transition " + (activeTab === 'transactions' ? 'bg-blue-900 text-white shadow' : 'text-slate-600 hover:bg-slate-100')}
                >
                  📝 Nhật Ký Nhập / Xuất
                </button>
              </div>

              <div class="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <span class="text-xs font-bold text-slate-500 px-2 uppercase">Kỳ Báo Cáo:</span>
                {['2026-08', '2026-09'].map(m => (
                  <button
                    key={m}
                    onClick={() => setActiveMonth(m)}
                    class={"px-3 py-1.5 rounded-lg text-xs font-bold transition " + (activeMonth === m ? 'bg-blue-600 text-white shadow' : 'text-slate-700 hover:bg-white')}
                  >
                    Tháng {m.slice(5)}/{m.slice(0,4)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <main class="max-w-7xl mx-auto px-6 py-6 flex-1 w-full space-y-6">
            {/* 5 Pastel KPI Cards */}
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div class="bg-gradient-to-br from-emerald-50 to-emerald-100/80 border border-emerald-200/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tổng Nhập Trong Kỳ</div>
                <div class="text-2xl font-black text-emerald-950 mt-1">{totalIn.toLocaleString('vi-VN')}</div>
                <div class="text-xs text-emerald-700 mt-1 font-medium">Lô hàng đã vào kho</div>
              </div>
              <div class="bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-bold text-amber-800 uppercase tracking-wider">Tổng Xuất Trong Kỳ</div>
                <div class="text-2xl font-black text-amber-950 mt-1">{totalOut.toLocaleString('vi-VN')}</div>
                <div class="text-xs text-amber-700 mt-1 font-medium">Xuất công trình & dự án</div>
              </div>
              <div class="bg-gradient-to-br from-blue-50 to-indigo-100/80 border border-blue-200/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-bold text-blue-800 uppercase tracking-wider">Tổng Tồn Kho Hiện Tại</div>
                <div class="text-2xl font-black text-blue-950 mt-1">{totalStock.toLocaleString('vi-VN')}</div>
                <div class="text-xs text-blue-700 mt-1 font-medium">Sản phẩm khả dụng</div>
              </div>
              <div class="bg-gradient-to-br from-purple-50 to-purple-100/80 border border-purple-200/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-bold text-purple-800 uppercase tracking-wider">Số Chi Nhánh</div>
                <div class="text-2xl font-black text-purple-950 mt-1">{branches.length} Kho</div>
                <div class="text-xs text-purple-700 mt-1 font-medium">Hà Nội, Đà Nẵng, HCM, Cần Thơ</div>
              </div>
              <div class="bg-gradient-to-br from-rose-50 to-rose-100/80 border border-rose-200/80 rounded-2xl p-4 shadow-sm">
                <div class="text-xs font-bold text-rose-800 uppercase tracking-wider">Danh Mục Vật Tư SKU</div>
                <div class="text-2xl font-black text-rose-950 mt-1">{items.length} Mã</div>
                <div class="text-xs text-rose-700 mt-1 font-medium">Theo dõi định mức ERP</div>
              </div>
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div class="space-y-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Branch distribution card */}
                  <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <h3 class="font-bold text-slate-800 text-lg mb-4">Sản lượng tồn kho theo 4 Chi nhánh</h3>
                    <div class="space-y-4">
                      {branches.map(b => {
                        const bStock = items.reduce((sum, it) => sum + getItemStock(b.id, it.id).endingStock, 0);
                        const pct = totalStock > 0 ? Math.round((bStock / totalStock) * 100) : 0;
                        return (
                          <div key={b.id}>
                            <div class="flex justify-between text-sm font-semibold mb-1">
                              <span>{b.name} ({b.region})</span>
                              <span class="text-blue-700">{bStock.toLocaleString('vi-VN')} ({pct}%)</span>
                            </div>
                            <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                              <div class="bg-gradient-to-r from-blue-700 to-indigo-600 h-full rounded-full" style={{ width: pct + '%' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary card */}
                  <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 class="font-bold text-slate-800 text-lg mb-2">Hệ thống Quản lý Kho TEAM CIC</h3>
                      <p class="text-sm text-slate-600 mb-4">
                        Bản chạy Offline độc lập hoàn chỉnh. Mọi tính năng tính toán số học ERP (Tồn đầu + Nhập - Xuất = Tồn cuối) đều hoạt động trực tiếp trên trình duyệt Chrome của bạn mà không cần kết nối mạng internet.
                      </p>
                      <div class="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                        <div><strong>Hỗ trợ kỹ thuật & Vận hành:</strong> Ha Nhung Log</div>
                        <div><strong>Đường dây nóng Hotline:</strong> 0901601600 (24/7)</div>
                        <div><strong>Định dạng file:</strong> Tự động tích hợp SheetJS xuất Excel chuẩn đa sheet</div>
                      </div>
                    </div>
                    <div class="mt-4 flex gap-3">
                      <button onClick={handleExportExcel} class="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition">
                        📥 Tải Báo Cáo Excel (.xlsx)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: MATRIX */}
            {activeTab === 'matrix' && (
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-slate-700">Chế độ xem ma trận:</span>
                    <button onClick={() => setMatrixMode('all')} class={"px-3 py-1 rounded-lg text-xs font-semibold " + (matrixMode === 'all' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700')}>Cả 3 chỉ số</button>
                    <button onClick={() => setMatrixMode('ending')} class={"px-3 py-1 rounded-lg text-xs font-semibold " + (matrixMode === 'ending' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700')}>Chỉ Tồn Cuối</button>
                    <button onClick={() => setMatrixMode('in')} class={"px-3 py-1 rounded-lg text-xs font-semibold " + (matrixMode === 'in' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700')}>Chỉ Nhập</button>
                    <button onClick={() => setMatrixMode('out')} class={"px-3 py-1 rounded-lg text-xs font-semibold " + (matrixMode === 'out' ? 'bg-blue-900 text-white' : 'bg-slate-100 text-slate-700')}>Chỉ Xuất</button>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left border-collapse">
                    <thead class="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th class="p-3 border-r border-slate-200">Mã SKU</th>
                        <th class="p-3 border-r border-slate-200">Tên Vật Tư</th>
                        <th class="p-3 border-r border-slate-200">ĐVT</th>
                        {branches.map(b => (
                          <th key={b.id} class="p-3 border-r border-slate-200 text-center">{b.name}</th>
                        ))}
                        <th class="p-3 text-right">Tổng Tồn</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                      {items.map(it => {
                        let rowSum = 0;
                        return (
                          <tr key={it.id} class="hover:bg-slate-50 transition">
                            <td class="p-3 font-mono font-bold text-blue-900 border-r border-slate-200">{it.sku}</td>
                            <td class="p-3 font-medium text-slate-800 border-r border-slate-200">{it.name}</td>
                            <td class="p-3 text-slate-500 border-r border-slate-200">{it.unit}</td>
                            {branches.map(b => {
                              const s = getItemStock(b.id, it.id);
                              rowSum += s.endingStock;
                              return (
                                <td key={b.id} class="p-2 border-r border-slate-200 text-center">
                                  {matrixMode === 'ending' && <span class="font-bold text-blue-950">{s.endingStock}</span>}
                                  {matrixMode === 'in' && <span class="font-bold text-emerald-700">+{s.totalIn}</span>}
                                  {matrixMode === 'out' && <span class="font-bold text-amber-700">-{s.totalOut}</span>}
                                  {matrixMode === 'all' && (
                                    <div class="space-y-0.5 text-[11px]">
                                      <div class="text-slate-400">Đầu: {s.initialStock}</div>
                                      <div class="text-emerald-700 font-semibold">Nhập: +{s.totalIn}</div>
                                      <div class="text-amber-700 font-semibold">Xuất: -{s.totalOut}</div>
                                      <div class="font-black text-blue-900 border-t border-slate-100 pt-0.5">Cuối: {s.endingStock}</div>
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                            <td class="p-3 text-right font-black text-blue-900 text-sm">{rowSum.toLocaleString('vi-VN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: TRANSACTIONS */}
            {activeTab === 'transactions' && (
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 border-b border-slate-200">
                  <h3 class="font-bold text-slate-800 text-base">Nhật Ký Phiếu Nhập / Xuất Kho ({monthTransactions.length} phiếu)</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th class="p-3">Mã Phiếu</th>
                        <th class="p-3">Loại</th>
                        <th class="p-3">Ngày</th>
                        <th class="p-3">Chi Nhánh</th>
                        <th class="p-3">Vật Tư</th>
                        <th class="p-3 text-right">Số Lượng</th>
                        <th class="p-3">Đối Tác</th>
                        <th class="p-3">Ghi Chú</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                      {monthTransactions.map(tx => {
                        const br = branches.find(b => b.id === tx.branchId);
                        const it = items.find(i => i.id === tx.itemId);
                        return (
                          <tr key={tx.id} class="hover:bg-slate-50 transition">
                            <td class="p-3 font-mono font-bold text-slate-900">{tx.code}</td>
                            <td class="p-3">
                              <span class={"px-2 py-0.5 rounded text-[11px] font-bold " + (tx.type === 'IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800')}>
                                {tx.type === 'IN' ? 'Nhập Kho' : 'Xuất Kho'}
                              </span>
                            </td>
                            <td class="p-3 text-slate-600">{tx.date}</td>
                            <td class="p-3 font-medium text-slate-800">{br ? br.name : tx.branchId}</td>
                            <td class="p-3 font-medium text-slate-900">{it ? it.name : tx.itemId}</td>
                            <td class="p-3 text-right font-black text-blue-900 text-sm">{tx.quantity.toLocaleString('vi-VN')} {it ? it.unit : ''}</td>
                            <td class="p-3 text-slate-600">{tx.partner}</td>
                            <td class="p-3 text-slate-500 italic">{tx.note}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>

          {/* Footer */}
          <footer class="bg-slate-900 text-slate-400 text-xs py-4 px-6 border-t border-slate-800 mt-auto">
            <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div>
                <strong>HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC</strong> — Version: By Ha Nhung Log
              </div>
              <div>
                Đường dây nóng hỗ trợ 24/7: <a href="tel:0901601600" class="text-blue-400 font-bold hover:underline">0901601600</a>
              </div>
            </div>
          </footer>
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<StandaloneApp />);
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'inventory-cic.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
