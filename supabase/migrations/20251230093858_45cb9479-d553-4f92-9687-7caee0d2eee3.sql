-- Drop existing problematic policies on events table
DROP POLICY IF EXISTS "Event managers can create events" ON public.events;
DROP POLICY IF EXISTS "Event managers can delete own events" ON public.events;
DROP POLICY IF EXISTS "Event managers can update own events" ON public.events;
DROP POLICY IF EXISTS "Event managers can view all events" ON public.events;

-- Recreate the can_manage_events function with proper security definer
-- This function directly queries tables without calling has_role to avoid recursion
CREATE OR REPLACE FUNCTION public.can_manage_events(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'system_admin')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND is_ceo = true
  ) OR EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.positions pos ON pos.id = p.position_id
    WHERE p.id = _user_id 
      AND pos.is_ceo_position = true
  )
$$;

-- Recreate policies using the fixed function
CREATE POLICY "Event managers can create events" ON public.events
  FOR INSERT WITH CHECK (
    can_manage_events(auth.uid()) AND created_by = auth.uid()
  );

CREATE POLICY "Event managers can update own events" ON public.events
  FOR UPDATE USING (
    can_manage_events(auth.uid()) AND created_by = auth.uid()
  );

CREATE POLICY "Event managers can delete own events" ON public.events
  FOR DELETE USING (
    can_manage_events(auth.uid()) AND created_by = auth.uid()
  );

CREATE POLICY "Event managers can view all events" ON public.events
  FOR SELECT USING (can_manage_events(auth.uid()));