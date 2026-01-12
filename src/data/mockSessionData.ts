import { CourseSessionDelivery } from '@/types/session';

export const mockSessionDeliveries: CourseSessionDelivery[] = [
  {
    id: 'session-1',
    timetable_slot_id: 'slot-1',
    officer_id: 'off-001',
    course_id: 'STEM-101',
    class_name: 'Class 8A',
    date: '2024-02-15',
    start_time: '09:00',
    end_time: '11:00',
    current_module_id: 'mod-stem-2',
    modules_covered: ['mod-stem-1'],
    content_completed: ['content-1', 'content-2', 'content-3'],
    students_present: ['student-1', 'student-2', 'student-3'],
    total_students: 30,
    attendance_percentage: 90,
    status: 'completed',
    created_at: '2024-02-15T09:00:00Z',
    completed_at: '2024-02-15T11:00:00Z'
  },
  {
    id: 'session-2',
    timetable_slot_id: 'slot-2',
    officer_id: 'off-001',
    course_id: 'IoT-202',
    class_name: 'Class 9B',
    date: '2024-02-15',
    start_time: '14:00',
    end_time: '16:00',
    current_module_id: 'mod-iot-1',
    modules_covered: [],
    content_completed: ['iot-content-1'],
    students_present: ['student-4', 'student-5'],
    total_students: 28,
    attendance_percentage: 85,
    status: 'completed',
    created_at: '2024-02-15T14:00:00Z',
    completed_at: '2024-02-15T16:00:00Z'
  },
];

export const getSessionsByOfficer = (officerId: string): CourseSessionDelivery[] => {
  return mockSessionDeliveries.filter(s => s.officer_id === officerId);
};

export const getSessionsByCourse = (courseId: string): CourseSessionDelivery[] => {
  return mockSessionDeliveries.filter(s => s.course_id === courseId);
};

export const getSessionsByClass = (courseId: string, className: string): CourseSessionDelivery[] => {
  return mockSessionDeliveries.filter(s => 
    s.course_id === courseId && s.class_name === className
  );
};
