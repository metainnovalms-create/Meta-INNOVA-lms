-- =============================================
-- Assessment Management System - Database Schema
-- =============================================

-- 1. Create assessments table
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished')),
  
  -- Timing
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  
  -- Scoring
  total_points INTEGER NOT NULL DEFAULT 0,
  pass_percentage INTEGER NOT NULL DEFAULT 70 CHECK (pass_percentage >= 0 AND pass_percentage <= 100),
  
  -- Settings
  auto_submit BOOLEAN NOT NULL DEFAULT true,
  auto_evaluate BOOLEAN NOT NULL DEFAULT true,
  shuffle_questions BOOLEAN NOT NULL DEFAULT false,
  show_results_immediately BOOLEAN NOT NULL DEFAULT true,
  allow_review_after_submission BOOLEAN NOT NULL DEFAULT true,
  
  -- Certificate
  certificate_template_id TEXT,
  
  -- Creator info
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_role TEXT NOT NULL DEFAULT 'system_admin' CHECK (created_by_role IN ('system_admin', 'officer')),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL, -- For officer-created assessments
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Create assessment_questions table
CREATE TABLE public.assessment_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq' CHECK (question_type IN ('mcq')),
  
  -- Options stored as JSONB array: [{id, option_label, option_text, order}]
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option_id TEXT NOT NULL,
  
  -- Scoring
  points INTEGER NOT NULL DEFAULT 1,
  
  -- Timer per question (optional)
  time_limit_seconds INTEGER,
  
  -- Media
  image_url TEXT,
  code_snippet TEXT,
  
  -- Explanation shown after submission
  explanation TEXT,
  
  -- Display order
  display_order INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create assessment_class_assignments table (publishing)
CREATE TABLE public.assessment_class_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one assessment can only be assigned once per class
  UNIQUE (assessment_id, class_id)
);

-- 4. Create assessment_attempts table
CREATE TABLE public.assessment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  time_taken_seconds INTEGER,
  
  -- Scoring
  score INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  percentage NUMERIC(5, 2) NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'evaluated')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create assessment_answers table
CREATE TABLE public.assessment_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
  selected_option_id TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  points_earned INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint: one answer per question per attempt
  UNIQUE (attempt_id, question_id)
);

-- =============================================
-- Enable Row Level Security
-- =============================================
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for assessments table
-- =============================================

-- Super admins and system admins can manage all assessments
CREATE POLICY "Super admins can manage all assessments"
  ON public.assessments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all assessments"
  ON public.assessments FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- Officers can manage assessments they created or for their institution
CREATE POLICY "Officers can view institution assessments"
  ON public.assessments FOR SELECT
  USING (
    has_role(auth.uid(), 'officer') AND (
      created_by = auth.uid() OR 
      institution_id = get_user_institution_id(auth.uid()) OR
      id IN (
        SELECT aca.assessment_id FROM assessment_class_assignments aca
        WHERE aca.institution_id = get_user_institution_id(auth.uid())
      )
    )
  );

CREATE POLICY "Officers can create assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'officer') AND 
    created_by = auth.uid() AND
    institution_id = get_user_institution_id(auth.uid())
  );

CREATE POLICY "Officers can update own assessments"
  ON public.assessments FOR UPDATE
  USING (
    has_role(auth.uid(), 'officer') AND 
    created_by = auth.uid()
  );

CREATE POLICY "Officers can delete own assessments"
  ON public.assessments FOR DELETE
  USING (
    has_role(auth.uid(), 'officer') AND 
    created_by = auth.uid()
  );

-- Students can view published assessments assigned to their class
CREATE POLICY "Students can view assigned assessments"
  ON public.assessments FOR SELECT
  USING (
    has_role(auth.uid(), 'student') AND
    status = 'published' AND
    id IN (
      SELECT aca.assessment_id 
      FROM assessment_class_assignments aca
      JOIN profiles p ON p.class_id = aca.class_id
      WHERE p.id = auth.uid()
    )
  );

-- =============================================
-- RLS Policies for assessment_questions table
-- =============================================

CREATE POLICY "Super admins can manage all questions"
  ON public.assessment_questions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all questions"
  ON public.assessment_questions FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- Officers can manage questions for their assessments
CREATE POLICY "Officers can manage own assessment questions"
  ON public.assessment_questions FOR ALL
  USING (
    has_role(auth.uid(), 'officer') AND
    assessment_id IN (
      SELECT id FROM assessments WHERE created_by = auth.uid()
    )
  );

-- Officers can view questions for assessments assigned to their institution
CREATE POLICY "Officers can view institution assessment questions"
  ON public.assessment_questions FOR SELECT
  USING (
    has_role(auth.uid(), 'officer') AND
    assessment_id IN (
      SELECT a.id FROM assessments a
      WHERE a.institution_id = get_user_institution_id(auth.uid())
      OR a.id IN (
        SELECT aca.assessment_id FROM assessment_class_assignments aca
        WHERE aca.institution_id = get_user_institution_id(auth.uid())
      )
    )
  );

-- Students can view questions for assessments they are taking
CREATE POLICY "Students can view assigned assessment questions"
  ON public.assessment_questions FOR SELECT
  USING (
    has_role(auth.uid(), 'student') AND
    assessment_id IN (
      SELECT a.id FROM assessments a
      WHERE a.status = 'published' AND a.id IN (
        SELECT aca.assessment_id 
        FROM assessment_class_assignments aca
        JOIN profiles p ON p.class_id = aca.class_id
        WHERE p.id = auth.uid()
      )
    )
  );

-- =============================================
-- RLS Policies for assessment_class_assignments table
-- =============================================

CREATE POLICY "Super admins can manage all class assignments"
  ON public.assessment_class_assignments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all class assignments"
  ON public.assessment_class_assignments FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- Officers can manage class assignments for their institution
CREATE POLICY "Officers can manage institution class assignments"
  ON public.assessment_class_assignments FOR ALL
  USING (
    has_role(auth.uid(), 'officer') AND
    institution_id = get_user_institution_id(auth.uid())
  );

-- Students can view assignments for their class
CREATE POLICY "Students can view own class assignments"
  ON public.assessment_class_assignments FOR SELECT
  USING (
    has_role(auth.uid(), 'student') AND
    class_id = (SELECT class_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- =============================================
-- RLS Policies for assessment_attempts table
-- =============================================

CREATE POLICY "Super admins can manage all attempts"
  ON public.assessment_attempts FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all attempts"
  ON public.assessment_attempts FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- Officers can view attempts for their institution
CREATE POLICY "Officers can view institution attempts"
  ON public.assessment_attempts FOR SELECT
  USING (
    has_role(auth.uid(), 'officer') AND
    institution_id = get_user_institution_id(auth.uid())
  );

-- Students can manage their own attempts
CREATE POLICY "Students can view own attempts"
  ON public.assessment_attempts FOR SELECT
  USING (
    has_role(auth.uid(), 'student') AND
    student_id = auth.uid()
  );

CREATE POLICY "Students can create own attempts"
  ON public.assessment_attempts FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'student') AND
    student_id = auth.uid()
  );

CREATE POLICY "Students can update own in-progress attempts"
  ON public.assessment_attempts FOR UPDATE
  USING (
    has_role(auth.uid(), 'student') AND
    student_id = auth.uid() AND
    status = 'in_progress'
  );

-- =============================================
-- RLS Policies for assessment_answers table
-- =============================================

CREATE POLICY "Super admins can manage all answers"
  ON public.assessment_answers FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all answers"
  ON public.assessment_answers FOR ALL
  USING (has_role(auth.uid(), 'system_admin'));

-- Officers can view answers for attempts in their institution
CREATE POLICY "Officers can view institution answers"
  ON public.assessment_answers FOR SELECT
  USING (
    has_role(auth.uid(), 'officer') AND
    attempt_id IN (
      SELECT id FROM assessment_attempts 
      WHERE institution_id = get_user_institution_id(auth.uid())
    )
  );

-- Students can manage their own answers
CREATE POLICY "Students can view own answers"
  ON public.assessment_answers FOR SELECT
  USING (
    has_role(auth.uid(), 'student') AND
    attempt_id IN (
      SELECT id FROM assessment_attempts WHERE student_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own answers"
  ON public.assessment_answers FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'student') AND
    attempt_id IN (
      SELECT id FROM assessment_attempts 
      WHERE student_id = auth.uid() AND status = 'in_progress'
    )
  );

CREATE POLICY "Students can update own answers"
  ON public.assessment_answers FOR UPDATE
  USING (
    has_role(auth.uid(), 'student') AND
    attempt_id IN (
      SELECT id FROM assessment_attempts 
      WHERE student_id = auth.uid() AND status = 'in_progress'
    )
  );

-- =============================================
-- Create indexes for performance
-- =============================================
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_assessments_institution_id ON public.assessments(institution_id);
CREATE INDEX idx_assessments_created_by ON public.assessments(created_by);
CREATE INDEX idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id);
CREATE INDEX idx_assessment_class_assignments_assessment_id ON public.assessment_class_assignments(assessment_id);
CREATE INDEX idx_assessment_class_assignments_class_id ON public.assessment_class_assignments(class_id);
CREATE INDEX idx_assessment_class_assignments_institution_id ON public.assessment_class_assignments(institution_id);
CREATE INDEX idx_assessment_attempts_assessment_id ON public.assessment_attempts(assessment_id);
CREATE INDEX idx_assessment_attempts_student_id ON public.assessment_attempts(student_id);
CREATE INDEX idx_assessment_attempts_status ON public.assessment_attempts(status);
CREATE INDEX idx_assessment_answers_attempt_id ON public.assessment_answers(attempt_id);

-- =============================================
-- Trigger for updated_at
-- =============================================
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();