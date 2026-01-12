-- Add new columns to company_profiles for invoice customization
ALTER TABLE public.company_profiles
ADD COLUMN IF NOT EXISTS signature_url TEXT,
ADD COLUMN IF NOT EXISTS declaration TEXT,
ADD COLUMN IF NOT EXISTS default_notes TEXT;

-- Create storage bucket for invoice assets (logos, signatures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoice-assets', 'invoice-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for invoice-assets bucket
CREATE POLICY "Anyone can view invoice assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'invoice-assets');

CREATE POLICY "Authenticated users can upload invoice assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoice-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update their invoice assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'invoice-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete invoice assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'invoice-assets' AND auth.role() = 'authenticated');