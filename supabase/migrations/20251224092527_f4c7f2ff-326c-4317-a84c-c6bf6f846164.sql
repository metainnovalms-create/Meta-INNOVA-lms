-- Drop existing recursive policies on profiles
DROP POLICY IF EXISTS "Management can view institution profiles" ON public.profiles;

-- Recreate the policy using the existing has_role function to avoid recursion
CREATE POLICY "Management can view institution profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'management'::app_role) AND 
  institution_id = (
    SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid()
  )
);

-- Create a security definer function to get user's institution_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_institution_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT institution_id FROM public.profiles WHERE id = _user_id LIMIT 1
$$;

-- Drop and recreate policies that cause recursion, using the new function
DROP POLICY IF EXISTS "Users can view own institution" ON public.institutions;
DROP POLICY IF EXISTS "Management can view institution profiles" ON public.profiles;

-- Recreate institutions policy using security definer function
CREATE POLICY "Users can view own institution" 
ON public.institutions 
FOR SELECT 
USING (id = public.get_user_institution_id(auth.uid()));

-- Recreate profiles policy without recursion
CREATE POLICY "Management can view institution profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'management'::app_role) AND 
  institution_id = public.get_user_institution_id(auth.uid())
);

-- Fix classes policies
DROP POLICY IF EXISTS "Management can view own institution classes" ON public.classes;
DROP POLICY IF EXISTS "Management can insert own institution classes" ON public.classes;
DROP POLICY IF EXISTS "Management can update own institution classes" ON public.classes;
DROP POLICY IF EXISTS "Management can delete own institution classes" ON public.classes;
DROP POLICY IF EXISTS "Officers can view own institution classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can view own institution classes" ON public.classes;

CREATE POLICY "Management can view own institution classes" ON public.classes FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Management can insert own institution classes" ON public.classes FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Management can update own institution classes" ON public.classes FOR UPDATE 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Management can delete own institution classes" ON public.classes FOR DELETE 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Officers can view own institution classes" ON public.classes FOR SELECT 
USING (has_role(auth.uid(), 'officer'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Teachers can view own institution classes" ON public.classes FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

-- Fix students policies
DROP POLICY IF EXISTS "Management can view own institution students" ON public.students;
DROP POLICY IF EXISTS "Management can insert own institution students" ON public.students;
DROP POLICY IF EXISTS "Management can update own institution students" ON public.students;
DROP POLICY IF EXISTS "Management can delete own institution students" ON public.students;
DROP POLICY IF EXISTS "Officers can view own institution students" ON public.students;
DROP POLICY IF EXISTS "Teachers can view own institution students" ON public.students;

CREATE POLICY "Management can view own institution students" ON public.students FOR SELECT 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Management can insert own institution students" ON public.students FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Management can update own institution students" ON public.students FOR UPDATE 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Management can delete own institution students" ON public.students FOR DELETE 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Officers can view own institution students" ON public.students FOR SELECT 
USING (has_role(auth.uid(), 'officer'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Teachers can view own institution students" ON public.students FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

-- Fix institution_periods policies
DROP POLICY IF EXISTS "Management can manage own institution periods" ON public.institution_periods;
DROP POLICY IF EXISTS "Officers can view own institution periods" ON public.institution_periods;
DROP POLICY IF EXISTS "Teachers can view own institution periods" ON public.institution_periods;

CREATE POLICY "Management can manage own institution periods" ON public.institution_periods FOR ALL 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Officers can view own institution periods" ON public.institution_periods FOR SELECT 
USING (has_role(auth.uid(), 'officer'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Teachers can view own institution periods" ON public.institution_periods FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

-- Fix institution_timetable_assignments policies
DROP POLICY IF EXISTS "Management can manage own institution timetable" ON public.institution_timetable_assignments;
DROP POLICY IF EXISTS "Officers can view own institution timetable" ON public.institution_timetable_assignments;
DROP POLICY IF EXISTS "Teachers can view own institution timetable" ON public.institution_timetable_assignments;

CREATE POLICY "Management can manage own institution timetable" ON public.institution_timetable_assignments FOR ALL 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Officers can view own institution timetable" ON public.institution_timetable_assignments FOR SELECT 
USING (has_role(auth.uid(), 'officer'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Teachers can view own institution timetable" ON public.institution_timetable_assignments FOR SELECT 
USING (has_role(auth.uid(), 'teacher'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));

-- Fix id_counters policies
DROP POLICY IF EXISTS "Management can manage own institution counters" ON public.id_counters;

CREATE POLICY "Management can manage own institution counters" ON public.id_counters FOR ALL 
USING (has_role(auth.uid(), 'management'::app_role) AND institution_id = public.get_user_institution_id(auth.uid()));