import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TimetableSlot {
  id: string;
  day: string;
  subject: string;
  room: string | null;
  class_name: string;
  start_time: string;
  end_time: string;
  type: string;
}

/**
 * Hook to fetch officer's real timetable from institution_timetable_assignments
 */
export function useOfficerSchedule(officerId: string | undefined, institutionId: string | undefined) {
  return useQuery({
    queryKey: ['officer-schedule', officerId, institutionId],
    queryFn: async (): Promise<TimetableSlot[]> => {
      if (!officerId || !institutionId) return [];

      const { data, error } = await supabase
        .from('institution_timetable_assignments')
        .select(`
          id,
          day,
          subject,
          room,
          class_name,
          institution_periods!inner (
            start_time,
            end_time,
            label
          )
        `)
        .eq('institution_id', institutionId)
        .eq('teacher_id', officerId);

      if (error) {
        console.error('Error fetching officer schedule:', error);
        return [];
      }

      // Transform to TimetableSlot format
      return (data || []).map(item => ({
        id: item.id,
        day: item.day,
        subject: item.subject,
        room: item.room,
        class_name: item.class_name,
        start_time: (item.institution_periods as any)?.start_time || '',
        end_time: (item.institution_periods as any)?.end_time || '',
        type: item.subject?.toLowerCase().includes('lab') ? 'lab' 
            : item.subject?.toLowerCase().includes('workshop') ? 'workshop'
            : item.subject?.toLowerCase().includes('mentor') ? 'mentoring'
            : 'lecture',
      }));
    },
    enabled: !!officerId && !!institutionId,
  });
}

/**
 * Get today's slots from the schedule
 */
export function getTodayScheduleFromSlots(slots: TimetableSlot[]) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return slots
    .filter(slot => slot.day === today)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * Get upcoming slots (not today, future days)
 */
export function getUpcomingSlotsFromSchedule(slots: TimetableSlot[], count: number) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = new Date().toTimeString().slice(0, 5);
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayIndex = daysOrder.indexOf(today);

  const futureSlots = slots
    .filter(slot => {
      const slotDayIndex = daysOrder.indexOf(slot.day);
      if (slotDayIndex === todayIndex) {
        return slot.start_time > currentTime;
      }
      return slotDayIndex > todayIndex;
    })
    .sort((a, b) => {
      const dayCompare = daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
      if (dayCompare !== 0) return dayCompare;
      return a.start_time.localeCompare(b.start_time);
    });

  return futureSlots.slice(0, count);
}
