export type InvoiceType = 'institution' | 'sales' | 'purchase';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'overdue';

export interface BankDetails {
  account_holder?: string;
  account_number?: string;
  account_type?: string;
  bank_name?: string;
  bank_address?: string;
  ifsc_code?: string;
}

export interface CompanyProfile {
  id: string;
  profile_type: 'primary' | 'vendor';
  company_name: string;
  address?: string;
  city?: string;
  state?: string;
  state_code?: string;
  pincode?: string;
  country?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  phone?: string;
  email?: string;
  website?: string;
  bank_details?: BankDetails;
  terms_and_conditions?: string;
  logo_url?: string;
  signature_url?: string;
  declaration?: string;
  default_notes?: string;
  is_default?: boolean;
  created_at?: string;
  // GST Configuration
  default_cgst_rate?: number;
  default_sgst_rate?: number;
  default_igst_rate?: number;
}

export interface InvoiceLineItem {
  id?: string;
  invoice_id?: string;
  description: string;
  hsn_sac_code?: string;
  quantity: number;
  unit?: string;
  rate: number;
  discount_percent?: number;
  discount_amount?: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  amount: number;
  display_order?: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  
  // From Company
  from_company_name: string;
  from_company_address?: string;
  from_company_city?: string;
  from_company_state?: string;
  from_company_state_code?: string;
  from_company_pincode?: string;
  from_company_gstin?: string;
  from_company_pan?: string;
  from_company_cin?: string;
  from_company_phone?: string;
  from_company_email?: string;
  from_company_website?: string;
  
  // To Company
  to_company_name: string;
  to_company_address?: string;
  to_company_city?: string;
  to_company_state?: string;
  to_company_state_code?: string;
  to_company_pincode?: string;
  to_company_gstin?: string;
  to_company_contact_person?: string;
  to_company_phone?: string;
  
  // Ship To
  ship_to_name?: string;
  ship_to_address?: string;
  ship_to_city?: string;
  ship_to_state?: string;
  ship_to_state_code?: string;
  ship_to_pincode?: string;
  ship_to_gstin?: string;
  
  // Invoice Details
  invoice_date: string;
  due_date?: string;
  terms?: string;
  place_of_supply?: string;
  reference_number?: string;
  delivery_note?: string;
  
  // Amounts
  sub_total: number;
  discount_amount?: number;
  cgst_rate?: number;
  cgst_amount?: number;
  sgst_rate?: number;
  sgst_amount?: number;
  igst_rate?: number;
  igst_amount?: number;
  tds_rate?: number;
  tds_amount?: number;
  total_amount: number;
  balance_due: number;
  total_in_words?: string;
  
  // Status
  status: InvoiceStatus;
  paid_date?: string;
  payment_method?: string;
  
  // Bank Details
  bank_details?: BankDetails;
  
  // Notes
  notes?: string;
  terms_and_conditions?: string;
  declaration?: string;
  signature_url?: string;
  
  // Attachment (for purchase invoices)
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  
  // E-Invoicing
  irn?: string;
  ack_number?: string;
  ack_date?: string;
  
  // Relations
  institution_id?: string;
  line_items?: InvoiceLineItem[];
  
  // Metadata
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInvoiceInput {
  invoice_number: string; // Required - manually entered by user
  invoice_type: InvoiceType;
  from_company_name: string;
  from_company_address?: string;
  from_company_city?: string;
  from_company_state?: string;
  from_company_state_code?: string;
  from_company_pincode?: string;
  from_company_gstin?: string;
  from_company_pan?: string;
  from_company_cin?: string;
  from_company_phone?: string;
  from_company_email?: string;
  from_company_website?: string;
  to_company_name: string;
  to_company_address?: string;
  to_company_city?: string;
  to_company_state?: string;
  to_company_state_code?: string;
  to_company_pincode?: string;
  to_company_gstin?: string;
  to_company_contact_person?: string;
  to_company_phone?: string;
  ship_to_name?: string;
  ship_to_address?: string;
  ship_to_city?: string;
  ship_to_state?: string;
  ship_to_state_code?: string;
  ship_to_pincode?: string;
  ship_to_gstin?: string;
  invoice_date: string;
  due_date?: string;
  terms?: string;
  place_of_supply?: string;
  reference_number?: string;
  delivery_note?: string;
  notes?: string;
  terms_and_conditions?: string;
  declaration?: string;
  bank_details?: BankDetails;
  institution_id?: string;
  total_amount?: number; // For purchase invoices where amount is entered directly
  attachment_url?: string; // For purchase invoices
  attachment_name?: string;
  attachment_type?: string;
  line_items: Omit<InvoiceLineItem, 'id' | 'invoice_id'>[];
}

export interface InvoiceFilters {
  invoice_type?: InvoiceType;
  status?: InvoiceStatus;
  institution_id?: string;
  search?: string;
  start_date?: string;
  end_date?: string;
}
