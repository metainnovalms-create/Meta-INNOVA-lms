import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Users, Wallet, Calendar, AlertTriangle } from 'lucide-react';
import { format, subMonths, getDaysInMonth } from 'date-fns';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { fetchAllEmployees, EmployeePayrollSummary, STANDARD_DAYS_PER_MONTH } from '@/services/payroll.service';

interface PayrollAnalyticsTabProps {
  month: number;
  year: number;
}

interface MonthlyData {
  month: string;
  monthLabel: string;
  totalPayroll: number;
  lopDeductions: number;
  officerPayroll: number;
  staffPayroll: number;
  employeeCount: number;
  avgAttendance: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PayrollAnalyticsTab({ month, year }: PayrollAnalyticsTabProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [currentMonthData, setCurrentMonthData] = useState<EmployeePayrollSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [compareMonth, setCompareMonth] = useState<string>('');

  useEffect(() => {
    loadAnalyticsData();
  }, [month, year]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Load last 6 months of data
      const data: MonthlyData[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(year, month - 1), i);
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        
        const employees = await fetchAllEmployees(m, y);
        
        const officerPayroll = employees
          .filter(e => e.user_type === 'officer')
          .reduce((sum, e) => sum + e.net_pay, 0);
        
        const staffPayroll = employees
          .filter(e => e.user_type === 'staff')
          .reduce((sum, e) => sum + e.net_pay, 0);
        
        const totalLop = employees.reduce((sum, e) => {
          const totalLopDays = e.days_lop + (e.days_not_marked ?? 0);
          return sum + (e.per_day_salary * totalLopDays);
        }, 0);
        
        // NEW FORMULA: Attendance % = ((Total Days - (Leave Days + Unmarked Days)) × 100) / Total Days
        // Unmarked days are treated as absent days along with leave days
        const totalDaysInMonth = getDaysInMonth(date);
        const avgAttendance = employees.length > 0
          ? employees.reduce((sum, e) => {
              const leaveDays = e.days_leave || 0;
              const unmarkedDays = e.days_not_marked || 0;
              const absentDays = leaveDays + unmarkedDays;
              return sum + (((totalDaysInMonth - absentDays) * 100) / totalDaysInMonth);
            }, 0) / employees.length
          : 100;
        
        data.push({
          month: format(date, 'yyyy-MM'),
          monthLabel: format(date, 'MMM yyyy'),
          totalPayroll: officerPayroll + staffPayroll,
          lopDeductions: totalLop,
          officerPayroll,
          staffPayroll,
          employeeCount: employees.length,
          avgAttendance
        });
        
        // Store current month data
        if (i === 0) {
          setCurrentMonthData(employees);
        }
      }
      
      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary stats
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  
  const payrollChange = currentMonth && previousMonth
    ? ((currentMonth.totalPayroll - previousMonth.totalPayroll) / previousMonth.totalPayroll) * 100
    : 0;
  
  const lopChange = currentMonth && previousMonth
    ? ((currentMonth.lopDeductions - previousMonth.lopDeductions) / (previousMonth.lopDeductions || 1)) * 100
    : 0;

  // Pie chart data for employee type distribution
  const typeDistribution = [
    { name: 'Officers', value: currentMonthData.filter(e => e.user_type === 'officer').length },
    { name: 'Staff', value: currentMonthData.filter(e => e.user_type === 'staff').length }
  ];

  // Pie chart data for payroll distribution
  const payrollDistribution = [
    { name: 'Officers', value: currentMonth?.officerPayroll || 0 },
    { name: 'Staff', value: currentMonth?.staffPayroll || 0 }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
                <p className="text-2xl font-bold">{formatCurrency(currentMonth?.totalPayroll || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {payrollChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-xs ${payrollChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(payrollChange).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">LOP Deductions</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(currentMonth?.lopDeductions || 0)}</p>
                <div className="flex items-center gap-1 mt-1">
                  {lopChange >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className={`text-xs ${lopChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(lopChange).toFixed(1)}% vs last month
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Attendance</p>
                <p className="text-2xl font-bold">{currentMonth?.avgAttendance.toFixed(1) || 0} days</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Per employee this month
                </p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{currentMonth?.employeeCount || 0}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="default" className="text-xs">
                    {typeDistribution[0].value} Officers
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {typeDistribution[1].value} Staff
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Payroll Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Payroll Trend</CardTitle>
            <CardDescription>Total payroll cost over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelClassName="font-medium"
                  />
                  <Bar dataKey="totalPayroll" name="Total Payroll" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payroll by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Payroll Distribution</CardTitle>
            <CardDescription>Officers vs Staff payroll split</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payrollDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {payrollDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }} />
                <span className="text-sm">Officers: {formatCurrency(currentMonth?.officerPayroll || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }} />
                <span className="text-sm">Staff: {formatCurrency(currentMonth?.staffPayroll || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LOP Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">LOP Deductions Trend</CardTitle>
            <CardDescription>Loss of Pay deductions over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelClassName="font-medium"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="lopDeductions" 
                    name="LOP Deductions"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: '#ef4444' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Officer vs Staff Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Officer vs Staff Comparison</CardTitle>
            <CardDescription>Monthly payroll comparison by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="monthLabel" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    className="text-xs"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelClassName="font-medium"
                  />
                  <Legend />
                  <Bar dataKey="officerPayroll" name="Officers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="staffPayroll" name="Staff" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Summary</CardTitle>
          <CardDescription>Month-by-month payroll and attendance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Month</th>
                  <th className="text-right py-3 px-4 font-medium">Employees</th>
                  <th className="text-right py-3 px-4 font-medium">Avg Attendance</th>
                  <th className="text-right py-3 px-4 font-medium">Officer Payroll</th>
                  <th className="text-right py-3 px-4 font-medium">Staff Payroll</th>
                  <th className="text-right py-3 px-4 font-medium">Total Payroll</th>
                  <th className="text-right py-3 px-4 font-medium">LOP Deductions</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, index) => (
                  <tr key={data.month} className={`border-b ${index === monthlyData.length - 1 ? 'bg-muted/50 font-medium' : ''}`}>
                    <td className="py-3 px-4">
                      {data.monthLabel}
                      {index === monthlyData.length - 1 && (
                        <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                      )}
                    </td>
                    <td className="text-right py-3 px-4">{data.employeeCount}</td>
                    <td className="text-right py-3 px-4">{data.avgAttendance.toFixed(1)} days</td>
                    <td className="text-right py-3 px-4">{formatCurrency(data.officerPayroll)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(data.staffPayroll)}</td>
                    <td className="text-right py-3 px-4 text-green-600">{formatCurrency(data.totalPayroll)}</td>
                    <td className="text-right py-3 px-4 text-red-600">{formatCurrency(data.lopDeductions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
