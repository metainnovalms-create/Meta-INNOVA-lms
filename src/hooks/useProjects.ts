import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Project {
  id: string;
  institution_id: string;
  title: string;
  description: string | null;
  category: string;
  status: 'yet_to_start' | 'ongoing' | 'completed';
  is_published: boolean;
  progress: number;
  created_by_officer_id: string;
  created_by_officer_name: string;
  sdg_goals: number[];
  remarks: string | null;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  is_showcase: boolean;
  showcase_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectWithRelations extends Project {
  project_members: {
    id: string;
    student_id: string;
    role: string;
    student: {
      id: string;
      student_name: string;
      class_id: string | null;
    };
  }[];
  project_achievements: {
    id: string;
    title: string;
    type: string;
    event_name: string | null;
    event_date: string | null;
    certificate_url: string | null;
    created_at: string;
  }[];
  project_progress_updates: {
    id: string;
    notes: string;
    progress_percentage: number | null;
    updated_by_officer_name: string;
    created_at: string;
  }[];
}

export interface CreateProjectInput {
  institution_id: string;
  title: string;
  description?: string;
  category: string;
  status?: 'yet_to_start' | 'ongoing' | 'completed';
  sdg_goals?: number[];
  remarks?: string;
  start_date?: string;
  target_completion_date?: string;
  created_by_officer_id: string;
  created_by_officer_name: string;
}

export interface UpdateProjectInput {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  status?: 'yet_to_start' | 'ongoing' | 'completed';
  is_published?: boolean;
  progress?: number;
  sdg_goals?: number[];
  remarks?: string;
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  is_showcase?: boolean;
  showcase_image_url?: string;
}

// Fetch ALL projects across all institutions (for CEO/Super Admin)
export function useAllProjects() {
  return useQuery({
    queryKey: ['projects', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            id,
            student_id,
            role,
            student:students(id, student_name, class_id)
          ),
          project_achievements(
            id,
            title,
            type,
            event_name,
            event_date,
            certificate_url,
            created_at
          ),
          project_progress_updates(
            id,
            notes,
            progress_percentage,
            updated_by_officer_name,
            created_at
          ),
          institution:institutions(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as (ProjectWithRelations & { institution: { id: string; name: string } })[];
    },
  });
}

// Fetch all projects for an institution (for officers/management)
export function useInstitutionProjects(institutionId: string | null) {
  return useQuery({
    queryKey: ['projects', 'institution', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            id,
            student_id,
            role,
            student:students(id, student_name, class_id)
          ),
          project_achievements(
            id,
            title,
            type,
            event_name,
            event_date,
            certificate_url,
            created_at
          ),
          project_progress_updates(
            id,
            notes,
            progress_percentage,
            updated_by_officer_name,
            created_at
          )
        `)
        .eq('institution_id', institutionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ProjectWithRelations[];
    },
    enabled: !!institutionId,
  });
}

// Fetch projects assigned to a student
export function useStudentProjects(studentId: string | null) {
  return useQuery({
    queryKey: ['projects', 'student', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      // First get project IDs the student is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('student_id', studentId);
      
      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) return [];
      
      const projectIds = memberData.map(m => m.project_id);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            id,
            student_id,
            role,
            student:students(id, student_name, class_id)
          ),
          project_achievements(
            id,
            title,
            type,
            event_name,
            event_date,
            certificate_url,
            created_at
          ),
          project_progress_updates(
            id,
            notes,
            progress_percentage,
            updated_by_officer_name,
            created_at
          )
        `)
        .in('id', projectIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ProjectWithRelations[];
    },
    enabled: !!studentId,
  });
}

// Create a new project
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          institution_id: input.institution_id,
          title: input.title,
          description: input.description || null,
          category: input.category,
          status: input.status || 'yet_to_start',
          sdg_goals: input.sdg_goals || [],
          remarks: input.remarks || null,
          start_date: input.start_date || null,
          target_completion_date: input.target_completion_date || null,
          created_by_officer_id: input.created_by_officer_id,
          created_by_officer_name: input.created_by_officer_name,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects', 'institution', variables.institution_id] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    },
  });
}

// Update a project
export function useUpdateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const { id, ...updates } = input;
      
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    },
  });
}

// Delete a project (CEO only)
export function useDeleteProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. Only CEO can delete projects.');
    },
  });
}
