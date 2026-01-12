-- Add report settings columns to company_profiles
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS report_logo_url TEXT;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS report_logo_width INTEGER DEFAULT 120;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS report_logo_height INTEGER DEFAULT 40;
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS report_signatory_name TEXT DEFAULT 'Mr. Vasanthaseelan';
ALTER TABLE public.company_profiles ADD COLUMN IF NOT EXISTS report_signatory_designation TEXT DEFAULT 'AGM - Metasage Alliance';