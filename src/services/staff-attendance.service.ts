import { StaffAttendanceRecord, StaffPayrollRecord } from '@/types/attendance';
import type { LocationData } from '@/utils/locationHelpers';
import { getStaffAttendance, mockStaffAttendance } from '@/data/mockStaffAttendance';
import { getStaffPayroll, mockStaffPayroll } from '@/data/mockStaffPayroll';
import { companyOfficeGPS } from '@/data/mockCompanySettings';
import { calculateDistance } from '@/utils/locationHelpers';

export interface CheckInData {
  staff_id: string;
  location: LocationData;
  timestamp: string;
}

export interface CheckOutData {
  staff_id: string;
  location: LocationData;
  timestamp: string;
}

/**
 * Staff Attendance Service - Frontend-first implementation with mock data
 * Ready for backend API integration
 */
export const staffAttendanceService = {
  /**
   * Record staff check-in with GPS location
   */
  async recordStaffCheckIn(data: CheckInData): Promise<{ success: boolean; validated: boolean; message: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Validate location
    const distance = calculateDistance(
      data.location.latitude,
      data.location.longitude,
      companyOfficeGPS.latitude,
      companyOfficeGPS.longitude
    );
    
    const validated = distance <= companyOfficeGPS.radius_meters;
    
    // Store in localStorage for demo
    const todayKey = `staff_checkin_${data.staff_id}_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(todayKey, JSON.stringify({
      ...data,
      validated,
      distance,
    }));
    
    return {
      success: true,
      validated,
      message: validated 
        ? 'Check-in recorded successfully at Meta-Innova Head Office' 
        : 'Check-in recorded but location verification failed. Admin review required.',
    };
  },

  /**
   * Record staff check-out with GPS location
   */
  async recordStaffCheckOut(data: CheckOutData): Promise<{ success: boolean; validated: boolean; message: string }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const distance = calculateDistance(
      data.location.latitude,
      data.location.longitude,
      companyOfficeGPS.latitude,
      companyOfficeGPS.longitude
    );
    
    const validated = distance <= companyOfficeGPS.radius_meters;
    
    const todayKey = `staff_checkout_${data.staff_id}_${new Date().toISOString().split('T')[0]}`;
    localStorage.setItem(todayKey, JSON.stringify({
      ...data,
      validated,
      distance,
    }));
    
    return {
      success: true,
      validated,
      message: validated 
        ? 'Check-out recorded successfully' 
        : 'Check-out recorded but location verification failed.',
    };
  },

  /**
   * Get monthly attendance for a staff member
   */
  async getStaffMonthlyAttendance(staffId: string, month: string): Promise<StaffAttendanceRecord | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getStaffAttendance(staffId, month) || null;
  },

  /**
   * Get all staff attendance for a month
   */
  async getAllStaffAttendanceForMonth(month: string): Promise<StaffAttendanceRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockStaffAttendance.filter((record) => record.month === month);
  },

  /**
   * Get staff payroll for a month
   */
  async getStaffPayroll(staffId: string, month: string): Promise<StaffPayrollRecord | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getStaffPayroll(staffId, month) || null;
  },

  /**
   * Get all staff payroll for a month
   */
  async getAllStaffPayrollForMonth(month: string): Promise<StaffPayrollRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockStaffPayroll.filter((record) => record.month === month);
  },

  /**
   * Update staff salary configuration
   */
  async updateStaffSalaryConfig(
    staffId: string,
    config: {
      hourly_rate: number;
      overtime_multiplier: number;
      normal_hours: number;
    }
  ): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Store in localStorage
    localStorage.setItem(`staff_salary_config_${staffId}`, JSON.stringify(config));
    
    return { success: true };
  },

  /**
   * Approve staff payroll
   */
  async approveStaffPayroll(
    staffId: string,
    month: string,
    approverId: string
  ): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const payrollRecord = mockStaffPayroll.find(
      (p) => p.staff_id === staffId && p.month === month
    );
    
    if (payrollRecord) {
      payrollRecord.status = 'approved';
      payrollRecord.approved_by = approverId;
      payrollRecord.approved_at = new Date().toISOString();
    }
    
    return { success: true };
  },

  /**
   * Export staff attendance to CSV
   */
  async exportStaffAttendanceCSV(staffId: string, month: string): Promise<Blob> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const attendance = getStaffAttendance(staffId, month);
    if (!attendance) {
      throw new Error('Attendance data not found');
    }
    
    // Generate CSV
    const headers = [
      'Date',
      'Status',
      'Check-in Time',
      'Check-out Time',
      'Check-in Location',
      'Check-out Location',
      'Validated',
      'Total Hours',
      'Notes',
    ];
    
    const rows = attendance.daily_records.map((record) => [
      record.date,
      record.status,
      record.check_in_time || '',
      record.check_out_time || '',
      record.check_in_location
        ? `${record.check_in_location.latitude},${record.check_in_location.longitude}`
        : '',
      record.check_out_location
        ? `${record.check_out_location.latitude},${record.check_out_location.longitude}`
        : '',
      record.location_validated ? 'Yes' : 'No',
      record.total_hours?.toString() || '',
      record.notes || '',
    ]);
    
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    
    return new Blob([csv], { type: 'text/csv' });
  },

  /**
   * Validate location against company office GPS
   */
  async validateLocation(location: LocationData): Promise<{ valid: boolean; distance: number }> {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      companyOfficeGPS.latitude,
      companyOfficeGPS.longitude
    );
    
    return {
      valid: distance <= companyOfficeGPS.radius_meters,
      distance: Math.round(distance),
    };
  },

  /**
   * Get today's check-in status for a staff member
   */
  getTodayCheckInStatus(staffId: string): {
    checkedIn: boolean;
    checkedOut: boolean;
    checkInTime?: string;
    checkOutTime?: string;
  } {
    const today = new Date().toISOString().split('T')[0];
    
    const checkInKey = `staff_checkin_${staffId}_${today}`;
    const checkOutKey = `staff_checkout_${staffId}_${today}`;
    
    const checkInData = localStorage.getItem(checkInKey);
    const checkOutData = localStorage.getItem(checkOutKey);
    
    return {
      checkedIn: !!checkInData,
      checkedOut: !!checkOutData,
      checkInTime: checkInData ? JSON.parse(checkInData).timestamp : undefined,
      checkOutTime: checkOutData ? JSON.parse(checkOutData).timestamp : undefined,
    };
  },
};
