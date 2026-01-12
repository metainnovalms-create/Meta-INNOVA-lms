import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarCheck, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';
import { leaveApplicationService, leaveBalanceService } from '@/services/leave.service';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LeaveApplication, 
  LeaveStatus as LeaveStatusType,
  LEAVE_TYPE_LABELS, 
  LEAVE_STATUS_LABELS 
} from '@/types/leave';

export default function LeaveStatus() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['my-leave-applications'],
    queryFn: leaveApplicationService.getMyApplications,
    enabled: !!user
  });

  const { data: yearlyBalances = [] } = useQuery({
    queryKey: ['yearly-leave-balances', user?.id, currentYear],
    queryFn: () => leaveBalanceService.getYearlyBalances(user!.id, currentYear),
    enabled: !!user?.id
  });

  const getStatusBadge = (status: LeaveStatusType) => {
    const styles: Record<LeaveStatusType, string> = {
      pending: 'bg-yellow-500/20 text-yellow-600',
      approved: 'bg-green-500/20 text-green-600',
      rejected: 'bg-red-500/20 text-red-600',
      cancelled: 'bg-gray-500/20 text-gray-600'
    };
    const icons: Record<LeaveStatusType, React.ReactNode> = {
      pending: <Clock className="h-3 w-3 mr-1" />,
      approved: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />,
      cancelled: <AlertCircle className="h-3 w-3 mr-1" />
    };
    return (
      <Badge className={`${styles[status]} flex items-center`}>
        {icons[status]}
        {LEAVE_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  const totalUsed = yearlyBalances.reduce((sum, b) => sum + b.sick_leave_used + b.casual_leave_used, 0);
  const totalLOP = yearlyBalances.reduce((sum, b) => sum + b.lop_days, 0);

  const renderApplicationsTable = (apps: LeaveApplication[]) => {
    if (apps.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No leave applications found
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date Range</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>LOP</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Approval Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => (
            <TableRow key={app.id}>
              <TableCell>
                <div className="font-medium">
                  {format(parseISO(app.start_date), 'MMM dd')} - {format(parseISO(app.end_date), 'MMM dd, yyyy')}
                </div>
                <div className="text-xs text-muted-foreground truncate max-w-xs">{app.reason}</div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{LEAVE_TYPE_LABELS[app.leave_type]}</Badge>
              </TableCell>
              <TableCell>{app.total_days}</TableCell>
              <TableCell>
                {app.lop_days > 0 ? (
                  <Badge variant="destructive">{app.lop_days} LOP</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(app.status)}</TableCell>
              <TableCell>
                <div className="space-y-1">
                  {app.approval_chain.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        step.status === 'approved' ? 'bg-green-500' :
                        step.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <span className={step.status !== 'pending' ? 'font-medium' : 'text-muted-foreground'}>
                        {step.position_name}
                      </span>
                    </div>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <CalendarCheck className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">My Leave Status</h1>
            <p className="text-muted-foreground">Track your leave applications and balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Entitlement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">leaves per year</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Used</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsed}</div>
              <p className="text-xs text-muted-foreground">leaves taken</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">LOP Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalLOP}</div>
              <p className="text-xs text-muted-foreground">loss of pay days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingApps.length}</div>
              <p className="text-xs text-muted-foreground">applications</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Leave Applications</CardTitle>
            <CardDescription>View all your leave applications and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger>
                  <TabsTrigger value="approved">Approved ({approvedApps.length})</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected ({rejectedApps.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all">{renderApplicationsTable(applications)}</TabsContent>
                <TabsContent value="pending">{renderApplicationsTable(pendingApps)}</TabsContent>
                <TabsContent value="approved">{renderApplicationsTable(approvedApps)}</TabsContent>
                <TabsContent value="rejected">{renderApplicationsTable(rejectedApps)}</TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}