// Company Inventory Types

export interface CompanySupplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyItem {
  id: string;
  item_code: string;
  item_name: string;
  category: string | null;
  unit_of_measure: string;
  gst_percentage: number;
  reorder_level: number;
  current_stock: number;
  status: 'active' | 'inactive';
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyStockEntry {
  id: string;
  entry_date: string;
  item_id: string;
  supplier_id: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  quantity: number;
  rate: number;
  amount: number;
  batch_serial: string | null;
  location_store: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined data
  item?: CompanyItem;
  supplier?: CompanySupplier;
}

export interface CompanyStockIssue {
  id: string;
  issue_date: string;
  item_id: string;
  quantity: number;
  issued_to_type: 'department' | 'project' | 'institution' | 'branch' | 'other';
  issued_to_id: string | null;
  issued_to_name: string;
  purpose: string | null;
  reference_number: string | null;
  notes: string | null;
  admin_override: boolean;
  created_by: string | null;
  created_at: string;
  // Joined data
  item?: CompanyItem;
}

export interface CreateItemRequest {
  item_code: string;
  item_name: string;
  category?: string;
  unit_of_measure: string;
  gst_percentage?: number;
  reorder_level?: number;
  description?: string;
}

export interface CreateSupplierRequest {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  notes?: string;
}

export interface CreateStockEntryRequest {
  entry_date: string;
  item_id: string;
  supplier_id?: string;
  invoice_number?: string;
  invoice_date?: string;
  quantity: number;
  rate: number;
  batch_serial?: string;
  location_store?: string;
  notes?: string;
}

export interface CreateStockIssueRequest {
  issue_date: string;
  item_id: string;
  quantity: number;
  issued_to_type: 'department' | 'project' | 'institution' | 'branch' | 'other';
  issued_to_id?: string;
  issued_to_name: string;
  purpose?: string;
  reference_number?: string;
  notes?: string;
  admin_override?: boolean;
}

export interface StockLedgerEntry {
  date: string;
  type: 'opening' | 'inward' | 'outward';
  reference: string;
  inward_qty: number;
  outward_qty: number;
  balance: number;
  rate?: number;
  amount?: number;
  details?: string;
}

export interface StockLedgerReport {
  item: CompanyItem;
  entries: StockLedgerEntry[];
  opening_balance: number;
  total_inward: number;
  total_outward: number;
  closing_balance: number;
}

export interface CurrentStockSummary {
  item: CompanyItem;
  current_stock: number;
  stock_value: number;
  last_entry_date: string | null;
  is_low_stock: boolean;
}

export interface SupplierPurchaseHistory {
  supplier: CompanySupplier;
  entries: CompanyStockEntry[];
  total_quantity: number;
  total_amount: number;
}
