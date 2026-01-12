-- Create task_activity_log table
CREATE TABLE public.task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_attachments table
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  uploaded_by_id UUID NOT NULL,
  uploaded_by_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add reminder tracking columns to tasks
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS due_soon_notified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS overdue_notified BOOLEAN DEFAULT false;

-- Enable RLS on task_activity_log
ALTER TABLE public.task_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_activity_log
CREATE POLICY "Users can view activity for accessible tasks"
  ON public.task_activity_log FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks 
      WHERE created_by_id = auth.uid() OR assigned_to_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'system_admin'::app_role)
  );

CREATE POLICY "Users can insert activity"
  ON public.task_activity_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Super admins can manage all activity"
  ON public.task_activity_log FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all activity"
  ON public.task_activity_log FOR ALL
  USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Enable RLS on task_attachments
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_attachments
CREATE POLICY "Users can view attachments for accessible tasks"
  ON public.task_attachments FOR SELECT
  USING (
    task_id IN (
      SELECT id FROM public.tasks 
      WHERE created_by_id = auth.uid() OR assigned_to_id = auth.uid()
    )
    OR has_role(auth.uid(), 'super_admin'::app_role)
    OR has_role(auth.uid(), 'system_admin'::app_role)
  );

CREATE POLICY "Users can upload attachments to accessible tasks"
  ON public.task_attachments FOR INSERT
  WITH CHECK (
    uploaded_by_id = auth.uid() AND
    task_id IN (
      SELECT id FROM public.tasks 
      WHERE created_by_id = auth.uid() OR assigned_to_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own attachments"
  ON public.task_attachments FOR DELETE
  USING (uploaded_by_id = auth.uid());

CREATE POLICY "Super admins can manage all attachments"
  ON public.task_attachments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all attachments"
  ON public.task_attachments FOR ALL
  USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Create storage bucket for task attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task-attachments bucket
CREATE POLICY "Authenticated users can upload task attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-attachments' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Anyone can view task attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'task-attachments');

CREATE POLICY "Users can delete own task attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-attachments' AND
    auth.uid() IS NOT NULL
  );

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_attachments;