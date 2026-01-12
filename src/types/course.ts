// Course Management Type Definitions

export type CourseCategory = 
  | 'electronics' 
  | 'iot' 
  | 'robotics' 
  | 'ai_ml' 
  | 'data_science' 
  | 'ar_vr' 
  | 'blockchain' 
  | 'drones' 
  | 'cybersecurity'
  | 'design_thinking' 
  | 'product_design' 
  | 'prototyping' 
  | 'environmental_tech' 
  | 'sdg' 
  | 'ethics' 
  | 'etiquettes' 
  | 'human_values'
  | 'digital_media' 
  | 'communication' 
  | 'prompt_engineering' 
  | 'entrepreneurship' 
  | 'financial_literacy' 
  | 'career_prep'
  | 'other';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type CourseStatus = 'draft' | 'active' | 'archived';
export type ContentType = 'pdf' | 'ppt' | 'video' | 'youtube' | 'simulation' | 'link';
export type SubmissionType = 'file' | 'text' | 'url';
export type QuestionType = 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'inactive';
export type AssignmentStatus = 'upcoming' | 'ongoing' | 'completed';

// Core Course Structure
export interface Course {
  id: string;
  course_code: string;
  title: string;
  description: string;
  category: CourseCategory;
  thumbnail_url?: string;
  difficulty: CourseDifficulty;
  duration_weeks: number;
  prerequisites?: string;
  learning_outcomes: string[];
  sdg_goals?: string[]; // SDG goal IDs (e.g., ['SDG4', 'SDG9'])
  certificate_template_id?: string; // Certificate template to award on completion
  status: CourseStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Course Modules
export interface CourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

// Course Sessions (logical content groupings within modules)
export interface CourseSession {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  description: string;
  order: number;
  duration_minutes?: number;
  learning_objectives?: string[];
  created_at: string;
}

// Course Content (Materials)
export interface CourseContent {
  id: string;
  course_id: string;
  module_id: string;
  session_id: string; // Link content to sessions
  title: string;
  type: ContentType;
  file_url?: string;
  youtube_url?: string;
  external_url?: string;
  duration_minutes?: number;
  file_size_mb?: number;
  order: number;
  views_count: number;
  created_at: string;
}

// Assignments
export interface Assignment {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  description: string;
  assignment_type: 'traditional' | 'timed_questions'; // New field
  due_date?: string; // Optional for timed assignments
  total_points: number;
  submission_type?: SubmissionType; // Optional for timed assignments
  allow_late_submission?: boolean;
  late_penalty_percent?: number;
  rubric?: string;
  attachment_urls?: string[];
  has_questions?: boolean; // Indicates if this assignment has timed questions
  total_time_seconds?: number; // Auto-calculated from question timers
  created_at: string;
}

// Assignment Questions
export interface AssignmentQuestion {
  id: string;
  assignment_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer?: string | number; // Optional for subjective questions
  points: number;
  time_limit_seconds: number; // Individual question timer
  explanation?: string;
  order: number;
}

export interface AssignmentAnswer {
  question_id: string;
  answer: string | number;
  time_spent_seconds: number;
  auto_skipped: boolean;
}

// Quizzes
export interface Quiz {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  description: string;
  time_limit_minutes?: number; // Deprecated - kept for backward compatibility
  attempts_allowed: number;
  randomize_questions: boolean;
  show_correct_answers: boolean;
  pass_percentage: number;
  available_from: string;
  available_to: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: string[];
  correct_answer: string | number;
  points: number;
  time_limit_seconds: number; // Time limit for this specific question
  explanation?: string;
  order: number;
}

// Course Assignments (to Institutions & Officers)
export interface CourseAssignment {
  id: string;
  course_id: string;
  institution_id: string;
  institution_name: string;
  class_level: string;
  officer_ids: string[];
  officer_names: string[];
  primary_officer_id: string;
  start_date: string;
  end_date: string;
  max_enrollments?: number;
  current_enrollments: number;
  status: AssignmentStatus;
  created_at: string;
}

// Student Course Enrollments
export interface CourseEnrollment {
  id: string;
  course_id: string;
  course_title: string;
  course_code: string;
  student_id: string;
  student_name: string;
  institution_id: string;
  class_level: string;
  enrolled_at: string;
  progress_percentage: number;
  status: EnrollmentStatus;
  last_activity_at: string;
  completed_at?: string;
  certificate_issued: boolean;
}

// Assignment Submissions
export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  assignment_title: string;
  student_id: string;
  student_name: string;
  submission_type?: SubmissionType;
  file_url?: string;
  text_content?: string;
  url_content?: string;
  submitted_at: string;
  is_late?: boolean;
  late_penalty_applied?: number;
  grade?: number;
  total_points: number;
  graded_by?: string;
  graded_at?: string;
  feedback?: string;
  feedback_file_url?: string;
  status: 'pending' | 'graded';
  answers?: AssignmentAnswer[]; // For question-based submissions
  time_spent_seconds?: number; // Total time spent on timed assignments
}

// Quiz Attempts
export interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  student_id: string;
  student_name: string;
  attempt_number: number;
  started_at: string;
  submitted_at?: string;
  time_taken_minutes?: number;
  score?: number;
  percentage?: number;
  status: 'in_progress' | 'submitted' | 'graded';
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  question_id: string;
  student_answer: string | number;
  is_correct?: boolean;
  points_earned?: number;
  graded_by?: string;
  time_spent_seconds?: number; // Time spent on this question
  auto_skipped?: boolean; // True if question was skipped due to timeout
}

// Content Progress Tracking
export interface ContentProgress {
  id: string;
  student_id: string;
  course_id: string;
  content_id: string;
  viewed: boolean;
  viewed_at?: string;
  watch_progress_percentage?: number;
}

// Course Analytics
export interface CourseAnalytics {
  course_id: string;
  course_title: string;
  total_enrollments: number;
  active_students: number;
  completed_students: number;
  completion_rate: number;
  average_assignment_score: number;
  average_quiz_score: number;
  assignment_submission_rate: number;
  dropout_rate: number;
  average_progress_percentage: number;
  institution_breakdown: {
    institution_id: string;
    institution_name: string;
    enrollments: number;
    completion_rate: number;
  }[];
}

// API Request Types
export interface CreateCourseRequest {
  course_code: string;
  title: string;
  description: string;
  category: CourseCategory;
  thumbnail_url?: string;
  difficulty: CourseDifficulty;
  duration_weeks: number;
  prerequisites?: string;
  learning_outcomes: string[];
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  status?: CourseStatus;
}

export interface CreateModuleRequest {
  title: string;
  description: string;
  order: number;
}

export interface CreateSessionRequest {
  title: string;
  description: string;
  order: number;
  duration_minutes?: number;
  learning_objectives?: string[];
}

export interface CourseAssignmentRequest {
  course_id: string;
  institution_id: string;
  class_level: string;
  officer_ids: string[];
  primary_officer_id: string;
  start_date: string;
  end_date: string;
  max_enrollments?: number;
}

export interface GradeSubmissionRequest {
  grade: number;
  feedback?: string;
  feedback_file_url?: string;
}
