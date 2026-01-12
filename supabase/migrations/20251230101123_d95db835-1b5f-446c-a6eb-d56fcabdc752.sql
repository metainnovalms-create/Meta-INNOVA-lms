-- Add institution_name column if not exists
ALTER TABLE public.event_interests 
ADD COLUMN IF NOT EXISTS institution_name text;

-- Drop existing delete policy if exists
DROP POLICY IF EXISTS "Students can remove own interest" ON public.event_interests;

-- Create DELETE policy for students to remove their own interest
CREATE POLICY "Students can remove own interest" 
ON public.event_interests 
FOR DELETE 
USING (student_id = auth.uid());