-- Fix infinite recursion by removing cross-table RLS references and using SECURITY DEFINER helpers

-- 1) Helper: is the current user the creator/owner of an event?
CREATE OR REPLACE FUNCTION public.is_event_owner(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.events e
    WHERE e.id = _event_id
      AND e.created_by = _user_id
  );
$$;

-- 2) Helper: is an event assigned to the user's institution?
CREATE OR REPLACE FUNCTION public.is_event_assigned_to_user_institution(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.event_class_assignments eca
    WHERE eca.event_id = _event_id
      AND eca.institution_id = public.get_user_institution_id(_user_id)
  );
$$;

-- 3) Helper: can a user view a given event row? (avoid querying events table from its own policy)
CREATE OR REPLACE FUNCTION public.can_view_event(_user_id uuid, _event_id uuid, _status text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT (
    public.can_manage_events(_user_id)
    OR (
      _status = 'published'
      AND public.is_event_assigned_to_user_institution(_user_id, _event_id)
    )
  );
$$;

-- 4) Helper: can a user view updates for an event? (safe to query events here because RLS is bypassed)
CREATE OR REPLACE FUNCTION public.can_view_event_updates(_user_id uuid, _event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $$
  SELECT (
    public.can_manage_events(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = _event_id
        AND e.status = 'published'
        AND public.is_event_assigned_to_user_institution(_user_id, _event_id)
    )
  );
$$;

-- ------------------------------
-- Update policies to use helpers
-- ------------------------------

-- EVENTS: replace the assignment-based SELECT policy to avoid recursion
DROP POLICY IF EXISTS "Users can view published events assigned to their institution" ON public.events;
CREATE POLICY "Users can view published events assigned to their institution"
ON public.events
FOR SELECT
TO authenticated
USING (public.can_view_event(auth.uid(), id, status));

-- EVENT CLASS ASSIGNMENTS: replace owner check to avoid selecting from events in policy
DROP POLICY IF EXISTS "Event managers can manage assignments" ON public.event_class_assignments;
CREATE POLICY "Event managers can manage assignments"
ON public.event_class_assignments
FOR ALL
TO authenticated
USING (
  public.can_manage_events(auth.uid())
  AND public.is_event_owner(auth.uid(), event_id)
)
WITH CHECK (
  public.can_manage_events(auth.uid())
  AND public.is_event_owner(auth.uid(), event_id)
);

-- EVENT UPDATES: replace policies that join back to events/assignments directly
DROP POLICY IF EXISTS "Event managers can manage updates for own events" ON public.event_updates;
CREATE POLICY "Event managers can manage updates for own events"
ON public.event_updates
FOR ALL
TO authenticated
USING (
  public.can_manage_events(auth.uid())
  AND public.is_event_owner(auth.uid(), event_id)
)
WITH CHECK (
  public.can_manage_events(auth.uid())
  AND public.is_event_owner(auth.uid(), event_id)
);

DROP POLICY IF EXISTS "Users can view updates for published events" ON public.event_updates;
CREATE POLICY "Users can view updates for published events"
ON public.event_updates
FOR SELECT
TO authenticated
USING (public.can_view_event_updates(auth.uid(), event_id));
