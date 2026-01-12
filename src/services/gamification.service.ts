import api from './api';
import { ApiResponse } from '@/types';
import { BadgeConfig, XPRule, LeaderboardConfig, StudentPerformance, GamificationStats } from '@/types/gamification';

export const gamificationService = {
  // Stats
  async getStats(): Promise<ApiResponse<GamificationStats>> {
    const response = await api.get('/gamification/stats');
    return response.data;
  },

  // Badges
  async getBadges(): Promise<ApiResponse<BadgeConfig[]>> {
    const response = await api.get('/gamification/badges');
    return response.data;
  },

  async createBadge(data: Partial<BadgeConfig>): Promise<ApiResponse<BadgeConfig>> {
    const response = await api.post('/gamification/badges', data);
    return response.data;
  },

  async updateBadge(id: string, data: Partial<BadgeConfig>): Promise<ApiResponse<BadgeConfig>> {
    const response = await api.put(`/gamification/badges/${id}`, data);
    return response.data;
  },

  async deleteBadge(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/gamification/badges/${id}`);
    return response.data;
  },

  // XP Rules
  async getXPRules(): Promise<ApiResponse<XPRule[]>> {
    const response = await api.get('/gamification/xp-rules');
    return response.data;
  },

  async updateXPRule(id: string, data: Partial<XPRule>): Promise<ApiResponse<XPRule>> {
    const response = await api.put(`/gamification/xp-rules/${id}`, data);
    return response.data;
  },

  // Student Performance
  async getStudentPerformances(params?: {
    institution_id?: string;
    time_period?: string;
    search?: string;
  }): Promise<ApiResponse<StudentPerformance[]>> {
    const response = await api.get('/gamification/student-performances', { params });
    return response.data;
  },

  async adjustStudentPoints(studentId: string, data: {
    points: number;
    reason: string;
  }): Promise<ApiResponse<void>> {
    const response = await api.post(`/gamification/students/${studentId}/adjust-points`, data);
    return response.data;
  },

  // Leaderboards
  async getLeaderboardConfigs(): Promise<ApiResponse<LeaderboardConfig[]>> {
    const response = await api.get('/gamification/leaderboards');
    return response.data;
  },

  async getLeaderboardConfig(institutionId: string): Promise<ApiResponse<LeaderboardConfig>> {
    const response = await api.get(`/gamification/leaderboards/${institutionId}`);
    return response.data;
  },

  async updateLeaderboardConfig(institutionId: string, data: Partial<LeaderboardConfig>): Promise<ApiResponse<LeaderboardConfig>> {
    const response = await api.put(`/gamification/leaderboards/${institutionId}`, data);
    return response.data;
  },

  // Activity Logs
  async getActivityLogs(params?: {
    limit?: number;
  }): Promise<ApiResponse<any[]>> {
    const response = await api.get('/gamification/activity-logs', { params });
    return response.data;
  }
};
