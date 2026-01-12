-- Allow officers to INSERT grants for their own assigned classes
-- This enables self-delegation for upcoming classes

CREATE POLICY "Officers can grant access for their own classes"
ON public.officer_class_access_grants
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'officer'::app_role) 
  AND granting_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM institution_timetable_assignments ita
    WHERE ita.class_id = officer_class_access_grants.class_id
    AND ita.institution_id = officer_class_access_grants.institution_id
    AND (
      ita.teacher_id = granting_officer_id 
      OR ita.secondary_officer_id = granting_officer_id 
      OR ita.backup_officer_id = granting_officer_id
    )
  )
);

-- Also allow officers to view grants they created (not just received)
CREATE POLICY "Officers can view grants they created"
ON public.officer_class_access_grants
FOR SELECT
TO authenticated
USING (
  granting_officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())
);
