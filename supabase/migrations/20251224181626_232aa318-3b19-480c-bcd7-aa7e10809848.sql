-- Add RLS policy for Management to view institution course assignments
CREATE POLICY "Management can view own institution class assignments" 
ON course_class_assignments
FOR SELECT USING (
  has_role(auth.uid(), 'management'::app_role) AND 
  (institution_id = get_user_institution_id(auth.uid()))
);

-- Add RLS policy for Students to view their class course assignments
CREATE POLICY "Students can view own class course assignments" 
ON course_class_assignments
FOR SELECT USING (
  has_role(auth.uid(), 'student'::app_role) AND 
  class_id = (SELECT class_id FROM profiles WHERE id = auth.uid() LIMIT 1)
);