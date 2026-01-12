import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Calendar, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LeaveBalanceEditDialog } from './LeaveBalanceEditDialog';
import { leaveSettingsService, type LeaveSettings } from '@/services/leaveSettings.service';

interface LeaveManagementTabProps {
  year: number;
}

interface Employee {
  id: string;
  userId: string; // Profile/auth user ID for leave queries
  name: string;
  employee_id: string | null;
  type: 'officer' | 'staff';
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
  id?: string;
  adjustment_reason?: string;
  isAutoCarried?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function LeaveManagementTab({ year }: LeaveManagementTabProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [leaveBalances, setLeaveBalances] = useState<MonthlyLeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [editingMonth, setEditingMonth] = useState<MonthlyLeaveBalance | null>(null);
  const [leaveSettings, setLeaveSettings] = useState<LeaveSettings>({
    leaves_per_year: 12,
    leaves_per_month: 1,
    max_carry_forward: 1,
    max_leaves_per_month: 2,
    gps_checkin_enabled: true
  });

  useEffect(() => {
    fetchEmployees();
    loadLeaveSettings();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchLeaveBalances();
    }
  }, [selectedEmployeeId, year, leaveSettings]);

  const loadLeaveSettings = async () => {
    try {
      const settings = await leaveSettingsService.getSettings();
      setLeaveSettings(settings);
    } catch (error) {
      console.error('Error loading leave settings:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      
      // Fetch officers - include user_id for leave queries
      const { data: officers } = await supabase
        .from('officers')
        .select('id, full_name, employee_id, user_id')
        .eq('status', 'active');

      // Fetch meta staff
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, employee_id')
        .not('position_id', 'is', null);

      const allEmployees: Employee[] = [
        ...(officers || []).map((o: any) => ({
          id: o.id,
          userId: o.user_id || o.id, // Use user_id for officers (links to profile)
          name: o.full_name,
          employee_id: o.employee_id,
          type: 'officer' as const
        })),
        ...(profiles || []).map((p: any) => ({
          id: p.id,
          userId: p.id, // For staff, profile ID is the user ID
          name: p.name,
          employee_id: p.employee_id,
          type: 'staff' as const
        }))
      ];

      setEmployees(allEmployees);
      if (allEmployees.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(allEmployees[0].id);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLeaveBalances = async () => {
    if (!selectedEmployeeId) return;
    
    // Get the correct userId for leave queries (officers have different id vs user_id)
    const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
    const leaveQueryId = selectedEmp?.userId || selectedEmployeeId;
    
    try {
      setIsLoadingBalances(true);
      
      // Fetch leave balances (manual overrides)
      const { data: balances } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('user_id', selectedEmployeeId)
        .eq('year', year)
        .order('month', { ascending: true });

      // Fetch approved leave applications using the correct user ID
      const { data: approvedLeaves } = await supabase
        .from('leave_applications')
        .select('start_date, end_date, leave_type, total_days, is_lop, lop_days, paid_days')
        .eq('applicant_id', leaveQueryId)
        .eq('status', 'approved')
        .gte('start_date', `${year}-01-01`)
        .lte('end_date', `${year}-12-31`);

      // Calculate per-month leave usage from approved applications
      const monthlyUsage = new Map<number, { sick: number; casual: number; lop: number }>();
      
      (approvedLeaves || []).forEach(leave => {
        // Split leave across months if it spans multiple months
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        
        let current = new Date(startDate);
        while (current <= endDate) {
          if (current.getFullYear() === year) {
            const monthNum = current.getMonth() + 1;
            const existing = monthlyUsage.get(monthNum) || { sick: 0, casual: 0, lop: 0 };
            
            // Count working days only (skip weekends)
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
        
        // Add LOP days if applicable
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
        
        // Get manual overrides from database
        const manualCarried = existing?.carried_forward || 0;
        const additionalCredit = existing?.additional_credit || 0;
        
        // Use config values from leave settings
        const monthlyCredit = leaveSettings.leaves_per_month;
        const maxCarryForward = leaveSettings.max_carry_forward;
        const maxLeavesPerMonth = leaveSettings.max_leaves_per_month;
        
        // For January, no automatic carry-forward
        // For other months, carry forward previous month's balance (capped at max_carry_forward)
        const autoCarried = monthNum === 1 ? 0 : Math.min(previousBalance, maxCarryForward);
        
        // Use manual override if record exists, otherwise use automatic
        const hasManualOverride = existing?.id && (existing?.carried_forward > 0 || existing?.adjustment_reason);
        const carriedForward = hasManualOverride ? manualCarried : autoCarried;
        
        // Calculate available (cap at max leaves per month unless manual override)
        const rawAvailable = monthlyCredit + carriedForward + additionalCredit;
        const available = hasManualOverride ? rawAvailable : Math.min(rawAvailable, maxLeavesPerMonth);
        
        const totalUsed = usage.sick + usage.casual;
        const balance = Math.max(0, available - totalUsed);
        
        // Store for next month's carry-forward
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
          id: existing?.id,
          adjustment_reason: existing?.adjustment_reason,
          isAutoCarried: !hasManualOverride && carriedForward > 0
        };
      });

      setLeaveBalances(monthlyData);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const handleEditSave = async (data: { carriedForward: number; additionalCredit: number; reason: string }) => {
    if (!editingMonth || !selectedEmployeeId) return;

    try {
      const selectedEmp = employees.find(e => e.id === selectedEmployeeId);
      const userType = selectedEmp?.type === 'officer' ? 'officer' : 'meta_staff';
      
      const updateData = {
        carried_forward: data.carriedForward,
        additional_credit: data.additionalCredit,
        adjustment_reason: data.reason,
        adjusted_at: new Date().toISOString()
      };

      if (editingMonth.id) {
        // Update existing record
        await supabase
          .from('leave_balances')
          .update(updateData)
          .eq('id', editingMonth.id);
      } else {
        // Create new record
        await supabase
          .from('leave_balances')
          .insert({
            user_id: selectedEmployeeId,
            user_type: userType,
            year,
            month: editingMonth.month,
            monthly_credit: 1,
            ...updateData
          });
      }

      setEditingMonth(null);
      fetchLeaveBalances();
    } catch (error) {
      console.error('Error saving leave balance:', error);
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Employee Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Employee:</span>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map(emp => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.name} {emp.employee_id ? `(${emp.employee_id})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedEmployee && (
          <Badge variant="outline">
            {selectedEmployee.type === 'officer' ? 'Officer' : 'Staff'}
          </Badge>
        )}
      </div>

      {/* Leave Balance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Leave Balance - {year}
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
          {isLoadingBalances ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-center">Credit</TableHead>
                    <TableHead className="text-center">Carried</TableHead>
                    <TableHead className="text-center">Additional</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead className="text-center">Sick</TableHead>
                    <TableHead className="text-center">Casual</TableHead>
                    <TableHead className="text-center">LOP</TableHead>
                    <TableHead className="text-center">Balance</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
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
                        <TableCell className="text-center">
                          {balance.additional_credit > 0 ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {balance.additional_credit}
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
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingMonth(balance)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <LeaveBalanceEditDialog
        open={!!editingMonth}
        onOpenChange={(open) => !open && setEditingMonth(null)}
        monthName={editingMonth ? MONTHS[editingMonth.month - 1] : ''}
        year={year}
        initialCarriedForward={editingMonth?.carried_forward || 0}
        initialAdditionalCredit={editingMonth?.additional_credit || 0}
        initialReason={editingMonth?.adjustment_reason || ''}
        onSave={handleEditSave}
      />
    </div>
  );
}
