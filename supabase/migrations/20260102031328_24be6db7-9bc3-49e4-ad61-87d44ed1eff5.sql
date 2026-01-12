
-- =============================================
-- HR MANAGEMENT MODULE - DATABASE SCHEMA
-- =============================================

-- 1. Job Postings Table
CREATE TABLE public.job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time', -- 'full_time', 'part_time', 'contract'
  description TEXT,
  required_skills TEXT[],
  experience_level TEXT DEFAULT 'mid', -- 'fresher', 'junior', 'mid', 'senior', 'lead'
  min_experience_years INTEGER DEFAULT 0,
  max_experience_years INTEGER,
  number_of_openings INTEGER DEFAULT 1,
  salary_range_min DECIMAL,
  salary_range_max DECIMAL,
  status TEXT DEFAULT 'open', -- 'open', 'closed', 'on_hold'
  target_role TEXT DEFAULT 'officer', -- 'officer', 'meta_staff' (determines onboarding path)
  position_id UUID, -- For meta_staff, links to positions table
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Job Applications Table
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  experience_years INTEGER,
  skills TEXT[],
  resume_url TEXT,
  cover_letter TEXT,
  current_company TEXT,
  current_designation TEXT,
  expected_salary DECIMAL,
  notice_period_days INTEGER,
  status TEXT DEFAULT 'applied', -- 'applied', 'shortlisted', 'rejected', 'in_interview', 'selected', 'offer_sent', 'offer_accepted', 'offer_declined', 'hired'
  hr_notes TEXT,
  source TEXT DEFAULT 'direct', -- 'direct', 'referral', 'linkedin', 'job_portal'
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Interview Stages Table (Configurable per job)
CREATE TABLE public.interview_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Candidate Interviews Table
CREATE TABLE public.candidate_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES public.interview_stages(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL DEFAULT 'online', -- 'online', 'in_person', 'phone'
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  meeting_link TEXT,
  interviewer_ids UUID[],
  interviewer_names TEXT[],
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'
  result TEXT, -- 'passed', 'failed', 'on_hold'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Interview Feedback Table
CREATE TABLE public.interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.candidate_interviews(id) ON DELETE CASCADE,
  interviewer_id UUID,
  interviewer_name TEXT,
  technical_skills_rating INTEGER CHECK (technical_skills_rating >= 1 AND technical_skills_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  problem_solving_rating INTEGER CHECK (problem_solving_rating >= 1 AND problem_solving_rating <= 5),
  cultural_fit_rating INTEGER CHECK (cultural_fit_rating >= 1 AND cultural_fit_rating <= 5),
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  strengths TEXT,
  weaknesses TEXT,
  recommendation TEXT DEFAULT 'hire', -- 'strong_hire', 'hire', 'no_hire', 'strong_no_hire'
  detailed_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Candidate Offers Table
CREATE TABLE public.candidate_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.job_applications(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  department TEXT,
  offered_salary DECIMAL NOT NULL,
  joining_date DATE,
  probation_period_months INTEGER DEFAULT 6,
  benefits TEXT,
  offer_letter_url TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'accepted', 'declined', 'expired'
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  expiry_date DATE,
  candidate_response_notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_offers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES - JOB POSTINGS
-- =============================================

CREATE POLICY "Super admins can manage all job postings"
ON public.job_postings FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all job postings"
ON public.job_postings FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can view job postings"
ON public.job_postings FOR SELECT
USING (has_role(auth.uid(), 'officer'::app_role) AND status = 'open');

-- =============================================
-- RLS POLICIES - JOB APPLICATIONS
-- =============================================

CREATE POLICY "Super admins can manage all applications"
ON public.job_applications FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all applications"
ON public.job_applications FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- =============================================
-- RLS POLICIES - INTERVIEW STAGES
-- =============================================

CREATE POLICY "Super admins can manage all interview stages"
ON public.interview_stages FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all interview stages"
ON public.interview_stages FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- =============================================
-- RLS POLICIES - CANDIDATE INTERVIEWS
-- =============================================

CREATE POLICY "Super admins can manage all interviews"
ON public.candidate_interviews FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all interviews"
ON public.candidate_interviews FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- =============================================
-- RLS POLICIES - INTERVIEW FEEDBACK
-- =============================================

CREATE POLICY "Super admins can manage all feedback"
ON public.interview_feedback FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all feedback"
ON public.interview_feedback FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- =============================================
-- RLS POLICIES - CANDIDATE OFFERS
-- =============================================

CREATE POLICY "Super admins can manage all offers"
ON public.candidate_offers FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all offers"
ON public.candidate_offers FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- =============================================
-- STORAGE BUCKET FOR HR DOCUMENTS
-- =============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('hr-documents', 'hr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for hr-documents bucket
CREATE POLICY "Admins can manage HR documents"
ON storage.objects FOR ALL
USING (bucket_id = 'hr-documents' AND (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'system_admin'::app_role)
));

CREATE POLICY "Admins can upload HR documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'hr-documents' AND (
  has_role(auth.uid(), 'super_admin'::app_role) OR
  has_role(auth.uid(), 'system_admin'::app_role)
));

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_interview_stages_job_id ON public.interview_stages(job_id);
CREATE INDEX idx_candidate_interviews_application_id ON public.candidate_interviews(application_id);
CREATE INDEX idx_candidate_interviews_stage_id ON public.candidate_interviews(stage_id);
CREATE INDEX idx_interview_feedback_interview_id ON public.interview_feedback(interview_id);
CREATE INDEX idx_candidate_offers_application_id ON public.candidate_offers(application_id);

-- =============================================
-- UPDATE TRIGGERS
-- =============================================

CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_interviews_updated_at
BEFORE UPDATE ON public.candidate_interviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_offers_updated_at
BEFORE UPDATE ON public.candidate_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
