import { useState } from 'react';
import { format } from 'date-fns';
import { 
  Search, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock,
  DollarSign,
  TrendingUp,
  Users
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatCurrency, calculateMonthlyOvertime, calculateOvertimePay } from '@/utils/attendanceHelpers';
import { mockAttendanceData, mockPayrollData } from '@/data/mockAttendanceData';
import { mockOfficerProfiles } from '@/data/mockOfficerData';
import { PayrollDetailDialog } from './PayrollDetailDialog';
import type { PayrollRecord } from '@/types/attendance';
import { toast } from 'sonner';

export function OfficerPayrollTab() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<PayrollRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filter attendance and calculate payroll for selected month
  const monthlyAttendance = mockAttendanceData.filter(att => att.month === selectedMonth);
  
  // Calculate real-time payroll
  const payrollRecords: PayrollRecord[] = monthlyAttendance.map(attendance => {
    const officer = mockOfficerProfiles.find(o => o.id === attendance.officer_id);
    const existingPayroll = mockPayrollData.find(
      p => p.officer_id === attendance.officer_id && p.month === selectedMonth
    );

    // Calculate overtime
    const normalHours = 8; // Should come from institution config
    const overtimeHours = calculateMonthlyOvertime(attendance.daily_records, normalHours);
    const hourlyRate = officer?.salary ? officer.salary / 160 : 350; // Approx monthly hours
    const overtimePay = calculateOvertimePay(overtimeHours, hourlyRate, 1.5);

    // Use existing payroll or create basic one
    if (existingPayroll) {
      return {
        ...existingPayroll,
        // Add overtime if present
        total_earnings: existingPayroll.total_earnings + overtimePay,
        net_pay: existingPayroll.net_pay + overtimePay,
      };
    }

    // Create basic payroll record
    const baseSalary = officer?.salary || 50000;
    return {
      officer_id: attendance.officer_id,
      officer_name: attendance.officer_name,
      employee_id: attendance.employee_id,
      month: selectedMonth,
      year: parseInt(selectedMonth.split('-')[0]),
      working_days: attendance.present_days + attendance.absent_days + attendance.leave_days,
      days_present: attendance.present_days,
      days_absent: attendance.absent_days,
      days_leave: attendance.leave_days,
      salary_components: [
        { component_type: 'basic_pay' as const, amount: baseSalary, is_taxable: true, calculation_type: 'fixed' as const },
      ],
      total_earnings: baseSalary + overtimePay,
      deductions: [],
      total_deductions: 0,
      gross_salary: baseSalary + overtimePay,
      net_pay: baseSalary + overtimePay,
      pf_employee: 0,
      pf_employer: 0,
      esi_employee: 0,
      esi_employer: 0,
      tds: 0,
      professional_tax: 0,
      status: 'draft' as const,
    };
  });

  // Filter by search
  const filteredRecords = payrollRecords.filter(record =>
    record.officer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary stats
  const totalPayroll = filteredRecords.reduce((sum, r) => sum + r.net_pay, 0);
  const totalOvertimeHours = monthlyAttendance.reduce((sum, att) => {
    return sum + calculateMonthlyOvertime(att.daily_records, 8);
  }, 0);
  const pendingApprovals = filteredRecords.filter(r => r.status === 'pending').length;
  const avgWorkingHours = monthlyAttendance.reduce((sum, att) => sum + att.total_hours_worked, 0) / (monthlyAttendance.length || 1);

  const handleViewDetails = (record: PayrollRecord) => {
    setSelectedOfficer(record);
    setDetailsOpen(true);
  };

  const handleApprove = (officerId: string) => {
    toast.success('Payroll approved successfully');
    // In real app: call API to approve
  };

  const handleExportAll = () => {
    const csvData = filteredRecords.map(r => ({
      'Employee ID': r.employee_id,
      'Officer Name': r.officer_name,
      'Month': r.month,
      'Days Present': r.days_present,
      'Days Absent': r.days_absent,
      'Days Leave': r.days_leave,
      'Gross Salary': r.gross_salary,
      'Total Deductions': r.total_deductions,
      'Net Pay': r.net_pay,
      'Status': r.status,
    }));
    
    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Payroll exported successfully');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: 'secondary' as const, label: 'Draft' },
      pending: { variant: 'outline' as const, label: 'Pending' },
      approved: { variant: 'default' as const, label: 'Approved' },
      paid: { variant: 'default' as const, label: 'Paid' },
    };
    const config = variants[status as keyof typeof variants] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOvertimeHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Across all officers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Working Hours</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgWorkingHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Per officer</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Officer Payroll</CardTitle>
              <CardDescription>Manage salary calculations and approvals</CardDescription>
            </div>
            <Button onClick={handleExportAll} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025-11">November 2025</SelectItem>
                <SelectItem value="2025-10">October 2025</SelectItem>
                <SelectItem value="2025-09">September 2025</SelectItem>
                <SelectItem value="2024-01">January 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payroll Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer</TableHead>
                  <TableHead className="text-right">Normal Hours</TableHead>
                  <TableHead className="text-right">Overtime</TableHead>
                  <TableHead className="text-right">Gross Salary</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No payroll records found for this month
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => {
                    const attendance = monthlyAttendance.find(a => a.officer_id === record.officer_id);
                    const overtimeHours = attendance ? calculateMonthlyOvertime(attendance.daily_records, 8) : 0;
                    
                    return (
                      <TableRow key={record.officer_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{record.officer_name}</div>
                            <div className="text-sm text-muted-foreground">{record.employee_id}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {attendance ? attendance.total_hours_worked.toFixed(1) : '0'}h
                        </TableCell>
                        <TableCell className="text-right">
                          {overtimeHours > 0 ? (
                            <span className="text-green-600 font-medium">{overtimeHours.toFixed(1)}h</span>
                          ) : (
                            <span className="text-muted-foreground">0h</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(record.gross_salary)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(record.total_deductions)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(record.net_pay)}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {record.status === 'pending' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprove(record.officer_id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Detail Dialog */}
      {selectedOfficer && (
        <PayrollDetailDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          payrollRecord={selectedOfficer}
          attendanceRecords={monthlyAttendance.find(a => a.officer_id === selectedOfficer.officer_id)?.daily_records || []}
        />
      )}
    </div>
  );
}
