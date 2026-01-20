import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Officer {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  employee_id: string | null;
  employment_type: string;
  status: string;
  join_date: string | null;
  department: string | null;
  annual_salary: number;
  hourly_rate: number | null;
  overtime_rate_multiplier: number | null;
  normal_working_hours: number | null;
  annual_leave_allowance: number | null;
  sick_leave_allowance: number | null;
  casual_leave_allowance: number | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  profile_photo_url: string | null;
  bank_account_number: string | null;
  bank_name: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  qualifications: any[];
  certifications: any[];
  skills: any[];
  statutory_info: Record<string, any>;
  salary_structure: Record<string, any>;
  assigned_institutions: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateOfficerData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  employee_id?: string;
  employment_type: string;
  annual_salary: number;
  hourly_rate?: number;
  overtime_rate_multiplier?: number;
  join_date?: string;
  institution_id?: string;
}

export function useOfficers() {
  return useQuery({
    queryKey: ['officers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Officer[];
    },
  });
}

export function useOfficer(id: string) {
  return useQuery({
    queryKey: ['officers', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Officer;
    },
    enabled: !!id,
  });
}

export function useCreateOfficer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateOfficerData) => {
      const response = await supabase.functions.invoke('create-officer-user', {
        body: data,
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to create officer');
      }
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      toast.success('Officer created successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to create officer', {
        description: error.message,
      });
    },
  });
}

export function useUpdateOfficer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Officer> }) => {
      const { data: result, error } = await supabase
        .from('officers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      queryClient.invalidateQueries({ queryKey: ['officers', id] });
      toast.success('Officer updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update officer', {
        description: error.message,
      });
    },
  });
}

export function useDeleteOfficer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('officers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      toast.success('Officer deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete officer', {
        description: error.message,
      });
    },
  });
}

/**
 * Cascade delete an officer and all related data via edge function:
 * - Documents from storage and database
 * - Institution assignments
 * - Attendance records
 * - Class access grants
 * - Auth user, profiles, and user_roles
 */
export function useDeleteOfficerCascade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (officerId: string) => {
      console.log('[Officers] Deleting officer via edge function:', officerId);
      
      // Call edge function for proper cascade deletion (includes auth user, profiles, user_roles)
      const { data, error } = await supabase.functions.invoke('delete-officer-user', {
        body: { officer_id: officerId },
      });

      if (error) {
        console.error('[Officers] Edge function error:', error);
        throw new Error(error.message || 'Failed to delete officer');
      }

      if (data?.error) {
        console.error('[Officers] Delete error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('[Officers] Deleted successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officers'] });
      queryClient.invalidateQueries({ queryKey: ['officer-institution-assignments'] });
      toast.success('Officer and all related data deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete officer', {
        description: error.message,
      });
    },
  });
}
