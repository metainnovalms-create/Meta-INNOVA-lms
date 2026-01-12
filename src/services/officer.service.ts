import api from './api';
import { ApiResponse } from '@/types';

export interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  mentor: string;
  location: string;
  max_participants: number;
  registered_count: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  type: 'workshop' | 'mentorship' | 'hackathon' | 'seminar';
}

export interface InnovationProject {
  id: string;
  title: string;
  description: string;
  team_lead: string;
  team_members: string[];
  status: 'proposal' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  category: string;
  progress: number;
  start_date: string;
  end_date?: string;
  institution_id: string;
}

export interface LabEquipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  available: number;
  location: string;
  status: 'available' | 'in_use' | 'maintenance' | 'damaged';
  last_maintenance: string;
  next_maintenance: string;
  image?: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  check_in_time?: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

export const officerService = {
  // Sessions
  async getSessions(): Promise<ApiResponse<Session[]>> {
    const response = await api.get('/officer/sessions');
    return response.data;
  },

  async createSession(session: Partial<Session>): Promise<ApiResponse<Session>> {
    const response = await api.post('/officer/sessions', session);
    return response.data;
  },

  async updateSession(id: string, session: Partial<Session>): Promise<ApiResponse<Session>> {
    const response = await api.put(`/officer/sessions/${id}`, session);
    return response.data;
  },

  async deleteSession(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/officer/sessions/${id}`);
    return response.data;
  },

  // Innovation Projects
  async getProjects(): Promise<ApiResponse<InnovationProject[]>> {
    const response = await api.get('/officer/projects');
    return response.data;
  },

  async approveProject(id: string): Promise<ApiResponse<InnovationProject>> {
    const response = await api.put(`/officer/projects/${id}/approve`);
    return response.data;
  },

  async rejectProject(id: string, reason: string): Promise<ApiResponse<InnovationProject>> {
    const response = await api.put(`/officer/projects/${id}/reject`, { reason });
    return response.data;
  },

  // Lab Equipment
  async getEquipment(): Promise<ApiResponse<LabEquipment[]>> {
    const response = await api.get('/officer/equipment');
    return response.data;
  },

  async addEquipment(equipment: Partial<LabEquipment>): Promise<ApiResponse<LabEquipment>> {
    const response = await api.post('/officer/equipment', equipment);
    return response.data;
  },

  async updateEquipment(id: string, equipment: Partial<LabEquipment>): Promise<ApiResponse<LabEquipment>> {
    const response = await api.put(`/officer/equipment/${id}`, equipment);
    return response.data;
  },

  async deleteEquipment(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/officer/equipment/${id}`);
    return response.data;
  },

  // Attendance
  async getAttendance(sessionId: string): Promise<ApiResponse<AttendanceRecord[]>> {
    const response = await api.get(`/officer/attendance/${sessionId}`);
    return response.data;
  },

  async markAttendance(
    sessionId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late'
  ): Promise<ApiResponse<AttendanceRecord>> {
    const response = await api.post(`/officer/attendance/${sessionId}`, {
      student_id: studentId,
      status,
    });
    return response.data;
  },
};
