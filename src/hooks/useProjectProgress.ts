import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AddProgressUpdateInput {
  project_id: string;
  notes: string;
  progress_percentage?: number;
  updated_by_officer_id?: string;
  updated_by_officer_name: string;
  attachment_urls?: string[];
}

// Add a progress update to a project
export function useAddProgressUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AddProgressUpdateInput) => {
      // Insert the progress update
      const { data, error } = await supabase
        .from('project_progress_updates')
        .insert({
          project_id: input.project_id,
          notes: input.notes,
          progress_percentage: input.progress_percentage ?? null,
          updated_by_officer_id: input.updated_by_officer_id,
          updated_by_officer_name: input.updated_by_officer_name,
          attachment_urls: input.attachment_urls || [],
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Also update the project's progress if provided
      if (input.progress_percentage !== undefined) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ progress: input.progress_percentage })
          .eq('id', input.project_id);
        
        if (updateError) {
          console.error('Error updating project progress:', updateError);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Progress update added');
    },
    onError: (error) => {
      console.error('Error adding progress update:', error);
      toast.error('Failed to add progress update');
    },
  });
}

// Delete a progress update
export function useDeleteProgressUpdate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase
        .from('project_progress_updates')
        .delete()
        .eq('id', updateId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Progress update deleted');
    },
    onError: (error) => {
      console.error('Error deleting progress update:', error);
      toast.error('Failed to delete progress update');
    },
  });
}
