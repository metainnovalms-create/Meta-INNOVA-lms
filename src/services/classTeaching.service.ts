import api from './api';
import { ApiResponse } from '@/types';
import { ClassCourseProgress, ClassTeachingSession, ClassTeachingReport } from '@/types/classTeaching';

export const classTeachingService = {
  // Get progress for a specific class-course
  async getClassCourseProgress(
    tenantId: string,
    classId: string,
    courseId: string
  ): Promise<ApiResponse<ClassCourseProgress>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/classes/${classId}/courses/${courseId}/progress`
    );
    return response.data;
  },

  // Get all course progress for a class
  async getAllClassCourseProgress(
    tenantId: string,
    classId: string
  ): Promise<ApiResponse<ClassCourseProgress[]>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/classes/${classId}/courses/progress`
    );
    return response.data;
  },

  // Update progress (when officer launches/continues course)
  async updateProgress(
    tenantId: string,
    classId: string,
    courseId: string,
    data: Partial<ClassCourseProgress>
  ): Promise<ApiResponse<ClassCourseProgress>> {
    const response = await api.put(
      `/tenant/${tenantId}/officer/classes/${classId}/courses/${courseId}/progress`,
      data
    );
    return response.data;
  },

  // Log teaching session
  async logSession(
    tenantId: string,
    data: Omit<ClassTeachingSession, 'id' | 'created_at'>
  ): Promise<ApiResponse<ClassTeachingSession>> {
    const response = await api.post(
      `/tenant/${tenantId}/officer/teaching-sessions`,
      data
    );
    return response.data;
  },

  // Get all sessions for a class
  async getClassSessions(
    tenantId: string,
    classId: string
  ): Promise<ApiResponse<ClassTeachingSession[]>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/classes/${classId}/teaching-sessions`
    );
    return response.data;
  },

  // Get teaching report
  async getTeachingReport(
    tenantId: string,
    classId: string,
    officerId: string
  ): Promise<ApiResponse<ClassTeachingReport>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/classes/${classId}/teaching-report`,
      { params: { officer_id: officerId } }
    );
    return response.data;
  }
};
