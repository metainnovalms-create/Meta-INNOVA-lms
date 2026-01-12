-- Create officer_attendance table for GPS-based check-in/check-out
CREATE TABLE public.officer_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES public.officers(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Check-in details
  check_in_time TIMESTAMPTZ,
  check_in_latitude NUMERIC(10, 7),
  check_in_longitude NUMERIC(10, 7),
  check_in_address TEXT,
  check_in_distance_meters NUMERIC(10, 2),
  check_in_validated BOOLEAN DEFAULT false,
  
  -- Check-out details
  check_out_time TIMESTAMPTZ,
  check_out_latitude NUMERIC(10, 7),
  check_out_longitude NUMERIC(10, 7),
  check_out_address TEXT,
  check_out_distance_meters NUMERIC(10, 2),
  check_out_validated BOOLEAN DEFAULT false,
  
  -- Computed fields
  total_hours_worked NUMERIC(5, 2),
  overtime_hours NUMERIC(5, 2) DEFAULT 0,
  status TEXT DEFAULT 'not_checked_in' CHECK (status IN ('not_checked_in', 'checked_in', 'checked_out')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate check-ins per day per institution
  UNIQUE (officer_id, institution_id, date)
);

-- Enable RLS
ALTER TABLE public.officer_attendance ENABLE ROW LEVEL SECURITY;

-- Officers can view and manage their own attendance
CREATE POLICY "Officers can view own attendance" ON public.officer_attendance
  FOR SELECT USING (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

CREATE POLICY "Officers can insert own attendance" ON public.officer_attendance
  FOR INSERT WITH CHECK (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

CREATE POLICY "Officers can update own attendance" ON public.officer_attendance
  FOR UPDATE USING (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

-- Super admins can manage all attendance
CREATE POLICY "Super admins can manage all officer attendance" ON public.officer_attendance
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System admins can manage all attendance
CREATE POLICY "System admins can manage all officer attendance" ON public.officer_attendance
  FOR ALL USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Management can view their institution's officer attendance
CREATE POLICY "Management can view institution officer attendance" ON public.officer_attendance
  FOR SELECT USING (
    has_role(auth.uid(), 'management'::app_role) 
    AND institution_id = get_user_institution_id(auth.uid())
  );

-- Create trigger for updated_at
CREATE TRIGGER update_officer_attendance_updated_at
  BEFORE UPDATE ON public.officer_attendance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for attendance updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.officer_attendance;