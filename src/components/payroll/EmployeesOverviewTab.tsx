import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, User, Building2, Calendar, Eye, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { format, parseISO, isValid, getDaysInMonth } from 'date-fns';
import { 
  fetchAllEmployees, 
  EmployeePayrollSummary,
  STANDARD_DAYS_PER_MONTH
} from '@/services/payroll.service';
import { EmployeePayrollDialog } from './EmployeePayrollDialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface EmployeesOverviewTabProps {
  month: number;
  year: number;
}

export function EmployeesOverviewTab({ month, year }: EmployeesOverviewTabProps) {
  const [employees, setEmployees] = useState<EmployeePayrollSummary[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeePayrollSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayrollSummary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [overtimePayMap, setOvertimePayMap] = useState<Record<string, number>>({});

  useEffect(() => {
    loadEmployees();
  }, [month, year]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery, userTypeFilter]);

  const loadEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllEmployees(month, year);
      setEmployees(data);
      
      // Fetch approved overtime pay for all employees
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      
      const { data: overtimeData } = await supabase
        .from('overtime_requests')
        .select('user_id, calculated_pay')
        .eq('status', 'approved')
        .gte('date', startDate)
        .lte('date', endDate);
      
      const otMap: Record<string, number> = {};
      (overtimeData || []).forEach(ot => {
        otMap[ot.user_id] = (otMap[ot.user_id] || 0) + (ot.calculated_pay || 0);
      });
      setOvertimePayMap(otMap);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => 
        e.name.toLowerCase().includes(query) ||
        e.email.toLowerCase().includes(query) ||
        e.position_name?.toLowerCase().includes(query) ||
        e.department?.toLowerCase().includes(query)
      );
    }
    
    if (userTypeFilter !== 'all') {
      filtered = filtered.filter(e => e.user_type === userTypeFilter);
    }
    
    setFilteredEmployees(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Paid</Badge>;
      case 'approved':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">Draft</Badge>;
    }
  };

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const date = parseISO(dateStr);
      if (!isValid(date)) return '-';
      return format(date, 'dd MMM yyyy');
    } catch {
      return '-';
    }
  };

  const calculateProratedSalary = (employee: EmployeePayrollSummary): number => {
    return employee.gross_salary;
  };

  const calculateTotalLopDeduction = (employee: EmployeePayrollSummary): number => {
    return employee.total_deductions;
  };
  
  // NEW FORMULA: Attendance % = ((Total Days in Month - (Leave Days + Unmarked Days)) × 100) / Total Days in Month
  // Unmarked days are treated as absent days along with leave days
  const getAttendancePercentage = (employee: EmployeePayrollSummary): number => {
    const totalDaysInMonth = getDaysInMonth(new Date(year, month - 1));
    const leaveDays = employee.days_leave || 0;
    const unmarkedDays = employee.days_not_marked || 0;
    const absentDays = leaveDays + unmarkedDays;
    return parseFloat((((totalDaysInMonth - absentDays) * 100) / totalDaysInMonth).toFixed(2));
  };
  
  const getOvertimePay = (employee: EmployeePayrollSummary): number => {
    return overtimePayMap[employee.user_id] || 0;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Type', 'Calendar Type', 'Position', 'Join Date', 'Monthly Salary', 'Per Day Salary', 'Days Present', 'Days Leave', 'Days LOP', 'Not Marked', 'Attendance %', 'Total Hours', 'LOP Deduction', 'OT Pay', 'Net Pay', 'Status'];
    const rows = filteredEmployees.map(e => {
      const proratedSalary = calculateProratedSalary(e);
      const daysNotMarked = e.days_not_marked ?? 0;
      const lopDeduction = calculateTotalLopDeduction(e);
      const overtimePay = getOvertimePay(e);
      const netPay = proratedSalary - lopDeduction + overtimePay;
      const attendancePct = getAttendancePercentage(e);
      
      return [
        e.name,
        e.email,
        e.user_type,
        e.user_type === 'officer' ? 'Institution' : 'Company',
        e.position_name || e.department || '-',
        e.join_date || '-',
        proratedSalary.toFixed(2),
        e.per_day_salary.toFixed(2),
        e.days_present,
        e.days_leave,
        e.days_lop,
        daysNotMarked,
        `${attendancePct}%`,
        e.total_hours_worked.toFixed(1),
        lopDeduction.toFixed(2),
        overtimePay.toFixed(2),
        netPay.toFixed(2),
        e.payroll_status
      ];
    });
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-payroll-${year}-${month}.csv`;
    a.click();
  };

  const handleViewDetails = (employee: EmployeePayrollSummary) => {
    setSelectedEmployee(employee);
    setIsDialogOpen(true);
  };

  // Calculate summary stats
  const summaryStats = {
    totalEmployees: filteredEmployees.length,
    officers: filteredEmployees.filter(e => e.user_type === 'officer').length,
    staff: filteredEmployees.filter(e => e.user_type === 'staff').length,
    avgAttendance: filteredEmployees.length > 0 
      ? Math.round(filteredEmployees.reduce((sum, e) => sum + getAttendancePercentage(e), 0) / filteredEmployees.length)
      : 0,
    totalOvertimePay: filteredEmployees.reduce((sum, e) => sum + getOvertimePay(e), 0),
    totalNetPayroll: filteredEmployees.reduce((sum, e) => {
      const overtimePay = getOvertimePay(e);
      return sum + (calculateProratedSalary(e) - calculateTotalLopDeduction(e) + overtimePay);
    }, 0)
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Officers & Staff Overview</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Individual calendar-wise payroll data • Officers use Institution Calendar • Staff use Company Calendar
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search employees..." 
                  className="pl-9 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="officer">Officers</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold">{summaryStats.totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Total Employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold text-primary">{summaryStats.officers}</p>
                <p className="text-xs text-muted-foreground">Officers (Inst. Cal.)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold text-secondary-foreground">{summaryStats.staff}</p>
                <p className="text-xs text-muted-foreground">Staff (Co. Cal.)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className={cn(
                  "text-2xl font-bold",
                  summaryStats.avgAttendance >= 80 ? "text-emerald-600" :
                  summaryStats.avgAttendance >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {summaryStats.avgAttendance}%
                </p>
                <p className="text-xs text-muted-foreground">Avg Attendance</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summaryStats.totalNetPayroll)}</p>
                <p className="text-xs text-muted-foreground">Total Net Payroll</p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type & Calendar</TableHead>
                    <TableHead className="text-center">Attendance</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Leave</TableHead>
                    <TableHead className="text-center text-amber-600">Not Marked</TableHead>
                    <TableHead className="text-center text-red-600">LOP</TableHead>
                    <TableHead className="text-right">Deduction</TableHead>
                    <TableHead className="text-right text-green-600">OT Pay</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No employees found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredEmployees.map((employee) => {
                      const proratedSalary = calculateProratedSalary(employee);
                      const daysNotMarked = employee.days_not_marked ?? 0;
                      const lopDeduction = calculateTotalLopDeduction(employee);
                      const overtimePay = getOvertimePay(employee);
                      const netPay = proratedSalary - lopDeduction + overtimePay;
                      const attendancePct = getAttendancePercentage(employee);
                      
                      return (
                        <TableRow key={employee.user_id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-xs text-muted-foreground">{employee.position_name || employee.department || '-'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant={employee.user_type === 'officer' ? 'default' : 'secondary'} className="text-xs">
                                {employee.user_type === 'officer' ? 'Officer' : 'Staff'}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {employee.user_type === 'officer' ? 'Institution' : 'Company'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {attendancePct >= 80 ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                              ) : attendancePct >= 60 ? (
                                <Minus className="h-4 w-4 text-amber-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={cn(
                                "font-medium",
                                attendancePct >= 80 ? "text-emerald-600" :
                                attendancePct >= 60 ? "text-amber-600" : "text-red-600"
                              )}>
                                {attendancePct}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-emerald-600 font-medium">{employee.days_present}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {employee.days_leave > 0 ? (
                              <span className="text-blue-600 font-medium">{employee.days_leave}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {daysNotMarked > 0 ? (
                              <span className="text-amber-600 font-medium">{daysNotMarked}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {employee.days_lop > 0 ? (
                              <span className="text-red-600 font-medium">{employee.days_lop}</span>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {lopDeduction > 0 ? (
                              <span className="text-red-600">-{formatCurrency(lopDeduction)}</span>
                            ) : (
                              <span className="text-muted-foreground">₹0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {overtimePay > 0 ? (
                              <span className="text-green-600 font-medium">+{formatCurrency(overtimePay)}</span>
                            ) : (
                              <span className="text-muted-foreground">₹0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {formatCurrency(netPay)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(employee)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <EmployeePayrollDialog
        employee={selectedEmployee}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        month={month}
        year={year}
      />
    </>
  );
}
