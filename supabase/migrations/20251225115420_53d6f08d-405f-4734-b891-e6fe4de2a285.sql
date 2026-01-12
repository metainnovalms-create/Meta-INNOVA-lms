-- 1. Create SECURITY DEFINER helper functions to avoid infinite recursion

-- Function to check if user is a member of a project (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members pm
    JOIN students s ON s.id = pm.student_id
    WHERE pm.project_id = _project_id AND s.user_id = _user_id
  )
$$;

-- Function to get project's institution_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_project_institution_id(_project_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT institution_id FROM projects WHERE id = _project_id LIMIT 1
$$;

-- 2. Drop ALL existing project-related policies to recreate them properly

-- Drop projects policies
DROP POLICY IF EXISTS "Officers can manage institution projects" ON public.projects;
DROP POLICY IF EXISTS "Management can view institution projects" ON public.projects;
DROP POLICY IF EXISTS "Students can view assigned projects" ON public.projects;
DROP POLICY IF EXISTS "CEO can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can manage all projects" ON public.projects;
DROP POLICY IF EXISTS "System admins can manage all projects" ON public.projects;

-- Drop project_members policies
DROP POLICY IF EXISTS "Officers can manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Management can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Students can view own project membership" ON public.project_members;
DROP POLICY IF EXISTS "Super admins can manage all project members" ON public.project_members;
DROP POLICY IF EXISTS "System admins can manage all project members" ON public.project_members;

-- Drop project_progress_updates policies
DROP POLICY IF EXISTS "Officers can manage progress updates" ON public.project_progress_updates;
DROP POLICY IF EXISTS "Management can view progress updates" ON public.project_progress_updates;
DROP POLICY IF EXISTS "Students can view progress updates" ON public.project_progress_updates;
DROP POLICY IF EXISTS "Super admins can manage all progress updates" ON public.project_progress_updates;
DROP POLICY IF EXISTS "System admins can manage all progress updates" ON public.project_progress_updates;

-- Drop project_achievements policies
DROP POLICY IF EXISTS "Officers can manage achievements" ON public.project_achievements;
DROP POLICY IF EXISTS "Management can view achievements" ON public.project_achievements;
DROP POLICY IF EXISTS "Students can view achievements" ON public.project_achievements;
DROP POLICY IF EXISTS "Super admins can manage all achievements" ON public.project_achievements;
DROP POLICY IF EXISTS "System admins can manage all achievements" ON public.project_achievements;

-- 3. Recreate PROJECTS policies (NO circular references)

-- Officers can manage projects in their institution
CREATE POLICY "Officers can manage institution projects"
ON public.projects FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'officer'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
);

-- Management can view institution projects
CREATE POLICY "Management can view institution projects"
ON public.projects FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND institution_id = get_user_institution_id(auth.uid())
);

-- Students can view published projects they are members of
CREATE POLICY "Students can view assigned projects"
ON public.projects FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND is_published = true 
  AND is_project_member(auth.uid(), id)
);

-- CEO can delete projects (is_ceo check from profiles)
CREATE POLICY "CEO can delete projects"
ON public.projects FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_ceo = true 
    AND profiles.institution_id = projects.institution_id
  )
);

-- Super admins full access
CREATE POLICY "Super admins can manage all projects"
ON public.projects FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- System admins full access
CREATE POLICY "System admins can manage all projects"
ON public.projects FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'system_admin'::app_role));

-- 4. Recreate PROJECT_MEMBERS policies (using helper function)

-- Officers can manage members for projects in their institution
CREATE POLICY "Officers can manage project members"
ON public.project_members FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'officer'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
);

-- Management can view members
CREATE POLICY "Management can view project members"
ON public.project_members FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
);

-- Students can view their own membership
CREATE POLICY "Students can view own project membership"
ON public.project_members FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
);

-- Super admins full access
CREATE POLICY "Super admins can manage all project members"
ON public.project_members FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- System admins full access
CREATE POLICY "System admins can manage all project members"
ON public.project_members FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'system_admin'::app_role));

-- 5. Recreate PROJECT_PROGRESS_UPDATES policies (using helper function)

-- Officers can manage progress updates
CREATE POLICY "Officers can manage progress updates"
ON public.project_progress_updates FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'officer'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
);

-- Management can view progress updates
CREATE POLICY "Management can view progress updates"
ON public.project_progress_updates FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
);

-- Students can view progress updates for their projects
CREATE POLICY "Students can view progress updates"
ON public.project_progress_updates FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND is_project_member(auth.uid(), project_id)
);

-- Super admins full access
CREATE POLICY "Super admins can manage all progress updates"
ON public.project_progress_updates FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- System admins full access
CREATE POLICY "System admins can manage all progress updates"
ON public.project_progress_updates FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'system_admin'::app_role));

-- 6. Recreate PROJECT_ACHIEVEMENTS policies (using helper function)

-- Officers can manage achievements
CREATE POLICY "Officers can manage achievements"
ON public.project_achievements FOR ALL
USING (
  has_role(auth.uid(), 'officer'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'officer'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
);

-- Management can view achievements
CREATE POLICY "Management can view achievements"
ON public.project_achievements FOR SELECT
USING (
  has_role(auth.uid(), 'management'::app_role) 
  AND get_project_institution_id(project_id) = get_user_institution_id(auth.uid())
);

-- Students can view achievements for their projects
CREATE POLICY "Students can view achievements"
ON public.project_achievements FOR SELECT
USING (
  has_role(auth.uid(), 'student'::app_role) 
  AND is_project_member(auth.uid(), project_id)
);

-- Super admins full access
CREATE POLICY "Super admins can manage all achievements"
ON public.project_achievements FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- System admins full access
CREATE POLICY "System admins can manage all achievements"
ON public.project_achievements FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'system_admin'::app_role));