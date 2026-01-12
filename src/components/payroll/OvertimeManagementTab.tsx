import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, Clock, CheckCircle, XCircle, User, AlertCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/utils/attendanceHelpers';
import { 
  fetchOvertimeRequests, 
  approveOvertimeRequest,
  rejectOvertimeRequest,
  OvertimeRequest 
} from '@/services/payroll.service';

interface OvertimeManagementTabProps {
  month: number;
  year: number;
}

export function OvertimeManagementTab({ month, year }: OvertimeManagementTabProps) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedRequest, setSelectedRequest] = useState<OvertimeRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter as 'pending' | 'approved' | 'rejected';
      const data = await fetchOvertimeRequests(status);
      setRequests(data);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!req.user_name.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  const handleApprove = async (request: OvertimeRequest) => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      const success = await approveOvertimeRequest(request.id, user.id, user.name);
      if (success) {
        toast.success('Overtime request approved');
        loadRequests();
      } else {
        toast.error('Failed to approve request');
      }
    } catch (error) {
      toast.error('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!user || !selectedRequest) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      const success = await rejectOvertimeRequest(
        selectedRequest.id, 
        user.id, 
        user.name, 
        rejectionReason
      );
      if (success) {
        toast.success('Overtime request rejected');
        setRejectDialogOpen(false);
        setSelectedRequest(null);
        setRejectionReason('');
        loadRequests();
      } else {
        toast.error('Failed to reject request');
      }
    } catch (error) {
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectDialog = (request: OvertimeRequest) => {
    setSelectedRequest(request);
    setRejectDialogOpen(true);
  };

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

  // Calculate totals
  const totalPendingHours = filteredRequests.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.requested_hours, 0);
  const totalApprovedHours = filteredRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.requested_hours, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Overtime Management</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review and approve overtime requests from employees
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
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredRequests.filter(r => r.status === 'pending').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{totalPendingHours.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Pending Hours</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {filteredRequests.filter(r => r.status === 'approved').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{totalApprovedHours.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Approved Hours</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
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
                  <TableHead>Source</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No overtime requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{request.user_name}</span>
                            <p className="text-xs text-muted-foreground">{request.position_name || '-'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(request as { source?: string }).source === 'auto_generated' ? (
                          <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20 text-xs">
                            Auto
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(request.date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.requested_hours}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground max-w-[150px] truncate block">
                          {request.reason}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {request.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(request)}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openRejectDialog(request)}
                              disabled={isProcessing}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {request.approved_by_name && `By ${request.approved_by_name}`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Overtime Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the overtime request from {selectedRequest?.user_name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p><strong>Date:</strong> {selectedRequest && format(parseISO(selectedRequest.date), 'dd MMM yyyy')}</p>
              <p><strong>Hours:</strong> {selectedRequest?.requested_hours}</p>
              <p><strong>Reason:</strong> {selectedRequest?.reason}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
