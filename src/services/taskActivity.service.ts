import { supabase } from "@/integrations/supabase/client";
import { TaskActivity, TaskActivityType } from "@/types/task";

export interface LogActivityParams {
  taskId: string;
  userId: string;
  userName: string;
  actionType: TaskActivityType;
  description: string;
  oldValue?: string;
  newValue?: string;
}

export const logTaskActivity = async (params: LogActivityParams): Promise<void> => {
  const { taskId, userId, userName, actionType, description, oldValue, newValue } = params;

  const { error } = await supabase
    .from('task_activity_log')
    .insert({
      task_id: taskId,
      user_id: userId,
      user_name: userName,
      action_type: actionType,
      description,
      old_value: oldValue || null,
      new_value: newValue || null,
    });

  if (error) {
    console.error('Error logging task activity:', error);
    // Don't throw - activity logging should not break main flow
  }
};

export const fetchTaskActivities = async (taskId: string): Promise<TaskActivity[]> => {
  const { data, error } = await supabase
    .from('task_activity_log')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching task activities:', error);
    return [];
  }

  return (data || []).map(item => ({
    id: item.id,
    task_id: item.task_id,
    user_id: item.user_id,
    user_name: item.user_name,
    action_type: item.action_type as TaskActivityType,
    old_value: item.old_value || undefined,
    new_value: item.new_value || undefined,
    description: item.description,
    created_at: item.created_at,
  }));
};

// Helper functions for common activity logging
export const logTaskCreated = (taskId: string, userId: string, userName: string, taskTitle: string) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'created',
    description: `Created task: ${taskTitle}`,
  });

export const logStatusChanged = (
  taskId: string,
  userId: string,
  userName: string,
  oldStatus: string,
  newStatus: string
) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'status_changed',
    description: `Changed status from ${oldStatus} to ${newStatus}`,
    oldValue: oldStatus,
    newValue: newStatus,
  });

export const logPriorityChanged = (
  taskId: string,
  userId: string,
  userName: string,
  oldPriority: string,
  newPriority: string
) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'priority_changed',
    description: `Changed priority from ${oldPriority} to ${newPriority}`,
    oldValue: oldPriority,
    newValue: newPriority,
  });

export const logProgressUpdated = (
  taskId: string,
  userId: string,
  userName: string,
  oldProgress: number,
  newProgress: number
) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'progress_updated',
    description: `Updated progress from ${oldProgress}% to ${newProgress}%`,
    oldValue: `${oldProgress}%`,
    newValue: `${newProgress}%`,
  });

export const logCommentAdded = (taskId: string, userId: string, userName: string) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'comment_added',
    description: `Added a comment`,
  });

export const logAttachmentAdded = (taskId: string, userId: string, userName: string, fileName: string) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'attachment_added',
    description: `Uploaded attachment: ${fileName}`,
    newValue: fileName,
  });

export const logAttachmentRemoved = (taskId: string, userId: string, userName: string, fileName: string) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'attachment_removed',
    description: `Removed attachment: ${fileName}`,
    oldValue: fileName,
  });

export const logTaskSubmitted = (taskId: string, userId: string, userName: string) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'submitted',
    description: `Submitted task for approval`,
  });

export const logTaskApproved = (taskId: string, userId: string, userName: string) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'approved',
    description: `Approved and completed the task`,
  });

export const logTaskRejected = (taskId: string, userId: string, userName: string, reason?: string) =>
  logTaskActivity({
    taskId,
    userId,
    userName,
    actionType: 'rejected',
    description: reason ? `Rejected the task: ${reason}` : 'Rejected the task',
    newValue: reason,
  });
