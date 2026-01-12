import api from './api';
import { ApiResponse } from '@/types';
import { Student } from '@/types/student';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  specialization: string[];
  joining_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  courses_assigned: number;
  avatar?: string;
}

export interface StudentEnrollment {
  id: string;
  student_name: string;
  student_email: string;
  roll_number: string;
  department: string;
  semester: number;
  batch: string;
  status: 'active' | 'inactive' | 'suspended' | 'graduated';
  enrollment_date: string;
  cgpa?: number;
  avatar?: string;
}

export interface CourseAssignment {
  id: string;
  course_code: string;
  course_name: string;
  teacher_id: string;
  teacher_name: string;
  department: string;
  semester: number;
  credits: number;
  students_enrolled: number;
  max_capacity: number;
  schedule: string;
}

export interface InstitutionReport {
  id: string;
  title: string;
  type: 'enrollment' | 'academic' | 'attendance' | 'performance';
  period: string;
  generated_date: string;
  file_url?: string;
}

export const institutionService = {
  // Teachers
  async getTeachers(): Promise<ApiResponse<Teacher[]>> {
    const response = await api.get('/institution/teachers');
    return response.data;
  },

  async addTeacher(teacher: Partial<Teacher>): Promise<ApiResponse<Teacher>> {
    const response = await api.post('/institution/teachers', teacher);
    return response.data;
  },

  async updateTeacher(id: string, teacher: Partial<Teacher>): Promise<ApiResponse<Teacher>> {
    const response = await api.put(`/institution/teachers/${id}`, teacher);
    return response.data;
  },

  async deleteTeacher(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/institution/teachers/${id}`);
    return response.data;
  },

  // Student Enrollment
  async getStudents(): Promise<ApiResponse<StudentEnrollment[]>> {
    const response = await api.get('/institution/students');
    return response.data;
  },

  async enrollStudent(student: Partial<StudentEnrollment>): Promise<ApiResponse<StudentEnrollment>> {
    const response = await api.post('/institution/students', student);
    return response.data;
  },

  async updateStudent(id: string, student: Partial<StudentEnrollment>): Promise<ApiResponse<StudentEnrollment>> {
    const response = await api.put(`/institution/students/${id}`, student);
    return response.data;
  },

  // Course Assignments
  async getCourseAssignments(): Promise<ApiResponse<CourseAssignment[]>> {
    const response = await api.get('/institution/course-assignments');
    return response.data;
  },

  async assignCourse(assignment: Partial<CourseAssignment>): Promise<ApiResponse<CourseAssignment>> {
    const response = await api.post('/institution/course-assignments', assignment);
    return response.data;
  },

  async updateAssignment(id: string, assignment: Partial<CourseAssignment>): Promise<ApiResponse<CourseAssignment>> {
    const response = await api.put(`/institution/course-assignments/${id}`, assignment);
    return response.data;
  },

  async deleteAssignment(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/institution/course-assignments/${id}`);
    return response.data;
  },

  // Reports
  async getReports(): Promise<ApiResponse<InstitutionReport[]>> {
    const response = await api.get('/institution/reports');
    return response.data;
  },

  async generateReport(type: string, period: string): Promise<ApiResponse<InstitutionReport>> {
    const response = await api.post('/institution/reports/generate', { type, period });
    return response.data;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<ApiResponse<any>> {
    const response = await api.get('/institution/dashboard/stats');
    return response.data;
  },

  // Student Management
  async getInstitutionById(id: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/institution/${id}`);
    return response.data;
  },

  async getStudentsByInstitution(institutionId: string): Promise<ApiResponse<Student[]>> {
    const response = await api.get(`/institution/${institutionId}/students`);
    return response.data;
  },

  async getStudentsByClass(institutionId: string, className: string): Promise<ApiResponse<Student[]>> {
    const response = await api.get(`/institution/${institutionId}/students/class/${className}`);
    return response.data;
  },

  async updateStudentDetails(studentId: string, data: Partial<Student>): Promise<ApiResponse<Student>> {
    const response = await api.put(`/institution/students/${studentId}`, data);
    return response.data;
  },

  async deleteStudent(studentId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/institution/students/${studentId}`);
    return response.data;
  },

  // Bulk Upload
  async bulkUploadStudents(
    institutionId: string,
    data: {
      class: string;
      section: string;
      students: Partial<Student>[];
      options: {
        skipDuplicates: boolean;
        updateExisting: boolean;
        sendWelcomeEmails: boolean;
      }
    }
  ): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('class', data.class);
    formData.append('section', data.section);
    formData.append('students', JSON.stringify(data.students));
    formData.append('options', JSON.stringify(data.options));

    const response = await api.post(
      `/institutions/${institutionId}/students/bulk-upload`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    return response.data;
  },

  async downloadStudentTemplate(): Promise<Blob> {
    const response = await api.get('/institutions/students/template', {
      responseType: 'blob'
    });
    return response.data;
  },

  // ========== CLASS MANAGEMENT ==========
  async getInstitutionClasses(institutionId: string): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/system-admin/institutions/${institutionId}/classes`);
    return response.data;
  },

  async createClass(institutionId: string, classData: any): Promise<ApiResponse<any>> {
    const response = await api.post(`/system-admin/institutions/${institutionId}/classes`, classData);
    return response.data;
  },

  async updateClass(institutionId: string, classId: string, classData: any): Promise<ApiResponse<any>> {
    const response = await api.put(`/system-admin/institutions/${institutionId}/classes/${classId}`, classData);
    return response.data;
  },

  async deleteClass(institutionId: string, classId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/system-admin/institutions/${institutionId}/classes/${classId}`);
    return response.data;
  },

  async archiveClass(institutionId: string, classId: string): Promise<ApiResponse<any>> {
    const response = await api.patch(`/system-admin/institutions/${institutionId}/classes/${classId}/archive`);
    return response.data;
  },

  async enrollStudentInClass(institutionId: string, classId: string, student: Partial<Student>): Promise<ApiResponse<Student>> {
    const response = await api.post(`/system-admin/institutions/${institutionId}/classes/${classId}/students`, student);
    return response.data;
  },

  async bulkUploadStudentsToClass(institutionId: string, classId: string, formData: FormData): Promise<ApiResponse<any>> {
    const response = await api.post(
      `/system-admin/institutions/${institutionId}/classes/${classId}/students/bulk`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // ========== CLASS DETAILS ==========
  async getClassDetails(classId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/classes/${classId}`);
    return response.data;
  },

  async getClassStudents(classId: string): Promise<ApiResponse<Student[]>> {
    const response = await api.get(`/classes/${classId}/students`);
    return response.data;
  },

  async addStudentToClass(classId: string, studentData: Partial<Student>): Promise<ApiResponse<Student>> {
    const response = await api.post(`/classes/${classId}/students`, studentData);
    return response.data;
  },

  async updateClassStudent(classId: string, studentId: string, data: Partial<Student>): Promise<ApiResponse<Student>> {
    const response = await api.put(`/classes/${classId}/students/${studentId}`, data);
    return response.data;
  },

  async removeStudentFromClass(classId: string, studentId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/classes/${classId}/students/${studentId}`);
    return response.data;
  },

  // ========== CLASS COURSE ASSIGNMENTS ==========
  async getClassCourseAssignments(classId: string): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/classes/${classId}/course-assignments`);
    return response.data;
  },

  async assignCourseToClass(data: any): Promise<ApiResponse<any>> {
    const response = await api.post(`/classes/${data.class_id}/course-assignments`, data);
    return response.data;
  },

  async updateClassCourseAssignment(
    classId: string,
    assignmentId: string,
    data: any
  ): Promise<ApiResponse<any>> {
    const response = await api.put(`/classes/${classId}/course-assignments/${assignmentId}`, data);
    return response.data;
  },

  async removeClassCourseAssignment(classId: string, assignmentId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/classes/${classId}/course-assignments/${assignmentId}`);
    return response.data;
  },

  async unlockModuleForClass(classId: string, assignmentId: string, moduleId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/classes/${classId}/course-assignments/${assignmentId}/modules/${moduleId}/unlock`);
    return response.data;
  },

  // ========== CLASS ANALYTICS ==========
  async getClassAnalytics(classId: string, dateRange: { start: Date; end: Date }): Promise<ApiResponse<any>> {
    const response = await api.get(`/classes/${classId}/analytics`, {
      params: {
        start_date: dateRange.start.toISOString(),
        end_date: dateRange.end.toISOString()
      }
    });
    return response.data;
  },

  async generateClassReport(classId: string, options: any): Promise<ApiResponse<{ report_url: string }>> {
    const response = await api.post(`/classes/${classId}/reports/generate`, options);
    return response.data;
  },
};
