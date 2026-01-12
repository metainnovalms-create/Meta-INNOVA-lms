-- =====================================================
-- PAYROLL MANAGEMENT SYSTEM TABLES
-- =====================================================

-- 1. Staff Attendance Table (for non-officer staff like position holders)
CREATE TABLE public.staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  position_id UUID REFERENCES public.positions(id),
  institution_id UUID REFERENCES public.institutions(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  check_in_latitude NUMERIC,
  check_in_longitude NUMERIC,
  check_in_address TEXT,
  check_in_distance_meters NUMERIC,
  check_in_validated BOOLEAN DEFAULT false,
  check_out_latitude NUMERIC,
  check_out_longitude NUMERIC,
  check_out_address TEXT,
  check_out_distance_meters NUMERIC,
  check_out_validated BOOLEAN DEFAULT false,
  total_hours_worked NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'not_checked_in',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 2. Payroll Records Table
CREATE TABLE public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('officer', 'staff')),
  officer_id UUID REFERENCES public.officers(id),
  position_id UUID REFERENCES public.positions(id),
  institution_id UUID REFERENCES public.institutions(id),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  
  -- Standard days for LOP calculation (always 30)
  standard_days INTEGER DEFAULT 30,
  working_days INTEGER NOT NULL DEFAULT 0,
  days_present INTEGER DEFAULT 0,
  days_absent INTEGER DEFAULT 0,
  days_leave INTEGER DEFAULT 0,
  days_lop INTEGER DEFAULT 0,
  uninformed_leave_days INTEGER DEFAULT 0,
  
  -- Hours tracking
  total_hours_worked NUMERIC DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  overtime_approved BOOLEAN DEFAULT false,
  
  -- Salary (per_day_salary calculated as monthly_salary / 30)
  monthly_salary NUMERIC NOT NULL DEFAULT 0,
  per_day_salary NUMERIC GENERATED ALWAYS AS (monthly_salary / 30) STORED,
  
  -- Earnings
  basic_pay NUMERIC DEFAULT 0,
  hra NUMERIC DEFAULT 0,
  da NUMERIC DEFAULT 0,
  special_allowance NUMERIC DEFAULT 0,
  other_allowances NUMERIC DEFAULT 0,
  salary_components JSONB DEFAULT '[]',
  total_earnings NUMERIC DEFAULT 0,
  overtime_pay NUMERIC DEFAULT 0,
  
  -- Deductions
  lop_deduction NUMERIC DEFAULT 0,
  pf_employee NUMERIC DEFAULT 0,
  pf_employer NUMERIC DEFAULT 0,
  esi_employee NUMERIC DEFAULT 0,
  esi_employer NUMERIC DEFAULT 0,
  tds NUMERIC DEFAULT 0,
  professional_tax NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  loan_deduction NUMERIC DEFAULT 0,
  deductions JSONB DEFAULT '[]',
  total_deductions NUMERIC DEFAULT 0,
  
  -- Final amounts
  gross_salary NUMERIC DEFAULT 0,
  net_pay NUMERIC DEFAULT 0,
  
  -- Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'rejected')),
  generated_at TIMESTAMPTZ DEFAULT now(),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  paid_date DATE,
  payment_mode TEXT,
  payment_reference TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- 3. Daily Work Logs Table
CREATE TABLE public.daily_work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT DEFAULT 'staff',
  officer_id UUID REFERENCES public.officers(id),
  date DATE NOT NULL,
  tasks_completed TEXT,
  hours_logged NUMERIC DEFAULT 0,
  productivity_score INTEGER CHECK (productivity_score >= 0 AND productivity_score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 4. Overtime Requests Table
CREATE TABLE public.overtime_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT DEFAULT 'staff',
  officer_id UUID REFERENCES public.officers(id),
  institution_id UUID REFERENCES public.institutions(id),
  date DATE NOT NULL,
  requested_hours NUMERIC NOT NULL CHECK (requested_hours > 0),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID,
  approved_by_name TEXT,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  overtime_rate NUMERIC DEFAULT 1.5,
  calculated_pay NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES FOR staff_attendance
-- =====================================================

CREATE POLICY "Super admins can manage all staff attendance"
ON public.staff_attendance FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all staff attendance"
ON public.staff_attendance FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can view institution staff attendance"
ON public.staff_attendance FOR SELECT
USING (has_role(auth.uid(), 'management') AND institution_id = get_user_institution_id(auth.uid()));

CREATE POLICY "Users can manage own attendance"
ON public.staff_attendance FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES FOR payroll_records
-- =====================================================

CREATE POLICY "Super admins can manage all payroll records"
ON public.payroll_records FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all payroll records"
ON public.payroll_records FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can view institution payroll records"
ON public.payroll_records FOR SELECT
USING (has_role(auth.uid(), 'management') AND institution_id = get_user_institution_id(auth.uid()));

CREATE POLICY "Users can view own payroll records"
ON public.payroll_records FOR SELECT
USING (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES FOR daily_work_logs
-- =====================================================

CREATE POLICY "Super admins can manage all work logs"
ON public.daily_work_logs FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all work logs"
ON public.daily_work_logs FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Users can manage own work logs"
ON public.daily_work_logs FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- RLS POLICIES FOR overtime_requests
-- =====================================================

CREATE POLICY "Super admins can manage all overtime requests"
ON public.overtime_requests FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all overtime requests"
ON public.overtime_requests FOR ALL
USING (has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can view institution overtime requests"
ON public.overtime_requests FOR SELECT
USING (has_role(auth.uid(), 'management') AND institution_id = get_user_institution_id(auth.uid()));

CREATE POLICY "Users can manage own overtime requests"
ON public.overtime_requests FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_staff_attendance_user_date ON public.staff_attendance(user_id, date);
CREATE INDEX idx_staff_attendance_institution_date ON public.staff_attendance(institution_id, date);
CREATE INDEX idx_payroll_records_user_month ON public.payroll_records(user_id, month, year);
CREATE INDEX idx_payroll_records_status ON public.payroll_records(status);
CREATE INDEX idx_daily_work_logs_user_date ON public.daily_work_logs(user_id, date);
CREATE INDEX idx_overtime_requests_status ON public.overtime_requests(status);
CREATE INDEX idx_overtime_requests_user ON public.overtime_requests(user_id);

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_staff_attendance_updated_at
  BEFORE UPDATE ON public.staff_attendance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_work_logs_updated_at
  BEFORE UPDATE ON public.daily_work_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_overtime_requests_updated_at
  BEFORE UPDATE ON public.overtime_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();