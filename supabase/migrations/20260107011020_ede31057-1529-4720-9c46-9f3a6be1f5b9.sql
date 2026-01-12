-- Add file_path column to newsletters table
ALTER TABLE public.newsletters ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Update existing records to extract file_path from pdf_url
UPDATE public.newsletters 
SET file_path = REPLACE(pdf_url, 'https://ftadmxcxzhptngqbbqpk.supabase.co/storage/v1/object/public/newsletters/', '')
WHERE pdf_url IS NOT NULL AND file_path IS NULL;

-- Create function to increment download count
CREATE OR REPLACE FUNCTION public.increment_newsletter_downloads(newsletter_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE newsletters 
  SET download_count = COALESCE(download_count, 0) + 1 
  WHERE id = newsletter_id;
END;
$$;