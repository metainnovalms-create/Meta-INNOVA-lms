-- Create institution_periods table
CREATE TABLE public.institution_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_break BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create institution_timetable_assignments table
CREATE TABLE public.institution_timetable_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  period_id UUID NOT NULL REFERENCES public.institution_periods(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID,
  teacher_name TEXT,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, academic_year, day, period_id)
);

-- Create id_counters table for generating sequential IDs
CREATE TABLE public.id_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'employee', 'class', 'institution')),
  current_counter INTEGER NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT '',
  year_format TEXT DEFAULT 'YYYY',
  counter_padding INTEGER DEFAULT 4,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, entity_type)
);

-- Enable RLS on all new tables
ALTER TABLE public.institution_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_timetable_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_counters ENABLE ROW LEVEL SECURITY;

-- RLS policies for institution_periods
CREATE POLICY "Super admins can manage all periods" ON public.institution_periods
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all periods" ON public.institution_periods
FOR ALL USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can manage own institution periods" ON public.institution_periods
FOR ALL USING (
  has_role(auth.uid(), 'management') AND 
  institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Officers can view own institution periods" ON public.institution_periods
FOR SELECT USING (
  has_role(auth.uid(), 'officer') AND 
  institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Teachers can view own institution periods" ON public.institution_periods
FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND 
  institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

-- RLS policies for institution_timetable_assignments
CREATE POLICY "Super admins can manage all timetable assignments" ON public.institution_timetable_assignments
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all timetable assignments" ON public.institution_timetable_assignments
FOR ALL USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can manage own institution timetable" ON public.institution_timetable_assignments
FOR ALL USING (
  has_role(auth.uid(), 'management') AND 
  institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Officers can view own institution timetable" ON public.institution_timetable_assignments
FOR SELECT USING (
  has_role(auth.uid(), 'officer') AND 
  institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

CREATE POLICY "Teachers can view own institution timetable" ON public.institution_timetable_assignments
FOR SELECT USING (
  has_role(auth.uid(), 'teacher') AND 
  institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

-- RLS policies for id_counters
CREATE POLICY "Super admins can manage all id_counters" ON public.id_counters
FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all id_counters" ON public.id_counters
FOR ALL USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can manage own institution counters" ON public.id_counters
FOR ALL USING (
  has_role(auth.uid(), 'management') AND 
  institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
);

-- Function to reserve ID range (atomic operation for bulk imports)
CREATE OR REPLACE FUNCTION public.reserve_id_range(
  p_institution_id UUID,
  p_entity_type TEXT,
  p_count INTEGER
)
RETURNS TABLE(start_counter INTEGER, end_counter INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start INTEGER;
  v_end INTEGER;
BEGIN
  -- Insert or update the counter atomically
  INSERT INTO public.id_counters (institution_id, entity_type, current_counter)
  VALUES (p_institution_id, p_entity_type, p_count)
  ON CONFLICT (institution_id, entity_type)
  DO UPDATE SET 
    current_counter = id_counters.current_counter + p_count,
    updated_at = now()
  RETURNING current_counter - p_count + 1, current_counter
  INTO v_start, v_end;
  
  RETURN QUERY SELECT v_start, v_end;
END;
$$;

-- Function to get next ID
CREATE OR REPLACE FUNCTION public.get_next_id(
  p_institution_id UUID,
  p_entity_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next INTEGER;
BEGIN
  INSERT INTO public.id_counters (institution_id, entity_type, current_counter)
  VALUES (p_institution_id, p_entity_type, 1)
  ON CONFLICT (institution_id, entity_type)
  DO UPDATE SET 
    current_counter = id_counters.current_counter + 1,
    updated_at = now()
  RETURNING current_counter
  INTO v_next;
  
  RETURN v_next;
END;
$$;

-- Create updated_at triggers
CREATE TRIGGER update_institution_periods_updated_at
BEFORE UPDATE ON public.institution_periods
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institution_timetable_updated_at
BEFORE UPDATE ON public.institution_timetable_assignments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_id_counters_updated_at
BEFORE UPDATE ON public.id_counters
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_institution_periods_institution_id ON public.institution_periods(institution_id);
CREATE INDEX idx_institution_periods_display_order ON public.institution_periods(institution_id, display_order);
CREATE INDEX idx_institution_timetable_institution_year ON public.institution_timetable_assignments(institution_id, academic_year);
CREATE INDEX idx_institution_timetable_day_period ON public.institution_timetable_assignments(institution_id, day, period_id);
CREATE INDEX idx_id_counters_institution_entity ON public.id_counters(institution_id, entity_type);