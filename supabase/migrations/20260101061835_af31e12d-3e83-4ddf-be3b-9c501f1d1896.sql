-- Add attachment columns to invoices table for purchase invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT;

-- Add comment for clarity
COMMENT ON COLUMN invoices.attachment_url IS 'URL of attached vendor bill document for purchase invoices';
COMMENT ON COLUMN invoices.attachment_name IS 'Original filename of the attached document';
COMMENT ON COLUMN invoices.attachment_type IS 'MIME type of the attached document';