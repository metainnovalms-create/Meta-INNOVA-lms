-- Add tolerance and correction columns to officer_attendance
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS expected_check_in_time time;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS expected_check_out_time time;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS is_late_login boolean DEFAULT false;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS late_minutes integer DEFAULT 0;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS is_early_checkout boolean DEFAULT false;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS overtime_auto_generated boolean DEFAULT false;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS is_manual_correction boolean DEFAULT false;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS corrected_by uuid REFERENCES auth.users(id);
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS correction_reason text;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS original_check_in_time timestamptz;
ALTER TABLE officer_attendance ADD COLUMN IF NOT EXISTS original_check_out_time timestamptz;

-- Add same columns to staff_attendance for consistency
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS expected_check_in_time time;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS expected_check_out_time time;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS is_late_login boolean DEFAULT false;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS late_minutes integer DEFAULT 0;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS is_early_checkout boolean DEFAULT false;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS is_manual_correction boolean DEFAULT false;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS corrected_by uuid REFERENCES auth.users(id);
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS correction_reason text;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS original_check_in_time timestamptz;
ALTER TABLE staff_attendance ADD COLUMN IF NOT EXISTS original_check_out_time timestamptz;

-- Add source column to overtime_requests to track auto vs manual
ALTER TABLE overtime_requests ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE overtime_requests ADD COLUMN IF NOT EXISTS attendance_id uuid;

-- Add salary structure JSONB to officers table for detailed payroll
ALTER TABLE officers ADD COLUMN IF NOT EXISTS salary_structure jsonb DEFAULT '{
  "basic_salary": 0,
  "hra": 0,
  "conveyance_allowance": 0,
  "medical_allowance": 0,
  "special_allowance": 0,
  "pf_applicable": true,
  "esi_applicable": false,
  "pt_applicable": true,
  "tds_applicable": false
}'::jsonb;

-- Create leave_balance_adjustments table for audit trail
CREATE TABLE IF NOT EXISTS leave_balance_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_balance_id uuid REFERENCES leave_balances(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_type text NOT NULL,
  adjustment_type text NOT NULL,
  previous_value numeric(5,2) NOT NULL,
  new_value numeric(5,2) NOT NULL,
  adjustment_amount numeric(5,2) NOT NULL,
  reason text NOT NULL,
  adjusted_by uuid REFERENCES auth.users(id),
  adjusted_by_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on leave_balance_adjustments
ALTER TABLE leave_balance_adjustments ENABLE ROW LEVEL SECURITY;

-- Create policies for leave_balance_adjustments (CEO only via is_ceo flag)
CREATE POLICY "CEO can view all adjustments" ON leave_balance_adjustments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_ceo = true
    )
  );

CREATE POLICY "CEO can create adjustments" ON leave_balance_adjustments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_ceo = true
    )
  );

-- Create attendance_corrections table for audit trail
CREATE TABLE IF NOT EXISTS attendance_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id uuid NOT NULL,
  attendance_type text NOT NULL,
  field_corrected text NOT NULL,
  original_value text,
  new_value text,
  reason text NOT NULL,
  corrected_by uuid REFERENCES auth.users(id),
  corrected_by_name text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on attendance_corrections
ALTER TABLE attendance_corrections ENABLE ROW LEVEL SECURITY;

-- Create policies for attendance_corrections (CEO only)
CREATE POLICY "CEO can view all corrections" ON attendance_corrections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_ceo = true
    )
  );

CREATE POLICY "CEO can create corrections" ON attendance_corrections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_ceo = true
    )
  );