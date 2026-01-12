import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PeriodConfig, TimetableAssignment } from './useTimetable';

export function useClassTimetable(
  institutionId?: string,
  classId?: string,
  academicYear: string = '2024-25'
) {
  const { data: periods = [], isLoading: isLoadingPeriods } = useQuery({
    queryKey: ['class-timetable-periods', institutionId],
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
        start_time: p.start_time?.slice(0, 5) || '',
        end_time: p.end_time?.slice(0, 5) || '',
      })) as PeriodConfig[];
    },
    enabled: !!institutionId,
    staleTime: 30000,
  });

  const { data: assignments = [], isLoading: isLoadingAssignments, error } = useQuery({
    queryKey: ['class-timetable-assignments', institutionId, classId, academicYear],
    queryFn: async () => {
      if (!institutionId || !classId) return [];

      const { data, error } = await supabase
        .from('institution_timetable_assignments')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('class_id', classId)
        .eq('academic_year', academicYear);

      if (error) throw error;
      return (data || []) as TimetableAssignment[];
    },
    enabled: !!institutionId && !!classId,
    staleTime: 30000,
  });

  // Create a map of period_id to period info for sorting
  const periodMap = new Map(periods.map(p => [p.id, p]));

  return {
    assignments,
    periods,
    periodMap,
    isLoading: isLoadingPeriods || isLoadingAssignments,
    error,
  };
}
