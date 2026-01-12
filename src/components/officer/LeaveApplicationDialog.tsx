import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, eachDayOfInterval, isWeekend, parseISO, isSameDay } from "date-fns";
import { Calendar, CalendarCheck, Gift } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { LeaveType, LeaveApplication, LeaveBalance } from "@/types/attendance";
import { addLeaveApplication, getLeaveBalance } from "@/data/mockLeaveData";
import { institutionHolidayService } from "@/services/holiday.service";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaveApplicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officerId: string;
  officerName: string;
  onLeaveApplied: () => void;
}

export function LeaveApplicationDialog({
  open,
  onOpenChange,
  officerId,
  officerName,
  onLeaveApplied,
}: LeaveApplicationDialogProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: undefined,
    to: undefined,
  });
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaveBalance: LeaveBalance = getLeaveBalance(officerId, "2025");
  const currentYear = new Date().getFullYear();

  // Fetch officer's institution
  const { data: officer } = useQuery({
    queryKey: ['officer-for-leave', officerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('officers')
        .select('assigned_institutions')
        .eq('id', officerId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!officerId,
  });

  const institutionId = officer?.assigned_institutions?.[0];

  // Fetch institution holidays
  const { data: institutionHolidays = [], isLoading: holidaysLoading } = useQuery({
    queryKey: ['institution-holidays', institutionId, currentYear],
    queryFn: () => institutionHolidayService.getByYear(institutionId!, currentYear),
    enabled: !!institutionId,
  });

  // Expand holidays to get all individual dates
  const holidayDates = useMemo(() => {
    const dates: Date[] = [];
    institutionHolidays.forEach((h) => {
      const startDate = parseISO(h.date);
      const endDate = h.end_date ? parseISO(h.end_date) : startDate;
      const interval = eachDayOfInterval({ start: startDate, end: endDate });
      dates.push(...interval);
    });
    return dates;
  }, [institutionHolidays]);

  // Calculate working days excluding holidays
  const leaveCalculation = useMemo(() => {
    if (!dateRange.from) {
      return { totalCalendarDays: 0, holidaysInRange: 0, workingDays: 0 };
    }
    
    const endDate = dateRange.to || dateRange.from;
    const allDays = eachDayOfInterval({ start: dateRange.from, end: endDate });
    const totalCalendarDays = allDays.length;
    
    // Count holidays in range
    const holidaysInRange = allDays.filter((day) =>
      holidayDates.some((hd) => isSameDay(hd, day))
    ).length;
    
    // Working days = total days - holidays (not excluding weekends since they may want to apply for weekends)
    const workingDays = Math.max(0, totalCalendarDays - holidaysInRange);
    
    return { totalCalendarDays, holidaysInRange, workingDays };
  }, [dateRange, holidayDates]);

  const totalDays = leaveCalculation.workingDays;

  const getAvailableBalance = (type: LeaveType): number => {
    switch (type) {
      case "sick":
        return leaveBalance.sick_leave;
      case "casual":
        return leaveBalance.casual_leave;
      case "earned":
        return leaveBalance.earned_leave;
      default:
        return 0;
    }
  };

  // Get holidays in selected range for display
  const holidaysInSelectedRange = useMemo(() => {
    if (!dateRange.from) return [];
    const endDate = dateRange.to || dateRange.from;
    
    return institutionHolidays.filter((h) => {
      const hStart = parseISO(h.date);
      const hEnd = h.end_date ? parseISO(h.end_date) : hStart;
      const rangeEnd = endDate;
      
      return (
        (hStart >= dateRange.from! && hStart <= rangeEnd) ||
        (hEnd >= dateRange.from! && hEnd <= rangeEnd) ||
        (hStart <= dateRange.from! && hEnd >= rangeEnd)
      );
    });
  }, [dateRange, institutionHolidays]);

  // Upcoming holidays
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return institutionHolidays
      .filter((h) => parseISO(h.date) >= today)
      .slice(0, 3);
  }, [institutionHolidays]);

  const isHolidayDate = (date: Date) => {
    return holidayDates.some((hd) => isSameDay(hd, date));
  };

  const handleSubmit = async () => {
    // Validation
    if (!dateRange.from) {
      toast({
        title: "Error",
        description: "Please select a date or date range",
        variant: "destructive",
      });
      return;
    }

    if (!leaveType) {
      toast({
        title: "Error",
        description: "Please select a leave type",
        variant: "destructive",
      });
      return;
    }

    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for leave",
        variant: "destructive",
      });
      return;
    }

    // Check leave balance
    const availableBalance = getAvailableBalance(leaveType);
    if (totalDays > availableBalance) {
      toast({
        title: "Insufficient Leave Balance",
        description: `You only have ${availableBalance} ${leaveType} leave days available`,
        variant: "destructive",
      });
      return;
    }

    // Check for past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (dateRange.from < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot apply leave for past dates",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const application: LeaveApplication = {
        id: `leave-${Date.now()}`,
        officer_id: officerId,
        officer_name: officerName,
        applicant_type: "innovation_officer",
        approval_stage: "manager_pending",
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to || dateRange.from, "yyyy-MM-dd"),
        leave_type: leaveType,
        reason: reason.trim(),
        total_days: totalDays,
        status: "pending",
        applied_at: new Date().toISOString(),
      };

      addLeaveApplication(application);

      toast({
        title: "Success",
        description: "Leave application submitted successfully!",
      });

      // Reset form
      setDateRange({ from: undefined, to: undefined });
      setLeaveType("");
      setReason("");
      onLeaveApplied();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit leave application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Apply for Leave
          </DialogTitle>
          <DialogDescription>
            Select dates and provide details for your leave application
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Left Column - Holiday Calendar */}
          <div className="space-y-4">
            <Card className="border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-primary" />
                  Institution Holidays
                  <Badge variant="outline" className="ml-auto text-xs">
                    {currentYear}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {holidaysLoading ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Loading holidays...
                  </div>
                ) : (
                  <>
                    <CalendarComponent
                      mode="range"
                      selected={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined}
                      onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                      numberOfMonths={1}
                      modifiers={{
                        holiday: holidayDates,
                      }}
                      modifiersClassNames={{
                        holiday: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium',
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      className={cn("pointer-events-auto")}
                    />

                    <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700" />
                        <span>Holidays</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-primary/20 border border-primary/50" />
                        <span>Selected</span>
                      </div>
                    </div>

                    {upcomingHolidays.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Upcoming Holidays
                        </div>
                        <div className="space-y-1.5">
                          {upcomingHolidays.map((h) => (
                            <div
                              key={h.id}
                              className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50"
                            >
                              <span className="font-medium truncate">{h.name}</span>
                              <Badge variant="secondary" className="text-xs shrink-0">
                                {format(parseISO(h.date), 'MMM dd')}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {institutionHolidays.length === 0 && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        No holidays configured for your institution
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <div className="space-y-4">
            {/* Leave Balance Summary */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{leaveBalance.sick_leave}</div>
                <div className="text-xs text-muted-foreground">Sick Leave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{leaveBalance.casual_leave}</div>
                <div className="text-xs text-muted-foreground">Casual Leave</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{leaveBalance.earned_leave}</div>
                <div className="text-xs text-muted-foreground">Earned Leave</div>
              </div>
            </div>

            {/* Selected Date Info */}
            {dateRange.from && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(dateRange.from, "MMM dd, yyyy")}
                    {dateRange.to && dateRange.to !== dateRange.from && ` to ${format(dateRange.to, "MMM dd, yyyy")}`}
                  </span>
                </div>
                
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calendar days</span>
                    <span>{leaveCalculation.totalCalendarDays}</span>
                  </div>
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
                    <Badge variant="secondary">{totalDays} day(s)</Badge>
                  </div>
                </div>

                {holidaysInSelectedRange.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2 mt-2">
                    <div className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                      Holidays in range (not counted):
                    </div>
                    <ul className="text-xs text-amber-600 dark:text-amber-400">
                      {holidaysInSelectedRange.map((h) => (
                        <li key={h.id}>• {h.name} ({format(parseISO(h.date), 'MMM dd')})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Leave Type */}
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={(value) => setLeaveType(value as LeaveType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">
                    Sick Leave ({leaveBalance.sick_leave} available)
                  </SelectItem>
                  <SelectItem value="casual">
                    Casual Leave ({leaveBalance.casual_leave} available)
                  </SelectItem>
                  <SelectItem value="earned">
                    Earned Leave ({leaveBalance.earned_leave} available)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                placeholder="Please provide a reason for your leave application..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">
                {reason.length}/500 characters
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || totalDays === 0}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
