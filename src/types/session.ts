export interface CourseSessionDelivery {
  id: string;
  timetable_slot_id: string;
  officer_id: string;
  course_id: string;
  class_name: string;
  date: string; // '2024-02-15'
  start_time: string;
  end_time: string;
  
  // Progress tracking
  current_module_id: string;
  modules_covered: string[]; // IDs of completed modules
  content_completed: string[]; // IDs of completed content items
  
  // Attendance
  students_present: string[]; // Student IDs
  total_students: number;
  attendance_percentage: number;
  
  // Session metadata
  status: 'scheduled' | 'in_progress' | 'completed';
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface SessionProgress {
  class_name: string;
  course_id: string;
  total_modules: number;
  completed_modules: number;
  current_module_id: string;
  last_session_date: string;
  total_sessions: number;
  average_attendance: number;
}
