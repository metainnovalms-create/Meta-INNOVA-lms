import { InstitutionTimetableAssignment, PeriodConfig } from '@/types/institution';
import { OfficerTimetable, OfficerTimetableSlot } from '@/types/officer';
import { getInstitutionOfficers } from '@/data/mockInstitutionOfficers';
import { saveOfficerTimetable, loadOfficerTimetables, saveOfficerTimetables } from '@/data/mockOfficerTimetable';

/**
 * Converts institution timetable assignments to officer timetable slots
 */
function convertInstitutionToOfficerSlots(
  institutionAssignments: InstitutionTimetableAssignment[],
  periods: PeriodConfig[],
  officerId: string
): OfficerTimetableSlot[] {
  const slots: OfficerTimetableSlot[] = [];
  
  institutionAssignments.forEach((assignment, index) => {
    const period = periods.find(p => p.id === assignment.period_id);
    if (!period || period.is_break) return;
    
    const slot: OfficerTimetableSlot = {
      id: `synced-${assignment.id}`,
      officer_id: officerId,
      day: assignment.day as OfficerTimetableSlot['day'],
      start_time: period.start_time,
      end_time: period.end_time,
      class: assignment.class_name,
      subject: assignment.subject,
      room: assignment.room || 'TBD',
      type: determineActivityType(assignment.subject),
    };
    
    slots.push(slot);
  });
  
  return slots;
}

/**
 * Determines activity type based on subject name
 */
function determineActivityType(subject: string): OfficerTimetableSlot['type'] {
  const subjectLower = subject.toLowerCase();
  
  if (subjectLower.includes('workshop') || subjectLower.includes('boot camp')) {
    return 'workshop';
  }
  if (subjectLower.includes('lab') || subjectLower.includes('electronics') || subjectLower.includes('programming')) {
    return 'lab';
  }
  if (subjectLower.includes('mentoring') || subjectLower.includes('guidance')) {
    return 'mentoring';
  }
  if (subjectLower.includes('review') || subjectLower.includes('showcase') || subjectLower.includes('presentation')) {
    return 'project_review';
  }
  
  return 'workshop'; // Default type
}

/**
 * Calculates total teaching hours from slots
 */
function calculateTotalHours(slots: OfficerTimetableSlot[]): number {
  return slots.reduce((acc, slot) => {
    const [startH, startM] = slot.start_time.split(':').map(Number);
    const [endH, endM] = slot.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return acc + (endMinutes - startMinutes) / 60;
  }, 0);
}

/**
 * Syncs institution timetable to officer timetables
 * This is called when System Admin saves the institution timetable
 */
export function syncInstitutionToOfficerTimetable(
  institutionId: string,
  institutionAssignments: InstitutionTimetableAssignment[],
  periods: PeriodConfig[]
): void {
  // Get officers assigned to this institution
  const officers = getInstitutionOfficers(institutionId);
  
  if (officers.length === 0) {
    console.warn(`No officers assigned to institution ${institutionId}`);
    return;
  }
  
  const timetables = loadOfficerTimetables();
  
  // For each officer, create/update their timetable
  officers.forEach(officer => {
    const officerSlots = convertInstitutionToOfficerSlots(
      institutionAssignments,
      periods,
      officer.officer_id
    );
    
    const totalHours = Math.round(calculateTotalHours(officerSlots));
    
    // Find existing timetable or create new
    const existingIndex = timetables.findIndex(t => t.officer_id === officer.officer_id);
    
    const updatedTimetable: OfficerTimetable = {
      officer_id: officer.officer_id,
      slots: officerSlots,
      total_hours: totalHours,
      status: officerSlots.length > 0 ? 'assigned' : 'not_assigned',
      last_updated: new Date().toISOString(),
    };
    
    if (existingIndex !== -1) {
      // Merge with existing custom slots (keep slots not from institution sync)
      const existingSlots = timetables[existingIndex].slots.filter(
        s => !s.id.startsWith('synced-')
      );
      updatedTimetable.slots = [...existingSlots, ...officerSlots];
      updatedTimetable.total_hours = Math.round(calculateTotalHours(updatedTimetable.slots));
      timetables[existingIndex] = updatedTimetable;
    } else {
      timetables.push(updatedTimetable);
    }
  });
  
  saveOfficerTimetables(timetables);
}

/**
 * Get synced timetable data for an officer based on their institution
 */
export function getOfficerSyncedTimetable(officerId: string): OfficerTimetable | undefined {
  const timetables = loadOfficerTimetables();
  return timetables.find(t => t.officer_id === officerId);
}

/**
 * Validates if institution timetable can be synced
 */
export function validateTimetableSync(
  institutionId: string,
  assignments: InstitutionTimetableAssignment[],
  periods: PeriodConfig[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const officers = getInstitutionOfficers(institutionId);
  if (officers.length === 0) {
    errors.push('No officers assigned to this institution. Please assign officers first.');
  }
  
  if (periods.length === 0) {
    errors.push('No periods configured. Please configure periods first.');
  }
  
  // Check for assignments referencing non-existent periods
  const periodIds = new Set(periods.map(p => p.id));
  const invalidPeriods = assignments.filter(a => !periodIds.has(a.period_id));
  if (invalidPeriods.length > 0) {
    errors.push(`${invalidPeriods.length} assignments reference invalid periods.`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
