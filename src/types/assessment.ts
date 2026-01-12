export type AssessmentStatus = 'draft' | 'published' | 'unpublished' | 'upcoming' | 'ongoing' | 'completed';

export interface Assessment {
  id: string;
  title: string;
  description: string;
  status: AssessmentStatus;
  
  // Timing
  start_time: string; // ISO datetime
  end_time: string;   // ISO datetime
  duration_minutes: number; // Total time allowed
  
  // Scoring
  total_points: number;
  pass_percentage: number; // e.g., 70 for 70%
  
  // Settings
  auto_submit: boolean;
  auto_evaluate: boolean;
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  allow_review_after_submission: boolean;
  
  // Publishing
  published_to: AssessmentPublishing[];
  
  // Questions
  question_count: number;
  questions?: AssessmentQuestion[];
  
  // Certificate
  certificate_template_id?: string; // Certificate template to award on completion
  
  // Metadata
  created_by: string;
  created_by_role: 'system_admin' | 'officer'; // NEW: Track who created it
  institution_id?: string; // NEW: For officer-created assessments
  created_at: string;
  updated_at: string;
}

export interface AssessmentPublishing {
  institution_id: string;
  institution_name: string;
  class_ids: string[]; // Can publish to multiple classes within an institution
  class_names: string[];
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_number: number;
  question_text: string;
  question_type: 'mcq'; // Only MCQ for now, extensible later
  
  // MCQ Options
  options: MCQOption[];
  correct_option_id: string;
  
  // Scoring
  points: number;
  
  // Timer (per question)
  time_limit_seconds?: number; // Optional time limit per question
  
  // Media
  image_url?: string;
  code_snippet?: string;
  
  // Explanation (shown after submission)
  explanation?: string;
  
  // Metadata
  order: number;
  created_at: string;
}

export interface MCQOption {
  id: string;
  option_label: string; // A, B, C, D
  option_text: string;
  order: number;
}

export interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  student_name: string;
  institution_id: string;
  institution_name: string;
  class_id: string;
  class_name: string;
  
  // Timing
  started_at: string;
  submitted_at?: string;
  time_taken_seconds?: number;
  
  // Scoring
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  
  // Answers
  answers: AssessmentAnswer[];
  
  // Status
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'evaluated' | 'retaken';
  
  // Manual assessment entry
  is_manual?: boolean;
  manual_notes?: string;
  conducted_at?: string;
  
  // Question order for shuffle persistence
  question_order?: string[];
  
  // Retake feature
  retake_allowed?: boolean;
}

export interface AssessmentAnswer {
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  points_earned: number;
  time_spent_seconds: number;
}

// Analytics
export interface AssessmentAnalytics {
  assessment_id: string;
  total_attempts: number;
  completed_attempts: number;
  in_progress_attempts: number;
  average_score: number;
  pass_rate: number;
  average_time_taken_minutes: number;
  
  // Per institution breakdown
  institution_stats: {
    institution_id: string;
    institution_name: string;
    attempts: number;
    average_score: number;
    pass_rate: number;
  }[];
  
  // Question-wise analytics
  question_stats: {
    question_id: string;
    question_number: number;
    correct_count: number;
    incorrect_count: number;
    accuracy_rate: number;
    average_time_seconds: number;
  }[];
}
