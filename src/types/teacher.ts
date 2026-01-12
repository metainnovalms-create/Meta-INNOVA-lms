export interface SchoolTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  classes_taught: string[];
  experience_years: number;
  qualification: string;
  employee_id: string;
  joining_date: string;
  status: 'active' | 'on_leave' | 'inactive';
  total_students: number;
  average_attendance: number;
  last_active: string;
}

export type TeacherStatus = 'active' | 'on_leave' | 'inactive';

export const SCHOOL_SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Hindi',
  'Social Studies',
  'Computer Science',
  'Physical Education',
  'Arts & Crafts',
  'Sanskrit',
  'Music',
] as const;

export const CLASS_LEVELS = {
  PRIMARY: 'Primary (1-5)',
  MIDDLE: 'Middle (6-8)',
  SECONDARY: 'Secondary (9-10)',
  SENIOR_SECONDARY: 'Senior Secondary (11-12)',
} as const;

export interface TimetableSlot {
  id: string;
  teacher_id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string; // '09:00'
  end_time: string;   // '10:00'
  class: string;      // 'Class 5A'
  subject: string;    // 'Mathematics'
  room: string;       // 'Room 201'
  type: 'lecture' | 'lab' | 'tutorial' | 'practical';
}

export interface TeacherTimetable {
  teacher_id: string;
  slots: TimetableSlot[];
  total_hours: number;
  status: 'assigned' | 'partial' | 'not_assigned';
  last_updated: string;
}
