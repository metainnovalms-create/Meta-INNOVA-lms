// This file is deprecated - data now comes from database
// Keeping exports for backward compatibility with existing imports

import { Student } from '@/types/student';

// Empty mock data - use database via useStudents hook instead
export const mockStudents: Student[] = [];

// Deprecated functions - data should come from database hooks
export function loadStudents(): Student[] {
  console.warn('loadStudents is deprecated. Use useStudents hook instead.');
  return [];
}

export function saveStudents(students: Student[]): void {
  console.warn('saveStudents is deprecated. Use useStudents hook mutations instead.');
}

export function addStudent(student: Student): void {
  console.warn('addStudent is deprecated. Use useStudents hook mutations instead.');
}

export function updateStudent(studentId: string, updates: Partial<Student>): void {
  console.warn('updateStudent is deprecated. Use useStudents hook mutations instead.');
}

export function deleteStudent(studentId: string): void {
  console.warn('deleteStudent is deprecated. Use useStudents hook mutations instead.');
}

export function bulkAddStudents(students: Student[]): void {
  console.warn('bulkAddStudents is deprecated. Use useBulkImportStudents hook instead.');
}

export function getStudentById(studentId: string): Student | undefined {
  console.warn('getStudentById is deprecated. Use useStudents hook instead.');
  return undefined;
}

export function getStudentsByClassId(classId: string): Student[] {
  console.warn('getStudentsByClassId is deprecated. Use useStudents hook instead.');
  return [];
}

export function getStudentsByInstitution(institutionId: string): Student[] {
  console.warn('getStudentsByInstitution is deprecated. Use useStudents hook instead.');
  return [];
}

export function getStudentsByClass(institutionId: string, className: string): Student[] {
  console.warn('getStudentsByClass is deprecated. Use useStudents hook instead.');
  return [];
}

export function getStudentsByClassAndSection(institutionId: string, className: string, section: string): Student[] {
  console.warn('getStudentsByClassAndSection is deprecated. Use useStudents hook instead.');
  return [];
}
