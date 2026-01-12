import api from './api';
import { ApiResponse } from '@/types';

export interface TeacherCourse {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
  semester: number;
  credits: number;
  students_enrolled: number;
  schedule: string;
  room: string;
}

export interface StudentGrade {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  attendance_percentage: number;
  internal_marks: number;
  assignment_marks: number;
  final_marks?: number;
  grade?: string;
  status: 'pass' | 'fail' | 'pending';
}

export interface ClassAttendance {
  id: string;
  course_id: string;
  date: string;
  topic: string;
  students_present: number;
  students_absent: number;
  total_students: number;
}

export interface ClassSchedule {
  id: string;
  day: string;
  course_code: string;
  course_name: string;
  start_time: string;
  end_time: string;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial';
}

export interface CourseMaterial {
  id: string;
  course_id: string;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  file_url?: string;
  description?: string;
  uploaded_date: string;
  size?: string;
}

export const teacherService = {
  // Courses
  async getMyCourses(): Promise<ApiResponse<TeacherCourse[]>> {
    const response = await api.get('/teacher/courses');
    return response.data;
  },

  async getCourseDetails(courseId: string): Promise<ApiResponse<TeacherCourse>> {
    const response = await api.get(`/teacher/courses/${courseId}`);
    return response.data;
  },

  // Grades
  async getStudentGrades(courseId: string): Promise<ApiResponse<StudentGrade[]>> {
    const response = await api.get(`/teacher/courses/${courseId}/grades`);
    return response.data;
  },

  async updateGrade(
    courseId: string,
    studentId: string,
    grades: Partial<StudentGrade>
  ): Promise<ApiResponse<StudentGrade>> {
    const response = await api.put(`/teacher/courses/${courseId}/grades/${studentId}`, grades);
    return response.data;
  },

  async submitGrades(courseId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/teacher/courses/${courseId}/grades/submit`);
    return response.data;
  },

  // Attendance
  async getAttendanceRecords(courseId: string): Promise<ApiResponse<ClassAttendance[]>> {
    const response = await api.get(`/teacher/courses/${courseId}/attendance`);
    return response.data;
  },

  async markAttendance(
    courseId: string,
    date: string,
    studentIds: string[],
    topic: string
  ): Promise<ApiResponse<ClassAttendance>> {
    const response = await api.post(`/teacher/courses/${courseId}/attendance`, {
      date,
      student_ids: studentIds,
      topic,
    });
    return response.data;
  },

  // Schedule
  async getSchedule(): Promise<ApiResponse<ClassSchedule[]>> {
    const response = await api.get('/teacher/schedule');
    return response.data;
  },

  // Materials
  async getMaterials(courseId: string): Promise<ApiResponse<CourseMaterial[]>> {
    const response = await api.get(`/teacher/courses/${courseId}/materials`);
    return response.data;
  },

  async uploadMaterial(
    courseId: string,
    material: FormData
  ): Promise<ApiResponse<CourseMaterial>> {
    const response = await api.post(`/teacher/courses/${courseId}/materials`, material, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteMaterial(courseId: string, materialId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/teacher/courses/${courseId}/materials/${materialId}`);
    return response.data;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<ApiResponse<any>> {
    const response = await api.get('/teacher/dashboard/stats');
    return response.data;
  },
};
