import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, IndianRupee } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { STANDARD_DAYS_PER_MONTH, getDaysInMonthForPayroll } from '@/services/payroll.service';

interface MonthlyBreakdownTabProps {
  month: number;
  year: number;
}

interface EmployeeBreakdown {
  id: string;
  name: string;
  employee_id: string | null;
  designation: string | null;
  working_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  lop_days: number;
  basic_pay: number;
  hra: number;
  da: number;
  allowances: number;
  gross_earnings: number;
  pf_deduction: number;
  esi_deduction: number;
  pt_deduction: number;
  lop_deduction: number;
  total_deductions: number;
  net_pay: number;
}

export function MonthlyBreakdownTab({ month, year }: MonthlyBreakdownTabProps) {
  const [employees, setEmployees] = useState<EmployeeBreakdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBreakdown();
  }, [month, year]);

  const fetchBreakdown = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all officers and staff with salary info
      const { data: officers, error: officerError } = await supabase
        .from('officers')
        .select('id, full_name, employee_id, designation, monthly_salary, hourly_rate')
        .eq('status', 'active');

      if (officerError) throw officerError;

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, employee_id, designation, hourly_rate, salary_structure')
        .not('position_id', 'is', null);

      if (profileError) throw profileError;

      // Fetch attendance data for the month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

      const { data: attendance } = await supabase
        .from('officer_attendance')
        .select('officer_id, status, date')
        .gte('date', startDate)
        .lte('date', endDate);

      // Create attendance map
      const attendanceMap = new Map<string, { present: number; absent: number; leave: number }>();
      (attendance || []).forEach((record: any) => {
        const current = attendanceMap.get(record.officer_id) || { present: 0, absent: 0, leave: 0 };
        if (record.status === 'present' || record.status === 'half_day') {
          current.present += record.status === 'half_day' ? 0.5 : 1;
        } else if (record.status === 'absent' || record.status === 'uninformed') {
          current.absent += 1;
        } else if (record.status === 'on_leave') {
          current.leave += 1;
        }
        attendanceMap.set(record.officer_id, current);
      });

      // Calculate breakdown for officers
      const breakdownData: EmployeeBreakdown[] = [];
      
      // Get actual days in the selected month
      const actualDaysInMonth = getDaysInMonthForPayroll(year, month);
      
      (officers || []).forEach((officer: any) => {
        const att = attendanceMap.get(officer.id) || { present: 0, absent: 0, leave: 0 };
        const monthlySalary = officer.monthly_salary || (officer.hourly_rate ? officer.hourly_rate * 8 * actualDaysInMonth : 0);
        
        const perDaySalary = monthlySalary / actualDaysInMonth;
        const lopDays = att.absent;
        const lopDeduction = lopDays * perDaySalary;
        
        const basic = monthlySalary * 0.5;
        const hra = monthlySalary * 0.2;
        const da = monthlySalary * 0.1;
        const allowances = monthlySalary * 0.2;
        
        const pfDeduction = basic * 0.12;
        const esiDeduction = monthlySalary > 21000 ? 0 : monthlySalary * 0.0075;
        const ptDeduction = 200;
        
        const grossEarnings = basic + hra + da + allowances;
        const totalDeductions = pfDeduction + esiDeduction + ptDeduction + lopDeduction;
        const netPay = grossEarnings - totalDeductions;
        
        breakdownData.push({
          id: officer.id,
          name: officer.full_name,
          employee_id: officer.employee_id,
          designation: officer.designation,
          working_days: actualDaysInMonth,
          present_days: att.present,
          absent_days: att.absent,
          leave_days: att.leave,
          lop_days: lopDays,
          basic_pay: basic,
          hra: hra,
          da: da,
          allowances: allowances,
          gross_earnings: grossEarnings,
          pf_deduction: pfDeduction,
          esi_deduction: esiDeduction,
          pt_deduction: ptDeduction,
          lop_deduction: lopDeduction,
          total_deductions: totalDeductions,
          net_pay: Math.max(0, netPay),
        });
      });

      // Calculate breakdown for meta staff
      (profiles || []).forEach((profile: any) => {
        const salaryStructure = profile.salary_structure || {};
        const annualCtc = salaryStructure.annual_ctc || 0;
        const monthlySalary = annualCtc / 12;
        
        const att = attendanceMap.get(profile.id) || { present: 0, absent: 0, leave: 0 };
        
        const perDaySalary = monthlySalary / actualDaysInMonth;
        const lopDays = att.absent;
        const lopDeduction = lopDays * perDaySalary;
        
        const basic = salaryStructure.basic_pay || monthlySalary * 0.5;
        const hra = salaryStructure.hra || monthlySalary * 0.2;
        const da = salaryStructure.da || 0;
        const allowances = (salaryStructure.transport_allowance || 0) + 
                          (salaryStructure.medical_allowance || 0) + 
                          (salaryStructure.special_allowance || 0);
        
        const pfDeduction = basic * 0.12;
        const esiDeduction = monthlySalary > 21000 ? 0 : monthlySalary * 0.0075;
        const ptDeduction = 200;
        
        const grossEarnings = basic + hra + da + allowances;
        const totalDeductions = pfDeduction + esiDeduction + ptDeduction + lopDeduction;
        const netPay = grossEarnings - totalDeductions;
        
        breakdownData.push({
          id: profile.id,
          name: profile.name,
          employee_id: profile.employee_id,
          designation: profile.designation,
          working_days: actualDaysInMonth,
          present_days: att.present,
          absent_days: att.absent,
          leave_days: att.leave,
          lop_days: lopDays,
          basic_pay: basic,
          hra: hra,
          da: da,
          allowances: allowances,
          gross_earnings: grossEarnings,
          pf_deduction: pfDeduction,
          esi_deduction: esiDeduction,
          pt_deduction: ptDeduction,
          lop_deduction: lopDeduction,
          total_deductions: totalDeductions,
          net_pay: Math.max(0, netPay),
        });
      });

      setEmployees(breakdownData);
    } catch (error) {
      console.error('Error fetching breakdown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.employee_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = filteredEmployees.reduce((acc, emp) => ({
    gross_earnings: acc.gross_earnings + emp.gross_earnings,
    total_deductions: acc.total_deductions + emp.total_deductions,
    net_pay: acc.net_pay + emp.net_pay,
  }), { gross_earnings: 0, total_deductions: 0, net_pay: 0 });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Gross Earnings</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.gross_earnings)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Deductions</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.total_deductions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total Net Pay</div>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totals.net_pay)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or employee ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Monthly Payroll Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-center">Working Days</TableHead>
                  <TableHead className="text-center">Present</TableHead>
                  <TableHead className="text-center">Absent</TableHead>
                  <TableHead className="text-center">Leave</TableHead>
                  <TableHead className="text-right">Basic</TableHead>
                  <TableHead className="text-right">HRA</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">PF</TableHead>
                  <TableHead className="text-right">LOP</TableHead>
                  <TableHead className="text-right">Total Ded.</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.employee_id || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{emp.working_days}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {emp.present_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-red-50 text-red-700">
                          {emp.absent_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          {emp.leave_days}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(emp.basic_pay)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(emp.hra)}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-green-600">
                        {formatCurrency(emp.gross_earnings)}
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(emp.pf_deduction)}</TableCell>
                      <TableCell className="text-right text-sm text-red-600">
                        {formatCurrency(emp.lop_deduction)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-600">
                        {formatCurrency(emp.total_deductions)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {formatCurrency(emp.net_pay)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
