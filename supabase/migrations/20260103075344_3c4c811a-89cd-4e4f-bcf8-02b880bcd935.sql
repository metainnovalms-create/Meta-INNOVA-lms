-- Create system_logs table for tracking all user activity
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- LOGIN, LOGOUT, CREATE, UPDATE, DELETE, DOWNLOAD, VIEW, EXPORT
  entity_type TEXT NOT NULL, -- User, Institution, Course, Assessment, Assignment, etc.
  entity_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'success', -- success, failed
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX idx_system_logs_action_type ON public.system_logs(action_type);
CREATE INDEX idx_system_logs_entity_type ON public.system_logs(entity_type);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_institution_id ON public.system_logs(institution_id);
CREATE INDEX idx_system_logs_status ON public.system_logs(status);

-- Enable RLS
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Super admins can view all logs
CREATE POLICY "Super admins can view all system logs"
ON public.system_logs
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System admins can view all logs
CREATE POLICY "System admins can view all system logs"
ON public.system_logs
FOR SELECT
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Allow authenticated users to insert their own logs
CREATE POLICY "Authenticated users can insert own logs"
ON public.system_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_logs;
ALTER TABLE public.system_logs REPLICA IDENTITY FULL;