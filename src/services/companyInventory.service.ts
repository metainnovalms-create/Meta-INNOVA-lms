import { supabase } from '@/integrations/supabase/client';
import {
  CompanyItem,
  CompanySupplier,
  CompanyStockEntry,
  CompanyStockIssue,
  CreateItemRequest,
  CreateSupplierRequest,
  CreateStockEntryRequest,
  CreateStockIssueRequest,
} from '@/types/companyInventory';

// ==================== ITEMS ====================

export async function getItems(): Promise<CompanyItem[]> {
  const { data, error } = await supabase
    .from('company_item_master')
    .select('*')
    .order('item_name');

  if (error) throw error;
  return data as CompanyItem[];
}

export async function getItemById(id: string): Promise<CompanyItem | null> {
  const { data, error } = await supabase
    .from('company_item_master')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CompanyItem;
}

export async function createItem(item: CreateItemRequest): Promise<CompanyItem> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('company_item_master')
    .insert({
      ...item,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CompanyItem;
}

export async function updateItem(id: string, item: Partial<CreateItemRequest>): Promise<CompanyItem> {
  const { data, error } = await supabase
    .from('company_item_master')
    .update(item)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CompanyItem;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('company_item_master')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== SUPPLIERS ====================

export async function getSuppliers(): Promise<CompanySupplier[]> {
  const { data, error } = await supabase
    .from('company_suppliers')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as CompanySupplier[];
}

export async function getSupplierById(id: string): Promise<CompanySupplier | null> {
  const { data, error } = await supabase
    .from('company_suppliers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as CompanySupplier;
}

export async function createSupplier(supplier: CreateSupplierRequest): Promise<CompanySupplier> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('company_suppliers')
    .insert({
      ...supplier,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CompanySupplier;
}

export async function updateSupplier(id: string, supplier: Partial<CreateSupplierRequest & { status: 'active' | 'inactive' }>): Promise<CompanySupplier> {
  const { data, error } = await supabase
    .from('company_suppliers')
    .update(supplier)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as CompanySupplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase
    .from('company_suppliers')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ==================== STOCK ENTRIES ====================

export async function getStockEntries(): Promise<CompanyStockEntry[]> {
  const { data, error } = await supabase
    .from('company_stock_entries')
    .select(`
      *,
      item:company_item_master(*),
      supplier:company_suppliers(*)
    `)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data as CompanyStockEntry[];
}

export async function getStockEntriesByItem(itemId: string): Promise<CompanyStockEntry[]> {
  const { data, error } = await supabase
    .from('company_stock_entries')
    .select(`
      *,
      item:company_item_master(*),
      supplier:company_suppliers(*)
    `)
    .eq('item_id', itemId)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data as CompanyStockEntry[];
}

export async function getStockEntriesBySupplier(supplierId: string): Promise<CompanyStockEntry[]> {
  const { data, error } = await supabase
    .from('company_stock_entries')
    .select(`
      *,
      item:company_item_master(*),
      supplier:company_suppliers(*)
    `)
    .eq('supplier_id', supplierId)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data as CompanyStockEntry[];
}

export async function createStockEntry(entry: CreateStockEntryRequest): Promise<CompanyStockEntry> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('company_stock_entries')
    .insert({
      ...entry,
      created_by: userData.user?.id,
    })
    .select(`
      *,
      item:company_item_master(*),
      supplier:company_suppliers(*)
    `)
    .single();

  if (error) throw error;
  return data as CompanyStockEntry;
}

// ==================== STOCK ISSUES ====================

export async function getStockIssues(): Promise<CompanyStockIssue[]> {
  const { data, error } = await supabase
    .from('company_stock_issues')
    .select(`
      *,
      item:company_item_master(*)
    `)
    .order('issue_date', { ascending: false });

  if (error) throw error;
  return data as CompanyStockIssue[];
}

export async function getStockIssuesByItem(itemId: string): Promise<CompanyStockIssue[]> {
  const { data, error } = await supabase
    .from('company_stock_issues')
    .select(`
      *,
      item:company_item_master(*)
    `)
    .eq('item_id', itemId)
    .order('issue_date', { ascending: false });

  if (error) throw error;
  return data as CompanyStockIssue[];
}

export async function createStockIssue(issue: CreateStockIssueRequest): Promise<CompanyStockIssue> {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('company_stock_issues')
    .insert({
      ...issue,
      created_by: userData.user?.id,
    })
    .select(`
      *,
      item:company_item_master(*)
    `)
    .single();

  if (error) throw error;
  return data as CompanyStockIssue;
}

// ==================== STATISTICS ====================

export async function getInventoryStats(): Promise<{
  totalItems: number;
  lowStockCount: number;
  totalValue: number;
  totalSuppliers: number;
}> {
  const [itemsResult, suppliersResult] = await Promise.all([
    supabase.from('company_item_master').select('id, current_stock, reorder_level'),
    supabase.from('company_suppliers').select('id').eq('status', 'active'),
  ]);

  if (itemsResult.error) throw itemsResult.error;
  if (suppliersResult.error) throw suppliersResult.error;

  const items = itemsResult.data || [];
  const lowStockCount = items.filter(item => item.current_stock <= item.reorder_level).length;

  // Calculate total value from entries
  const { data: entries } = await supabase
    .from('company_stock_entries')
    .select('amount');
  
  const totalValue = (entries || []).reduce((sum, e) => sum + (e.amount || 0), 0);

  return {
    totalItems: items.length,
    lowStockCount,
    totalValue,
    totalSuppliers: (suppliersResult.data || []).length,
  };
}
