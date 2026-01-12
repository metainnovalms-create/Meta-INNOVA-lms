-- Create class session attendance table for tracking student attendance in each class session
CREATE TABLE public.class_session_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_assignment_id UUID NOT NULL REFERENCES public.institution_timetable_assignments(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES public.officers(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  period_label TEXT,
  period_time TEXT, -- e.g. "09:00 - 09:45"
  subject TEXT,
  
  -- Attendance data
  total_students INTEGER NOT NULL DEFAULT 0,
  students_present INTEGER NOT NULL DEFAULT 0,
  students_absent INTEGER NOT NULL DEFAULT 0,
  students_late INTEGER NOT NULL DEFAULT 0,
  
  -- Per-student details (stored as JSON for flexibility)
  attendance_records JSONB DEFAULT '[]',
  
  -- Session marked as completed by officer
  is_session_completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES public.officers(id),
  completed_at TIMESTAMPTZ,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Unique per timetable assignment per date
  UNIQUE (timetable_assignment_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.class_session_attendance ENABLE ROW LEVEL SECURITY;

-- Officers can manage attendance for their sessions
CREATE POLICY "Officers can manage own class attendance" ON public.class_session_attendance
  FOR ALL USING (
    officer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
  )
  WITH CHECK (
    officer_id IN (SELECT id FROM public.officers WHERE user_id = auth.uid())
  );

-- Super admins can manage all attendance
CREATE POLICY "Super admins can manage all class attendance" ON public.class_session_attendance
  FOR ALL USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- System admins can manage all attendance
CREATE POLICY "System admins can manage all class attendance" ON public.class_session_attendance
  FOR ALL USING (has_role(auth.uid(), 'system_admin'))
  WITH CHECK (has_role(auth.uid(), 'system_admin'));

-- Management can view their institution's attendance
CREATE POLICY "Management can view institution class attendance" ON public.class_session_attendance
  FOR SELECT USING (
    has_role(auth.uid(), 'management') 
    AND institution_id = get_user_institution_id(auth.uid())
  );

-- Enable realtime for class_session_attendance
ALTER PUBLICATION supabase_realtime ADD TABLE public.class_session_attendance;

-- Create index for common queries
CREATE INDEX idx_class_session_attendance_institution_date ON public.class_session_attendance(institution_id, date);
CREATE INDEX idx_class_session_attendance_officer_date ON public.class_session_attendance(officer_id, date);
CREATE INDEX idx_class_session_attendance_class_date ON public.class_session_attendance(class_id, date);