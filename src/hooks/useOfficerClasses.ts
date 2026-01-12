import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface OfficerClass {
  class_id: string;
  class_name: string;
  day: string;
  subject: string;
  room: string | null;
  period_id: string;
}

interface ClassWithDetails {
  id: string;
  class_name: string;
  room_number: string | null;
  student_count: number;
  subjects: string[];
  days: string[];
}

export function useOfficerClasses(officerId?: string, institutionId?: string) {
  const todayDay = format(new Date(), 'EEEE'); // Monday, Tuesday, etc.

  const { data: timetableAssignments, isLoading: isLoadingTimetable } = useQuery({
    queryKey: ['officer-timetable-assignments', officerId, institutionId],
    queryFn: async () => {
      if (!officerId || !institutionId) return [];
      
      const { data, error } = await supabase
        .from('institution_timetable_assignments')
        .select('class_id, class_name, day, subject, room, period_id')
        .eq('teacher_id', officerId)
        .eq('institution_id', institutionId);
      
      if (error) throw error;
      return data as OfficerClass[];
    },
    enabled: !!officerId && !!institutionId,
  });

  const { data: studentCounts, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['officer-class-student-counts', timetableAssignments?.map(t => t.class_id)],
    queryFn: async () => {
      if (!timetableAssignments || timetableAssignments.length === 0) return {};
      
      const uniqueClassIds = [...new Set(timetableAssignments.map(t => t.class_id))];
      
      const { data, error } = await supabase
        .from('students')
        .select('class_id')
        .in('class_id', uniqueClassIds);
      
      if (error) throw error;
      
      // Count students per class
      const counts: Record<string, number> = {};
      data?.forEach(s => {
        counts[s.class_id] = (counts[s.class_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: !!timetableAssignments && timetableAssignments.length > 0,
  });

  // Process timetable assignments into unique classes with details
  const classes: ClassWithDetails[] = (() => {
    if (!timetableAssignments) return [];
    
    const classMap = new Map<string, ClassWithDetails>();
    
    timetableAssignments.forEach(assignment => {
      const existing = classMap.get(assignment.class_id);
      
      if (existing) {
        if (!existing.subjects.includes(assignment.subject)) {
          existing.subjects.push(assignment.subject);
        }
        if (!existing.days.includes(assignment.day)) {
          existing.days.push(assignment.day);
        }
      } else {
        classMap.set(assignment.class_id, {
          id: assignment.class_id,
          class_name: assignment.class_name,
          room_number: assignment.room,
          student_count: studentCounts?.[assignment.class_id] || 0,
          subjects: [assignment.subject],
          days: [assignment.day],
        });
      }
    });
    
    return Array.from(classMap.values());
  })();

  // Filter classes for today
  const todayClasses = classes.filter(c => c.days.includes(todayDay));

  return {
    classes,
    todayClasses,
    todayDay,
    isLoading: isLoadingTimetable || isLoadingStudents,
    hasClasses: classes.length > 0,
    hasTodayClasses: todayClasses.length > 0,
  };
}
