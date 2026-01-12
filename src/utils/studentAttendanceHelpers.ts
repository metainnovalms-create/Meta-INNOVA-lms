import { StudentAttendanceRecord } from '@/data/mockStudentAttendance';

export const getClassAttendanceStats = (
  records: StudentAttendanceRecord[]
) => {
  if (records.length === 0) {
    return {
      totalStudents: 0,
      avgAttendance: 0,
      belowThreshold: 0,
      totalClasses: 0,
    };
  }
  
  const totalStudents = records.length;
  const avgAttendance =
    records.reduce((sum, r) => sum + r.attendance_percentage, 0) / totalStudents;
  const belowThreshold = records.filter(r => r.attendance_percentage < 75).length;
  const totalClasses = records[0]?.total_classes || 0;
  
  return {
    totalStudents,
    avgAttendance,
    belowThreshold,
    totalClasses,
  };
};

export const exportStudentAttendanceCSV = (
  data: StudentAttendanceRecord[],
  filename: string
) => {
  const headers = [
    'Student Name',
    'Roll Number',
    'Class',
    'Section',
    'Total Classes',
    'Classes Attended',
    'Attendance %',
  ];
  
  const rows = data.map(record => [
    record.student_name,
    record.roll_number,
    record.class,
    record.section,
    record.total_classes.toString(),
    record.classes_attended.toString(),
    record.attendance_percentage.toFixed(2) + '%',
  ]);
  
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
