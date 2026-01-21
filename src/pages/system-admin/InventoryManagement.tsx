import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Package, AlertTriangle, CheckCircle, TrendingUp, Search, Plus, Edit, Trash2, XCircle, Settings, UserPlus, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useInventoryItems, 
  usePurchaseRequests, 
  useInventoryIssues, 
  useAddInventoryItem, 
  useUpdateInventoryItem, 
  useDeleteInventoryItem,
  useBulkDeleteInventoryItems,
  useApprovePurchaseRequest,
  useRejectPurchaseRequest,
  useApprovalChain,
  useAssignApprover,
  useRemoveApprover
} from '@/hooks/useInventory';
import { InventoryItem, PurchaseRequest, InventoryIssue } from '@/types/inventory';
import { format } from 'date-fns';
import { BulkImportInventoryDialog } from '@/components/inventory/BulkImportInventoryDialog';

const getStatusBadge = (status: string) => {
  const variants: Record<string, { className: string; label: string }> = {
    pending_institution: { className: 'bg-yellow-500/10 text-yellow-500', label: 'Pending Institution' },
    approved_institution: { className: 'bg-blue-500/10 text-blue-500', label: 'Pending CEO' },
    pending_ceo: { className: 'bg-purple-500/10 text-purple-500', label: 'Pending CEO' },
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

export default function InventoryManagement() {
  const { user } = useAuth();
  const { institutions = [] } = useInstitutions();
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get inventory data for selected institution
  const { data: inventory = [], isLoading: inventoryLoading } = useInventoryItems(selectedInstitution);
  const { data: requests = [], isLoading: requestsLoading } = usePurchaseRequests(selectedInstitution || undefined);
  const { data: issues = [], isLoading: issuesLoading } = useInventoryIssues(selectedInstitution || undefined);
  const { data: approvalChain = [], isLoading: approvalChainLoading } = useApprovalChain(selectedInstitution || undefined);
  
  const addItem = useAddInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const deleteItem = useDeleteInventoryItem();
  const bulkDeleteItems = useBulkDeleteInventoryItems();
  const approveRequest = useApprovePurchaseRequest();
  const rejectRequest = useRejectPurchaseRequest();
  const assignApprover = useAssignApprover();
  const removeApprover = useRemoveApprover();
  
  // Selection state for bulk delete
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [actionRequest, setActionRequest] = useState<PurchaseRequest | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [comments, setComments] = useState('');
  
  // Form state for add/edit
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit_price: 0,
    units: 1,
    category: 'general',
  });

  // Stats
  const totalValue = inventory.reduce((sum, item) => sum + (item.total_value || 0), 0);
  const totalItems = inventory.reduce((sum, item) => sum + (item.units || 0), 0);
  const pendingRequests = requests.filter(r => r.status === 'pending_ceo' || r.status === 'approved_institution');
  const waitingForManagement = requests.filter(r => r.status === 'pending_institution');
  const openIssues = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed');

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    if (!selectedInstitution) {
      toast.error('Please select an institution first');
      return;
    }
    if (!formData.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    addItem.mutate({
      institutionId: selectedInstitution,
      itemData: {
        name: formData.name,
        description: formData.description || undefined,
        unit_price: formData.unit_price,
        units: formData.units,
        category: formData.category,
      },
      userId: user?.id || '',
    }, {
      onSuccess: () => {
        toast.success('Item added successfully');
        setAddDialogOpen(false);
        setFormData({ name: '', description: '', unit_price: 0, units: 1, category: 'general' });
      },
    });
  };

  const handleEditItem = () => {
    if (!editItem) return;
    
    updateItem.mutate({
      itemId: editItem.id,
      itemData: {
        name: formData.name,
        description: formData.description || undefined,
        unit_price: formData.unit_price,
        units: formData.units,
        category: formData.category,
      },
    }, {
      onSuccess: () => {
        toast.success('Item updated successfully');
        setEditDialogOpen(false);
        setEditItem(null);
        setFormData({ name: '', description: '', unit_price: 0, units: 1, category: 'general' });
      },
    });
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (confirm(`Delete "${item.name}"?`)) {
      deleteItem.mutate(item.id, {
        onSuccess: () => toast.success('Item deleted'),
      });
    }
  };

  // Bulk selection handlers
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === filteredInventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredInventory.map(item => item.id)));
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteItems.mutate(Array.from(selectedItems), {
      onSuccess: () => {
        setSelectedItems(new Set());
        setBulkDeleteDialogOpen(false);
      },
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      unit_price: item.unit_price,
      units: item.units,
      category: item.category || 'general',
    });
    setEditDialogOpen(true);
  };

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
        approverType: 'ceo',
        comments: comments || undefined,
      }, {
        onSuccess: () => {
          toast.success(`Request ${actionRequest.request_code} approved`);
          setApproveDialogOpen(false);
          setActionRequest(null);
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
        },
      });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">Manage institution inventory and purchase requests</p>
          </div>
          <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select Institution" />
            </SelectTrigger>
            <SelectContent>
              {institutions.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedInstitution ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Select an institution to view and manage inventory</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="requests">
                Purchase Requests
                {pendingRequests.length > 0 && (
                  <Badge className="ml-2" variant="secondary">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="issues">
                Issues
                {openIssues.length > 0 && (
                  <Badge className="ml-2" variant="destructive">{openIssues.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approval-settings">Approval Settings</TabsTrigger>
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

              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search items..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-8" 
                  />
                </div>
                {selectedItems.size > 0 && (
                  <Button variant="destructive" onClick={handleBulkDelete} disabled={bulkDeleteItems.isPending}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete ({selectedItems.size})
                  </Button>
                )}
                <Button variant="outline" onClick={() => setBulkImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {inventoryLoading ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">Loading inventory...</p>
                  </CardContent>
                </Card>
              ) : filteredInventory.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No inventory items found</p>
                    <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Item
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedItems.size === filteredInventory.length && filteredInventory.length > 0}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all items"
                          />
                        </TableHead>
                        <TableHead>Sl.No</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => (
                        <TableRow key={item.id} className={selectedItems.has(item.id) ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItemSelection(item.id)}
                              aria-label={`Select ${item.name}`}
                            />
                          </TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                    <h3 className="text-lg font-semibold">Pending Final Approval ({pendingRequests.length})</h3>
                  </div>

                  {pendingRequests.map((request) => {
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
                              <p className="text-sm text-muted-foreground">
                                {request.institution_name} • {request.requester_name}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {request.items.map((item, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {item.name} ({item.quantity})
                                  </Badge>
                                ))}
                              </div>
                              {request.institution_comments && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Institution: {request.institution_comments}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">₹{request.total_estimated_cost.toLocaleString()}</p>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => handleApprove(request)}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleReject(request)}>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {waitingForManagement.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Waiting for Management Approval ({waitingForManagement.length})</h3>
                  </div>

                  {waitingForManagement.map((request) => {
                    const statusInfo = getStatusBadge(request.status);
                    return (
                      <Card key={request.id} className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{request.request_code}</h3>
                                <Badge className="bg-blue-500/10 text-blue-500">Waiting for Management</Badge>
                                {request.priority === 'urgent' && (
                                  <Badge variant="destructive" className="text-xs">URGENT</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {request.institution_name} • {request.requester_name}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {request.items.map((item, idx) => (
                                  <Badge key={idx} variant="outline">
                                    {item.name} ({item.quantity})
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-3">
                                This request is pending approval from institution management before it reaches you.
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">₹{request.total_estimated_cost.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(request.created_at), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {requests.filter(r => r.status === 'approved' || r.status === 'rejected').length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Processed Requests</h3>
                  {requests.filter(r => r.status === 'approved' || r.status === 'rejected').map((request) => {
                    const statusInfo = getStatusBadge(request.status);
                    return (
                      <Card key={request.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{request.request_code}</h3>
                                <Badge className={statusInfo.className}>{statusInfo.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {request.institution_name} • {request.requester_name}
                              </p>
                            </div>
                            <p className="font-bold">₹{request.total_estimated_cost.toLocaleString()}</p>
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
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No purchase requests</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Issues Tab */}
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
                    <p className="text-muted-foreground">No issues reported</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {issues.map((issue) => {
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
                                <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'}>
                                  {issue.severity}
                                </Badge>
                              </div>
                              <p className="font-medium">{issue.item_name}</p>
                              <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {issue.institution_name} • Reported by: {issue.reporter_name} • {format(new Date(issue.created_at), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Approval Settings Tab */}
            <TabsContent value="approval-settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Purchase Request Approval Chain
                  </CardTitle>
                  <CardDescription>
                    Configure the approval workflow for purchase requests. Requests go through two levels:
                    Institution Management → CEO/System Admin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Approval Flow Diagram */}
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <span className="text-yellow-500 font-bold">1</span>
                      </div>
                      <span className="text-xs mt-1 text-center">Officer<br/>Submits</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-muted-foreground/30" />
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-500 font-bold">2</span>
                      </div>
                      <span className="text-xs mt-1 text-center">Institution<br/>Management</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-muted-foreground/30" />
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-500 font-bold">3</span>
                      </div>
                      <span className="text-xs mt-1 text-center">CEO/System<br/>Admin</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-muted-foreground/30" />
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-xs mt-1 text-center">Approved</span>
                    </div>
                  </div>

                  {/* Current Approvers for Selected Institution */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">Configured Approvers</h4>
                    {approvalChainLoading ? (
                      <p className="text-muted-foreground text-sm">Loading approval chain...</p>
                    ) : approvalChain.length === 0 ? (
                      <div className="text-center py-6 border border-dashed rounded-lg">
                        <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">
                          No specific approvers configured for this institution.<br/>
                          Using default workflow: Institution Management → CEO.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Approver</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvalChain.map((chain) => (
                            <TableRow key={chain.id}>
                              <TableCell className="font-medium">{chain.approver_name || 'Unknown'}</TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {chain.approver_type === 'ceo' ? 'CEO' : 'Position-based'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{chain.approver_email || '-'}</TableCell>
                              <TableCell>
                                <Badge className={chain.is_active ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'}>
                                  {chain.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeApprover.mutate(chain.id)}
                                  disabled={removeApprover.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <h4 className="font-medium text-blue-500 mb-2">How Approval Works</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>Level 1 - Institution:</strong> Management role users from the same institution can approve.</li>
                      <li>• <strong>Level 2 - CEO:</strong> System Admin or users marked as CEO can give final approval.</li>
                      <li>• Requests can be rejected at any level with a reason.</li>
                      <li>• Officers are notified when their requests are approved or rejected.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>Add a new item to the inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Item description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Units</Label>
                <Input
                  type="number"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="text-right font-bold">
              Total Value: ₹{(formData.unit_price * formData.units).toLocaleString()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} disabled={addItem.isPending}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Unit Price (₹)</Label>
                <Input
                  type="number"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Units</Label>
                <Input
                  type="number"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="text-right font-bold">
              Total Value: ₹{(formData.unit_price * formData.units).toLocaleString()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditItem} disabled={updateItem.isPending}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Approve {actionRequest?.request_code}?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmApprove} disabled={approveRequest.isPending}>Approve</Button>
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

      {/* Bulk Import Dialog */}
      <BulkImportInventoryDialog
        open={bulkImportDialogOpen}
        onOpenChange={setBulkImportDialogOpen}
        institutionId={selectedInstitution}
        userId={user?.id || ''}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedItems.size} item(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the selected items as disposed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={bulkDeleteItems.isPending}
            >
              {bulkDeleteItems.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
