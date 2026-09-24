/**
 * CẤU HÌNH DANH SÁCH QUẢN TRỊ VIÊN (ADMIN) HỆ THỐNG KHO CIC
 * Email trong danh sách này có toàn quyền:
 * - Thêm / Sửa / Xóa phiếu Nhập & Xuất kho
 * - Kết chuyển tháng mới (Tự động chuyển Tồn cuối -> Tồn đầu kỳ)
 * - Nhập dữ liệu từ Excel / CSV
 * - Thêm mới Chi nhánh & Danh mục Vật tư SKU
 * - Cấu hình Webhook Google Sheets
 * 
 * Tài khoản khác (hoặc chưa đăng nhập) chỉ có quyền XEM (Read-only).
 */

export const DEFAULT_ADMIN_EMAILS: string[] = [
  'save.ha1111@gmail.com',  // Tài khoản quản trị chính của hệ thống
  'admin@cic.com',          // Quản trị viên phụ trách CIC Log
  'hanhunglog@cic.com',     // Ha Nhung Log Admin
  'hanhung@gmail.com'
];

export function isUserAdmin(email: string | null | undefined, customAdmins: string[] = []): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const allAdmins = [...DEFAULT_ADMIN_EMAILS, ...customAdmins].map(e => e.trim().toLowerCase());
  return allAdmins.includes(normalized);
}
