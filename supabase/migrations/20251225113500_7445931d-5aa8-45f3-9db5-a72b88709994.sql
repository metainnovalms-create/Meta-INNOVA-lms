-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  
  -- Status Management
  status TEXT NOT NULL DEFAULT 'yet_to_start', -- 'yet_to_start', 'ongoing', 'completed'
  is_published BOOLEAN DEFAULT false,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Officer (Creator)
  created_by_officer_id UUID NOT NULL REFERENCES public.officers(id),
  created_by_officer_name TEXT NOT NULL,
  
  -- SDG Goals (Array of SDG numbers like [1, 6, 11])
  sdg_goals JSONB DEFAULT '[]'::jsonb,
  
  -- Remarks
  remarks TEXT,
  
  -- Timeline
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  
  -- Showcase
  is_showcase BOOLEAN DEFAULT false,
  showcase_image_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_members table (Student Assignments)
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'leader', 'member'
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by_officer_id UUID REFERENCES public.officers(id),
  
  UNIQUE(project_id, student_id)
);

-- Create project_progress_updates table
CREATE TABLE public.project_progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  updated_by_officer_id UUID REFERENCES public.officers(id),
  updated_by_officer_name TEXT NOT NULL,
  attachment_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create project_achievements table (Awards/Certificates)
CREATE TABLE public.project_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'award', -- 'award', 'participation', 'achievement'
  event_name TEXT,
  event_date DATE,
  description TEXT,
  certificate_url TEXT,
  added_by_officer_id UUID REFERENCES public.officers(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_achievements ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- RLS POLICIES FOR projects TABLE
-- =====================================================

-- Super admins can manage all projects
CREATE POLICY "Super admins can manage all projects"
ON public.projects FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- System admins can view all projects
CREATE POLICY "System admins can view all projects"
ON public.projects FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'::app_role));

-- CEO can delete projects (system_admin with is_ceo = true)
CREATE POLICY "CEO can delete projects"
ON public.projects FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'system_admin'::app_role)
  AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_ceo = true)
);

-- Officers can view institution projects
CREATE POLICY "Officers can view institution projects"
ON public.projects FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND institution_id = public.get_user_institution_id(auth.uid())
);

-- Officers can insert projects for their institution
CREATE POLICY "Officers can insert projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND institution_id = public.get_user_institution_id(auth.uid())
);

-- Officers can update their own created projects
CREATE POLICY "Officers can update own projects"
ON public.projects FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND created_by_officer_id IN (
    SELECT id FROM public.officers WHERE user_id = auth.uid()
  )
);

-- Management can view institution projects
CREATE POLICY "Management can view institution projects"
ON public.projects FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'management'::app_role)
  AND institution_id = public.get_user_institution_id(auth.uid())
);

-- Students can view only their assigned published projects
CREATE POLICY "Students can view assigned projects"
ON public.projects FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'student'::app_role)
  AND is_published = true
  AND id IN (
    SELECT pm.project_id FROM public.project_members pm
    JOIN public.students s ON s.id = pm.student_id
    WHERE s.user_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES FOR project_members TABLE
-- =====================================================

-- Super admins can manage all project members
CREATE POLICY "Super admins can manage all project members"
ON public.project_members FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- System admins can view all project members
CREATE POLICY "System admins can view all project members"
ON public.project_members FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'::app_role));

-- Officers can manage project members for their projects
CREATE POLICY "Officers can manage project members"
ON public.project_members FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
);

-- Management can view project members
CREATE POLICY "Management can view project members"
ON public.project_members FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'management'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
);

-- Students can view their own membership
CREATE POLICY "Students can view own membership"
ON public.project_members FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'student'::app_role)
  AND student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES FOR project_progress_updates TABLE
-- =====================================================

-- Super admins can manage all progress updates
CREATE POLICY "Super admins can manage all progress updates"
ON public.project_progress_updates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- System admins can view all progress updates
CREATE POLICY "System admins can view all progress updates"
ON public.project_progress_updates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'::app_role));

-- Officers can manage progress updates for their institution projects
CREATE POLICY "Officers can manage progress updates"
ON public.project_progress_updates FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
);

-- Management can view progress updates
CREATE POLICY "Management can view progress updates"
ON public.project_progress_updates FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'management'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
);

-- Students can view progress updates for their projects
CREATE POLICY "Students can view progress updates"
ON public.project_progress_updates FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'student'::app_role)
  AND project_id IN (
    SELECT pm.project_id FROM public.project_members pm
    JOIN public.students s ON s.id = pm.student_id
    WHERE s.user_id = auth.uid()
  )
);

-- =====================================================
-- RLS POLICIES FOR project_achievements TABLE
-- =====================================================

-- Super admins can manage all achievements
CREATE POLICY "Super admins can manage all achievements"
ON public.project_achievements FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- System admins can view all achievements
CREATE POLICY "System admins can view all achievements"
ON public.project_achievements FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'system_admin'::app_role));

-- Officers can manage achievements for their institution projects
CREATE POLICY "Officers can manage achievements"
ON public.project_achievements FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'officer'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
);

-- Management can view achievements
CREATE POLICY "Management can view achievements"
ON public.project_achievements FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'management'::app_role)
  AND project_id IN (
    SELECT id FROM public.projects 
    WHERE institution_id = public.get_user_institution_id(auth.uid())
  )
);

-- Students can view achievements for their projects
CREATE POLICY "Students can view achievements"
ON public.project_achievements FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'student'::app_role)
  AND project_id IN (
    SELECT pm.project_id FROM public.project_members pm
    JOIN public.students s ON s.id = pm.student_id
    WHERE s.user_id = auth.uid()
  )
);

-- =====================================================
-- STORAGE BUCKET FOR PROJECT FILES
-- =====================================================

-- Create bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project-files bucket
CREATE POLICY "Authenticated users can view project files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-files');

CREATE POLICY "Officers can upload project files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND public.has_role(auth.uid(), 'officer'::app_role)
);

CREATE POLICY "Officers can update project files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'project-files'
  AND public.has_role(auth.uid(), 'officer'::app_role)
);

CREATE POLICY "Officers can delete project files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-files'
  AND public.has_role(auth.uid(), 'officer'::app_role)
);