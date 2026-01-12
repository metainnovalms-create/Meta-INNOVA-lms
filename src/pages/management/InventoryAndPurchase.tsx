import { useState, useEffect } from 'react';
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Package, ShoppingCart, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useInventoryItems, usePurchaseRequests, useInventoryIssues, useApprovePurchaseRequest, useRejectPurchaseRequest } from "@/hooks/useInventory";
import { PurchaseRequest, InventoryIssue } from "@/types/inventory";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const getStatusBadge = (status: string) => {
  const variants: Record<string, { className: string; label: string }> = {
    pending_institution: { className: 'bg-yellow-500/10 text-yellow-500', label: 'Pending Review' },
    approved_institution: { className: 'bg-blue-500/10 text-blue-500', label: 'Approved - Pending CEO' },
    pending_ceo: { className: 'bg-blue-500/10 text-blue-500', label: 'Pending CEO' },
    approved: { className: 'bg-green-500/10 text-green-500', label: 'Approved' },
    rejected: { className: 'bg-red-500/10 text-red-500', label: 'Rejected' },
    cancelled: { className: 'bg-gray-500/10 text-gray-500', label: 'Cancelled' },
  };
  return variants[status] || { className: 'bg-gray-500/10 text-gray-500', label: status };
};

const getIssueStatusBadge = (status: string) => {
  const variants: Record<string, { className: string; label: string }> = {
    reported: { className: 'bg-yellow-500/10 text-yellow-500', label: 'Reported' },
    acknowledged: { className: 'bg-blue-500/10 text-blue-500', label: 'Acknowledged' },
    in_progress: { className: 'bg-purple-500/10 text-purple-500', label: 'In Progress' },
    resolved: { className: 'bg-green-500/10 text-green-500', label: 'Resolved' },
    closed: { className: 'bg-gray-500/10 text-gray-500', label: 'Closed' },
  };
  return variants[status] || { className: 'bg-gray-500/10 text-gray-500', label: status };
};

const getSeverityBadge = (severity: string) => {
  const variants: Record<string, { className: string }> = {
    low: { className: 'bg-gray-500/10 text-gray-500' },
    medium: { className: 'bg-yellow-500/10 text-yellow-500' },
    high: { className: 'bg-orange-500/10 text-orange-500' },
    critical: { className: 'bg-red-500/10 text-red-500' },
  };
  return variants[severity] || { className: 'bg-gray-500/10 text-gray-500' };
};

export default function InventoryAndPurchase() {
  const { user } = useAuth();
  const institutionId = user?.institution_id || user?.tenant_id || '';
  
  const { data: inventory = [], isLoading: inventoryLoading } = useInventoryItems(institutionId);
  const { data: requests = [], isLoading: requestsLoading } = usePurchaseRequests(institutionId);
  const { data: issues = [], isLoading: issuesLoading } = useInventoryIssues(institutionId);
  
  const approveRequest = useApprovePurchaseRequest();
  const rejectRequest = useRejectPurchaseRequest();
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<PurchaseRequest | null>(null);
  const [comments, setComments] = useState('');
  
  // Fetch institution details
  const [institutionData, setInstitutionData] = useState<any>(null);
  const [studentCount, setStudentCount] = useState(0);
  
  useEffect(() => {
    const fetchInstitutionData = async () => {
      if (!institutionId) return;
      
      const { data: inst } = await supabase
        .from('institutions')
        .select('name, address, settings')
        .eq('id', institutionId)
        .single();
      
      if (inst) setInstitutionData(inst);
      
      const { count } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('institution_id', institutionId);
      
      setStudentCount(count || 0);
    };
    
    fetchInstitutionData();
  }, [institutionId]);

  const totalValue = inventory.reduce((sum, item) => sum + (item.total_value || 0), 0);
  const totalItems = inventory.reduce((sum, item) => sum + (item.units || 0), 0);

  const pendingRequests = requests.filter(r => r.status === 'pending_institution');
  const processedRequests = requests.filter(r => r.status !== 'pending_institution');

  const handleApprove = (request: PurchaseRequest) => {
    setActionRequest(request);
    setComments('');
    setApproveDialogOpen(true);
  };

  const handleReject = (request: PurchaseRequest) => {
    setActionRequest(request);
    setComments('');
    setRejectDialogOpen(true);
  };

  const confirmApprove = () => {
    if (actionRequest && user?.id) {
      approveRequest.mutate({
        requestId: actionRequest.id,
        approverId: user.id,
        approverType: 'institution',
        comments: comments || undefined,
      }, {
        onSuccess: () => {
          toast.success(`Request ${actionRequest.request_code} approved`);
          setApproveDialogOpen(false);
          setActionRequest(null);
          setComments('');
        },
      });
    }
  };

  const confirmReject = () => {
    if (actionRequest && comments.trim() && user?.id) {
      rejectRequest.mutate({
        requestId: actionRequest.id,
        rejectorId: user.id,
        reason: comments,
      }, {
        onSuccess: () => {
          toast.error(`Request ${actionRequest.request_code} rejected`);
          setRejectDialogOpen(false);
          setActionRequest(null);
          setComments('');
        },
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <InstitutionHeader 
          institutionName={institutionData?.name || 'Loading...'}
          establishedYear={(institutionData?.settings as any)?.established_year || new Date().getFullYear().toString()}
          location={`${(institutionData?.address as any)?.city || ''}, ${(institutionData?.address as any)?.state || ''}`}
          totalStudents={studentCount}
          academicYear="2024-25"
        />
        
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="requests">
              Purchase Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2" variant="secondary">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="issues">
              Issue Reports
              {issues.filter(i => i.status === 'reported').length > 0 && (
                <Badge className="ml-2" variant="destructive">
                  {issues.filter(i => i.status === 'reported').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{inventory.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalItems}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {inventory.filter(i => i.status === 'active').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalValue.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            {inventoryLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading inventory...</p>
                </CardContent>
              </Card>
            ) : inventory.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No inventory items found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sl.No</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.sl_no}</TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{item.description || '-'}</TableCell>
                        <TableCell className="text-right">₹{item.unit_price.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{item.units}</TableCell>
                        <TableCell className="text-right">₹{item.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={item.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Purchase Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {pendingRequests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold">Pending Your Approval ({pendingRequests.length})</h3>
                </div>

                {pendingRequests.map((request) => {
                  const statusInfo = getStatusBadge(request.status);
                  return (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{request.request_code}</h3>
                                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                                {request.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">URGENT</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">By: {request.requester_name}</p>
                              
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Items Requested:</p>
                                <div className="flex flex-wrap gap-2">
                                  {request.items.map((item, idx) => (
                                    <Badge key={idx} variant="outline">
                                      {item.name} ({item.quantity})
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {request.justification && (
                                <div className="mt-3 p-3 bg-muted rounded-lg">
                                  <p className="text-sm font-medium mb-1">Justification:</p>
                                  <p className="text-sm text-muted-foreground">{request.justification}</p>
                                </div>
                              )}

                              <p className="text-xs text-muted-foreground mt-3">
                                Requested {format(new Date(request.created_at), 'MMM dd, yyyy • hh:mm a')}
                              </p>
                            </div>

                            <div className="text-right ml-4">
                              <p className="text-sm text-muted-foreground mb-1">Total Cost</p>
                              <p className="text-2xl font-bold">₹{request.total_estimated_cost.toLocaleString()}</p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2 border-t">
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleApprove(request)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(request)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {processedRequests.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-semibold">Processed Requests ({processedRequests.length})</h3>
                </div>

                {processedRequests.map((request) => {
                  const statusInfo = getStatusBadge(request.status);
                  return (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{request.request_code}</h3>
                              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">By: {request.requester_name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {request.items.map((item, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {item.name} ({item.quantity})
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">₹{request.total_estimated_cost.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {requests.length === 0 && !requestsLoading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No purchase requests found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Issue Reports Tab */}
          <TabsContent value="issues" className="space-y-6">
            {issuesLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading issues...</p>
                </CardContent>
              </Card>
            ) : issues.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No issue reports found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {issues.map((issue) => {
                  const statusInfo = getIssueStatusBadge(issue.status);
                  const severityInfo = getSeverityBadge(issue.severity);
                  return (
                    <Card key={issue.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{issue.issue_code}</h3>
                              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                              <Badge className={severityInfo.className}>{issue.severity}</Badge>
                            </div>
                            <p className="font-medium">{issue.item_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                            <div className="mt-2 text-xs text-muted-foreground">
                              <span>Reported by: {issue.reporter_name}</span>
                              <span className="mx-2">•</span>
                              <span>{format(new Date(issue.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{issue.issue_type}</Badge>
                            {issue.quantity_affected > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Qty: {issue.quantity_affected}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Approve {actionRequest?.request_code}? This will forward to CEO for final approval.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmApprove} disabled={approveRequest.isPending}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {actionRequest?.request_code}.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Rejection reason (required)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmReject}
              disabled={!comments.trim() || rejectRequest.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
