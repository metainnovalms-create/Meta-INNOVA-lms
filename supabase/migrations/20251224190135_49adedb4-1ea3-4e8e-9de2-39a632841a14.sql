-- Drop existing management policies for courses and related tables
DROP POLICY IF EXISTS "Management can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Management can view course modules" ON public.course_modules;
DROP POLICY IF EXISTS "Management can view course sessions" ON public.course_sessions;
DROP POLICY IF EXISTS "Management can view course content" ON public.course_content;

-- Create new policies for management to see active courses
CREATE POLICY "Management can view active courses" 
ON public.courses 
FOR SELECT 
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND status IN ('active', 'published')
);

-- Management can view modules of active/published courses
CREATE POLICY "Management can view course modules" 
ON public.course_modules 
FOR SELECT 
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND course_id IN (
    SELECT id FROM public.courses 
    WHERE status IN ('active', 'published')
  )
);

-- Management can view sessions of active/published courses
CREATE POLICY "Management can view course sessions" 
ON public.course_sessions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND course_id IN (
    SELECT id FROM public.courses 
    WHERE status IN ('active', 'published')
  )
);

-- Management can view content of active/published courses
CREATE POLICY "Management can view course content" 
ON public.course_content 
FOR SELECT 
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND course_id IN (
    SELECT id FROM public.courses 
    WHERE status IN ('active', 'published')
  )
);