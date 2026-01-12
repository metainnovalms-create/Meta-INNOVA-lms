import api from './api';
import { ApiResponse } from '@/types';
import { CourseSessionDelivery, SessionProgress } from '@/types/session';

// Session Service for Course Delivery Tracking
export const sessionService = {
  // ========== SESSION MANAGEMENT ==========
  
  async createSession(tenantId: string, data: {
    timetable_slot_id: string;
    officer_id: string;
    course_id: string;
    class_name: string;
    date: string;
    start_time: string;
    end_time: string;
    total_students: number;
  }): Promise<ApiResponse<CourseSessionDelivery>> {
    const response = await api.post(`/tenant/${tenantId}/officer/sessions`, data);
    return response.data;
  },

  async getSession(tenantId: string, sessionId: string): Promise<ApiResponse<CourseSessionDelivery>> {
    const response = await api.get(`/tenant/${tenantId}/officer/sessions/${sessionId}`);
    return response.data;
  },

  async getOfficerSessions(
    tenantId: string,
    officerId: string,
    params?: {
      status?: 'scheduled' | 'in_progress' | 'completed';
      date_from?: string;
      date_to?: string;
    }
  ): Promise<ApiResponse<CourseSessionDelivery[]>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/${officerId}/sessions`,
      { params }
    );
    return response.data;
  },

  async getCourseSessions(
    tenantId: string,
    courseId: string,
    params?: {
      class_name?: string;
      status?: string;
    }
  ): Promise<ApiResponse<CourseSessionDelivery[]>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/courses/${courseId}/sessions`,
      { params }
    );
    return response.data;
  },

  // ========== PROGRESS TRACKING ==========

  async updateSessionProgress(
    tenantId: string,
    sessionId: string,
    data: {
      content_completed?: string[];
      current_module_id?: string;
      modules_covered?: string[];
    }
  ): Promise<ApiResponse<CourseSessionDelivery>> {
    const response = await api.patch(
      `/tenant/${tenantId}/officer/sessions/${sessionId}/progress`,
      data
    );
    return response.data;
  },

  async completeSession(
    tenantId: string,
    sessionId: string,
    data?: {
      notes?: string;
    }
  ): Promise<ApiResponse<CourseSessionDelivery>> {
    const response = await api.post(
      `/tenant/${tenantId}/officer/sessions/${sessionId}/complete`,
      data
    );
    return response.data;
  },

  async getSessionProgress(
    tenantId: string,
    courseId: string,
    className: string
  ): Promise<ApiResponse<SessionProgress>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/courses/${courseId}/classes/${className}/progress`
    );
    return response.data;
  },

  // ========== ATTENDANCE TRACKING ==========

  async recordAttendance(
    tenantId: string,
    sessionId: string,
    data: {
      students_present: string[];
      total_students: number;
    }
  ): Promise<ApiResponse<CourseSessionDelivery>> {
    const response = await api.post(
      `/tenant/${tenantId}/officer/sessions/${sessionId}/attendance`,
      data
    );
    return response.data;
  },

  async getSessionAttendance(
    tenantId: string,
    sessionId: string
  ): Promise<ApiResponse<{
    students_present: string[];
    total_students: number;
    attendance_percentage: number;
  }>> {
    const response = await api.get(
      `/tenant/${tenantId}/officer/sessions/${sessionId}/attendance`
    );
    return response.data;
  },
};
