export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half_day';
export type LeaveType = 'sick' | 'casual' | 'earned';
export type PayrollStatus = 'draft' | 'pending' | 'approved' | 'forwarded' | 'paid';

// Salary Component Types
export type SalaryComponentType = 
  | 'basic_pay' 
  | 'hra' 
  | 'da' 
  | 'transport_allowance' 
  | 'special_allowance' 
  | 'medical_allowance' 
  | 'overtime' 
  | 'bonus' 
  | 'incentive';

export type DeductionType = 
  | 'pf' 
  | 'esi' 
  | 'tds' 
  | 'professional_tax' 
  | 'loan' 
  | 'advance' 
  | 'other';

export interface DailyAttendance {
  date: string; // "2024-01-15"
  status: AttendanceStatus;
  check_in_time?: string; // "09:15 AM"
  check_out_time?: string; // "05:30 PM"
  hours_worked?: number;
  total_hours?: number;
  leave_type?: LeaveType;
  leave_reason?: string;
  notes?: string;
  check_in_location?: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
  };
  check_out_location?: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
  };
  overtime_hours?: number;
  location_validated?: boolean;
}

// Salary Component
export interface SalaryComponent {
  component_type: SalaryComponentType;
  amount: number;
  is_taxable: boolean;
  calculation_type: 'fixed' | 'percentage' | 'computed';
  percentage_of?: 'basic_pay' | 'gross_salary';
  percentage?: number;
}

// Deduction
export interface Deduction {
  deduction_type: DeductionType;
  amount: number;
  calculation_type: 'fixed' | 'percentage' | 'statutory';
  percentage?: number;
  notes?: string;
}

// Statutory Information
export interface StatutoryInfo {
  pf_number?: string;
  uan_number?: string;
  esi_number?: string;
  pan_number?: string;
  pt_registration?: string;
  pf_applicable: boolean;
  esi_applicable: boolean;
  pt_applicable: boolean;
}

export interface OfficerAttendanceRecord {
  officer_id: string;
  officer_name: string;
  employee_id: string;
  department: string;
  month: string; // "2024-01"
  daily_records: DailyAttendance[];
  present_days: number;
  absent_days: number;
  leave_days: number;
  total_hours_worked: number;
  last_marked_date: string;
}

// Enhanced PayrollRecord
export interface PayrollRecord {
  officer_id: string;
  officer_name: string;
  employee_id: string;
  month: string;
  year: number;
  
  // Attendance-based
  working_days: number;
  days_present: number;
  days_absent: number;
  days_leave: number;
  
  // Salary Components
  salary_components: SalaryComponent[];
  total_earnings: number;
  
  // Deductions
  deductions: Deduction[];
  total_deductions: number;
  
  // Final Amounts
  gross_salary: number;
  net_pay: number;
  
  // Legacy fields for backward compatibility
  salary_monthly?: number;
  calculated_pay?: number;
  
  // Statutory Compliance
  pf_employee: number;
  pf_employer: number;
  esi_employee: number;
  esi_employer: number;
  tds: number;
  professional_tax: number;
  
  // Workflow
  status: PayrollStatus;
  approved_by?: string;
  approved_date?: string;
  paid_date?: string;
  payment_mode?: 'bank_transfer' | 'cash' | 'cheque';
  payment_reference?: string;
  notes?: string;
}

// Payslip Interface
export interface Payslip {
  id: string;
  payroll_record: PayrollRecord;
  generated_date: string;
  pdf_url?: string;
  emailed_to?: string;
  email_sent_date?: string;
}

// Overtime Record
export interface OvertimeRecord {
  officer_id: string;
  date: string;
  hours: number;
  rate_per_hour: number;
  total_amount: number;
  approved: boolean;
  approved_by?: string;
  notes?: string;
}

// Loan Record
export interface LoanRecord {
  id: string;
  officer_id: string;
  loan_type: 'advance' | 'personal' | 'housing' | 'education';
  principal_amount: number;
  outstanding_amount: number;
  monthly_deduction: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'closed';
}

// Affected Slot (for leave substitute system)
export interface AffectedSlot {
  slot_id: string;
  day: string;
  start_time: string;
  end_time: string;
  class: string;
  subject: string;
  room: string;
  date: string;
}

// Substitute Assignment (for leave substitute system)
export interface SubstituteAssignment {
  slot_id: string;
  original_officer_id: string;
  substitute_officer_id: string;
  substitute_officer_name: string;
  date: string;
  hours: number;
}

// Leave Application
export interface LeaveApplication {
  id: string;
  officer_id: string;
  officer_name: string;
  applicant_type: 'innovation_officer' | 'meta_staff'; // NEW: Differentiate applicant type
  position?: string; // NEW: For meta staff (ceo, md, agm, etc.)
  institution_id?: string;
  institution_name?: string;
  start_date: string; // "2025-10-30"
  end_date: string; // "2025-11-01"
  leave_type: LeaveType;
  reason: string;
  total_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approval_stage?: 'manager_pending' | 'agm_pending' | 'ceo_pending' | 'approved' | 'rejected'; // NEW: Multi-stage approval
  applied_at: string;
  // Manager approval (Innovation Officers only)
  approved_by_manager?: string;
  approved_by_manager_at?: string;
  manager_comments?: string;
  // AGM approval (Innovation Officers only)
  approved_by_agm?: string;
  approved_by_agm_at?: string;
  agm_comments?: string;
  // Final reviewer (AGM for officers, CEO for meta staff)
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  rejected_by?: string; // NEW: Who rejected the leave
  rejected_at?: string;
  rejection_stage?: 'manager' | 'agm' | 'ceo'; // NEW: At which stage was it rejected
  admin_comments?: string;
  affected_slots?: AffectedSlot[]; // Optional: Only for Innovation Officers
  substitute_assignments?: SubstituteAssignment[]; // Optional: Only for Innovation Officers
}

// Leave Balance
export interface LeaveBalance {
  officer_id: string;
  sick_leave: number;
  casual_leave: number;
  earned_leave: number;
  year: string; // "2025"
}

/**
 * Staff Attendance Record (for meta staff: CEO, MD, AGM, GM, Manager, Admin Staff)
 */
export interface StaffAttendanceRecord {
  staff_id: string;
  staff_name: string;
  employee_id?: string;
  position: 'ceo' | 'md' | 'agm' | 'gm' | 'manager' | 'admin_staff';
  department?: string;
  month: string; // Format: YYYY-MM
  daily_records: DailyAttendance[];
  present_days: number;
  absent_days: number;
  leave_days: number;
  total_hours_worked: number;
  overtime_hours: number;
}

/**
 * Staff Payroll Record (for meta staff)
 */
export interface StaffPayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  position: 'ceo' | 'md' | 'agm' | 'gm' | 'manager' | 'admin_staff';
  department?: string;
  month: string;
  working_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  
  // Salary Components
  salary_components: SalaryComponent[];
  total_earnings: number;
  
  // Deductions
  deductions: Deduction[];
  total_deductions: number;
  
  // Final Amounts
  gross_salary: number;
  net_pay: number;
  
  // Statutory Compliance
  pf_employee?: number;
  pf_employer?: number;
  esi_employee?: number;
  esi_employer?: number;
  tds?: number;
  professional_tax?: number;
  
  // Workflow
  status: PayrollStatus;
  approved_by?: string;
  approved_at?: string;
  generated_at?: string;
  paid_date?: string;
  payment_mode?: 'bank_transfer' | 'cash' | 'cheque';
  payment_reference?: string;
  notes?: string;
}
