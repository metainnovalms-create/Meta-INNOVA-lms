-- Create class_module_assignments table for granular module control per class
CREATE TABLE public.class_module_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_assignment_id UUID NOT NULL REFERENCES public.course_class_assignments(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN DEFAULT false,
  unlock_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_assignment_id, module_id)
);

-- Create class_session_assignments table for granular session control
CREATE TABLE public.class_session_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_module_assignment_id UUID NOT NULL REFERENCES public.class_module_assignments(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.course_sessions(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN DEFAULT false,
  unlock_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(class_module_assignment_id, session_id)
);

-- Create student_content_completions table for tracking progress
CREATE TABLE public.student_content_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.course_content(id) ON DELETE CASCADE,
  class_assignment_id UUID NOT NULL REFERENCES public.course_class_assignments(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  watch_percentage INTEGER DEFAULT 0,
  UNIQUE(student_id, content_id, class_assignment_id)
);

-- Enable RLS on new tables
ALTER TABLE public.class_module_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_session_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_content_completions ENABLE ROW LEVEL SECURITY;

-- RLS for class_module_assignments

-- Super admins full access
CREATE POLICY "Super admins can manage all module assignments"
ON public.class_module_assignments FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- System admins full access
CREATE POLICY "System admins can manage all module assignments"
ON public.class_module_assignments FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- Officers can view all module assignments (read-only)
CREATE POLICY "Officers can view module assignments"
ON public.class_module_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'officer') AND
  class_assignment_id IN (
    SELECT id FROM public.course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

-- Management can manage their institution's module assignments
CREATE POLICY "Management can manage institution module assignments"
ON public.class_module_assignments FOR ALL
USING (
  has_role(auth.uid(), 'management') AND
  class_assignment_id IN (
    SELECT id FROM public.course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

-- Students can view only unlocked modules for their class
CREATE POLICY "Students can view unlocked modules"
ON public.class_module_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'student') AND
  is_unlocked = true AND
  class_assignment_id IN (
    SELECT cca.id FROM public.course_class_assignments cca
    JOIN public.profiles p ON p.class_id = cca.class_id
    WHERE p.id = auth.uid()
  )
);

-- Teachers can view module assignments for their institution
CREATE POLICY "Teachers can view module assignments"
ON public.class_module_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') AND
  class_assignment_id IN (
    SELECT id FROM public.course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

-- RLS for class_session_assignments

-- Super admins full access
CREATE POLICY "Super admins can manage all session assignments"
ON public.class_session_assignments FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- System admins full access
CREATE POLICY "System admins can manage all session assignments"
ON public.class_session_assignments FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- Officers can view all session assignments (read-only)
CREATE POLICY "Officers can view session assignments"
ON public.class_session_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'officer') AND
  class_module_assignment_id IN (
    SELECT cma.id FROM public.class_module_assignments cma
    JOIN public.course_class_assignments cca ON cca.id = cma.class_assignment_id
    WHERE cca.institution_id = get_user_institution_id(auth.uid())
  )
);

-- Management can manage their institution's session assignments
CREATE POLICY "Management can manage institution session assignments"
ON public.class_session_assignments FOR ALL
USING (
  has_role(auth.uid(), 'management') AND
  class_module_assignment_id IN (
    SELECT cma.id FROM public.class_module_assignments cma
    JOIN public.course_class_assignments cca ON cca.id = cma.class_assignment_id
    WHERE cca.institution_id = get_user_institution_id(auth.uid())
  )
);

-- Students can view only unlocked sessions for their class
CREATE POLICY "Students can view unlocked sessions"
ON public.class_session_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'student') AND
  is_unlocked = true AND
  class_module_assignment_id IN (
    SELECT cma.id FROM public.class_module_assignments cma
    JOIN public.course_class_assignments cca ON cca.id = cma.class_assignment_id
    JOIN public.profiles p ON p.class_id = cca.class_id
    WHERE p.id = auth.uid() AND cma.is_unlocked = true
  )
);

-- Teachers can view session assignments for their institution
CREATE POLICY "Teachers can view session assignments"
ON public.class_session_assignments FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') AND
  class_module_assignment_id IN (
    SELECT cma.id FROM public.class_module_assignments cma
    JOIN public.course_class_assignments cca ON cca.id = cma.class_assignment_id
    WHERE cca.institution_id = get_user_institution_id(auth.uid())
  )
);

-- RLS for student_content_completions

-- Super admins full access
CREATE POLICY "Super admins can manage all completions"
ON public.student_content_completions FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

-- System admins full access
CREATE POLICY "System admins can manage all completions"
ON public.student_content_completions FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

-- Students can manage their own completions
CREATE POLICY "Students can manage own completions"
ON public.student_content_completions FOR ALL
USING (student_id = auth.uid());

-- Teachers can view completions for their institution
CREATE POLICY "Teachers can view institution completions"
ON public.student_content_completions FOR SELECT
USING (
  has_role(auth.uid(), 'teacher') AND
  class_assignment_id IN (
    SELECT id FROM public.course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

-- Management can view completions for their institution
CREATE POLICY "Management can view institution completions"
ON public.student_content_completions FOR SELECT
USING (
  has_role(auth.uid(), 'management') AND
  class_assignment_id IN (
    SELECT id FROM public.course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

-- Officers can view completions for their institution
CREATE POLICY "Officers can view institution completions"
ON public.student_content_completions FOR SELECT
USING (
  has_role(auth.uid(), 'officer') AND
  class_assignment_id IN (
    SELECT id FROM public.course_class_assignments
    WHERE institution_id = get_user_institution_id(auth.uid())
  )
);

-- Create updated_at triggers
CREATE TRIGGER update_class_module_assignments_updated_at
  BEFORE UPDATE ON public.class_module_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_class_session_assignments_updated_at
  BEFORE UPDATE ON public.class_session_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();