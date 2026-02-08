/**
 * Individual Attendance Management Tab
 * Comprehensive view with holidays, weekends, leaves, overtime approvals
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  User,
  Calendar,
  Clock,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Timer,
  Percent,
  TreePalm,
  CalendarOff,
  CalendarCheck,
  Wallet,
  FileText,
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isAfter, subMonths, getDaysInMonth } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { PayslipDialog } from './PayslipDialog';
import { getPayrollConfig, getOfficerSalaryDetails, getStaffSalaryDetails } from '@/services/payrollConfig.service';
import { SalaryStructure, StatutoryInfo, PayrollConfig, calculatePFDeduction, calculateESIDeduction, calculateProfessionalTax } from '@/types/payroll';
import { calendarDayTypeService } from '@/services/calendarDayType.service';

interface DayRecord {
  date: string;
  dayOfWeek: string;
  dayType: 'working' | 'weekend' | 'holiday' | 'leave';
  
  // Attendance data
  attendance_id: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours_worked: number | null;
  status: 'present' | 'late' | 'unmarked' | 'holiday' | 'weekend' | 'leave' | 'future';
  
  // Late info
  is_late: boolean;
  late_minutes: number;
  
  // Leave info
  leave_type?: string;
  leave_id?: string;
  is_paid_leave?: boolean;
  
  // Overtime info
  overtime_hours: number | null;
  overtime_status?: 'pending' | 'approved' | 'rejected' | null;
  overtime_id?: string;
  
  // Holiday info
  holiday_name?: string;
  is_paid_holiday?: boolean;
  
  // Correction
  is_manual_correction: boolean;
}

interface Employee {
  id: string;
  user_id: string;
  name: string;
  employee_id: string;
  position_name: string | null;
  institution_id: string | null;
  type: 'officer' | 'staff';  // Officer uses officer_attendance + institution_holidays, Staff uses staff_attendance + company_holidays
}

interface IndividualAttendanceTabProps {
  month: number;
  year: number;
}

export function IndividualAttendanceTab({ month, year }: IndividualAttendanceTabProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dayRecords, setDayRecords] = useState<DayRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DayRecord | null>(null);
  const [correctionData, setCorrectionData] = useState({
    check_in_time: '',
    check_out_time: '',
    reason: '',
    attendance_type: 'present' as 'present' | 'paid_leave' | 'lop' | 'leave',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectOvertimeId, setRejectOvertimeId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Local month filter
  const [localMonth, setLocalMonth] = useState(month);
  const [localYear, setLocalYear] = useState(year);
  
  // Salary and payout data
  const [salaryData, setSalaryData] = useState<{
    monthlySalary: number;
    hourlyRate: number;
    overtimeMultiplier: number;
    salaryStructure: SalaryStructure;
    statutoryInfo: StatutoryInfo;
    designation: string | null;
  } | null>(null);
  const [payrollConfig, setPayrollConfig] = useState<PayrollConfig | null>(null);
  const [companyProfile, setCompanyProfile] = useState<{
    company_name: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    logo_url?: string;
  } | null>(null);
  const [editingOvertimePay, setEditingOvertimePay] = useState(false);
  const [customOvertimePay, setCustomOvertimePay] = useState<number | null>(null);
  
  // Payslip dialog
  const [payslipDialogOpen, setPayslipDialogOpen] = useState(false);
  const [payslipData, setPayslipData] = useState<any>(null);

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(year, month - 1), i);
    return {
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: format(date, 'MMMM yyyy')
    };
  });

  // Load employees
  useEffect(() => {
    loadEmployees();
    loadPayrollConfig();
    loadCompanyProfile();
  }, []);

  // Load data when employee selected or month changes
  useEffect(() => {
    if (selectedEmployee) {
      loadAllData();
      loadSalaryData();
    }
  }, [selectedEmployee, localMonth, localYear]);

  const loadPayrollConfig = async () => {
    const config = await getPayrollConfig();
    setPayrollConfig(config);
  };

  const loadCompanyProfile = async () => {
    try {
      const { data } = await supabase
        .from('company_profiles')
        .select('company_name, address, city, state, pincode, logo_url')
        .eq('is_default', true)
        .single();
      
      if (data) {
        setCompanyProfile(data);
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      // Fetch officers
      const { data: officers, error: officersError } = await supabase
        .from('officers')
        .select('id, user_id, full_name, employee_id, department, assigned_institutions')
        .eq('status', 'active')
        .order('full_name');

      if (officersError) throw officersError;

      // Fetch staff from profiles (CEO, AGM, MD, etc.)
      const { data: staffProfiles, error: staffError } = await supabase
        .from('profiles')
        .select('id, name, email, position_name, institution_id')
        .not('position_name', 'is', null)
        .neq('position_name', '')
        .order('name');

      if (staffError) throw staffError;

      // Combine with type indicator
      const employeeList: Employee[] = [
        ...(officers || []).map((o) => ({
          id: o.id,
          user_id: o.user_id || o.id,
          name: o.full_name || '',
          employee_id: o.employee_id || '',
          position_name: o.department || null,
          institution_id: o.assigned_institutions?.[0] || null,
          type: 'officer' as const,
        })),
        ...(staffProfiles || []).map((s) => ({
          id: s.id,
          user_id: s.id,
          name: s.name || '',
          employee_id: s.position_name || '',
          position_name: s.position_name || null,
          institution_id: s.institution_id || null,
          type: 'staff' as const,
        })),
      ];

      setEmployees(employeeList);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const loadSalaryData = async () => {
    if (!selectedEmployee) return;
    
    try {
      if (selectedEmployee.type === 'officer') {
        const details = await getOfficerSalaryDetails(selectedEmployee.id);
        setSalaryData({
          monthlySalary: details.monthlySalary,
          hourlyRate: details.hourlyRate,
          overtimeMultiplier: details.overtimeMultiplier,
          salaryStructure: details.salaryStructure,
          statutoryInfo: details.statutoryInfo,
          designation: details.designation,
        });
      } else {
        const details = await getStaffSalaryDetails(selectedEmployee.id);
        setSalaryData({
          monthlySalary: details.monthlySalary,
          hourlyRate: details.hourlyRate,
          overtimeMultiplier: details.overtimeMultiplier,
          salaryStructure: details.salaryStructure,
          statutoryInfo: details.statutoryInfo,
          designation: details.designation,
        });
      }
    } catch (error) {
      console.error('Error loading salary data:', error);
    }
  };

  const loadAllData = async () => {
    if (!selectedEmployee) return;

    setIsLoading(true);
    try {
      const monthStart = startOfMonth(new Date(localYear, localMonth - 1));
      const monthEnd = endOfMonth(new Date(localYear, localMonth - 1));
      const today = new Date();
      const endDate = isAfter(monthEnd, today) ? today : monthEnd;

      const startDateStr = format(monthStart, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');

      // Determine attendance table and holiday table based on employee type
      const isOfficer = selectedEmployee.type === 'officer';

      // Fetch attendance based on type
      const attendancePromise = isOfficer
        ? supabase
            .from('officer_attendance')
            .select('*')
            .eq('officer_id', selectedEmployee.id)
            .gte('date', startDateStr)
            .lte('date', endDateStr)
        : supabase
            .from('staff_attendance')
            .select('*')
            .eq('user_id', selectedEmployee.user_id)
            .gte('date', startDateStr)
            .lte('date', endDateStr);

      // Fetch holidays and weekends from calendar_day_types based on employee type
      // Officers use institution calendar, Staff use company calendar
      const calendarType = isOfficer ? 'institution' : 'company';
      const institutionIdForCalendar = isOfficer ? selectedEmployee.institution_id : undefined;

      // Fetch all data in parallel
      const [attendanceResult, nonWorkingDaysResult, leavesResult, overtimeResult] = await Promise.all([
        attendancePromise,
        calendarDayTypeService.getNonWorkingDaysInRange(
          calendarType,
          startDateStr,
          endDateStr,
          institutionIdForCalendar || undefined
        ),
        supabase
          .from('leave_applications')
          .select('*')
          .eq('applicant_id', selectedEmployee.user_id)
          .eq('status', 'approved')
          .or(`start_date.lte.${endDateStr},end_date.gte.${startDateStr}`),
        supabase
          .from('overtime_requests')
          .select('*')
          .eq('user_id', selectedEmployee.user_id)
          .gte('date', startDateStr)
          .lte('date', endDateStr),
      ]);

      // Define attendance record type
      interface AttendanceRecord {
        id: string;
        date: string;
        check_in_time: string | null;
        check_out_time: string | null;
        total_hours_worked: number | null;
        overtime_hours: number | null;
        is_late_login: boolean;
        late_minutes: number;
        is_manual_correction: boolean;
        status: string;
      }

      // Create maps for quick lookup
      const attendanceMap = new Map<string, AttendanceRecord>();
      (attendanceResult.data || []).forEach((a) => {
        attendanceMap.set(a.date, a as AttendanceRecord);
      });

      // Build holiday and weekend maps from calendar_day_types result
      const holidayMap = new Map<string, { name: string; is_paid: boolean }>();
      const weekendSet = new Set<string>(nonWorkingDaysResult.weekends);
      nonWorkingDaysResult.holidays.forEach((date) => {
        holidayMap.set(date, { name: 'Holiday', is_paid: true });
      });

      // Store leave data with paid/lop info
      interface LeaveInfo {
        type: string;
        id: string;
        isPaid: boolean;
      }
      const leaveMap = new Map<string, LeaveInfo>();
      let totalPaidLeaveDays = 0;
      let totalLopLeaveDays = 0;
      
      (leavesResult.data || []).forEach((l) => {
        const start = new Date(l.start_date);
        const end = new Date(l.end_date);
        const paidDays = l.paid_days || 0;
        const lopDays = l.lop_days || 0;
        
        // Track totals
        totalPaidLeaveDays += paidDays;
        totalLopLeaveDays += lopDays;
        
        let dayCount = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = format(d, 'yyyy-MM-dd');
          dayCount++;
          // Mark as paid if within paid_days count, otherwise LOP
          const isPaid = dayCount <= paidDays;
          leaveMap.set(dateStr, { type: l.leave_type, id: l.id, isPaid });
        }
      });

      interface OvertimeRecord {
        id: string;
        date: string;
        requested_hours: number;
        status: string;
      }

      const overtimeMap = new Map<string, OvertimeRecord>();
      (overtimeResult.data || []).forEach((o) => {
        overtimeMap.set(o.date, o as OvertimeRecord);
      });

      // Auto-create overtime requests for attendance records with overtime but no request
      const overtimeToCreate: Array<{
        user_id: string;
        user_type: string;
        officer_id: string | null;
        institution_id: string | null;
        date: string;
        requested_hours: number;
        reason: string;
        status: string;
      }> = [];
      
      for (const att of attendanceResult.data || []) {
        if (att.overtime_hours && att.overtime_hours > 0) {
          const hasRequest = overtimeMap.has(att.date);
          if (!hasRequest) {
            overtimeToCreate.push({
              user_id: selectedEmployee.user_id,
              user_type: selectedEmployee.type,
              officer_id: isOfficer ? selectedEmployee.id : null,
              institution_id: selectedEmployee.institution_id,
              date: att.date,
              requested_hours: att.overtime_hours,
              reason: 'Auto-generated from attendance record',
              status: 'pending',
            });
          }
        }
      }

      // Insert missing overtime requests
      if (overtimeToCreate.length > 0) {
        const { data: insertedOvertime } = await supabase
          .from('overtime_requests')
          .insert(overtimeToCreate)
          .select();
        
        // Add to overtime map
        (insertedOvertime || []).forEach((o) => {
          overtimeMap.set(o.date, o);
        });
      }

      // Generate all days from month start to today/month end
      const allDays = eachDayOfInterval({ start: monthStart, end: endDate });

      const records: DayRecord[] = allDays.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        // Use calendar_day_types weekends instead of JavaScript isWeekend()
        const isWeekendDay = weekendSet.has(dateStr);
        const holiday = holidayMap.get(dateStr);
        const leave = leaveMap.get(dateStr);
        const attendance = attendanceMap.get(dateStr);
        const overtime = overtimeMap.get(dateStr);
        const isFutureDay = isAfter(day, today);

        // Determine day type and status
        let dayType: DayRecord['dayType'] = 'working';
        let status: DayRecord['status'] = 'unmarked';

        if (isFutureDay) {
          status = 'future';
        } else if (isWeekendDay) {
          dayType = 'weekend';
          status = 'weekend';
        } else if (holiday) {
          dayType = 'holiday';
          status = 'holiday';
        } else if (leave) {
          dayType = 'leave';
          status = 'leave';
        } else if (attendance) {
          if (attendance.is_late_login) {
            status = 'late';
          } else if (attendance.status === 'checked_in' || attendance.status === 'checked_out') {
            status = 'present';
          }
        }

        return {
          date: dateStr,
          dayOfWeek: format(day, 'EEE'),
          dayType,
          attendance_id: attendance?.id || null,
          check_in_time: attendance?.check_in_time || null,
          check_out_time: attendance?.check_out_time || null,
          total_hours_worked: attendance?.total_hours_worked || null,
          status,
          is_late: attendance?.is_late_login || false,
          late_minutes: attendance?.late_minutes || 0,
          leave_type: leave?.type,
          leave_id: leave?.id,
          is_paid_leave: leave?.isPaid,
          overtime_hours: overtime?.requested_hours || attendance?.overtime_hours || null,
          overtime_status: overtime?.status as DayRecord['overtime_status'] || null,
          overtime_id: overtime?.id,
          holiday_name: holiday?.name,
          is_paid_holiday: holiday?.is_paid,
          is_manual_correction: attendance?.is_manual_correction || false,
        };
      });

      setDayRecords(records);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate stats with new attendance percentage formula
  const calculateStats = () => {
    // Total calendar days in the month
    const totalDaysInMonth = getDaysInMonth(new Date(localYear, localMonth - 1));
    
    // Working days are days where employee was expected to work (not weekend, not holiday, not leave, not future)
    const workingDays = dayRecords.filter((r) => r.dayType === 'working' && r.status !== 'future').length;
    const weekendDays = dayRecords.filter((r) => r.dayType === 'weekend').length;
    const holidays = dayRecords.filter((r) => r.dayType === 'holiday').length;
    const leaveDays = dayRecords.filter((r) => r.dayType === 'leave').length;
    
    // Separate paid leave vs LOP leave
    const paidLeaveDays = dayRecords.filter((r) => r.dayType === 'leave' && r.is_paid_leave === true).length;
    const lopLeaveDays = dayRecords.filter((r) => r.dayType === 'leave' && r.is_paid_leave === false).length;
    
    const presentDays = dayRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
    const lateDays = dayRecords.filter((r) => r.status === 'late').length;
    const unmarkedDays = dayRecords.filter((r) => r.status === 'unmarked').length;
    const totalHours = dayRecords.reduce((sum, r) => sum + (r.total_hours_worked || 0), 0);
    const totalOvertime = dayRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
    const approvedOvertime = dayRecords.filter((r) => r.overtime_status === 'approved')
      .reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
    const pendingOvertimeCount = dayRecords.filter((r) => r.overtime_status === 'pending').length;

    // Total LOP days = approved LOP leaves + unmarked days (unapproved absences)
    const totalLopDays = lopLeaveDays + unmarkedDays;

    // NEW FORMULA: Attendance % = ((Total Days in Month - (LOP Leave Days + Unmarked Days)) × 100) / Total Days in Month
    // Only LOP and unmarked days count against attendance, paid leave doesn't
    const absentDays = totalLopDays;
    const attendancePercentage = totalDaysInMonth > 0 
      ? parseFloat((((totalDaysInMonth - absentDays) * 100) / totalDaysInMonth).toFixed(2))
      : 100;

    return {
      totalDaysInMonth,
      workingDays,
      weekendDays,
      holidays,
      leaveDays,
      paidLeaveDays,
      lopLeaveDays,
      presentDays,
      lateDays,
      unmarkedDays,
      totalLopDays,
      totalHours,
      totalOvertime,
      approvedOvertime,
      pendingOvertimeCount,
      attendancePercentage,
    };
  };

  const stats = selectedEmployee ? calculateStats() : null;

  // Correction handlers
  const openCorrectionDialog = (record: DayRecord) => {
    if (!record.attendance_id && record.status !== 'unmarked') return;
    
    setSelectedRecord(record);
    setCorrectionData({
      check_in_time: record.check_in_time
        ? format(parseISO(record.check_in_time), "yyyy-MM-dd'T'HH:mm")
        : `${record.date}T09:00`,
      check_out_time: record.check_out_time
        ? format(parseISO(record.check_out_time), "yyyy-MM-dd'T'HH:mm")
        : `${record.date}T18:00`,
      reason: '',
      // If it's already a leave day: paid_leave when is_paid_leave=true, otherwise lop
      attendance_type: record.leave_id ? (record.is_paid_leave ? 'paid_leave' : 'lop') : 'present',
    });
    setCorrectionDialogOpen(true);
  };

  const handleSaveCorrection = async () => {
    if (!selectedRecord || !selectedEmployee || !user) return;

    if (!correctionData.reason.trim()) {
      toast.error('Please provide a reason for the correction');
      return;
    }

    setIsSaving(true);
    try {
      const isOfficer = selectedEmployee.type === 'officer';
      const tableName = isOfficer ? 'officer_attendance' : 'staff_attendance';
      const attendanceType = correctionData.attendance_type;
      
      // Leave corrections are stored in leave_applications (NOT in officer_attendance.status)
      if (attendanceType === 'paid_leave' || attendanceType === 'lop' || attendanceType === 'leave') {
        const leaveType = attendanceType === 'leave' ? 'sick' : 'casual';
        const isLop = attendanceType === 'lop';
        const paidDays = isLop ? 0 : 1;
        const lopDays = isLop ? 1 : 0;

        // If there is already an attendance record for this day, remove it to avoid showing times on a leave day.
        if (selectedRecord.attendance_id) {
          const { error: deleteAttendanceError } = await supabase
            .from(tableName)
            .delete()
            .eq('id', selectedRecord.attendance_id);
          if (deleteAttendanceError) throw deleteAttendanceError;
        }

        // Create a single-day approved leave entry
        const leavePayload = {
          applicant_id: selectedEmployee.user_id,
          applicant_name: selectedEmployee.name,
          applicant_type: selectedEmployee.type,
          officer_id: isOfficer ? selectedEmployee.id : null,
          institution_id: selectedEmployee.institution_id,
          start_date: selectedRecord.date,
          end_date: selectedRecord.date,
          leave_type: leaveType,
          reason: correctionData.reason,
          total_days: 1,
          is_lop: isLop,
          paid_days: paidDays,
          lop_days: lopDays,
          status: 'approved',
          final_approved_by: user.id,
          final_approved_by_name: user.name,
          final_approved_at: new Date().toISOString(),
        };

        const { error: leaveInsertError } = await supabase
          .from('leave_applications')
          .insert(leavePayload as never);
        if (leaveInsertError) throw leaveInsertError;

        // Log correction
        await supabase.from('attendance_corrections').insert({
          attendance_id: selectedRecord.attendance_id || 'new',
          attendance_type: selectedEmployee.type,
          field_corrected: 'leave_application',
          original_value: selectedRecord.leave_id ? 'leave' : 'none',
          new_value: `${attendanceType}:${leaveType}:${isLop ? 'lop' : 'paid'}`,
          reason: correctionData.reason,
          corrected_by: user.id,
          corrected_by_name: user.name,
        });

        toast.success(
          attendanceType === 'lop'
            ? 'Marked as LOP'
            : attendanceType === 'leave'
              ? 'Marked as Sick Leave'
              : 'Marked as Casual Leave'
        );
        // Regular attendance correction with check-in/out times
        let totalHoursWorked = null;
        let overtimeHours = null;

        if (correctionData.check_in_time && correctionData.check_out_time) {
          const checkIn = new Date(correctionData.check_in_time);
          const checkOut = new Date(correctionData.check_out_time);
          totalHoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
          overtimeHours = Math.max(0, totalHoursWorked - 8);
        }

        if (selectedRecord.attendance_id) {
          // Update existing record
          const { error: updateError } = await supabase
            .from(tableName)
            .update({
              check_in_time: new Date(correctionData.check_in_time).toISOString(),
              check_out_time: new Date(correctionData.check_out_time).toISOString(),
              total_hours_worked: Math.round(totalHoursWorked! * 100) / 100,
              overtime_hours: Math.round(overtimeHours! * 100) / 100,
              is_manual_correction: true,
              corrected_by: user.id,
              correction_reason: correctionData.reason,
              status: 'checked_out',
            })
            .eq('id', selectedRecord.attendance_id);

          if (updateError) throw updateError;
        } else {
          // Create new attendance record for unmarked day
          const insertData: Record<string, unknown> = {
            date: selectedRecord.date,
            check_in_time: new Date(correctionData.check_in_time).toISOString(),
            check_out_time: new Date(correctionData.check_out_time).toISOString(),
            total_hours_worked: Math.round(totalHoursWorked! * 100) / 100,
            overtime_hours: Math.round(overtimeHours! * 100) / 100,
            is_manual_correction: true,
            corrected_by: user.id,
            correction_reason: correctionData.reason,
            status: 'checked_out',
          };

          if (isOfficer) {
            insertData.officer_id = selectedEmployee.id;
          } else {
            insertData.user_id = selectedEmployee.user_id;
          }
          
          if (selectedEmployee.institution_id) {
            insertData.institution_id = selectedEmployee.institution_id;
          }

          const { error: insertError } = await supabase
            .from(tableName)
            .insert(insertData as never);

          if (insertError) throw insertError;
        }

        // Log correction
        await supabase.from('attendance_corrections').insert({
          attendance_id: selectedRecord.attendance_id || 'new',
          attendance_type: selectedEmployee.type,
          field_corrected: 'check_in_time, check_out_time',
          original_value: `${selectedRecord.check_in_time || 'null'}, ${selectedRecord.check_out_time || 'null'}`,
          new_value: `${correctionData.check_in_time}, ${correctionData.check_out_time}`,
          reason: correctionData.reason,
          corrected_by: user.id,
          corrected_by_name: user.name,
        });

        toast.success('Attendance corrected successfully');
      }
      
      setCorrectionDialogOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error saving correction:', error);
      toast.error('Failed to save correction');
    } finally {
      setIsSaving(false);
    }
  };

  // Overtime approval handlers
  const handleApproveOvertime = async (overtimeId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('overtime_requests')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_by_name: user.name,
          approved_at: new Date().toISOString(),
        })
        .eq('id', overtimeId);

      if (error) throw error;
      toast.success('Overtime approved');
      loadAllData();
    } catch (error) {
      console.error('Error approving overtime:', error);
      toast.error('Failed to approve overtime');
    }
  };

  const openRejectDialog = (overtimeId: string) => {
    setRejectOvertimeId(overtimeId);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectOvertime = async () => {
    if (!rejectOvertimeId || !user || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const { error } = await supabase
        .from('overtime_requests')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_by_name: user.name,
          approved_at: new Date().toISOString(),
          rejection_reason: rejectReason,
        })
        .eq('id', rejectOvertimeId);

      if (error) throw error;
      toast.success('Overtime rejected');
      setRejectDialogOpen(false);
      loadAllData();
    } catch (error) {
      console.error('Error rejecting overtime:', error);
      toast.error('Failed to reject overtime');
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get row background color based on status
  const getRowClassName = (record: DayRecord) => {
    switch (record.status) {
      case 'weekend':
        return 'bg-muted/50';
      case 'holiday':
        return 'bg-purple-50 dark:bg-purple-950/20';
      case 'leave':
        return 'bg-blue-50 dark:bg-blue-950/20';
      case 'unmarked':
        return 'bg-red-50 dark:bg-red-950/20';
      case 'late':
        return 'bg-orange-50 dark:bg-orange-950/20';
      case 'future':
        return 'opacity-50';
      default:
        return '';
    }
  };

  // Status badge component
  const StatusBadge = ({ record }: { record: DayRecord }) => {
    switch (record.status) {
      case 'present':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Present</Badge>;
      case 'late':
        return (
          <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
            Late +{record.late_minutes}m
          </Badge>
        );
      case 'unmarked':
        return <Badge variant="destructive">Unmarked</Badge>;
      case 'holiday':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">Holiday</Badge>;
      case 'weekend':
        return <Badge variant="secondary">Weekend</Badge>;
      case 'leave':
        return (
          <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">
            {record.leave_type || 'Leave'}
          </Badge>
        );
      case 'future':
        return <Badge variant="outline">-</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Employee Selection Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Select Employee</CardTitle>
            <CardDescription>Search and select an employee</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedEmployee?.id === emp.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        selectedEmployee?.id === emp.id ? 'bg-primary-foreground/20' : 'bg-primary/10'
                      }`}
                    >
                      <User
                        className={`h-4 w-4 ${
                          selectedEmployee?.id === emp.id ? 'text-primary-foreground' : 'text-primary'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{emp.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-70">{emp.employee_id}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1">
                          {emp.type === 'officer' ? 'Officer' : 'Staff'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records Panel */}
        <div className="lg:col-span-3 space-y-6">
          {selectedEmployee ? (
            <>
              {/* Month Filter */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedEmployee.name}'s Attendance
                </h3>
                <Select 
                  value={`${localYear}-${String(localMonth).padStart(2, '0')}`}
                  onValueChange={(value) => {
                    const [y, m] = value.split('-');
                    setLocalYear(parseInt(y));
                    setLocalMonth(parseInt(m));
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary Stats - 2 rows of 4 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Calendar className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                    <p className="text-2xl font-bold">{stats?.workingDays}</p>
                    <p className="text-xs text-muted-foreground">Working Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <CheckCircle className="h-5 w-5 mx-auto text-green-500 mb-1" />
                    <p className="text-2xl font-bold text-green-600">{stats?.presentDays}</p>
                    <p className="text-xs text-muted-foreground">Present</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Percent className="h-5 w-5 mx-auto text-emerald-500 mb-1" />
                    <p className="text-2xl font-bold text-emerald-600">{stats?.attendancePercentage}%</p>
                    <p className="text-xs text-muted-foreground">Attendance %</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                    <p className="text-2xl font-bold text-orange-600">{stats?.lateDays}</p>
                    <p className="text-xs text-muted-foreground">Late Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <TreePalm className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                    <p className="text-2xl font-bold text-purple-600">{stats?.holidays}</p>
                    <p className="text-xs text-muted-foreground">Holidays</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <CalendarCheck className="h-5 w-5 mx-auto text-green-500 mb-1" />
                    <p className="text-2xl font-bold text-green-600">{stats?.paidLeaveDays || 0}</p>
                    <p className="text-xs text-muted-foreground">Paid Leave</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <CalendarOff className="h-5 w-5 mx-auto text-red-500 mb-1" />
                    <p className="text-2xl font-bold text-red-600">{stats?.totalLopDays || 0}</p>
                    <p className="text-xs text-muted-foreground">LOP Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Timer className="h-5 w-5 mx-auto text-indigo-500 mb-1" />
                    <p className="text-2xl font-bold text-indigo-600">
                      {(stats?.approvedOvertime || 0).toFixed(1)}h
                      {(stats?.pendingOvertimeCount || 0) > 0 && (
                        <span className="text-xs text-orange-500 ml-1">({stats?.pendingOvertimeCount} pending)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Approved Overtime</p>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Payout Summary Card */}
              {salaryData && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wallet className="h-5 w-5" />
                      Monthly Payout Summary - {format(new Date(localYear, localMonth - 1), 'MMMM yyyy')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Use actual days in month instead of fixed 30
                      const daysInMonth = getDaysInMonth(new Date(localYear, localMonth - 1));
                      const perDaySalary = salaryData.monthlySalary / daysInMonth;
                      // Only deduct for LOP days (approved LOP + unmarked), not paid leave
                      const lopDeduction = perDaySalary * (stats?.totalLopDays || 0);
                      const calculatedOvertimePay = (stats?.approvedOvertime || 0) * salaryData.hourlyRate * salaryData.overtimeMultiplier;
                      const overtimePay = customOvertimePay ?? calculatedOvertimePay;
                      const netPayout = salaryData.monthlySalary - lopDeduction + overtimePay;
                      
                      return (
                        <div className="space-y-4">
                          {/* Per Day Salary Display */}
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                            <div>
                              <p className="text-xs text-muted-foreground uppercase">Per Day Salary ({format(new Date(localYear, localMonth - 1), 'MMMM yyyy')})</p>
                              <p className="text-sm text-muted-foreground">{formatCurrency(salaryData.monthlySalary)} ÷ {daysInMonth} days</p>
                            </div>
                            <p className="text-xl font-bold text-primary">{formatCurrency(perDaySalary)}</p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Monthly Salary</p>
                              <p className="text-xl font-bold">{formatCurrency(salaryData.monthlySalary)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">LOP Deduction ({stats?.totalLopDays} days)</p>
                              <p className="text-xl font-bold text-destructive">-{formatCurrency(lopDeduction)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                                Overtime Pay ({stats?.approvedOvertime?.toFixed(1)}h)
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4"
                                  onClick={() => setEditingOvertimePay(!editingOvertimePay)}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </p>
                              {editingOvertimePay ? (
                                <Input
                                  type="number"
                                  value={customOvertimePay ?? calculatedOvertimePay}
                                  onChange={(e) => setCustomOvertimePay(parseFloat(e.target.value) || 0)}
                                  onBlur={() => setEditingOvertimePay(false)}
                                  className="w-28 h-8"
                                  autoFocus
                                />
                              ) : (
                                <p className="text-xl font-bold text-green-600">+{formatCurrency(overtimePay)}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground uppercase">Net Payout</p>
                              <p className="text-2xl font-bold text-primary">{formatCurrency(netPayout)}</p>
                            </div>
                          </div>
                          <div className="col-span-2 md:col-span-4 pt-2 border-t mt-2">
                            <Button 
                              onClick={() => {
                                const ss = salaryData.salaryStructure;
                                const si = salaryData.statutoryInfo;
                                
                                // Calculate statutory deductions using real info
                                const pfDeduction = si.pf_applicable ? calculatePFDeduction(ss.basic_pay) : 0;
                                const esiDeduction = si.esi_applicable ? calculateESIDeduction(salaryData.monthlySalary) : 0;
                                const ptDeduction = si.pt_applicable ? calculateProfessionalTax(salaryData.monthlySalary, si.pt_state) : 0;
                                
                                const grossEarnings = ss.basic_pay + ss.hra + ss.conveyance_allowance + ss.medical_allowance + ss.special_allowance + overtimePay;
                                const totalDeductions = lopDeduction + pfDeduction + esiDeduction + ptDeduction;
                                
                                const payslip = {
                                  employee_name: selectedEmployee.name,
                                  employee_id: selectedEmployee.employee_id,
                                  designation: salaryData.designation || selectedEmployee.position_name || 'Officer',
                                  institution_name: '',
                                  month: localMonth,
                                  year: localYear,
                                  // Use real salary structure
                                  basic_salary: ss.basic_pay,
                                  hra: ss.hra,
                                  conveyance_allowance: ss.conveyance_allowance,
                                  medical_allowance: ss.medical_allowance,
                                  special_allowance: ss.special_allowance,
                                  overtime_pay: overtimePay,
                                  // Use real statutory deductions
                                  pf_deduction: pfDeduction,
                                  esi: esiDeduction,
                                  professional_tax: ptDeduction,
                                  tds: 0,
                                  lop_deduction: lopDeduction,
                                  working_days: stats?.workingDays || 0,
                                  days_present: stats?.presentDays || 0,
                                  days_leave: stats?.leaveDays || 0,
                                  paid_leave_days: stats?.paidLeaveDays || 0,
                                  lop_leave_days: stats?.lopLeaveDays || 0,
                                  unmarked_days: stats?.unmarkedDays || 0,
                                  days_lop: stats?.totalLopDays || 0,
                                  late_days: stats?.lateDays || 0,
                                  overtime_hours: stats?.approvedOvertime || 0,
                                  total_hours_worked: stats?.totalHours || 0,
                                  gross_earnings: grossEarnings,
                                  total_deductions: totalDeductions,
                                  net_pay: grossEarnings - totalDeductions,
                                };
                                setPayslipData(payslip);
                                setPayslipDialogOpen(true);
                              }}
                              className="w-full"
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              Generate Payslip
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Attendance Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Daily Attendance Records
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(localYear, localMonth - 1), 'MMMM yyyy')} - {selectedEmployee.employee_id}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Day</TableHead>
                            <TableHead>Check-in</TableHead>
                            <TableHead>Check-out</TableHead>
                            <TableHead className="text-center">Hours</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead>Leave/Holiday</TableHead>
                            <TableHead>Overtime</TableHead>
                            <TableHead className="text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayRecords.map((record) => (
                            <TableRow key={record.date} className={getRowClassName(record)}>
                              <TableCell className="font-medium">
                                {format(parseISO(record.date), 'dd MMM')}
                              </TableCell>
                              <TableCell>{record.dayOfWeek}</TableCell>
                              <TableCell>
                                {record.check_in_time ? (
                                  <div className="flex items-center gap-1">
                                    <span>{format(parseISO(record.check_in_time), 'HH:mm')}</span>
                                    {record.is_late && (
                                      <Badge variant="destructive" className="text-xs py-0 px-1">
                                        +{record.late_minutes}m
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">--:--</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {record.check_out_time ? (
                                  format(parseISO(record.check_out_time), 'HH:mm')
                                ) : (
                                  <span className="text-muted-foreground">--:--</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {record.total_hours_worked?.toFixed(1) || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                <StatusBadge record={record} />
                              </TableCell>
                              <TableCell>
                                {record.holiday_name && (
                                  <span className="text-purple-600 text-sm">{record.holiday_name}</span>
                                )}
                                {record.leave_type && (
                                  <span className="text-blue-600 text-sm capitalize">{record.leave_type}</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {(record.overtime_hours || 0) > 0 && (
                                  <div className="flex items-center gap-2">
                                    <Badge className="bg-indigo-500/10 text-indigo-700 border-indigo-500/20">
                                      {record.overtime_hours?.toFixed(1)}h
                                    </Badge>
                                    {record.overtime_status === 'pending' && record.overtime_id && (
                                      <div className="flex gap-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6"
                                          onClick={() => handleApproveOvertime(record.overtime_id!)}
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6"
                                          onClick={() => openRejectDialog(record.overtime_id!)}
                                        >
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        </Button>
                                      </div>
                                    )}
                                    {record.overtime_status === 'approved' && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    {record.overtime_status === 'rejected' && (
                                      <XCircle className="h-4 w-4 text-red-600" />
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {/* Show edit button for present, late, unmarked, or leave statuses - always allow re-editing */}
                                {(record.status === 'present' || record.status === 'late' || record.status === 'unmarked' || record.status === 'leave') && (
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => openCorrectionDialog(record)}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    {record.is_manual_correction && (
                                      <Badge variant="outline" className="text-xs">Edited</Badge>
                                    )}
                                  </div>
                                )}
                                {/* For weekend/holiday, only show Edited badge if manually corrected */}
                                {(record.status === 'weekend' || record.status === 'holiday') && record.is_manual_correction && (
                                  <Badge variant="outline" className="text-xs">Edited</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <User className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an employee to view attendance</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Correction Dialog */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Correct Attendance</DialogTitle>
            <DialogDescription>
              {selectedRecord && format(parseISO(selectedRecord.date), 'EEEE, dd MMMM yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Attendance Type Selector */}
            <div className="space-y-2">
              <Label>Attendance Type</Label>
              <Select
                value={correctionData.attendance_type}
                onValueChange={(value: 'present' | 'paid_leave' | 'lop' | 'leave') => 
                  setCorrectionData((prev) => ({ ...prev, attendance_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Present (with check-in/out)
                    </div>
                  </SelectItem>
                  <SelectItem value="paid_leave">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-blue-500" />
                      Casual Leave (Paid)
                    </div>
                  </SelectItem>
                  <SelectItem value="lop">
                    <div className="flex items-center gap-2">
                      <CalendarOff className="h-4 w-4 text-red-500" />
                      LOP (Loss of Pay)
                    </div>
                  </SelectItem>
                  <SelectItem value="leave">
                    <div className="flex items-center gap-2">
                      <TreePalm className="h-4 w-4 text-amber-500" />
                      Sick Leave (Paid)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Check-in/out fields only for Present type */}
            {correctionData.attendance_type === 'present' && (
              <>
                <div className="space-y-2">
                  <Label>Check-in Time</Label>
                  <Input
                    type="datetime-local"
                    value={correctionData.check_in_time}
                    onChange={(e) => setCorrectionData((prev) => ({ ...prev, check_in_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Check-out Time</Label>
                  <Input
                    type="datetime-local"
                    value={correctionData.check_out_time}
                    onChange={(e) => setCorrectionData((prev) => ({ ...prev, check_out_time: e.target.value }))}
                  />
                </div>
              </>
            )}

            {/* Info message for leave types */}
            {correctionData.attendance_type !== 'present' && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  {correctionData.attendance_type === 'paid_leave' && (
                    <>This day will be marked as <strong>Casual Leave (Paid)</strong> - no salary deduction will be applied.</>
                  )}
                  {correctionData.attendance_type === 'lop' && (
                    <>This day will be marked as <strong>LOP</strong> - salary will be deducted for this day.</>
                  )}
                  {correctionData.attendance_type === 'leave' && (
                    <>This day will be marked as <strong>Sick Leave (Paid)</strong> - no salary deduction will be applied.</>
                  )}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Reason for Correction *</Label>
              <Textarea
                placeholder="Enter reason for this correction..."
                value={correctionData.reason}
                onChange={(e) => setCorrectionData((prev) => ({ ...prev, reason: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCorrection} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Correction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Overtime Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Overtime</DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectOvertime}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payslip Dialog */}
      <PayslipDialog
        open={payslipDialogOpen}
        onOpenChange={setPayslipDialogOpen}
        payslipData={payslipData}
        companyProfile={companyProfile}
      />
    </>
  );
}
