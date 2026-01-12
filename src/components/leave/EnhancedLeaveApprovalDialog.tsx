import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Check, X, Calendar, User, AlertTriangle, CheckCircle, 
  Wallet, Clock, Users, FileText, ArrowRight 
} from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { LeaveApplication, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, SubstituteAssignment } from '@/types/leave';
import { supabase } from '@/integrations/supabase/client';

interface EnhancedLeaveApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: LeaveApplication | null;
  onApprove: (comments: string, adjustedPaidDays?: number, adjustedLopDays?: number) => void;
  onReject: (reason: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function EnhancedLeaveApprovalDialog({
  open,
  onOpenChange,
  application,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false
}: EnhancedLeaveApprovalDialogProps) {
  const [mode, setMode] = useState<'view' | 'approve' | 'reject' | 'adjust'>('view');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adjustedPaidDays, setAdjustedPaidDays] = useState<number>(0);
  const [adjustedLopDays, setAdjustedLopDays] = useState<number>(0);

  // Reset state when dialog opens with new application
  useMemo(() => {
    if (application) {
      setMode('view');
      setComments('');
      setRejectionReason('');
      setAdjustedPaidDays(application.paid_days || 0);
      setAdjustedLopDays(application.lop_days || 0);
    }
  }, [application?.id]);

  // Fetch previous leaves this month for the applicant
  const { data: previousLeaves = [] } = useQuery({
    queryKey: ['previous-leaves-month', application?.applicant_id, application?.start_date],
    queryFn: async () => {
      if (!application) return [];
      
      const leaveDate = parseISO(application.start_date);
      const monthStart = format(startOfMonth(leaveDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(leaveDate), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('leave_applications')
        .select('id, start_date, end_date, total_days, paid_days, lop_days, status, leave_type')
        .eq('applicant_id', application.applicant_id)
        .gte('start_date', monthStart)
        .lte('start_date', monthEnd)
        .neq('id', application.id)
        .in('status', ['approved', 'pending'])
        .order('start_date');
      
      if (error) {
        console.error('Error fetching previous leaves:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!application?.applicant_id && open
  });

  if (!application) return null;

  const storedPaidDays = application.paid_days || 0;
  const storedLopDays = application.lop_days || 0;
  const substitutes = application.substitute_assignments || [];
  const hasSubstitutes = substitutes.length > 0 && substitutes.some(s => s.substitute_officer_id && s.substitute_officer_id !== 'no-substitute');

  const handleApproveClick = () => {
    setMode('approve');
  };

  const handleRejectClick = () => {
    setMode('reject');
  };

  const handleConfirmApprove = () => {
    if (mode === 'adjust') {
      onApprove(comments, adjustedPaidDays, adjustedLopDays);
    } else {
      onApprove(comments);
    }
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) return;
    onReject(rejectionReason);
  };

  const handleAdjustLOP = () => {
    setMode('adjust');
    setAdjustedPaidDays(storedPaidDays);
    setAdjustedLopDays(storedLopDays);
  };

  const handleDaysChange = (paid: number) => {
    const total = application.total_days;
    const newPaid = Math.max(0, Math.min(paid, total));
    setAdjustedPaidDays(newPaid);
    setAdjustedLopDays(total - newPaid);
  };

  const monthName = format(parseISO(application.start_date), 'MMMM yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Leave Application Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-5">
            {/* Application Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">Applicant</Label>
                <p className="font-medium flex items-center gap-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {application.applicant_name}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Position</Label>
                <p className="font-medium">{application.position_name || '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Leave Type</Label>
                <Badge variant="outline">{LEAVE_TYPE_LABELS[application.leave_type]}</Badge>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Status</Label>
                <Badge variant={application.status === 'pending' ? 'secondary' : application.status === 'approved' ? 'default' : 'destructive'}>
                  {LEAVE_STATUS_LABELS[application.status]}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Date Range</Label>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(parseISO(application.start_date), 'PP')} - {format(parseISO(application.end_date), 'PP')}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Total Days</Label>
                <p className="font-medium text-lg">{application.total_days}</p>
              </div>
            </div>

            <div>
              <Label className="text-muted-foreground text-xs">Reason</Label>
              <p className="text-sm mt-1 p-2 bg-muted/50 rounded">{application.reason}</p>
            </div>

            <Separator />

            {/* Pay Calculation - Show STORED values */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="h-4 w-4 text-primary" />
                  <Label className="font-medium">Pay Calculation (as submitted)</Label>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-semibold">{storedPaidDays}</span>
                    <span className="text-sm">Paid Day{storedPaidDays !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {storedLopDays > 0 && (
                    <>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 px-3 py-2 rounded-lg">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-semibold">{storedLopDays}</span>
                        <span className="text-sm">LOP Day{storedLopDays !== 1 ? 's' : ''}</span>
                      </div>
                    </>
                  )}
                </div>

                {storedLopDays > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Employee has insufficient leave balance. LOP will be deducted from salary.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Previous Leaves This Month */}
            {previousLeaves.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Previous Leaves in {monthName}</Label>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Dates</TableHead>
                        <TableHead className="text-xs">Days</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Paid/LOP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previousLeaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="text-xs">
                            {format(parseISO(leave.start_date), 'MMM d')} - {format(parseISO(leave.end_date), 'MMM d')}
                          </TableCell>
                          <TableCell className="text-xs">{leave.total_days}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              {LEAVE_TYPE_LABELS[leave.leave_type as keyof typeof LEAVE_TYPE_LABELS] || leave.leave_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge 
                              variant={leave.status === 'approved' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {leave.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            <span className="text-green-600">{leave.paid_days || 0}</span>
                            {(leave.lop_days || 0) > 0 && (
                              <span className="text-orange-600 ml-1">/ {leave.lop_days} LOP</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Substitution Details */}
            {hasSubstitutes && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Substitution Arrangements</Label>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Day</TableHead>
                        <TableHead className="text-xs">Class</TableHead>
                        <TableHead className="text-xs">Period</TableHead>
                        <TableHead className="text-xs">Substitute</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {substitutes
                        .filter((s: SubstituteAssignment) => s.substitute_officer_id && s.substitute_officer_id !== 'no-substitute')
                        .map((sub: SubstituteAssignment, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs">{format(parseISO(sub.date), 'MMM d')}</TableCell>
                            <TableCell className="text-xs">{sub.day}</TableCell>
                            <TableCell className="text-xs">{sub.class_name || '-'}</TableCell>
                            <TableCell className="text-xs">{sub.period_label || '-'}</TableCell>
                            <TableCell className="text-xs font-medium">{sub.substitute_officer_name || '-'}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {/* Approval Chain */}
            {application.approval_chain.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground text-xs">Approval Chain</Label>
                  <div className="mt-2 space-y-2">
                    {application.approval_chain.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Badge variant={
                          step.status === 'approved' ? 'default' :
                          step.status === 'rejected' ? 'destructive' :
                          'secondary'
                        } className="w-6 h-6 p-0 flex items-center justify-center rounded-full">
                          {step.order}
                        </Badge>
                        <span>{step.position_name || `Level ${step.order}`}</span>
                        {step.status === 'approved' && step.approved_by_name && (
                          <span className="text-green-600 text-xs">✓ {step.approved_by_name}</span>
                        )}
                        {step.status === 'pending' && (
                          <span className="text-yellow-600 text-xs">Pending</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Approve Mode */}
            {mode === 'approve' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="font-medium">Approval Comments (Optional)</Label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Add any comments..."
                    rows={2}
                  />
                  <Button variant="link" size="sm" className="p-0 h-auto text-amber-600" onClick={handleAdjustLOP}>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Adjust Paid/LOP days
                  </Button>
                </div>
              </>
            )}

            {/* Adjust LOP Mode */}
            {mode === 'adjust' && (
              <>
                <Separator />
                <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="p-4 space-y-4">
                    <Label className="font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Adjust Payment Split
                    </Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Paid Days</Label>
                        <Input
                          type="number"
                          min={0}
                          max={application.total_days}
                          value={adjustedPaidDays}
                          onChange={(e) => handleDaysChange(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">LOP Days</Label>
                        <Input
                          type="number"
                          value={adjustedLopDays}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>

                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Reason for adjustment..."
                      rows={2}
                    />
                  </CardContent>
                </Card>
              </>
            )}

            {/* Reject Mode */}
            {mode === 'reject' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="font-medium text-destructive">Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    className="border-destructive/50"
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'view' && application.status === 'pending' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={handleRejectClick}
                  disabled={isRejecting}
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  onClick={handleApproveClick}
                  disabled={isApproving}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </>
          )}

          {(mode === 'approve' || mode === 'adjust') && (
            <>
              <Button variant="outline" onClick={() => setMode('view')}>
                Back
              </Button>
              <Button 
                onClick={handleConfirmApprove}
                disabled={isApproving}
              >
                <Check className="h-4 w-4 mr-1" />
                {mode === 'adjust' ? 'Approve with Adjusted LOP' : 'Confirm Approval'}
              </Button>
            </>
          )}

          {mode === 'reject' && (
            <>
              <Button variant="outline" onClick={() => setMode('view')}>
                Back
              </Button>
              <Button 
                variant="destructive"
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectionReason.trim()}
              >
                <X className="h-4 w-4 mr-1" />
                Confirm Rejection
              </Button>
            </>
          )}

          {application.status !== 'pending' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
