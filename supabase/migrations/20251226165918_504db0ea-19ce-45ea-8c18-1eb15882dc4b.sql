-- Create leave_settings table for configurable leave policy
CREATE TABLE public.leave_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leave_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone authenticated can view, only super/system admins can modify
CREATE POLICY "Authenticated users can view leave settings"
ON public.leave_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage leave settings"
ON public.leave_settings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage leave settings"
ON public.leave_settings
FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Insert default settings
INSERT INTO public.leave_settings (setting_key, setting_value, description) VALUES
  ('leaves_per_year', '12', 'Total leaves per year for full-time employees'),
  ('leaves_per_month', '1', 'Leaves credited per month'),
  ('max_carry_forward', '1', 'Maximum leaves that can be carried to next month'),
  ('max_leaves_per_month', '2', 'Maximum leaves allowed in a single month (including carry-over)');

-- Add trigger for updated_at
CREATE TRIGGER update_leave_settings_updated_at
BEFORE UPDATE ON public.leave_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();