-- Create positions table for position management
CREATE TABLE public.positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  visible_features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_ceo_position boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_positions_updated_at
  BEFORE UPDATE ON public.positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies: Allow authenticated users to view positions
CREATE POLICY "Authenticated users can view positions"
  ON public.positions FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies: Only super_admin or system_admin with is_ceo can manage positions
CREATE POLICY "Super admins can manage positions"
  ON public.positions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "CEO can manage positions"
  ON public.positions FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'system_admin'::app_role) AND 
    (SELECT is_ceo FROM public.profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'system_admin'::app_role) AND 
    (SELECT is_ceo FROM public.profiles WHERE id = auth.uid()) = true
  );

-- Seed default CEO position with all features
INSERT INTO public.positions (id, position_name, display_name, description, visible_features, is_ceo_position)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'ceo',
  'CEO (Chief Executive Officer)',
  'Complete system access with all features enabled',
  '["institution_management", "course_management", "assessment_management", "assignment_management", "event_management", "officer_management", "project_management", "inventory_management", "attendance_payroll", "leave_approvals", "institutional_calendar", "reports_analytics", "sdg_management", "task_management", "task_allotment", "credential_management", "gamification", "id_configuration", "survey_feedback", "performance_ratings"]'::jsonb,
  true
);

-- Seed other default positions
INSERT INTO public.positions (position_name, display_name, description, visible_features, is_ceo_position) VALUES
('md', 'Managing Director', 'Senior management oversight', '["institution_management", "course_management", "officer_management", "reports_analytics", "attendance_payroll", "leave_approvals"]'::jsonb, false),
('agm', 'Assistant General Manager', 'Supports GM in daily operations', '["course_management", "officer_management", "attendance_payroll", "reports_analytics"]'::jsonb, false),
('gm', 'General Manager', 'Oversees operational aspects', '["course_management", "officer_management", "project_management", "attendance_payroll", "reports_analytics"]'::jsonb, false),
('manager', 'Manager', 'Department-level management', '["course_management", "officer_management", "attendance_payroll"]'::jsonb, false),
('admin_staff', 'Administrative Staff', 'Basic administrative access', '["attendance_payroll", "reports_analytics"]'::jsonb, false);

-- Update existing CEO profile to link to CEO position
UPDATE public.profiles
SET position_id = 'a0000000-0000-0000-0000-000000000001',
    position_name = 'ceo'
WHERE is_ceo = true AND position_id IS NULL;