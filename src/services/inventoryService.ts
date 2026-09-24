import { Branch, Item, MonthlyBalance, Transaction, ItemBranchStock } from '../types';

export function getMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-');
  return `Tháng ${month}/${year} (T${month}/${year})`;
}

export function getShortMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [year, month] = monthKey.split('-');
  return `T${month}/${year.slice(2)}`;
}

export function getNextMonthKey(currentMonthKey: string): string {
  const [yearStr, monthStr] = currentMonthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function getPreviousMonthKey(currentMonthKey: string): string {
  const [yearStr, monthStr] = currentMonthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  month -= 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Generate slip code format: NK-YYMMDD-XXX or XK-YYMMDD-XXX
 */
export function generateTransactionCode(
  type: 'IN' | 'OUT',
  dateStr: string,
  existingTransactions: Transaction[]
): string {
  const prefix = type === 'IN' ? 'NK' : 'XK';
  const cleanDate = dateStr.replace(/-/g, ''); // 2026-09-23 -> 20260923
  const yy = cleanDate.slice(2, 4); // 26
  const mm = cleanDate.slice(4, 6); // 09
  const dd = cleanDate.slice(6, 8); // 23
  const dateCode = `${yy}${mm}${dd}`;

  // Find existing codes for this prefix and date
  const pattern = new RegExp(`^${prefix}-${dateCode}-(\\d{3})$`);
  let maxSeq = 0;

  for (const tx of existingTransactions) {
    const match = tx.code.match(pattern);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}-${dateCode}-${nextSeq}`;
}

/**
 * Calculate initial stock for a branch and item in a target month
 */
export function calculateInitialStock(
  monthKey: string,
  branchId: string,
  itemId: string,
  monthlyBalances: MonthlyBalance[],
  transactions: Transaction[]
): number {
  // 1. Explicitly defined balance in monthlyBalances
  const balance = monthlyBalances.find(
    (b) => b.monthKey === monthKey && b.branchId === branchId && b.itemId === itemId
  );
  if (balance !== undefined) {
    return balance.initialStock;
  }

  // 2. If not defined, fallback to ending stock of previous month if it exists
  const prevMonthKey = getPreviousMonthKey(monthKey);
  const prevBalance = monthlyBalances.find(
    (b) => b.monthKey === prevMonthKey && b.branchId === branchId && b.itemId === itemId
  );

  if (prevBalance !== undefined) {
    const inPrev = transactions
      .filter((t) => t.monthKey === prevMonthKey && t.branchId === branchId && t.itemId === itemId && t.type === 'IN')
      .reduce((sum, t) => sum + t.quantity, 0);
    const outPrev = transactions
      .filter((t) => t.monthKey === prevMonthKey && t.branchId === branchId && t.itemId === itemId && t.type === 'OUT')
      .reduce((sum, t) => sum + t.quantity, 0);
    return Math.max(0, prevBalance.initialStock + inPrev - outPrev);
  }

  return 0;
}

/**
 * Get comprehensive stock report for a single branch & item in given month
 */
export function getItemBranchStock(
  monthKey: string,
  branch: Branch,
  item: Item,
  monthlyBalances: MonthlyBalance[],
  transactions: Transaction[]
): ItemBranchStock {
  const initialStock = calculateInitialStock(monthKey, branch.id, item.id, monthlyBalances, transactions);
  
  const totalIn = transactions
    .filter((t) => t.monthKey === monthKey && t.branchId === branch.id && t.itemId === item.id && t.type === 'IN')
    .reduce((sum, t) => sum + t.quantity, 0);

  const totalOut = transactions
    .filter((t) => t.monthKey === monthKey && t.branchId === branch.id && t.itemId === item.id && t.type === 'OUT')
    .reduce((sum, t) => sum + t.quantity, 0);

  const endingStock = initialStock + totalIn - totalOut;

  return {
    itemId: item.id,
    item,
    branchId: branch.id,
    branch,
    initialStock,
    totalIn,
    totalOut,
    endingStock,
  };
}

/**
 * Perform monthly carry-forward:
 * Ending stock of prevMonth becomes Initial stock of nextMonth
 */
export function executeMonthlyCarryForward(
  fromMonthKey: string,
  toMonthKey: string,
  branches: Branch[],
  items: Item[],
  currentBalances: MonthlyBalance[],
  transactions: Transaction[]
): MonthlyBalance[] {
  const newBalances: MonthlyBalance[] = [...currentBalances.filter(b => b.monthKey !== toMonthKey)];

  for (const branch of branches) {
    for (const item of items) {
      const stock = getItemBranchStock(fromMonthKey, branch, item, currentBalances, transactions);
      newBalances.push({
        id: `${toMonthKey}_${branch.id}_${item.id}`,
        monthKey: toMonthKey,
        branchId: branch.id,
        itemId: item.id,
        initialStock: stock.endingStock,
      });
    }
  }

  return newBalances;
}

/**
 * Calculate KPI summary for current active month
 */
export interface KpiSummary {
  totalIn: number;
  totalOut: number;
  totalStock: number;
  branchCount: number;
  skuCount: number;
  totalTransactionsCount: number;
}

export function calculateKpis(
  monthKey: string,
  branches: Branch[],
  items: Item[],
  monthlyBalances: MonthlyBalance[],
  transactions: Transaction[]
): KpiSummary {
  const monthTransactions = transactions.filter((t) => t.monthKey === monthKey);
  const totalIn = monthTransactions.filter((t) => t.type === 'IN').reduce((acc, t) => acc + t.quantity, 0);
  const totalOut = monthTransactions.filter((t) => t.type === 'OUT').reduce((acc, t) => acc + t.quantity, 0);

  let totalStock = 0;
  for (const branch of branches) {
    for (const item of items) {
      const s = getItemBranchStock(monthKey, branch, item, monthlyBalances, transactions);
      totalStock += s.endingStock;
    }
  }

  return {
    totalIn,
    totalOut,
    totalStock,
    branchCount: branches.length,
    skuCount: items.length,
    totalTransactionsCount: monthTransactions.length,
  };
}
