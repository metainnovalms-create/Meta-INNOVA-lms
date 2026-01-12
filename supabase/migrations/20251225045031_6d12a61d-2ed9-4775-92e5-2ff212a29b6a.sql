-- Add policy to allow officers to view all active/published courses (view-only for CEO courses)
CREATE POLICY "Officers can view all active courses" 
ON public.courses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND status IN ('active', 'published')
);