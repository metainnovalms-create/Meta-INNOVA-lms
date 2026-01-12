import { UserRole } from './index';

// Dynamic custom position interface
export interface CustomPosition {
  id: string;
  position_name: string;
  display_name: string;
  visible_features: SystemAdminFeature[];
  description: string;
  created_at: string;
  created_by: string;
  user_count?: number;
  is_ceo_position?: boolean;
}

export type SystemAdminFeature = 
  | 'institution_management'
  | 'course_management'
  | 'assessment_management'
  | 'assignment_management'
  | 'event_management'
  | 'officer_management'
  | 'project_management'
  | 'inventory_management'
  | 'attendance_payroll'
  | 'leave_approvals'
  | 'leave_management'
  | 'company_holidays'
  | 'payroll_management'
  | 'global_approval_config'
  | 'ats_management'
  | 'institutional_calendar'
  | 'reports_analytics'
  | 'sdg_management'
  | 'task_management'
  | 'task_allotment'
  | 'credential_management'
  | 'gamification'
  | 'id_configuration'
  | 'survey_feedback'
  | 'performance_ratings'
  | 'webinar_management'
  | 'crm_clients'
  | 'news_feeds'
  | 'ask_metova'
  | 'settings'
  | 'position_management';

export const ALL_SYSTEM_ADMIN_FEATURES: SystemAdminFeature[] = [
  'institution_management',
  'course_management',
  'assessment_management',
  'assignment_management',
  'event_management',
  'officer_management',
  'project_management',
  'inventory_management',
  'attendance_payroll',
  'leave_approvals',
  'leave_management',
  'company_holidays',
  'payroll_management',
  'global_approval_config',
  'ats_management',
  'institutional_calendar',
  'reports_analytics',
  'sdg_management',
  'task_management',
  'task_allotment',
  'credential_management',
  'gamification',
  'id_configuration',
  'survey_feedback',
  'performance_ratings',
  'webinar_management',
  'crm_clients',
  'news_feeds',
  'ask_metova',
  'settings',
  'position_management',
];

export interface PositionPermissions {
  position_id: string;
  position_name: string;
  allowed_features: SystemAdminFeature[];
}

export interface CreatePositionRequest {
  position_name: string;
  display_name?: string;
  description?: string;
  visible_features: SystemAdminFeature[];
}

export interface UpdatePositionRequest {
  position_name?: string;
  display_name?: string;
  description?: string;
  visible_features?: SystemAdminFeature[];
}
