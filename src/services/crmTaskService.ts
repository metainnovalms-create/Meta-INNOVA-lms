import { supabase } from "@/integrations/supabase/client";

export interface CRMTask {
  id: string;
  institution_id: string;
  institution_name: string;
  task_type: 'renewal_reminder' | 'follow_up' | 'payment_reminder' | 'meeting_scheduled' | 'support_ticket';
  description: string;
  due_date: string;
  assigned_to: string;
  assigned_to_id?: string | null;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  related_contract_id?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type CreateCRMTaskInput = Omit<CRMTask, 'id' | 'created_at' | 'updated_at' | 'completed_at'>;
export type UpdateCRMTaskInput = Partial<Omit<CRMTask, 'id' | 'created_at' | 'updated_at'>>;

export async function fetchCRMTasks(): Promise<CRMTask[]> {
  const { data, error } = await supabase
    .from('crm_tasks')
    .select('*')
    .order('due_date', { ascending: true });

  if (error) {
    console.error('Error fetching CRM tasks:', error);
    throw error;
  }

  return (data || []) as CRMTask[];
}

export async function createCRMTask(task: CreateCRMTaskInput): Promise<CRMTask> {
  const { data, error } = await supabase
    .from('crm_tasks')
    .insert(task)
    .select()
    .single();

  if (error) {
    console.error('Error creating CRM task:', error);
    throw error;
  }

  return data as CRMTask;
}

export async function updateCRMTask(id: string, updates: UpdateCRMTaskInput): Promise<CRMTask> {
  const { data, error } = await supabase
    .from('crm_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating CRM task:', error);
    throw error;
  }

  return data as CRMTask;
}

export async function deleteCRMTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('crm_tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting CRM task:', error);
    throw error;
  }
}

export async function markTaskComplete(id: string): Promise<CRMTask> {
  const { data, error } = await supabase
    .from('crm_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error marking task complete:', error);
    throw error;
  }

  return data as CRMTask;
}
