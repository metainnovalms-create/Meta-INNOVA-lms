-- Create system_configurations table to store configurable settings
CREATE TABLE public.system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;

-- Only super_admin and system_admin can view/modify system configurations
CREATE POLICY "Super admins can view system configurations"
ON public.system_configurations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'system_admin')
  )
);

CREATE POLICY "Super admins can insert system configurations"
ON public.system_configurations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'system_admin')
  )
);

CREATE POLICY "Super admins can update system configurations"
ON public.system_configurations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('super_admin', 'system_admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON public.system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations
INSERT INTO public.system_configurations (key, value, category, description) VALUES
('email_service', '{"smtp_host": "", "smtp_port": "587", "smtp_user": "", "enabled": false}', 'integrations', 'Email SMTP settings'),
('sms_gateway', '{"provider": "twilio", "api_key": "", "enabled": false}', 'integrations', 'SMS gateway settings'),
('feature_ai', '{"enabled": false}', 'features', 'AI features toggle'),
('feature_proctoring', '{"enabled": true}', 'features', 'Exam proctoring toggle'),
('feature_gamification', '{"enabled": true}', 'features', 'Gamification features toggle'),
('backup_settings', '{"enabled": true, "frequency": "daily"}', 'database', 'Database backup configuration');