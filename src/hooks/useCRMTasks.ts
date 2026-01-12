import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  fetchCRMTasks,
  createCRMTask,
  updateCRMTask,
  deleteCRMTask,
  markTaskComplete,
  CRMTask,
  CreateCRMTaskInput,
  UpdateCRMTaskInput,
} from "@/services/crmTaskService";

const CRM_TASKS_KEY = ['crm-tasks'];

export function useCRMTasks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CRM_TASKS_KEY,
    queryFn: fetchCRMTasks,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('crm-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crm_tasks',
        },
        (payload) => {
          console.log('CRM Tasks real-time update:', payload);
          queryClient.invalidateQueries({ queryKey: CRM_TASKS_KEY });
          
          if (payload.eventType === 'INSERT') {
            toast.info('New task created');
          } else if (payload.eventType === 'UPDATE') {
            // Only show toast for external updates, not own mutations
          } else if (payload.eventType === 'DELETE') {
            toast.info('Task deleted');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCreateCRMTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (task: CreateCRMTaskInput) => createCRMTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    },
  });
}

export function useUpdateCRMTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateCRMTaskInput }) =>
      updateCRMTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    },
  });
}

export function useDeleteCRMTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCRMTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    },
  });
}

export function useMarkTaskComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markTaskComplete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_TASKS_KEY });
      toast.success('Task marked as completed');
    },
    onError: (error) => {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    },
  });
}

export type { CRMTask, CreateCRMTaskInput, UpdateCRMTaskInput };
