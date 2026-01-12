-- Performance Appraisals Table
CREATE TABLE public.performance_appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
  trainer_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  institution_id UUID REFERENCES public.institutions(id),
  institution_name TEXT NOT NULL,
  reporting_period_from DATE NOT NULL,
  reporting_period_to DATE NOT NULL,
  lab_domains TEXT[] DEFAULT '{}',
  total_projects_mentored INTEGER DEFAULT 0,
  total_instructional_hours INTEGER DEFAULT 0,
  key_contributions TEXT[] DEFAULT '{}',
  innovations_introduced TEXT[] DEFAULT '{}',
  student_mentorship_experience TEXT,
  collaboration_coordination TEXT,
  student_feedback JSONB DEFAULT '{}',
  student_comments_summary TEXT,
  future_goals TEXT[] DEFAULT '{}',
  planned_trainings TEXT[] DEFAULT '{}',
  support_needed TEXT,
  manager_review JSONB,
  principal_review JSONB,
  hr_review JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'manager_reviewed', 'principal_reviewed', 'completed')),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Appraisal Projects Table (child table)
CREATE TABLE public.appraisal_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id UUID NOT NULL REFERENCES public.performance_appraisals(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  grade_level TEXT,
  domain TEXT,
  contest_name TEXT,
  level TEXT CHECK (level IN ('school', 'district', 'state', 'national', 'international')),
  result TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- HR Ratings Table
CREATE TABLE public.hr_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
  trainer_name TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('Q1', 'Q2', 'Q3', 'Q4')),
  year INTEGER NOT NULL,
  total_stars_quarter INTEGER DEFAULT 0,
  cumulative_stars_year INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trainer_id, period, year)
);

-- HR Rating Projects Table (child table)
CREATE TABLE public.hr_rating_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_rating_id UUID NOT NULL REFERENCES public.hr_ratings(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  competition_level TEXT,
  result TEXT,
  stars_earned INTEGER DEFAULT 0 CHECK (stars_earned >= 0 AND stars_earned <= 5),
  verified_by_hr BOOLEAN DEFAULT false,
  verified_date TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_performance_appraisals_trainer ON public.performance_appraisals(trainer_id);
CREATE INDEX idx_performance_appraisals_institution ON public.performance_appraisals(institution_id);
CREATE INDEX idx_performance_appraisals_status ON public.performance_appraisals(status);
CREATE INDEX idx_appraisal_projects_appraisal ON public.appraisal_projects(appraisal_id);
CREATE INDEX idx_hr_ratings_trainer ON public.hr_ratings(trainer_id);
CREATE INDEX idx_hr_ratings_period_year ON public.hr_ratings(period, year);
CREATE INDEX idx_hr_rating_projects_rating ON public.hr_rating_projects(hr_rating_id);

-- Enable Row Level Security
ALTER TABLE public.performance_appraisals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appraisal_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_rating_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for performance_appraisals
CREATE POLICY "Super admins can manage all appraisals"
ON public.performance_appraisals FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all appraisals"
ON public.performance_appraisals FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Officers can view own appraisals"
ON public.performance_appraisals FOR SELECT
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role)
  AND trainer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
);

CREATE POLICY "Management can view institution appraisals"
ON public.performance_appraisals FOR SELECT
USING (
  public.has_role(auth.uid(), 'management'::public.app_role)
  AND institution_id = public.get_user_institution_id(auth.uid())
);

-- RLS Policies for appraisal_projects
CREATE POLICY "Super admins can manage all appraisal projects"
ON public.appraisal_projects FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all appraisal projects"
ON public.appraisal_projects FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Officers can view own appraisal projects"
ON public.appraisal_projects FOR SELECT
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role)
  AND appraisal_id IN (
    SELECT id FROM public.performance_appraisals
    WHERE trainer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Management can view institution appraisal projects"
ON public.appraisal_projects FOR SELECT
USING (
  public.has_role(auth.uid(), 'management'::public.app_role)
  AND appraisal_id IN (
    SELECT id FROM public.performance_appraisals
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
);

-- RLS Policies for hr_ratings
CREATE POLICY "Super admins can manage all hr ratings"
ON public.hr_ratings FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all hr ratings"
ON public.hr_ratings FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Officers can view own hr ratings"
ON public.hr_ratings FOR SELECT
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role)
  AND trainer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
);

-- RLS Policies for hr_rating_projects
CREATE POLICY "Super admins can manage all hr rating projects"
ON public.hr_rating_projects FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));

CREATE POLICY "System admins can manage all hr rating projects"
ON public.hr_rating_projects FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'::public.app_role));

CREATE POLICY "Officers can view own hr rating projects"
ON public.hr_rating_projects FOR SELECT
USING (
  public.has_role(auth.uid(), 'officer'::public.app_role)
  AND hr_rating_id IN (
    SELECT id FROM public.hr_ratings
    WHERE trainer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
  )
);

-- Enable real-time for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_appraisals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hr_ratings;
ALTER TABLE public.performance_appraisals REPLICA IDENTITY FULL;
ALTER TABLE public.hr_ratings REPLICA IDENTITY FULL;

-- Create triggers for updated_at
CREATE TRIGGER update_performance_appraisals_updated_at
BEFORE UPDATE ON public.performance_appraisals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hr_ratings_updated_at
BEFORE UPDATE ON public.hr_ratings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();