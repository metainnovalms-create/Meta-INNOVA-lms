import api from './api';
import { ApiResponse } from '@/types';
import {
  Course,
  CourseContent,
  CourseEnrollment,
  AssignmentSubmission,
  QuizAttempt,
  CourseAnalytics,
  GradeSubmissionRequest
} from '@/types/course';

// Innovation Officer Course Service
export const officerCourseService = {
  // ========== ASSIGNED COURSES ==========
  async getAssignedCourses(tenantId: string): Promise<ApiResponse<Course[]>> {
    const response = await api.get(`/tenant/${tenantId}/officer/courses`);
    return response.data;
  },

  async getCourseDetails(tenantId: string, courseId: string): Promise<ApiResponse<Course>> {
    const response = await api.get(`/tenant/${tenantId}/officer/courses/${courseId}`);
    return response.data;
  },

  // ========== COURSE CONTENT (Read-Only) ==========
  async getCourseContent(tenantId: string, courseId: string): Promise<ApiResponse<CourseContent[]>> {
    const response = await api.get(`/tenant/${tenantId}/officer/courses/${courseId}/content`);
    return response.data;
  },

  // ========== STUDENT ENROLLMENTS ==========
  async getCourseEnrollments(tenantId: string, courseId: string): Promise<ApiResponse<CourseEnrollment[]>> {
    const response = await api.get(`/tenant/${tenantId}/officer/courses/${courseId}/enrollments`);
    return response.data;
  },

  async getStudentProgress(tenantId: string, courseId: string, studentId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/officer/courses/${courseId}/students/${studentId}/progress`);
    return response.data;
  },

  // ========== GRADING & ASSESSMENT ==========
  async getAssignmentSubmissions(
    tenantId: string,
    assignmentId: string,
    params?: { status?: 'pending' | 'graded' }
  ): Promise<ApiResponse<AssignmentSubmission[]>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/assignments/${assignmentId}/submissions`,
      { params }
    );
    return response.data;
  },

  async gradeSubmission(
    tenantId: string,
    submissionId: string,
    data: GradeSubmissionRequest
  ): Promise<ApiResponse<AssignmentSubmission>> {
    const response = await api.post(
      `/tenant/${tenantId}/officer/submissions/${submissionId}/grade`,
      data
    );
    return response.data;
  },

  async getQuizAttempts(
    tenantId: string,
    quizId: string,
    params?: { status?: string }
  ): Promise<ApiResponse<QuizAttempt[]>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/quizzes/${quizId}/attempts`,
      { params }
    );
    return response.data;
  },

  async gradeQuizShortAnswers(
    tenantId: string,
    attemptId: string,
    data: { answers: { question_id: string; points_earned: number }[] }
  ): Promise<ApiResponse<QuizAttempt>> {
    const response = await api.post(
      `/tenant/${tenantId}/officer/quiz-attempts/${attemptId}/grade`,
      data
    );
    return response.data;
  },

  // ========== PERFORMANCE TRACKING ==========
  async getCourseAnalytics(tenantId: string, courseId: string): Promise<ApiResponse<CourseAnalytics>> {
    const response = await api.get(`/tenant/${tenantId}/officer/courses/${courseId}/analytics`);
    return response.data;
  },

  async getAtRiskStudents(tenantId: string, courseId: string): Promise<ApiResponse<CourseEnrollment[]>> {
    const response = await api.get(`/tenant/${tenantId}/officer/courses/${courseId}/at-risk-students`);
    return response.data;
  },

  async sendNotification(tenantId: string, data: {
    student_ids: string[];
    message: string;
    type: 'reminder' | 'encouragement' | 'announcement';
  }): Promise<ApiResponse<void>> {
    const response = await api.post(`/tenant/${tenantId}/officer/notifications/send`, data);
    return response.data;
  },

  async exportPerformanceReport(tenantId: string, courseId: string, format: 'pdf' | 'excel'): Promise<ApiResponse<{ file_url: string }>> {
    const response = await api.post(`/tenant/${tenantId}/officer/courses/${courseId}/export`, { format });
    return response.data;
  }
};
