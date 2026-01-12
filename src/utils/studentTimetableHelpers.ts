import { getOfficerTimetable } from '@/data/mockOfficerTimetable';
import { loadOfficers } from '@/data/mockOfficerData';
import type { OfficerTimetableSlot } from '@/types/officer';

interface StudentTimetableEvent {
  id: string;
  title: string;
  teacher: string;
  teacherId: string;
  room: string;
  day: number; // 0 = Monday, 1 = Tuesday, etc.
  time: string;
  type: 'workshop' | 'lab' | 'mentoring' | 'project_review';
  class: string;
  subject: string;
}

const dayNameToIndex: Record<string, number> = {
  'Monday': 0,
  'Tuesday': 1,
  'Wednesday': 2,
  'Thursday': 3,
  'Friday': 4,
  'Saturday': 5,
};

/**
 * Get student timetable from officer schedules
 * Filters officer timetables by student's institution and class
 */
export const getStudentTimetable = (
  institutionId: string,
  studentClass: string
): StudentTimetableEvent[] => {
  const officers = loadOfficers();
  const events: StudentTimetableEvent[] = [];

  // Filter officers assigned to this institution
  const institutionOfficers = officers.filter(officer =>
    officer.assigned_institutions.includes(institutionId)
  );

  // Get timetable slots from each officer
  institutionOfficers.forEach(officer => {
    const timetable = getOfficerTimetable(officer.id);
    if (!timetable) return;

    // Filter slots for this student's class
    const classSlots = timetable.slots.filter(slot =>
      slot.class === studentClass && slot.status === 'active'
    );

    // Convert slots to student events
    classSlots.forEach(slot => {
      events.push({
        id: slot.id,
        title: slot.subject,
        teacher: officer.name,
        teacherId: officer.id,
        room: slot.room,
        day: dayNameToIndex[slot.day],
        time: `${slot.start_time} - ${slot.end_time}`,
        type: slot.type,
        class: slot.class,
        subject: slot.subject,
      });
    });
  });

  return events;
};

/**
 * Get type color for timetable event badges
 */
export const getTypeColor = (type: string) => {
  switch (type) {
    case 'workshop': return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20';
    case 'lab': return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    case 'mentoring': return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20';
    case 'project_review': return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    default: return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20';
  }
};
