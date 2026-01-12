import { getStudentsByClassAndSection } from './mockStudentData';

export interface StudentAttendanceRecord {
  student_id: string;
  student_name: string;
  roll_number: string;
  class: string;
  section: string;
  month: string; // "2024-01"
  total_classes: number;
  classes_attended: number;
  attendance_percentage: number;
  daily_records: Array<{
    date: string;
    status: 'present' | 'absent';
    session_id: string;
    marked_by_officer: string;
  }>;
}

// Generate attendance for a student
const generateStudentAttendance = (
  studentId: string,
  studentName: string,
  rollNumber: string,
  className: string,
  section: string,
  month: string = '2024-01'
): StudentAttendanceRecord => {
  const totalClasses = 20; // Typical classes in a month
  const attendanceRate = Math.random() > 0.3 ? 0.85 + Math.random() * 0.15 : 0.6 + Math.random() * 0.15; // Most students 85-100%, some 60-75%
  const classesAttended = Math.floor(totalClasses * attendanceRate);
  
  const dailyRecords = [];
  for (let i = 1; i <= totalClasses; i++) {
    const date = `${month}-${String(i + 4).padStart(2, '0')}`;
    const isPresent = i <= classesAttended;
    
    dailyRecords.push({
      date,
      status: isPresent ? 'present' as const : 'absent' as const,
      session_id: `session-${month}-${className}-${section}-${i}`,
      marked_by_officer: isPresent ? 'Dr. Arun Kumar' : 'Dr. Arun Kumar',
    });
  }
  
  return {
    student_id: studentId,
    student_name: studentName,
    roll_number: rollNumber,
    class: className,
    section: section,
    month,
    total_classes: totalClasses,
    classes_attended: classesAttended,
    attendance_percentage: (classesAttended / totalClasses) * 100,
    daily_records: dailyRecords,
  };
};

// Generate attendance records for all students in Springfield
export const mockStudentAttendance: StudentAttendanceRecord[] = [];

// Classes 1-3, Sections A & B
for (let classNum = 1; classNum <= 3; classNum++) {
  ['A', 'B'].forEach(section => {
    const students = getStudentsByClassAndSection('springfield', `Class ${classNum}`, section);
    students.forEach(student => {
      mockStudentAttendance.push(
        generateStudentAttendance(
          student.id,
          student.student_name,
          student.roll_number,
          student.class,
          student.section,
          '2024-01'
        )
      );
    });
  });
}

// Helper functions
export const getStudentAttendanceByClass = (
  institutionId: string,
  className: string,
  section: string,
  month: string = '2024-01'
): StudentAttendanceRecord[] => {
  return mockStudentAttendance.filter(
    record => record.class === className && record.section === section && record.month === month
  );
};

export const getStudentAttendanceById = (
  studentId: string,
  month: string = '2024-01'
): StudentAttendanceRecord | null => {
  return mockStudentAttendance.find(
    record => record.student_id === studentId && record.month === month
  ) || null;
};

export const getAllClassSections = (): Array<{ class: string; section: string; display: string }> => {
  const uniqueSections = new Map<string, { class: string; section: string }>();
  
  mockStudentAttendance.forEach(record => {
    const key = `${record.class}-${record.section}`;
    if (!uniqueSections.has(key)) {
      uniqueSections.set(key, { class: record.class, section: record.section });
    }
  });
  
  return Array.from(uniqueSections.values()).map(item => ({
    class: item.class,
    section: item.section,
    display: `${item.class} ${item.section}`,
  }));
};
