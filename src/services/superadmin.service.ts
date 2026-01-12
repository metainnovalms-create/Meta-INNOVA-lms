import api from './api';
import { ApiResponse } from '@/types';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  subscription_status: 'active' | 'inactive';
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  total_users: number;
  total_institutions: number;
  storage_used_gb: number;
  created_at: string;
}

export interface CreateTenantRequest {
  name: string;
  slug: string;
  logo?: string;
  subscription_plan: string;
  admin_email: string;
  admin_name: string;
  admin_password: string;
}

export interface SystemStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  api_calls_this_month: number;
  storage_used_gb: number;
  system_uptime_hours: number;
  tenants_by_plan: {
    basic: number;
    premium: number;
    enterprise: number;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_name: string;
  user_email: string;
  action_type: string;
  entity: string;
  ip_address: string;
  status: 'success' | 'failed';
}

export const superAdminService = {
  // Get system stats
  async getStats(): Promise<ApiResponse<SystemStats>> {
    const response = await api.get('/super-admin/stats');
    return response.data;
  },

  // Get all tenants
  async getTenants(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ tenants: Tenant[]; pagination: any }>> {
    const response = await api.get('/super-admin/tenants', { params });
    return response.data;
  },

  // Create tenant
  async createTenant(data: CreateTenantRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/super-admin/tenants', data);
    return response.data;
  },

  // Update tenant
  async updateTenant(id: string, data: Partial<Tenant>): Promise<ApiResponse<any>> {
    const response = await api.put(`/super-admin/tenants/${id}`, data);
    return response.data;
  },

  // Delete tenant
  async deleteTenant(id: string): Promise<ApiResponse<any>> {
    const response = await api.delete(`/super-admin/tenants/${id}`);
    return response.data;
  },

  // Get audit logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<{ logs: AuditLog[]; pagination: any }>> {
    const response = await api.get('/super-admin/audit-logs', { params });
    return response.data;
  },

  // Get system config
  async getConfig(): Promise<ApiResponse<any>> {
    const response = await api.get('/super-admin/config');
    return response.data;
  },

  // Update system config
  async updateConfig(data: any): Promise<ApiResponse<any>> {
    const response = await api.put('/super-admin/config', data);
    return response.data;
  }
};
