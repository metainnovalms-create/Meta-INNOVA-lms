import { supabase } from '@/integrations/supabase/client';
import { calendarDayTypeService, CalendarDayType as DayType } from './calendarDayType.service';
// Constants
export const STANDARD_DAYS_PER_MONTH = 30;

// Helper function to format date without timezone conversion
export const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Types
export type EmployeeTypeFilter = 'all' | 'officer' | 'staff';

export interface CalendarFilters {
  employeeType?: EmployeeTypeFilter;
}
export interface EmployeePayrollSummary {
  user_id: string;
  user_type: 'officer' | 'staff';
  officer_id?: string;
  position_id?: string;
  name: string;
  email: string;
  position_name?: string;
  department?: string;
  institution_id?: string;
  institution_name?: string;
  join_date?: string;
  monthly_salary: number;
  per_day_salary: number;
  days_present: number;
  days_absent: number;
  days_leave: number;
  days_lop: number;
  days_not_marked: number;
  uninformed_leave_days: number;
  overtime_hours: number;
  overtime_pending_approval: number;
  total_hours_worked: number;
  gross_salary: number;
  total_deductions: number;
  net_pay: number;
  payroll_status: 'draft' | 'pending' | 'approved' | 'paid';
  is_ceo?: boolean;
}

export interface DailyAttendanceRecord {
  id: string;
  user_id: string;
  user_name: string;
  user_type: 'officer' | 'staff';
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_address: string | null;
  check_out_address: string | null;
  total_hours_worked: number;
  overtime_hours: number;
  status: string;
  is_late: boolean;
  missed_checkout: boolean;
  is_uninformed_absence: boolean;
  leave_status?: string;
  notes?: string;
}

export interface CalendarDayData {
  date: string;
  dayOfMonth: number;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  isToday: boolean;
  isFuture: boolean;
  attendance: {
    present: number;
    absent: number;
    late: number;
    leave: number;
    noPay: number;
  };
  records: DailyAttendanceRecord[];
}

export interface OvertimeRequest {
  id: string;
  user_id: string;
  user_name: string;
  user_type: string;
  position_name?: string;
  date: string;
  requested_hours: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  calculated_pay: number;
  created_at: string;
}

export interface PayrollDashboardStats {
  total_employees: number;
  total_payroll_cost: number;
  total_overtime_hours: number;
  pending_overtime_requests: number;
  total_lop_deductions: number;
  pending_payroll_count: number;
  uninformed_leave_count: number;
}

// LOP Calculation using standard 30 days
export const calculatePerDaySalary = (monthlySalary: number): number => {
  return monthlySalary / STANDARD_DAYS_PER_MONTH;
};

export const calculateLOPDeduction = (monthlySalary: number, lopDays: number): number => {
  const perDaySalary = calculatePerDaySalary(monthlySalary);
  return perDaySalary * lopDays;
};

// Helper: Get working days for a month (uses manual calendar day types if available)
export const getWorkingDaysInMonth = async (
  year: number, 
  month: number, 
  fromDate?: Date,
  calendarType: 'company' | 'institution' = 'company',
  institutionId?: string
): Promise<string[]> => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  // Try to get manually marked day types
  const dayTypesMap = await calendarDayTypeService.getDayTypesForMonth(
    calendarType,
    year,
    month,
    calendarType === 'institution' ? institutionId : undefined
  );
  
  const workingDays: string[] = [];
  
  for (let d = new Date(startDate); d <= endDate && d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateLocal(d);
    
    // If fromDate is provided, only count days from that date
    if (fromDate && d < fromDate) continue;
    
    // Check if manually marked
    if (dayTypesMap.size > 0) {
      const dayType = dayTypesMap.get(dateStr);
      if (dayType === 'working') {
        workingDays.push(dateStr);
      }
    } else {
      // Fallback to automatic weekend detection if no manual marking
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday or Saturday
        workingDays.push(dateStr);
      }
    }
  }
  
  return workingDays;
};

// Fetch attendance days count for an employee
export const getAttendanceDaysCount = async (
  userId: string,
  userType: 'officer' | 'staff',
  officerId: string | undefined,
  month: number,
  year: number
): Promise<{ daysPresent: number; attendanceDates: Set<string>; totalHours: number; totalOvertimeHours: number }> => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  let daysPresent = 0;
  let totalHours = 0;
  let totalOvertimeHours = 0;
  const attendanceDates = new Set<string>();
  
  if (userType === 'officer' && officerId) {
    const { data } = await supabase
      .from('officer_attendance')
      .select('date, status, total_hours_worked, overtime_hours')
      .eq('officer_id', officerId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (data) {
      for (const record of data) {
        if (record.status === 'checked_out' || record.status === 'checked_in' || record.status === 'present') {
          daysPresent++;
          attendanceDates.add(record.date);
          totalHours += record.total_hours_worked || 0;
          totalOvertimeHours += record.overtime_hours || 0;
        }
      }
    }
  } else {
    const { data } = await supabase
      .from('staff_attendance')
      .select('date, status, total_hours_worked, overtime_hours')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate);
    
    if (data) {
      for (const record of data) {
        if (record.status === 'checked_out' || record.status === 'checked_in' || record.status === 'present') {
          daysPresent++;
          attendanceDates.add(record.date);
          totalHours += record.total_hours_worked || 0;
          totalOvertimeHours += record.overtime_hours || 0;
        }
      }
    }
  }
  
  return { daysPresent, attendanceDates, totalHours, totalOvertimeHours };
};

// Get approved leave days
export const getApprovedLeaveDays = async (
  userId: string,
  month: number,
  year: number
): Promise<{ leaveDays: number; leaveDates: Set<string> }> => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  
  const { data: leaveRecords } = await supabase
    .from('leave_applications')
    .select('start_date, end_date, is_lop')
    .eq('applicant_id', userId)
    .eq('status', 'approved')
    .or(`start_date.gte.${startDate},end_date.lte.${endDate}`);
  
  const leaveDates = new Set<string>();
  
  if (leaveRecords) {
    for (const leave of leaveRecords) {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      
      const loopStart = start.getTime() > monthStart.getTime() ? start : monthStart;
      const loopEnd = end.getTime() < monthEnd.getTime() ? end : monthEnd;
      
      for (let d = new Date(loopStart); d <= loopEnd; d.setDate(d.getDate() + 1)) {
        leaveDates.add(d.toISOString().split('T')[0]);
      }
    }
  }
  
  return { leaveDays: leaveDates.size, leaveDates };
};

// Get holidays (company-wide or institution-specific)
export const getHolidaysInMonth = async (
  month: number, 
  year: number, 
  institutionId?: string
): Promise<Set<string>> => {
  const holidayDates = new Set<string>();
  
  // Fetch company holidays
  const { data: companyHolidays } = await supabase
    .from('company_holidays')
    .select('date')
    .eq('year', year);
  
  if (companyHolidays) {
    for (const h of companyHolidays) {
      const holidayDate = new Date(h.date);
      const hMonth = holidayDate.getMonth() + 1;
      if (hMonth === month) {
        holidayDates.add(formatDateLocal(holidayDate));
      }
    }
  }
  
  // If institution is specified, also fetch institution-specific holidays
  if (institutionId) {
    const { data: institutionHolidays } = await supabase
      .from('institution_holidays')
      .select('date')
      .eq('institution_id', institutionId)
      .eq('year', year);
    
    if (institutionHolidays) {
      for (const h of institutionHolidays) {
        const holidayDate = new Date(h.date);
        const hMonth = holidayDate.getMonth() + 1;
        if (hMonth === month) {
          holidayDates.add(formatDateLocal(holidayDate));
        }
      }
    }
  }
  
  return holidayDates;
};

// Fetch all employees with REAL attendance data
export const fetchAllEmployees = async (month?: number, year?: number): Promise<EmployeePayrollSummary[]> => {
  const employees: EmployeePayrollSummary[] = [];
  const currentMonth = month || new Date().getMonth() + 1;
  const currentYear = year || new Date().getFullYear();
  
  // Get holidays once
  const holidays = await getHolidaysInMonth(currentMonth, currentYear);
  
  try {
    // 1. Fetch all officers with join date
    const { data: officers, error: officerError } = await supabase
      .from('officers')
      .select(`
        id,
        user_id,
        full_name,
        email,
        department,
        annual_salary,
        assigned_institutions,
        status,
        join_date
      `)
      .eq('status', 'active');
    
    if (officerError) {
      console.error('Error fetching officers:', officerError);
    }
    
    if (officers) {
      for (const officer of officers) {
        const monthlySalary = (officer.annual_salary || 0) / 12;
        const joinDate = officer.join_date ? new Date(officer.join_date) : undefined;
        
        // Get actual attendance data
        const { daysPresent, attendanceDates, totalHours, totalOvertimeHours } = await getAttendanceDaysCount(
          officer.user_id || officer.id, 
          'officer', 
          officer.id, 
          currentMonth, 
          currentYear
        );
        
        // Get approved leave
        const { leaveDays, leaveDates } = await getApprovedLeaveDays(
          officer.user_id || officer.id, 
          currentMonth, 
          currentYear
        );
        
        // Calculate prorated salary using 30-day standard (calendar days from join date)
        const perDaySalary = calculatePerDaySalary(monthlySalary);
        let proratedSalary = monthlySalary;
        
        if (joinDate) {
          const monthStart = new Date(currentYear, currentMonth - 1, 1);
          const monthEnd = new Date(currentYear, currentMonth, 0);
          
          if (joinDate > monthEnd) {
            proratedSalary = 0; // Joined after this month
          } else if (joinDate > monthStart) {
            // Prorate from join date to end of month using calendar days
            const daysInMonth = monthEnd.getDate();
            const daysWorked = daysInMonth - joinDate.getDate() + 1;
            proratedSalary = perDaySalary * daysWorked;
          }
        }
        
        // Calculate working days from join date for tracking not marked days
        // Use institution calendar for officers
        const workingDays = await getWorkingDaysInMonth(currentYear, currentMonth, joinDate, 'institution', officer.assigned_institutions?.[0]);
        const workingDaysExcludingHolidays = workingDays.filter(d => !holidays.has(d));
        
        // Days Not Marked = Working days - Present days - Leave days
        const coveredDays = new Set([...attendanceDates, ...leaveDates]);
        const uncoveredWorkingDays = workingDaysExcludingHolidays.filter(d => !coveredDays.has(d));
        const daysNotMarked = uncoveredWorkingDays.length;
        
        // Days LOP = 0 by default (CEO/HR marks LOP manually)
        // For now, we'll consider uncovered working days as LOP candidates
        const daysLop = 0; // Will be marked manually by CEO/HR
        
        // LOP Deduction = Days Not Marked × Per Day Salary (since days_lop is 0 initially)
        const lopDeduction = perDaySalary * daysNotMarked;
        const netPay = proratedSalary - lopDeduction;
        
        employees.push({
          user_id: officer.user_id || officer.id,
          user_type: 'officer',
          officer_id: officer.id,
          name: officer.full_name,
          email: officer.email,
          department: officer.department || 'STEM',
          institution_id: officer.assigned_institutions?.[0],
          join_date: officer.join_date || undefined,
          monthly_salary: monthlySalary,
          per_day_salary: perDaySalary,
          days_present: daysPresent,
          days_absent: daysNotMarked,
          days_leave: leaveDays,
          days_lop: daysLop,
          days_not_marked: daysNotMarked,
          uninformed_leave_days: daysNotMarked,
          overtime_hours: totalOvertimeHours,
          overtime_pending_approval: 0,
          total_hours_worked: totalHours,
          gross_salary: proratedSalary,
          total_deductions: lopDeduction,
          net_pay: netPay,
          payroll_status: 'draft'
        });
      }
    }
    
    // 2. Fetch ALL staff with positions (from profiles)
    const { data: staffProfiles, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        position_id,
        institution_id,
        hourly_rate,
        join_date,
        is_ceo,
        positions:position_id (
          id,
          display_name,
          position_name,
          is_ceo_position
        )
      `)
      .not('position_id', 'is', null);
    
    if (profileError) {
      console.error('Error fetching staff profiles:', profileError);
    }
    
    if (staffProfiles) {
      for (const profile of staffProfiles) {
        // Skip if already added as officer
        if (employees.some(e => e.user_id === profile.id)) continue;
        
        const position = profile.positions as unknown as { display_name: string; position_name: string; is_ceo_position?: boolean } | null;
        
        // Skip CEO
        if (profile.is_ceo || position?.is_ceo_position) continue;
        
        const hourlyRate = profile.hourly_rate || 500;
        const monthlySalary = hourlyRate * 8 * 22;
        const joinDate = profile.join_date ? new Date(profile.join_date) : undefined;
        
        // Get actual attendance data
        const { daysPresent, attendanceDates, totalHours, totalOvertimeHours } = await getAttendanceDaysCount(
          profile.id, 
          'staff', 
          undefined, 
          currentMonth, 
          currentYear
        );
        
        // Get approved leave
        const { leaveDays, leaveDates } = await getApprovedLeaveDays(profile.id, currentMonth, currentYear);
        
        // Calculate prorated salary using 30-day standard (calendar days from join date)
        const perDaySalary = calculatePerDaySalary(monthlySalary);
        let proratedSalary = monthlySalary;
        
        if (joinDate) {
          const monthStart = new Date(currentYear, currentMonth - 1, 1);
          const monthEnd = new Date(currentYear, currentMonth, 0);
          
          if (joinDate > monthEnd) {
            proratedSalary = 0; // Joined after this month
          } else if (joinDate > monthStart) {
            // Prorate from join date to end of month using calendar days
            const daysInMonth = monthEnd.getDate();
            const daysWorked = daysInMonth - joinDate.getDate() + 1;
            proratedSalary = perDaySalary * daysWorked;
          }
        }
        
        // Calculate working days from join date for tracking not marked days
        // Use company calendar for staff
        const workingDays = await getWorkingDaysInMonth(currentYear, currentMonth, joinDate, 'company');
        const workingDaysExcludingHolidays = workingDays.filter(d => !holidays.has(d));
        
        // Days Not Marked = Working days - Present days - Leave days
        const coveredDays = new Set([...attendanceDates, ...leaveDates]);
        const uncoveredWorkingDays = workingDaysExcludingHolidays.filter(d => !coveredDays.has(d));
        const daysNotMarked = uncoveredWorkingDays.length;
        
        // Days LOP = 0 by default (CEO/HR marks LOP manually)
        const daysLop = 0;
        
        // LOP Deduction = Days Not Marked × Per Day Salary
        const lopDeduction = perDaySalary * daysNotMarked;
        const netPay = proratedSalary - lopDeduction;
        
        employees.push({
          user_id: profile.id,
          user_type: 'staff',
          position_id: profile.position_id || undefined,
          name: profile.name,
          email: profile.email,
          position_name: position?.display_name || position?.position_name,
          institution_id: profile.institution_id || undefined,
          join_date: profile.join_date || undefined,
          monthly_salary: monthlySalary,
          per_day_salary: perDaySalary,
          days_present: daysPresent,
          days_absent: daysNotMarked,
          days_leave: leaveDays,
          days_lop: daysLop,
          days_not_marked: daysNotMarked,
          uninformed_leave_days: daysNotMarked,
          overtime_hours: totalOvertimeHours,
          overtime_pending_approval: 0,
          total_hours_worked: totalHours,
          gross_salary: proratedSalary,
          total_deductions: lopDeduction,
          net_pay: netPay,
          payroll_status: 'draft',
          is_ceo: false
        });
      }
    }
    
    return employees;
  } catch (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
};

// Fetch payroll dashboard stats
export const fetchPayrollDashboardStats = async (month: number, year: number): Promise<PayrollDashboardStats> => {
  const employees = await fetchAllEmployees(month, year);
  
  // Fetch overtime requests
  const { data: overtimeRequests } = await supabase
    .from('overtime_requests')
    .select('id, requested_hours, status')
    .eq('status', 'pending');
  
  const pendingOvertimeRequests = overtimeRequests?.length || 0;
  const totalOvertimeHours = overtimeRequests?.reduce((sum, r) => sum + (r.requested_hours || 0), 0) || 0;
  
  // Calculate totals from real data
  const totalPayrollCost = employees.reduce((sum, e) => sum + e.net_pay, 0);
  const totalLopDeductions = employees.reduce((sum, e) => sum + e.total_deductions, 0);
  const uninformedLeaveCount = employees.reduce((sum, e) => sum + e.days_lop, 0);
  
  return {
    total_employees: employees.length,
    total_payroll_cost: totalPayrollCost,
    total_overtime_hours: totalOvertimeHours,
    pending_overtime_requests: pendingOvertimeRequests,
    total_lop_deductions: totalLopDeductions,
    pending_payroll_count: 0,
    uninformed_leave_count: uninformedLeaveCount
  };
};

// Fetch daily attendance for a specific date range
export const fetchDailyAttendance = async (
  startDate: string,
  endDate: string
): Promise<DailyAttendanceRecord[]> => {
  const records: DailyAttendanceRecord[] = [];
  
  try {
    // Fetch officer attendance
    const { data: officerAttendance, error: officerError } = await supabase
      .from('officer_attendance')
      .select(`
        id,
        officer_id,
        date,
        check_in_time,
        check_out_time,
        check_in_address,
        check_out_address,
        total_hours_worked,
        overtime_hours,
        status,
        notes,
        officers:officer_id (
          full_name,
          user_id
        )
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (officerError) {
      console.error('Error fetching officer attendance:', officerError);
    }
    
    if (officerAttendance) {
      for (const record of officerAttendance) {
        const officer = record.officers as unknown as { full_name: string; user_id: string } | null;
        
        const checkInTime = record.check_in_time ? new Date(record.check_in_time) : null;
        const isLate = checkInTime ? checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30) : false;
        const missedCheckout = record.check_in_time && !record.check_out_time && record.status !== 'checked_in';
        
        records.push({
          id: record.id,
          user_id: officer?.user_id || record.officer_id,
          user_name: officer?.full_name || 'Unknown',
          user_type: 'officer',
          date: record.date,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          check_in_address: record.check_in_address,
          check_out_address: record.check_out_address,
          total_hours_worked: record.total_hours_worked || 0,
          overtime_hours: record.overtime_hours || 0,
          status: record.status || 'unknown',
          is_late: isLate,
          missed_checkout: missedCheckout || false,
          is_uninformed_absence: false,
          notes: record.notes
        });
      }
    }
    
    // Fetch staff attendance
    const { data: staffAttendance, error: staffError } = await supabase
      .from('staff_attendance')
      .select(`
        id,
        user_id,
        date,
        check_in_time,
        check_out_time,
        check_in_address,
        check_out_address,
        total_hours_worked,
        overtime_hours,
        status,
        notes
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    
    if (staffError) {
      console.error('Error fetching staff attendance:', staffError);
    }
    
    if (staffAttendance) {
      const userIds = staffAttendance.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.name]) || []);
      
      for (const record of staffAttendance) {
        const checkInTime = record.check_in_time ? new Date(record.check_in_time) : null;
        const isLate = checkInTime ? checkInTime.getHours() > 9 || (checkInTime.getHours() === 9 && checkInTime.getMinutes() > 30) : false;
        const missedCheckout = record.check_in_time && !record.check_out_time && record.status !== 'checked_in';
        
        records.push({
          id: record.id,
          user_id: record.user_id,
          user_name: profileMap.get(record.user_id) || 'Unknown',
          user_type: 'staff',
          date: record.date,
          check_in_time: record.check_in_time,
          check_out_time: record.check_out_time,
          check_in_address: record.check_in_address,
          check_out_address: record.check_out_address,
          total_hours_worked: record.total_hours_worked || 0,
          overtime_hours: record.overtime_hours || 0,
          status: record.status || 'unknown',
          is_late: isLate,
          missed_checkout: missedCheckout || false,
          is_uninformed_absence: false,
          notes: record.notes
        });
      }
    }
    
    return records;
  } catch (error) {
    console.error('Error fetching daily attendance:', error);
    return [];
  }
};

// Fetch calendar data for a month with optional employee type filter
export const fetchCalendarData = async (
  month: number, 
  year: number,
  filters?: CalendarFilters
): Promise<CalendarDayData[]> => {
  const calendarDays: CalendarDayData[] = [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const employeeTypeFilter = filters?.employeeType || 'all';
  
  // Get all attendance for the month
  const startDateStr = formatDateLocal(startDate);
  const endDateStr = formatDateLocal(endDate);
  let allRecords = await fetchDailyAttendance(startDateStr, endDateStr);
  
  // Filter records by employee type
  if (employeeTypeFilter !== 'all') {
    allRecords = allRecords.filter(r => r.user_type === employeeTypeFilter);
  }
  
  // Build holiday map based on employee type filter
  const holidayMap = new Map<string, string>();
  
  // For staff or all employees, include company holidays
  if (employeeTypeFilter === 'all' || employeeTypeFilter === 'staff') {
    const { data: companyHolidays } = await supabase
      .from('company_holidays')
      .select('date, name')
      .eq('year', year);
    
    if (companyHolidays) {
      for (const h of companyHolidays) {
        const holidayDate = new Date(h.date);
        const hMonth = holidayDate.getMonth() + 1;
        if (hMonth === month) {
          holidayMap.set(formatDateLocal(holidayDate), h.name);
        }
      }
    }
  }
  
  // For officers or all employees, include institution holidays
  if (employeeTypeFilter === 'all' || employeeTypeFilter === 'officer') {
    const { data: institutionHolidays } = await supabase
      .from('institution_holidays')
      .select('date, name')
      .eq('year', year);
    
    if (institutionHolidays) {
      for (const h of institutionHolidays) {
        const holidayDate = new Date(h.date);
        const hMonth = holidayDate.getMonth() + 1;
        if (hMonth === month) {
          // Only add if not already in map (company holiday takes precedence for naming)
          const dateKey = formatDateLocal(holidayDate);
          if (!holidayMap.has(dateKey)) {
            holidayMap.set(dateKey, h.name);
          }
        }
      }
    }
  }
  
  // Get all employees for "absent" calculation
  let employees = await fetchAllEmployees(month, year);
  if (employeeTypeFilter !== 'all') {
    employees = employees.filter(e => e.user_type === employeeTypeFilter);
  }
  const employeeCount = employees.length;
  
  // Build calendar data for each day
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateLocal(d);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayMap.has(dateStr);
    const isToday = d.getTime() === today.getTime();
    const isFuture = d > today;
    
    // Get records for this day
    const dayRecords = allRecords.filter(r => r.date === dateStr);
    
    // Calculate counts
    const presentCount = dayRecords.filter(r => 
      r.status === 'checked_out' || r.status === 'checked_in' || r.status === 'present'
    ).length;
    const lateCount = dayRecords.filter(r => r.is_late).length;
    const leaveCount = dayRecords.filter(r => r.status === 'leave').length;
    const noPayCount = dayRecords.filter(r => r.status === 'no_pay').length;
    
    // Absent = employees who should have been present but weren't
    let absentCount = 0;
    if (!isWeekend && !isHoliday && !isFuture) {
      absentCount = Math.max(0, employeeCount - presentCount - leaveCount);
    }
    
    calendarDays.push({
      date: dateStr,
      dayOfMonth: d.getDate(),
      isWeekend,
      isHoliday,
      holidayName: holidayMap.get(dateStr),
      isToday,
      isFuture,
      attendance: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        leave: leaveCount,
        noPay: noPayCount
      },
      records: dayRecords
    });
  }
  
  return calendarDays;
};

// Detect uninformed leave (days without check-in and no approved leave)
export const detectUninformedLeave = async (
  userId: string,
  month: number,
  year: number,
  userType: 'officer' | 'staff'
): Promise<string[]> => {
  const uninformedDays: string[] = [];
  
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const workingDays = await getWorkingDaysInMonth(year, month, undefined, userType === 'officer' ? 'institution' : 'company');
    
    // Get days with attendance
    let attendanceDays = new Set<string>();
    
    if (userType === 'officer') {
      const { data: attendanceRecords } = await supabase
        .from('officer_attendance')
        .select('date')
        .eq('officer_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
      attendanceDays = new Set(attendanceRecords?.map(r => r.date) || []);
    } else {
      const { data: attendanceRecords } = await supabase
        .from('staff_attendance')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
      attendanceDays = new Set(attendanceRecords?.map(r => r.date) || []);
    }
    
    // Get days with approved leave
    const { leaveDates } = await getApprovedLeaveDays(userId, month, year);
    
    // Get company holidays
    const holidays = await getHolidaysInMonth(month, year);
    
    // Find uninformed days
    for (const day of workingDays) {
      if (attendanceDays.has(day)) continue;
      if (leaveDates.has(day)) continue;
      if (holidays.has(day)) continue;
      uninformedDays.push(day);
    }
    
    return uninformedDays;
  } catch (error) {
    console.error('Error detecting uninformed leave:', error);
    return [];
  }
};

// Fetch overtime requests
export const fetchOvertimeRequests = async (
  status?: 'pending' | 'approved' | 'rejected'
): Promise<OvertimeRequest[]> => {
  try {
    let query = supabase
      .from('overtime_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching overtime requests:', error);
      return [];
    }
    
    const userIds = data?.map(r => r.user_id) || [];
    
    // Guard: avoid 400 error when userIds is empty
    if (userIds.length === 0) {
      return [];
    }
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, position_id, positions:position_id(display_name)')
      .in('id', userIds);
    
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    
    return (data || []).map(request => {
      const profile = profileMap.get(request.user_id);
      const position = profile?.positions as unknown as { display_name: string } | null;
      
      return {
        id: request.id,
        user_id: request.user_id,
        user_name: profile?.name || 'Unknown',
        user_type: request.user_type || 'staff',
        position_name: position?.display_name,
        date: request.date,
        requested_hours: request.requested_hours,
        reason: request.reason,
        status: request.status as 'pending' | 'approved' | 'rejected',
        approved_by: request.approved_by,
        approved_by_name: request.approved_by_name,
        approved_at: request.approved_at,
        rejection_reason: request.rejection_reason,
        calculated_pay: request.calculated_pay || 0,
        created_at: request.created_at
      };
    });
  } catch (error) {
    console.error('Error fetching overtime requests:', error);
    return [];
  }
};

// Approve overtime request
export const approveOvertimeRequest = async (
  requestId: string,
  approverId: string,
  approverName: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('overtime_requests')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_by_name: approverName,
        approved_at: new Date().toISOString()
      })
      .eq('id', requestId);
    
    if (error) {
      console.error('Error approving overtime request:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error approving overtime request:', error);
    return false;
  }
};

// Reject overtime request
export const rejectOvertimeRequest = async (
  requestId: string,
  approverId: string,
  approverName: string,
  rejectionReason: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('overtime_requests')
      .update({
        status: 'rejected',
        approved_by: approverId,
        approved_by_name: approverName,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason
      })
      .eq('id', requestId);
    
    if (error) {
      console.error('Error rejecting overtime request:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error rejecting overtime request:', error);
    return false;
  }
};

// Create attendance record for a missing day
export const createAttendanceRecord = async (
  userId: string,
  userType: 'officer' | 'staff',
  date: string,
  status: string,
  checkInTime?: string,
  checkOutTime?: string,
  notes?: string,
  institutionId?: string
): Promise<boolean> => {
  try {
    const recordData: Record<string, any> = {
      date,
      status,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (checkInTime) {
      recordData.check_in_time = new Date(`${date}T${checkInTime}:00`).toISOString();
    }
    
    if (checkOutTime) {
      recordData.check_out_time = new Date(`${date}T${checkOutTime}:00`).toISOString();
      
      if (checkInTime) {
        const checkIn = new Date(`${date}T${checkInTime}:00`);
        const checkOut = new Date(`${date}T${checkOutTime}:00`);
        recordData.total_hours_worked = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60));
      }
    }
    
    if (userType === 'officer') {
      // Need to get officer_id from user_id
      const { data: officer } = await supabase
        .from('officers')
        .select('id, assigned_institutions')
        .eq('user_id', userId)
        .single();
      
      if (!officer) {
        console.error('Officer not found for user:', userId);
        return false;
      }
      
      const officerRecordData = {
        ...recordData,
        officer_id: officer.id,
        institution_id: institutionId || officer.assigned_institutions?.[0]
      };
      
      const { error } = await supabase.from('officer_attendance').insert(officerRecordData);
      if (error) throw error;
    } else {
      const staffRecordData = {
        ...recordData,
        user_id: userId,
        institution_id: institutionId || undefined
      };
      
      const { error } = await supabase.from('staff_attendance').insert(staffRecordData);
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating attendance record:', error);
    return false;
  }
};

// Generate payroll for a month
export const generateMonthlyPayroll = async (
  userId: string,
  userType: 'officer' | 'staff',
  month: number,
  year: number,
  monthlySalary: number
): Promise<string | null> => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Calculate working days
    let workingDays = 0;
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
    }
    
    // Detect uninformed leave
    const uninformedDays = await detectUninformedLeave(userId, month, year, userType);
    const uninformedLeaveDays = uninformedDays.length;
    
    // Calculate LOP deduction
    const lopDeduction = calculateLOPDeduction(monthlySalary, uninformedLeaveDays);
    const netPay = monthlySalary - lopDeduction;
    
    // Insert or update payroll record
    const { data, error } = await supabase
      .from('payroll_records')
      .upsert({
        user_id: userId,
        user_type: userType,
        month,
        year,
        working_days: workingDays,
        days_lop: uninformedLeaveDays,
        uninformed_leave_days: uninformedLeaveDays,
        monthly_salary: monthlySalary,
        lop_deduction: lopDeduction,
        gross_salary: monthlySalary,
        total_deductions: lopDeduction,
        net_pay: netPay,
        status: 'draft'
      }, {
        onConflict: 'user_id,month,year'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Error generating payroll:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error generating payroll:', error);
    return null;
  }
};

// Fetch payroll records
export const fetchPayrollRecords = async (
  month?: number,
  year?: number,
  status?: string
): Promise<any[]> => {
  try {
    let query = supabase
      .from('payroll_records')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (month) query = query.eq('month', month);
    if (year) query = query.eq('year', year);
    if (status) query = query.eq('status', status);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching payroll records:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching payroll records:', error);
    return [];
  }
};
