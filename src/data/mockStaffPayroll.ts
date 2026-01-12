import { StaffPayrollRecord, SalaryComponent, Deduction } from '@/types/attendance';

/**
 * Salary configurations by position
 */
export const staffSalaryConfig = {
  ceo: {
    monthly_salary: 250000,
    hourly_rate: 1500,
    overtime_multiplier: 1.5,
    normal_hours: 8,
  },
  md: {
    monthly_salary: 200000,
    hourly_rate: 1200,
    overtime_multiplier: 1.5,
    normal_hours: 8,
  },
  agm: {
    monthly_salary: 150000,
    hourly_rate: 900,
    overtime_multiplier: 1.5,
    normal_hours: 8,
  },
  gm: {
    monthly_salary: 120000,
    hourly_rate: 720,
    overtime_multiplier: 1.5,
    normal_hours: 8,
  },
  manager: {
    monthly_salary: 80000,
    hourly_rate: 480,
    overtime_multiplier: 1.5,
    normal_hours: 8,
  },
  admin_staff: {
    monthly_salary: 50000,
    hourly_rate: 300,
    overtime_multiplier: 1.5,
    normal_hours: 8,
  },
};

/**
 * Generate salary components based on position and attendance
 */
const generateSalaryComponents = (
  position: keyof typeof staffSalaryConfig,
  presentDays: number,
  totalDays: number,
  overtimeHours: number
): SalaryComponent[] => {
  const config = staffSalaryConfig[position];
  const monthlySalary = config.monthly_salary;
  
  // Pro-rated salary based on attendance
  const basicPay = (monthlySalary * 0.4 * presentDays) / totalDays;
  const hra = (monthlySalary * 0.3 * presentDays) / totalDays;
  const da = (monthlySalary * 0.1 * presentDays) / totalDays;
  const specialAllowance = (monthlySalary * 0.2 * presentDays) / totalDays;
  
  const components: SalaryComponent[] = [
    { component_type: 'basic_pay', amount: Math.round(basicPay), is_taxable: true, calculation_type: 'fixed' },
    { component_type: 'hra', amount: Math.round(hra), is_taxable: true, calculation_type: 'fixed' },
    { component_type: 'da', amount: Math.round(da), is_taxable: true, calculation_type: 'fixed' },
    { component_type: 'special_allowance', amount: Math.round(specialAllowance), is_taxable: true, calculation_type: 'fixed' },
  ];
  
  // Add overtime if any
  if (overtimeHours > 0) {
    const overtimePay = Math.round(overtimeHours * config.hourly_rate * config.overtime_multiplier);
    components.push({
      component_type: 'overtime',
      amount: overtimePay,
      is_taxable: true,
      calculation_type: 'computed',
    });
  }
  
  return components;
};

/**
 * Generate deductions based on gross salary
 */
const generateDeductions = (grossSalary: number, position: string): Deduction[] => {
  const deductions: Deduction[] = [];
  
  // PF (12% of basic, capped at 15000)
  const basicPay = grossSalary * 0.4;
  const pfBase = Math.min(basicPay, 15000);
  const pfAmount = Math.round(pfBase * 0.12);
  
  deductions.push({
    deduction_type: 'pf',
    amount: pfAmount,
    calculation_type: 'statutory',
  });
  
  // Professional Tax (for higher positions)
  if (grossSalary > 10000) {
    deductions.push({
      deduction_type: 'professional_tax',
      amount: 200,
      calculation_type: 'statutory',
    });
  }
  
  // TDS (for higher salaries)
  if (grossSalary > 50000) {
    const tds = Math.round(grossSalary * 0.05);
    deductions.push({
      deduction_type: 'tds',
      amount: tds,
      calculation_type: 'statutory',
    });
  }
  
  return deductions;
};

/**
 * Mock staff payroll data for November 2025
 */
export const mockStaffPayroll: StaffPayrollRecord[] = [
  {
    id: 'payroll-staff-ceo-2025-11',
    staff_id: '6',
    staff_name: 'System Admin CEO',
    position: 'ceo',
    department: 'Executive Management',
    month: '2025-11',
    working_days: 22,
    present_days: 20,
    absent_days: 1,
    leave_days: 1,
    salary_components: generateSalaryComponents('ceo', 20, 22, 8),
    total_earnings: 242000,
    deductions: generateDeductions(242000, 'ceo'),
    total_deductions: 12300,
    gross_salary: 242000,
    net_pay: 229700,
    pf_employee: 1800,
    pf_employer: 1800,
    professional_tax: 200,
    tds: 10300,
    status: 'approved',
    generated_at: '2025-11-25T10:00:00Z',
  },
  {
    id: 'payroll-staff-md-2025-11',
    staff_id: '7',
    staff_name: 'Managing Director',
    position: 'md',
    department: 'Executive Management',
    month: '2025-11',
    working_days: 22,
    present_days: 21,
    absent_days: 0,
    leave_days: 1,
    salary_components: generateSalaryComponents('md', 21, 22, 8),
    total_earnings: 205200,
    deductions: generateDeductions(205200, 'md'),
    total_deductions: 10460,
    gross_salary: 205200,
    net_pay: 194740,
    pf_employee: 1800,
    pf_employer: 1800,
    professional_tax: 200,
    tds: 8460,
    status: 'approved',
    generated_at: '2025-11-25T10:00:00Z',
  },
  {
    id: 'payroll-staff-agm-2025-11',
    staff_id: '9',
    staff_name: 'AGM Operations',
    position: 'agm',
    department: 'Operations',
    month: '2025-11',
    working_days: 22,
    present_days: 21,
    absent_days: 1,
    leave_days: 0,
    salary_components: generateSalaryComponents('agm', 21, 22, 12),
    total_earnings: 159600,
    deductions: generateDeductions(159600, 'agm'),
    total_deductions: 8180,
    gross_salary: 159600,
    net_pay: 151420,
    pf_employee: 1800,
    pf_employer: 1800,
    professional_tax: 200,
    tds: 6180,
    status: 'approved',
    generated_at: '2025-11-25T10:00:00Z',
  },
  {
    id: 'payroll-staff-gm-2025-11',
    staff_id: '10',
    staff_name: 'General Manager',
    position: 'gm',
    department: 'Operations',
    month: '2025-11',
    working_days: 22,
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    salary_components: generateSalaryComponents('gm', 22, 22, 8),
    total_earnings: 128640,
    deductions: generateDeductions(128640, 'gm'),
    total_deductions: 6632,
    gross_salary: 128640,
    net_pay: 122008,
    pf_employee: 1800,
    pf_employer: 1800,
    professional_tax: 200,
    tds: 4632,
    status: 'approved',
    generated_at: '2025-11-25T10:00:00Z',
  },
  {
    id: 'payroll-staff-manager-2025-11',
    staff_id: '8',
    staff_name: 'Operations Manager',
    position: 'manager',
    department: 'Operations',
    month: '2025-11',
    working_days: 22,
    present_days: 21,
    absent_days: 1,
    leave_days: 0,
    salary_components: generateSalaryComponents('manager', 21, 22, 8),
    total_earnings: 82560,
    deductions: generateDeductions(82560, 'manager'),
    total_deductions: 4328,
    gross_salary: 82560,
    net_pay: 78232,
    pf_employee: 1800,
    pf_employer: 1800,
    professional_tax: 200,
    tds: 2328,
    status: 'draft',
    generated_at: '2025-11-25T10:00:00Z',
  },
  {
    id: 'payroll-staff-adminstaff-2025-11',
    staff_id: '11',
    staff_name: 'Admin Staff',
    position: 'admin_staff',
    department: 'Administration',
    month: '2025-11',
    working_days: 22,
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    salary_components: generateSalaryComponents('admin_staff', 22, 22, 0),
    total_earnings: 50000,
    deductions: generateDeductions(50000, 'admin_staff'),
    total_deductions: 2600,
    gross_salary: 50000,
    net_pay: 47400,
    pf_employee: 1800,
    pf_employer: 1800,
    professional_tax: 200,
    tds: 600,
    status: 'draft',
    generated_at: '2025-11-25T10:00:00Z',
  },
];

/**
 * Get staff payroll by ID and month
 */
export const getStaffPayroll = (staffId: string, month: string): StaffPayrollRecord | undefined => {
  return mockStaffPayroll.find((record) => record.staff_id === staffId && record.month === month);
};

/**
 * Get all staff payroll for a month
 */
export const getAllStaffPayrollForMonth = (month: string): StaffPayrollRecord[] => {
  return mockStaffPayroll.filter((record) => record.month === month);
};
