export type TransactionType = 'IN' | 'OUT';

export interface Branch {
  id: string;
  code: string;
  name: string;
  region: string; // Miền Bắc, Miền Trung, Miền Nam, Tây Nam Bộ
  isDefault?: boolean;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  minStock: number;
}

export interface Transaction {
  id: string;
  code: string; // NK-YYMMDD-XXX or XK-YYMMDD-XXX
  type: TransactionType;
  date: string; // YYYY-MM-DD
  monthKey: string; // YYYY-MM (e.g. '2026-08', '2026-09')
  branchId: string;
  itemId: string;
  quantity: number;
  partner: string; // Nguồn hàng / Người giao / Người nhận
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface MonthlyBalance {
  id: string; // ${monthKey}_${branchId}_${itemId}
  monthKey: string;
  branchId: string;
  itemId: string;
  initialStock: number;
}

export interface ItemBranchStock {
  itemId: string;
  item: Item;
  branchId: string;
  branch: Branch;
  initialStock: number;
  totalIn: number;
  totalOut: number;
  endingStock: number;
}

export interface AppConfig {
  adminEmails: string[];
  webhookUrl: string;
  autoSyncWebhook: boolean;
  lastSyncedAt?: string;
}

export type MatrixDisplayMode = 'ending' | 'in' | 'out' | 'all';
