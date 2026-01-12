-- Add unique constraint to student_xp_transactions for the ON CONFLICT clause
CREATE UNIQUE INDEX IF NOT EXISTS student_xp_unique_activity 
ON student_xp_transactions (student_id, activity_type, activity_id);

-- Add passing_marks column to assignments table
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS passing_marks INTEGER DEFAULT 40;