import { InstitutionClass } from './student';

// Re-export InstitutionClass for convenience
export type { InstitutionClass };

// Period Configuration
export interface PeriodConfig {
  id: string;
  institution_id: string;
  label: string;
  start_time: string;  // '08:00'
  end_time: string;    // '08:45'
  is_break: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// Timetable Assignment
export interface InstitutionTimetableAssignment {
  id: string;
  institution_id: string;
  academic_year: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period_id: string;
  class_id: string;
  class_name: string;
  subject: string;
  teacher_id?: string;
  teacher_name?: string;
  secondary_officer_id?: string;
  secondary_officer_name?: string;
  backup_officer_id?: string;
  backup_officer_name?: string;
  room?: string;
  created_at: string;
  updated_at: string;
}

// Report Options
export interface ReportOptions {
  report_type: 'enrollment' | 'attendance' | 'performance' | 'staff_utilization' | 'comprehensive';
  date_range: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'excel' | 'csv';
  sections?: string[];
  email_to?: string;
}

// Analytics Data
export interface InstitutionAnalytics {
  institution_id: string;
  period: string;
  student_metrics: {
    total_students: number;
    active_students: number;
    new_enrollments: number;
    attendance_rate: number;
    dropout_rate: number;
    gender_distribution: {
      male: number;
      female: number;
      other: number;
    };
  };
  academic_metrics: {
    average_grade: number;
    top_performing_class: string;
    students_needing_attention: number;
    subject_performance: Array<{
      subject: string;
      average_score: number;
    }>;
  };
  staff_metrics: {
    total_officers: number;
    officer_utilization_rate: number;
    staff_attendance_rate: number;
    teacher_student_ratio: string;
  };
  operational_metrics: {
    total_classes: number;
    lab_utilization: number;
    event_participation_rate: number;
    project_completion_rate: number;
  };
}

// ========== CLASS DETAIL PAGE TYPES ==========

// Class Course Assignment with Module-Level Configuration
export interface ClassCourseAssignment {
  id: string;
  class_id: string;
  course_id: string;
  course_title: string;
  course_thumbnail?: string;
  course_category?: string;
  assigned_modules: AssignedModule[];
  assigned_officers: string[]; // Officer IDs
  start_date: string;
  expected_end_date?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface AssignedModule {
  module_id: string;
  module_title: string;
  module_order: number;
  unlock_mode: 'immediate' | 'sequential' | 'date_based' | 'manual';
  unlock_date?: string; // For date_based mode
  is_unlocked: boolean;
  prerequisite_module_id?: string; // For sequential mode
  completion_requirement: {
    require_all_content: boolean;
    require_all_assignments: boolean;
    require_all_quizzes: boolean;
    minimum_score_percent?: number;
  };
  students_completed?: number; // Track progress
}

export interface CreateClassCourseAssignment {
  class_id: string;
  course_id: string;
  assigned_modules: Omit<AssignedModule, 'module_title' | 'module_order' | 'is_unlocked' | 'students_completed'>[];
  assigned_officers: string[];
  start_date: string;
  expected_end_date?: string;
}

// Class Analytics
export interface ClassAnalytics {
  class_id: string;
  period: string;
  student_metrics: {
    total_students: number;
    active_students: number;
    average_attendance_rate: number;
    gender_distribution: {
      male: number;
      female: number;
      other: number;
    };
  };
  academic_metrics: {
    average_grade: number;
    assignment_completion_rate: number;
    quiz_average_score: number;
    top_performers_count: number;
    students_needing_attention: number;
    performance_distribution: {
      excellent: number; // 90-100%
      good: number; // 70-89%
      average: number; // 50-69%
      below_average: number; // <50%
    };
  };
  course_metrics: {
    total_courses_assigned: number;
    overall_completion_rate: number;
    average_modules_completed: number;
    assignment_submission_rate: number;
    quiz_attempt_rate: number;
  };
  engagement_metrics: {
    average_login_frequency: number;
    content_views_total: number;
    project_participation_rate: number;
  };
  attendance_trends: Array<{
    month: string;
    attendance_rate: number;
  }>;
  top_students: Array<{
    student_id: string;
    student_name: string;
    total_points: number;
    rank: number;
  }>;
}

export interface ClassReportOptions {
  report_type: 'student_performance' | 'attendance' | 'course_progress' | 'comprehensive';
  date_range: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'excel' | 'csv';
  include_individual_reports: boolean;
  include_grade_breakdown: boolean;
  include_attendance_details: boolean;
  email_to?: string;
}

// Activity for recent activity feed
export interface Activity {
  id: string;
  type: 'student_enrolled' | 'attendance_marked' | 'assignment_submitted' | 'course_assigned';
  description: string;
  timestamp: string;
  actor?: {
    id: string;
    name: string;
  };
}

// Officer Assignment
export interface OfficerAssignment {
  officer_id: string;
  officer_name: string;
  employee_id: string;
  email: string;
  phone: string;
  avatar?: string;
  assigned_date: string;
  total_courses: number;
  total_teaching_hours: number;
  status: 'active' | 'inactive';
}

// Working Hours Configuration for Institution
export interface WorkingHoursConfig {
  institution_id: string;
  default_working_hours: number; // e.g., 8 hours per day
  overtime_enabled: boolean;
  gps_validation_enabled: boolean;
  location?: {
    latitude: number;
    longitude: number;
    radius_meters: number; // Validation radius
  };
  updated_at: string;
}
