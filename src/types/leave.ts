// Leave Management Types

export type LeaveType = 'sick' | 'casual';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type UserType = 'officer' | 'staff';
export type HolidayType = 'company' | 'national' | 'optional' | 'institution' | 'academic' | 'exam';

// Calendar Day Types for manual marking
export type CalendarDayType = 'working' | 'weekend' | 'holiday';
export type CalendarType = 'company' | 'institution';

export interface CalendarDayTypeEntry {
  id: string;
  calendar_type: CalendarType;
  institution_id?: string | null;
  date: string;
  day_type: CalendarDayType;
  description?: string | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Company Holiday
export interface CompanyHoliday {
  id: string;
  name: string;
  date: string;
  end_date?: string | null;
  description?: string | null;
  holiday_type: HolidayType;
  year: number;
  is_paid: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Institution Holiday
export interface InstitutionHoliday {
  id: string;
  institution_id: string;
  name: string;
  date: string;
  end_date?: string | null;
  description?: string | null;
  holiday_type: HolidayType;
  year: number;
  is_paid: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Leave Balance
export interface LeaveBalance {
  id: string;
  user_id: string;
  user_type: UserType;
  officer_id?: string | null;
  year: number;
  month: number;
  monthly_credit: number;
  carried_forward: number;
  sick_leave_used: number;
  casual_leave_used: number;
  lop_days: number;
  balance_remaining: number;
  created_at?: string;
  updated_at?: string;
}

// Calculated Leave Balance (from function)
export interface CalculatedLeaveBalance {
  monthly_credit: number;
  carried_forward: number;
  total_available: number;
  sick_leave_used: number;
  casual_leave_used: number;
  total_used: number;
  lop_days: number;
  balance_remaining: number;
}

// Approval Chain Item
export interface ApprovalChainItem {
  position_id: string;
  position_name: string;
  order: number;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  comments?: string;
}

// Substitute Assignment (for officers)
export interface SubstituteAssignment {
  slot_id?: string;
  class_id: string;
  class_name: string;
  day: string;
  date: string;
  period_id: string;
  period_label: string;
  period_time?: string;
  subject: string;
  room?: string;
  original_officer_id?: string;
  original_officer_name?: string;
  substitute_officer_id: string;
  substitute_officer_name: string;
}

// Leave Application
export interface LeaveApplication {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_type: UserType;
  officer_id?: string | null;
  institution_id?: string | null;
  institution_name?: string | null;
  position_id?: string | null;
  position_name?: string | null;
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
  total_days: number;
  is_lop: boolean;
  lop_days: number;
  paid_days: number;
  status: LeaveStatus;
  current_approval_level: number;
  approval_chain: ApprovalChainItem[];
  final_approved_by?: string | null;
  final_approved_by_name?: string | null;
  final_approved_at?: string | null;
  rejection_reason?: string | null;
  rejected_by?: string | null;
  rejected_by_name?: string | null;
  rejected_at?: string | null;
  substitute_assignments: SubstituteAssignment[];
  applied_at?: string;
  updated_at?: string;
}

// Leave Approval Hierarchy
export interface LeaveApprovalHierarchy {
  id: string;
  applicant_type: UserType;
  applicant_position_id?: string | null;
  approver_position_id: string;
  approval_order: number;
  is_final_approver: boolean;
  is_optional: boolean;
  created_at?: string;
  updated_at?: string;
}

// Form types
export interface CreateHolidayInput {
  name: string;
  date: string;
  end_date?: string;
  description?: string;
  holiday_type: HolidayType;
  year: number;
  is_paid?: boolean;
}

export interface CreateLeaveApplicationInput {
  start_date: string;
  end_date: string;
  leave_type: LeaveType;
  reason: string;
  substitute_assignments?: SubstituteAssignment[];
}

export interface ApprovalHierarchyInput {
  applicant_type: UserType;
  applicant_position_id?: string | null;
  approver_position_id: string;
  approval_order: number;
  is_final_approver?: boolean;
  is_optional?: boolean;
}

// Constants
export const LEAVES_PER_YEAR = 12;
export const LEAVES_PER_MONTH = 1;
export const MAX_LEAVES_PER_MONTH = 2; // Including carry-over
export const MAX_CARRY_FORWARD = 1;

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: 'Sick Leave',
  casual: 'Casual Leave',
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  company: 'Company Holiday',
  national: 'National Holiday',
  optional: 'Optional Holiday',
  institution: 'Institution Holiday',
  academic: 'Academic Holiday',
  exam: 'Exam Holiday',
};
