import api from './api';
import { ApiResponse } from '@/types';

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  teacher: {
    id: string;
    name: string;
    avatar?: string;
  };
  progress_percentage: number;
  next_session?: {
    date: string;
    time: string;
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  sdg_goals: number[];
  team_members: Array<{
    id: string;
    name: string;
    role: 'leader' | 'member';
  }>;
  mentor: {
    id: string;
    name: string;
  };
  status: 'ongoing' | 'submitted' | 'approved' | 'rejected';
  progress_percentage: number;
  last_update: string;
}

export interface Certificate {
  id: string;
  title: string;
  description: string;
  issued_by: string;
  issued_date: string;
  certificate_url: string;
  qr_code: string;
  verification_code: string;
}

export interface GamificationData {
  total_points: number;
  current_rank: number;
  streak_days: number;
  badges_earned: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
  }>;
  badges_locked: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    points_required: number;
    progress: number;
  }>;
  points_breakdown: {
    sessions: number;
    projects: number;
    attendance: number;
    assessments: number;
  };
}

export interface LeaderboardEntry {
  rank: number;
  student_id: string;
  name: string;
  avatar?: string;
  points: number;
  badges_count: number;
}

export const studentService = {
  // Get dashboard data
  async getDashboard(tenantId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/dashboard`);
    return response.data;
  },

  // Get courses
  async getCourses(tenantId: string): Promise<ApiResponse<{ courses: Course[] }>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses`);
    return response.data;
  },

  // Get course details
  async getCourseDetails(tenantId: string, courseId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses/${courseId}`);
    return response.data;
  },

  // Get projects
  async getProjects(tenantId: string): Promise<ApiResponse<{ projects: Project[] }>> {
    const response = await api.get(`/tenant/${tenantId}/student/projects`);
    return response.data;
  },

  // Submit project progress
  async submitProjectProgress(
    tenantId: string, 
    projectId: string, 
    data: FormData
  ): Promise<ApiResponse<any>> {
    const response = await api.post(
      `/tenant/${tenantId}/student/projects/${projectId}/progress`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Get timetable
  async getTimetable(tenantId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/timetable`);
    return response.data;
  },

  // Get certificates
  async getCertificates(tenantId: string): Promise<ApiResponse<{ certificates: Certificate[] }>> {
    const response = await api.get(`/tenant/${tenantId}/student/certificates`);
    return response.data;
  },

  // Get gamification data
  async getGamification(tenantId: string): Promise<ApiResponse<GamificationData>> {
    const response = await api.get(`/tenant/${tenantId}/student/gamification`);
    return response.data;
  },

  // Get leaderboard
  async getLeaderboard(
    tenantId: string, 
    scope: 'class' | 'institution'
  ): Promise<ApiResponse<{ leaderboard: LeaderboardEntry[]; current_user_rank: number; total_students: number }>> {
    const response = await api.get(`/tenant/${tenantId}/student/leaderboard`, {
      params: { scope }
    });
    return response.data;
  },

  // Get resume data
  async getResumeData(tenantId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/resume-data`);
    return response.data;
  },

  // ========== NEW COURSE MANAGEMENT FEATURES ==========
  // Course browsing & enrollment
  async getAvailableCourses(tenantId: string): Promise<ApiResponse<any[]>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses/available`);
    return response.data;
  },

  async enrollInCourse(tenantId: string, courseId: string): Promise<ApiResponse<any>> {
    const response = await api.post(`/tenant/${tenantId}/student/courses/${courseId}/enroll`);
    return response.data;
  },

  async getCourseContent(tenantId: string, courseId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses/${courseId}/content`);
    return response.data;
  },

  async markContentViewed(tenantId: string, contentId: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/tenant/${tenantId}/student/content/${contentId}/mark-viewed`);
    return response.data;
  },

  // Assignments
  async getAssignments(tenantId: string, courseId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses/${courseId}/assignments`);
    return response.data;
  },

  async submitAssignment(tenantId: string, assignmentId: string, data: FormData): Promise<ApiResponse<any>> {
    const response = await api.post(
      `/tenant/${tenantId}/student/assignments/${assignmentId}/submit`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Quizzes
  async getQuizzes(tenantId: string, courseId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses/${courseId}/quizzes`);
    return response.data;
  },

  async startQuizAttempt(tenantId: string, quizId: string): Promise<ApiResponse<any>> {
    const response = await api.post(`/tenant/${tenantId}/student/quizzes/${quizId}/start-attempt`);
    return response.data;
  },

  async submitQuiz(tenantId: string, attemptId: string, answers: any[]): Promise<ApiResponse<any>> {
    const response = await api.post(
      `/tenant/${tenantId}/student/quiz-attempts/${attemptId}/submit`,
      { answers }
    );
    return response.data;
  },

  async getQuizResults(tenantId: string, attemptId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/quiz-attempts/${attemptId}/results`);
    return response.data;
  },

  // Progress & Certificate
  async getCourseProgress(tenantId: string, courseId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses/${courseId}/progress`);
    return response.data;
  },

  async getCourseCertificate(tenantId: string, courseId: string): Promise<ApiResponse<{ certificate_url: string }>> {
    const response = await api.get(`/tenant/${tenantId}/student/courses/${courseId}/certificate`);
    return response.data;
  }
};
