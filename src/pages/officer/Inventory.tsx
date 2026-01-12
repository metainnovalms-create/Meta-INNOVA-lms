import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, ShoppingCart, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useOfficerByUserId } from '@/hooks/useOfficerProfile';
import { 
  useInventoryItems, 
  usePurchaseRequests, 
  useInventoryIssues, 
  useCreatePurchaseRequest,
  useReportInventoryIssue
} from '@/hooks/useInventory';
import { PurchaseRequest, InventoryIssue, PurchaseRequestItem } from '@/types/inventory';
import { format } from 'date-fns';

const getStatusBadge = (status: string) => {
  const variants: Record<string, { className: string; label: string }> = {
    pending_institution: { className: 'bg-yellow-500/10 text-yellow-500', label: 'Pending Institution' },
    approved_institution: { className: 'bg-blue-500/10 text-blue-500', label: 'Pending CEO' },
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

export default function Inventory() {
  const { user } = useAuth();
  const institutionId = user?.institution_id || '';
  
  // Get the actual officer record ID (not auth user id)
  const { data: officer } = useOfficerByUserId(user?.id || '');
  const officerId = officer?.id || ''; // This is the officers table ID needed for RLS
  
  const { data: inventory = [], isLoading: inventoryLoading } = useInventoryItems(institutionId);
  const { data: allRequests = [], isLoading: requestsLoading } = usePurchaseRequests(institutionId);
  const { data: allIssues = [], isLoading: issuesLoading } = useInventoryIssues(institutionId);
  
  const createRequest = useCreatePurchaseRequest();
  const reportIssue = useReportInventoryIssue();
  
  // Filter to only show officer's own requests and issues
  const myRequests = allRequests.filter(r => r.officer_id === officerId);
  const myIssues = allIssues.filter(i => i.reported_by === officerId);
  
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  
  // Purchase request form
  const [requestItems, setRequestItems] = useState<PurchaseRequestItem[]>([{ name: '', description: '', quantity: 1, estimated_unit_price: 0, estimated_total: 0 }]);
  const [requestJustification, setRequestJustification] = useState('');
  const [requestPriority, setRequestPriority] = useState<'low' | 'normal' | 'urgent'>('normal');
  
  // Issue report form
  const [issueItemName, setIssueItemName] = useState('');
  const [issueType, setIssueType] = useState<'damaged' | 'missing' | 'malfunction' | 'other'>('damaged');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueQuantity, setIssueQuantity] = useState(1);
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const totalValue = inventory.reduce((sum, item) => sum + (item.total_value || 0), 0);
  const totalUnits = inventory.reduce((sum, item) => sum + (item.units || 0), 0);

  const pendingRequests = myRequests.filter(r => r.status === 'pending_institution' || r.status === 'pending_ceo' || r.status === 'approved_institution');

  const updateRequestItem = (index: number, field: keyof PurchaseRequestItem, value: any) => {
    const updated = [...requestItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'estimated_unit_price') {
      updated[index].estimated_total = updated[index].quantity * updated[index].estimated_unit_price;
    }
    setRequestItems(updated);
  };

  const addRequestItem = () => {
    setRequestItems([...requestItems, { name: '', description: '', quantity: 1, estimated_unit_price: 0, estimated_total: 0 }]);
  };

  const removeRequestItem = (index: number) => {
    if (requestItems.length > 1) {
      setRequestItems(requestItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmitRequest = () => {
    const validItems = requestItems.filter(item => item.name.trim());
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    createRequest.mutate({
      requestData: {
        institution_id: institutionId,
        items: validItems,
        justification: requestJustification || undefined,
        priority: requestPriority,
      },
      officerId: officerId,
      requesterName: user?.name || 'Officer',
    }, {
      onSuccess: () => {
        toast.success('Purchase request submitted');
        setRequestDialogOpen(false);
        setRequestItems([{ name: '', description: '', quantity: 1, estimated_unit_price: 0, estimated_total: 0 }]);
        setRequestJustification('');
        setRequestPriority('normal');
      },
    });
  };

  const handleSubmitIssue = () => {
    if (!issueItemName.trim() || !issueDescription.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    reportIssue.mutate({
      issueData: {
        institution_id: institutionId,
        item_name: issueItemName,
        issue_type: issueType,
        description: issueDescription,
        quantity_affected: issueQuantity,
        severity: issueSeverity,
      },
      reporterId: officerId,
      reporterName: user?.name || 'Officer',
    }, {
      onSuccess: () => {
        toast.success('Issue reported successfully');
        setIssueDialogOpen(false);
        setIssueItemName('');
        setIssueType('damaged');
        setIssueDescription('');
        setIssueQuantity(1);
        setIssueSeverity('medium');
      },
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Lab Inventory</h1>
            <p className="text-muted-foreground">View inventory and manage requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIssueDialogOpen(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
            <Button onClick={() => setRequestDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Request Purchase
            </Button>
          </div>
        </div>

        <Tabs defaultValue="inventory" className="w-full">
          <TabsList>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="requests">
              My Requests
              {pendingRequests.length > 0 && (
                <Badge className="ml-2" variant="secondary">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="issues">
              My Issues
              {myIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {myIssues.filter(i => i.status !== 'resolved' && i.status !== 'closed').length}
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
                  <div className="text-2xl font-bold">{totalUnits}</div>
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

          {/* My Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {requestsLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading requests...</p>
                </CardContent>
              </Card>
            ) : myRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No purchase requests yet</p>
                  <Button className="mt-4" onClick={() => setRequestDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Request
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => {
                  const statusInfo = getStatusBadge(request.status);
                  return (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{request.request_code}</h3>
                              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                              {request.priority === 'urgent' && (
                                <Badge variant="destructive" className="text-xs">URGENT</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {request.items.map((item, idx) => (
                                <Badge key={idx} variant="outline">
                                  {item.name} ({item.quantity})
                                </Badge>
                              ))}
                            </div>
                            {request.justification && (
                              <p className="text-sm text-muted-foreground mt-2">{request.justification}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(request.created_at), 'MMM dd, yyyy • hh:mm a')}
                            </p>
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
          </TabsContent>

          {/* My Issues Tab */}
          <TabsContent value="issues" className="space-y-6">
            {issuesLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading issues...</p>
                </CardContent>
              </Card>
            ) : myIssues.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No issues reported</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myIssues.map((issue) => {
                  const statusInfo = getIssueStatusBadge(issue.status);
                  return (
                    <Card key={issue.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{issue.issue_code}</h3>
                              <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                              <Badge variant="outline">{issue.issue_type}</Badge>
                            </div>
                            <p className="font-medium">{issue.item_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(issue.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          {issue.resolution_notes && (
                            <div className="text-right max-w-[200px]">
                              <p className="text-xs text-muted-foreground">Resolution:</p>
                              <p className="text-sm">{issue.resolution_notes}</p>
                            </div>
                          )}
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

      {/* Create Purchase Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Request</DialogTitle>
            <DialogDescription>Request new items for the lab</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Items</Label>
              {/* Column headers */}
              <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium">
                <div className="col-span-4">Item Name</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-3">Unit Price (₹)</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
              {requestItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateRequestItem(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateRequestItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      placeholder="Unit price"
                      value={item.estimated_unit_price}
                      onChange={(e) => updateRequestItem(index, 'estimated_unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium">₹{item.estimated_total.toLocaleString()}</span>
                  </div>
                  <div className="col-span-1">
                    {requestItems.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeRequestItem(index)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addRequestItem}>
                <Plus className="h-4 w-4 mr-1" /> Add Item
              </Button>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={requestPriority} onValueChange={(v) => setRequestPriority(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Justification</Label>
              <Textarea
                placeholder="Why do you need these items?"
                value={requestJustification}
                onChange={(e) => setRequestJustification(e.target.value)}
              />
            </div>

            <div className="text-right font-bold">
              Total: ₹{requestItems.reduce((sum, item) => sum + item.estimated_total, 0).toLocaleString()}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest} disabled={createRequest.isPending}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
            <DialogDescription>Report damaged, missing, or malfunctioning equipment</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input
                placeholder="Name of the item"
                value={issueItemName}
                onChange={(e) => setIssueItemName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Type</Label>
                <Select value={issueType} onValueChange={(v) => setIssueType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                    <SelectItem value="malfunction">Malfunction</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity</Label>
                <Select value={issueSeverity} onValueChange={(v) => setIssueSeverity(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Quantity Affected</Label>
              <Input
                type="number"
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitIssue} disabled={reportIssue.isPending}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
