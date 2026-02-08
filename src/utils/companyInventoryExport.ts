import { CompanyItem, CompanyStockEntry, CompanyStockIssue, StockLedgerEntry } from '@/types/companyInventory';
import { format } from 'date-fns';

// ==================== CSV/EXCEL EXPORT ====================

function convertToCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const headerRow = headers.map(h => `"${h.label}"`).join(',');
  const dataRows = data.map(row => 
    headers.map(h => {
      const value = row[h.key];
      if (value === null || value === undefined) return '""';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      return `"${value}"`;
    }).join(',')
  );
  return [headerRow, ...dataRows].join('\n');
}

function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ==================== STOCK SUMMARY EXPORT ====================

export function exportCurrentStockSummary(items: CompanyItem[], filename = 'stock-summary'): void {
  const headers = [
    { key: 'item_code', label: 'Item Code' },
    { key: 'item_name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'unit_of_measure', label: 'UoM' },
    { key: 'current_stock', label: 'Current Stock' },
    { key: 'reorder_level', label: 'Reorder Level' },
    { key: 'status', label: 'Status' },
    { key: 'gst_percentage', label: 'GST %' },
  ];

  const data = items.map(item => ({
    item_code: item.item_code,
    item_name: item.item_name,
    category: item.category || '-',
    unit_of_measure: item.unit_of_measure,
    current_stock: item.current_stock,
    reorder_level: item.reorder_level,
    status: item.status,
    gst_percentage: item.gst_percentage,
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, `${filename}-${format(new Date(), 'yyyy-MM-dd')}`);
}

// ==================== STOCK LEDGER EXPORT ====================

export function exportStockLedger(
  item: CompanyItem,
  entries: StockLedgerEntry[],
  dateRange: { from: Date; to: Date },
  filename = 'stock-ledger'
): void {
  const headers = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'reference', label: 'Reference' },
    { key: 'inward_qty', label: 'Inward Qty' },
    { key: 'outward_qty', label: 'Outward Qty' },
    { key: 'balance', label: 'Balance' },
    { key: 'rate', label: 'Rate' },
    { key: 'amount', label: 'Amount' },
    { key: 'details', label: 'Details' },
  ];

  const data = entries.map(entry => ({
    date: entry.date,
    type: entry.type.toUpperCase(),
    reference: entry.reference,
    inward_qty: entry.inward_qty || '',
    outward_qty: entry.outward_qty || '',
    balance: entry.balance,
    rate: entry.rate || '',
    amount: entry.amount || '',
    details: entry.details || '',
  }));

  const csv = convertToCSV(data, headers);
  const filenameFull = `${filename}-${item.item_code}-${format(dateRange.from, 'yyyyMMdd')}-${format(dateRange.to, 'yyyyMMdd')}`;
  downloadCSV(csv, filenameFull);
}

// ==================== STOCK ENTRIES EXPORT ====================

export function exportStockEntries(entries: CompanyStockEntry[], filename = 'stock-entries'): void {
  const headers = [
    { key: 'entry_date', label: 'Date' },
    { key: 'item_code', label: 'Item Code' },
    { key: 'item_name', label: 'Item Name' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'invoice_number', label: 'Invoice No' },
    { key: 'invoice_date', label: 'Invoice Date' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'rate', label: 'Rate' },
    { key: 'amount', label: 'Amount' },
    { key: 'batch_serial', label: 'Batch/Serial' },
    { key: 'location_store', label: 'Location' },
  ];

  const data = entries.map(entry => ({
    entry_date: entry.entry_date,
    item_code: entry.item?.item_code || '',
    item_name: entry.item?.item_name || '',
    supplier_name: entry.supplier?.name || '-',
    invoice_number: entry.invoice_number || '-',
    invoice_date: entry.invoice_date || '-',
    quantity: entry.quantity,
    rate: entry.rate,
    amount: entry.amount,
    batch_serial: entry.batch_serial || '-',
    location_store: entry.location_store || '-',
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, `${filename}-${format(new Date(), 'yyyy-MM-dd')}`);
}

// ==================== STOCK ISSUES EXPORT ====================

export function exportStockIssues(issues: CompanyStockIssue[], filename = 'stock-issues'): void {
  const headers = [
    { key: 'issue_date', label: 'Date' },
    { key: 'item_code', label: 'Item Code' },
    { key: 'item_name', label: 'Item Name' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'issued_to_type', label: 'Issued To Type' },
    { key: 'issued_to_name', label: 'Issued To' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'reference_number', label: 'Reference' },
  ];

  const data = issues.map(issue => ({
    issue_date: issue.issue_date,
    item_code: issue.item?.item_code || '',
    item_name: issue.item?.item_name || '',
    quantity: issue.quantity,
    issued_to_type: issue.issued_to_type,
    issued_to_name: issue.issued_to_name,
    purpose: issue.purpose || '-',
    reference_number: issue.reference_number || '-',
  }));

  const csv = convertToCSV(data, headers);
  downloadCSV(csv, `${filename}-${format(new Date(), 'yyyy-MM-dd')}`);
}

// ==================== SUPPLIER PURCHASE HISTORY EXPORT ====================

export function exportSupplierPurchaseHistory(
  supplierName: string,
  entries: CompanyStockEntry[],
  filename = 'supplier-purchases'
): void {
  const headers = [
    { key: 'entry_date', label: 'Date' },
    { key: 'invoice_number', label: 'Invoice No' },
    { key: 'invoice_date', label: 'Invoice Date' },
    { key: 'item_code', label: 'Item Code' },
    { key: 'item_name', label: 'Item Name' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'rate', label: 'Rate' },
    { key: 'amount', label: 'Amount' },
  ];

  const data = entries.map(entry => ({
    entry_date: entry.entry_date,
    invoice_number: entry.invoice_number || '-',
    invoice_date: entry.invoice_date || '-',
    item_code: entry.item?.item_code || '',
    item_name: entry.item?.item_name || '',
    quantity: entry.quantity,
    rate: entry.rate,
    amount: entry.amount,
  }));

  const csv = convertToCSV(data, headers);
  const safeSupplierName = supplierName.replace(/[^a-zA-Z0-9]/g, '-');
  downloadCSV(csv, `${filename}-${safeSupplierName}-${format(new Date(), 'yyyy-MM-dd')}`);
}
