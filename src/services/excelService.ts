import * as XLSX from 'xlsx';
import { Branch, Item, MonthlyBalance, Transaction } from '../types';
import { getItemBranchStock, getMonthLabel } from './inventoryService';

/**
 * Xuất Excel đa trang (.xlsx) với 6 Sheets chi tiết
 */
export function exportToMultiSheetExcel(
  monthKey: string,
  branches: Branch[],
  items: Item[],
  monthlyBalances: MonthlyBalance[],
  transactions: Transaction[]
) {
  const wb = XLSX.utils.book_new();
  const monthName = getMonthLabel(monthKey);

  // 1. SHEET TỔNG QUAN
  const monthTxs = transactions.filter((t) => t.monthKey === monthKey);
  const totalInQty = monthTxs.filter((t) => t.type === 'IN').reduce((s, t) => s + t.quantity, 0);
  const totalOutQty = monthTxs.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.quantity, 0);

  let totalEndingStock = 0;
  for (const b of branches) {
    for (const it of items) {
      const stock = getItemBranchStock(monthKey, b, it, monthlyBalances, transactions);
      totalEndingStock += stock.endingStock;
    }
  }

  const overviewData = [
    ['BÁO CÁO TỔNG QUAN HÀNG TỒN KHO - TEAM CIC'],
    ['Kỳ báo cáo:', monthName],
    ['Ngày xuất báo cáo:', new Date().toLocaleString('vi-VN')],
    ['Hệ thống:', 'HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC - Version: By Ha Nhung Log'],
    ['Hotline hỗ trợ:', '0901601600'],
    [],
    ['CHỈ SỐ KPI CHÍNH', 'GIÁ TRỊ', 'ĐƠN VỊ TÍNH'],
    ['Tổng nhập kho trong kỳ', totalInQty, 'Đơn vị sản phẩm'],
    ['Tổng xuất kho trong kỳ', totalOutQty, 'Đơn vị sản phẩm'],
    ['Tổng tồn kho toàn hệ thống', totalEndingStock, 'Đơn vị sản phẩm'],
    ['Số lượng chi nhánh quản lý', branches.length, 'Chi nhánh'],
    ['Số lượng danh mục mã vật tư (SKU)', items.length, 'Mã SKU'],
    ['Tổng số phát sinh giao dịch', monthTxs.length, 'Phiếu'],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tong_Quan_KPI');

  // 2. SHEET TỒN KHO CHI TIẾT (MA TRẬN VẬT TƯ x CHI NHÁNH)
  const matrixHeaders = [
    'STT',
    'Mã SKU',
    'Tên Vật Tư / Hàng Hóa',
    'ĐVT',
    'Nhóm Hàng',
    'Định Mức Tồn Tối Thiểu',
  ];
  for (const b of branches) {
    matrixHeaders.push(`${b.name} (Tồn Đầu)`);
    matrixHeaders.push(`${b.name} (Nhập)`);
    matrixHeaders.push(`${b.name} (Xuất)`);
    matrixHeaders.push(`${b.name} (Tồn Cuối)`);
  }
  matrixHeaders.push('TỔNG TỒN HỆ THỐNG');

  const matrixRows = items.map((it, idx) => {
    const row: any[] = [
      idx + 1,
      it.sku,
      it.name,
      it.unit,
      it.category,
      it.minStock,
    ];
    let rowTotalEnding = 0;
    for (const b of branches) {
      const stock = getItemBranchStock(monthKey, b, it, monthlyBalances, transactions);
      row.push(stock.initialStock);
      row.push(stock.totalIn);
      row.push(stock.totalOut);
      row.push(stock.endingStock);
      rowTotalEnding += stock.endingStock;
    }
    row.push(rowTotalEnding);
    return row;
  });

  const wsMatrix = XLSX.utils.aoa_to_sheet([
    [`BÁO CÁO MA TRẬN TỒN KHO ĐA CHI NHÁNH - ${monthName}`],
    [],
    matrixHeaders,
    ...matrixRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Ton_Kho_Chi_Tiet_Ma_Tran');

  // 3. SHEET SỔ CHI TIẾT NHẬP KHO
  const inTransactions = monthTxs.filter((t) => t.type === 'IN');
  const inHeaders = ['STT', 'Mã Phiếu', 'Ngày Nhập', 'Chi Nhánh', 'Mã SKU', 'Tên Vật Tư', 'Số Lượng', 'ĐVT', 'Nguồn Hàng / Người Giao', 'Người Lập', 'Ghi Chú'];
  const inRows = inTransactions.map((t, idx) => {
    const br = branches.find((b) => b.id === t.branchId);
    const it = items.find((i) => i.id === t.itemId);
    return [
      idx + 1,
      t.code,
      t.date,
      br?.name || t.branchId,
      it?.sku || '',
      it?.name || '',
      t.quantity,
      it?.unit || '',
      t.partner,
      t.createdBy,
      t.note,
    ];
  });
  const wsIn = XLSX.utils.aoa_to_sheet([
    [`SỔ CHI TIẾT PHIẾU NHẬP KHO - ${monthName}`],
    [],
    inHeaders,
    ...inRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsIn, 'So_Chi_Tiet_Nhap_Kho');

  // 4. SHEET SỔ CHI TIẾT XUẤT KHO
  const outTransactions = monthTxs.filter((t) => t.type === 'OUT');
  const outHeaders = ['STT', 'Mã Phiếu', 'Ngày Xuất', 'Chi Nhánh', 'Mã SKU', 'Tên Vật Tư', 'Số Lượng', 'ĐVT', 'Người Nhận / Dự Án', 'Người Lập', 'Ghi Chú'];
  const outRows = outTransactions.map((t, idx) => {
    const br = branches.find((b) => b.id === t.branchId);
    const it = items.find((i) => i.id === t.itemId);
    return [
      idx + 1,
      t.code,
      t.date,
      br?.name || t.branchId,
      it?.sku || '',
      it?.name || '',
      t.quantity,
      it?.unit || '',
      t.partner,
      t.createdBy,
      t.note,
    ];
  });
  const wsOut = XLSX.utils.aoa_to_sheet([
    [`SỔ CHI TIẾT PHIẾU XUẤT KHO - ${monthName}`],
    [],
    outHeaders,
    ...outRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsOut, 'So_Chi_Tiet_Xuat_Kho');

  // 5. SHEET BÁO CÁO THEO CHI NHÁNH
  const branchReportHeaders = ['STT', 'Mã Chi Nhánh', 'Tên Chi Nhánh', 'Khu Vực', 'Tổng Tồn Đầu Kỳ', 'Tổng Nhập Kỳ', 'Tổng Xuất Kỳ', 'Tổng Tồn Cuối Kỳ'];
  const branchRows = branches.map((b, idx) => {
    let bInitial = 0;
    let bIn = 0;
    let bOut = 0;
    let bEnding = 0;
    for (const it of items) {
      const stock = getItemBranchStock(monthKey, b, it, monthlyBalances, transactions);
      bInitial += stock.initialStock;
      bIn += stock.totalIn;
      bOut += stock.totalOut;
      bEnding += stock.endingStock;
    }
    return [
      idx + 1,
      b.code,
      b.name,
      b.region,
      bInitial,
      bIn,
      bOut,
      bEnding,
    ];
  });
  const wsBranch = XLSX.utils.aoa_to_sheet([
    [`BÁO CÁO TỔNG HỢP THEO CHI NHÁNH KHO - ${monthName}`],
    [],
    branchReportHeaders,
    ...branchRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsBranch, 'Bao_Cao_Theo_Chi_Nhanh');

  // 6. SHEET DANH MỤC VẬT TƯ
  const itemHeaders = ['STT', 'Mã SKU', 'Tên Vật Tư', 'Nhóm Hàng', 'Đơn Vị Tính', 'Định Mức Tồn Min'];
  const itemRows = items.map((it, idx) => [
    idx + 1,
    it.sku,
    it.name,
    it.category,
    it.unit,
    it.minStock,
  ]);
  const wsItems = XLSX.utils.aoa_to_sheet([
    ['DANH MỤC VẬT TƯ HÀNG HÓA HỆ THỐNG TEAM CIC'],
    [],
    itemHeaders,
    ...itemRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Danh_Muc_Vat_Tu');

  // Generate and download
  const cleanMonth = monthKey.replace('-', '_');
  XLSX.writeFile(wb, `Bao_Cao_Ton_Kho_CIC_${cleanMonth}.xlsx`);
}

/**
 * Xuất file CSV chuẩn UTF-8 BOM hiển thị chuẩn tiếng Việt trên Excel
 */
export function exportToUtf8Csv(
  monthKey: string,
  branches: Branch[],
  items: Item[],
  monthlyBalances: MonthlyBalance[],
  transactions: Transaction[]
) {
  const monthName = getMonthLabel(monthKey);
  const rows: string[][] = [
    ['BÁO CÁO TỒN KHO - HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC'],
    ['Kỳ báo cáo:', monthName],
    ['Tác giả:', 'Version: By Ha Nhung Log'],
    ['Hotline hỗ trợ:', '0901601600'],
    [],
    [
      'STT',
      'Mã SKU',
      'Tên Vật Tư',
      'ĐVT',
      'Chi Nhánh',
      'Tồn Đầu Kỳ',
      'Nhập Trong Kỳ',
      'Xuất Trong Kỳ',
      'Tồn Cuối Kỳ',
    ],
  ];

  let stt = 1;
  for (const it of items) {
    for (const br of branches) {
      const stock = getItemBranchStock(monthKey, br, it, monthlyBalances, transactions);
      rows.push([
        String(stt++),
        `"${it.sku}"`,
        `"${it.name}"`,
        `"${it.unit}"`,
        `"${br.name}"`,
        String(stock.initialStock),
        String(stock.totalIn),
        String(stock.totalOut),
        String(stock.endingStock),
      ]);
    }
  }

  // Convert to CSV with commas and newline
  const csvContent = rows.map((r) => r.join(',')).join('\r\n');
  // UTF-8 BOM: \uFEFF
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Ton_Kho_CIC_${monthKey.replace('-', '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Tải file Excel mẫu để người dùng nạp dữ liệu chuẩn
 */
export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Mẫu nạp vật tư
  const itemHeaders = ['Mã SKU (*)', 'Tên Vật Tư (*)', 'Nhóm Hàng (*)', 'Đơn Vị Tính (*)', 'Tồn Tối Thiểu'];
  const sampleItems = [
    ['CAT-VANG-XD', 'Cát Vàng Xây Dựng Hạt Trung', 'Vật Liệu Thô', 'm3', 50],
    ['GCH-DONG-TAM', 'Gạch Men Lát Nền Đồng Tâm 60x60', 'Hoàn Thiện', 'Hộp', 100],
    ['SCL-SIKA-G214', 'Vữa Tự Rót Sika Grout 214-11', 'Sơn & Hóa Chất', 'Bao 25kg', 30],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN: Điền các mã vật tư mới vào bảng dưới đây rồi nạp vào hệ thống'],
    itemHeaders,
    ...sampleItems,
  ]);
  XLSX.utils.book_append_sheet(wb, ws1, 'Mau_Vat_Tu');

  // Sheet 2: Mẫu nạp giao dịch Nhập / Xuất
  const txHeaders = [
    'Loại Phiếu (NK hoặc XK) (*)',
    'Ngày (YYYY-MM-DD) (*)',
    'Mã Chi Nhánh (R1/R2/HCM/CT) (*)',
    'Mã SKU (*)',
    'Số Lượng (*)',
    'Đối Tác / Người Giao / Người Nhận',
    'Ghi Chú',
  ];
  const sampleTx = [
    ['NK', '2026-09-23', 'HCM', 'THEP-HP-08', 50, 'Đại lý Cấp 1', 'Nhập đợt bổ sung dự án Metro'],
    ['XK', '2026-09-23', 'R1', 'THEP-VAN-D16', 150, 'Đội thi công số 4', 'Xuất vật tư công trình'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet([
    ['HƯỚNG DẪN: Điền phiếu giao dịch nhập hoặc xuất để nạp vào hệ thống'],
    txHeaders,
    ...sampleTx,
  ]);
  XLSX.utils.book_append_sheet(wb, ws2, 'Mau_Giao_Dich');

  XLSX.writeFile(wb, 'Mau_Nap_Du_Lieu_Kho_CIC.xlsx');
}

/**
 * Đọc và phân tích file Excel / CSV tải lên từ người dùng
 */
export async function parseUploadedInventoryFile(file: File): Promise<{
  newItems: Item[];
  newTransactions: Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>[];
  warnings: string[];
}> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });

  const newItems: Item[] = [];
  const newTransactions: Omit<Transaction, 'id' | 'createdBy' | 'createdAt'>[] = [];
  const warnings: string[] = [];

  // Look for items sheet or transaction sheet
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (!rows || rows.length < 2) continue;

    // Detect if this is an Item sheet or Transaction sheet
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      // Check for SKU column
      const firstCell = String(row[0] || '').trim();
      const secondCell = String(row[1] || '').trim();

      // Detection 1: Transaction (NK / XK)
      if (firstCell.toUpperCase() === 'NK' || firstCell.toUpperCase() === 'XK') {
        const type = firstCell.toUpperCase() as 'IN' | 'OUT';
        const date = String(row[1] || '').trim() || new Date().toISOString().slice(0, 10);
        const branchCode = String(row[2] || '').trim().toUpperCase();
        const sku = String(row[3] || '').trim();
        const quantity = parseFloat(row[4]) || 0;
        const partner = String(row[5] || '').trim();
        const note = String(row[6] || '').trim();

        if (quantity > 0) {
          const monthKey = date.slice(0, 7);
          newTransactions.push({
            code: `${type}-${date.replace(/-/g, '').slice(2)}-${Math.floor(100 + Math.random() * 900)}`,
            type,
            date,
            monthKey,
            branchId: branchCode,
            itemId: sku,
            quantity,
            partner: partner || 'Nạp tự động từ Excel',
            note: note || 'Nhập từ file Excel/CSV',
          });
        }
      }
      // Detection 2: Item Catalog
      else if (
        firstCell.length >= 3 &&
        secondCell.length >= 3 &&
        !firstCell.includes('Mã') &&
        !firstCell.includes('HƯỚNG DẪN') &&
        !firstCell.includes('STT')
      ) {
        // Likely an item row
        const sku = firstCell.toUpperCase();
        const name = secondCell;
        const category = String(row[2] || 'Vật Tư Tổng Hợp').trim();
        const unit = String(row[3] || 'Cái').trim();
        const minStock = parseFloat(row[4]) || 10;

        newItems.push({
          id: `item_${sku.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          sku,
          name,
          category,
          unit,
          minStock,
        });
      }
    }
  }

  if (newItems.length === 0 && newTransactions.length === 0) {
    warnings.push('Không nhận diện được dòng dữ liệu hợp lệ. Vui lòng tải file mẫu để kiểm tra đúng định dạng cột.');
  }

  return { newItems, newTransactions, warnings };
}
