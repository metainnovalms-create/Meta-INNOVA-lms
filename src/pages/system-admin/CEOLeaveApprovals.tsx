import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { LeaveApplication } from '@/types/leave';
import { leaveApplicationService } from '@/services/leave.service';
import { EnhancedLeaveApprovalDialog } from '@/components/leave/EnhancedLeaveApprovalDialog';
import { supabase } from '@/integrations/supabase/client';

export default function CEOLeaveApprovals() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const apps = await leaveApplicationService.getCEOPendingApplications();
      setApplications(apps);
    } catch (error) {
      console.error('Failed to load applications:', error);
      toast.error('Failed to load pending applications');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (application: LeaveApplication) => {
    setSelectedApplication(application);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedApplication(null);
    setDialogOpen(false);
  };

  const handleApprove = async (comments: string, adjustedPaidDays?: number, adjustedLopDays?: number) => {
    if (!selectedApplication || !user) return;

    setIsProcessing(true);
    try {
      if (adjustedPaidDays !== undefined && adjustedLopDays !== undefined) {
        // Approve with adjusted LOP
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) throw new Error('Not authenticated');
        
        const { data: profile } = await supabase.from('profiles').select('name').eq('id', authUser.id).single();
        const { data: app } = await supabase.from('leave_applications').select('*').eq('id', selectedApplication.id).single();
        
        if (!app) throw new Error('Application not found');
        
        const approvalChain = Array.isArray(app.approval_chain) ? app.approval_chain : [];
        const currentLevel = app.current_approval_level || 1;
        
        const updatedChain = approvalChain.map((a: any) => {
          if (a.order === currentLevel) {
            return { 
              ...a, 
              status: 'approved', 
              approved_by: authUser.id, 
              approved_by_name: profile?.name || 'Unknown', 
              approved_at: new Date().toISOString(), 
              comments: adjustedLopDays > 0 ? `Approved with LOP: ${adjustedLopDays} day(s). ${comments}` : comments
            };
          }
          return a;
        });
        
        const nextLevel = approvalChain.find((a: any) => a.order === currentLevel + 1);
        const isFinalApproval = !nextLevel;
        
        const updateData: Record<string, unknown> = {
          approval_chain: JSON.parse(JSON.stringify(updatedChain)),
          current_approval_level: isFinalApproval ? currentLevel : currentLevel + 1,
          is_lop: adjustedLopDays > 0,
          lop_days: adjustedLopDays,
          paid_days: adjustedPaidDays
        };
        
        if (isFinalApproval) {
          updateData.status = 'approved';
          updateData.final_approved_by = authUser.id;
          updateData.final_approved_by_name = profile?.name;
          updateData.final_approved_at = new Date().toISOString();
        }
        
        const { error } = await supabase.from('leave_applications').update(updateData).eq('id', selectedApplication.id);
        if (error) throw error;
        
        if (isFinalApproval) {
          await supabase.rpc('apply_leave_application_to_balance', {
            p_application_id: selectedApplication.id
          });
        }
        
        toast.success('Leave application approved with adjusted LOP');
      } else {
        await leaveApplicationService.approveApplication(selectedApplication.id, comments || undefined);
        toast.success('Leave application approved');
      }
      
      loadApplications();
      handleCloseDialog();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Failed to approve leave application');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedApplication || !user) return;

    setIsProcessing(true);
    try {
      await leaveApplicationService.rejectApplication(selectedApplication.id, reason);
      toast.success('Leave application rejected');
      loadApplications();
      handleCloseDialog();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject leave application');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get previous approval info from the approval chain
  const getPreviousApprovalInfo = (app: LeaveApplication) => {
    const approved = app.approval_chain.filter(a => a.status === 'approved');
    return approved.length > 0 ? approved[approved.length - 1] : null;
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CEO Leave Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Final approval for leave applications
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Leave Applications</CardTitle>
            <CardDescription>
              Leave applications awaiting your final approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending leave applications</p>
                  </div>
                ) : (
                  applications.map((app) => {
                    const prevApproval = getPreviousApprovalInfo(app);
                    return (
                      <div
                        key={app.id}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{app.applicant_name}</span>
                              {app.position_name && (
                                <Badge variant="secondary" className="uppercase">
                                  {app.position_name}
                                </Badge>
                              )}
                              <Badge variant="outline" className="capitalize">
                                {app.leave_type}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(app.start_date), 'dd MMM yyyy')} - {format(new Date(app.end_date), 'dd MMM yyyy')}
                              </span>
                              <span>({app.total_days} {app.total_days === 1 ? 'day' : 'days'})</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-green-600 font-medium">{app.paid_days || 0} Paid</span>
                              {(app.lop_days || 0) > 0 && (
                                <span className="text-orange-600 font-medium">/ {app.lop_days} LOP</span>
                              )}
                            </div>
                            {prevApproval && (
                              <div className="bg-green-50 dark:bg-green-950/30 p-2 rounded text-sm">
                                <p className="text-xs text-muted-foreground">Previous Approval:</p>
                                <p className="font-medium">{prevApproval.approved_by_name} ({prevApproval.position_name})</p>
                                {prevApproval.comments && (
                                  <p className="text-xs mt-1">{prevApproval.comments}</p>
                                )}
                              </div>
                            )}
                            {app.applied_at && (
                              <p className="text-xs text-muted-foreground">
                                Applied: {format(new Date(app.applied_at), 'dd MMM yyyy, hh:mm a')}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleViewDetails(app)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <EnhancedLeaveApprovalDialog
          open={dialogOpen}
          onOpenChange={(open) => !open && handleCloseDialog()}
          application={selectedApplication}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={isProcessing}
          isRejecting={isProcessing}
        />
      </div>
    </Layout>
  );
}
