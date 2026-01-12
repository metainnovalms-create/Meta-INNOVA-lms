import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Users, Clock, DollarSign, AlertTriangle, Calendar, 
  Download, FileText, CheckCircle, XCircle, Search,
  TrendingUp, Wallet, Timer, UserX, UserCheck, ClipboardList
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { PayrollAnalyticsTab } from '@/components/payroll/PayrollAnalyticsTab';
import { IndividualAttendanceTab } from '@/components/payroll/IndividualAttendanceTab';
import { LeaveManagementTab } from '@/components/payroll/LeaveManagementTab';
import { 
  fetchPayrollDashboardStats, 
  PayrollDashboardStats,
  STANDARD_DAYS_PER_MONTH
} from '@/services/payroll.service';

export default function PayrollDashboard() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [stats, setStats] = useState<PayrollDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Parse month/year from selected month
  const [year, month] = selectedMonth.split('-').map(Number);

  useEffect(() => {
    loadStats();
  }, [selectedMonth]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPayrollDashboardStats(month, year);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate month options (last 12 months)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Attendance & Payroll Management</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive attendance and payroll management for all officers and staff
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              LOP calculated using standard {STANDARD_DAYS_PER_MONTH} days per month
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Employees</p>
                  <p className="text-2xl font-bold">{stats?.total_employees || 0}</p>
                  <p className="text-xs text-muted-foreground">Officers + Staff</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Payroll Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.total_payroll_cost || 0)}</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Overtime</p>
                  <p className="text-2xl font-bold">{stats?.pending_overtime_requests || 0}</p>
                  <p className="text-xs text-muted-foreground">{stats?.total_overtime_hours || 0} hours total</p>
                </div>
                <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Timer className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">LOP Deductions</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(stats?.total_lop_deductions || 0)}</p>
                  <p className="text-xs text-muted-foreground">{stats?.uninformed_leave_count || 0} uninformed absences</p>
                </div>
                <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <UserX className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl">
            <TabsTrigger value="attendance" className="gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="leave" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Leave Management</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <IndividualAttendanceTab month={month} year={year} />
          </TabsContent>

          <TabsContent value="leave">
            <LeaveManagementTab year={year} />
          </TabsContent>

          <TabsContent value="analytics">
            <PayrollAnalyticsTab month={month} year={year} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
