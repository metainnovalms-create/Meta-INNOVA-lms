-- Add license management columns to institutions table
ALTER TABLE public.institutions 
ADD COLUMN IF NOT EXISTS max_users integer DEFAULT 500,
ADD COLUMN IF NOT EXISTS license_expiry date DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
ADD COLUMN IF NOT EXISTS current_users integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS license_type text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS contract_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS contract_expiry_date date DEFAULT (CURRENT_DATE + INTERVAL '1 year');

-- Add check constraints for valid values
ALTER TABLE public.institutions 
ADD CONSTRAINT valid_license_type 
CHECK (license_type IN ('basic', 'standard', 'premium', 'enterprise'));

-- Add admin_user_id to track the institution admin for password reset
ALTER TABLE public.institutions 
ADD COLUMN IF NOT EXISTS admin_user_id uuid REFERENCES auth.users(id);