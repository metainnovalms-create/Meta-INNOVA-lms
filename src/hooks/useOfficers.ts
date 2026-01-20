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
 * Cascade delete an officer and all related data:
 * - Documents from storage and database
 * - Institution assignments
 * - Attendance records
 * - Class access grants
 */
export function useDeleteOfficerCascade() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (officerId: string) => {
      // 1. Get all documents for this officer to delete from storage
      const { data: docs } = await supabase
        .from('officer_documents')
        .select('file_url')
        .eq('officer_id', officerId);
      
      // 2. Delete files from storage bucket
      if (docs && docs.length > 0) {
        const filePaths: string[] = [];
        for (const d of docs) {
          try {
            const url = new URL(d.file_url);
            const pathMatch = url.pathname.match(/\/officer-documents\/(.+)/);
            if (pathMatch) {
              filePaths.push(decodeURIComponent(pathMatch[1]));
            }
          } catch {
            // Skip invalid URLs
          }
        }
        
        if (filePaths.length > 0) {
          await supabase.storage
            .from('officer-documents')
            .remove(filePaths);
        }
      }
      
      // Delete from related tables - ignore errors for tables that may not have data
      // 3. Delete from officer_documents
      await supabase.from('officer_documents').delete().eq('officer_id', officerId);
      
      // 4. Delete from officer_institution_assignments
      await supabase.from('officer_institution_assignments').delete().eq('officer_id', officerId);
      
      // 5. Delete from officer_attendance
      await supabase.from('officer_attendance').delete().eq('officer_id', officerId);
      
      // 6. Delete from officer_class_access_grants (both granting and receiving)
      // Using explicit void return to avoid type instantiation issues
      const deleteAccessGrants = async (column: string, id: string) => {
        const query = supabase.from('officer_class_access_grants').delete();
        await (query as any).eq(column, id);
      };
      await deleteAccessGrants('granting_officer_id', officerId);
      await deleteAccessGrants('receiving_officer_id', officerId);
      
      // 7. Delete from purchase_requests (officer's purchase requests)
      await supabase.from('purchase_requests').delete().eq('officer_id', officerId);
      
      // 8. Delete from daily_work_logs
      await supabase.from('daily_work_logs').delete().eq('officer_id', officerId);
      
      // 9. Update class_session_attendance to remove officer reference (preserve records)
      await supabase
        .from('class_session_attendance')
        .update({ officer_id: null, completed_by: null })
        .eq('officer_id', officerId);
      
      await supabase
        .from('class_session_attendance')
        .update({ completed_by: null })
        .eq('completed_by', officerId);
      
      // Finally delete from officers table
      const { error } = await supabase
        .from('officers')
        .delete()
        .eq('id', officerId);
      
      if (error) throw error;
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
