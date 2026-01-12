import api from './api';
import { ApiResponse } from '@/types';

// Tenant interfaces
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

export interface Institution {
  id: string;
  name: string;
  code: string;
  type: 'university' | 'college' | 'school' | 'institute';
  location: string;
  established_year: number;
  total_students: number;
  total_faculty: number;
  status: 'active' | 'inactive' | 'suspended';
  license_type: 'basic' | 'standard' | 'premium' | 'enterprise';
  license_expiry: string;
  contact_email: string;
  contact_phone: string;
  admin_name: string;
  admin_email: string;
}

export interface SystemReport {
  id: string;
  title: string;
  type: 'usage' | 'performance' | 'financial' | 'compliance';
  period: string;
  generated_date: string;
  institutions_count: number;
  file_url?: string;
}

export interface LicenseInfo {
  id: string;
  institution_id: string;
  institution_name: string;
  license_type: 'basic' | 'standard' | 'premium' | 'enterprise';
  start_date: string;
  expiry_date: string;
  max_users: number;
  current_users: number;
  status: 'active' | 'expired' | 'expiring_soon';
  features: string[];
}

export interface SystemMetrics {
  total_institutions: number;
  total_users: number;
  total_students: number;
  total_faculty: number;
  active_licenses: number;
  expiring_licenses: number;
  revenue_this_month: number;
  system_uptime: number;
}

// Officer Management Interfaces
export interface Officer {
  id: string;
  name: string;
  email: string;
  phone: string;
  assigned_institutions: string[];
  employment_type: 'full_time' | 'part_time' | 'contract';
  salary: number;
  join_date: string;
  status: 'active' | 'on_leave' | 'terminated';
}

export interface OfficerDocument {
  id: string;
  officer_id: string;
  document_type: 'appointment_letter' | 'certificate' | 'id_card' | 'contract' | 'other';
  document_name: string;
  file_url: string;
  file_size_mb: number;
  file_type: string;
  uploaded_by: string;
  uploaded_date: string;
  description?: string;
}

export interface OfficerDetails extends Officer {
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  
  // Salary Configuration
  hourly_rate?: number;
  overtime_rate_multiplier?: number;
  normal_working_hours?: number;
  
  // Bank Details
  bank_account_number?: string;
  bank_name?: string;
  bank_ifsc?: string;
  bank_branch?: string;
  
  // Statutory Information
  statutory_info?: {
    pf_number?: string;
    uan_number?: string;
    esi_number?: string;
    pan_number?: string;
    pt_registration?: string;
    pf_applicable: boolean;
    esi_applicable: boolean;
    pt_applicable: boolean;
  };
  
  // Salary Structure
  salary_structure?: {
    basic_pay: number;
    hra: number;
    da: number;
    transport_allowance: number;
    special_allowance: number;
    medical_allowance: number;
  };
  
  qualifications?: string[];
  certifications?: string[];
  skills?: string[];
  profile_photo_url?: string;
}

export interface OfficerActivityLog {
  id: string;
  officer_id: string;
  action_type: 'profile_update' | 'assignment' | 'document_upload' | 'status_change' | 'salary_update';
  action_description: string;
  performed_by: string;
  performed_at: string;
  changes?: Record<string, { old: any; new: any }>;
}

export interface OfficerAttendance {
  officer_id: string;
  officer_name: string;
  month: string;
  present_days: number;
  absent_days: number;
  leave_days: number;
  salary: number;
  salary_paid: number;
}

export interface OfficerAssignment {
  officer_id: string;
  officer_name: string;
  institution_id: string;
  institution_name: string;
  assigned_date: string;
  status: 'active' | 'inactive';
}

// Inventory & Purchase Interfaces
export interface PurchaseRequest {
  id: string;
  institution_name: string;
  requested_by: string;
  items: Array<{ name: string; quantity: number; unit_price: number }>;
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_date: string;
  category: string;
}

export interface InventoryAudit {
  institution_id: string;
  institution_name: string;
  total_items: number;
  last_audit_date: string;
  value: number;
  status: 'good' | 'needs_review' | 'critical';
  categories: Record<string, number>;
}

// Analytics Interfaces
export interface MonthlyReport {
  institution_id: string;
  institution_name: string;
  month: string;
  students: number;
  teachers: number;
  attendance_rate: number;
  revenue: number;
  courses_active: number;
  satisfaction_score: number;
}

export const systemAdminService = {
  // Tenant Management (moved from Super Admin)
  async getTenants(params?: { 
    page?: number; 
    limit?: number; 
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ tenants: Tenant[]; pagination: any }>> {
    const response = await api.get('/system-admin/tenants', { params });
    return response.data;
  },

  async createTenant(data: CreateTenantRequest): Promise<ApiResponse<any>> {
    const response = await api.post('/system-admin/tenants', data);
    return response.data;
  },

  async updateTenant(id: string, data: Partial<Tenant>): Promise<ApiResponse<any>> {
    const response = await api.put(`/system-admin/tenants/${id}`, data);
    return response.data;
  },

  async deleteTenant(id: string): Promise<ApiResponse<any>> {
    const response = await api.delete(`/system-admin/tenants/${id}`);
    return response.data;
  },

  // Institutions
  async getInstitutions(): Promise<ApiResponse<Institution[]>> {
    const response = await api.get('/system-admin/institutions');
    return response.data;
  },

  async addInstitution(institution: Partial<Institution>): Promise<ApiResponse<Institution>> {
    const response = await api.post('/system-admin/institutions', institution);
    return response.data;
  },

  async updateInstitution(id: string, institution: Partial<Institution>): Promise<ApiResponse<Institution>> {
    const response = await api.put(`/system-admin/institutions/${id}`, institution);
    return response.data;
  },

  async deleteInstitution(id: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/system-admin/institutions/${id}`);
    return response.data;
  },

  async suspendInstitution(id: string, reason: string): Promise<ApiResponse<Institution>> {
    const response = await api.post(`/system-admin/institutions/${id}/suspend`, { reason });
    return response.data;
  },

  async activateInstitution(id: string): Promise<ApiResponse<Institution>> {
    const response = await api.post(`/system-admin/institutions/${id}/activate`);
    return response.data;
  },

  // Licenses
  async getLicenses(): Promise<ApiResponse<LicenseInfo[]>> {
    const response = await api.get('/system-admin/licenses');
    return response.data;
  },

  async updateLicense(id: string, license: Partial<LicenseInfo>): Promise<ApiResponse<LicenseInfo>> {
    const response = await api.put(`/system-admin/licenses/${id}`, license);
    return response.data;
  },

  async renewLicense(id: string, duration: number): Promise<ApiResponse<LicenseInfo>> {
    const response = await api.post(`/system-admin/licenses/${id}/renew`, { duration });
    return response.data;
  },

  // Reports
  async getSystemReports(): Promise<ApiResponse<SystemReport[]>> {
    const response = await api.get('/system-admin/reports');
    return response.data;
  },

  async generateReport(type: string, period: string): Promise<ApiResponse<SystemReport>> {
    const response = await api.post('/system-admin/reports/generate', { type, period });
    return response.data;
  },

  // Dashboard Metrics
  async getSystemMetrics(): Promise<ApiResponse<SystemMetrics>> {
    const response = await api.get('/system-admin/metrics');
    return response.data;
  },

  // Institution Analytics
  async getInstitutionAnalytics(institutionId: string): Promise<ApiResponse<any>> {
    const response = await api.get(`/system-admin/institutions/${institutionId}/analytics`);
    return response.data;
  },

  // Officer Management
  async getOfficers(): Promise<ApiResponse<Officer[]>> {
    const response = await api.get('/system-admin/officers');
    return response.data;
  },

  async createOfficer(officer: Partial<Officer>): Promise<ApiResponse<Officer>> {
    const response = await api.post('/system-admin/officers', officer);
    return response.data;
  },

  async updateOfficer(id: string, officer: Partial<Officer>): Promise<ApiResponse<Officer>> {
    const response = await api.put(`/system-admin/officers/${id}`, officer);
    return response.data;
  },

  async getOfficerAttendance(month: string): Promise<ApiResponse<OfficerAttendance[]>> {
    const response = await api.get('/system-admin/officer-attendance', { params: { month } });
    return response.data;
  },

  async getOfficerAssignments(): Promise<ApiResponse<OfficerAssignment[]>> {
    const response = await api.get('/system-admin/officer-assignments');
    return response.data;
  },

  async assignOfficer(officerId: string, institutionId: string): Promise<ApiResponse<any>> {
    const response = await api.post('/system-admin/officer-assignments', { 
      officer_id: officerId, 
      institution_id: institutionId 
    });
    return response.data;
  },

  async getOfficerById(id: string): Promise<ApiResponse<OfficerDetails>> {
    const response = await api.get(`/system-admin/officers/${id}`);
    return response.data;
  },

  async updateOfficerProfile(id: string, data: Partial<OfficerDetails>): Promise<ApiResponse<OfficerDetails>> {
    const response = await api.put(`/system-admin/officers/${id}/profile`, data);
    return response.data;
  },

  async uploadOfficerDocument(
    officerId: string, 
    file: File, 
    documentType: string, 
    documentName: string,
    description?: string
  ): Promise<ApiResponse<OfficerDocument>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('document_name', documentName);
    if (description) formData.append('description', description);
    
    const response = await api.post(
      `/system-admin/officers/${officerId}/documents`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async getOfficerDocuments(officerId: string): Promise<ApiResponse<OfficerDocument[]>> {
    const response = await api.get(`/system-admin/officers/${officerId}/documents`);
    return response.data;
  },

  async deleteOfficerDocument(officerId: string, documentId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/system-admin/officers/${officerId}/documents/${documentId}`);
    return response.data;
  },

  async getOfficerActivityLog(officerId: string): Promise<ApiResponse<OfficerActivityLog[]>> {
    const response = await api.get(`/system-admin/officers/${officerId}/activity-log`);
    return response.data;
  },

  async uploadOfficerPhoto(officerId: string, file: File): Promise<ApiResponse<{ photo_url: string }>> {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.post(
      `/system-admin/officers/${officerId}/photo`, 
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  async removeOfficerAssignment(officerId: string, institutionId: string): Promise<ApiResponse<void>> {
    const response = await api.delete(`/system-admin/officers/${officerId}/assignments/${institutionId}`);
    return response.data;
  },

  // Inventory & Purchase
  async getPurchaseRequests(): Promise<ApiResponse<PurchaseRequest[]>> {
    const response = await api.get('/system-admin/purchase-requests');
    return response.data;
  },

  async approvePurchaseRequest(id: string): Promise<ApiResponse<any>> {
    const response = await api.post(`/system-admin/purchase-requests/${id}/approve`);
    return response.data;
  },

  async rejectPurchaseRequest(id: string): Promise<ApiResponse<any>> {
    const response = await api.post(`/system-admin/purchase-requests/${id}/reject`);
    return response.data;
  },

  async getInventoryAudits(): Promise<ApiResponse<InventoryAudit[]>> {
    const response = await api.get('/system-admin/inventory-audits');
    return response.data;
  },

  // Analytics & Reports
  async getMonthlyReports(month: string): Promise<ApiResponse<MonthlyReport[]>> {
    const response = await api.get('/system-admin/monthly-reports', { params: { month } });
    return response.data;
  },

  async exportReport(type: 'excel' | 'pdf', reportId: string): Promise<ApiResponse<{ file_url: string }>> {
    const response = await api.post('/system-admin/export-report', { type, report_id: reportId });
    return response.data;
  },
};
