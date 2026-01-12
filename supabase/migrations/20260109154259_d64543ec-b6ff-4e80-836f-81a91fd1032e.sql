-- Drop the recursive policy causing infinite recursion
DROP POLICY IF EXISTS "Officers can view institution officers for substitution" ON public.officers;

-- Create a safe policy using the security definer function (no recursion)
CREATE POLICY "Officers can view institution officers for substitution"
ON public.officers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role)
  AND assigned_institutions @> ARRAY[public.get_user_institution_id(auth.uid())]
);