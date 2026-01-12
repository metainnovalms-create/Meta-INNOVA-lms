import { OfficerTimetableSlot } from '@/types/officer';
import { AffectedSlot } from '@/types/attendance';
import { mockOfficerProfiles } from '@/data/mockOfficerData';
import { mockOfficerTimetables } from '@/data/mockOfficerTimetable';
import { format, addDays } from 'date-fns';

export interface AvailableSubstitute {
  officer_id: string;
  officer_name: string;
  skills: string[];
  matching_skills: string[];
  is_fully_qualified: boolean;
}

/**
 * Check which officers are available to substitute for a given slot
 */
export const getAvailableSubstitutes = (
  day: string,
  startTime: string,
  endTime: string,
  subject: string,
  excludeOfficerId: string
): AvailableSubstitute[] => {
  // Step 1: Get all officers
  const allOfficers = mockOfficerProfiles;
  
  // Step 2: Filter out officers who have conflicting slots
  const availableOfficers = allOfficers.filter(officer => {
    if (officer.id === excludeOfficerId) return false;
    
    const timetable = mockOfficerTimetables.find(t => t.officer_id === officer.id);
    if (!timetable) return true;
    
    // Check if officer has conflicting slot on same day/time
    const hasConflict = timetable.slots.some(slot => 
      slot.day === day &&
      slot.status !== 'on_leave' &&
      timeOverlaps(slot.start_time, slot.end_time, startTime, endTime)
    );
    
    return !hasConflict;
  });
  
  // Step 3: Match skills with subject
  const substitutesWithSkills = availableOfficers.map(officer => {
    const matchingSkills = matchSubjectToSkills(subject, officer.skills || []);
    
    return {
      officer_id: officer.id,
      officer_name: officer.name,
      skills: officer.skills || [],
      matching_skills: matchingSkills,
      is_fully_qualified: matchingSkills.length > 0
    };
  });
  
  // Step 4: Sort by qualification (fully qualified first)
  return substitutesWithSkills.sort((a, b) => {
    if (a.is_fully_qualified && !b.is_fully_qualified) return -1;
    if (!a.is_fully_qualified && b.is_fully_qualified) return 1;
    return b.matching_skills.length - a.matching_skills.length;
  });
};

/**
 * Check if two time ranges overlap
 */
const timeOverlaps = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  return s1 < e2 && s2 < e1;
};

/**
 * Convert time string to minutes (e.g., "09:30" -> 570)
 */
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Match subject keywords to officer skills
 */
const matchSubjectToSkills = (subject: string, skills: string[]): string[] => {
  const subjectLower = subject.toLowerCase();
  
  return skills.filter(skill => {
    const skillLower = skill.toLowerCase();
    
    // Check if skill keyword appears in subject
    return subjectLower.includes(skillLower) || 
           skillLower.includes(subjectLower.split(' ')[0]) ||
           (skillLower.includes('stem') && subjectLower.includes('stem'));
  });
};

/**
 * Get affected timetable slots during a date range
 */
export const getAffectedSlots = (
  officerId: string,
  startDate: Date,
  endDate: Date
): AffectedSlot[] => {
  const timetable = mockOfficerTimetables.find(t => t.officer_id === officerId);
  if (!timetable) return [];
  
  const affectedSlots: AffectedSlot[] = [];
  
  // Generate all dates in range
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayName = format(currentDate, 'EEEE') as any;
    
    // Find slots for this day
    const daySlots = timetable.slots.filter(slot => slot.day === dayName);
    
    daySlots.forEach(slot => {
      affectedSlots.push({
        slot_id: slot.id,
        day: dayName,
        start_time: slot.start_time,
        end_time: slot.end_time,
        class: slot.class,
        subject: slot.subject,
        room: slot.room,
        date: format(currentDate, 'yyyy-MM-dd')
      });
    });
    
    currentDate = addDays(currentDate, 1);
  }
  
  return affectedSlots;
};

/**
 * Calculate hours for a time slot
 */
export const calculateSlotHours = (startTime: string, endTime: string): number => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return (end - start) / 60;
};
