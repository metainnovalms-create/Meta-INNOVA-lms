import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Search, Mail, Phone, Building2, Loader2, IndianRupee, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOfficers, useCreateOfficer, useDeleteOfficerCascade, type Officer } from '@/hooks/useOfficers';

export default function OfficerManagement() {
  const navigate = useNavigate();
  const { data: officers = [], isLoading } = useOfficers();
  const createOfficer = useCreateOfficer();
  const deleteOfficerCascade = useDeleteOfficerCascade();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [officerToDelete, setOfficerToDelete] = useState<Officer | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    employee_id: '',
    employment_type: 'full_time',
    annual_salary: '',
    join_date: new Date().toISOString().split('T')[0],
    // Payroll Configuration
    hourly_rate: '',
    overtime_rate_multiplier: '1.5',
  });

  const handleAddOfficer = async () => {
    // Validation
    if (!formData.full_name || !formData.email || !formData.password || !formData.annual_salary) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.employee_id) {
      toast.error("Employee ID is required");
      return;
    }

    try {
      await createOfficer.mutateAsync({
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        employee_id: formData.employee_id,
        employment_type: formData.employment_type,
        annual_salary: Number(formData.annual_salary),
        hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : undefined,
        overtime_rate_multiplier: Number(formData.overtime_rate_multiplier),
        join_date: formData.join_date || undefined,
      });

      setIsAddDialogOpen(false);
      
      // Reset form
      setFormData({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        employee_id: '',
        employment_type: 'full_time',
        annual_salary: '',
        join_date: new Date().toISOString().split('T')[0],
        hourly_rate: '',
        overtime_rate_multiplier: '1.5',
      });
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const filteredOfficers = officers.filter((officer) =>
    officer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    officer.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      on_leave: 'secondary',
      terminated: 'destructive',
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  const getEmploymentBadge = (type: string) => {
    return <Badge variant="outline">{type.replace('_', ' ')}</Badge>;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Officer Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage innovation officers and their institution assignments
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Officer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Officer</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Rajesh Kumar"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rajesh@metainnova.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div>
                      <Label htmlFor="employee_id">Employee ID *</Label>
                      <Input
                        id="employee_id"
                        value={formData.employee_id}
                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                        placeholder="EMP-001"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="join_date">Join Date</Label>
                      <Input
                        id="join_date"
                        type="date"
                        value={formData.join_date}
                        onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employment_type">Employment Type</Label>
                      <Select
                        value={formData.employment_type}
                        onValueChange={(value) => setFormData({ ...formData, employment_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full_time">Full Time</SelectItem>
                          <SelectItem value="part_time">Part Time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="annual_salary">Annual Salary (₹) *</Label>
                      <Input
                        id="annual_salary"
                        type="number"
                        value={formData.annual_salary}
                        onChange={(e) => setFormData({ ...formData, annual_salary: e.target.value })}
                        placeholder="600000"
                      />
                    </div>
                  </div>
                  
                  {/* Payroll Configuration Section */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      Payroll Configuration
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="hourly_rate">Overtime Hourly Charges (₹/hr)</Label>
                        <Input
                          id="hourly_rate"
                          type="number"
                          value={formData.hourly_rate}
                          onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                          placeholder="500"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Rate per overtime hour</p>
                      </div>
                      <div>
                        <Label htmlFor="overtime_multiplier">Overtime Rate Multiplier</Label>
                        <Input
                          id="overtime_multiplier"
                          type="number"
                          step="0.1"
                          value={formData.overtime_rate_multiplier}
                          onChange={(e) => setFormData({ ...formData, overtime_rate_multiplier: e.target.value })}
                          placeholder="1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1">e.g., 1.5 = 1.5x hourly rate</p>
                      </div>
                    </div>
                  </div>

                  
                  <Button 
                    onClick={handleAddOfficer} 
                    className="w-full"
                    disabled={createOfficer.isPending}
                  >
                    {createOfficer.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Officer...
                      </>
                    ) : (
                      'Add Officer'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Officers ({filteredOfficers.length})</CardTitle>
              <CardDescription>Search and manage innovation officers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or employee ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredOfficers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'No officers match your search' : 'No officers yet. Add your first officer above.'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Employment</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOfficers.map((officer) => (
                      <TableRow 
                        key={officer.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/system-admin/officers/${officer.id}`)}
                      >
                        <TableCell className="font-mono text-sm">
                          {officer.employee_id || '-'}
                        </TableCell>
                        <TableCell className="font-medium">{officer.full_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {officer.email}
                            </div>
                            {officer.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {officer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getEmploymentBadge(officer.employment_type)}
                            <span className="text-sm text-muted-foreground">
                              ₹{officer.annual_salary.toLocaleString('en-IN')}/yr
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span className="text-sm">
                              {officer.assigned_institutions?.length || 0} schools
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(officer.status)}</TableCell>
                        <TableCell>
                          {officer.join_date 
                            ? new Date(officer.join_date).toLocaleDateString('en-IN')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOfficerToDelete(officer);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Officer</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete <strong>{officerToDelete?.full_name}</strong>?</p>
              <p className="text-sm">This will permanently remove:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>All institution assignments</li>
                <li>All uploaded documents</li>
                <li>All attendance records</li>
                <li>All class access grants</li>
              </ul>
              <p className="text-destructive font-medium">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (officerToDelete) {
                  deleteOfficerCascade.mutate(officerToDelete.id);
                }
                setDeleteDialogOpen(false);
                setOfficerToDelete(null);
              }}
            >
              {deleteOfficerCascade.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Officer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
