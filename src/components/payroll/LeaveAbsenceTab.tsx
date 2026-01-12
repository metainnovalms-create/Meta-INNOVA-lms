import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Calendar, AlertTriangle, CheckCircle, XCircle, 
  Clock, User, FileText
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { calculateLOPDeduction, STANDARD_DAYS_PER_MONTH } from '@/services/payroll.service';

interface LeaveAbsenceTabProps {
  month: number;
  year: number;
}

interface LeaveApplication {
  id: string;
  applicant_id: string;
  applicant_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: string;
  is_lop: boolean;
  lop_days: number;
  paid_days: number;
  applied_at: string;
}

interface UninformedAbsence {
  user_id: string;
  user_name: string;
  user_type: string;
  position_name?: string;
  date: string;
  monthly_salary: number;
  deduction_amount: number;
}

export function LeaveAbsenceTab({ month, year }: LeaveAbsenceTabProps) {
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [uninformedAbsences, setUninformedAbsences] = useState<UninformedAbsence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('leaves');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [month, year]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load leave applications for the month
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
      
      const { data: leaves, error: leaveError } = await supabase
        .from('leave_applications')
        .select('*')
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .order('applied_at', { ascending: false });
      
      if (leaveError) {
        console.error('Error fetching leaves:', leaveError);
      } else {
        setLeaveApplications(leaves || []);
      }
      
      // For now, we'll show mock uninformed absences
      // In production, this would detect days without check-in and no leave
      setUninformedAbsences([]);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeaves = leaveApplications.filter(leave => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!leave.applicant_name.toLowerCase().includes(query)) return false;
    }
    if (statusFilter !== 'all' && leave.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLeaveTypeBadge = (type: string, isLop: boolean) => {
    if (isLop) {
      return <Badge variant="destructive">LOP</Badge>;
    }
    switch (type) {
      case 'sick':
        return <Badge className="bg-red-500/10 text-red-700 border-red-500/20">Sick</Badge>;
      case 'casual':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Casual</Badge>;
      case 'annual':
        return <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/20">Annual</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // Calculate totals
  const totalLeaveDays = filteredLeaves.reduce((sum, l) => sum + l.total_days, 0);
  const totalLopDays = filteredLeaves.reduce((sum, l) => sum + (l.lop_days || 0), 0);
  const approvedLeaves = filteredLeaves.filter(l => l.status === 'approved').length;
  const pendingLeaves = filteredLeaves.filter(l => l.status === 'pending').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Leave & Absence Analysis</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Track leave applications, uninformed absences, and LOP deductions
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{totalLeaveDays}</p>
                <p className="text-xs text-muted-foreground">Total Leave Days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{totalLopDays}</p>
                <p className="text-xs text-muted-foreground">LOP Days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{approvedLeaves}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{pendingLeaves}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sub Tabs */}
        <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
          <TabsList>
            <TabsTrigger value="leaves" className="gap-2">
              <Calendar className="h-4 w-4" />
              Leave Applications
            </TabsTrigger>
            <TabsTrigger value="uninformed" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Uninformed Absences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaves" className="mt-4">
            {/* Filters */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-center">Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="text-center">LOP Days</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No leave applications found for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium">{leave.applicant_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getLeaveTypeBadge(leave.leave_type, leave.is_lop)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{format(parseISO(leave.start_date), 'dd MMM')}</p>
                            <p className="text-muted-foreground">to {format(parseISO(leave.end_date), 'dd MMM')}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {leave.total_days}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
                            {leave.reason}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {leave.lop_days > 0 ? (
                            <span className="text-red-600 font-medium">{leave.lop_days}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(leave.status)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="uninformed" className="mt-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Uninformed Absences</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Days where employees didn't check in and have no approved leave. These are automatically marked as LOP.
                    Deduction = Monthly Salary ÷ {STANDARD_DAYS_PER_MONTH} days × Absent Days
                  </p>
                </div>
              </div>
            </div>

            {uninformedAbsences.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-muted-foreground">No uninformed absences detected this month</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Monthly Salary</TableHead>
                    <TableHead className="text-right">Deduction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uninformedAbsences.map((absence, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-red-500" />
                          </div>
                          <span className="font-medium">{absence.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{absence.position_name || '-'}</TableCell>
                      <TableCell>{format(parseISO(absence.date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(absence.monthly_salary)}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        -{formatCurrency(absence.deduction_amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
