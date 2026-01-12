export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'achievement' | 'participation' | 'excellence' | 'milestone';
  unlock_criteria: {
    type: 'points' | 'attendance' | 'projects' | 'assessments' | 'assignments' | 'streak' | 'custom';
    threshold: number;
    description: string;
  };
  xp_reward: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

export interface XPRule {
  id: string;
  activity: 'assessment_completion' | 'assessment_pass' | 'assessment_perfect_score' | 
            'level_completion' | 'project_membership' | 'project_award' | 'project_completion' |
            'session_attendance' | 'daily_streak' | 
            'assignment_submission' | 'assignment_pass' | 'assignment_perfect_score';
  points: number;
  multiplier?: number;
  description: string;
  is_active: boolean;
}

export interface LeaderboardConfig {
  id: string;
  institution_id: string;
  institution_name: string;
  scope: 'institution' | 'class' | 'course';
  time_period: 'all_time' | 'monthly' | 'weekly';
  top_n_display: number;
  is_public: boolean;
  reset_schedule?: 'none' | 'weekly' | 'monthly';
}

export interface StudentPerformance {
  student_id: string;
  student_name: string;
  institution_id: string;
  institution_name: string;
  class_id: string;
  class_name: string;
  total_points: number;
  rank: number;
  badges_earned: number;
  streak_days: number;
  last_activity: string;
  points_breakdown: {
    sessions: number;
    projects: number;
    attendance: number;
    assessments: number;
    levels: number;
  };
}

export interface GamificationStats {
  total_students: number;
  total_points_distributed: number;
  active_badges: number;
  total_rewards_claimed: number;
  top_institutions: Array<{
    id: string;
    name: string;
    avg_points: number;
    total_students: number;
  }>;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  student_name: string;
  institution_name: string;
  activity_type: string;
  points_earned: number;
  description: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  category: 'course' | 'level' | 'assessment' | 'event';
  template_image_url: string;
  default_width: number;
  default_height: number;
  name_position: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
  };
  date_position: {
    x: number;
    y: number;
    fontSize: number;
    color: string;
  };
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface StudentCertificate {
  id: string;
  student_id: string;
  student_name: string;
  template_id: string;
  activity_type: 'course' | 'level' | 'assessment' | 'event';
  activity_id: string;
  activity_name: string;
  institution_name: string;
  issued_date: string;
  completion_date: string;
  certificate_url: string;
  verification_code: string;
  qr_code_url: string;
  grade?: string;
}
