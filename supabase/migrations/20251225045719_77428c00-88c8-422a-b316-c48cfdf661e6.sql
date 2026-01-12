-- Add policy to allow officers to view modules for all active/published courses
CREATE POLICY "Officers can view all active course modules" 
ON public.course_modules 
FOR SELECT 
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND course_id IN (
    SELECT id FROM courses 
    WHERE status IN ('active', 'published')
  )
);

-- Add policy to allow officers to view sessions for all active/published courses
CREATE POLICY "Officers can view all active course sessions" 
ON public.course_sessions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND course_id IN (
    SELECT id FROM courses 
    WHERE status IN ('active', 'published')
  )
);

-- Add policy to allow officers to view content for all active/published courses
CREATE POLICY "Officers can view all active course content" 
ON public.course_content 
FOR SELECT 
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND course_id IN (
    SELECT id FROM courses 
    WHERE status IN ('active', 'published')
  )
);