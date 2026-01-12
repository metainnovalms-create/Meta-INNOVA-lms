-- Create communication_logs table
CREATE TABLE public.communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE NOT NULL,
  institution_name TEXT NOT NULL,
  
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'visit', 'follow_up')),
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  subject TEXT NOT NULL,
  notes TEXT NOT NULL,
  
  contact_person TEXT NOT NULL,
  contact_role TEXT NOT NULL,
  
  conducted_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conducted_by_name TEXT NOT NULL,
  
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('completed', 'pending', 'follow_up_required')) DEFAULT 'completed',
  
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create communication_log_attachments table
CREATE TABLE public.communication_log_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_log_id UUID REFERENCES public.communication_logs(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_by_id UUID REFERENCES auth.users(id),
  uploaded_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communication_log_attachments ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_log_attachments;

-- Indexes for performance
CREATE INDEX idx_communication_logs_institution ON public.communication_logs(institution_id);
CREATE INDEX idx_communication_logs_date ON public.communication_logs(date DESC);
CREATE INDEX idx_communication_logs_conducted_by ON public.communication_logs(conducted_by_id);

-- Create storage bucket for CRM attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('crm-attachments', 'crm-attachments', true);

-- RLS Policies for communication_logs
CREATE POLICY "Super admins can manage all communication logs"
  ON public.communication_logs FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all communication logs"
  ON public.communication_logs FOR ALL
  USING (has_role(auth.uid(), 'system_admin'::app_role));

-- RLS Policies for communication_log_attachments
CREATE POLICY "Super admins can manage all communication attachments"
  ON public.communication_log_attachments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all communication attachments"
  ON public.communication_log_attachments FOR ALL
  USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Storage policies for crm-attachments bucket
CREATE POLICY "Authenticated users can upload CRM attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'crm-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view CRM attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'crm-attachments');

CREATE POLICY "Users can delete own CRM attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'crm-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);