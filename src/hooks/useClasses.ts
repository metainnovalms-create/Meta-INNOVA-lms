import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClassFormData {
  class_name: string;
  section?: string;
  display_order?: number;
  academic_year?: string;
  capacity?: number;
  room_number?: string;
  class_teacher_id?: string;
  status?: string;
}

export interface DbClass {
  id: string;
  institution_id: string;
  class_name: string;
  section: string | null;
  display_order: number | null;
  academic_year: string | null;
  capacity: number | null;
  room_number: string | null;
  class_teacher_id: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ClassWithStudentCount extends DbClass {
  student_count?: number;
}

// Helper to verify authentication
async function verifyAuth(): Promise<{ userId: string; isValid: boolean; error?: string }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    console.error('[Classes] No active session:', sessionError);
    return { userId: '', isValid: false, error: 'You must be logged in to perform this action' };
  }

  return { userId: session.user.id, isValid: true };
}

export function useClasses(institutionId?: string) {
  const queryClient = useQueryClient();

  // Fetch classes for an institution
  const {
    data: classes = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['classes', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      console.log('[Classes] Fetching classes for institution:', institutionId);
      
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('institution_id', institutionId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('[Classes] Fetch error:', error);
        throw error;
      }
      
      console.log('[Classes] Fetched:', data?.length || 0, 'classes');
      return data as DbClass[];
    },
    enabled: !!institutionId,
    staleTime: 30000,
  });

  // Fetch classes with student counts
  const {
    data: classesWithCounts = [],
    isLoading: isLoadingWithCounts,
  } = useQuery({
    queryKey: ['classes-with-counts', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      console.log('[Classes] Fetching classes with counts for:', institutionId);
      
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('institution_id', institutionId)
        .order('display_order', { ascending: true });

      if (classError) {
        console.error('[Classes] Fetch classes error:', classError);
        throw classError;
      }

      // Get student counts per class
      const { data: studentCounts, error: countError } = await supabase
        .from('students')
        .select('class_id')
        .eq('institution_id', institutionId);

      if (countError) {
        console.error('[Classes] Fetch student counts error:', countError);
        throw countError;
      }

      const countMap: Record<string, number> = {};
      studentCounts?.forEach(s => {
        if (s.class_id) {
          countMap[s.class_id] = (countMap[s.class_id] || 0) + 1;
        }
      });

      const result = (classData || []).map(cls => ({
        ...cls,
        student_count: countMap[cls.id] || 0
      })) as ClassWithStudentCount[];
      
      console.log('[Classes] Fetched with counts:', result.length, 'classes');
      return result;
    },
    enabled: !!institutionId,
    staleTime: 30000,
  });

  // Create class mutation
  const createClassMutation = useMutation({
    mutationFn: async (formData: ClassFormData & { institution_id: string }) => {
      console.log('[Classes] Creating class:', formData.class_name);
      
      // Verify authentication
      const authCheck = await verifyAuth();
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      const { data, error } = await supabase
        .from('classes')
        .insert({
          institution_id: formData.institution_id,
          class_name: formData.class_name,
          section: formData.section || 'A',
          display_order: formData.display_order || 0,
          academic_year: formData.academic_year,
          capacity: formData.capacity || 30,
          room_number: formData.room_number,
          class_teacher_id: formData.class_teacher_id,
          status: formData.status || 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('[Classes] Create error:', error);
        throw new Error(`Failed to create class: ${error.message}`);
      }
      
      console.log('[Classes] Created successfully:', data.id);
      return data;
    },
    onMutate: async (newClass) => {
      await queryClient.cancelQueries({ queryKey: ['classes', newClass.institution_id] });
      const previousClasses = queryClient.getQueryData<DbClass[]>(['classes', newClass.institution_id]);
      
      const optimisticClass: DbClass = {
        id: `temp-${Date.now()}`,
        institution_id: newClass.institution_id,
        class_name: newClass.class_name,
        section: newClass.section || 'A',
        display_order: newClass.display_order || 0,
        academic_year: newClass.academic_year || null,
        capacity: newClass.capacity || 30,
        room_number: newClass.room_number || null,
        class_teacher_id: newClass.class_teacher_id || null,
        status: newClass.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<DbClass[]>(
        ['classes', newClass.institution_id],
        (old = []) => [...old, optimisticClass]
      );

      return { previousClasses };
    },
    onError: (err: Error, newClass, context) => {
      console.error('[Classes] Create mutation error:', err);
      if (context?.previousClasses) {
        queryClient.setQueryData(['classes', newClass.institution_id], context.previousClasses);
      }
      toast.error(err.message || 'Failed to create class');
    },
    onSuccess: (data) => {
      toast.success(`Class "${data.class_name}" created successfully`);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', variables.institution_id] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-counts', variables.institution_id] });
    },
  });

  // Update class mutation
  const updateClassMutation = useMutation({
    mutationFn: async ({ id, ...formData }: ClassFormData & { id: string; institution_id: string }) => {
      console.log('[Classes] Updating class:', id);
      
      // Verify authentication
      const authCheck = await verifyAuth();
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      const { data, error } = await supabase
        .from('classes')
        .update({
          class_name: formData.class_name,
          section: formData.section,
          display_order: formData.display_order,
          academic_year: formData.academic_year,
          capacity: formData.capacity,
          room_number: formData.room_number,
          class_teacher_id: formData.class_teacher_id,
          status: formData.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Classes] Update error:', error);
        throw new Error(`Failed to update class: ${error.message}`);
      }
      
      console.log('[Classes] Updated successfully:', data.id);
      return data;
    },
    onError: (err: Error) => {
      console.error('[Classes] Update mutation error:', err);
      toast.error(err.message || 'Failed to update class');
    },
    onSuccess: (data) => {
      toast.success(`Class "${data.class_name}" updated successfully`);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', variables.institution_id] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-counts', variables.institution_id] });
    },
  });

  // Delete class mutation - using cascade delete edge function
  const deleteClassMutation = useMutation({
    mutationFn: async ({ id, institution_id }: { id: string; institution_id: string }) => {
      console.log('[Classes] Deleting class with cascade:', id);
      
      // Verify authentication
      const authCheck = await verifyAuth();
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-class-cascade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ classId: id, institutionId: institution_id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Classes] Delete error:', errorData);
        throw new Error(errorData.error || 'Failed to delete class');
      }

      const result = await response.json();
      console.log('[Classes] Cascade delete completed:', result);
      return { id, ...result };
    },
    onMutate: async ({ id, institution_id }) => {
      await queryClient.cancelQueries({ queryKey: ['classes', institution_id] });
      const previousClasses = queryClient.getQueryData<DbClass[]>(['classes', institution_id]);
      
      queryClient.setQueryData<DbClass[]>(
        ['classes', institution_id],
        (old = []) => old.filter(c => c.id !== id)
      );

      return { previousClasses };
    },
    onError: (err: Error, variables, context) => {
      console.error('[Classes] Delete mutation error:', err);
      if (context?.previousClasses) {
        queryClient.setQueryData(['classes', variables.institution_id], context.previousClasses);
      }
      toast.error(err.message || 'Failed to delete class');
    },
    onSuccess: () => {
      toast.success('Class deleted successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', variables.institution_id] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-counts', variables.institution_id] });
    },
  });

  return {
    classes,
    classesWithCounts,
    isLoading,
    isLoadingWithCounts,
    error,
    refetch,
    createClass: createClassMutation.mutateAsync,
    updateClass: updateClassMutation.mutateAsync,
    deleteClass: deleteClassMutation.mutateAsync,
    isCreating: createClassMutation.isPending,
    isUpdating: updateClassMutation.isPending,
    isDeleting: deleteClassMutation.isPending,
  };
}
