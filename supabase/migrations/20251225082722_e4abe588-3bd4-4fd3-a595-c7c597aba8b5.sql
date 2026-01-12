-- Update RLS policies for officer_class_access_grants
-- Officers can only SELECT (view) their grants, not create/update/delete
-- Only management, system_admin, super_admin can manage grants

-- First, drop the existing officer policies that allow INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Officers can create grants for own classes" ON officer_class_access_grants;
DROP POLICY IF EXISTS "Officers can update own grants" ON officer_class_access_grants;
DROP POLICY IF EXISTS "Officers can delete own grants" ON officer_class_access_grants;

-- Add a policy for management to manage grants within their institution
CREATE POLICY "Management can manage institution grants"
ON officer_class_access_grants
FOR ALL
USING (
  has_role(auth.uid(), 'management') 
  AND institution_id = get_user_institution_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'management') 
  AND institution_id = get_user_institution_id(auth.uid())
);