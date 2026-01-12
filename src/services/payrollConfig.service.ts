/**
 * Payroll Configuration Service
 * Fetch and manage company payroll settings
 */

import { supabase } from '@/integrations/supabase/client';
import { PayrollConfig, DEFAULT_PAYROLL_CONFIG, SalaryStructure, StatutoryInfo } from '@/types/payroll';

// Fetch company payroll configuration
export const getPayrollConfig = async (): Promise<PayrollConfig> => {
  try {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'company_payroll_config')
      .single();
    
    if (error || !data) {
      console.log('Using default payroll config');
      return DEFAULT_PAYROLL_CONFIG;
    }
    
    return data.value as unknown as PayrollConfig;
  } catch (error) {
    console.error('Error fetching payroll config:', error);
    return DEFAULT_PAYROLL_CONFIG;
  }
};

// Update company payroll configuration
export const updatePayrollConfig = async (config: PayrollConfig): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('system_configurations')
      .update({ value: JSON.parse(JSON.stringify(config)), updated_at: new Date().toISOString() })
      .eq('key', 'company_payroll_config');
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating payroll config:', error);
    return false;
  }
};

// Fetch officer salary structure
export const getOfficerSalaryDetails = async (officerId: string): Promise<{
  annualSalary: number;
  monthlySalary: number;
  salaryStructure: SalaryStructure;
  statutoryInfo: StatutoryInfo;
  designation: string | null;
  hourlyRate: number;
  overtimeMultiplier: number;
}> => {
  const config = await getPayrollConfig();
  
  const { data, error } = await supabase
    .from('officers')
    .select('annual_salary, salary_structure, statutory_info, designation, hourly_rate, overtime_rate_multiplier')
    .eq('id', officerId)
    .single();
  
  if (error) throw error;
  
  const annualSalary = data?.annual_salary || 0;
  const monthlySalary = annualSalary / 12;
  
  // Use stored salary structure or calculate from CTC
  let salaryStructure: SalaryStructure;
  if (data?.salary_structure && typeof data.salary_structure === 'object' && Object.keys(data.salary_structure).length > 0) {
    salaryStructure = data.salary_structure as unknown as SalaryStructure;
  } else {
    // Calculate default breakdown from CTC
    const basic = monthlySalary * (config.salary_components.basic_percentage / 100);
    const hra = monthlySalary * (config.salary_components.hra_percentage / 100);
    const conveyance = config.salary_components.conveyance_allowance;
    const medical = config.salary_components.medical_allowance;
    const special = monthlySalary - basic - hra - conveyance - medical;
    
    salaryStructure = {
      basic_pay: Math.round(basic * 100) / 100,
      hra: Math.round(hra * 100) / 100,
      conveyance_allowance: conveyance,
      medical_allowance: medical,
      special_allowance: Math.round(Math.max(0, special) * 100) / 100,
    };
  }
  
  // Use stored statutory info or defaults
  const statutoryInfo: StatutoryInfo = (data?.statutory_info as unknown as StatutoryInfo) || {
    pf_applicable: true,
    esi_applicable: monthlySalary <= 21000,
    pt_applicable: true,
    pt_state: 'maharashtra',
  };
  
  return {
    annualSalary,
    monthlySalary,
    salaryStructure,
    statutoryInfo,
    designation: data?.designation || null,
    hourlyRate: data?.hourly_rate || (monthlySalary / 22 / 8),
    overtimeMultiplier: data?.overtime_rate_multiplier || config.overtime_settings.default_multiplier,
  };
};

// Fetch staff salary structure (from profiles table)
export const getStaffSalaryDetails = async (userId: string): Promise<{
  annualSalary: number;
  monthlySalary: number;
  salaryStructure: SalaryStructure;
  statutoryInfo: StatutoryInfo;
  designation: string | null;
  hourlyRate: number;
  overtimeMultiplier: number;
}> => {
  const config = await getPayrollConfig();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('annual_salary, hourly_rate, salary_structure, statutory_info, designation, overtime_rate_multiplier')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  
  // Calculate monthly salary from annual or hourly rate
  const hourlyRate = data?.hourly_rate || 500;
  const annualSalary = data?.annual_salary || (hourlyRate * 8 * 22 * 12);
  const monthlySalary = annualSalary / 12;
  
  // Use stored salary structure or calculate from CTC
  let salaryStructure: SalaryStructure;
  if (data?.salary_structure && typeof data.salary_structure === 'object' && Object.keys(data.salary_structure).length > 0) {
    salaryStructure = data.salary_structure as unknown as SalaryStructure;
  } else {
    // Calculate default breakdown from CTC
    const basic = monthlySalary * (config.salary_components.basic_percentage / 100);
    const hra = monthlySalary * (config.salary_components.hra_percentage / 100);
    const conveyance = config.salary_components.conveyance_allowance;
    const medical = config.salary_components.medical_allowance;
    const special = monthlySalary - basic - hra - conveyance - medical;
    
    salaryStructure = {
      basic_pay: Math.round(basic * 100) / 100,
      hra: Math.round(hra * 100) / 100,
      conveyance_allowance: conveyance,
      medical_allowance: medical,
      special_allowance: Math.round(Math.max(0, special) * 100) / 100,
    };
  }
  
  // Use stored statutory info or defaults
  const statutoryInfo: StatutoryInfo = (data?.statutory_info as unknown as StatutoryInfo) || {
    pf_applicable: true,
    esi_applicable: monthlySalary <= 21000,
    pt_applicable: true,
    pt_state: 'maharashtra',
  };
  
  return {
    annualSalary,
    monthlySalary,
    salaryStructure,
    statutoryInfo,
    designation: data?.designation || null,
    hourlyRate,
    overtimeMultiplier: data?.overtime_rate_multiplier || config.overtime_settings.default_multiplier,
  };
};

// Update officer salary structure
export const updateOfficerSalary = async (
  officerId: string,
  salaryStructure: SalaryStructure,
  statutoryInfo: StatutoryInfo,
  designation?: string
): Promise<boolean> => {
  try {
    const updateData: Record<string, unknown> = {
      salary_structure: salaryStructure,
      statutory_info: statutoryInfo,
      updated_at: new Date().toISOString(),
    };
    
    if (designation !== undefined) {
      updateData.designation = designation;
    }
    
    const { error } = await supabase
      .from('officers')
      .update(updateData)
      .eq('id', officerId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating officer salary:', error);
    return false;
  }
};

// Update staff salary structure
export const updateStaffSalary = async (
  userId: string,
  salaryStructure: SalaryStructure,
  statutoryInfo: StatutoryInfo,
  designation?: string
): Promise<boolean> => {
  try {
    const updateData: Record<string, unknown> = {
      salary_structure: salaryStructure,
      statutory_info: statutoryInfo,
      updated_at: new Date().toISOString(),
    };
    
    if (designation !== undefined) {
      updateData.designation = designation;
    }
    
    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating staff salary:', error);
    return false;
  }
};
