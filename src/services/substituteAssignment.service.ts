import { supabase } from '@/integrations/supabase/client';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

export interface AffectedTimetableSlot {
  id: string;
  day: string;
  date: string;
  period_id: string;
  period_label: string;
  period_time: string;
  class_id: string;
  class_name: string;
  subject: string;
  room: string | null;
  start_time: string;
  end_time: string;
}

export interface AvailableSubstitute {
  officer_id: string;
  officer_name: string;
  user_id: string | null;
  skills: string[];
  is_available: boolean;
}

export interface SubstituteAssignmentData {
  slot_id: string;
  date: string;
  class_id: string;
  class_name: string;
  period_id: string;
  period_label: string;
  period_time: string;
  subject: string;
  original_officer_id: string;
  original_officer_name: string;
  substitute_officer_id: string;
  substitute_officer_name: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Normalize day names for comparison
const normalizeDay = (day: string): string => {
  const d = day.toLowerCase().trim();
  // Handle abbreviations
  if (d === 'mon' || d === 'monday') return 'monday';
  if (d === 'tue' || d === 'tues' || d === 'tuesday') return 'tuesday';
  if (d === 'wed' || d === 'wednesday') return 'wednesday';
  if (d === 'thu' || d === 'thur' || d === 'thurs' || d === 'thursday') return 'thursday';
  if (d === 'fri' || d === 'friday') return 'friday';
  if (d === 'sat' || d === 'saturday') return 'saturday';
  if (d === 'sun' || d === 'sunday') return 'sunday';
  return d;
};

export const substituteAssignmentService = {
  // Get affected timetable slots for an officer during a date range
  getAffectedSlots: async (
    officerId: string,
    institutionId: string,
    startDate: string,
    endDate: string
  ): Promise<AffectedTimetableSlot[]> => {
    // Get all dates in range
    const dates = eachDayOfInterval({
      start: parseISO(startDate),
      end: parseISO(endDate)
    });

    // Query 1: Get timetable assignments where officer is assigned (primary, secondary, or backup)
    // Do NOT join with institution_periods to avoid FK-related failures
    const { data: assignments, error: assignmentError } = await supabase
      .from('institution_timetable_assignments')
      .select(`
        id,
        day,
        class_id,
        class_name,
        subject,
        room,
        period_id,
        teacher_id,
        secondary_officer_id,
        backup_officer_id
      `)
      .eq('institution_id', institutionId);

    if (assignmentError) {
      console.error('Error fetching timetable assignments:', assignmentError);
      return [];
    }

    if (!assignments || assignments.length === 0) {
      console.log('No timetable assignments found for institution:', institutionId);
      return [];
    }

    // Filter assignments where the officer is assigned as primary, secondary, or backup
    const officerAssignments = assignments.filter(a => 
      a.teacher_id === officerId || 
      a.secondary_officer_id === officerId || 
      a.backup_officer_id === officerId
    );

    if (officerAssignments.length === 0) {
      console.log('No timetable slots found for officer:', officerId);
      return [];
    }

    // Query 2: Get all periods for this institution (separate query to avoid FK join issues)
    const periodIds = [...new Set(officerAssignments.map(a => a.period_id))];
    
    const { data: periods, error: periodError } = await supabase
      .from('institution_periods')
      .select('id, label, start_time, end_time')
      .eq('institution_id', institutionId)
      .in('id', periodIds);

    if (periodError) {
      console.error('Error fetching periods:', periodError);
    }

    // Build period lookup map
    const periodMap = new Map<string, { label: string; start_time: string; end_time: string }>();
    if (periods) {
      for (const p of periods) {
        periodMap.set(p.id, { label: p.label, start_time: p.start_time, end_time: p.end_time });
      }
    }

    const affectedSlots: AffectedTimetableSlot[] = [];

    for (const date of dates) {
      const dayName = DAY_NAMES[date.getDay()];
      const normalizedDayName = normalizeDay(dayName);
      const dateStr = format(date, 'yyyy-MM-dd');

      // Find assignments for this day (normalized comparison)
      const dayAssignments = officerAssignments.filter(a => 
        normalizeDay(a.day) === normalizedDayName
      );

      for (const assignment of dayAssignments) {
        const period = periodMap.get(assignment.period_id);
        affectedSlots.push({
          id: assignment.id,
          day: dayName,
          date: dateStr,
          period_id: assignment.period_id,
          period_label: period?.label || 'Period',
          period_time: period ? `${period.start_time || ''} - ${period.end_time || ''}` : '',
          class_id: assignment.class_id,
          class_name: assignment.class_name,
          subject: assignment.subject,
          room: assignment.room,
          start_time: period?.start_time || '',
          end_time: period?.end_time || ''
        });
      }
    }

    console.log(`Found ${affectedSlots.length} affected slots for officer ${officerId}`);

    return affectedSlots.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.start_time.localeCompare(b.start_time);
    });
  },

  // Get available substitutes for a specific slot
  getAvailableSubstitutes: async (
    institutionId: string,
    day: string,
    periodId: string,
    excludeOfficerId: string
  ): Promise<AvailableSubstitute[]> => {
    const allSubstitutes: AvailableSubstitute[] = [];
    const seenOfficerIds = new Set<string>();

    // 1. Get institution name for display
    const { data: institution } = await supabase
      .from('institutions')
      .select('name')
      .eq('id', institutionId)
      .single();

    const institutionName = institution?.name || '';

    // 2. Get ALL officers assigned to this institution (excluding the applying officer)
    const { data: officers, error: officerError } = await supabase
      .from('officers')
      .select('id, full_name, user_id, skills')
      .contains('assigned_institutions', [institutionId])
      .eq('status', 'active')
      .neq('id', excludeOfficerId);

    if (!officerError && officers) {
      for (const officer of officers) {
        if (!seenOfficerIds.has(officer.id)) {
          seenOfficerIds.add(officer.id);
          allSubstitutes.push({
            officer_id: officer.id,
            officer_name: institutionName 
              ? `${officer.full_name} (${institutionName})`
              : officer.full_name,
            user_id: officer.user_id,
            skills: (officer.skills as string[]) || [],
            is_available: true
          });
        }
      }
    }

    // 3. Check availability based on timetable conflicts (mark busy but still show)
    const normalizedDay = normalizeDay(day);

    const { data: conflictingAssignments } = await supabase
      .from('institution_timetable_assignments')
      .select('teacher_id, secondary_officer_id, backup_officer_id, day')
      .eq('institution_id', institutionId)
      .eq('period_id', periodId);

    const busyOfficerIds = new Set<string>();
    
    if (conflictingAssignments) {
      for (const a of conflictingAssignments) {
        if (normalizeDay(a.day) !== normalizedDay) continue;
        if (a.teacher_id) busyOfficerIds.add(a.teacher_id);
        if (a.secondary_officer_id) busyOfficerIds.add(a.secondary_officer_id);
        if (a.backup_officer_id) busyOfficerIds.add(a.backup_officer_id);
      }
    }

    // Update availability and mark busy officers with indicator
    return allSubstitutes.map(sub => ({
      ...sub,
      is_available: !busyOfficerIds.has(sub.officer_id),
      officer_name: busyOfficerIds.has(sub.officer_id) 
        ? `${sub.officer_name} (Has class)`
        : sub.officer_name
    }));
  },

  // Get all officers from an institution (for substitute selection)
  getAllInstitutionOfficers: async (
    institutionId: string,
    excludeOfficerId: string
  ): Promise<AvailableSubstitute[]> => {
    const { data: officers, error } = await supabase
      .from('officers')
      .select('id, full_name, user_id, skills')
      .contains('assigned_institutions', [institutionId])
      .eq('status', 'active')
      .neq('id', excludeOfficerId);

    if (error || !officers) return [];

    return officers.map(officer => ({
      officer_id: officer.id,
      officer_name: officer.full_name,
      user_id: officer.user_id,
      skills: (officer.skills as string[]) || [],
      is_available: true
    }));
  }
};
