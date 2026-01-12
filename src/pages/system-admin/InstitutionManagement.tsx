import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstitutions, InstitutionFormData } from '@/hooks/useInstitutions';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, Building2, Upload, Calendar, FileText, AlertCircle, CheckCircle, Clock, DollarSign, Users, Shield, TrendingUp, Lock, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ViewMouDialog from '@/components/institution/ViewMouDialog';
import { PinLockDialog } from '@/components/system-admin/PinLockDialog';
import { EngagementDashboard } from '@/components/institution/EngagementDashboard';
import { AtRiskInstitutions } from '@/components/institution/AtRiskInstitutions';
import { InstitutionComparisonTable } from '@/components/institution/InstitutionComparisonTable';
import { InstitutionEditDialog } from '@/components/institution/InstitutionEditDialog';

// Define Institution type locally (previously from context)
interface Institution {
  id: string;
  name: string;
  slug: string;
  code: string;
  type: 'university' | 'college' | 'school' | 'institute';
  location: string;
  subscription_status: 'active' | 'inactive' | 'suspended';
  license_type: 'basic' | 'standard' | 'premium' | 'enterprise';
  license_expiry: string;
  max_users: number;
  current_users: number;
  contract_expiry_date: string;
  contract_value: number;
  [key: string]: any;
}

export default function InstitutionManagement() {
  const navigate = useNavigate();
  const { 
    institutions, 
    isLoading, 
    createInstitution, 
    updateInstitution,
    deleteInstitution,
    isCreating,
    isDeleting
  } = useInstitutions();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [licenseFilter, setLicenseFilter] = useState<string>('all');
  const [contractStatusFilter, setContractStatusFilter] = useState<string>('all');
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [isMouDialogOpen, setIsMouDialogOpen] = useState(false);
  const [selectedInstitutionForMou, setSelectedInstitutionForMou] = useState<Institution | null>(null);
  
  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  
  // PIN protection state
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [requestedTab, setRequestedTab] = useState<string>('');

  // Password visibility toggle
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Add institution form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'school' as Institution['type'],
    location: '',
    established_year: new Date().getFullYear(),
    contact_email: '',
    contact_phone: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    license_type: 'basic' as Institution['license_type'],
    max_users: 500,
    subscription_plan: 'basic' as Institution['subscription_plan'],
    student_id_prefix: '',
    student_id_suffix: '',
    pricing_model: {
      per_student_cost: 0,
      lms_cost: 0,
      lap_setup_cost: 0,
      monthly_recurring_cost: 0,
      trainer_monthly_fee: 0,
    },
    gps_location: {
      latitude: 0,
      longitude: 0,
      address: '',
    },
    attendance_radius_meters: 1500,
    normal_working_hours: 8,
    check_in_time: '09:00',
    check_out_time: '17:00',
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  const getLicenseBadge = (type: string) => {
    const colors = {
      basic: 'bg-gray-500',
      standard: 'bg-blue-500',
      premium: 'bg-purple-500',
      enterprise: 'bg-orange-500'
    };
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getContractStatus = (expiryDate: string) => {
    const daysLeft = getDaysUntilExpiry(expiryDate);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 30) return 'expiring_soon';
    return 'active';
  };

  // Filtered institutions
  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inst.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inst.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || inst.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || inst.subscription_status === statusFilter;
    const matchesLicense = licenseFilter === 'all' || inst.license_type === licenseFilter;
    
    let matchesContractStatus = true;
    if (contractStatusFilter !== 'all') {
      const status = getContractStatus(inst.contract_expiry_date);
      matchesContractStatus = status === contractStatusFilter;
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesLicense && matchesContractStatus;
  });

  const handleAddInstitution = async () => {
    // Validate required fields
    if (!formData.name || !formData.slug || !formData.admin_email || !formData.admin_password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Create in database with optimistic update
      await createInstitution(formData as InstitutionFormData);
      
      toast.success(`${formData.name} has been successfully onboarded!`, {
        description: "Institution created and saved to database",
        duration: 5000,
      });
      
      setFormData({
        name: '',
        slug: '',
        type: 'school',
        location: '',
        established_year: new Date().getFullYear(),
        contact_email: '',
        contact_phone: '',
        admin_name: '',
        admin_email: '',
        admin_password: '',
        license_type: 'basic',
        max_users: 500,
        subscription_plan: 'basic',
        student_id_prefix: '',
        student_id_suffix: '',
        pricing_model: {
          per_student_cost: 0,
          lms_cost: 0,
          lap_setup_cost: 0,
          monthly_recurring_cost: 0,
          trainer_monthly_fee: 0,
        },
        gps_location: {
          latitude: 0,
          longitude: 0,
          address: '',
        },
        attendance_radius_meters: 1500,
        normal_working_hours: 8,
        check_in_time: '09:00',
        check_out_time: '17:00',
      });
      setActiveTab('list');
    } catch (error) {
      console.error('Error creating institution:', error);
      toast.error('Failed to create institution');
    }
  };

  const handleRenewLicense = () => {
    if (selectedInstitution) {
      updateInstitution({ id: selectedInstitution.id, updates: {
        license_expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
      }});
      toast.success(`License renewed for ${selectedInstitution.name}`);
      setIsRenewDialogOpen(false);
      setSelectedInstitution(null);
    }
  };

  // Calculate stats
  const stats = {
    total: institutions.length,
    active: institutions.filter(i => i.subscription_status === 'active').length,
    expiringSoon: institutions.filter(i => getDaysUntilExpiry(i.license_expiry) <= 30 && getDaysUntilExpiry(i.license_expiry) > 0).length,
    totalUsers: institutions.reduce((sum, i) => sum + i.current_users, 0),
    totalValue: institutions.reduce((sum, i) => sum + i.contract_value, 0),
    renewalPipeline: institutions.filter(i => getDaysUntilExpiry(i.contract_expiry_date) <= 60).reduce((sum, i) => sum + i.contract_value, 0)
  };

  // Handle tab changes with PIN protection
  const handleTabChange = (value: string) => {
    const protectedTabs = ['licenses', 'renewals'];
    
    if (protectedTabs.includes(value) && !isPinVerified) {
      setRequestedTab(value);
      setShowPinDialog(true);
    } else {
      setActiveTab(value);
    }
  };

  const handlePinSuccess = () => {
    setIsPinVerified(true);
    if (requestedTab) {
      setActiveTab(requestedTab);
      setRequestedTab('');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Institution Management</h1>
          <p className="text-muted-foreground">Manage clients, agreements, and contracts in one place</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">
              Institutions ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="add">
              Add Institution
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Performance Analytics
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Institutions List */}
          <TabsContent value="list" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Institutions</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Institutions</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Agreements Expiring</CardTitle>
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search institutions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                        <SelectItem value="college">College</SelectItem>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="institute">Institute</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstitutions.map((inst) => (
                      <TableRow key={inst.id} className="hover:bg-muted/50">
                        <TableCell className="cursor-pointer" onClick={() => navigate(`/system-admin/institutions/${inst.id}`)}>
                          <div>
                            <div className="font-medium text-primary hover:underline">{inst.name}</div>
                            <div className="text-sm text-muted-foreground">{inst.code}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{inst.type}</TableCell>
                        <TableCell>{inst.location}</TableCell>
                        <TableCell>{inst.current_users} / {inst.max_users}</TableCell>
                        <TableCell>{getLicenseBadge(inst.license_type)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(inst.license_expiry).toLocaleDateString()}
                            <div className={`text-xs ${getDaysUntilExpiry(inst.license_expiry) <= 30 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                              {getDaysUntilExpiry(inst.license_expiry)} days left
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(inst.subscription_status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingInstitution(inst);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={isDeleting}
                              onClick={(e) => {
                                e.stopPropagation();
                                const confirmMessage = `Are you sure you want to delete "${inst.name}"?\n\nThis will permanently delete:\n• All classes in this institution\n• All students and their progress\n• All attendance records\n• All course assignments\n\nOfficers will be unassigned but NOT deleted.\n\nThis action CANNOT be undone.`;
                                
                                if (window.confirm(confirmMessage)) {
                                  deleteInstitution(inst.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Add Institution */}
          <TabsContent value="add" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Institution</CardTitle>
                <CardDescription>Register a new school or institution to the platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="font-semibold text-lg">Basic Information</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Organization Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Delhi Public School"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">Slug (URL-friendly) *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        placeholder="e.g., dps-delhi"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">Institution Type *</Label>
                      <Select value={formData.type} onValueChange={(value: Institution['type']) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="university">University</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="institute">Institute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_id_prefix">Student ID Prefix *</Label>
                      <Input
                        id="student_id_prefix"
                        value={formData.student_id_prefix}
                        onChange={(e) => setFormData({ ...formData, student_id_prefix: e.target.value.toUpperCase() })}
                        placeholder="e.g., MSD"
                      />
                      <p className="text-xs text-muted-foreground">Used to generate unique student IDs</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_id_suffix">Student ID Suffix *</Label>
                      <Input
                        id="student_id_suffix"
                        value={formData.student_id_suffix}
                        onChange={(e) => setFormData({ ...formData, student_id_suffix: e.target.value })}
                        placeholder="e.g., 2025"
                      />
                      <p className="text-xs text-muted-foreground">Usually the academic year</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, State, Country"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="established_year">Established Year *</Label>
                      <Input
                        id="established_year"
                        type="number"
                        value={formData.established_year}
                        onChange={(e) => setFormData({ ...formData, established_year: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-semibold text-lg">Contact Information</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Institution Email *</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="admin@institution.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Phone Number</Label>
                      <Input
                        id="contact_phone"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                        placeholder="+91-XX-XXXX-XXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_name">Admin Name *</Label>
                      <Input
                        id="admin_name"
                        value={formData.admin_name}
                        onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                        placeholder="Dr. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_email">Admin Email *</Label>
                      <Input
                        id="admin_email"
                        type="email"
                        value={formData.admin_email}
                        onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                        placeholder="admin@institution.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_password">Admin Password *</Label>
                      <div className="relative">
                        <Input
                          id="admin_password"
                          type={showAdminPassword ? 'text' : 'password'}
                          value={formData.admin_password}
                          onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                          placeholder="Enter admin password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Used for management portal login</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-semibold text-lg">Agreement Configuration (Optional)</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="per_student_cost">Per Student Cost (₹)</Label>
                      <Input
                        id="per_student_cost"
                        type="number"
                        value={formData.pricing_model.per_student_cost}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing_model: { ...formData.pricing_model, per_student_cost: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lms_cost">LMS Cost (₹)</Label>
                      <Input
                        id="lms_cost"
                        type="number"
                        value={formData.pricing_model.lms_cost}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing_model: { ...formData.pricing_model, lms_cost: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="LMS platform cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lap_setup_cost">Lap Setup - One Time (₹)</Label>
                      <Input
                        id="lap_setup_cost"
                        type="number"
                        value={formData.pricing_model.lap_setup_cost}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing_model: { ...formData.pricing_model, lap_setup_cost: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="200000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthly_pay">Monthly Pay (₹)</Label>
                      <Input
                        id="monthly_pay"
                        type="number"
                        value={formData.pricing_model.monthly_recurring_cost}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing_model: { ...formData.pricing_model, monthly_recurring_cost: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="15000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trainer_fee">Trainer Monthly Fee (₹)</Label>
                      <Input
                        id="trainer_fee"
                        type="number"
                        value={formData.pricing_model.trainer_monthly_fee}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing_model: { ...formData.pricing_model, trainer_monthly_fee: parseInt(e.target.value) || 0 }
                        })}
                        placeholder="40000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max_users">Max Users</Label>
                      <Input
                        id="max_users"
                        type="number"
                        value={formData.max_users}
                        onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-semibold text-lg">GPS & Attendance Configuration</div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="gps_latitude">GPS Latitude *</Label>
                      <Input
                        id="gps_latitude"
                        type="number"
                        step="0.000001"
                        value={formData.gps_location.latitude || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          gps_location: { 
                            ...formData.gps_location,
                            latitude: parseFloat(e.target.value) || 0
                          }
                        })}
                        placeholder="28.5244"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gps_longitude">GPS Longitude *</Label>
                      <Input
                        id="gps_longitude"
                        type="number"
                        step="0.000001"
                        value={formData.gps_location.longitude || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          gps_location: { 
                            ...formData.gps_location,
                            longitude: parseFloat(e.target.value) || 0
                          }
                        })}
                        placeholder="77.1855"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="gps_address">Address</Label>
                      <Input
                        id="gps_address"
                        value={formData.gps_location.address || ''}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          gps_location: { 
                            ...formData.gps_location,
                            address: e.target.value
                          }
                        })}
                        placeholder="Complete institution address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attendance_radius">Attendance Radius (meters)</Label>
                      <Input
                        id="attendance_radius"
                        type="number"
                        value={formData.attendance_radius_meters}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          attendance_radius_meters: parseInt(e.target.value) || 1500
                        })}
                        min="50"
                        max="5000"
                        placeholder="1500"
                      />
                      <p className="text-xs text-muted-foreground">Default: 1500m (1.5km)</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="normal_working_hours">Normal Working Hours/Day</Label>
                      <Input
                        id="normal_working_hours"
                        type="number"
                        value={formData.normal_working_hours}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          normal_working_hours: parseInt(e.target.value) || 8
                        })}
                        min="1"
                        max="24"
                        placeholder="8"
                      />
                      <p className="text-xs text-muted-foreground">Default: 8 hours/day</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_in_time">Check-in Time *</Label>
                      <Input
                        id="check_in_time"
                        type="time"
                        value={formData.check_in_time}
                        onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_out_time">Check-out Time *</Label>
                      <Input
                        id="check_out_time"
                        type="time"
                        value={formData.check_out_time}
                        onChange={(e) => setFormData({ ...formData, check_out_time: e.target.value })}
                      />
                    </div>
                  </div>
                  {formData.gps_location.latitude !== 0 && formData.gps_location.longitude !== 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        📍 <a 
                          href={`https://www.google.com/maps?q=${formData.gps_location.latitude},${formData.gps_location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-600"
                        >
                          View on Google Maps
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="font-semibold text-lg">MoU Document (Optional)</div>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drag and drop or click to upload MoU document</p>
                    <Button variant="outline" className="mt-2">
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                  </div>
                </div>

                <Button onClick={handleAddInstitution} className="w-full" size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Institution
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Agreement Management */}
          <TabsContent value="licenses" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Agreements</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.active}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.expiringSoon}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Agreement Overview</CardTitle>
                  <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by agreement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agreements</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Agreement Type</TableHead>
                      <TableHead>User Capacity</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Left</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstitutions.map((inst) => {
                      const usagePercent = (inst.current_users / inst.max_users) * 100;
                      const daysLeft = getDaysUntilExpiry(inst.license_expiry);
                      return (
                        <TableRow key={inst.id}>
                          <TableCell>
                            <div className="font-medium">{inst.name}</div>
                            <div className="text-sm text-muted-foreground">{inst.code}</div>
                          </TableCell>
                          <TableCell>{getLicenseBadge(inst.license_type)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{inst.current_users} / {inst.max_users}</div>
                              <Progress value={usagePercent} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{new Date(inst.license_expiry).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={daysLeft <= 30 ? 'destructive' : daysLeft <= 60 ? 'outline' : 'secondary'}>
                              {daysLeft} days
                            </Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(inst.subscription_status)}</TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedInstitution(inst);
                                setIsRenewDialogOpen(true);
                              }}
                            >
                              Renew
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Renewals & Contracts */}
          <TabsContent value="renewals" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {institutions.filter(i => {
                      const days = getDaysUntilExpiry(i.contract_expiry_date);
                      return days <= 30 && days > 0;
                    }).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expired</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {institutions.filter(i => getDaysUntilExpiry(i.contract_expiry_date) < 0).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Contract Value</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{(stats.totalValue / 100000).toFixed(1)}L</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Renewal Pipeline</CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{(stats.renewalPipeline / 100000).toFixed(1)}L</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contract Renewals</CardTitle>
                  <Select value={contractStatusFilter} onValueChange={setContractStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Contracts</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Contract Type</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Days Until Expiry</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstitutions.map((inst) => {
                      const daysLeft = getDaysUntilExpiry(inst.contract_expiry_date);
                      const status = getContractStatus(inst.contract_expiry_date);
                      return (
                        <TableRow key={inst.id}>
                          <TableCell>
                            <div className="font-medium">{inst.name}</div>
                          </TableCell>
                          <TableCell>{inst.contract_type}</TableCell>
                          <TableCell>{new Date(inst.contract_start_date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(inst.contract_expiry_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                status === 'expired' ? 'destructive' : 
                                status === 'expiring_soon' ? 'outline' : 
                                'secondary'
                              }
                            >
                              {daysLeft < 0 ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days`}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">₹{(inst.contract_value / 100000).toFixed(1)}L</TableCell>
                          <TableCell>
                            {status === 'expired' && <Badge variant="destructive">Expired</Badge>}
                            {status === 'expiring_soon' && <Badge variant="outline" className="bg-orange-500/10 text-orange-500">Expiring Soon</Badge>}
                            {status === 'active' && <Badge variant="default">Active</Badge>}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedInstitutionForMou(inst);
                                setIsMouDialogOpen(true);
                              }}
                              disabled={!('mou_document_url' in inst && inst.mou_document_url)}
                            >
                              <FileText className="h-4 w-4 mr-2" />
                              View MoU
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Performance Analytics */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Analytics will be populated from real data - placeholder for now */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Institution engagement data will be displayed here</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon. This will display real engagement data from the database.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View MoU Dialog */}
        <ViewMouDialog 
          open={isMouDialogOpen}
          onOpenChange={setIsMouDialogOpen}
          institution={selectedInstitutionForMou as any}
        />

        {/* Renew Agreement Dialog */}
        <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renew Agreement</DialogTitle>
              <DialogDescription>
                Extend the agreement for {selectedInstitution?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Current Expiry</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedInstitution && new Date(selectedInstitution.license_expiry).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label>Extension Period</Label>
                <Select defaultValue="1year">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="2years">2 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRenewLicense}>
                Renew Agreement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* PIN Lock Dialog */}
        <PinLockDialog
          open={showPinDialog}
          onOpenChange={setShowPinDialog}
          onSuccess={handlePinSuccess}
        />

        {/* Institution Edit Dialog */}
        <InstitutionEditDialog
          institution={editingInstitution}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSave={async (id, updates) => {
            await updateInstitution({ id, updates });
          }}
        />
      </div>
    </Layout>
  );
}