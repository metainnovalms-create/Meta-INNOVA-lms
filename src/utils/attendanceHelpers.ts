import { format, getDaysInMonth, startOfMonth, addDays } from 'date-fns';
import { DailyAttendance, OfficerAttendanceRecord } from '@/types/attendance';

export const calculateAttendancePercentage = (
  presentDays: number,
  totalDays: number
): number => {
  if (totalDays === 0) return 0;
  return (presentDays / totalDays) * 100;
};

export const generateMonthCalendarDays = (yearMonth: string): Date[] => {
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  const daysCount = getDaysInMonth(date);
  const firstDay = startOfMonth(date);
  
  const days: Date[] = [];
  for (let i = 0; i < daysCount; i++) {
    days.push(addDays(firstDay, i));
  }
  
  return days;
};

export const getAttendanceForDate = (
  date: Date,
  dailyRecords: DailyAttendance[]
): DailyAttendance | undefined => {
  const dateStr = format(date, 'yyyy-MM-dd');
  return dailyRecords.find(record => record.date === dateStr);
};

export const calculatePayroll = (
  attendance: OfficerAttendanceRecord,
  monthlySalary: number
): number => {
  const totalDays = attendance.present_days + attendance.absent_days + attendance.leave_days;
  if (totalDays === 0) return 0;
  
  // Full pay for present and leave days
  const paidDays = attendance.present_days + attendance.leave_days;
  return (monthlySalary / totalDays) * paidDays;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Calculate daily overtime hours
 * @param checkInTime - Check-in time in 'hh:mm a' format
 * @param checkOutTime - Check-out time in 'hh:mm a' format
 * @param normalHours - Normal working hours per day (default: 8)
 * @returns Overtime hours
 */
export const calculateDailyOvertime = (
  checkInTime: string,
  checkOutTime: string,
  normalHours: number = 8
): number => {
  try {
    const checkIn = new Date(`2000-01-01 ${checkInTime}`);
    const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
    const hoursWorked = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    
    return Math.max(0, hoursWorked - normalHours);
  } catch (error) {
    console.error('Error calculating overtime:', error);
    return 0;
  }
};

/**
 * Calculate total monthly overtime from daily records
 */
export const calculateMonthlyOvertime = (
  dailyRecords: DailyAttendance[],
  normalHours: number = 8
): number => {
  return dailyRecords.reduce((total, record) => {
    if (record.check_in_time && record.check_out_time && record.status === 'present') {
      return total + calculateDailyOvertime(record.check_in_time, record.check_out_time, normalHours);
    }
    return total;
  }, 0);
};

/**
 * Calculate overtime pay
 */
export const calculateOvertimePay = (
  overtimeHours: number,
  hourlyRate: number,
  multiplier: number = 1.5
): number => {
  return overtimeHours * hourlyRate * multiplier;
};

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
