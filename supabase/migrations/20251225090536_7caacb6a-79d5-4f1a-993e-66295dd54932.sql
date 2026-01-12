-- Add RLS policies for management to view officers assigned to their institution
CREATE POLICY "Management can view institution officers"
ON public.officers
FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND assigned_institutions @> ARRAY[get_user_institution_id(auth.uid())]
);

-- Add RLS policies for management to view students in their institution
CREATE POLICY "Management can view institution students"
ON public.students
FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
);