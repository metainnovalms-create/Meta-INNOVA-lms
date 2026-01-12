import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { gamificationDbService } from '@/services/gamification-db.service';

export interface AddMemberInput {
  project_id: string;
  student_id: string;
  role?: 'leader' | 'member';
  assigned_by_officer_id?: string;
}

export interface UpdateMemberInput {
  id: string;
  role: 'leader' | 'member';
}

// Helper function to award project membership XP
async function awardProjectXP(projectId: string, studentId: string) {
  try {
    // Get project's institution_id
    const { data: project } = await supabase
      .from('projects')
      .select('institution_id')
      .eq('id', projectId)
      .single();
    
    if (project?.institution_id) {
      await gamificationDbService.awardProjectMembershipXP(
        studentId,
        project.institution_id,
        projectId
      );
    }
  } catch (error) {
    console.error('Error awarding project XP:', error);
  }
}

// Add a student to a project
export function useAddProjectMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AddMemberInput) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: input.project_id,
          student_id: input.student_id,
          role: input.role || 'member',
          assigned_by_officer_id: input.assigned_by_officer_id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Award XP for joining project
      await awardProjectXP(input.project_id, input.student_id);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Student added to project');
    },
    onError: (error: any) => {
      console.error('Error adding member:', error);
      if (error.code === '23505') {
        toast.error('Student is already a member of this project');
      } else {
        toast.error('Failed to add student to project');
      }
    },
  });
}

// Add multiple students to a project
export function useAddProjectMembers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (inputs: AddMemberInput[]) => {
      const { data, error } = await supabase
        .from('project_members')
        .insert(inputs.map(input => ({
          project_id: input.project_id,
          student_id: input.student_id,
          role: input.role || 'member',
          assigned_by_officer_id: input.assigned_by_officer_id,
        })))
        .select();
      
      if (error) throw error;
      
      // Award XP for each student joining project
      for (const input of inputs) {
        await awardProjectXP(input.project_id, input.student_id);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Students added to project');
    },
    onError: (error) => {
      console.error('Error adding members:', error);
      toast.error('Failed to add students to project');
    },
  });
}

// Update a member's role
export function useUpdateProjectMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateMemberInput) => {
      const { data, error } = await supabase
        .from('project_members')
        .update({ role: input.role })
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Member role updated');
    },
    onError: (error) => {
      console.error('Error updating member:', error);
      toast.error('Failed to update member role');
    },
  });
}

// Remove a student from a project
export function useRemoveProjectMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Student removed from project');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Failed to remove student from project');
    },
  });
}
