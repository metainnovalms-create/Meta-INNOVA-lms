import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarCheck, Calendar, AlertCircle, Info, Clock, CheckCircle, 
  XCircle, Download, FileText, TrendingUp, TrendingDown, Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { leaveApplicationService, leaveBalanceService } from '@/services/leave.service';
import { leaveCalculationService } from '@/services/leaveCalculation.service';
import { calendarDayTypeService } from '@/services/calendarDayType.service';
import { useAuth } from '@/contexts/AuthContext';
import { LeaveHolidayCalendar, calculateActualLeaveDays } from '@/components/leave/LeaveHolidayCalendar';
import { 
  LeaveType, 
  LeaveStatus,
  LEAVE_TYPE_LABELS, 
  LEAVE_STATUS_LABELS,
  MAX_LEAVES_PER_MONTH,
  LEAVES_PER_YEAR
} from '@/types/leave';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Leave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'casual' as LeaveType,
    reason: ''
  });

  // Fetch leave balance for current month
  const { data: balance } = useQuery({
    queryKey: ['leave-balance', user?.id, currentYear, currentMonth],
    queryFn: () => leaveBalanceService.getBalance(user!.id, currentYear, currentMonth),
    enabled: !!user?.id
  });

  // Fetch yearly balances for all 12 months using RPC (works even if no table rows exist)
  const { data: yearlyBalances = [] } = useQuery({
    queryKey: ['leave-balances-yearly-rpc', user?.id, selectedYear],
    queryFn: async () => {
      const year = parseInt(selectedYear);
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, i) => i + 1).map(async (month) => {
          try {
            const balance = await leaveBalanceService.getBalance(user!.id, year, month);
            if (balance) {
              return { 
                month, 
                ...balance,
                total_available: balance.monthly_credit + balance.carried_forward
              };
            }
          } catch (error) {
            console.warn(`Error fetching balance for month ${month}:`, error);
          }
          // Return default values if RPC fails or returns null
          return { 
            month, 
            monthly_credit: 1, 
            carried_forward: 0, 
            total_available: 1,
            sick_leave_used: 0, 
            casual_leave_used: 0,
            total_used: 0,
            lop_days: 0,
            balance_remaining: 1
          };
        })
      );
      return results;
    },
    enabled: !!user?.id
  });

  // Fetch yearly summary with pro-rated info
  const { data: yearlySummary } = useQuery({
    queryKey: ['leave-yearly-summary', user?.id, selectedYear],
    queryFn: () => leaveCalculationService.getYearlySummary(user!.id, parseInt(selectedYear)),
    enabled: !!user?.id
  });

  // Fetch all leave applications
  const { data: applications = [] } = useQuery({
    queryKey: ['my-leave-applications', user?.id],
    queryFn: () => leaveApplicationService.getMyApplications(),
    enabled: !!user?.id
  });

  // Fetch company holidays from calendar_day_types (for display in calendar)
  const { data: companyHolidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['company-calendar-holidays', currentYear],
    queryFn: () => calendarDayTypeService.getHolidaysForYear('company', currentYear),
  });

  // Fetch company calendar non-working days (weekends + holidays) for leave calculation
  const { data: companyNonWorkingDays = { weekends: [], holidays: [] } } = useQuery({
    queryKey: ['company-non-working-days', formData.start_date, formData.end_date],
    queryFn: () => calendarDayTypeService.getNonWorkingDaysInRange(
      'company',
      formData.start_date,
      formData.end_date
    ),
    enabled: !!formData.start_date && !!formData.end_date
  });

  // Calculate leave days excluding weekends AND holidays from company calendar
  const leaveCalculation = useMemo(() => {
    if (!formData.start_date || !formData.end_date) {
      return { totalCalendarDays: 0, weekendsInRange: 0, holidaysInRange: 0, actualLeaveDays: 0 };
    }
    return calculateActualLeaveDays(
      formData.start_date,
      formData.end_date,
      companyNonWorkingDays.weekends,
      companyNonWorkingDays.holidays
    );
  }, [formData.start_date, formData.end_date, companyNonWorkingDays]);

  const applyMutation = useMutation({
    mutationFn: leaveApplicationService.applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-applications'] });
      queryClient.invalidateQueries({ queryKey: ['leave-yearly-summary'] });
      toast.success('Leave application submitted successfully');
      setFormData({ start_date: '', end_date: '', leave_type: 'casual', reason: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const yearApplications = applications.filter(app => {
    const appYear = new Date(app.start_date).getFullYear();
    return appYear === parseInt(selectedYear);
  });

  const stats = {
    totalEntitlement: yearlySummary?.totalEntitlement || LEAVES_PER_YEAR,
    used: yearApplications.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.paid_days, 0),
    pending: yearApplications.filter(a => a.status === 'pending').length,
    lop: yearApplications.filter(a => a.status === 'approved').reduce((sum, a) => sum + a.lop_days, 0),
    approved: yearApplications.filter(a => a.status === 'approved').length,
    rejected: yearApplications.filter(a => a.status === 'rejected').length,
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const variants: Record<LeaveStatus, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      cancelled: "outline",
    };
    
    const icons = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      approved: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />,
      cancelled: <AlertCircle className="h-3 w-3 mr-1" />,
    };
    
    return (
      <Badge variant={variants[status]} className="flex items-center w-fit">
        {icons[status]}
        {LEAVE_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const calculateDays = () => {
    return leaveCalculation.actualLeaveDays;
  };

  const getLOPWarning = () => {
    const days = calculateDays();
    if (!balance || days === 0) return null;
    
    const available = Math.min(balance.balance_remaining, MAX_LEAVES_PER_MONTH - balance.total_used);
    if (days > available) {
      const lopDays = days - Math.max(available, 0);
      return `${lopDays} day(s) will be marked as Loss of Pay (LOP)`;
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast.error('End date cannot be before start date');
      return;
    }

    applyMutation.mutate({
      start_date: formData.start_date,
      end_date: formData.end_date,
      leave_type: formData.leave_type,
      reason: formData.reason
    });
  };

  const lopWarning = getLOPWarning();
  const requestedDays = calculateDays();
  const usagePercentage = (stats.used / stats.totalEntitlement) * 100;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Leave Management</h1>
              <p className="text-muted-foreground">Apply for leave and view your records</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pro-rated info banner */}
        {yearlySummary?.proRatedInfo && yearlySummary.proRatedInfo.monthsWorked < 12 && (
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Info className="h-4 w-4" />
                <span className="text-sm">
                  Your leave entitlement is pro-rated. You joined in {format(parseISO(yearlySummary.proRatedInfo.joinDate), 'MMMM yyyy')} 
                  and are entitled to {yearlySummary.proRatedInfo.totalEntitlement} days for {selectedYear}.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="records" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="records">Leave Records</TabsTrigger>
            <TabsTrigger value="apply">Apply for Leave</TabsTrigger>
          </TabsList>

          {/* Leave Records Tab */}
          <TabsContent value="records" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Entitlement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalEntitlement}</div>
                  <p className="text-xs text-muted-foreground">days for {selectedYear}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Used
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{stats.used}</div>
                  <Progress value={usagePercentage} className="mt-2 h-2" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Remaining
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {stats.totalEntitlement - stats.used}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pending > 0 && `${stats.pending} pending`}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    LOP Days
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats.lop}</div>
                  <p className="text-xs text-muted-foreground">loss of pay</p>
                </CardContent>
              </Card>
            </div>

            {/* Inner tabs for records */}
            <Tabs defaultValue="applications" className="space-y-4">
              <TabsList>
                <TabsTrigger value="applications">Leave Applications</TabsTrigger>
                <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
                <TabsTrigger value="summary">Year Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="applications">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Leave Applications - {selectedYear}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Date Range</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>LOP</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approved/Rejected By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearApplications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No leave applications for {selectedYear}
                            </TableCell>
                          </TableRow>
                        ) : (
                          yearApplications.map(app => (
                            <TableRow key={app.id}>
                              <TableCell>{format(parseISO(app.applied_at!), 'PP')}</TableCell>
                              <TableCell>
                                {format(parseISO(app.start_date), 'PP')} - {format(parseISO(app.end_date), 'PP')}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{LEAVE_TYPE_LABELS[app.leave_type]}</Badge>
                              </TableCell>
                              <TableCell>{app.total_days}</TableCell>
                              <TableCell>{app.paid_days}</TableCell>
                              <TableCell>
                                {app.lop_days > 0 ? (
                                  <span className="text-red-600">{app.lop_days}</span>
                                ) : '-'}
                              </TableCell>
                              <TableCell>{getStatusBadge(app.status)}</TableCell>
                              <TableCell>
                                {app.final_approved_by_name || app.rejected_by_name || '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="monthly">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Monthly Leave Balance - {selectedYear}
                    </CardTitle>
                    <CardDescription>
                      Track your monthly credits, usage, and carry-forwards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead className="text-right">Carried</TableHead>
                          <TableHead className="text-right">Available</TableHead>
                          <TableHead className="text-right">Sick</TableHead>
                          <TableHead className="text-right">Casual</TableHead>
                          <TableHead className="text-right">LOP</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {months.map((month, index) => {
                          const monthNum = index + 1;
                          const balanceData = yearlyBalances.find(b => b.month === monthNum);
                          const isCurrentMonth = new Date().getMonth() === index && 
                                                new Date().getFullYear() === parseInt(selectedYear);
                          return (
                            <TableRow key={month} className={isCurrentMonth ? 'bg-primary/5' : ''}>
                              <TableCell className="font-medium">
                                {month}
                                {isCurrentMonth && (
                                  <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{balanceData?.monthly_credit ?? 1}</TableCell>
                              <TableCell className="text-right">{balanceData?.carried_forward ?? 0}</TableCell>
                              <TableCell className="text-right">
                                {balanceData?.total_available ?? (balanceData ? balanceData.monthly_credit + balanceData.carried_forward : 1)}
                              </TableCell>
                              <TableCell className="text-right">{balanceData?.sick_leave_used ?? 0}</TableCell>
                              <TableCell className="text-right">{balanceData?.casual_leave_used ?? 0}</TableCell>
                              <TableCell className="text-right">
                                {balanceData?.lop_days && balanceData.lop_days > 0 ? (
                                  <span className="text-red-600">{balanceData.lop_days}</span>
                                ) : '0'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                <span className={balanceData?.balance_remaining === 0 ? 'text-red-600' : ''}>
                                  {balanceData?.balance_remaining ?? 1}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Leave Usage Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Total Applications</span>
                        <Badge variant="secondary">{yearApplications.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Approved</span>
                        <Badge className="bg-green-500/20 text-green-600">{stats.approved}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Rejected</span>
                        <Badge variant="destructive">{stats.rejected}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Pending</span>
                        <Badge variant="secondary">{stats.pending}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-primary" />
                        Leave Type Breakdown
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Sick Leave</span>
                        <Badge variant="outline">
                          {yearApplications
                            .filter(a => a.leave_type === 'sick' && a.status === 'approved')
                            .reduce((sum, a) => sum + a.paid_days, 0)} days
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Casual Leave</span>
                        <Badge variant="outline">
                          {yearApplications
                            .filter(a => a.leave_type === 'casual' && a.status === 'approved')
                            .reduce((sum, a) => sum + a.paid_days, 0)} days
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center border-t pt-4">
                        <span className="font-medium">Total LOP</span>
                        <Badge variant="destructive">{stats.lop} days</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Apply for Leave Tab */}
          <TabsContent value="apply" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Credit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{balance?.monthly_credit || 1}</div>
                  <p className="text-xs text-muted-foreground">leave per month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Carried Forward</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{balance?.carried_forward || 0}</div>
                  <p className="text-xs text-muted-foreground">from previous month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{balance?.balance_remaining || 1}</div>
                  <p className="text-xs text-muted-foreground">leaves remaining</p>
                </CardContent>
              </Card>
            </div>

            {/* Holiday Calendar */}
            <LeaveHolidayCalendar
              holidays={companyHolidays}
              selectedRange={
                formData.start_date && formData.end_date
                  ? { from: parseISO(formData.start_date), to: parseISO(formData.end_date) }
                  : undefined
              }
              userType="staff"
              isLoading={holidaysLoading}
            />

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <CardTitle className="text-sm">Leave Policy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>• You are entitled to 1 leave per month (12 per year)</p>
                <p>• Maximum 1 day can be carried forward to next month</p>
                <p>• Maximum 2 leaves can be taken in a single month (including carry forward)</p>
                <p>• Leaves beyond available balance will be marked as LOP (Loss of Pay)</p>
                <p>• Holidays falling within your leave period are not counted as leave days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Leave Application Form
                </CardTitle>
                <CardDescription>Fill in the details for your leave request</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end_date">End Date *</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        min={formData.start_date || format(new Date(), 'yyyy-MM-dd')}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leave_type">Leave Type *</Label>
                    <Select 
                      value={formData.leave_type} 
                      onValueChange={(v) => setFormData({ ...formData, leave_type: v as LeaveType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">{LEAVE_TYPE_LABELS.sick}</SelectItem>
                        <SelectItem value="casual">{LEAVE_TYPE_LABELS.casual}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Please provide a reason for your leave request"
                      rows={4}
                      required
                    />
                  </div>

                  {leaveCalculation.totalCalendarDays > 0 && (
                    <div className="bg-muted p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Leave Calculation</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Calendar days selected</span>
                          <span>{leaveCalculation.totalCalendarDays}</span>
                        </div>
                        {leaveCalculation.weekendsInRange > 0 && (
                          <div className="flex justify-between text-blue-600">
                            <span className="flex items-center gap-1">
                              🗓️ Weekends (excluded)
                            </span>
                            <span>-{leaveCalculation.weekendsInRange}</span>
                          </div>
                        )}
                        {leaveCalculation.holidaysInRange > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span className="flex items-center gap-1">
                              <Gift className="h-3 w-3" />
                              Holidays (excluded)
                            </span>
                            <span>-{leaveCalculation.holidaysInRange}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Actual leave days</span>
                          <Badge variant="secondary" className="text-lg">{requestedDays} day(s)</Badge>
                        </div>
                      </div>
                      {lopWarning && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm pt-2 border-t">
                          <AlertCircle className="h-4 w-4" />
                          <span>{lopWarning}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={applyMutation.isPending || !formData.start_date || !formData.end_date}
                  >
                    {applyMutation.isPending ? 'Submitting...' : 'Submit Leave Application'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
