-- Fix RLS policy to allow status transition on submit
DROP POLICY IF EXISTS "Students can update own in-progress attempts" ON assessment_attempts;

CREATE POLICY "Students can update own in-progress attempts"
  ON assessment_attempts FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'student') 
    AND student_id = auth.uid() 
    AND status = 'in_progress'
  )
  WITH CHECK (
    has_role(auth.uid(), 'student') 
    AND student_id = auth.uid()
    AND status IN ('in_progress', 'submitted', 'auto_submitted')
  );

-- Add retake_allowed column for retake feature
ALTER TABLE assessment_attempts 
ADD COLUMN IF NOT EXISTS retake_allowed boolean DEFAULT false;

-- Add policy for officers to manage attempts (for retake feature)
DROP POLICY IF EXISTS "Officers can update institution attempts for retakes" ON assessment_attempts;

CREATE POLICY "Officers can update institution attempts for retakes"
  ON assessment_attempts FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'officer') 
    AND institution_id = get_user_institution_id(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'officer') 
    AND institution_id = get_user_institution_id(auth.uid())
  );