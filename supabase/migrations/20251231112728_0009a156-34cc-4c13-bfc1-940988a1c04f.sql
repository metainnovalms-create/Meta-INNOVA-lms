-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Creator info
  created_by_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT NOT NULL,
  created_by_position TEXT,
  
  -- Assignee info
  assigned_to_id UUID NOT NULL,
  assigned_to_name TEXT NOT NULL,
  assigned_to_position TEXT,
  assigned_to_role TEXT,
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  -- Approval workflow
  approved_by_id UUID REFERENCES auth.users(id),
  approved_by_name TEXT,
  rejection_reason TEXT,
  
  -- Progress
  progress_percentage INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]',
  
  CONSTRAINT valid_task_status CHECK (status IN ('pending', 'in_progress', 'submitted_for_approval', 'completed', 'rejected', 'cancelled')),
  CONSTRAINT valid_task_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT valid_task_category CHECK (category IN ('administrative', 'operational', 'strategic', 'technical', 'other'))
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
-- Super admins and system admins can manage all tasks
CREATE POLICY "Super admins can manage all tasks"
  ON public.tasks FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all tasks"
  ON public.tasks FOR ALL
  USING (has_role(auth.uid(), 'system_admin'::app_role));

-- Officers can view tasks assigned to them
CREATE POLICY "Officers can view assigned tasks"
  ON public.tasks FOR SELECT
  USING (has_role(auth.uid(), 'officer'::app_role) AND assigned_to_id = auth.uid());

-- Officers can update their assigned tasks
CREATE POLICY "Officers can update assigned tasks"
  ON public.tasks FOR UPDATE
  USING (has_role(auth.uid(), 'officer'::app_role) AND assigned_to_id = auth.uid());

-- RLS Policies for task_comments
CREATE POLICY "Super admins can manage all task comments"
  ON public.task_comments FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "System admins can manage all task comments"
  ON public.task_comments FOR ALL
  USING (has_role(auth.uid(), 'system_admin'::app_role));

CREATE POLICY "Officers can view comments on their tasks"
  ON public.task_comments FOR SELECT
  USING (
    has_role(auth.uid(), 'officer'::app_role) AND
    task_id IN (SELECT id FROM public.tasks WHERE assigned_to_id = auth.uid())
  );

CREATE POLICY "Officers can add comments to their tasks"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'officer'::app_role) AND
    user_id = auth.uid() AND
    task_id IN (SELECT id FROM public.tasks WHERE assigned_to_id = auth.uid())
  );

-- Create indexes for better performance
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to_id);
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);