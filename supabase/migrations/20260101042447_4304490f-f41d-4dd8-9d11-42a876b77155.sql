-- Invoice Number Sequences for auto-generation
CREATE TABLE public.invoice_number_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('institution', 'sales', 'purchase')),
  prefix TEXT NOT NULL,
  financial_year TEXT NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(invoice_type, financial_year)
);

-- Company Profiles for Bill From defaults
CREATE TABLE public.company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL CHECK (profile_type IN ('primary', 'vendor')) DEFAULT 'primary',
  company_name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pincode TEXT,
  country TEXT DEFAULT 'India',
  gstin TEXT,
  pan TEXT,
  cin TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  bank_details JSONB DEFAULT '{}',
  terms_and_conditions TEXT,
  logo_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Main Invoices Table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('institution', 'sales', 'purchase')),
  
  -- From Company (Bill From)
  from_company_name TEXT NOT NULL,
  from_company_address TEXT,
  from_company_city TEXT,
  from_company_state TEXT,
  from_company_state_code TEXT,
  from_company_pincode TEXT,
  from_company_gstin TEXT,
  from_company_pan TEXT,
  from_company_cin TEXT,
  from_company_phone TEXT,
  from_company_email TEXT,
  from_company_website TEXT,
  
  -- To Company (Bill To)
  to_company_name TEXT NOT NULL,
  to_company_address TEXT,
  to_company_city TEXT,
  to_company_state TEXT,
  to_company_state_code TEXT,
  to_company_pincode TEXT,
  to_company_gstin TEXT,
  to_company_contact_person TEXT,
  to_company_phone TEXT,
  
  -- Ship To (for Sales invoices)
  ship_to_name TEXT,
  ship_to_address TEXT,
  ship_to_city TEXT,
  ship_to_state TEXT,
  ship_to_state_code TEXT,
  ship_to_pincode TEXT,
  ship_to_gstin TEXT,
  
  -- Invoice Details
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  terms TEXT,
  place_of_supply TEXT,
  reference_number TEXT,
  delivery_note TEXT,
  
  -- Amounts
  sub_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  cgst_rate NUMERIC(5,2) DEFAULT 9,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_rate NUMERIC(5,2) DEFAULT 9,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_rate NUMERIC(5,2) DEFAULT 18,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  tds_rate NUMERIC(5,2) DEFAULT 0,
  tds_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_in_words TEXT,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'cancelled', 'overdue')) DEFAULT 'draft',
  paid_date DATE,
  payment_method TEXT,
  
  -- Bank Details
  bank_details JSONB DEFAULT '{}',
  
  -- Notes and Terms
  notes TEXT,
  terms_and_conditions TEXT,
  declaration TEXT,
  
  -- E-Invoicing (for Sales)
  irn TEXT,
  ack_number TEXT,
  ack_date TIMESTAMPTZ,
  
  -- Institution specific
  institution_id UUID REFERENCES public.institutions(id),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Invoice Line Items
CREATE TABLE public.invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  hsn_sac_code TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'Nos',
  rate NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  cgst_rate NUMERIC(5,2) DEFAULT 9,
  cgst_amount NUMERIC(12,2) DEFAULT 0,
  sgst_rate NUMERIC(5,2) DEFAULT 9,
  sgst_amount NUMERIC(12,2) DEFAULT 0,
  igst_rate NUMERIC(5,2) DEFAULT 18,
  igst_amount NUMERIC(12,2) DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.invoice_number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;

-- Indexes
CREATE INDEX idx_invoices_type ON public.invoices(invoice_type);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_date ON public.invoices(invoice_date DESC);
CREATE INDEX idx_invoices_institution ON public.invoices(institution_id);
CREATE INDEX idx_invoice_line_items_invoice ON public.invoice_line_items(invoice_id);

-- RLS Policies for invoice_number_sequences
CREATE POLICY "Super admins can manage invoice sequences" ON public.invoice_number_sequences
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage invoice sequences" ON public.invoice_number_sequences
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

-- RLS Policies for company_profiles
CREATE POLICY "Super admins can manage company profiles" ON public.company_profiles
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage company profiles" ON public.company_profiles
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Authenticated users can view company profiles" ON public.company_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for invoices
CREATE POLICY "Super admins can manage all invoices" ON public.invoices
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all invoices" ON public.invoices
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Management can view institution invoices" ON public.invoices
  FOR SELECT USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = get_user_institution_id(auth.uid()));

-- RLS Policies for invoice_line_items
CREATE POLICY "Super admins can manage all line items" ON public.invoice_line_items
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all line items" ON public.invoice_line_items
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Users can view line items for accessible invoices" ON public.invoice_line_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE 
        has_role(auth.uid(), 'super_admin'::app_role) OR
        has_role(auth.uid(), 'system_admin'::app_role) OR
        (has_role(auth.uid(), 'management'::app_role) AND institution_id = get_user_institution_id(auth.uid()))
    )
  );

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_invoice_type TEXT)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_year TEXT;
  v_next_number INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Determine prefix based on type
  CASE p_invoice_type
    WHEN 'institution' THEN v_prefix := 'MSA/MSD/';
    WHEN 'sales' THEN v_prefix := 'INV/';
    WHEN 'purchase' THEN v_prefix := 'PUR/';
    ELSE v_prefix := 'INV/';
  END CASE;
  
  -- Get financial year (April to March)
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
    v_year := TO_CHAR(CURRENT_DATE, 'YY') || '-' || TO_CHAR(CURRENT_DATE + INTERVAL '1 year', 'YY');
  ELSE
    v_year := TO_CHAR(CURRENT_DATE - INTERVAL '1 year', 'YY') || '-' || TO_CHAR(CURRENT_DATE, 'YY');
  END IF;
  
  -- Get and increment the sequence
  INSERT INTO public.invoice_number_sequences (invoice_type, prefix, financial_year, last_number)
  VALUES (p_invoice_type, v_prefix, v_year, 1)
  ON CONFLICT (invoice_type, financial_year)
  DO UPDATE SET last_number = invoice_number_sequences.last_number + 1, updated_at = now()
  RETURNING last_number INTO v_next_number;
  
  -- Format the invoice number
  IF p_invoice_type = 'institution' THEN
    v_invoice_number := v_prefix || LPAD(v_next_number::TEXT, 3, '0');
  ELSE
    v_invoice_number := v_prefix || v_year || '/' || LPAD(v_next_number::TEXT, 4, '0');
  END IF;
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert default company profile
INSERT INTO public.company_profiles (
  profile_type, company_name, address, city, state, state_code, pincode, country,
  gstin, phone, email, website, is_default,
  bank_details, terms_and_conditions
) VALUES (
  'primary',
  'Metasage Alliance Consulting Expert LLP',
  'No. 57/27, Karupannan Street, S.P.Pudur',
  'Namakkal',
  'Tamil Nadu',
  '33',
  '637 001',
  'India',
  '33ABYFM2955P1ZA',
  '87788 98994',
  'hrm@anukacorp.com',
  'www.metasagealliance.com',
  true,
  '{"account_holder": "Metasage Alliance Consulting Expert LLP", "account_number": "50200089505399", "account_type": "Current A/C", "bank_name": "HDFC Bank", "ifsc_code": "HDFC0000695"}'::jsonb,
  '1. Payment Due Date: Payment is due as mentioned in the invoice date unless otherwise agreed in writing.
2. Mode of Payment: Payment shall be made via bank transfer to the account details mentioned in the invoice.
3. Taxes: Applicable GST has been included as per prevailing government norms.
4. Cancellation Policy: Trainer services once availed or scheduled are non-refundable. Cancellation after deployment may incur service charges.
5. Acknowledgement: By making the payment, the customer acknowledges and accepts the services received and the terms mentioned herein.'
);