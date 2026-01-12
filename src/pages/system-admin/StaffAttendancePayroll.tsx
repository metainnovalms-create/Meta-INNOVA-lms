import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar, Download, User, Clock, DollarSign } from 'lucide-react';
import { mockUsers } from '@/data/mockUsers';
import { getStaffAttendance } from '@/data/mockStaffAttendance';
import { getStaffPayroll } from '@/data/mockStaffPayroll';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/attendanceHelpers';

export default function StaffAttendancePayroll() {
  const [selectedStaff, setSelectedStaff] = useState('6'); // Default to CEO
  const [selectedMonth, setSelectedMonth] = useState('2025-11');

  // Get meta staff users
  const metaStaff = mockUsers.filter(
    (user) =>
      user.role === 'system_admin' &&
      ['ceo', 'md', 'agm', 'gm', 'manager', 'admin_staff'].includes(user.position_name || '')
  );

  const currentStaff = metaStaff.find((s) => s.id === selectedStaff);
  const attendance = getStaffAttendance(selectedStaff, selectedMonth);
  const payroll = getStaffPayroll(selectedStaff, selectedMonth);

  const getPositionDisplay = (position: string) => {
    const displayNames: Record<string, string> = {
      ceo: 'CEO',
      md: 'Managing Director',
      agm: 'AGM',
      gm: 'General Manager',
      manager: 'Manager',
      admin_staff: 'Admin Staff',
    };
    return displayNames[position] || position;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'secondary', label: 'Draft' },
      pending: { variant: 'outline', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      paid: { variant: 'default', label: 'Paid' },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportCSV = () => {
    if (!attendance) return;
    // CSV export logic
    const csv = attendance.daily_records
      .map((record) =>
        [
          record.date,
          record.status,
          record.check_in_time || '',
          record.check_out_time || '',
          record.total_hours || '',
        ].join(',')
      )
      .join('\n');

    const blob = new Blob([`Date,Status,Check-in,Check-out,Hours\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-attendance-${selectedStaff}-${selectedMonth}.csv`;
    a.click();
  };

  return (
    <Layout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Attendance & Payroll</h1>
          <p className="text-muted-foreground mt-2">
            Manage attendance and payroll for all meta staff members
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1">
              <Label>Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metaStaff.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {getPositionDisplay(staff.position_name || '')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025-11">November 2025</SelectItem>
                  <SelectItem value="2025-10">October 2025</SelectItem>
                  <SelectItem value="2025-09">September 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={exportCSV} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payroll</p>
                  <p className="text-2xl font-bold">{payroll ? formatCurrency(payroll.net_pay) : '₹0'}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overtime Hours</p>
                  <p className="text-2xl font-bold">{attendance?.overtime_hours || 0} hrs</p>
                </div>
                <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Working Hours</p>
                  <p className="text-2xl font-bold">{attendance?.total_hours_worked || 0} hrs</p>
                  <p className="text-xs text-muted-foreground">
                    Avg: {attendance ? (attendance.total_hours_worked / attendance.present_days).toFixed(1) : 0}{' '}
                    hrs/day
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Details */}
        {currentStaff && (
          <Card>
            <CardHeader>
              <CardTitle>Staff Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{currentStaff.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">{getPositionDisplay(currentStaff.position_name || '')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="font-medium">₹{currentStaff.hourly_rate}/hr</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Overtime Multiplier</p>
                  <p className="font-medium">{currentStaff.overtime_rate_multiplier}x</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Payroll */}
        {payroll && (
          <Card>
            <CardHeader>
              <CardTitle>Current Month Payroll</CardTitle>
              <CardDescription>
                {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')} Payroll Breakdown
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status</span>
                {getStatusBadge(payroll.status)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Working Days</span>
                  <span>{payroll.working_days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Present</span>
                  <span className="text-green-600">{payroll.present_days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Absent</span>
                  <span className="text-red-600">{payroll.absent_days}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Leave</span>
                  <span className="text-blue-600">{payroll.leave_days}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold">Earnings</h4>
                {payroll.salary_components.map((component, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {component.component_type.replace('_', ' ')}
                    </span>
                    <span>{formatCurrency(component.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Earnings</span>
                  <span>{formatCurrency(payroll.total_earnings)}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h4 className="font-semibold">Deductions</h4>
                {payroll.deductions.map((deduction, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">
                      {deduction.deduction_type.replace('_', ' ')}
                    </span>
                    <span className="text-red-600">-{formatCurrency(deduction.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>Total Deductions</span>
                  <span className="text-red-600">-{formatCurrency(payroll.total_deductions)}</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Net Pay</span>
                  <span className="text-green-600">{formatCurrency(payroll.net_pay)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
