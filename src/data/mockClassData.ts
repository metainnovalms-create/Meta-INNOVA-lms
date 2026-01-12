// This file is deprecated - data now comes from database
// Keeping exports for backward compatibility with existing imports

import { InstitutionClass } from '@/types/student';

// Empty mock data - use database via useClasses hook instead
export const mockInstitutionClasses: InstitutionClass[] = [];

// Deprecated functions - data should come from database hooks
export function loadClasses(): InstitutionClass[] {
  console.warn('loadClasses is deprecated. Use useClasses hook instead.');
  return [];
}

export function saveClasses(classes: InstitutionClass[]): void {
  console.warn('saveClasses is deprecated. Use useClasses hook mutations instead.');
}

export function addClass(institutionClass: InstitutionClass): void {
  console.warn('addClass is deprecated. Use useClasses hook mutations instead.');
}

export function updateClass(classId: string, updates: Partial<InstitutionClass>): void {
  console.warn('updateClass is deprecated. Use useClasses hook mutations instead.');
}

export function deleteClass(classId: string): void {
  console.warn('deleteClass is deprecated. Use useClasses hook mutations instead.');
}

export function getClassesByInstitution(institutionId: string): InstitutionClass[] {
  console.warn('getClassesByInstitution is deprecated. Use useClasses hook instead.');
  return [];
}

export function getClassById(classId: string): InstitutionClass | undefined {
  console.warn('getClassById is deprecated. Use useClasses hook instead.');
  return undefined;
}
