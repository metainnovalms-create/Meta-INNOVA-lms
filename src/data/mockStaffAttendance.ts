import { StaffAttendanceRecord, DailyAttendance } from '@/types/attendance';
import { companyOfficeGPS } from './mockCompanySettings';

/**
 * Generate daily attendance records for November 2025
 */
const generateNovemberAttendance = (
  staffId: string,
  presentDays: number,
  absentDays: number,
  leaveDays: number
): DailyAttendance[] => {
  const records: DailyAttendance[] = [];
  const totalDays = 30; // November has 30 days
  
  // Generate attendance pattern
  let remainingPresent = presentDays;
  let remainingAbsent = absentDays;
  let remainingLeave = leaveDays;
  
  for (let day = 1; day <= totalDays; day++) {
    const date = `2025-11-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(date).getDay();
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    let status: 'present' | 'absent' | 'leave' | 'half_day' = 'present';
    let checkInTime = undefined;
    let checkOutTime = undefined;
    let checkInLocation = undefined;
    let checkOutLocation = undefined;
    let locationValidated = false;
    let totalHours = 0;
    
    // Determine status based on remaining counts
    if (remainingLeave > 0 && Math.random() < 0.1) {
      status = 'leave';
      remainingLeave--;
    } else if (remainingAbsent > 0 && Math.random() < 0.05) {
      status = 'absent';
      remainingAbsent--;
    } else if (remainingPresent > 0) {
      status = 'present';
      remainingPresent--;
      
      // Generate realistic check-in/out times
      const checkInHour = 9 + Math.floor(Math.random() * 2); // 9-11 AM
      const checkInMinute = Math.floor(Math.random() * 60);
      checkInTime = `${String(checkInHour).padStart(2, '0')}:${String(checkInMinute).padStart(2, '0')}`;
      
      const checkOutHour = 17 + Math.floor(Math.random() * 3); // 5-8 PM
      const checkOutMinute = Math.floor(Math.random() * 60);
      checkOutTime = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMinute).padStart(2, '0')}`;
      
      // Calculate hours
      const checkIn = new Date(`2000-01-01 ${checkInTime}`);
      const checkOut = new Date(`2000-01-01 ${checkOutTime}`);
      totalHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      
      // GPS location (slight variation around office)
      const latVariation = (Math.random() - 0.5) * 0.001;
      const lonVariation = (Math.random() - 0.5) * 0.001;
      
      checkInLocation = {
        latitude: companyOfficeGPS.latitude + latVariation,
        longitude: companyOfficeGPS.longitude + lonVariation,
        timestamp: `${date}T${checkInTime}:00Z`,
      };
      
      checkOutLocation = {
        latitude: companyOfficeGPS.latitude + latVariation,
        longitude: companyOfficeGPS.longitude + lonVariation,
        timestamp: `${date}T${checkOutTime}:00Z`,
      };
      
      locationValidated = true;
    }
    
    records.push({
      date,
      status,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      check_in_location: checkInLocation,
      check_out_location: checkOutLocation,
      location_validated: locationValidated,
      total_hours: totalHours,
      notes: status === 'leave' ? 'Approved leave' : undefined,
    });
  }
  
  return records;
};

/**
 * Mock staff attendance data for November 2025
 */
export const mockStaffAttendance: StaffAttendanceRecord[] = [
  {
    staff_id: '6',
    staff_name: 'System Admin CEO',
    employee_id: 'META-CEO-001',
    position: 'ceo',
    department: 'Executive Management',
    month: '2025-11',
    daily_records: generateNovemberAttendance('6', 20, 1, 1),
    present_days: 20,
    absent_days: 1,
    leave_days: 1,
    total_hours_worked: 168,
    overtime_hours: 8,
  },
  {
    staff_id: '7',
    staff_name: 'Managing Director',
    employee_id: 'META-MD-001',
    position: 'md',
    department: 'Executive Management',
    month: '2025-11',
    daily_records: generateNovemberAttendance('7', 21, 0, 1),
    present_days: 21,
    absent_days: 0,
    leave_days: 1,
    total_hours_worked: 176,
    overtime_hours: 8,
  },
  {
    staff_id: '9',
    staff_name: 'AGM Operations',
    employee_id: 'META-AGM-001',
    position: 'agm',
    department: 'Operations',
    month: '2025-11',
    daily_records: generateNovemberAttendance('9', 21, 1, 0),
    present_days: 21,
    absent_days: 1,
    leave_days: 0,
    total_hours_worked: 180,
    overtime_hours: 12,
  },
  {
    staff_id: '10',
    staff_name: 'General Manager',
    employee_id: 'META-GM-001',
    position: 'gm',
    department: 'Operations',
    month: '2025-11',
    daily_records: generateNovemberAttendance('10', 22, 0, 0),
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    total_hours_worked: 184,
    overtime_hours: 8,
  },
  {
    staff_id: '8',
    staff_name: 'Operations Manager',
    employee_id: 'META-MGR-001',
    position: 'manager',
    department: 'Operations',
    month: '2025-11',
    daily_records: generateNovemberAttendance('8', 21, 1, 0),
    present_days: 21,
    absent_days: 1,
    leave_days: 0,
    total_hours_worked: 176,
    overtime_hours: 8,
  },
  {
    staff_id: '11',
    staff_name: 'Admin Staff',
    employee_id: 'META-STAFF-001',
    position: 'admin_staff',
    department: 'Administration',
    month: '2025-11',
    daily_records: generateNovemberAttendance('11', 22, 0, 0),
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    total_hours_worked: 176,
    overtime_hours: 0,
  },
];

/**
 * Get staff attendance by ID and month
 */
export const getStaffAttendance = (staffId: string, month: string): StaffAttendanceRecord | undefined => {
  return mockStaffAttendance.find((record) => record.staff_id === staffId && record.month === month);
};

/**
 * Get all staff attendance for a month
 */
export const getAllStaffAttendanceForMonth = (month: string): StaffAttendanceRecord[] => {
  return mockStaffAttendance.filter((record) => record.month === month);
};
