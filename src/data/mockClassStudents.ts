import { Student } from '@/types/student';
import { mockStudents } from './mockStudentData';

// Helper to get students by class ID
export const getStudentsByClass = (classId: string): Student[] => {
  return mockStudents.filter(student => student.class_id === classId);
};

// Helper to get student count by class ID
export const getStudentCountByClass = (classId: string): number => {
  return mockStudents.filter(student => student.class_id === classId).length;
};
