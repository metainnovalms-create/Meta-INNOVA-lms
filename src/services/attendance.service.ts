import api from './api';
import { ApiResponse } from '@/types';
import { DailyAttendance, OfficerAttendanceRecord } from '@/types/attendance';
import type { LocationData } from '@/utils/locationHelpers';

export interface CheckInData {
  officer_id: string;
  location: LocationData;
  timestamp: string;
}

export interface CheckOutData {
  officer_id: string;
  location: LocationData;
  timestamp: string;
}

export const attendanceService = {
  /**
   * Record check-in with GPS location
   */
  async recordCheckIn(data: CheckInData): Promise<ApiResponse<DailyAttendance>> {
    const response = await api.post('/attendance/check-in', data);
    return response.data;
  },

  /**
   * Record check-out with GPS location
   */
  async recordCheckOut(data: CheckOutData): Promise<ApiResponse<DailyAttendance>> {
    const response = await api.post('/attendance/check-out', data);
    return response.data;
  },

  /**
   * Get monthly attendance for an officer
   */
  async getMonthlyAttendance(
    officerId: string, 
    month: string
  ): Promise<ApiResponse<OfficerAttendanceRecord>> {
    const response = await api.get(`/attendance/officer/${officerId}/month/${month}`);
    return response.data;
  },

  /**
   * Get overtime summary for an officer
   */
  async getOvertimeSummary(
    officerId: string,
    month: string
  ): Promise<ApiResponse<{ total_overtime_hours: number; overtime_pay: number }>> {
    const response = await api.get(`/attendance/officer/${officerId}/overtime/${month}`);
    return response.data;
  },

  /**
   * Validate if location is within institution radius
   */
  async validateLocation(
    location: LocationData,
    institutionId: string
  ): Promise<ApiResponse<{ valid: boolean; distance: number }>> {
    const response = await api.post('/attendance/validate-location', {
      location,
      institution_id: institutionId,
    });
    return response.data;
  },

  /**
   * Manual attendance correction by admin
   */
  async correctAttendance(
    officerId: string,
    date: string,
    data: Partial<DailyAttendance>
  ): Promise<ApiResponse<DailyAttendance>> {
    const response = await api.put(`/attendance/correct/${officerId}/${date}`, data);
    return response.data;
  },
};
