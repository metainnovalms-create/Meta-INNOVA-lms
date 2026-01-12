import { useState, useEffect, useMemo } from 'react';
import { format, differenceInCalendarDays, addDays, getDay } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { calendarDayTypeService } from '@/services/calendarDayType.service';
import { CalendarCheck, Clock, TrendingUp, FileText, AlertCircle, Eye, X, ArrowRight, ArrowLeft, Users, CheckCircle, Calendar as CalendarIcon, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'sonner';
import {
  getLeaveApplicationsByOfficer,
  getLeaveBalance,
  addLeaveApplication,
  getApprovedLeaveDates,
  cancelLeaveApplication,
} from '@/data/mockLeaveData';
import { LeaveApprovalTimeline } from '@/components/officer/LeaveApprovalTimeline';
import { MyAttendanceTab } from '@/components/officer/MyAttendanceTab';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { LeaveApplication, LeaveBalance, LeaveType, AffectedSlot, SubstituteAssignment } from '@/types/attendance';
import type { DateRange } from 'react-day-picker';
import { useNotifications } from '@/hooks/useNotifications';
import { getAffectedSlots, calculateSlotHours } from '@/utils/substituteHelpers';
import { ApplicantLeaveBalanceCard } from '@/components/leave/ApplicantLeaveBalanceCard';
import { useApplicantLeaveBalance, usePendingLeavesCount } from '@/hooks/useApplicantLeaveBalance';
import { useAvailableSubstitutes, useOfficerInstitution } from '@/hooks/useAvailableSubstitutes';

export default function LeaveManagement() {
  const { user } = useAuth();
  const { notifications, markAsRead } = useNotifications(user?.id || '', 'officer');
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [approvedLeaveDates, setApprovedLeaveDates] = useState<string[]>([]);
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [affectedSlots, setAffectedSlots] = useState<AffectedSlot[]>([]);
  const [substituteAssignments, setSubstituteAssignments] = useState<SubstituteAssignment[]>([]);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Tab state
  const [activeTab, setActiveTab] = useState('apply');
  
  // Details dialog state
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch officer's institution and available substitutes
  const { data: institutionId } = useOfficerInstitution(user?.id);
  const { data: availableSubstitutes = [] } = useAvailableSubstitutes(institutionId || undefined, user?.id);

  // Fetch institution's weekend configuration from calendar
  const { data: institutionWeekends = [] } = useQuery({
    queryKey: ['institution-weekends', institutionId, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async () => {
      if (!institutionId || !dateRange?.from || !dateRange?.to) return [];
      const { weekends } = await calendarDayTypeService.getNonWorkingDaysInRange(
        'institution',
        format(dateRange.from, 'yyyy-MM-dd'),
        format(dateRange.to, 'yyyy-MM-dd'),
        institutionId
      );
      return weekends;
    },
    enabled: !!institutionId && !!dateRange?.from && !!dateRange?.to
  });

  const refreshData = () => {
    if (user?.id) {
      const currentYear = new Date().getFullYear().toString();
      const balance = getLeaveBalance(user.id, currentYear);
      const applications = getLeaveApplicationsByOfficer(user.id);
      const approvedDates = getApprovedLeaveDates(user.id);
      
      setLeaveBalance(balance);
      setLeaveApplications(applications);
      setApprovedLeaveDates(approvedDates);
    }
  };

  useEffect(() => {
    refreshData();
    
    // Mark leave-related notifications as read when visiting this page
    if (user?.id) {
      notifications
        .filter(n => !n.read && (n.type === 'leave_application_approved' || n.type === 'leave_application_rejected'))
        .forEach(n => markAsRead(n.id));
    }
  }, [user]);

  const calculateWorkingDays = (from: Date | undefined, to: Date | undefined): number => {
    if (!from || !to) return 0;

    let workingDays = 0;
    let currentDate = new Date(from);
    const endDate = new Date(to);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      // Check if date is in institution's weekend list from calendar
      const isWeekendDay = institutionWeekends.includes(dateStr);
      
      if (!isWeekendDay && !approvedLeaveDates.includes(dateStr)) {
        workingDays++;
      }
      currentDate = addDays(currentDate, 1);
    }

    return workingDays;
  };

  const workingDays = calculateWorkingDays(dateRange?.from, dateRange?.to);

  const getRemainingBalance = (): number => {
    if (!leaveBalance || !leaveType) return 0;
    
    switch (leaveType) {
      case 'sick':
        return leaveBalance.sick_leave;
      case 'casual':
        return leaveBalance.casual_leave;
      case 'earned':
        return leaveBalance.earned_leave;
      default:
        return 0;
    }
  };

  const handleProceedToSubstitutes = () => {
    if (!dateRange?.from || !dateRange?.to || !leaveType) {
      toast.error('Please select dates and leave type');
      return;
    }

    if (reason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    const remainingBalance = getRemainingBalance();
    if (workingDays > remainingBalance) {
      toast.error(`Insufficient leave balance. Available: ${remainingBalance} days, Required: ${workingDays} days`);
      return;
    }

    // Check for overlapping dates
    let currentDate = new Date(dateRange.from);
    const endDate = new Date(dateRange.to);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const isWeekendDay = institutionWeekends.includes(dateStr);
      
      if (!isWeekendDay) {
        if (approvedLeaveDates.includes(dateStr)) {
          toast.error('Selected dates overlap with approved leave');
          return;
        }
      }
      currentDate = addDays(currentDate, 1);
    }
    
    // Calculate affected slots
    const slots = getAffectedSlots(user?.id || '', dateRange.from, dateRange.to);
    setAffectedSlots(slots);
    
    // Initialize empty assignments
    const initialAssignments: SubstituteAssignment[] = slots.map(slot => ({
      slot_id: slot.slot_id,
      original_officer_id: user?.id || '',
      substitute_officer_id: '',
      substitute_officer_name: '',
      date: slot.date,
      hours: calculateSlotHours(slot.start_time, slot.end_time)
    }));
    setSubstituteAssignments(initialAssignments);
    
    setCurrentStep(2);
  };

  const handleSubstituteSelect = (index: number, substituteId: string) => {
    const substitute = availableSubstitutes.find(s => s.id === substituteId);
    if (substitute) {
      const updatedAssignments = [...substituteAssignments];
      updatedAssignments[index].substitute_officer_id = substituteId;
      updatedAssignments[index].substitute_officer_name = substitute.name;
      setSubstituteAssignments(updatedAssignments);
    }
  };

  const allSubstitutesSelected = (): boolean => {
    return substituteAssignments.every(a => a.substitute_officer_id !== '');
  };

  const handleProceedToReview = () => {
    if (!allSubstitutesSelected()) {
      toast.error('Please select substitutes for all affected classes');
      return;
    }
    setCurrentStep(3);
  };

  const handleFinalSubmit = () => {
    if (!dateRange?.from || !dateRange?.to || !user) return;

    setIsSubmitting(true);

    const newApplication: LeaveApplication = {
      id: `leave-${Date.now()}`,
      officer_id: user.id,
      officer_name: user.name,
      applicant_type: "innovation_officer", // NEW
      approval_stage: "manager_pending", // NEW
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      leave_type: leaveType as LeaveType,
      reason: reason.trim(),
      total_days: workingDays,
      status: 'pending',
      applied_at: new Date().toISOString(),
      affected_slots: affectedSlots,
      substitute_assignments: substituteAssignments,
    };

    try {
      addLeaveApplication(newApplication);
      
      // Refresh data from localStorage
      refreshData();

      // Clear form
      setDateRange(undefined);
      setLeaveType('');
      setReason('');
      setAffectedSlots([]);
      setSubstituteAssignments([]);
      setCurrentStep(1);

      toast.success('Leave application with substitutes submitted successfully!');
      setActiveTab('history');
    } catch (error) {
      toast.error('Failed to submit leave application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = handleFinalSubmit;

  const handleViewDetails = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const handleCancelApplication = (id: string) => {
    if (user?.id) {
      try {
        cancelLeaveApplication(id, user.id);
        refreshData();
        toast.success('Leave application cancelled successfully');
        setDetailsOpen(false);
      } catch (error) {
        toast.error('Failed to cancel leave application');
      }
    }
  };

  const filteredApplications = leaveApplications.filter((app) => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const disabledDates = (date: Date) => {
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // Disable already approved leave dates
    const dateStr = format(date, 'yyyy-MM-dd');
    return approvedLeaveDates.includes(dateStr);
  };

  const modifiers = {
    approved: approvedLeaveDates.map((dateStr) => new Date(dateStr)),
  };

  const modifiersStyles = {
    approved: {
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">Apply for leave and manage your leave applications</p>
        </div>

        {/* Leave Balance Cards */}
        {user?.id && (
          <ApplicantLeaveBalanceCard
            applicantId={user.id}
            leaveMonth={new Date().getMonth() + 1}
            leaveYear={new Date().getFullYear()}
          />
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="apply" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              Apply Leave
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2">
              <Clock className="h-4 w-4" />
              Approval Tracking
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="h-4 w-4" />
              Leave History
            </TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              My Attendance
            </TabsTrigger>
          </TabsList>

          {/* Apply Leave Tab */}
          <TabsContent value="apply" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Apply for Leave</CardTitle>
                <CardDescription>Select date range and provide leave details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step Progress Indicator */}
                <div className="flex items-center justify-center gap-4 pb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {currentStep > 1 ? <CheckCircle className="h-5 w-5" /> : '1'}
                    </div>
                    <span className={`text-sm font-medium ${currentStep === 1 ? 'text-foreground' : 'text-muted-foreground'}`}>Leave Details</span>
                  </div>
                  <div className={`h-px w-12 ${currentStep > 1 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {currentStep > 2 ? <CheckCircle className="h-5 w-5" /> : '2'}
                    </div>
                    <span className={`text-sm font-medium ${currentStep === 2 ? 'text-foreground' : 'text-muted-foreground'}`}>Select Substitutes</span>
                  </div>
                  <div className={`h-px w-12 ${currentStep > 2 ? 'bg-primary' : 'bg-muted'}`} />
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      3
                    </div>
                    <span className={`text-sm font-medium ${currentStep === 3 ? 'text-foreground' : 'text-muted-foreground'}`}>Review & Submit</span>
                  </div>
                </div>

                {/* Step 1: Leave Details */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Calendar */}
                    <div className="space-y-2">
                      <Label>Select Date Range</Label>
                      <div className="flex justify-center border rounded-lg p-4">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          disabled={disabledDates}
                          modifiers={modifiers}
                          modifiersStyles={modifiersStyles}
                          numberOfMonths={2}
                          className="pointer-events-auto"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        * Dates with light blue background are already approved leaves
                      </p>
                    </div>

                    {/* Leave Type */}
                    <div className="space-y-2">
                      <Label>Leave Type</Label>
                      <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sick">Sick Leave</SelectItem>
                          <SelectItem value="casual">Casual Leave</SelectItem>
                          <SelectItem value="earned">Earned Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea
                        placeholder="Provide a detailed reason for your leave application (minimum 10 characters)..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground">{reason.length} characters</p>
                    </div>

                    {/* Summary */}
                    {dateRange?.from && dateRange?.to && leaveType && (
                      <div className="p-4 bg-muted rounded-lg space-y-2">
                        <p className="font-medium">Leave Summary</p>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Date Range:</span>{' '}
                            {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Working Days:</span> {workingDays} days
                          </p>
                          <p>
                            <span className="text-muted-foreground">Leave Type:</span>{' '}
                            <span className="capitalize">{leaveType} Leave</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Balance After:</span>{' '}
                            {getRemainingBalance() - workingDays} days remaining
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDateRange(undefined);
                          setLeaveType('');
                          setReason('');
                        }}
                      >
                        Clear
                      </Button>
                      <Button 
                        onClick={handleProceedToSubstitutes} 
                        disabled={isSubmitting || !dateRange?.from || !dateRange?.to || !leaveType || reason.length < 10}
                      >
                        Proceed to Select Substitutes
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Substitutes */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Assign Substitutes</p>
                          <p className="text-sm text-muted-foreground">
                            Select substitute teachers for your scheduled classes during leave
                          </p>
                        </div>
                      </div>

                      {affectedSlots.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No scheduled classes found during selected leave dates
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {affectedSlots.map((slot, index) => {
                            const assignment = substituteAssignments[index];
                            return (
                              <Card key={index}>
                                <CardContent className="pt-6">
                                  <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                      <div className="space-y-1">
                                        <p className="font-medium">{slot.class}</p>
                                        <p className="text-sm text-muted-foreground">{slot.subject}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                          <span>{format(new Date(slot.date), 'MMM dd, yyyy')}</span>
                                          <span>•</span>
                                          <span>{slot.start_time} - {slot.end_time}</span>
                                        </div>
                                      </div>
                                      {assignment?.substitute_officer_id && (
                                        <Badge variant="outline" className="gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Assigned
                                        </Badge>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Select Substitute Teacher</Label>
                                      <Select
                                        value={assignment?.substitute_officer_id || ''}
                                        onValueChange={(value) => handleSubstituteSelect(index, value)}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Choose a substitute teacher..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableSubstitutes.length === 0 ? (
                                            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                              No available substitutes found
                                            </div>
                                          ) : (
                                            availableSubstitutes.map((sub) => (
                                              <SelectItem key={sub.id} value={sub.id}>
                                                <div className="flex items-center justify-between gap-4">
                                                  <span>{sub.name}</span>
                                                  {sub.type === 'officer' && (
                                                    <Badge variant="secondary" className="text-xs">
                                                      Officer
                                                    </Badge>
                                                  )}
                                                  {sub.type === 'staff' && (
                                                    <Badge variant="outline" className="text-xs">
                                                      Staff
                                                    </Badge>
                                                  )}
                                                </div>
                                              </SelectItem>
                                            ))
                                          )}
                                        </SelectContent>
                                      </Select>
                                      {assignment?.substitute_officer_id && (
                                        <p className="text-xs text-muted-foreground">
                                          Substitute will be assigned {calculateSlotHours(slot.start_time, slot.end_time).toFixed(1)} hours
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Leave Details
                      </Button>
                      <Button
                        onClick={handleProceedToReview}
                        disabled={!allSubstitutesSelected()}
                      >
                        Proceed to Review
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Submit */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">Review Your Application</p>
                          <p className="text-sm text-muted-foreground">
                            Verify all details before submitting
                          </p>
                        </div>
                      </div>

                      {/* Leave Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Leave Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Date Range</p>
                              <p className="font-medium">
                                {dateRange?.from && dateRange?.to &&
                                  `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
                                }
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Working Days</p>
                              <p className="font-medium">{workingDays} days</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Leave Type</p>
                              <p className="font-medium capitalize">{leaveType} Leave</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Balance After</p>
                              <p className="font-medium">{getRemainingBalance() - workingDays} days</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Reason</p>
                            <p className="text-sm mt-1">{reason}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Substitute Assignments */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Substitute Assignments</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {substituteAssignments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No substitute assignments</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Time</TableHead>
                                  <TableHead>Class</TableHead>
                                  <TableHead>Subject</TableHead>
                                  <TableHead>Substitute Teacher</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {substituteAssignments.map((assignment, index) => {
                                  const slot = affectedSlots[index];
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>{format(new Date(assignment.date), 'MMM dd, yyyy')}</TableCell>
                                      <TableCell>{slot?.start_time} - {slot?.end_time}</TableCell>
                                      <TableCell>{slot?.class}</TableCell>
                                      <TableCell>{slot?.subject}</TableCell>
                                      <TableCell>{assignment.substitute_officer_name || 'Unknown'}</TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Substitutes
                      </Button>
                      <Button
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Leave Application'}
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approval Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Approval Tracking</CardTitle>
                <CardDescription>Track the status of your leave applications</CardDescription>
              </CardHeader>
              <CardContent>
                {leaveApplications.length === 0 ? (
                  <div className="text-center py-12 max-w-md mx-auto">
                    <div className="bg-muted/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarCheck className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Leave Applications Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      You haven't submitted any leave applications. Once you apply for leave, you'll be able to track the approval status here.
                    </p>
                    <Button onClick={() => setActiveTab('apply')}>
                      <CalendarCheck className="h-4 w-4 mr-2" />
                      Apply for Leave
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {leaveApplications.map((application) => (
                      <Card key={application.id} className="overflow-hidden">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {format(new Date(application.start_date), 'PPP')} -{' '}
                                {format(new Date(application.end_date), 'PPP')}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="capitalize">
                                  {application.leave_type} Leave
                                </Badge>
                                <span>• {application.total_days} days</span>
                              </CardDescription>
                            </div>
                            <Badge
                              variant={
                                application.status === 'approved'
                                  ? 'default'
                                  : application.status === 'pending'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                              className="capitalize"
                            >
                              {application.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <LeaveApprovalTimeline application={application} />
                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(application)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            {application.status === 'pending' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelApplication(application.id)}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Application
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leave History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Leave History</CardTitle>
                    <CardDescription>View all your leave applications</CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredApplications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No leave applications found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date Range</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied On</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div className="font-medium">
                                {application.start_date === application.end_date
                                  ? format(new Date(application.start_date), 'MMM dd, yyyy')
                                  : `${format(new Date(application.start_date), 'MMM dd')} - ${format(
                                      new Date(application.end_date),
                                      'MMM dd, yyyy'
                                    )}`}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {application.leave_type}
                              </Badge>
                            </TableCell>
                            <TableCell>{application.total_days}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  application.status === 'approved'
                                    ? 'default'
                                    : application.status === 'pending'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className="capitalize"
                              >
                                {application.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(application.applied_at), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{application.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Attendance Records</CardTitle>
                <CardDescription>
                  View your monthly attendance, check-in/out times, and download reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MyAttendanceTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Leave Type</p>
                  <Badge variant="outline" className="capitalize mt-1">
                    {selectedApplication.leave_type} Leave
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Days</p>
                  <p className="font-medium mt-1">{selectedApplication.total_days} days</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Date Range</p>
                  <p className="font-medium mt-1">
                    {format(new Date(selectedApplication.start_date), 'PPP')} -{' '}
                    {format(new Date(selectedApplication.end_date), 'PPP')}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="mt-1">{selectedApplication.reason}</p>
                </div>
                {selectedApplication.rejection_reason && (
                  <div className="col-span-2 p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Rejection Reason</p>
                    <p className="mt-1 text-destructive">{selectedApplication.rejection_reason}</p>
                  </div>
                )}
                {selectedApplication.admin_comments && (
                  <div className="col-span-2 p-3 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Admin Comments</p>
                    <p className="mt-1">{selectedApplication.admin_comments}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-4">Approval Timeline</h4>
                <LeaveApprovalTimeline application={selectedApplication} />
              </div>

              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelApplication(selectedApplication.id)}
                  >
                    Cancel Application
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
