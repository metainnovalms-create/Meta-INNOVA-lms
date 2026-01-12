-- Create crm_contracts table
CREATE TABLE public.crm_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  contract_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_date DATE NOT NULL,
  contract_value NUMERIC NOT NULL DEFAULT 0,
  payment_terms TEXT NOT NULL DEFAULT 'annual',
  status TEXT NOT NULL DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT false,
  renewal_status TEXT NOT NULL DEFAULT 'manual_renew',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create crm_contract_documents table
CREATE TABLE public.crm_contract_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.crm_contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contract_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_contracts
CREATE POLICY "Super admins can manage all contracts"
ON public.crm_contracts FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all contracts"
ON public.crm_contracts FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- RLS policies for crm_contract_documents
CREATE POLICY "Super admins can manage all contract documents"
ON public.crm_contract_documents FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all contract documents"
ON public.crm_contract_documents FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_crm_contracts_updated_at
BEFORE UPDATE ON public.crm_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_crm_contracts_institution_id ON public.crm_contracts(institution_id);
CREATE INDEX idx_crm_contracts_status ON public.crm_contracts(status);
CREATE INDEX idx_crm_contracts_renewal_date ON public.crm_contracts(renewal_date);
CREATE INDEX idx_crm_contract_documents_contract_id ON public.crm_contract_documents(contract_id);