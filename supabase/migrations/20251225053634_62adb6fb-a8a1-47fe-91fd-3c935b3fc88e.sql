-- Drop existing SELECT-only policy for officers
DROP POLICY IF EXISTS "Officers can view institution completions" ON student_content_completions;

-- Create new ALL policy for officers to manage completions in their institution
CREATE POLICY "Officers can manage institution completions" 
ON student_content_completions FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND class_assignment_id IN (
    SELECT id FROM course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
)
WITH CHECK (
  has_role(auth.uid(), 'officer'::app_role) 
  AND class_assignment_id IN (
    SELECT id FROM course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);