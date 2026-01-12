/**
 * Officer Attendance Data with GPS Tracking - localStorage Pattern
 * Implements bidirectional synchronization for GPS-based check-in/check-out
 */

export interface OfficerDailyAttendance {
  id: string;
  officer_id: string;
  officer_name: string;
  institution_id: string;
  institution_name: string;
  date: string; // yyyy-MM-dd
  check_in_time: string; // hh:mm a
  check_out_time?: string; // hh:mm a
  check_in_location: {
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
  check_in_validated: boolean; // Within radius?
  check_out_validated?: boolean; // Within radius?
  check_in_distance_meters: number; // Distance from institution
  check_out_distance_meters?: number; // Distance from institution
  total_hours_worked?: number;
  overtime_hours?: number;
  status: 'checked_in' | 'checked_out' | 'not_checked_in';
}

export interface CheckInData {
  officer_id: string;
  officer_name: string;
  institution_id: string;
  institution_name: string;
  date: string;
  check_in_time: string;
  check_in_location: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
  };
  check_in_validated: boolean;
  check_in_distance_meters: number;
}

export interface CheckOutData {
  check_out_time: string;
  check_out_location: {
    latitude: number;
    longitude: number;
    address?: string;
    timestamp: string;
  };
  check_out_validated: boolean;
  check_out_distance_meters: number;
  total_hours_worked: number;
  overtime_hours: number;
}

const STORAGE_KEY = 'officer_attendance';

/**
 * Load all officer attendance records from localStorage
 */
export const loadOfficerAttendance = (): OfficerDailyAttendance[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading officer attendance:', error);
    return [];
  }
};

/**
 * Save officer attendance records to localStorage
 */
export const saveOfficerAttendance = (records: OfficerDailyAttendance[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error saving officer attendance:', error);
  }
};

/**
 * Record officer check-in with GPS location
 */
export const recordOfficerCheckIn = (data: CheckInData): OfficerDailyAttendance => {
  const records = loadOfficerAttendance();
  
  // Check if already checked in today
  const existingRecord = records.find(
    r => r.officer_id === data.officer_id && r.date === data.date
  );
  
  if (existingRecord) {
    console.warn('Officer already checked in today:', existingRecord);
    return existingRecord;
  }
  
  const newRecord: OfficerDailyAttendance = {
    id: `attendance-${data.officer_id}-${data.date}-${Date.now()}`,
    officer_id: data.officer_id,
    officer_name: data.officer_name,
    institution_id: data.institution_id,
    institution_name: data.institution_name,
    date: data.date,
    check_in_time: data.check_in_time,
    check_in_location: data.check_in_location,
    check_in_validated: data.check_in_validated,
    check_in_distance_meters: data.check_in_distance_meters,
    status: 'checked_in',
  };
  
  records.push(newRecord);
  saveOfficerAttendance(records);
  
  return newRecord;
};

/**
 * Record officer check-out with GPS location
 */
export const recordOfficerCheckOut = (officerId: string, date: string, data: CheckOutData): void => {
  const records = loadOfficerAttendance();
  
  const recordIndex = records.findIndex(
    r => r.officer_id === officerId && r.date === date && r.status === 'checked_in'
  );
  
  if (recordIndex === -1) {
    console.error('No check-in record found for officer:', officerId, date);
    return;
  }
  
  records[recordIndex] = {
    ...records[recordIndex],
    check_out_time: data.check_out_time,
    check_out_location: data.check_out_location,
    check_out_validated: data.check_out_validated,
    check_out_distance_meters: data.check_out_distance_meters,
    total_hours_worked: data.total_hours_worked,
    overtime_hours: data.overtime_hours,
    status: 'checked_out',
  };
  
  saveOfficerAttendance(records);
};

/**
 * Get officer attendance for a specific month
 */
export const getOfficerAttendanceByMonth = (
  officerId: string,
  month: string // yyyy-MM
): OfficerDailyAttendance[] => {
  const records = loadOfficerAttendance();
  return records.filter(
    r => r.officer_id === officerId && r.date.startsWith(month)
  );
};

/**
 * Get today's attendance record for an officer
 */
export const getTodayAttendance = (officerId: string): OfficerDailyAttendance | null => {
  const today = new Date().toISOString().split('T')[0];
  const records = loadOfficerAttendance();
  return records.find(r => r.officer_id === officerId && r.date === today) || null;
};

/**
 * Get officer attendance record for a specific month (converts to OfficerAttendanceRecord format)
 */
export const getOfficerAttendanceRecord = (officerId: string, month: string): any => {
  const records = loadOfficerAttendance();
  const monthRecords = records.filter(
    r => r.officer_id === officerId && r.date.startsWith(month)
  );
  
  if (monthRecords.length === 0) return null;
  
  // Calculate summary statistics
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let totalHours = 0;
  
  const dailyRecords = monthRecords.map(record => {
    if (record.status === 'checked_out' || record.status === 'checked_in') {
      presentDays++;
    } else if (record.status === 'not_checked_in') {
      absentDays++;
    }
    
    const hoursWorked = record.total_hours_worked || 0;
    totalHours += hoursWorked;
    
    return {
      date: record.date,
      status: record.status === 'checked_out' || record.status === 'checked_in' ? 'present' : 
              record.status === 'not_checked_in' ? 'absent' : 'leave',
      check_in_time: record.check_in_time,
      check_out_time: record.check_out_time,
      hours_worked: hoursWorked,
      overtime_hours: record.overtime_hours || 0,
      check_in_location: record.check_in_location,
      check_out_location: record.check_out_location,
      location_validated: record.check_in_validated,
    };
  });
  
  return {
    officer_id: officerId,
    officer_name: monthRecords[0].officer_name,
    employee_id: monthRecords[0].officer_id,
    department: 'Innovation & STEM Education',
    month,
    daily_records: dailyRecords,
    present_days: presentDays,
    absent_days: absentDays,
    leave_days: leaveDays,
    total_hours_worked: totalHours,
    last_marked_date: monthRecords[monthRecords.length - 1]?.date || '',
  };
};

/**
 * Get all officers' attendance for a specific month
 */
export const getAllOfficersAttendanceForMonth = (month: string): any[] => {
  const records = loadOfficerAttendance();
  const monthRecords = records.filter(r => r.date.startsWith(month));
  
  // Group by officer_id
  const officerGroups: { [key: string]: OfficerDailyAttendance[] } = {};
  monthRecords.forEach(record => {
    if (!officerGroups[record.officer_id]) {
      officerGroups[record.officer_id] = [];
    }
    officerGroups[record.officer_id].push(record);
  });
  
  // Convert each group to OfficerAttendanceRecord format
  return Object.keys(officerGroups).map(officerId => {
    const officerRecords = officerGroups[officerId];
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let totalHours = 0;
    
    const dailyRecords = officerRecords.map(record => {
      if (record.status === 'checked_out' || record.status === 'checked_in') {
        presentDays++;
      } else if (record.status === 'not_checked_in') {
        absentDays++;
      }
      
      const hoursWorked = record.total_hours_worked || 0;
      totalHours += hoursWorked;
      
      return {
        date: record.date,
        status: record.status === 'checked_out' || record.status === 'checked_in' ? 'present' : 
                record.status === 'not_checked_in' ? 'absent' : 'leave',
        check_in_time: record.check_in_time,
        check_out_time: record.check_out_time,
        hours_worked: hoursWorked,
        overtime_hours: record.overtime_hours || 0,
        check_in_location: record.check_in_location,
        check_out_location: record.check_out_location,
        location_validated: record.check_in_validated,
      };
    });
    
    return {
      officer_id: officerId,
      officer_name: officerRecords[0].officer_name,
      employee_id: officerId,
      department: 'Innovation & STEM Education',
      month,
      daily_records: dailyRecords,
      present_days: presentDays,
      absent_days: absentDays,
      leave_days: leaveDays,
      total_hours_worked: totalHours,
      last_marked_date: officerRecords[officerRecords.length - 1]?.date || '',
    };
  });
};

/**
 * Get all attendance records for an institution
 */
export const getInstitutionAttendance = (institutionId: string): OfficerDailyAttendance[] => {
  const records = loadOfficerAttendance();
  return records.filter(r => r.institution_id === institutionId);
};

/**
 * Get today's attendance for all officers at an institution
 */
export const getInstitutionTodayAttendance = (institutionId: string): OfficerDailyAttendance[] => {
  const today = new Date().toISOString().split('T')[0];
  const records = loadOfficerAttendance();
  return records.filter(
    r => r.institution_id === institutionId && r.date === today
  );
};

/**
 * Delete attendance record (admin only)
 */
export const deleteAttendanceRecord = (recordId: string): boolean => {
  try {
    const records = loadOfficerAttendance();
    const filtered = records.filter(r => r.id !== recordId);
    saveOfficerAttendance(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return false;
  }
};
