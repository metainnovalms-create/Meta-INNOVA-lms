import { TeacherAttendanceRecord } from '@/data/mockTeacherAttendance';

export const getTeacherAttendanceStats = (records: TeacherAttendanceRecord[]) => {
  if (records.length === 0) {
    return {
      totalTeachers: 0,
      avgAttendance: 0,
      presentToday: 0,
      notMarkedToday: 0,
    };
  }
  
  const totalTeachers = records.length;
  const avgAttendance =
    records.reduce((sum, r) => {
      const total = r.present_days + r.absent_days + r.leave_days;
      return sum + (total > 0 ? (r.present_days / total) * 100 : 0);
    }, 0) / totalTeachers;
  
  const today = new Date();
  const todayDate = `2024-01-${String(today.getDate()).padStart(2, '0')}`;
  
  let presentToday = 0;
  let notMarkedToday = 0;
  
  records.forEach(record => {
    const todayRecord = record.daily_records.find(r => r.date === todayDate);
    if (todayRecord && todayRecord.status === 'present') {
      presentToday++;
    } else if (!todayRecord || !todayRecord.self_reported_time) {
      notMarkedToday++;
    }
  });
  
  return {
    totalTeachers,
    avgAttendance,
    presentToday,
    notMarkedToday,
  };
};

export const exportTeacherAttendanceCSV = (
  data: TeacherAttendanceRecord[],
  filename: string
) => {
  const headers = [
    'Teacher Name',
    'Employee ID',
    'Department',
    'Present Days',
    'Absent Days',
    'Leave Days',
    'Attendance %',
    'Last Marked',
  ];
  
  const rows = data.map(record => {
    const total = record.present_days + record.absent_days + record.leave_days;
    const percentage = total > 0 ? ((record.present_days / total) * 100).toFixed(2) : '0.00';
    
    return [
      record.teacher_name,
      record.employee_id,
      record.department,
      record.present_days.toString(),
      record.absent_days.toString(),
      record.leave_days.toString(),
      percentage + '%',
      record.last_marked_date,
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};
