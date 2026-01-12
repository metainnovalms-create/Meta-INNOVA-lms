-- Add banking and leave columns to profiles table for staff management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS bank_branch TEXT,
ADD COLUMN IF NOT EXISTS casual_leave_allowance INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS sick_leave_allowance INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS annual_leave_allowance INTEGER DEFAULT 22;