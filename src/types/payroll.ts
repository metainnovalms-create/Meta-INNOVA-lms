/**
 * Payroll Types
 * Salary structure, statutory info, and payroll configuration types
 */

export interface SalaryStructure {
  basic_pay: number;           // 50% of CTC by default
  hra: number;                 // House Rent Allowance (20% of CTC)
  conveyance_allowance: number; // Fixed amount
  medical_allowance: number;    // Fixed amount
  special_allowance: number;    // Balance amount
  da?: number;                  // Dearness Allowance (optional)
  transport_allowance?: number; // Transport (optional)
  other_allowances?: number;
}

export interface StatutoryInfo {
  pf_applicable: boolean;       // Provident Fund
  pf_account_number?: string;
  esi_applicable: boolean;      // Employee State Insurance
  esi_number?: string;
  pt_applicable: boolean;       // Professional Tax
  pt_state?: string;
  uan_number?: string;          // Universal Account Number
  pan_number?: string;
}

export interface PayrollConfig {
  company_name: string;
  company_address: string;
  company_logo_url?: string;
  statutory_settings: {
    pf_rate_employee: number;
    pf_rate_employer: number;
    esi_rate_employee: number;
    esi_rate_employer: number;
    esi_wage_limit: number;
    professional_tax_state: string;
  };
  salary_components: {
    basic_percentage: number;
    hra_percentage: number;
    conveyance_allowance: number;
    medical_allowance: number;
    special_allowance_percentage: number;
  };
  overtime_settings: {
    default_multiplier: number;
    weekend_multiplier: number;
  };
}

export const DEFAULT_PAYROLL_CONFIG: PayrollConfig = {
  company_name: 'MetaSage Alliance',
  company_address: 'Mumbai, Maharashtra, India',
  statutory_settings: {
    pf_rate_employee: 12,
    pf_rate_employer: 12,
    esi_rate_employee: 0.75,
    esi_rate_employer: 3.25,
    esi_wage_limit: 21000,
    professional_tax_state: 'maharashtra',
  },
  salary_components: {
    basic_percentage: 50,
    hra_percentage: 20,
    conveyance_allowance: 1600,
    medical_allowance: 1250,
    special_allowance_percentage: 15,
  },
  overtime_settings: {
    default_multiplier: 1.5,
    weekend_multiplier: 2.0,
  },
};

// Calculate salary breakdown from CTC
export const calculateSalaryBreakdown = (
  annualCTC: number, 
  config: PayrollConfig['salary_components']
): SalaryStructure => {
  const monthlyCTC = annualCTC / 12;
  const basic = monthlyCTC * (config.basic_percentage / 100);
  const hra = monthlyCTC * (config.hra_percentage / 100);
  const conveyance = config.conveyance_allowance;
  const medical = config.medical_allowance;
  const special = monthlyCTC - basic - hra - conveyance - medical;
  
  return {
    basic_pay: Math.round(basic * 100) / 100,
    hra: Math.round(hra * 100) / 100,
    conveyance_allowance: conveyance,
    medical_allowance: medical,
    special_allowance: Math.round(Math.max(0, special) * 100) / 100,
  };
};

// Calculate professional tax based on state
export const calculateProfessionalTax = (monthlySalary: number, state: string = 'maharashtra'): number => {
  if (state === 'maharashtra') {
    if (monthlySalary <= 7500) return 0;
    if (monthlySalary <= 10000) return 175;
    return 200;
  }
  // Default
  if (monthlySalary <= 15000) return 0;
  return 200;
};

// Calculate PF deduction
export const calculatePFDeduction = (basicSalary: number, pfRate: number = 12): number => {
  const pfCeiling = 15000; // PF calculated on max ₹15,000 basic
  const applicableBasic = Math.min(basicSalary, pfCeiling);
  return Math.round(applicableBasic * (pfRate / 100));
};

// Calculate ESI deduction
export const calculateESIDeduction = (grossSalary: number, esiRate: number = 0.75, wageLimit: number = 21000): number => {
  if (grossSalary > wageLimit) return 0; // Not applicable above wage limit
  return Math.round(grossSalary * (esiRate / 100));
};
