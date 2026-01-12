import { mockTeachers } from './mockTeacherData';

export interface TeacherAttendanceRecord {
  teacher_id: string;
  teacher_name: string;
  employee_id: string;
  department: string;
  month: string; // "2024-01"
  daily_records: Array<{
    date: string;
    status: 'present' | 'absent' | 'leave';
    self_reported_time?: string;
    check_in_time?: string;
    check_out_time?: string;
    leave_type?: 'sick' | 'casual' | 'earned';
    leave_reason?: string;
  }>;
  present_days: number;
  absent_days: number;
  leave_days: number;
  last_marked_date: string;
}

// Generate teacher attendance
const generateTeacherAttendance = (
  teacherId: string,
  teacherName: string,
  employeeId: string,
  subjects: string[],
  month: string = '2024-01'
): TeacherAttendanceRecord => {
  const workingDays = 22;
  const attendanceRate = Math.random() > 0.8 ? 0.90 + Math.random() * 0.09 : 0.95 + Math.random() * 0.05; // Most teachers 95-100%, some 90-99%
  const presentDays = Math.floor(workingDays * attendanceRate);
  const leaveDays = Math.floor(Math.random() * 2); // 0-1 leave days
  const absentDays = workingDays - presentDays - leaveDays;
  
  const dailyRecords = [];
  const today = new Date();
  const todayDate = `${month}-${String(today.getDate()).padStart(2, '0')}`;
  
  for (let i = 1; i <= workingDays; i++) {
    const date = `${month}-${String(i + 4).padStart(2, '0')}`;
    
    let status: 'present' | 'absent' | 'leave';
    let checkInTime, checkOutTime, selfReportedTime, leaveType, leaveReason;
    
    if (i <= presentDays) {
      status = 'present';
      checkInTime = `0${8 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} AM`;
      checkOutTime = `0${4 + Math.floor(Math.random() * 2)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} PM`;
      selfReportedTime = checkInTime;
    } else if (i <= presentDays + leaveDays) {
      status = 'leave';
      const leaveTypes: Array<'sick' | 'casual' | 'earned'> = ['sick', 'casual', 'earned'];
      leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
      leaveReason = leaveType === 'sick' ? 'Medical appointment' : leaveType === 'casual' ? 'Personal work' : 'Planned leave';
    } else {
      status = 'absent';
    }
    
    dailyRecords.push({
      date,
      status,
      self_reported_time: selfReportedTime,
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      leave_type: leaveType,
      leave_reason: leaveReason,
    });
  }
  
  return {
    teacher_id: teacherId,
    teacher_name: teacherName,
    employee_id: employeeId,
    department: subjects[0] || 'General',
    month,
    daily_records: dailyRecords,
    present_days: presentDays,
    absent_days: absentDays,
    leave_days: leaveDays,
    last_marked_date: dailyRecords[dailyRecords.length - 1]?.date || todayDate,
  };
};

// Generate attendance for all teachers
export const mockTeacherAttendance: TeacherAttendanceRecord[] = mockTeachers.map(teacher =>
  generateTeacherAttendance(
    teacher.id,
    teacher.name,
    teacher.employee_id,
    teacher.subjects,
    '2024-01'
  )
);

// Helper functions
export const getTeacherAttendanceByInstitution = (
  institutionId: string,
  month: string = '2024-01'
): TeacherAttendanceRecord[] => {
  // For now, return all teachers (in real app, filter by institution)
  return mockTeacherAttendance.filter(record => record.month === month);
};

export const getTeacherAttendanceById = (
  teacherId: string,
  month: string = '2024-01'
): TeacherAttendanceRecord | null => {
  return mockTeacherAttendance.find(
    record => record.teacher_id === teacherId && record.month === month
  ) || null;
};

export const getTodayTeacherStatus = (institutionId: string) => {
  const today = new Date();
  const todayDate = `2024-01-${String(today.getDate()).padStart(2, '0')}`;
  
  let present = 0;
  let absent = 0;
  let notMarked = 0;
  
  mockTeacherAttendance.forEach(record => {
    const todayRecord = record.daily_records.find(r => r.date === todayDate);
    if (todayRecord) {
      if (todayRecord.status === 'present') present++;
      else if (todayRecord.status === 'absent') absent++;
      else notMarked++;
    } else {
      notMarked++;
    }
  });
  
  return { present, absent, notMarked };
};
