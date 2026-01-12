-- Add RLS policy for management to view all published courses
CREATE POLICY "Management can view published courses"
ON public.courses
FOR SELECT
USING (
  status = 'published' AND
  has_role(auth.uid(), 'management'::app_role)
);

-- Add RLS policy for management to view course modules
CREATE POLICY "Management can view course modules"
ON public.course_modules
FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  course_id IN (
    SELECT id FROM public.courses WHERE status = 'published'
  )
);

-- Add RLS policy for management to view course sessions
CREATE POLICY "Management can view course sessions"
ON public.course_sessions
FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  course_id IN (
    SELECT id FROM public.courses WHERE status = 'published'
  )
);

-- Add RLS policy for management to view course content
CREATE POLICY "Management can view course content"
ON public.course_content
FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) AND
  course_id IN (
    SELECT id FROM public.courses WHERE status = 'published'
  )
);

-- Add storage policy for authenticated users to read course content
CREATE POLICY "Authenticated users can read course content"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated'
);