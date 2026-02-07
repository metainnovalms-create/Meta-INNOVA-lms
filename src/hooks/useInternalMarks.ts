import { useQuery,useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InternalMark {
  id: string;
  class_id: string;
  institution_id: string;
  student_id: string;
  marks_obtained: number;
  total_marks: number;
  academic_year: string;
  entered_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalMarkWithStudent extends InternalMark {
  student?: {
    id: string;
    student_name: string;
    email: string;
  };
}

export function useInternalMarks(classId: string | undefined, academicYear: string = '2024-25') {
  const queryClient = useQueryClient();

  const { data: marks, isLoading, error } = useQuery({
    queryKey: ['internal-marks', classId, academicYear],
    queryFn: async (): Promise<InternalMarkWithStudent[]> => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from('internal_assessment_marks')
        .select('*')
        .eq('class_id', classId)
        .eq('academic_year', academicYear);

      if (error) {
        console.error('Error fetching internal marks:', error);
        return [];
      }

      return data || [];
    },
    enabled: !!classId,
  });

  const saveMarkMutation = useMutation({
    mutationFn: async (data: {
      class_id: string;
      institution_id: string;
      student_id: string;
      marks_obtained: number;
      total_marks?: number;
      academic_year?: string;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { data: result, error } = await supabase
        .from('internal_assessment_marks')
        .upsert({
          class_id: data.class_id,
          institution_id: data.institution_id,
          student_id: data.student_id,
          marks_obtained: data.marks_obtained,
          total_marks: data.total_marks || 100,
          academic_year: data.academic_year || '2024-25',
          notes: data.notes || null,
          entered_by: user?.user?.id,
        }, {
          onConflict: 'class_id,student_id,academic_year',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-marks'] });
    },
    onError: (error) => {
      console.error('Error saving internal mark:', error);
      toast.error('Failed to save internal mark');
    },
  });

  const saveBulkMarksMutation = useMutation({
    mutationFn: async (data: Array<{
      class_id: string;
      institution_id: string;
      student_id: string;
      marks_obtained: number;
      total_marks?: number;
      academic_year?: string;
      notes?: string;
    }>) => {
      const { data: user } = await supabase.auth.getUser();

      const records = data.map(d => ({
        class_id: d.class_id,
        institution_id: d.institution_id,
        student_id: d.student_id,
        marks_obtained: d.marks_obtained,
        total_marks: d.total_marks || 100,
        academic_year: d.academic_year || '2024-25',
        notes: d.notes || null,
        entered_by: user?.user?.id,
      }));

      const { data: result, error } = await supabase
        .from('internal_assessment_marks')
        .upsert(records, {
          onConflict: 'class_id,student_id,academic_year',
        })
        .select();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-marks'] });
      toast.success('Internal marks saved successfully');
    },
    onError: (error) => {
      console.error('Error saving internal marks:', error);
      toast.error('Failed to save internal marks');
    },
  });

  return {
    marks,
    isLoading,
    error,
    saveMark: saveMarkMutation.mutate,
    saveBulkMarks: saveBulkMarksMutation.mutate,
    isSaving: saveMarkMutation.isPending || saveBulkMarksMutation.isPending,
  };
}

export function useStudentInternalMark(studentId: string | undefined, classId: string | undefined, academicYear: string = '2024-25') {
  return useQuery({
    queryKey: ['student-internal-mark', studentId, classId, academicYear],
    queryFn: async (): Promise<InternalMark | null> => {
      if (!studentId || !classId) return null;

      const { data, error } = await supabase
        .from('internal_assessment_marks')
        .select('*')
        .eq('student_id', studentId)
        .eq('class_id', classId)
        .eq('academic_year', academicYear)
        .maybeSingle();

      if (error) {
        console.error('Error fetching student internal mark:', error);
        return null;
      }

      return data;
    },
    enabled: !!studentId && !!classId,
  });
}
