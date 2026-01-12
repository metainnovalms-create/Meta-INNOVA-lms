-- Create surveys table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_by_name TEXT NOT NULL,
  institution_id UUID REFERENCES public.institutions(id), -- NULL = all institutions
  target_audience TEXT NOT NULL DEFAULT 'all_students', -- 'all_students', 'specific_institution', 'specific_class'
  target_class_ids UUID[] DEFAULT '{}',
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed', 'draft'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey_questions table
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL, -- 'mcq', 'multiple_select', 'rating', 'text', 'long_text', 'linear_scale'
  options JSONB DEFAULT '[]',
  is_required BOOLEAN DEFAULT true,
  scale_min INTEGER,
  scale_max INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  class_id UUID REFERENCES public.classes(id),
  status TEXT NOT NULL DEFAULT 'submitted', -- 'draft', 'submitted'
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(survey_id, student_id)
);

-- Create survey_response_answers table
CREATE TABLE public.survey_response_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  answer_number INTEGER,
  answer_options JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student_feedback table
CREATE TABLE public.student_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id),
  student_name TEXT,
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  category TEXT NOT NULL, -- 'course', 'officer', 'facility', 'general', 'other'
  subject TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_anonymous BOOLEAN DEFAULT false,
  related_course_id UUID REFERENCES public.courses(id),
  related_officer_id UUID REFERENCES public.officers(id),
  status TEXT NOT NULL DEFAULT 'submitted', -- 'submitted', 'under_review', 'resolved', 'dismissed'
  admin_response TEXT,
  admin_response_by UUID REFERENCES public.profiles(id),
  admin_response_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_response_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_feedback ENABLE ROW LEVEL SECURITY;

-- Surveys RLS Policies
CREATE POLICY "Super admins can manage all surveys"
ON public.surveys FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all surveys"
ON public.surveys FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Officers can view institution surveys"
ON public.surveys FOR SELECT
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role) AND (
    institution_id = public.get_user_institution_id(auth.uid()) OR
    institution_id IS NULL OR
    target_audience = 'all_students'
  )
);

CREATE POLICY "Management can view institution surveys"
ON public.surveys FOR SELECT
USING (
  public.has_role(auth.uid(), 'management'::public.app_role) AND (
    institution_id = public.get_user_institution_id(auth.uid()) OR
    institution_id IS NULL OR
    target_audience = 'all_students'
  )
);

CREATE POLICY "Students can view active surveys targeting them"
ON public.surveys FOR SELECT
USING (
  public.has_role(auth.uid(), 'student'::public.app_role) AND
  status = 'active' AND (
    target_audience = 'all_students' OR
    (target_audience = 'specific_institution' AND institution_id = public.get_user_institution_id(auth.uid())) OR
    (target_audience = 'specific_class' AND (SELECT class_id FROM public.profiles WHERE id = auth.uid()) = ANY(target_class_ids))
  )
);

-- Survey Questions RLS Policies
CREATE POLICY "Super admins can manage all survey questions"
ON public.survey_questions FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all survey questions"
ON public.survey_questions FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Anyone can view survey questions for visible surveys"
ON public.survey_questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.surveys s
    WHERE s.id = survey_id
  )
);

-- Survey Responses RLS Policies
CREATE POLICY "Super admins can manage all survey responses"
ON public.survey_responses FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all survey responses"
ON public.survey_responses FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Officers can view institution survey responses"
ON public.survey_responses FOR SELECT
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role) AND
  institution_id = public.get_user_institution_id(auth.uid())
);

CREATE POLICY "Management can view institution survey responses"
ON public.survey_responses FOR SELECT
USING (
  public.has_role(auth.uid(), 'management'::public.app_role) AND
  institution_id = public.get_user_institution_id(auth.uid())
);

CREATE POLICY "Students can manage own survey responses"
ON public.survey_responses FOR ALL
USING (
  public.has_role(auth.uid(), 'student'::public.app_role) AND
  student_id = auth.uid()
);

-- Survey Response Answers RLS Policies
CREATE POLICY "Super admins can manage all response answers"
ON public.survey_response_answers FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all response answers"
ON public.survey_response_answers FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Users can view answers for visible responses"
ON public.survey_response_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.survey_responses sr
    WHERE sr.id = response_id
  )
);

CREATE POLICY "Students can insert own response answers"
ON public.survey_response_answers FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'student'::public.app_role) AND
  EXISTS (
    SELECT 1 FROM public.survey_responses sr
    WHERE sr.id = response_id AND sr.student_id = auth.uid()
  )
);

-- Student Feedback RLS Policies
CREATE POLICY "Super admins can manage all student feedback"
ON public.student_feedback FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all student feedback"
ON public.student_feedback FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Officers can view and respond to institution feedback"
ON public.student_feedback FOR ALL
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role) AND
  institution_id = public.get_user_institution_id(auth.uid())
);

CREATE POLICY "Management can view institution feedback"
ON public.student_feedback FOR SELECT
USING (
  public.has_role(auth.uid(), 'management'::public.app_role) AND
  institution_id = public.get_user_institution_id(auth.uid())
);

CREATE POLICY "Students can manage own feedback"
ON public.student_feedback FOR ALL
USING (
  public.has_role(auth.uid(), 'student'::public.app_role) AND
  student_id = auth.uid()
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.surveys;
ALTER PUBLICATION supabase_realtime ADD TABLE public.survey_responses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_feedback;

-- Set REPLICA IDENTITY for complete row data in realtime
ALTER TABLE public.surveys REPLICA IDENTITY FULL;
ALTER TABLE public.survey_responses REPLICA IDENTITY FULL;
ALTER TABLE public.student_feedback REPLICA IDENTITY FULL;

-- Create indexes for performance
CREATE INDEX idx_surveys_status ON public.surveys(status);
CREATE INDEX idx_surveys_institution ON public.surveys(institution_id);
CREATE INDEX idx_survey_questions_survey ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_responses_survey ON public.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_student ON public.survey_responses(student_id);
CREATE INDEX idx_student_feedback_institution ON public.student_feedback(institution_id);
CREATE INDEX idx_student_feedback_status ON public.student_feedback(status);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_survey_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_survey_updated_at();

CREATE TRIGGER update_survey_responses_updated_at
  BEFORE UPDATE ON public.survey_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_survey_updated_at();

CREATE TRIGGER update_student_feedback_updated_at
  BEFORE UPDATE ON public.student_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_survey_updated_at();