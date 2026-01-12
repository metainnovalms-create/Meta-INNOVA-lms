-- Create crm_tasks table for CRM Tasks & Reminders
CREATE TABLE public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('renewal_reminder', 'follow_up', 'payment_reminder', 'meeting_scheduled', 'support_ticket')),
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_to_id UUID REFERENCES profiles(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  related_contract_id UUID REFERENCES crm_contracts(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies for super_admin
CREATE POLICY "Super admins can manage all CRM tasks"
ON public.crm_tasks FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS policies for system_admin
CREATE POLICY "System admins can manage all CRM tasks"
ON public.crm_tasks FOR ALL
USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_crm_tasks_updated_at
BEFORE UPDATE ON public.crm_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_tasks;