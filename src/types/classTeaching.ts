export interface ClassTeachingSession {
  id: string;
  officer_id: string;
  class_id: string;
  course_id: string;
  session_date: string;
  duration_minutes: number;
  module_id: string;
  module_title: string;
  content_covered: string[];
  attendance_marked: boolean;
  notes?: string;
  created_at: string;
}

export interface ClassCourseProgress {
  class_id: string;
  class_name: string;
  course_id: string;
  course_title: string;
  course_code: string;
  officer_id: string;
  
  // Progress tracking
  last_session_date?: string;
  last_module_id?: string;
  last_module_title?: string;
  completed_modules: string[];
  total_modules: number;
  total_sessions: number;
  total_hours: number;
  
  // Current position (for "Continue Teaching")
  current_module_id?: string;
  current_content_index: number;
  
  // Status
  status: 'not_started' | 'in_progress' | 'completed';
  completion_percentage: number;
  
  created_at: string;
  updated_at: string;
}

export interface ClassTeachingReport {
  class_id: string;
  class_name: string;
  officer_id: string;
  
  courses: {
    course_id: string;
    course_title: string;
    course_code: string;
    sessions_count: number;
    total_hours: number;
    modules_completed: number;
    modules_total: number;
    last_session_date?: string;
    status: 'not_started' | 'in_progress' | 'completed';
  }[];
  
  total_sessions: number;
  total_teaching_hours: number;
  date_range?: {
    first_session: string;
    last_session: string;
  };
}
