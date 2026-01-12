import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { leaveBalanceService, leaveApplicationService } from '@/services/leave.service';
import { LeaveApplication, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LeaveStatus, LeaveType, LEAVES_PER_YEAR } from '@/types/leave';
import { format, parseISO } from 'date-fns';
import { Calendar, FileText, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';

const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function LeaveRecords() {
  const { user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data: yearlyBalances = [], isLoading: balancesLoading } = useQuery({
    queryKey: ['leave-balances-yearly', user?.id, selectedYear],
    queryFn: () => leaveBalanceService.getYearlyBalances(user!.id, parseInt(selectedYear)),
    enabled: !!user?.id
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['my-leave-applications', user?.id],
    queryFn: () => leaveApplicationService.getMyApplications(),
    enabled: !!user?.id
  });

  const yearApplications = applications.filter(app => {
    const appYear = new Date(app.start_date).getFullYear();
    return appYear === parseInt(selectedYear);
  });

  const stats = {
    totalEntitlement: LEAVES_PER_YEAR,
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
      cancelled: <AlertTriangle className="h-3 w-3 mr-1" />,
    };
    
    return (
      <Badge variant={variants[status]} className="flex items-center w-fit">
        {icons[status]}
        {LEAVE_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const usagePercentage = (stats.used / stats.totalEntitlement) * 100;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leave Records</h1>
            <p className="text-muted-foreground">
              Your complete leave history and balance details
            </p>
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
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

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

        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
            <TabsTrigger value="applications">Leave Applications</TabsTrigger>
            <TabsTrigger value="summary">Year Summary</TabsTrigger>
          </TabsList>

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
                      const balance = yearlyBalances.find(b => b.month === index + 1);
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
                          <TableCell className="text-right">{balance?.monthly_credit || '-'}</TableCell>
                          <TableCell className="text-right">{balance?.carried_forward || '-'}</TableCell>
                          <TableCell className="text-right">
                            {balance ? balance.monthly_credit + balance.carried_forward : '-'}
                          </TableCell>
                          <TableCell className="text-right">{balance?.sick_leave_used || '-'}</TableCell>
                          <TableCell className="text-right">{balance?.casual_leave_used || '-'}</TableCell>
                          <TableCell className="text-right">
                            {balance?.lop_days ? (
                              <span className="text-red-600">{balance.lop_days}</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {balance?.balance_remaining ?? '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

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
      </div>
    </Layout>
  );
}
