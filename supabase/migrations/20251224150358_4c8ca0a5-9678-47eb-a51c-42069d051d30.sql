-- Allow students to read the data needed for their timetable

-- Students can view period configuration for their own institution
CREATE POLICY "Students can view own institution periods"
ON public.institution_periods
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND institution_id = get_user_institution_id(auth.uid())
);

-- Students can view timetable assignments for their own class (based on their profile)
CREATE POLICY "Students can view own class timetable"
ON public.institution_timetable_assignments
FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role)
  AND institution_id = get_user_institution_id(auth.uid())
  AND class_id = (
    SELECT p.class_id
    FROM public.profiles p
    WHERE p.id = auth.uid()
    LIMIT 1
  )
);