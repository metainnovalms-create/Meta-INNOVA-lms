import api from './api';
import { ApiResponse } from '@/types';
import { Payslip, PayrollRecord } from '@/types/attendance';

export const payslipService = {
  async generatePayslip(payrollRecord: PayrollRecord): Promise<ApiResponse<Payslip>> {
    const response = await api.post('/system-admin/payroll/generate-payslip', payrollRecord);
    return response.data;
  },
  
  async getPayslip(payslipId: string): Promise<ApiResponse<Payslip>> {
    const response = await api.get(`/system-admin/payroll/payslips/${payslipId}`);
    return response.data;
  },
  
  async emailPayslip(payslipId: string, emailAddress: string): Promise<ApiResponse<void>> {
    const response = await api.post(`/system-admin/payroll/payslips/${payslipId}/email`, {
      email: emailAddress,
    });
    return response.data;
  },
  
  async getOfficerPayslips(officerId: string): Promise<ApiResponse<Payslip[]>> {
    const response = await api.get(`/system-admin/officers/${officerId}/payslips`);
    return response.data;
  },
  
  async bulkGeneratePayslips(month: string): Promise<ApiResponse<{ generated: number; failed: number }>> {
    const response = await api.post('/system-admin/payroll/bulk-generate-payslips', { month });
    return response.data;
  },
};
