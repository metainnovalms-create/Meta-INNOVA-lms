import { OfficerAttendanceRecord, PayrollRecord, DailyAttendance } from '@/types/attendance';
import { mockOfficerProfiles } from './mockOfficerData';

const generateDailyRecords = (
  month: string,
  pattern: 'regular' | 'some_absences' | 'frequent_absences'
): DailyAttendance[] => {
  const records: DailyAttendance[] = [];
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr);
  const monthNum = parseInt(monthStr);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = new Date(year, monthNum - 1, day).getDay();
    
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    
    let status: 'present' | 'absent' | 'leave';
    let checkIn: string | undefined;
    let checkOut: string | undefined;
    let hoursWorked: number | undefined;
    let overtimeHours: number | undefined;
    
    // Generate random GPS coordinates (near a fictional institution)
    const baseLatitude = 28.6139; // Delhi coordinates as example
    const baseLongitude = 77.2090;
    const randomOffset = () => (Math.random() - 0.5) * 0.01; // ~1km radius
    
    if (pattern === 'regular') {
      status = 'present';
      const checkInHour = 8 + Math.floor(Math.random() * 2);
      const checkInMin = 15 + Math.floor(Math.random() * 30);
      checkIn = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')} AM`;
      
      const checkOutHour = 5 + Math.floor(Math.random() * 2);
      const checkOutMin = Math.floor(Math.random() * 60);
      checkOut = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')} PM`;
      
      hoursWorked = 8 + Math.random() * 2; // 8-10 hours
      overtimeHours = Math.max(0, hoursWorked - 8);
    } else if (pattern === 'some_absences') {
      const rand = Math.random();
      if (rand < 0.85) {
        status = 'present';
        checkIn = `0${8 + Math.floor(Math.random() * 2)}:${15 + Math.floor(Math.random() * 30)} AM`;
        checkOut = `0${5 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60)} PM`;
        hoursWorked = 8 + Math.random();
        overtimeHours = Math.max(0, hoursWorked - 8);
      } else if (rand < 0.92) {
        status = 'leave';
      } else {
        status = 'absent';
      }
    } else {
      const rand = Math.random();
      if (rand < 0.70) {
        status = 'present';
        checkIn = `0${8 + Math.floor(Math.random() * 2)}:${15 + Math.floor(Math.random() * 30)} AM`;
        checkOut = `0${5 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60)} PM`;
        hoursWorked = 8 + Math.random();
        overtimeHours = Math.max(0, hoursWorked - 8);
      } else if (rand < 0.85) {
        status = 'leave';
      } else {
        status = 'absent';
      }
    }
    
    const record: DailyAttendance = {
      date,
      status,
      check_in_time: checkIn,
      check_out_time: checkOut,
      hours_worked: hoursWorked,
      overtime_hours: overtimeHours,
    };
    
    // Add GPS location for present days
    if (status === 'present') {
      record.check_in_location = {
        latitude: baseLatitude + randomOffset(),
        longitude: baseLongitude + randomOffset(),
        timestamp: `${date}T${checkIn?.replace(' AM', ':00').replace(' PM', ':00')}`,
      };
      record.check_out_location = {
        latitude: baseLatitude + randomOffset(),
        longitude: baseLongitude + randomOffset(),
        timestamp: `${date}T${checkOut?.replace(' AM', ':00').replace(' PM', ':00')}`,
      };
      record.location_validated = true;
    }
    
    if (status === 'leave') {
      record.leave_type = day % 3 === 0 ? 'sick' : 'casual';
      record.leave_reason = day % 3 === 0 ? 'Medical appointment' : 'Personal work';
    }
    
    records.push(record);
  }
  
  return records;
};

export const mockAttendanceData: OfficerAttendanceRecord[] = [
  {
    officer_id: 'off-001',
    officer_name: 'Dr. Rajesh Kumar',
    employee_id: 'EMP-IOF-001',
    department: 'Innovation & Research',
    month: '2024-01',
    daily_records: generateDailyRecords('2024-01', 'regular'),
    present_days: 22,
    absent_days: 0,
    leave_days: 1,
    total_hours_worked: 184,
    last_marked_date: '2024-01-31',
  },
  {
    officer_id: '3',
    officer_name: 'Innovation Officer',
    employee_id: 'EMP-IOF-003',
    department: 'Innovation & Research',
    month: '2024-01',
    daily_records: generateDailyRecords('2024-01', 'some_absences'),
    present_days: 20,
    absent_days: 2,
    leave_days: 1,
    total_hours_worked: 168,
    last_marked_date: '2024-01-30',
  },
  {
    officer_id: 'off-002',
    officer_name: 'Prof. Anita Sharma',
    employee_id: 'EMP-IOF-002',
    department: 'Innovation & Research',
    month: '2024-01',
    daily_records: generateDailyRecords('2024-01', 'regular'),
    present_days: 21,
    absent_days: 1,
    leave_days: 1,
    total_hours_worked: 176,
    last_marked_date: '2024-01-31',
  },
  // September 2025 records
  {
    officer_id: 'off-001',
    officer_name: 'Dr. Rajesh Kumar',
    employee_id: 'EMP-IOF-001',
    department: 'Innovation & Research',
    month: '2025-09',
    daily_records: generateDailyRecords('2025-09', 'regular'),
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    total_hours_worked: 184,
    last_marked_date: '2025-09-30',
  },
  {
    officer_id: '3',
    officer_name: 'Innovation Officer',
    employee_id: 'EMP-IOF-003',
    department: 'Innovation & Research',
    month: '2025-09',
    daily_records: generateDailyRecords('2025-09', 'regular'),
    present_days: 21,
    absent_days: 1,
    leave_days: 0,
    total_hours_worked: 176,
    last_marked_date: '2025-09-30',
  },
  {
    officer_id: 'off-002',
    officer_name: 'Prof. Anita Sharma',
    employee_id: 'EMP-IOF-002',
    department: 'Innovation & Research',
    month: '2025-09',
    daily_records: generateDailyRecords('2025-09', 'regular'),
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    total_hours_worked: 184,
    last_marked_date: '2025-09-30',
  },
  // October 2025 records
  {
    officer_id: 'off-001',
    officer_name: 'Dr. Rajesh Kumar',
    employee_id: 'EMP-IOF-001',
    department: 'Innovation & Research',
    month: '2025-10',
    daily_records: generateDailyRecords('2025-10', 'regular'),
    present_days: 20,
    absent_days: 0,
    leave_days: 1,
    total_hours_worked: 168,
    last_marked_date: '2025-10-29',
  },
  {
    officer_id: '3',
    officer_name: 'Innovation Officer',
    employee_id: 'EMP-IOF-003',
    department: 'Innovation & Research',
    month: '2025-10',
    daily_records: generateDailyRecords('2025-10', 'regular'),
    present_days: 19,
    absent_days: 0,
    leave_days: 2,
    total_hours_worked: 160,
    last_marked_date: '2025-10-29',
  },
  {
    officer_id: 'off-002',
    officer_name: 'Prof. Anita Sharma',
    employee_id: 'EMP-IOF-002',
    department: 'Innovation & Research',
    month: '2025-10',
    daily_records: generateDailyRecords('2025-10', 'regular'),
    present_days: 21,
    absent_days: 0,
    leave_days: 0,
    total_hours_worked: 176,
    last_marked_date: '2025-10-29',
  },
  // November 2025 records (current month)
  {
    officer_id: 'off-001',
    officer_name: 'Dr. Rajesh Kumar',
    employee_id: 'EMP-IOF-001',
    department: 'Innovation & Research',
    month: '2025-11',
    daily_records: generateDailyRecords('2025-11', 'regular'),
    present_days: 16,
    absent_days: 0,
    leave_days: 1,
    total_hours_worked: 136,
    last_marked_date: '2025-11-24',
  },
  {
    officer_id: '3',
    officer_name: 'Innovation Officer',
    employee_id: 'EMP-IOF-003',
    department: 'Innovation & Research',
    month: '2025-11',
    daily_records: generateDailyRecords('2025-11', 'regular'),
    present_days: 15,
    absent_days: 1,
    leave_days: 1,
    total_hours_worked: 128,
    last_marked_date: '2025-11-24',
  },
  {
    officer_id: 'off-002',
    officer_name: 'Prof. Anita Sharma',
    employee_id: 'EMP-IOF-002',
    department: 'Innovation & Research',
    month: '2025-11',
    daily_records: generateDailyRecords('2025-11', 'regular'),
    present_days: 16,
    absent_days: 0,
    leave_days: 1,
    total_hours_worked: 136,
    last_marked_date: '2025-11-24',
  },
  // Saran T (Kikani Global Academy) - September 2025
  {
    officer_id: 'off-kga-001',
    officer_name: 'Mr. Saran T',
    employee_id: 'EMP-KGA-IOF-001',
    department: 'Innovation & STEM Education',
    month: '2025-09',
    daily_records: generateDailyRecords('2025-09', 'regular'),
    present_days: 22,
    absent_days: 0,
    leave_days: 0,
    total_hours_worked: 184,
    last_marked_date: '2025-09-30',
  },
  // Saran T - October 2025
  {
    officer_id: 'off-kga-001',
    officer_name: 'Mr. Saran T',
    employee_id: 'EMP-KGA-IOF-001',
    department: 'Innovation & STEM Education',
    month: '2025-10',
    daily_records: generateDailyRecords('2025-10', 'regular'),
    present_days: 21,
    absent_days: 0,
    leave_days: 2,
    total_hours_worked: 176,
    last_marked_date: '2025-10-31',
  },
  // Saran T - November 2025 (Current)
  {
    officer_id: 'off-kga-001',
    officer_name: 'Mr. Saran T',
    employee_id: 'EMP-KGA-IOF-001',
    department: 'Innovation & STEM Education',
    month: '2025-11',
    daily_records: generateDailyRecords('2025-11', 'regular'),
    present_days: 17,
    absent_days: 0,
    leave_days: 0,
    total_hours_worked: 142,
    last_marked_date: '2025-11-24',
  },
];

// Helper function to filter attendance by institution
export const getAttendanceByInstitution = (tenantSlug: string): OfficerAttendanceRecord[] => {
  // Get officers assigned to this institution
  const institutionOfficers = mockOfficerProfiles
    .filter(officer => officer.assigned_institutions.includes(tenantSlug))
    .map(officer => officer.id);
  
  // Return only attendance records for those officers
  return mockAttendanceData.filter(attendance => 
    institutionOfficers.includes(attendance.officer_id)
  );
};

export const mockPayrollData: PayrollRecord[] = [
  {
    officer_id: '1',
    officer_name: 'John Smith',
    employee_id: 'EMP001',
    month: '2024-01',
    year: 2024,
    working_days: 23,
    days_present: 22,
    days_absent: 0,
    days_leave: 1,
    salary_components: [
      { component_type: 'basic_pay', amount: 26000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'hra', amount: 13000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'da', amount: 6500, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'transport_allowance', amount: 3250, is_taxable: false, calculation_type: 'fixed' },
      { component_type: 'special_allowance', amount: 13000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'medical_allowance', amount: 3250, is_taxable: false, calculation_type: 'fixed' },
    ],
    total_earnings: 65000,
    deductions: [
      { deduction_type: 'pf', amount: 3120, calculation_type: 'statutory' },
      { deduction_type: 'professional_tax', amount: 200, calculation_type: 'statutory' },
      { deduction_type: 'tds', amount: 1680, calculation_type: 'statutory' },
    ],
    total_deductions: 5000,
    gross_salary: 65000,
    net_pay: 60000,
    salary_monthly: 65000,
    calculated_pay: 65000,
    pf_employee: 3120,
    pf_employer: 3120,
    esi_employee: 0,
    esi_employer: 0,
    tds: 1680,
    professional_tax: 200,
    status: 'approved',
    approved_by: 'Admin',
    approved_date: '2024-01-31',
  },
  {
    officer_id: '2',
    officer_name: 'Sarah Johnson',
    employee_id: 'EMP002',
    month: '2024-01',
    year: 2024,
    working_days: 23,
    days_present: 20,
    days_absent: 2,
    days_leave: 1,
    salary_components: [
      { component_type: 'basic_pay', amount: 24800, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'hra', amount: 12400, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'da', amount: 6200, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'transport_allowance', amount: 3100, is_taxable: false, calculation_type: 'fixed' },
      { component_type: 'special_allowance', amount: 12400, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'medical_allowance', amount: 3100, is_taxable: false, calculation_type: 'fixed' },
    ],
    total_earnings: 62000,
    deductions: [
      { deduction_type: 'pf', amount: 2976, calculation_type: 'statutory' },
      { deduction_type: 'professional_tax', amount: 200, calculation_type: 'statutory' },
      { deduction_type: 'tds', amount: 1324, calculation_type: 'statutory' },
    ],
    total_deductions: 4500,
    gross_salary: 62000,
    net_pay: 57500,
    salary_monthly: 62000,
    calculated_pay: 56522,
    pf_employee: 2976,
    pf_employer: 2976,
    esi_employee: 0,
    esi_employer: 0,
    tds: 1324,
    professional_tax: 200,
    status: 'pending',
  },
  {
    officer_id: '3',
    officer_name: 'Michael Chen',
    employee_id: 'EMP003',
    month: '2024-01',
    year: 2024,
    working_days: 23,
    days_present: 18,
    days_absent: 3,
    days_leave: 2,
    salary_components: [
      { component_type: 'basic_pay', amount: 22000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'hra', amount: 11000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'da', amount: 5500, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'transport_allowance', amount: 2750, is_taxable: false, calculation_type: 'fixed' },
      { component_type: 'special_allowance', amount: 11000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'medical_allowance', amount: 2750, is_taxable: false, calculation_type: 'fixed' },
    ],
    total_earnings: 55000,
    deductions: [
      { deduction_type: 'pf', amount: 2640, calculation_type: 'statutory' },
      { deduction_type: 'professional_tax', amount: 200, calculation_type: 'statutory' },
      { deduction_type: 'tds', amount: 660, calculation_type: 'statutory' },
    ],
    total_deductions: 3500,
    gross_salary: 55000,
    net_pay: 51500,
    salary_monthly: 55000,
    calculated_pay: 47826,
    pf_employee: 2640,
    pf_employer: 2640,
    esi_employee: 0,
    esi_employer: 0,
    tds: 660,
    professional_tax: 200,
    status: 'pending',
  },
  {
    officer_id: '4',
    officer_name: 'Emily Rodriguez',
    employee_id: 'EMP004',
    month: '2024-01',
    year: 2024,
    working_days: 23,
    days_present: 21,
    days_absent: 1,
    days_leave: 1,
    salary_components: [
      { component_type: 'basic_pay', amount: 24000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'hra', amount: 12000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'da', amount: 6000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'transport_allowance', amount: 3000, is_taxable: false, calculation_type: 'fixed' },
      { component_type: 'special_allowance', amount: 12000, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'medical_allowance', amount: 3000, is_taxable: false, calculation_type: 'fixed' },
    ],
    total_earnings: 60000,
    deductions: [
      { deduction_type: 'pf', amount: 2880, calculation_type: 'statutory' },
      { deduction_type: 'professional_tax', amount: 200, calculation_type: 'statutory' },
      { deduction_type: 'tds', amount: 1220, calculation_type: 'statutory' },
    ],
    total_deductions: 4300,
    gross_salary: 60000,
    net_pay: 55700,
    salary_monthly: 60000,
    calculated_pay: 58696,
    pf_employee: 2880,
    pf_employer: 2880,
    esi_employee: 0,
    esi_employer: 0,
    tds: 1220,
    professional_tax: 200,
    status: 'approved',
    approved_by: 'Admin',
    approved_date: '2024-01-31',
  },
  {
    officer_id: '5',
    officer_name: 'David Park',
    employee_id: 'EMP005',
    month: '2024-01',
    year: 2024,
    working_days: 23,
    days_present: 19,
    days_absent: 2,
    days_leave: 2,
    salary_components: [
      { component_type: 'basic_pay', amount: 23200, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'hra', amount: 11600, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'da', amount: 5800, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'transport_allowance', amount: 2900, is_taxable: false, calculation_type: 'fixed' },
      { component_type: 'special_allowance', amount: 11600, is_taxable: true, calculation_type: 'fixed' },
      { component_type: 'medical_allowance', amount: 2900, is_taxable: false, calculation_type: 'fixed' },
    ],
    total_earnings: 58000,
    deductions: [
      { deduction_type: 'pf', amount: 2784, calculation_type: 'statutory' },
      { deduction_type: 'professional_tax', amount: 200, calculation_type: 'statutory' },
      { deduction_type: 'tds', amount: 1016, calculation_type: 'statutory' },
      { deduction_type: 'loan', amount: 2000, calculation_type: 'fixed', notes: 'Personal loan EMI' },
    ],
    total_deductions: 6000,
    gross_salary: 58000,
    net_pay: 52000,
    salary_monthly: 58000,
    calculated_pay: 52174,
    pf_employee: 2784,
    pf_employer: 2784,
    esi_employee: 0,
    esi_employer: 0,
    tds: 1016,
    professional_tax: 200,
    status: 'draft',
  },
];
