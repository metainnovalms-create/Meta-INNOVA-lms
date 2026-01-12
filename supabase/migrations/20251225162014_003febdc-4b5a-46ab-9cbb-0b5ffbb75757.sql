
-- =============================================
-- LEAVE MANAGEMENT SYSTEM - COMPLETE SCHEMA
-- =============================================

-- Drop existing mock-related items if they exist
DROP TABLE IF EXISTS public.leave_applications CASCADE;
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.company_holidays CASCADE;
DROP TABLE IF EXISTS public.institution_holidays CASCADE;
DROP TABLE IF EXISTS public.leave_approval_hierarchy CASCADE;

-- =============================================
-- 1. COMPANY HOLIDAYS (For Meta Staff)
-- =============================================
CREATE TABLE public.company_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  end_date date,
  description text,
  holiday_type text NOT NULL DEFAULT 'company',
  year integer NOT NULL,
  is_paid boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. INSTITUTION HOLIDAYS (For Officers)
-- =============================================
CREATE TABLE public.institution_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  date date NOT NULL,
  end_date date,
  description text,
  holiday_type text NOT NULL DEFAULT 'institution',
  year integer NOT NULL,
  is_paid boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. LEAVE BALANCES (Monthly Accrual System)
-- =============================================
CREATE TABLE public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('officer', 'staff')),
  officer_id uuid REFERENCES public.officers(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  monthly_credit integer NOT NULL DEFAULT 1,
  carried_forward integer NOT NULL DEFAULT 0,
  sick_leave_used integer NOT NULL DEFAULT 0,
  casual_leave_used integer NOT NULL DEFAULT 0,
  lop_days integer NOT NULL DEFAULT 0,
  balance_remaining integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month)
);

-- =============================================
-- 4. LEAVE APPROVAL HIERARCHY
-- =============================================
CREATE TABLE public.leave_approval_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_type text NOT NULL CHECK (applicant_type IN ('officer', 'staff')),
  applicant_position_id uuid REFERENCES public.positions(id) ON DELETE CASCADE,
  approver_position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  approval_order integer NOT NULL CHECK (approval_order >= 1),
  is_final_approver boolean DEFAULT false,
  is_optional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index instead of constraint
CREATE UNIQUE INDEX idx_leave_approval_hierarchy_unique 
ON public.leave_approval_hierarchy(applicant_type, COALESCE(applicant_position_id, '00000000-0000-0000-0000-000000000000'::uuid), approval_order);

-- =============================================
-- 5. LEAVE APPLICATIONS
-- =============================================
CREATE TABLE public.leave_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL,
  applicant_name text NOT NULL,
  applicant_type text NOT NULL CHECK (applicant_type IN ('officer', 'staff')),
  officer_id uuid REFERENCES public.officers(id) ON DELETE SET NULL,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  institution_name text,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  position_name text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  leave_type text NOT NULL CHECK (leave_type IN ('sick', 'casual')),
  reason text NOT NULL,
  total_days integer NOT NULL,
  is_lop boolean DEFAULT false,
  lop_days integer DEFAULT 0,
  paid_days integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  current_approval_level integer DEFAULT 1,
  approval_chain jsonb DEFAULT '[]'::jsonb,
  final_approved_by uuid,
  final_approved_by_name text,
  final_approved_at timestamptz,
  rejection_reason text,
  rejected_by uuid,
  rejected_by_name text,
  rejected_at timestamptz,
  substitute_assignments jsonb DEFAULT '[]'::jsonb,
  applied_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 6. ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.company_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_approval_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_applications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. RLS POLICIES - COMPANY HOLIDAYS
-- =============================================
CREATE POLICY "Anyone authenticated can view company holidays"
ON public.company_holidays FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage company holidays"
ON public.company_holidays FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage company holidays"
ON public.company_holidays FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'));

-- =============================================
-- 8. RLS POLICIES - INSTITUTION HOLIDAYS
-- =============================================
CREATE POLICY "Users can view own institution holidays"
ON public.institution_holidays FOR SELECT
USING (institution_id = public.get_user_institution_id(auth.uid()));

CREATE POLICY "Super admins can manage all institution holidays"
ON public.institution_holidays FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all institution holidays"
ON public.institution_holidays FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can manage own institution holidays"
ON public.institution_holidays FOR ALL
USING (public.has_role(auth.uid(), 'management') AND institution_id = public.get_user_institution_id(auth.uid()));

-- =============================================
-- 9. RLS POLICIES - LEAVE BALANCES
-- =============================================
CREATE POLICY "Users can view own leave balances"
ON public.leave_balances FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage all leave balances"
ON public.leave_balances FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all leave balances"
ON public.leave_balances FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'));

-- =============================================
-- 10. RLS POLICIES - LEAVE APPROVAL HIERARCHY
-- =============================================
CREATE POLICY "Authenticated users can view approval hierarchy"
ON public.leave_approval_hierarchy FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage approval hierarchy"
ON public.leave_approval_hierarchy FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage approval hierarchy"
ON public.leave_approval_hierarchy FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'));

-- =============================================
-- 11. RLS POLICIES - LEAVE APPLICATIONS
-- =============================================
CREATE POLICY "Users can view own leave applications"
ON public.leave_applications FOR SELECT
USING (applicant_id = auth.uid());

CREATE POLICY "Users can insert own leave applications"
ON public.leave_applications FOR INSERT
WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Users can update own pending leave applications"
ON public.leave_applications FOR UPDATE
USING (applicant_id = auth.uid() AND status = 'pending');

CREATE POLICY "Super admins can manage all leave applications"
ON public.leave_applications FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System admins can manage all leave applications"
ON public.leave_applications FOR ALL
USING (public.has_role(auth.uid(), 'system_admin'));

CREATE POLICY "Management can view institution leave applications"
ON public.leave_applications FOR SELECT
USING (
  public.has_role(auth.uid(), 'management') 
  AND institution_id = public.get_user_institution_id(auth.uid())
);

-- =============================================
-- 12. HELPER FUNCTION - Get Leave Balance
-- =============================================
CREATE OR REPLACE FUNCTION public.get_leave_balance(
  p_user_id uuid,
  p_year integer,
  p_month integer
)
RETURNS TABLE(
  monthly_credit integer,
  carried_forward integer,
  total_available integer,
  sick_leave_used integer,
  casual_leave_used integer,
  total_used integer,
  lop_days integer,
  balance_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance RECORD;
  v_prev_remaining integer;
  v_carried integer;
BEGIN
  SELECT * INTO v_balance
  FROM leave_balances lb
  WHERE lb.user_id = p_user_id AND lb.year = p_year AND lb.month = p_month;
  
  IF v_balance IS NULL THEN
    IF p_month = 1 THEN
      SELECT lb.balance_remaining INTO v_prev_remaining
      FROM leave_balances lb
      WHERE lb.user_id = p_user_id AND lb.year = p_year - 1 AND lb.month = 12;
    ELSE
      SELECT lb.balance_remaining INTO v_prev_remaining
      FROM leave_balances lb
      WHERE lb.user_id = p_user_id AND lb.year = p_year AND lb.month = p_month - 1;
    END IF;
    
    v_carried := LEAST(COALESCE(v_prev_remaining, 0), 1);
    
    RETURN QUERY SELECT 
      1::integer,
      v_carried::integer,
      (1 + v_carried)::integer,
      0::integer,
      0::integer,
      0::integer,
      0::integer,
      (1 + v_carried)::integer;
  ELSE
    RETURN QUERY SELECT 
      v_balance.monthly_credit,
      v_balance.carried_forward,
      (v_balance.monthly_credit + v_balance.carried_forward)::integer,
      v_balance.sick_leave_used,
      v_balance.casual_leave_used,
      (v_balance.sick_leave_used + v_balance.casual_leave_used)::integer,
      v_balance.lop_days,
      v_balance.balance_remaining;
  END IF;
END;
$$;

-- =============================================
-- 13. HELPER FUNCTION - Initialize Leave Balance
-- =============================================
CREATE OR REPLACE FUNCTION public.initialize_leave_balance(
  p_user_id uuid,
  p_user_type text,
  p_officer_id uuid,
  p_year integer,
  p_month integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance_id uuid;
  v_carried_forward integer := 0;
  v_prev_remaining integer;
BEGIN
  IF p_month = 1 THEN
    SELECT balance_remaining INTO v_prev_remaining
    FROM leave_balances
    WHERE user_id = p_user_id AND year = p_year - 1 AND month = 12;
  ELSE
    SELECT balance_remaining INTO v_prev_remaining
    FROM leave_balances
    WHERE user_id = p_user_id AND year = p_year AND month = p_month - 1;
  END IF;
  
  v_carried_forward := LEAST(COALESCE(v_prev_remaining, 0), 1);
  
  INSERT INTO leave_balances (
    user_id, user_type, officer_id, year, month,
    monthly_credit, carried_forward, balance_remaining
  )
  VALUES (
    p_user_id, p_user_type, p_officer_id, p_year, p_month,
    1, v_carried_forward, 1 + v_carried_forward
  )
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    carried_forward = EXCLUDED.carried_forward,
    balance_remaining = leave_balances.monthly_credit + EXCLUDED.carried_forward - 
                        leave_balances.sick_leave_used - leave_balances.casual_leave_used,
    updated_at = now()
  RETURNING id INTO v_balance_id;
  
  RETURN v_balance_id;
END;
$$;

-- =============================================
-- 14. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_company_holidays_year ON public.company_holidays(year);
CREATE INDEX idx_company_holidays_date ON public.company_holidays(date);
CREATE INDEX idx_institution_holidays_institution ON public.institution_holidays(institution_id);
CREATE INDEX idx_institution_holidays_year ON public.institution_holidays(year);
CREATE INDEX idx_leave_balances_user_year_month ON public.leave_balances(user_id, year, month);
CREATE INDEX idx_leave_applications_applicant ON public.leave_applications(applicant_id);
CREATE INDEX idx_leave_applications_status ON public.leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON public.leave_applications(start_date, end_date);
CREATE INDEX idx_leave_approval_hierarchy_type ON public.leave_approval_hierarchy(applicant_type);

-- =============================================
-- 15. TRIGGERS FOR UPDATED_AT
-- =============================================
CREATE TRIGGER update_company_holidays_updated_at
  BEFORE UPDATE ON public.company_holidays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_institution_holidays_updated_at
  BEFORE UPDATE ON public.institution_holidays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at
  BEFORE UPDATE ON public.leave_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_approval_hierarchy_updated_at
  BEFORE UPDATE ON public.leave_approval_hierarchy
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leave_applications_updated_at
  BEFORE UPDATE ON public.leave_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
