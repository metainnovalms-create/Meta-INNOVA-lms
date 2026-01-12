import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { Json } from '@/integrations/supabase/types';

export interface AttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  status: 'present' | 'absent' | 'late';
  check_in_time?: string;
}

export interface ClassSessionAttendance {
  id: string;
  timetable_assignment_id: string;
  class_id: string;
  institution_id: string;
  officer_id: string | null;
  date: string;
  period_label: string | null;
  period_time: string | null;
  subject: string | null;
  total_students: number;
  students_present: number;
  students_absent: number;
  students_late: number;
  attendance_records: AttendanceRecord[];
  is_session_completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface SaveAttendanceParams {
  timetable_assignment_id: string;
  class_id: string;
  institution_id: string;
  officer_id: string;
  date: string;
  period_label?: string;
  period_time?: string;
  subject?: string;
  attendance_records: AttendanceRecord[];
  notes?: string;
}

interface MarkSessionCompletedParams {
  attendanceId: string;
  officerId: string;
}

// Fetch officer's class attendance for a specific date
export function useOfficerClassAttendance(officerId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['class-session-attendance', 'officer', officerId, date],
    queryFn: async () => {
      if (!officerId) return [];
      
      const { data, error } = await supabase
        .from('class_session_attendance')
        .select('*')
        .eq('officer_id', officerId)
        .eq('date', date);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        attendance_records: (item.attendance_records as unknown as AttendanceRecord[]) || []
      })) as ClassSessionAttendance[];
    },
    enabled: !!officerId,
  });
}

// Fetch class attendance by institution and date range
export function useInstitutionClassAttendance(
  institutionId: string | undefined, 
  startDate: string, 
  endDate: string
) {
  return useQuery({
    queryKey: ['class-session-attendance', 'institution', institutionId, startDate, endDate],
    queryFn: async () => {
      if (!institutionId) return [];
      
      const { data, error } = await supabase
        .from('class_session_attendance')
        .select(`
          *,
          classes:class_id (class_name),
          officers:officer_id (full_name)
        `)
        .eq('institution_id', institutionId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('period_time', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        attendance_records: (item.attendance_records as unknown as AttendanceRecord[]) || [],
        class_name: (item.classes as any)?.class_name,
        officer_name: (item.officers as any)?.full_name
      }));
    },
    enabled: !!institutionId,
  });
}

// Fetch all class attendance for CEO/admin view
export function useAllClassAttendance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['class-session-attendance', 'all', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_session_attendance')
        .select(`
          *,
          classes:class_id (class_name),
          officers:officer_id (full_name),
          institutions:institution_id (name)
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })
        .order('period_time', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        attendance_records: (item.attendance_records as unknown as AttendanceRecord[]) || [],
        class_name: (item.classes as any)?.class_name,
        officer_name: (item.officers as any)?.full_name,
        institution_name: (item.institutions as any)?.name
      }));
    },
  });
}

// Save or update class attendance
export function useSaveClassAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: SaveAttendanceParams) => {
      const stats = {
        total_students: params.attendance_records.length,
        students_present: params.attendance_records.filter(r => r.status === 'present').length,
        students_absent: params.attendance_records.filter(r => r.status === 'absent').length,
        students_late: params.attendance_records.filter(r => r.status === 'late').length,
      };
      
      const { data, error } = await supabase
        .from('class_session_attendance')
        .upsert({
          timetable_assignment_id: params.timetable_assignment_id,
          class_id: params.class_id,
          institution_id: params.institution_id,
          officer_id: params.officer_id,
          date: params.date,
          period_label: params.period_label,
          period_time: params.period_time,
          subject: params.subject,
          attendance_records: params.attendance_records as unknown as Json,
          notes: params.notes,
          ...stats,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'timetable_assignment_id,date',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-session-attendance'] });
    },
  });
}

// Mark session as completed
export function useMarkSessionCompleted() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attendanceId, officerId }: MarkSessionCompletedParams) => {
      const { data, error } = await supabase
        .from('class_session_attendance')
        .update({
          is_session_completed: true,
          completed_by: officerId,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', attendanceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-session-attendance'] });
    },
  });
}

// Real-time subscription for class attendance
export function useClassAttendanceRealtime(institutionId?: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!institutionId) return;
    
    const channel = supabase
      .channel('class-session-attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'class_session_attendance',
          filter: `institution_id=eq.${institutionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['class-session-attendance'] });
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [institutionId, queryClient]);
}

// Aggregate class attendance stats
export function aggregateClassAttendanceStats(attendanceRecords: ClassSessionAttendance[]) {
  const totalSessions = attendanceRecords.length;
  const completedSessions = attendanceRecords.filter(r => r.is_session_completed).length;
  const totalStudentsMarked = attendanceRecords.reduce((sum, r) => sum + r.total_students, 0);
  const totalPresent = attendanceRecords.reduce((sum, r) => sum + r.students_present + r.students_late, 0);
  
  return {
    totalSessions,
    completedSessions,
    sessionCompletionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
    averageAttendance: totalStudentsMarked > 0 ? (totalPresent / totalStudentsMarked) * 100 : 0,
    totalStudentsMarked,
    totalPresent,
  };
}
