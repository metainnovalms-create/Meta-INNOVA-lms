import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarCheck, Clock, CheckCircle, XCircle, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DateRange } from 'react-day-picker';
import { LeaveType, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LeaveStatus } from '@/types/leave';
import { leaveApplicationService, leaveBalanceService } from '@/services/leave.service';
import { calendarDayTypeService } from '@/services/calendarDayType.service';
import { supabase } from '@/integrations/supabase/client';
import { LeaveOverviewTab } from '@/components/leave/LeaveOverviewTab';
import { LeaveCalendarWithLegend } from '@/components/leave/LeaveCalendarWithLegend';
import { LeaveCalculationSummary } from '@/components/leave/LeaveCalculationSummary';
import { LeaveApprovalTimeline } from '@/components/officer/LeaveApprovalTimeline';
import { LeaveApplication } from '@/types/attendance';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];

export default function MetaStaffLeaveManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState('overview');
  
  // Apply Leave Form State
  const [dateRange, setDateRange] = useState<DateRange>();
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Detail Dialog State
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch leave balance
  const { data: balance } = useQuery({
    queryKey: ['leave-balance', user?.id, currentYear, new Date().getMonth() + 1],
    queryFn: () => leaveBalanceService.getBalance(user!.id, currentYear, new Date().getMonth() + 1),
    enabled: !!user?.id
  });

  // Fetch approved leaves for current month to calculate actual available balance
  const currentMonth = new Date().getMonth() + 1;
  const { data: approvedLeavesThisMonth = [] } = useQuery({
    queryKey: ['approved-leaves-month', user?.id, currentYear, currentMonth],
    queryFn: async () => {
      if (!user?.id) return [];
      const startOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const endOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`;
      const { data } = await supabase
        .from('leave_applications')
        .select('total_days, paid_days, lop_days, leave_type')
        .eq('applicant_id', user.id)
        .eq('status', 'approved')
        .gte('start_date', startOfMonth)
        .lte('end_date', endOfMonth);
      return data || [];
    },
    enabled: !!user?.id
  });

  // Calculate actual available balance dynamically
  const calculatedAvailableBalance = useMemo(() => {
    const usedPaidDays = approvedLeavesThisMonth.reduce((sum, l) => sum + (l.paid_days || 0), 0);
    const totalAvailable = balance?.balance_remaining ?? 1;
    return Math.max(0, totalAvailable - usedPaidDays);
  }, [approvedLeavesThisMonth, balance]);

  // Fetch all leave applications
  const { data: applications = [] } = useQuery({
    queryKey: ['my-leave-applications', user?.id],
    queryFn: () => leaveApplicationService.getMyApplications(),
    enabled: !!user?.id
  });

  // Fetch company holidays from calendar_day_types
  const { data: companyHolidays = [] } = useQuery({
    queryKey: ['company-calendar-holidays', currentYear],
    queryFn: () => calendarDayTypeService.getHolidaysForYear('company', currentYear),
    enabled: true
  });

  // Fetch company calendar non-working days (weekends + holidays) for leave calculation
  const { data: companyNonWorkingDays = { weekends: [], holidays: [] } } = useQuery({
    queryKey: ['company-non-working-days', dateRange?.from, dateRange?.to],
    queryFn: () => {
      if (!dateRange?.from || !dateRange?.to) return { weekends: [], holidays: [] };
      return calendarDayTypeService.getNonWorkingDaysInRange(
        'company',
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd')
      );
    },
    enabled: !!dateRange?.from && !!dateRange?.to
  });

  // Calculate leave days excluding weekends AND holidays
  const leaveCalculation = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return { totalCalendarDays: 0, weekendsInRange: 0, holidaysInRange: 0, actualLeaveDays: 0 };
    }
    
    const start = parseISO(format(dateRange.from, 'yyyy-MM-dd'));
    const end = parseISO(format(dateRange.to, 'yyyy-MM-dd'));
    const days = eachDayOfInterval({ start, end });
    const totalCalendarDays = days.length;
    
    // Count weekends from calendar data
    const weekendsInRange = days.filter((day) =>
      companyNonWorkingDays.weekends.some((wd) => format(parseISO(wd), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
    ).length;
    
    // Count holidays (excluding days already counted as weekends)
    const holidaysInRange = days.filter((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isWeekend = companyNonWorkingDays.weekends.some((wd) => format(parseISO(wd), 'yyyy-MM-dd') === dayStr);
      if (isWeekend) return false;
      return companyNonWorkingDays.holidays.some((hd) => format(parseISO(hd), 'yyyy-MM-dd') === dayStr);
    }).length;
    
    return {
      totalCalendarDays,
      weekendsInRange,
      holidaysInRange,
      actualLeaveDays: Math.max(0, totalCalendarDays - weekendsInRange - holidaysInRange)
    };
  }, [dateRange, companyNonWorkingDays]);

  const yearApplications = applications.filter(app => {
    const appYear = new Date(app.start_date).getFullYear();
    return appYear === parseInt(selectedYear);
  });

  const applyMutation = useMutation({
    mutationFn: leaveApplicationService.applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-applications'] });
      toast.success('Leave application submitted successfully');
      resetForm();
      setActiveTab('records');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const resetForm = () => {
    setDateRange(undefined);
    setLeaveType('casual');
    setReason('');
  };

  const handleSubmit = () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select valid dates');
      return;
    }

    if (!reason.trim() || reason.length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    applyMutation.mutate({
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      leave_type: leaveType,
      reason: reason.trim(),
      substitute_assignments: []
    });
  };

  const handleViewDetails = (application: any) => {
    setSelectedApplication(application);
    setIsDetailDialogOpen(true);
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
      cancelled: <XCircle className="h-3 w-3 mr-1" />,
    };
    
    return (
      <Badge variant={variants[status]} className="flex items-center w-fit">
        {icons[status]}
        {LEAVE_STATUS_LABELS[status]}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Leave Management</h1>
              <p className="text-muted-foreground">Apply for leave and track your applications</p>
            </div>
          </div>
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Leave Overview</TabsTrigger>
            <TabsTrigger value="apply">Apply Leave</TabsTrigger>
            <TabsTrigger value="records">Leave Records</TabsTrigger>
          </TabsList>

          {/* Leave Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {user?.id && (
              <LeaveOverviewTab 
                userId={user.id} 
                userType="staff" 
                year={parseInt(selectedYear)} 
              />
            )}
          </TabsContent>

          {/* Apply Leave Tab */}
          <TabsContent value="apply" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Apply for Leave</CardTitle>
                <CardDescription>
                  Submit a new leave application. Your leave will require CEO approval.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label>Select Date Range</Label>
                      <LeaveCalendarWithLegend
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                        nonWorkingDays={companyNonWorkingDays}
                        holidayDetails={companyHolidays.map(h => ({ date: h.date, name: h.name }))}
                        numberOfMonths={1}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Leave Type</Label>
                      <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="casual">Casual Leave</SelectItem>
                          <SelectItem value="sick">Sick Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Reason for Leave</Label>
                      <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please provide a detailed reason for your leave application (min 10 characters)"
                        rows={4}
                        className="mt-2"
                      />
                    </div>

                    {dateRange?.from && dateRange?.to && (
                      <LeaveCalculationSummary
                        totalCalendarDays={leaveCalculation.totalCalendarDays}
                        weekendsExcluded={leaveCalculation.weekendsInRange}
                        holidaysExcluded={leaveCalculation.holidaysInRange}
                        actualLeaveDays={leaveCalculation.actualLeaveDays}
                        availableBalance={calculatedAvailableBalance}
                        showPayCalculation={true}
                      />
                    )}

                    <Button
                      onClick={handleSubmit}
                      disabled={!dateRange?.from || !dateRange?.to || reason.length < 10 || applyMutation.isPending}
                      className="w-full"
                    >
                      {applyMutation.isPending ? 'Submitting...' : 'Submit Leave Application'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave Records Tab */}
          <TabsContent value="records" className="space-y-4">
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
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearApplications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                          <TableCell>
                            {app.total_days}
                            {app.lop_days > 0 && (
                              <span className="text-red-600 text-xs ml-1">({app.lop_days} LOP)</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(app)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Application Details</DialogTitle>
              <DialogDescription>
                Complete information about your leave application
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Leave Type</Label>
                    <p className="font-medium capitalize">{selectedApplication.leave_type}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Duration</Label>
                    <p className="font-medium">{selectedApplication.total_days} days</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <p className="font-medium">{format(new Date(selectedApplication.start_date), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">End Date</Label>
                    <p className="font-medium">{format(new Date(selectedApplication.end_date), 'dd MMM yyyy')}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Reason</Label>
                  <p className="mt-1">{selectedApplication.reason}</p>
                </div>

                <div className="border-t pt-4">
                  <Label className="text-muted-foreground mb-2 block">Approval Status</Label>
                  <LeaveApprovalTimeline application={selectedApplication} />
                </div>

                {selectedApplication.rejection_reason && (
                  <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
                    <Label className="text-destructive">Rejection Reason</Label>
                    <p className="mt-1 text-sm">{selectedApplication.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
