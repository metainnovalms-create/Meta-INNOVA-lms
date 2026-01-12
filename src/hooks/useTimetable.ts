import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PeriodConfig {
  id: string;
  institution_id: string;
  label: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface TimetableAssignment {
  id: string;
  institution_id: string;
  academic_year: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period_id: string;
  class_id: string;
  class_name: string;
  subject: string;
  teacher_id?: string;
  teacher_name?: string;
  secondary_officer_id?: string;
  secondary_officer_name?: string;
  backup_officer_id?: string;
  backup_officer_name?: string;
  room?: string;
  created_at: string;
  updated_at: string;
}

export function useInstitutionPeriods(institutionId?: string) {
  const queryClient = useQueryClient();

  const { data: periods = [], isLoading, error, refetch } = useQuery({
    queryKey: ['institution-periods', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      
      const { data, error } = await supabase
        .from('institution_periods')
        .select('*')
        .eq('institution_id', institutionId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(p => ({
        ...p,
        start_time: p.start_time?.slice(0, 5) || '', // Format HH:MM
        end_time: p.end_time?.slice(0, 5) || '',
      })) as PeriodConfig[];
    },
    enabled: !!institutionId,
    staleTime: 30000,
  });

  const savePeriodsMutation = useMutation({
    mutationFn: async (newPeriods: PeriodConfig[]) => {
      if (!institutionId) throw new Error('Institution ID required');

      // Delete all existing periods for this institution
      const { error: deleteError } = await supabase
        .from('institution_periods')
        .delete()
        .eq('institution_id', institutionId);

      if (deleteError) throw deleteError;

      // Insert new periods
      if (newPeriods.length > 0) {
        const { data, error: insertError } = await supabase
          .from('institution_periods')
          .insert(newPeriods.map((p, index) => ({
            institution_id: institutionId,
            label: p.label,
            start_time: p.start_time,
            end_time: p.end_time,
            is_break: p.is_break,
            display_order: p.display_order || index + 1,
          })))
          .select();

        if (insertError) throw insertError;
        return data;
      }
      
      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-periods', institutionId] });
      toast.success('Period configuration saved');
    },
    onError: (error) => {
      toast.error(`Failed to save periods: ${error.message}`);
    },
  });

  return {
    periods,
    isLoading,
    error,
    refetch,
    savePeriods: savePeriodsMutation.mutateAsync,
    isSaving: savePeriodsMutation.isPending,
  };
}

export function useInstitutionTimetable(institutionId?: string, academicYear: string = '2024-25') {
  const queryClient = useQueryClient();

  const { data: assignments = [], isLoading, error, refetch } = useQuery({
    queryKey: ['institution-timetable', institutionId, academicYear],
    queryFn: async () => {
      if (!institutionId) return [];
      
      const { data, error } = await supabase
        .from('institution_timetable_assignments')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('academic_year', academicYear);

      if (error) throw error;
      return (data || []) as TimetableAssignment[];
    },
    enabled: !!institutionId,
    staleTime: 30000,
  });

  const saveTimetableMutation = useMutation({
    mutationFn: async (newAssignments: TimetableAssignment[]) => {
      if (!institutionId) throw new Error('Institution ID required');

      // Delete all existing assignments for this institution and academic year
      const { error: deleteError } = await supabase
        .from('institution_timetable_assignments')
        .delete()
        .eq('institution_id', institutionId)
        .eq('academic_year', academicYear);

      if (deleteError) throw deleteError;

      // Insert new assignments
      if (newAssignments.length > 0) {
        const { data, error: insertError } = await supabase
          .from('institution_timetable_assignments')
          .insert(newAssignments.map(a => ({
            institution_id: institutionId,
            academic_year: academicYear,
            day: a.day,
            period_id: a.period_id,
            class_id: a.class_id,
            class_name: a.class_name,
            subject: a.subject,
            teacher_id: a.teacher_id,
            teacher_name: a.teacher_name,
            secondary_officer_id: a.secondary_officer_id,
            secondary_officer_name: a.secondary_officer_name,
            backup_officer_id: a.backup_officer_id,
            backup_officer_name: a.backup_officer_name,
            room: a.room,
          })))
          .select();

        if (insertError) throw insertError;
        return data;
      }
      
      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-timetable', institutionId, academicYear] });
      toast.success('Timetable saved successfully');
    },
    onError: (error) => {
      toast.error(`Failed to save timetable: ${error.message}`);
    },
  });

  return {
    assignments,
    isLoading,
    error,
    refetch,
    saveTimetable: saveTimetableMutation.mutateAsync,
    isSaving: saveTimetableMutation.isPending,
  };
}

// Helper hook for generating student IDs
export function useIdCounter(institutionId?: string) {
  const getNextId = async (entityType: 'student' | 'employee' | 'class'): Promise<number> => {
    if (!institutionId) throw new Error('Institution ID required');

    const { data, error } = await supabase.rpc('get_next_id', {
      p_institution_id: institutionId,
      p_entity_type: entityType,
    });

    if (error) throw error;
    return data as number;
  };

  const reserveIdRange = async (entityType: 'student' | 'employee' | 'class', count: number): Promise<{ start: number; end: number }> => {
    if (!institutionId) throw new Error('Institution ID required');

    const { data, error } = await supabase.rpc('reserve_id_range', {
      p_institution_id: institutionId,
      p_entity_type: entityType,
      p_count: count,
    });

    if (error) throw error;
    const result = data?.[0];
    return { start: result?.start_counter || 1, end: result?.end_counter || count };
  };

  return { getNextId, reserveIdRange };
}
