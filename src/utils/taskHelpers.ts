import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { differenceInDays } from 'date-fns';

export const isTaskOverdue = (task: Task): boolean => {
  if (task.status === 'completed' || task.status === 'cancelled') {
    return false;
  }
  return new Date(task.due_date) < new Date();
};

export const getDaysUntilDue = (dueDate: string): number => {
  return differenceInDays(new Date(dueDate), new Date());
};

export const getPriorityColor = (priority: TaskPriority): string => {
  const colors = {
    low: 'text-muted-foreground bg-muted',
    medium: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-950',
    high: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950',
    urgent: 'text-destructive bg-destructive/10',
  };
  return colors[priority];
};

export const getStatusColor = (status: TaskStatus): string => {
  const colors = {
    pending: 'text-muted-foreground bg-muted',
    in_progress: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950',
    submitted_for_approval: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-950',
    completed: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950',
    rejected: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950',
    cancelled: 'text-destructive bg-destructive/10',
  };
  return colors[status];
};

export const sortTasksByPriority = (tasks: Task[]): Task[] => {
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return [...tasks].sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
};

export const sortTasksByDueDate = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );
};

export const filterTasksByStatus = (tasks: Task[], status: TaskStatus): Task[] => {
  return tasks.filter(task => task.status === status);
};

export const canEditTask = (task: Task, userId: string): boolean => {
  return task.created_by_id === userId;
};

export const canUpdateStatus = (task: Task, userId: string): boolean => {
  return task.assigned_to_id === userId || task.created_by_id === userId;
};

export const canSubmitForApproval = (task: Task, userId: string): boolean => {
  return task.assigned_to_id === userId && 
         task.status === 'in_progress' && 
         (task.progress_percentage ?? 0) >= 100;
};

export const canApproveTask = (task: Task, userId: string): boolean => {
  return task.created_by_id === userId && task.status === 'submitted_for_approval';
};

export const isTaskPendingMyApproval = (task: Task, userId: string): boolean => {
  return task.created_by_id === userId && task.status === 'submitted_for_approval';
};
