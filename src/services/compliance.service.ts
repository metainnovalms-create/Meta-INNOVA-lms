import api from './api';
import { ApiResponse } from '@/types';

interface ComplianceReport {
  file_url: string;
  report_type: string;
  generated_date: string;
}

export const complianceService = {
  async generatePFReport(month: string): Promise<ApiResponse<ComplianceReport>> {
    const response = await api.post('/system-admin/compliance/pf-ecr', { month });
    return response.data;
  },
  
  async generateESIReport(month: string): Promise<ApiResponse<ComplianceReport>> {
    const response = await api.post('/system-admin/compliance/esi-report', { month });
    return response.data;
  },
  
  async generateTDSReport(year: string): Promise<ApiResponse<ComplianceReport>> {
    const response = await api.post('/system-admin/compliance/tds-24q', { year });
    return response.data;
  },
  
  async generatePTReport(month: string): Promise<ApiResponse<ComplianceReport>> {
    const response = await api.post('/system-admin/compliance/pt-report', { month });
    return response.data;
  },
  
  async generateForm16(officerId: string, year: string): Promise<ApiResponse<ComplianceReport>> {
    const response = await api.post('/system-admin/compliance/form16', { officerId, year });
    return response.data;
  },
};
