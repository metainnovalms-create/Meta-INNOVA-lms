import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { getNotificationLink } from './notificationLink.service';

export type TaskNotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_comment_added'
  | 'task_submitted'
  | 'task_approved'
  | 'task_rejected'
  | 'task_due_soon'
  | 'task_overdue';

interface CreateNotificationParams {
  recipientId: string;
  recipientRole: 'officer' | 'student' | 'system_admin' | 'management';
  type: TaskNotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      recipient_id: params.recipientId,
      recipient_role: params.recipientRole,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || '',
      metadata: params.metadata || {},
      read: false,
    });

    if (error) {
      console.error('[TaskNotification] Error creating notification:', error);
    } else {
      console.log('[TaskNotification] Notification created:', params.type);
    }
  } catch (err) {
    console.error('[TaskNotification] Failed to create notification:', err);
  }
}

// Get recipient role based on task's assigned_to_role
function getRecipientRole(assignedToRole?: string): 'officer' | 'system_admin' | 'management' {
  if (assignedToRole === 'officer') return 'officer';
  if (assignedToRole === 'meta_employee') return 'system_admin';
  return 'system_admin';
}

/**
 * Send notification when a task is assigned to someone
 */
export async function sendTaskAssignedNotification(task: Task): Promise<void> {
  const recipientRole = getRecipientRole(task.assigned_to_role);
  
  await createNotification({
    recipientId: task.assigned_to_id,
    recipientRole,
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: `You have been assigned a new task: "${task.title}" by ${task.created_by_name}`,
    link: getNotificationLink(recipientRole, '/tasks'),
    metadata: {
      task_id: task.id,
      task_title: task.title,
      assigned_by: task.created_by_name,
      priority: task.priority,
      due_date: task.due_date,
    },
  });
}

/**
 * Send notification when task status changes
 */
export async function sendTaskStatusChangeNotification(
  task: Task,
  oldStatus: string,
  newStatus: string,
  changedByName: string
): Promise<void> {
  // Notify the creator about status changes
  await createNotification({
    recipientId: task.created_by_id,
    recipientRole: 'system_admin',
    type: 'task_status_changed',
    title: 'Task Status Updated',
    message: `Task "${task.title}" status changed from ${formatStatus(oldStatus)} to ${formatStatus(newStatus)} by ${changedByName}`,
    link: getNotificationLink('system_admin', '/task-management'),
    metadata: {
      task_id: task.id,
      task_title: task.title,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedByName,
    },
  });
}

/**
 * Send notification when a comment is added to a task
 */
export async function sendTaskCommentNotification(
  task: Task,
  commenterId: string,
  commenterName: string,
  commentPreview: string
): Promise<void> {
  // Determine who should receive the notification (the other party)
  const isCommenterCreator = commenterId === task.created_by_id;
  
  // If commenter is creator, notify assignee. Otherwise, notify creator.
  const recipientId = isCommenterCreator ? task.assigned_to_id : task.created_by_id;
  const recipientRole = isCommenterCreator 
    ? getRecipientRole(task.assigned_to_role) 
    : 'system_admin';
  const link = isCommenterCreator 
    ? getNotificationLink(recipientRole, '/tasks') 
    : getNotificationLink('system_admin', '/task-management');

  await createNotification({
    recipientId,
    recipientRole,
    type: 'task_comment_added',
    title: 'New Comment on Task',
    message: `${commenterName} commented on "${task.title}": "${commentPreview.substring(0, 50)}${commentPreview.length > 50 ? '...' : ''}"`,
    link,
    metadata: {
      task_id: task.id,
      task_title: task.title,
      commenter_id: commenterId,
      commenter_name: commenterName,
      comment_preview: commentPreview,
    },
  });
}

/**
 * Send notification when task is submitted for approval
 */
export async function sendTaskSubmittedNotification(task: Task, submitterName: string): Promise<void> {
  await createNotification({
    recipientId: task.created_by_id,
    recipientRole: 'system_admin',
    type: 'task_submitted',
    title: 'Task Submitted for Approval',
    message: `${submitterName} has submitted task "${task.title}" for your approval`,
    link: getNotificationLink('system_admin', '/task-management'),
    metadata: {
      task_id: task.id,
      task_title: task.title,
      submitter_name: submitterName,
      submitted_at: new Date().toISOString(),
    },
  });
}

/**
 * Send notification when task is approved
 */
export async function sendTaskApprovedNotification(
  task: Task,
  approverName: string
): Promise<void> {
  const recipientRole = getRecipientRole(task.assigned_to_role);
  
  await createNotification({
    recipientId: task.assigned_to_id,
    recipientRole,
    type: 'task_approved',
    title: 'Task Approved',
    message: `Your task "${task.title}" has been approved by ${approverName}`,
    link: getNotificationLink(recipientRole, '/tasks'),
    metadata: {
      task_id: task.id,
      task_title: task.title,
      approved_by: approverName,
      approved_at: new Date().toISOString(),
    },
  });
}

/**
 * Send notification when task is rejected
 */
export async function sendTaskRejectedNotification(
  task: Task,
  rejectorName: string,
  reason: string
): Promise<void> {
  const recipientRole = getRecipientRole(task.assigned_to_role);
  
  await createNotification({
    recipientId: task.assigned_to_id,
    recipientRole,
    type: 'task_rejected',
    title: 'Task Rejected',
    message: `Your task "${task.title}" was rejected by ${rejectorName}. Reason: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
    link: getNotificationLink(recipientRole, '/tasks'),
    metadata: {
      task_id: task.id,
      task_title: task.title,
      rejected_by: rejectorName,
      rejection_reason: reason,
      rejected_at: new Date().toISOString(),
    },
  });
}

/**
 * Send notification when task is due soon (within 24 hours)
 */
export async function sendTaskDueSoonNotification(task: Task): Promise<void> {
  const recipientRole = getRecipientRole(task.assigned_to_role);
  
  await createNotification({
    recipientId: task.assigned_to_id,
    recipientRole,
    type: 'task_due_soon',
    title: 'Task Due Soon',
    message: `Task "${task.title}" is due within 24 hours`,
    link: getNotificationLink(recipientRole, '/tasks'),
    metadata: {
      task_id: task.id,
      task_title: task.title,
      due_date: task.due_date,
    },
  });
}

/**
 * Send notification when task is overdue
 */
export async function sendTaskOverdueNotification(task: Task): Promise<void> {
  const recipientRole = getRecipientRole(task.assigned_to_role);
  
  await createNotification({
    recipientId: task.assigned_to_id,
    recipientRole,
    type: 'task_overdue',
    title: 'Task Overdue',
    message: `Task "${task.title}" is overdue. Please complete it as soon as possible.`,
    link: getNotificationLink(recipientRole, '/tasks'),
    metadata: {
      task_id: task.id,
      task_title: task.title,
      due_date: task.due_date,
    },
  });
}

// Helper function to format status for display
function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
