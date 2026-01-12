export interface ContentCompletion {
  content_id: string;
  module_id: string;
  session_id: string; // Added session tracking
  course_id: string;
  officer_id: string;
  completed: boolean;
  completed_at: string; // ISO timestamp
  watch_percentage?: number; // For videos
}

export interface SessionProgress {
  session_id: string;
  total_content: number;
  completed_content: number;
  percentage: number;
}

export interface ModuleProgress {
  module_id: string;
  total_content: number;
  completed_content: number;
  percentage: number;
  sessions: SessionProgress[];
}

export interface CourseProgress {
  course_id: string;
  total_content: number;
  completed_content: number;
  percentage: number;
  modules: ModuleProgress[];
}

export interface CompletionTimelineItem extends ContentCompletion {
  content_title: string;
  module_title: string;
  content_type: string;
}

export interface StudentContentCompletion {
  id: string;
  student_id: string;
  student_name: string;
  content_id: string;
  content_title: string;
  module_id: string;
  module_title: string;
  session_id: string;
  course_id: string;
  course_name: string;
  officer_id: string;
  officer_name: string;
  completed_at: string; // ISO timestamp
  class_name: string;
  content_type: 'video' | 'pdf' | 'ppt' | 'link' | 'simulation' | 'youtube';
}

export interface StudentLearningLog {
  student_id: string;
  course_id: string;
  completions: StudentContentCompletion[];
  total_completed: number;
  last_updated: string;
}
