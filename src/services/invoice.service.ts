import { supabase } from '@/integrations/supabase/client';
import type { Invoice, CreateInvoiceInput, InvoiceFilters, InvoiceLineItem, CompanyProfile, InvoiceType, InvoiceStatus } from '@/types/invoice';

// Number to words converter for Indian currency
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertToWords(num: number): string {
  if (num === 0) return 'Zero';
  
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const hundred = Math.floor(num / 100);
  num %= 100;
  const ten = Math.floor(num / 10);
  const one = num % 10;
  
  let words = '';
  
  if (crore > 0) words += convertToWords(crore) + ' Crore ';
  if (lakh > 0) words += convertToWords(lakh) + ' Lakh ';
  if (thousand > 0) words += convertToWords(thousand) + ' Thousand ';
  if (hundred > 0) words += ones[hundred] + ' Hundred ';
  
  if (ten > 1) {
    words += tens[ten] + ' ';
    if (one > 0) words += ones[one] + ' ';
  } else if (ten === 1 || one > 0) {
    words += ones[ten * 10 + one] + ' ';
  }
  
  return words.trim();
}

export function numberToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  
  let result = 'Indian Rupee ' + convertToWords(rupees);
  if (paise > 0) {
    result += ' and ' + convertToWords(paise) + ' Paise';
  }
  result += ' Only';
  
  return result;
}

// GST rate configuration type
export interface GSTRates {
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
}

// Default GST rates
const DEFAULT_GST_RATES: GSTRates = {
  cgst_rate: 9,
  sgst_rate: 9,
  igst_rate: 18,
};

// Calculate taxes for line items with configurable rates
export function calculateLineItemTaxes(
  item: Omit<InvoiceLineItem, 'id' | 'invoice_id'>,
  isInterState: boolean,
  gstRates: GSTRates = DEFAULT_GST_RATES
): InvoiceLineItem {
  const baseAmount = item.quantity * item.rate;
  const discountAmount = item.discount_percent ? (baseAmount * item.discount_percent) / 100 : (item.discount_amount || 0);
  const taxableAmount = baseAmount - discountAmount;
  
  const cgstRate = gstRates.cgst_rate;
  const sgstRate = gstRates.sgst_rate;
  const igstRate = gstRates.igst_rate;
  
  if (isInterState) {
    const igstAmount = (taxableAmount * igstRate) / 100;
    return {
      ...item,
      discount_amount: discountAmount,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: igstRate,
      igst_amount: igstAmount,
      amount: taxableAmount + igstAmount,
    };
  } else {
    const cgstAmount = (taxableAmount * cgstRate) / 100;
    const sgstAmount = (taxableAmount * sgstRate) / 100;
    return {
      ...item,
      discount_amount: discountAmount,
      cgst_rate: cgstRate,
      cgst_amount: cgstAmount,
      sgst_rate: sgstRate,
      sgst_amount: sgstAmount,
      igst_rate: 0,
      igst_amount: 0,
      amount: taxableAmount + cgstAmount + sgstAmount,
    };
  }
}

// Calculate invoice totals with configurable rates
export function calculateInvoiceTotals(
  lineItems: InvoiceLineItem[],
  isInterState: boolean,
  tdsRate: number = 0,
  gstRates: GSTRates = DEFAULT_GST_RATES
): {
  sub_total: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  tds_amount: number;
  total_amount: number;
  balance_due: number;
} {
  const sub_total = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate) - (item.discount_amount || 0), 0);
  const cgst_amount = isInterState ? 0 : lineItems.reduce((sum, item) => sum + (item.cgst_amount || 0), 0);
  const sgst_amount = isInterState ? 0 : lineItems.reduce((sum, item) => sum + (item.sgst_amount || 0), 0);
  const igst_amount = isInterState ? lineItems.reduce((sum, item) => sum + (item.igst_amount || 0), 0) : 0;
  const tds_amount = (sub_total * tdsRate) / 100;
  const total_amount = sub_total + cgst_amount + sgst_amount + igst_amount;
  const balance_due = total_amount - tds_amount;
  
  return { 
    sub_total, 
    cgst_rate: isInterState ? 0 : gstRates.cgst_rate,
    cgst_amount, 
    sgst_rate: isInterState ? 0 : gstRates.sgst_rate,
    sgst_amount, 
    igst_rate: isInterState ? gstRates.igst_rate : 0,
    igst_amount, 
    tds_amount, 
    total_amount, 
    balance_due 
  };
}

// Check if invoice number already exists
export async function checkInvoiceNumberExists(invoiceNumber: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('invoices')
    .select('id')
    .eq('invoice_number', invoiceNumber)
    .maybeSingle();
  
  if (error) throw error;
  return !!data; // true if exists, false if available
}

// Fetch default company profile
export async function fetchDefaultCompanyProfile(): Promise<CompanyProfile | null> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('is_default', true)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  return data as CompanyProfile | null;
}

// Fetch all company profiles
export async function fetchCompanyProfiles(): Promise<CompanyProfile[]> {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .order('is_default', { ascending: false });
  
  if (error) throw error;
  return data as CompanyProfile[];
}

// Fetch invoices with filters
export async function fetchInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
  let query = supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters?.invoice_type) {
    query = query.eq('invoice_type', filters.invoice_type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.institution_id) {
    query = query.eq('institution_id', filters.institution_id);
  }
  if (filters?.start_date) {
    query = query.gte('invoice_date', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.lte('invoice_date', filters.end_date);
  }
  if (filters?.search) {
    query = query.or(`invoice_number.ilike.%${filters.search}%,to_company_name.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Fetch line items for each invoice
  const invoices = data as Invoice[];
  for (const invoice of invoices) {
    const { data: lineItems } = await supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', invoice.id)
      .order('display_order');
    invoice.line_items = lineItems as InvoiceLineItem[];
  }
  
  return invoices;
}

// Fetch single invoice with line items
export async function fetchInvoiceById(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  
  const invoice = data as Invoice;
  
  const { data: lineItems } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)
    .order('display_order');
  
  invoice.line_items = lineItems as InvoiceLineItem[];
  
  // If invoice doesn't have signature_url, fetch from company profile
  if (!invoice.signature_url) {
    const companyProfile = await fetchDefaultCompanyProfile();
    if (companyProfile?.signature_url) {
      invoice.signature_url = companyProfile.signature_url;
    }
  }
  
  return invoice;
}

// Create invoice
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const { data: userData } = await supabase.auth.getUser();
  
  // Use provided invoice number (manual entry)
  if (!input.invoice_number) {
    throw new Error('Invoice number is required');
  }
  
  // Fetch company profile to get GST rates
  const companyProfile = await fetchDefaultCompanyProfile();
  const gstRates: GSTRates = {
    cgst_rate: companyProfile?.default_cgst_rate ?? 9,
    sgst_rate: companyProfile?.default_sgst_rate ?? 9,
    igst_rate: companyProfile?.default_igst_rate ?? 18,
  };
  
  // Determine if inter-state
  const isInterState = input.from_company_state_code !== input.to_company_state_code;
  
  // Calculate line items with taxes using configured rates
  const calculatedItems = input.line_items.map((item, index) => ({
    ...calculateLineItemTaxes(item, isInterState, gstRates),
    display_order: index,
  }));
  
  // Calculate totals using configured rates
  const totals = calculateInvoiceTotals(calculatedItems, isInterState, 0, gstRates);
  
  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([{
      invoice_number: input.invoice_number,
      invoice_type: input.invoice_type,
      from_company_name: input.from_company_name,
      from_company_address: input.from_company_address,
      from_company_city: input.from_company_city,
      from_company_state: input.from_company_state,
      from_company_state_code: input.from_company_state_code,
      from_company_pincode: input.from_company_pincode,
      from_company_gstin: input.from_company_gstin,
      from_company_pan: input.from_company_pan,
      from_company_cin: input.from_company_cin,
      from_company_phone: input.from_company_phone,
      from_company_email: input.from_company_email,
      from_company_website: input.from_company_website,
      to_company_name: input.to_company_name,
      to_company_address: input.to_company_address,
      to_company_city: input.to_company_city,
      to_company_state: input.to_company_state,
      to_company_state_code: input.to_company_state_code,
      to_company_pincode: input.to_company_pincode,
      to_company_gstin: input.to_company_gstin,
      to_company_contact_person: input.to_company_contact_person,
      to_company_phone: input.to_company_phone,
      ship_to_name: input.ship_to_name,
      ship_to_address: input.ship_to_address,
      ship_to_city: input.ship_to_city,
      ship_to_state: input.ship_to_state,
      ship_to_state_code: input.ship_to_state_code,
      ship_to_pincode: input.ship_to_pincode,
      ship_to_gstin: input.ship_to_gstin,
      invoice_date: input.invoice_date,
      due_date: input.due_date,
      terms: input.terms,
      place_of_supply: input.place_of_supply,
      reference_number: input.reference_number,
      delivery_note: input.delivery_note,
      sub_total: totals.sub_total,
      cgst_rate: totals.cgst_rate,
      cgst_amount: totals.cgst_amount,
      sgst_rate: totals.sgst_rate,
      sgst_amount: totals.sgst_amount,
      igst_rate: totals.igst_rate,
      igst_amount: totals.igst_amount,
      total_amount: totals.total_amount,
      balance_due: totals.balance_due,
      total_in_words: numberToWords(totals.total_amount),
      status: 'draft',
      bank_details: input.bank_details ? JSON.parse(JSON.stringify(input.bank_details)) : null,
      notes: input.notes,
      terms_and_conditions: input.terms_and_conditions,
      declaration: input.declaration,
      signature_url: companyProfile?.signature_url,
      institution_id: input.institution_id,
      created_by: userData?.user?.id,
    }])
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;
  
  // Create line items
  const lineItemsToInsert = calculatedItems.map((item) => ({
    invoice_id: invoice.id,
    description: item.description,
    hsn_sac_code: item.hsn_sac_code,
    quantity: item.quantity,
    unit: item.unit,
    rate: item.rate,
    discount_percent: item.discount_percent,
    discount_amount: item.discount_amount,
    cgst_rate: item.cgst_rate,
    cgst_amount: item.cgst_amount,
    sgst_rate: item.sgst_rate,
    sgst_amount: item.sgst_amount,
    igst_rate: item.igst_rate,
    igst_amount: item.igst_amount,
    amount: item.amount,
    display_order: item.display_order,
  }));
  
  const { data: lineItems, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsToInsert)
    .select();
  
  if (lineItemsError) throw lineItemsError;
  
  return { ...invoice, line_items: lineItems } as Invoice;
}

// Update invoice status
export async function updateInvoiceStatus(id: string, status: InvoiceStatus, paidDate?: string): Promise<void> {
  const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'paid' && paidDate) {
    updateData.paid_date = paidDate;
  }
  
  const { error } = await supabase
    .from('invoices')
    .update(updateData)
    .eq('id', id);
  
  if (error) throw error;
}

// Delete invoice (only drafts)
export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('status', 'draft');
  
  if (error) throw error;
}

// Create purchase invoice (simplified for vendor bills)
export async function createPurchaseInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const { data: userData } = await supabase.auth.getUser();
  
  // Use provided invoice number (manual entry)
  if (!input.invoice_number) {
    throw new Error('Invoice number is required');
  }
  
  // Fetch company profile to get signature
  const companyProfile = await fetchDefaultCompanyProfile();
  
  const totalAmount = input.total_amount || input.line_items.reduce((sum, item) => sum + item.amount, 0);
  
  // Create invoice with attachment details
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert([{
      invoice_number: input.invoice_number,
      invoice_type: 'purchase',
      from_company_name: input.from_company_name,
      from_company_address: input.from_company_address,
      from_company_gstin: input.from_company_gstin,
      from_company_phone: input.from_company_phone,
      to_company_name: input.to_company_name,
      to_company_address: input.to_company_address,
      to_company_city: input.to_company_city,
      to_company_state: input.to_company_state,
      to_company_state_code: input.to_company_state_code,
      to_company_pincode: input.to_company_pincode,
      to_company_gstin: input.to_company_gstin,
      invoice_date: input.invoice_date,
      due_date: input.due_date,
      reference_number: input.reference_number,
      notes: input.notes,
      sub_total: totalAmount,
      total_amount: totalAmount,
      balance_due: totalAmount,
      status: 'draft',
      signature_url: companyProfile?.signature_url,
      created_by: userData?.user?.id,
      attachment_url: input.attachment_url,
      attachment_name: input.attachment_name,
      attachment_type: input.attachment_type,
    }])
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;
  
  // Create line items
  const lineItemsToInsert = input.line_items.map((item, index) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount,
    display_order: index,
  }));
  
  const { data: lineItems, error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsToInsert)
    .select();
  
  if (lineItemsError) throw lineItemsError;
  
  return { ...invoice, line_items: lineItems } as Invoice;
}

// Update company profile
export async function updateCompanyProfile(id: string, data: Partial<CompanyProfile>): Promise<void> {
  const updateData = { ...data, updated_at: new Date().toISOString() };
  if (data.bank_details) {
    (updateData as Record<string, unknown>).bank_details = data.bank_details as unknown as Record<string, unknown>;
  }
  const { error } = await supabase
    .from('company_profiles')
    .update(updateData as Record<string, unknown>)
    .eq('id', id);
  
  if (error) throw error;
}
