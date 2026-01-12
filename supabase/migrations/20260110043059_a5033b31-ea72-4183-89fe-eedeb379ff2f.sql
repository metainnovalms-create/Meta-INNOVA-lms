-- Add GST rate configuration columns to company_profiles
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS default_cgst_rate numeric DEFAULT 9,
ADD COLUMN IF NOT EXISTS default_sgst_rate numeric DEFAULT 9,
ADD COLUMN IF NOT EXISTS default_igst_rate numeric DEFAULT 18;

-- Add GST rate columns to invoices table to store the rates used for each invoice
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS cgst_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_rate numeric DEFAULT 0;