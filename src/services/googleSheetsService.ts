import { Branch, Item, MonthlyBalance, Transaction } from '../types';
import { getItemBranchStock, getMonthLabel } from './inventoryService';

export const SAMPLE_GOOGLE_APPS_SCRIPT = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT WEBHOOK NHẬN DỮ LIỆU TỰ ĐỘNG - TEAM CIC
 * Version: By Ha Nhung Log | Hotline: 0901601600
 * =========================================================================
 * HƯỚNG DẪN 4 BƯỚC TRIỂN KHAI NHANH:
 * 1. Mở trang tính Google Sheets mới (hoặc trang tính hiện có của bạn).
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa toàn bộ mã mặc định và Dán (Paste) toàn bộ đoạn mã này vào.
 * 4. Bấm nút "Triển khai" (Deploy) > "Triển khai mới" (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone)
 *    - Bấm "Triển khai" (Deploy) > Sao chép URL ứng dụng web và dán vào phần mềm kho!
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Ghi vào Sheet "Lịch Sử Giao Dịch"
    if (data.transactions && data.transactions.length > 0) {
      var txSheet = ss.getSheetByName("Nhat_Ky_Giao_Dich");
      if (!txSheet) {
        txSheet = ss.insertSheet("Nhat_Ky_Giao_Dich");
        txSheet.appendRow([
          "Mã Phiếu", "Loại", "Ngày", "Chi Nhánh", "Mã SKU", "Tên Vật Tư",
          "Số Lượng", "ĐVT", "Đối Tác", "Người Lập", "Ghi Chú", "Thời Gian Đồng Bộ"
        ]);
        txSheet.getRange(1, 1, 1, 12).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
      }

      for (var i = 0; i < data.transactions.length; i++) {
        var tx = data.transactions[i];
        txSheet.appendRow([
          tx.code,
          tx.type === "IN" ? "Nhập kho (NK)" : "Xuất kho (XK)",
          tx.date,
          tx.branchName || tx.branchId,
          tx.itemSku || tx.itemId,
          tx.itemName || "",
          tx.quantity,
          tx.itemUnit || "",
          tx.partner || "",
          tx.createdBy || "",
          tx.note || "",
          new Date().toLocaleString("vi-VN")
        ]);
      }
    }

    // 2. Cập nhật Sheet "Báo Cáo Tồn Kho"
    if (data.stockSummary && data.stockSummary.length > 0) {
      var stockSheet = ss.getSheetByName("Bao_Cao_Ton_Kho");
      if (!stockSheet) {
        stockSheet = ss.insertSheet("Bao_Cao_Ton_Kho");
      }
      stockSheet.clear();
      stockSheet.appendRow([
        "Kỳ Báo Cáo", "Mã SKU", "Tên Vật Tư", "ĐVT", "Chi Nhánh",
        "Tồn Đầu Kỳ", "Tổng Nhập", "Tổng Xuất", "Tồn Cuối Kỳ", "Cập Nhật Lúc"
      ]);
      stockSheet.getRange(1, 1, 1, 10).setBackground("#0f766e").setFontColor("#ffffff").setFontWeight("bold");

      for (var j = 0; j < data.stockSummary.length; j++) {
        var item = data.stockSummary[j];
        stockSheet.appendRow([
          data.monthLabel || data.monthKey,
          item.sku,
          item.name,
          item.unit,
          item.branchName,
          item.initialStock,
          item.totalIn,
          item.totalOut,
          item.endingStock,
          new Date().toLocaleString("vi-VN")
        ]);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Đồng bộ Google Sheets thành công!",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    service: "TEAM CIC Google Sheets Webhook Service",
    version: "By Ha Nhung Log",
    hotline: "0901601600"
  })).setMimeType(ContentService.MimeType.JSON);
}
`;

export async function syncToGoogleSheetsWebhook(
  webhookUrl: string,
  monthKey: string,
  branches: Branch[],
  items: Item[],
  monthlyBalances: MonthlyBalance[],
  transactions: Transaction[]
): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Webhook Google Sheets không hợp lệ!' };
  }

  const monthLabel = getMonthLabel(monthKey);
  const monthTransactions = transactions.filter((t) => t.monthKey === monthKey);

  const formattedTransactions = monthTransactions.map((t) => {
    const br = branches.find((b) => b.id === t.branchId);
    const it = items.find((i) => i.id === t.itemId);
    return {
      code: t.code,
      type: t.type,
      date: t.date,
      branchId: t.branchId,
      branchName: br?.name || t.branchId,
      itemId: t.itemId,
      itemSku: it?.sku || t.itemId,
      itemName: it?.name || '',
      itemUnit: it?.unit || '',
      quantity: t.quantity,
      partner: t.partner,
      note: t.note,
      createdBy: t.createdBy,
    };
  });

  const stockSummary: any[] = [];
  for (const b of branches) {
    for (const it of items) {
      const stock = getItemBranchStock(monthKey, b, it, monthlyBalances, transactions);
      stockSummary.push({
        sku: it.sku,
        name: it.name,
        unit: it.unit,
        branchName: b.name,
        initialStock: stock.initialStock,
        totalIn: stock.totalIn,
        totalOut: stock.totalOut,
        endingStock: stock.endingStock,
      });
    }
  }

  const payload = {
    system: 'HỆ THỐNG QUẢN LÝ HÀNG TỒN KHO TEAM CIC',
    author: 'Version: By Ha Nhung Log',
    hotline: '0901601600',
    monthKey,
    monthLabel,
    syncedAt: new Date().toISOString(),
    transactions: formattedTransactions,
    stockSummary,
  };

  try {
    // Mode no-cors is commonly needed for Google Apps Script Web Apps when called from browser
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `Đã gửi tín hiệu đồng bộ ${formattedTransactions.length} phiếu và ${stockSummary.length} mã tồn kho lên Google Sheets!`,
    };
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);
    return {
      success: false,
      message: error?.message || 'Không thể kết nối đến Webhook Google Apps Script!',
    };
  }
}
