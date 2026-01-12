import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarCheck, Calendar as CalendarIcon, AlertCircle, Clock, CheckCircle, 
  XCircle, FileText, Users, ArrowRight, ArrowLeft, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { leaveApplicationService, leaveBalanceService } from '@/services/leave.service';
import { leaveCalculationService } from '@/services/leaveCalculation.service';
import { calendarDayTypeService } from '@/services/calendarDayType.service';
import { substituteAssignmentService, AffectedTimetableSlot, AvailableSubstitute } from '@/services/substituteAssignment.service';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  LeaveType, 
  LeaveStatus,
  SubstituteAssignment,
  LEAVE_TYPE_LABELS, 
  LEAVE_STATUS_LABELS,
} from '@/types/leave';
import type { DateRange } from 'react-day-picker';
import { LeaveOverviewTab } from '@/components/leave/LeaveOverviewTab';
import { LeaveCalendarWithLegend } from '@/components/leave/LeaveCalendarWithLegend';
import { LeaveCalculationSummary } from '@/components/leave/LeaveCalculationSummary';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];

export default function OfficerLeave() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState('overview');
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [reason, setReason] = useState('');
  const [affectedSlots, setAffectedSlots] = useState<AffectedTimetableSlot[]>([]);
  const [substituteAssignments, setSubstituteAssignments] = useState<SubstituteAssignment[]>([]);
  const [availableSubstitutes, setAvailableSubstitutes] = useState<Map<string, AvailableSubstitute[]>>(new Map());
  const [isFetchingSlots, setIsFetchingSlots] = useState(false);

  // Fetch officer info
  const { data: officerInfo } = useQuery({
    queryKey: ['officer-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('officers')
        .select('id, full_name, assigned_institutions')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id
  });

  const institutionId = officerInfo?.assigned_institutions?.[0];

  // Fetch leave balance for current month
  const { data: balance } = useQuery({
    queryKey: ['leave-balance', user?.id, currentYear, currentMonth],
    queryFn: () => leaveBalanceService.getBalance(user!.id, currentYear, currentMonth),
    enabled: !!user?.id
  });

  // Fetch approved leaves for current month to calculate actual available balance
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
    // Get total paid days used this month from approved leaves
    const usedPaidDays = approvedLeavesThisMonth.reduce((sum, l) => sum + (l.paid_days || 0), 0);
    
    // Use balance from DB if available, otherwise default to 1 (monthly credit)
    const totalAvailable = balance?.balance_remaining ?? 1;
    
    // Subtract already used paid days
    return Math.max(0, totalAvailable - usedPaidDays);
  }, [approvedLeavesThisMonth, balance]);

  // Fetch yearly summary
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

  // Fetch institution holidays from calendar_day_types (for display)
  const { data: institutionHolidays = [] } = useQuery({
    queryKey: ['institution-calendar-holidays', institutionId, currentYear],
    queryFn: () => calendarDayTypeService.getHolidaysForYear('institution', currentYear, institutionId),
    enabled: !!institutionId
  });

  // Fetch institution calendar non-working days (weekends + holidays) for leave calculation
  const { data: institutionNonWorkingDays = { weekends: [], holidays: [] } } = useQuery({
    queryKey: ['institution-non-working-days', institutionId, dateRange?.from, dateRange?.to],
    queryFn: () => {
      if (!dateRange?.from || !dateRange?.to) return { weekends: [], holidays: [] };
      return calendarDayTypeService.getNonWorkingDaysInRange(
        'institution',
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd'),
        institutionId
      );
    },
    enabled: !!institutionId && !!dateRange?.from && !!dateRange?.to
  });

  // Calculate leave days excluding weekends AND holidays from institution calendar
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
      institutionNonWorkingDays.weekends.some((wd) => format(parseISO(wd), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
    ).length;
    
    // Count holidays (excluding days already counted as weekends)
    const holidaysInRange = days.filter((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isWeekend = institutionNonWorkingDays.weekends.some((wd) => format(parseISO(wd), 'yyyy-MM-dd') === dayStr);
      if (isWeekend) return false;
      return institutionNonWorkingDays.holidays.some((hd) => format(parseISO(hd), 'yyyy-MM-dd') === dayStr);
    }).length;
    
    return {
      totalCalendarDays,
      weekendsInRange,
      holidaysInRange,
      actualLeaveDays: Math.max(0, totalCalendarDays - weekendsInRange - holidaysInRange)
    };
  }, [dateRange, institutionNonWorkingDays]);

  const applyMutation = useMutation({
    mutationFn: leaveApplicationService.applyLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['my-leave-applications'] });
      queryClient.invalidateQueries({ queryKey: ['leave-yearly-summary'] });
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
    setAffectedSlots([]);
    setSubstituteAssignments([]);
    setCurrentStep(1);
  };

  const yearApplications = applications.filter(app => {
    const appYear = new Date(app.start_date).getFullYear();
    return appYear === parseInt(selectedYear);
  });

  const stats = {
    totalEntitlement: yearlySummary?.totalEntitlement || 12,
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

  // Step 1: Proceed to substitute selection
  const handleProceedToSubstitutes = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select dates');
      return;
    }
    if (reason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }
    if (!officerInfo?.id || !institutionId) {
      toast.error('Officer information not found');
      return;
    }

    setIsFetchingSlots(true);

    try {
      // Fetch affected slots
      const slots = await substituteAssignmentService.getAffectedSlots(
        officerInfo.id,
        institutionId,
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd')
      );

      // Always proceed to Step 2, even with no slots
      // The UI will show appropriate message based on slots count
      setAffectedSlots(slots);
      
      if (slots.length === 0) {
        // No slots to assign substitutes for
        setSubstituteAssignments([]);
        setCurrentStep(2);
        return;
      }

      // Initialize empty assignments
      const initialAssignments: SubstituteAssignment[] = slots.map(slot => ({
        slot_id: slot.id,
        class_id: slot.class_id,
        class_name: slot.class_name,
        day: slot.day,
        date: slot.date,
        period_id: slot.period_id,
        period_label: slot.period_label,
        period_time: slot.period_time,
        subject: slot.subject,
        room: slot.room || undefined,
        original_officer_id: officerInfo.id,
        original_officer_name: officerInfo.full_name,
        substitute_officer_id: '',
        substitute_officer_name: ''
      }));
      setSubstituteAssignments(initialAssignments);

      // Fetch available substitutes for each slot
      const subsMap = new Map<string, AvailableSubstitute[]>();
      for (const slot of slots) {
        const subs = await substituteAssignmentService.getAvailableSubstitutes(
          institutionId,
          slot.day,
          slot.period_id,
          officerInfo.id
        );
        subsMap.set(`${slot.date}-${slot.period_id}`, subs);
      }
      setAvailableSubstitutes(subsMap);

      setCurrentStep(2);
    } finally {
      setIsFetchingSlots(false);
    }
  };

  const handleSubstituteSelect = (index: number, officerId: string, officerName: string) => {
    const updated = [...substituteAssignments];
    // Handle "no_substitution" special case
    if (officerId === 'no_substitution') {
      updated[index].substitute_officer_id = '';
      updated[index].substitute_officer_name = 'No Substitution Required';
    } else {
      updated[index].substitute_officer_id = officerId;
      updated[index].substitute_officer_name = officerName;
    }
    setSubstituteAssignments(updated);
  };

  // Check that all slots have a selection (either a substitute or explicitly "no substitution")
  const allSubstitutesSelected = substituteAssignments.every(
    a => a.substitute_officer_id !== '' || a.substitute_officer_name === 'No Substitution Required'
  );

  const handleProceedToReview = () => {
    if (!allSubstitutesSelected) {
      toast.error('Please select substitutes for all affected classes or mark as "No Substitution Required"');
      return;
    }
    setCurrentStep(3);
  };

  const handleSubmit = () => {
    if (!dateRange?.from || !dateRange?.to) return;

    applyMutation.mutate({
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      leave_type: leaveType,
      reason: reason.trim(),
      substitute_assignments: substituteAssignments.filter(s => s.substitute_officer_id)
    });
  };

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
                userType="officer" 
                year={parseInt(selectedYear)} 
              />
            )}
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
                      <TableHead>Approved/Rejected By</TableHead>
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
                          <TableCell>{app.final_approved_by_name || app.rejected_by_name || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Apply for Leave Tab */}
          <TabsContent value="apply" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Apply for Leave</CardTitle>
                <CardDescription>Select dates, assign substitutes for your classes, and submit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step Progress */}
                <div className="flex items-center justify-center gap-4 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
                    </div>
                    <span className="text-sm font-medium">Leave Details</span>
                  </div>
                  <div className={`h-px w-12 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
                    </div>
                    <span className="text-sm font-medium">Assign Substitutes</span>
                  </div>
                  <div className={`h-px w-12 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      3
                    </div>
                    <span className="text-sm font-medium">Review & Submit</span>
                  </div>
                </div>

                {/* Step 1: Leave Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label>Select Date Range</Label>
                          <LeaveCalendarWithLegend
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                            nonWorkingDays={institutionNonWorkingDays}
                            holidayDetails={institutionHolidays.map(h => ({ date: h.date, name: h.name }))}
                            numberOfMonths={1}
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Leave Type</Label>
                          <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sick">Sick Leave</SelectItem>
                              <SelectItem value="casual">Casual Leave</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Reason</Label>
                          <Textarea
                            placeholder="Provide a detailed reason..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
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
                          onClick={handleProceedToSubstitutes} 
                          className="w-full"
                          disabled={!dateRange?.from || !dateRange?.to || reason.length < 10 || isFetchingSlots}
                        >
                          {isFetchingSlots ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Fetching Class Schedule...
                            </>
                          ) : (
                            <>
                              Next: Assign Substitutes <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Assign Substitutes */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <p>Assign substitutes for your classes during leave</p>
                    </div>
                    
                    {affectedSlots.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">No Classes Scheduled</h3>
                          <p className="text-muted-foreground mt-1">
                            You don't have any classes scheduled during your leave period.
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            No substitute assignments are needed. You can proceed to review.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {affectedSlots.map((slot, index) => {
                          const subs = availableSubstitutes.get(`${slot.date}-${slot.period_id}`) || [];
                          const assignment = substituteAssignments[index];
                          
                          return (
                            <Card key={`${slot.date}-${slot.period_id}`}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">{slot.class_name} - {slot.subject}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {format(parseISO(slot.date), 'EEEE, MMM dd')} • {slot.period_label} ({slot.period_time})
                                    </p>
                                  </div>
                                  <Select
                                    value={assignment?.substitute_officer_name === 'No Substitution Required' ? 'no_substitution' : (assignment?.substitute_officer_id || '')}
                                    onValueChange={(v) => {
                                      if (v === 'no_substitution') {
                                        handleSubstituteSelect(index, 'no_substitution', 'No Substitution Required');
                                      } else {
                                        const sub = subs.find(s => s.officer_id === v);
                                        if (sub) {
                                          handleSubstituteSelect(index, sub.officer_id, sub.officer_name);
                                        }
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-[220px]">
                                      <SelectValue placeholder="Select substitute" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="no_substitution" className="text-muted-foreground">
                                        No Substitution Required
                                      </SelectItem>
                                      {subs.map(sub => (
                                        <SelectItem 
                                          key={sub.officer_id} 
                                          value={sub.officer_id}
                                          disabled={!sub.is_available}
                                        >
                                          {sub.officer_name}
                                          {!sub.is_available && ' (Busy)'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Change Dates
                      </Button>
                      {affectedSlots.length === 0 ? (
                        <Button onClick={() => setCurrentStep(3)} className="flex-1">
                          Continue to Review <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleProceedToReview} 
                          className="flex-1"
                          disabled={!allSubstitutesSelected}
                        >
                          Next: Review <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Review Your Leave Application</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Date Range</p>
                            <p className="font-medium">
                              {dateRange?.from && format(dateRange.from, 'PPP')} - {dateRange?.to && format(dateRange.to, 'PPP')}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Leave Type</p>
                            <p className="font-medium">{LEAVE_TYPE_LABELS[leaveType]}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Working Days</p>
                            <p className="font-medium">{leaveCalculation.actualLeaveDays}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Reason</p>
                            <p className="font-medium">{reason}</p>
                          </div>
                        </div>

                        {substituteAssignments.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Substitute Assignments</p>
                            <div className="space-y-2">
                              {substituteAssignments.map((a, i) => (
                                <div key={i} className="flex items-center justify-between p-2 bg-muted rounded">
                                  <span>{a.class_name} - {a.subject} ({format(parseISO(a.date), 'MMM dd')})</span>
                                  <Badge variant="outline">{a.substitute_officer_name}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setCurrentStep(affectedSlots.length > 0 ? 2 : 1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                      </Button>
                      <Button 
                        onClick={handleSubmit} 
                        className="flex-1"
                        disabled={applyMutation.isPending}
                      >
                        {applyMutation.isPending ? 'Submitting...' : 'Submit Leave Application'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
