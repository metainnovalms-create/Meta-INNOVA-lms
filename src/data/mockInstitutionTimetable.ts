// This file is deprecated - data now comes from database
// Keeping exports for backward compatibility with existing imports

import { InstitutionTimetableAssignment } from '@/types/institution';

// Empty mock data - use database via useInstitutionTimetable hook instead
export const mockInstitutionTimetable: Record<string, InstitutionTimetableAssignment[]> = {};

// Deprecated functions - data should come from database hooks
export function loadInstitutionTimetables(): Record<string, InstitutionTimetableAssignment[]> {
  console.warn('loadInstitutionTimetables is deprecated. Use useInstitutionTimetable hook instead.');
  return {};
}

export function saveInstitutionTimetables(timetables: Record<string, InstitutionTimetableAssignment[]>): void {
  console.warn('saveInstitutionTimetables is deprecated. Use useInstitutionTimetable hook mutations instead.');
}

export function getInstitutionTimetable(institutionId: string): InstitutionTimetableAssignment[] {
  console.warn('getInstitutionTimetable is deprecated. Use useInstitutionTimetable hook instead.');
  return [];
}

export function saveInstitutionTimetable(institutionId: string, assignments: InstitutionTimetableAssignment[]): void {
  console.warn('saveInstitutionTimetable is deprecated. Use useInstitutionTimetable hook mutations instead.');
}

export function addTimetableAssignment(institutionId: string, assignment: InstitutionTimetableAssignment): void {
  console.warn('addTimetableAssignment is deprecated. Use useInstitutionTimetable hook mutations instead.');
}

export function updateTimetableAssignment(institutionId: string, assignmentId: string, updates: Partial<InstitutionTimetableAssignment>): void {
  console.warn('updateTimetableAssignment is deprecated. Use useInstitutionTimetable hook mutations instead.');
}

export function deleteTimetableAssignment(institutionId: string, assignmentId: string): void {
  console.warn('deleteTimetableAssignment is deprecated. Use useInstitutionTimetable hook mutations instead.');
}
