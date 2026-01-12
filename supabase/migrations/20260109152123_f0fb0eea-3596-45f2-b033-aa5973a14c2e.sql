-- Allow officers to view other officers in the same institution for substitution
CREATE POLICY "Officers can view institution officers for substitution"
ON public.officers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND assigned_institutions && (
    SELECT assigned_institutions 
    FROM public.officers 
    WHERE user_id = auth.uid()
  )
);