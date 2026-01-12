-- Add RLS policy for officers to view institution profiles (for substitution dropdown)
CREATE POLICY "Officers can view institution profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
);

-- Fix existing officers with missing institution_id in profiles
UPDATE profiles 
SET institution_id = (
  SELECT assigned_institutions[1] 
  FROM officers 
  WHERE officers.user_id = profiles.id 
  AND array_length(assigned_institutions, 1) > 0
)
WHERE id IN (
  SELECT user_id FROM officers 
  WHERE user_id IS NOT NULL
)
AND institution_id IS NULL;