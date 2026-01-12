import { supabase } from '@/integrations/supabase/client';
import { Task, TaskComment, TaskStats } from '@/types/task';
import {
  sendTaskAssignedNotification,
  sendTaskStatusChangeNotification,
  sendTaskCommentNotification,
  sendTaskSubmittedNotification,
  sendTaskApprovedNotification,
  sendTaskRejectedNotification,
} from './taskNotification.service';
import {
  logTaskCreated,
  logStatusChanged,
  logPriorityChanged,
  logProgressUpdated,
  logCommentAdded,
  logTaskSubmitted,
  logTaskApproved,
  logTaskRejected,
} from './taskActivity.service';

export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  const tasksWithComments = await Promise.all(
    (data || []).map(async (task) => {
      const { data: comments } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });
      
      return { ...task, comments: comments || [] } as Task;
    })
  );
  
  return tasksWithComments;
}

export async function fetchTasksByAssignee(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('assigned_to_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  const tasksWithComments = await Promise.all(
    (data || []).map(async (task) => {
      const { data: comments } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });
      
      return { ...task, comments: comments || [] } as Task;
    })
  );
  
  return tasksWithComments;
}

export async function createTask(taskData: Omit<Task, 'id' | 'created_at' | 'comments'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: taskData.title,
      description: taskData.description,
      category: taskData.category,
      priority: taskData.priority,
      status: taskData.status || 'pending',
      created_by_id: taskData.created_by_id,
      created_by_name: taskData.created_by_name,
      created_by_position: taskData.created_by_position,
      assigned_to_id: taskData.assigned_to_id,
      assigned_to_name: taskData.assigned_to_name,
      assigned_to_position: taskData.assigned_to_position,
      assigned_to_role: taskData.assigned_to_role,
      due_date: taskData.due_date,
      progress_percentage: taskData.progress_percentage || 0,
    })
    .select()
    .single();

  if (error) throw error;
  
  const newTask = { ...data, comments: [] } as Task;
  
  // Log activity
  await logTaskCreated(newTask.id, taskData.created_by_id, taskData.created_by_name, newTask.title);
  
  // Send notification to assignee
  await sendTaskAssignedNotification(newTask);
  
  return newTask;
}

export interface UpdateTaskOptions {
  changedByName?: string;
  changedById?: string;
  approverName?: string;
  approverId?: string;
  submitterName?: string;
  submitterId?: string;
  rejectionReason?: string;
}

export async function updateTaskInDb(
  taskId: string, 
  updates: Partial<Task>,
  options?: UpdateTaskOptions
): Promise<Task> {
  // Get current task to check for changes
  const { data: currentTask } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  const oldStatus = currentTask?.status;
  const oldPriority = currentTask?.priority;
  const oldProgress = currentTask?.progress_percentage;
  
  const updateData = { ...updates };
  delete (updateData as any).comments;
  
  const { data, error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId)
    .select()
    .single();

  if (error) throw error;
  
  const { data: comments } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  
  const updatedTask = { ...data, comments: comments || [] } as Task;

  // Log activity and send notifications based on what changed
  if (oldStatus && updates.status && oldStatus !== updates.status) {
    const userId = options?.changedById || options?.submitterId || options?.approverId || '';
    const userName = options?.changedByName || options?.submitterName || options?.approverName || 'System';
    
    // Log status change
    await logStatusChanged(taskId, userId, userName, oldStatus, updates.status);
    
    // Status changed - send appropriate notification
    if (updates.status === 'submitted_for_approval' && options?.submitterName && options?.submitterId) {
      await logTaskSubmitted(taskId, options.submitterId, options.submitterName);
      await sendTaskSubmittedNotification(updatedTask, options.submitterName);
    } else if (updates.status === 'completed' && options?.approverName && options?.approverId) {
      await logTaskApproved(taskId, options.approverId, options.approverName);
      await sendTaskApprovedNotification(updatedTask, options.approverName);
    } else if (updates.status === 'rejected' && options?.approverName && options?.approverId && options?.rejectionReason) {
      await logTaskRejected(taskId, options.approverId, options.approverName, options.rejectionReason);
      await sendTaskRejectedNotification(updatedTask, options.approverName, options.rejectionReason);
    } else if (options?.changedByName && options?.changedById) {
      await sendTaskStatusChangeNotification(updatedTask, oldStatus, updates.status, options.changedByName);
    }
  }

  // Log priority change
  if (oldPriority && updates.priority && oldPriority !== updates.priority && options?.changedById && options?.changedByName) {
    await logPriorityChanged(taskId, options.changedById, options.changedByName, oldPriority, updates.priority);
  }

  // Log progress change
  if (oldProgress !== undefined && updates.progress_percentage !== undefined && oldProgress !== updates.progress_percentage && options?.changedById && options?.changedByName) {
    await logProgressUpdated(taskId, options.changedById, options.changedByName, oldProgress, updates.progress_percentage);
  }
  
  return updatedTask;
}

export async function deleteTaskFromDb(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) throw error;
}

export async function addTaskComment(
  taskId: string, 
  userId: string, 
  userName: string, 
  comment: string
): Promise<TaskComment> {
  // Get task to send notification
  const { data: task } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  const { data, error } = await supabase
    .from('task_comments')
    .insert({ task_id: taskId, user_id: userId, user_name: userName, comment })
    .select()
    .single();

  if (error) throw error;
  
  // Log activity
  await logCommentAdded(taskId, userId, userName);
  
  // Send notification to the other party
  if (task) {
    await sendTaskCommentNotification(task as Task, userId, userName, comment);
  }
  
  return data as TaskComment;
}

export async function getTaskStatistics(userId?: string): Promise<TaskStats> {
  let query = supabase.from('tasks').select('status, due_date');
  if (userId) query = query.eq('assigned_to_id', userId);
  
  const { data, error } = await query;
  if (error) throw error;
  
  const now = new Date();
  const tasks = data || [];
  
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled' && new Date(t.due_date) < now).length,
  };
}

export async function fetchAssignees(): Promise<{
  metaEmployees: Array<{ id: string; name: string; position: string; avatar?: string }>;
  officers: Array<{ id: string; userId: string; name: string; position: string; avatar?: string }>;
}> {
  const { data: metaEmployees } = await supabase
    .from('profiles')
    .select('id, name, position_name, avatar, position_id')
    .not('position_id', 'is', null);

  const { data: officers } = await supabase
    .from('officers')
    .select('id, user_id, full_name, profile_photo_url')
    .eq('status', 'active');

  return {
    metaEmployees: (metaEmployees || []).map(emp => ({
      id: emp.id,
      name: emp.name || 'Unknown',
      position: emp.position_name || 'Meta Employee',
      avatar: emp.avatar,
    })),
    officers: (officers || []).map(off => ({
      id: off.id,
      userId: off.user_id,
      name: off.full_name || 'Unknown Officer',
      position: 'Innovation Officer',
      avatar: off.profile_photo_url,
    })),
  };
}
