-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  thumbnail_url TEXT,
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  duration_weeks INTEGER DEFAULT 4,
  prerequisites TEXT,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  sdg_goals JSONB DEFAULT '[]'::jsonb,
  certificate_template_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_sessions table
CREATE TABLE public.course_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_content table
CREATE TABLE public.course_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pdf', 'ppt', 'youtube'
  file_path TEXT, -- storage path for PDFs/PPTs
  youtube_url TEXT, -- for YouTube links
  duration_minutes INTEGER,
  file_size_mb NUMERIC,
  display_order INTEGER NOT NULL DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_institution_assignments table (to assign courses to institutions)
CREATE TABLE public.course_institution_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, institution_id)
);

-- Create course_class_assignments table (to assign courses to specific classes)
CREATE TABLE public.course_class_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, class_id)
);

-- Create indexes for performance
CREATE INDEX idx_course_modules_course_id ON public.course_modules(course_id);
CREATE INDEX idx_course_sessions_module_id ON public.course_sessions(module_id);
CREATE INDEX idx_course_sessions_course_id ON public.course_sessions(course_id);
CREATE INDEX idx_course_content_session_id ON public.course_content(session_id);
CREATE INDEX idx_course_content_module_id ON public.course_content(module_id);
CREATE INDEX idx_course_content_course_id ON public.course_content(course_id);
CREATE INDEX idx_course_institution_assignments_course_id ON public.course_institution_assignments(course_id);
CREATE INDEX idx_course_institution_assignments_institution_id ON public.course_institution_assignments(institution_id);
CREATE INDEX idx_course_class_assignments_course_id ON public.course_class_assignments(course_id);
CREATE INDEX idx_course_class_assignments_class_id ON public.course_class_assignments(class_id);

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_institution_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_class_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses table
CREATE POLICY "Super admins can manage all courses"
ON public.courses FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all courses"
ON public.courses FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can view assigned courses"
ON public.courses FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Teachers can view assigned courses"
ON public.courses FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Students can view assigned courses"
ON public.courses FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) AND
  id IN (
    SELECT cca.course_id FROM public.course_class_assignments cca
    JOIN public.profiles p ON p.class_id = cca.class_id
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for course_modules table
CREATE POLICY "Super admins can manage all modules"
ON public.course_modules FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all modules"
ON public.course_modules FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can view assigned course modules"
ON public.course_modules FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  course_id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Teachers can view assigned course modules"
ON public.course_modules FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  course_id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Students can view assigned course modules"
ON public.course_modules FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) AND
  course_id IN (
    SELECT cca.course_id FROM public.course_class_assignments cca
    JOIN public.profiles p ON p.class_id = cca.class_id
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for course_sessions table
CREATE POLICY "Super admins can manage all sessions"
ON public.course_sessions FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all sessions"
ON public.course_sessions FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can view assigned course sessions"
ON public.course_sessions FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  course_id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Teachers can view assigned course sessions"
ON public.course_sessions FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  course_id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Students can view assigned course sessions"
ON public.course_sessions FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) AND
  course_id IN (
    SELECT cca.course_id FROM public.course_class_assignments cca
    JOIN public.profiles p ON p.class_id = cca.class_id
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for course_content table
CREATE POLICY "Super admins can manage all content"
ON public.course_content FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all content"
ON public.course_content FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can view assigned course content"
ON public.course_content FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  course_id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Teachers can view assigned course content"
ON public.course_content FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role) AND
  course_id IN (
    SELECT course_id FROM public.course_institution_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

CREATE POLICY "Students can view assigned course content"
ON public.course_content FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) AND
  course_id IN (
    SELECT cca.course_id FROM public.course_class_assignments cca
    JOIN public.profiles p ON p.class_id = cca.class_id
    WHERE p.id = auth.uid()
  )
);

-- RLS Policies for course_institution_assignments
CREATE POLICY "Super admins can manage all institution assignments"
ON public.course_institution_assignments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all institution assignments"
ON public.course_institution_assignments FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can view own institution assignments"
ON public.course_institution_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  institution_id = get_user_institution_id(auth.uid())
);

-- RLS Policies for course_class_assignments
CREATE POLICY "Super admins can manage all class assignments"
ON public.course_class_assignments FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all class assignments"
ON public.course_class_assignments FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can manage own institution class assignments"
ON public.course_class_assignments FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role) AND
  institution_id = get_user_institution_id(auth.uid())
);

-- Create storage bucket for course content (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-content', 'course-content', false);

-- Storage policies for course-content bucket
CREATE POLICY "Admins can upload course content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'course-content' AND
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role))
);

CREATE POLICY "Admins can update course content"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'course-content' AND
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role))
);

CREATE POLICY "Admins can delete course content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'course-content' AND
  (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'system_admin'::app_role))
);

CREATE POLICY "Authenticated users can view course content"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-content' AND
  auth.role() = 'authenticated'
);

-- Add updated_at trigger for courses table
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();