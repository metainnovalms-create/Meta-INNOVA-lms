import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { leaveSettingsService, type LeaveSettings } from '@/services/leaveSettings.service';

interface LeaveOverviewTabProps {
  userId: string;
  userType: 'officer' | 'staff';
  year: number;
}

interface MonthlyLeaveBalance {
  month: number;
  monthly_credit: number;
  carried_forward: number;
  additional_credit: number;
  available: number;
  sick_leave_used: number;
  casual_leave_used: number;
  lop_days: number;
  balance: number;
  isAutoCarried?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function LeaveOverviewTab({ userId, userType, year }: LeaveOverviewTabProps) {
  const [leaveBalances, setLeaveBalances] = useState<MonthlyLeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaveSettings, setLeaveSettings] = useState<LeaveSettings>({
    leaves_per_year: 12,
    leaves_per_month: 1,
    max_carry_forward: 1,
    max_leaves_per_month: 2,
    gps_checkin_enabled: true
  });

  // Calculate totals
  const totals = leaveBalances.reduce((acc, b) => ({
    totalEntitlement: acc.totalEntitlement + b.monthly_credit,
    sickUsed: acc.sickUsed + b.sick_leave_used,
    casualUsed: acc.casualUsed + b.casual_leave_used,
    lopDays: acc.lopDays + b.lop_days
  }), { totalEntitlement: 0, sickUsed: 0, casualUsed: 0, lopDays: 0 });

  const totalUsed = totals.sickUsed + totals.casualUsed;
  const remaining = leaveBalances.length > 0 ? leaveBalances[leaveBalances.length - 1].balance : 0;

  useEffect(() => {
    loadLeaveSettings();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchLeaveBalances();
    }
  }, [userId, year, leaveSettings]);

  const loadLeaveSettings = async () => {
    try {
      const settings = await leaveSettingsService.getSettings();
      setLeaveSettings(settings);
    } catch (error) {
      console.error('Error loading leave settings:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      setIsLoading(true);
      
      // Fetch leave balances (manual overrides)
      const { data: balances } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .order('month', { ascending: true });

      // Fetch approved leave applications
      const { data: approvedLeaves } = await supabase
        .from('leave_applications')
        .select('start_date, end_date, leave_type, total_days, is_lop, lop_days, paid_days')
        .eq('applicant_id', userId)
        .eq('status', 'approved')
        .gte('start_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`);

      // Calculate per-month leave usage
      const monthlyUsage = new Map<number, { sick: number; casual: number; lop: number }>();
      
      (approvedLeaves || []).forEach(leave => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        
        let current = new Date(startDate);
        while (current <= endDate) {
          if (current.getFullYear() === year) {
            const monthNum = current.getMonth() + 1;
            const existing = monthlyUsage.get(monthNum) || { sick: 0, casual: 0, lop: 0 };
            
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              if (leave.leave_type === 'sick') {
                existing.sick += 1;
              } else if (leave.leave_type === 'casual') {
                existing.casual += 1;
              }
            }
            
            monthlyUsage.set(monthNum, existing);
          }
          current.setDate(current.getDate() + 1);
        }
        
        if (leave.is_lop && leave.lop_days && leave.lop_days > 0) {
          const leaveMonth = new Date(leave.start_date).getMonth() + 1;
          const existing = monthlyUsage.get(leaveMonth) || { sick: 0, casual: 0, lop: 0 };
          existing.lop += leave.lop_days;
          monthlyUsage.set(leaveMonth, existing);
        }
      });

      // Build monthly data with automatic carry-forward
      let previousBalance = 0;
      
      const monthlyData: MonthlyLeaveBalance[] = MONTHS.map((_, index) => {
        const monthNum = index + 1;
        const existing = balances?.find((b: any) => b.month === monthNum);
        const usage = monthlyUsage.get(monthNum) || { sick: 0, casual: 0, lop: 0 };
        
        const manualCarried = existing?.carried_forward || 0;
        const additionalCredit = existing?.additional_credit || 0;
        const monthlyCredit = leaveSettings.leaves_per_month;
        const maxCarryForward = leaveSettings.max_carry_forward;
        const maxLeavesPerMonth = leaveSettings.max_leaves_per_month;
        
        const autoCarried = monthNum === 1 ? 0 : Math.min(previousBalance, maxCarryForward);
        const hasManualOverride = existing?.id && (existing?.carried_forward > 0 || existing?.adjustment_reason);
        const carriedForward = hasManualOverride ? manualCarried : autoCarried;
        
        const rawAvailable = monthlyCredit + carriedForward + additionalCredit;
        const available = hasManualOverride ? rawAvailable : Math.min(rawAvailable, maxLeavesPerMonth);
        
        const totalUsed = usage.sick + usage.casual;
        const balance = Math.max(0, available - totalUsed);
        
        previousBalance = balance;
        
        return {
          month: monthNum,
          monthly_credit: monthlyCredit,
          carried_forward: carriedForward,
          additional_credit: additionalCredit,
          available,
          sick_leave_used: usage.sick,
          casual_leave_used: usage.casual,
          lop_days: usage.lop,
          balance,
          isAutoCarried: !hasManualOverride && carriedForward > 0
        };
      });

      setLeaveBalances(monthlyData);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentMonth = new Date().getMonth() + 1;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leave Balance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Leave Balance - {year}
            </CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
              <Info className="h-3.5 w-3.5" />
              <span>Credit: {leaveSettings.leaves_per_month}/mo</span>
              <span className="text-muted-foreground/50">|</span>
              <span>Max Carry: {leaveSettings.max_carry_forward}</span>
              <span className="text-muted-foreground/50">|</span>
              <span>Max/Month: {leaveSettings.max_leaves_per_month}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Credit</TableHead>
                  <TableHead className="text-center">Carried</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Sick</TableHead>
                  <TableHead className="text-center">Casual</TableHead>
                  <TableHead className="text-center">LOP</TableHead>
                  <TableHead className="text-center">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveBalances.map((balance) => {
                  const isCurrentMonth = balance.month === currentMonth && year === new Date().getFullYear();
                  return (
                    <TableRow key={balance.month} className={isCurrentMonth ? 'bg-primary/5' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isCurrentMonth && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          {MONTHS[balance.month - 1]}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{balance.monthly_credit}</TableCell>
                      <TableCell className="text-center">
                        {balance.carried_forward > 0 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            {balance.carried_forward}
                            {balance.isAutoCarried && <span className="ml-1 text-xs opacity-70">(auto)</span>}
                          </Badge>
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">{balance.available}</TableCell>
                      <TableCell className="text-center">
                        {balance.sick_leave_used > 0 ? (
                          <span className="text-orange-600">{balance.sick_leave_used}</span>
                        ) : '0'}
                      </TableCell>
                      <TableCell className="text-center">
                        {balance.casual_leave_used > 0 ? (
                          <span className="text-yellow-600">{balance.casual_leave_used}</span>
                        ) : '0'}
                      </TableCell>
                      <TableCell className="text-center">
                        {balance.lop_days > 0 ? (
                          <Badge variant="destructive">{balance.lop_days}</Badge>
                        ) : '0'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={balance.balance > 0 ? 'default' : 'secondary'}
                          className={balance.balance > 0 ? 'bg-green-500' : ''}
                        >
                          {balance.balance}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
