-- Add columns for leave balance adjustments
ALTER TABLE leave_balances 
ADD COLUMN IF NOT EXISTS additional_credit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS adjustment_reason TEXT,
ADD COLUMN IF NOT EXISTS adjusted_by UUID,
ADD COLUMN IF NOT EXISTS adjusted_at TIMESTAMPTZ;