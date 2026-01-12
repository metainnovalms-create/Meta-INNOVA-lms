-- Create events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- webinar, hackathon, science_expo, competition, workshop, seminar, exhibition, cultural, sports, other
  venue TEXT, -- optional
  
  -- Important Dates
  registration_start TIMESTAMPTZ,
  registration_end TIMESTAMPTZ,
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, published, ongoing, completed, cancelled
  
  -- Attachments
  brochure_url TEXT, -- File path in storage
  attachments JSONB DEFAULT '[]', -- Array of {name, url}
  
  -- Metadata
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  eligibility_criteria TEXT,
  rules TEXT,
  prizes JSONB DEFAULT '[]',
  
  -- Creator info
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create event_class_assignments table (for publishing to specific schools/classes)
CREATE TABLE public.event_class_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, class_id)
);

-- Create event_updates table (for posting links/updates)
CREATE TABLE public.event_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  link_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create event_interests table (for student interest tracking)
CREATE TABLE public.event_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id),
  class_id UUID REFERENCES public.classes(id),
  student_name TEXT,
  class_name TEXT,
  section TEXT,
  registered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, student_id)
);

-- Enable RLS on all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_interests ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for event files
INSERT INTO storage.buckets (id, name, public) VALUES ('event-files', 'event-files', true);

-- Helper function to check if user can manage events (CEO or position with event_management feature)
CREATE OR REPLACE FUNCTION public.can_manage_events(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if super_admin or system_admin
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin', 'system_admin')
  ) OR EXISTS (
    -- Check if CEO via profile
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND is_ceo = true
  ) OR EXISTS (
    -- Check if position has event_management in visible_features and is CEO position
    SELECT 1 FROM public.profiles p
    JOIN public.positions pos ON pos.id = p.position_id
    WHERE p.id = _user_id 
      AND pos.is_ceo_position = true
      AND pos.visible_features::jsonb ? 'event_management'
  )
$$;

-- RLS Policies for events table
CREATE POLICY "Super admins can manage all events"
ON public.events FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all events"
ON public.events FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Event managers can create events"
ON public.events FOR INSERT
WITH CHECK (can_manage_events(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Event managers can update own events"
ON public.events FOR UPDATE
USING (can_manage_events(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Event managers can delete own events"
ON public.events FOR DELETE
USING (can_manage_events(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Event managers can view all events"
ON public.events FOR SELECT
USING (can_manage_events(auth.uid()));

CREATE POLICY "Users can view published events assigned to their institution"
ON public.events FOR SELECT
USING (
  status = 'published' AND
  id IN (
    SELECT eca.event_id FROM public.event_class_assignments eca
    WHERE eca.institution_id = get_user_institution_id(auth.uid())
  )
);

-- RLS Policies for event_class_assignments
CREATE POLICY "Super admins can manage all event assignments"
ON public.event_class_assignments FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all event assignments"
ON public.event_class_assignments FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Event managers can manage assignments"
ON public.event_class_assignments FOR ALL
USING (
  can_manage_events(auth.uid()) AND
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
);

CREATE POLICY "Users can view assignments for their institution"
ON public.event_class_assignments FOR SELECT
USING (institution_id = get_user_institution_id(auth.uid()));

-- RLS Policies for event_updates
CREATE POLICY "Super admins can manage all event updates"
ON public.event_updates FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all event updates"
ON public.event_updates FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Event managers can manage updates for own events"
ON public.event_updates FOR ALL
USING (
  can_manage_events(auth.uid()) AND
  event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
);

CREATE POLICY "Users can view updates for published events"
ON public.event_updates FOR SELECT
USING (
  event_id IN (
    SELECT e.id FROM public.events e
    JOIN public.event_class_assignments eca ON eca.event_id = e.id
    WHERE e.status = 'published' AND eca.institution_id = get_user_institution_id(auth.uid())
  )
);

-- RLS Policies for event_interests
CREATE POLICY "Super admins can manage all event interests"
ON public.event_interests FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all event interests"
ON public.event_interests FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Students can express interest"
ON public.event_interests FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'student') AND student_id = auth.uid()
);

CREATE POLICY "Students can view own interests"
ON public.event_interests FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Officers can view interests for their institution"
ON public.event_interests FOR SELECT
USING (
  has_role(auth.uid(), 'officer') AND 
  institution_id = get_user_institution_id(auth.uid())
);

CREATE POLICY "Management can view interests for their institution"
ON public.event_interests FOR SELECT
USING (
  has_role(auth.uid(), 'management') AND 
  institution_id = get_user_institution_id(auth.uid())
);

CREATE POLICY "Event managers can view all interests"
ON public.event_interests FOR SELECT
USING (can_manage_events(auth.uid()));

-- Storage policies for event-files bucket
CREATE POLICY "Public can view event files"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-files');

CREATE POLICY "Event managers can upload event files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-files' AND can_manage_events(auth.uid()));

CREATE POLICY "Event managers can update event files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-files' AND can_manage_events(auth.uid()));

CREATE POLICY "Event managers can delete event files"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-files' AND can_manage_events(auth.uid()));

-- Create updated_at trigger for events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();