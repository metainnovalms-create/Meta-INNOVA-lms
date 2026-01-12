import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Users, Calendar, Search, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { leaveApplicationService } from '@/services/leave.service';
import { 
  LeaveStatus as LeaveStatusType,
  UserType,
  LEAVE_TYPE_LABELS, 
  LEAVE_STATUS_LABELS 
} from '@/types/leave';

export default function LeaveTracking() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    year: currentYear,
    status: '' as LeaveStatusType | '',
    applicantType: '' as UserType | '',
    search: ''
  });

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['all-leave-applications', filters],
    queryFn: () => leaveApplicationService.getAllApplications({
      status: filters.status || undefined,
      year: filters.year,
      applicantType: filters.applicantType || undefined
    })
  });

  const filteredApplications = applications.filter(app => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return app.applicant_name.toLowerCase().includes(searchLower) ||
             app.institution_name?.toLowerCase().includes(searchLower) ||
             app.position_name?.toLowerCase().includes(searchLower);
    }
    return true;
  });

  const getStatusBadge = (status: LeaveStatusType) => {
    const styles: Record<LeaveStatusType, string> = {
      pending: 'bg-yellow-500/20 text-yellow-600',
      approved: 'bg-green-500/20 text-green-600',
      rejected: 'bg-red-500/20 text-red-600',
      cancelled: 'bg-gray-500/20 text-gray-600'
    };
    return <Badge className={styles[status]}>{LEAVE_STATUS_LABELS[status]}</Badge>;
  };

  const stats = {
    total: filteredApplications.length,
    pending: filteredApplications.filter(a => a.status === 'pending').length,
    approved: filteredApplications.filter(a => a.status === 'approved').length,
    rejected: filteredApplications.filter(a => a.status === 'rejected').length,
    totalLOP: filteredApplications.reduce((sum, a) => sum + a.lop_days, 0)
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Leave Tracking</h1>
              <p className="text-muted-foreground">Track all employee leave history</p>
            </div>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Applications</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">{stats.totalLOP}</div>
              <p className="text-xs text-muted-foreground">Total LOP Days</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  All Leave Applications
                </CardTitle>
                <CardDescription>Complete leave history for all employees</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, institution..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select 
                value={filters.year.toString()} 
                onValueChange={(v) => setFilters({ ...filters, year: parseInt(v) })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={filters.status} 
                onValueChange={(v) => setFilters({ ...filters, status: v as LeaveStatusType | '' })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filters.applicantType} 
                onValueChange={(v) => setFilters({ ...filters, applicantType: v as UserType | '' })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="officer">Officer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No leave applications found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>LOP</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="font-medium">{app.applicant_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {app.applicant_type === 'officer' ? app.institution_name : app.position_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {app.applicant_type === 'officer' ? 'Officer' : 'Staff'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(parseISO(app.start_date), 'MMM dd')} - {format(parseISO(app.end_date), 'MMM dd')}
                      </TableCell>
                      <TableCell>{LEAVE_TYPE_LABELS[app.leave_type]}</TableCell>
                      <TableCell>{app.total_days}</TableCell>
                      <TableCell>
                        {app.lop_days > 0 ? (
                          <Badge variant="destructive">{app.lop_days}</Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {app.applied_at && format(parseISO(app.applied_at), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}