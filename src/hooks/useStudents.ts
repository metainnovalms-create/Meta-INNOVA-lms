import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StudentFormData {
  student_name: string;
  email?: string;
  password?: string;
  student_id: string;
  roll_number?: string;
  admission_number?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  admission_date?: string;
  previous_school?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
  avatar?: string;
  status?: string;
}

export interface DbStudent {
  id: string;
  user_id: string | null;
  institution_id: string;
  class_id: string | null;
  student_id: string;
  roll_number: string | null;
  admission_number: string | null;
  student_name: string;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  admission_date: string | null;
  previous_school: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  address: string | null;
  avatar: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Helper to verify authentication
async function verifyAuth(): Promise<{ userId: string; isValid: boolean; error?: string }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.user) {
    console.error('[Students] No active session:', sessionError);
    return { userId: '', isValid: false, error: 'You must be logged in to perform this action' };
  }

  return { userId: session.user.id, isValid: true };
}

export function useStudents(institutionId?: string, classId?: string) {
  const queryClient = useQueryClient();

  // Fetch students for an institution (optionally filtered by class)
  const {
    data: students = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['students', institutionId, classId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      console.log('[Students] Fetching students for institution:', institutionId, classId ? `class: ${classId}` : '');
      
      let query = supabase
        .from('students')
        .select('*')
        .eq('institution_id', institutionId)
        .order('student_name', { ascending: true });

      if (classId) {
        query = query.eq('class_id', classId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Students] Fetch error:', error);
        throw error;
      }
      
      console.log('[Students] Fetched:', data?.length || 0, 'students');
      return data as DbStudent[];
    },
    enabled: !!institutionId,
    staleTime: 30000,
  });

  // Create student mutation with auth user creation via edge function
  const createStudentMutation = useMutation({
    mutationFn: async (formData: StudentFormData & { 
      institution_id: string; 
      class_id: string;
    }) => {
      console.log('[Students] Creating student:', formData.student_name);
      
      // Verify authentication
      const authCheck = await verifyAuth();
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      let userId: string | null = null;

      // If email and password provided, create auth user via edge function
      if (formData.email && formData.password) {
        const { data: { session } } = await supabase.auth.getSession();
        
        const response = await supabase.functions.invoke('create-student-user', {
          body: {
            email: formData.email,
            password: formData.password,
            student_name: formData.student_name,
            institution_id: formData.institution_id,
            class_id: formData.class_id,
          },
        });

        if (response.error) {
          console.error('[Students] Edge function error:', response.error);
          throw new Error(response.error.message || 'Failed to create student user account');
        }

      if (response.data?.error) {
        console.error('[Students] Create user error:', response.data.error);
        const errorMsg = response.data?.code === 'USER_EXISTS' 
          ? 'This email is already registered. Please use a different email address.'
          : response.data.error;
        throw new Error(errorMsg);
      }

        userId = response.data?.user_id || null;
        console.log('[Students] Created auth user:', userId);
      }

      // Create student record with user_id linked
      const { data, error } = await supabase
        .from('students')
        .insert({
          institution_id: formData.institution_id,
          class_id: formData.class_id,
          student_id: formData.student_id,
          student_name: formData.student_name,
          email: formData.email,
          user_id: userId,
          roll_number: formData.roll_number,
          admission_number: formData.admission_number,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender || 'male',
          blood_group: formData.blood_group,
          admission_date: formData.admission_date,
          previous_school: formData.previous_school,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          address: formData.address,
          avatar: null, // Use null for placeholder - students can update later
          status: formData.status || 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('[Students] Create error:', error);
        throw new Error(`Failed to create student: ${error.message}`);
      }
      
      console.log('[Students] Created successfully:', data.id);
      return data;
    },
    onMutate: async (newStudent) => {
      await queryClient.cancelQueries({ queryKey: ['students', newStudent.institution_id, newStudent.class_id] });
      const previousStudents = queryClient.getQueryData<DbStudent[]>(['students', newStudent.institution_id, newStudent.class_id]);
      
      const optimisticStudent: DbStudent = {
        id: `temp-${Date.now()}`,
        user_id: null,
        institution_id: newStudent.institution_id,
        class_id: newStudent.class_id,
        student_id: newStudent.student_id,
        student_name: newStudent.student_name,
        email: newStudent.email || null,
        roll_number: newStudent.roll_number || null,
        admission_number: newStudent.admission_number || null,
        date_of_birth: newStudent.date_of_birth || null,
        gender: newStudent.gender || 'male',
        blood_group: newStudent.blood_group || null,
        admission_date: newStudent.admission_date || null,
        previous_school: newStudent.previous_school || null,
        parent_name: newStudent.parent_name || null,
        parent_phone: newStudent.parent_phone || null,
        parent_email: newStudent.parent_email || null,
        address: newStudent.address || null,
        avatar: newStudent.avatar || null,
        status: newStudent.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<DbStudent[]>(
        ['students', newStudent.institution_id, newStudent.class_id],
        (old = []) => [...old, optimisticStudent]
      );

      return { previousStudents };
    },
    onError: (err: Error, newStudent, context) => {
      console.error('[Students] Create mutation error:', err);
      if (context?.previousStudents) {
        queryClient.setQueryData(['students', newStudent.institution_id, newStudent.class_id], context.previousStudents);
      }
      toast.error(err.message || 'Failed to create student');
    },
    onSuccess: (data) => {
      toast.success(`Student "${data.student_name}" added successfully`);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students', variables.institution_id] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-counts', variables.institution_id] });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, ...formData }: StudentFormData & { id: string; institution_id: string; class_id: string }) => {
      console.log('[Students] Updating student:', id);
      
      // Verify authentication
      const authCheck = await verifyAuth();
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      const { data, error } = await supabase
        .from('students')
        .update({
          student_name: formData.student_name,
          email: formData.email,
          roll_number: formData.roll_number,
          admission_number: formData.admission_number,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          blood_group: formData.blood_group,
          admission_date: formData.admission_date,
          previous_school: formData.previous_school,
          parent_name: formData.parent_name,
          parent_phone: formData.parent_phone,
          parent_email: formData.parent_email,
          address: formData.address,
          avatar: formData.avatar,
          status: formData.status,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Students] Update error:', error);
        throw new Error(`Failed to update student: ${error.message}`);
      }
      
      console.log('[Students] Updated successfully:', data.id);
      return data;
    },
    onError: (err: Error) => {
      console.error('[Students] Update mutation error:', err);
      toast.error(err.message || 'Failed to update student');
    },
    onSuccess: (data) => {
      toast.success(`Student "${data.student_name}" updated successfully`);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students', variables.institution_id] });
    },
  });

  // Delete student mutation - uses edge function for proper cascade deletion
  const deleteStudentMutation = useMutation({
    mutationFn: async ({ id, institution_id, class_id }: { id: string; institution_id: string; class_id?: string }) => {
      console.log('[Students] Deleting student via edge function:', id);
      
      // Verify authentication
      const authCheck = await verifyAuth();
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      // Call edge function for proper cascade deletion (includes auth user, profiles, user_roles)
      const { data, error } = await supabase.functions.invoke('delete-student-user', {
        body: { student_id: id },
      });

      if (error) {
        console.error('[Students] Edge function error:', error);
        throw new Error(error.message || 'Failed to delete student');
      }

      if (data?.error) {
        console.error('[Students] Delete error:', data.error);
        throw new Error(data.error);
      }
      
      console.log('[Students] Deleted successfully:', data);
      return id;
    },
    onMutate: async ({ id, institution_id, class_id }) => {
      await queryClient.cancelQueries({ queryKey: ['students', institution_id, class_id] });
      const previousStudents = queryClient.getQueryData<DbStudent[]>(['students', institution_id, class_id]);
      
      queryClient.setQueryData<DbStudent[]>(
        ['students', institution_id, class_id],
        (old = []) => old.filter(s => s.id !== id)
      );

      return { previousStudents };
    },
    onError: (err: Error, variables, context) => {
      console.error('[Students] Delete mutation error:', err);
      if (context?.previousStudents) {
        queryClient.setQueryData(['students', variables.institution_id, variables.class_id], context.previousStudents);
      }
      toast.error(err.message || 'Failed to delete student');
    },
    onSuccess: () => {
      toast.success('Student deleted successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students', variables.institution_id] });
      queryClient.invalidateQueries({ queryKey: ['classes-with-counts', variables.institution_id] });
    },
  });

  // Bulk create students with auth user creation
  const bulkCreateStudentsMutation = useMutation({
    mutationFn: async (students: Array<StudentFormData & { institution_id: string; class_id: string }>) => {
      console.log('[Students] Bulk creating:', students.length, 'students');
      
      // Verify authentication
      const authCheck = await verifyAuth();
      if (!authCheck.isValid) {
        throw new Error(authCheck.error);
      }

      const createdStudents: any[] = [];
      const errors: string[] = [];

      // Process each student - create auth user if email/password provided
      for (const student of students) {
        try {
          let userId: string | null = null;

          // Create auth user via edge function if credentials provided
          if (student.email && student.password) {
            console.log('[Students] Creating auth user for:', student.email);
            const response = await supabase.functions.invoke('create-student-user', {
              body: {
                email: student.email,
                password: student.password,
                student_name: student.student_name,
                institution_id: student.institution_id,
                class_id: student.class_id,
              },
            });

            if (response.error) {
              console.error('[Students] Edge function error for', student.email, ':', response.error);
              errors.push(`${student.student_name}: ${response.error.message}`);
              continue;
            }

            if (response.data?.error) {
              console.error('[Students] Create user error for', student.email, ':', response.data.error);
              errors.push(`${student.student_name}: ${response.data.error}`);
              continue;
            }

            userId = response.data?.user_id || null;
            console.log('[Students] Created auth user:', userId);
          }

          // Create student record
          const { data, error } = await supabase
            .from('students')
            .insert({
              institution_id: student.institution_id,
              class_id: student.class_id,
              student_id: student.student_id,
              student_name: student.student_name,
              email: student.email,
              user_id: userId,
              roll_number: student.roll_number,
              admission_number: student.admission_number,
              date_of_birth: student.date_of_birth,
              gender: student.gender || 'male',
              blood_group: student.blood_group,
              admission_date: student.admission_date,
              previous_school: student.previous_school,
              parent_name: student.parent_name,
              parent_phone: student.parent_phone,
              parent_email: student.parent_email,
              address: student.address,
              avatar: null, // Neutral placeholder
              status: student.status || 'active',
            })
            .select()
            .single();

          if (error) {
            console.error('[Students] Insert error for', student.student_name, ':', error);
            errors.push(`${student.student_name}: ${error.message}`);
          } else {
            createdStudents.push(data);
          }
        } catch (err: any) {
          console.error('[Students] Error creating student:', student.student_name, err);
          errors.push(`${student.student_name}: ${err.message}`);
        }
      }

      if (errors.length > 0 && createdStudents.length === 0) {
        throw new Error(`Failed to import students: ${errors.join(', ')}`);
      }

      console.log('[Students] Bulk created successfully:', createdStudents.length, 'students');
      if (errors.length > 0) {
        console.warn('[Students] Some students failed:', errors);
      }
      
      return { created: createdStudents, errors };
    },
    onError: (err: Error) => {
      console.error('[Students] Bulk create mutation error:', err);
      toast.error(err.message || 'Failed to import students');
    },
    onSuccess: (result) => {
      toast.success(`${result.created?.length || 0} students imported successfully`);
      if (result.errors?.length > 0) {
        toast.warning(`${result.errors.length} students failed to import`);
      }
    },
    onSettled: (_, __, variables) => {
      if (variables.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['students', variables[0].institution_id] });
        queryClient.invalidateQueries({ queryKey: ['classes-with-counts', variables[0].institution_id] });
      }
    },
  });

  // Get student count for institution
  const getStudentCount = async (instId: string): Promise<number> => {
    console.log('[Students] Getting count for institution:', instId);
    
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('institution_id', instId);

    if (error) {
      console.error('[Students] Count error:', error);
      throw error;
    }
    
    console.log('[Students] Count:', count);
    return count || 0;
  };

  return {
    students,
    isLoading,
    error,
    refetch,
    createStudent: createStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    deleteStudent: deleteStudentMutation.mutateAsync,
    bulkCreateStudents: bulkCreateStudentsMutation.mutateAsync,
    getStudentCount,
    isCreating: createStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeleting: deleteStudentMutation.isPending,
    isBulkCreating: bulkCreateStudentsMutation.isPending,
  };
}
