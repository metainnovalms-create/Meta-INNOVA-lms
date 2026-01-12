export type NotificationType = 
  | 'assignment_submission' 
  | 'quiz_completion' 
  | 'project_update'
  | 'certificate_issued'
  | 'grade_received'
  | 'event_application_submitted'
  | 'event_application_reviewed'
  | 'event_published'
  | 'event_reminder'
  | 'leave_application_submitted'
  | 'leave_application_cancelled'
  | 'leave_application_approved'
  | 'leave_application_rejected'
  | 'leave_pending_approval'
  | 'leave_final_approved'
  | 'officer_on_leave'
  | 'substitute_assigned'
  | 'substitute_info'
  | 'assignment_graded'
  | 'assessment_graded'
  | 'assessment_scheduled'
  | 'new_assignment_published'
  | 'new_assessment_published'
  // Task-related notifications
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_comment_added'
  | 'task_submitted'
  | 'task_approved'
  | 'task_rejected'
  | 'task_due_soon'
  | 'task_overdue'
  // Inventory-related notifications
  | 'purchase_request'
  | 'inventory_issue';

export interface Notification {
  id: string;
  recipient_id: string;
  recipient_role: 'officer' | 'student' | 'system_admin' | 'management';
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  metadata?: {
    assignment_id?: string;
    student_id?: string;
    submission_id?: string;
    quiz_id?: string;
    course_id?: string;
    leave_application_id?: string;
    officer_id?: string;
    officer_name?: string;
    leave_type?: string;
    start_date?: string;
    end_date?: string;
    total_days?: number;
    applicant_name?: string;
    approver_position?: string;
    institution_id?: string;
    institution_name?: string;
    [key: string]: any;
  };
  read: boolean;
  created_at: string;
}
