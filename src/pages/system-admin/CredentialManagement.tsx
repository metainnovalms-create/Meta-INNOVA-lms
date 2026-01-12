import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Key, Mail, Check, AlertCircle, RefreshCw, Loader2, X } from 'lucide-react';
import { SetPasswordDialog } from '@/components/auth/SetPasswordDialog';
import { BulkResetDialog } from '@/components/credential/BulkResetDialog';
import { passwordService } from '@/services/password.service';
import { credentialService } from '@/services/credentialService';
import { 
  useMetaEmployees, 
  useOfficers, 
  useInstitutionsWithAdmins, 
  useStudentsByInstitution,
  useInstitutionsList 
} from '@/hooks/useCredentialUsers';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CredentialManagement() {
  const queryClient = useQueryClient();

  // Meta Employees Tab State
  const [metaSearch, setMetaSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  // Officers Tab State
  const [officerSearch, setOfficerSearch] = useState('');
  const [officerStatusFilter, setOfficerStatusFilter] = useState<string>('all');

  // Institutions Tab State
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  // Students Tab State
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [studentSearch, setStudentSearch] = useState('');

  // Set Password Dialog State
  const [setPasswordDialogOpen, setSetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    email: string;
    type: 'meta_employee' | 'officer' | 'institution_admin' | 'student';
  } | null>(null);

  // Bulk Selection States
  const [selectedMetaEmployees, setSelectedMetaEmployees] = useState<Set<string>>(new Set());
  const [selectedOfficers, setSelectedOfficers] = useState<Set<string>>(new Set());
  const [selectedInstitutions, setSelectedInstitutions] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Bulk Reset Dialog State
  const [bulkResetDialogOpen, setBulkResetDialogOpen] = useState(false);
  const [bulkResetType, setBulkResetType] = useState<'meta_employee' | 'officer' | 'institution_admin' | 'student'>('meta_employee');
  const [bulkResetProgress, setBulkResetProgress] = useState<{ current: number; total: number; errors: Array<{ email: string; error: string }> }>({ current: 0, total: 0, errors: [] });
  const [isBulkResetting, setIsBulkResetting] = useState(false);

  // Fetch data using React Query hooks
  const { data: metaEmployees = [], isLoading: metaLoading, refetch: refetchMeta } = useMetaEmployees();
  const { data: officers = [], isLoading: officersLoading, refetch: refetchOfficers } = useOfficers();
  const { data: institutions = [], isLoading: institutionsLoading, refetch: refetchInstitutions } = useInstitutionsWithAdmins();
  const { data: students = [], isLoading: studentsLoading } = useStudentsByInstitution(selectedInstitution || null);
  const { data: institutionsList = [] } = useInstitutionsList();

  // Filter meta employees
  const filteredMetaEmployees = metaEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(metaSearch.toLowerCase()) ||
                         emp.email.toLowerCase().includes(metaSearch.toLowerCase());
    const matchesPosition = positionFilter === 'all' || 
                           emp.position_name?.toLowerCase() === positionFilter.toLowerCase() ||
                           emp.role === positionFilter;
    return matchesSearch && matchesPosition;
  });

  // Filter officers
  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = officer.full_name.toLowerCase().includes(officerSearch.toLowerCase()) ||
                         officer.email.toLowerCase().includes(officerSearch.toLowerCase());
    const matchesStatus = officerStatusFilter === 'all' || officer.status === officerStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter institutions
  const filteredInstitutions = institutions.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(institutionSearch.toLowerCase()) ||
      (inst.admin_email?.toLowerCase() || '').includes(institutionSearch.toLowerCase());
    const matchesPending = !showOnlyPending || !inst.password_changed;
    return matchesSearch && matchesPending;
  });

  const pendingCount = institutions.filter(inst => !inst.password_changed).length;

  // Filter students
  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Get unique positions from meta employees
  const uniquePositions = [...new Set(metaEmployees.map(emp => emp.position_name).filter(Boolean))];

  const handleSetPassword = (
    userId: string, 
    userName: string, 
    userEmail: string, 
    userType: 'meta_employee' | 'officer' | 'institution_admin' | 'student'
  ) => {
    setSelectedUser({ id: userId, name: userName, email: userEmail, type: userType });
    setSetPasswordDialogOpen(true);
  };

  const handleSendResetLink = async (email: string, userName: string, userType: string) => {
    try {
      await passwordService.sendResetLink(email, userName, userType);
    } catch (error) {
      toast.error('Failed to send reset link');
    }
  };

  const handleSetPasswordSuccess = async (userId: string, password: string, userType: string) => {
    try {
      const result = await credentialService.setUserPassword(
        userId, 
        password, 
        userType as 'meta_employee' | 'officer' | 'institution_admin' | 'student'
      );

      if (!result.success) {
        toast.error(result.error || 'Failed to set password');
        return;
      }

      // Refresh the appropriate data
      if (userType === 'meta_employee') {
        refetchMeta();
      } else if (userType === 'officer') {
        refetchOfficers();
      } else if (userType === 'institution_admin') {
        refetchInstitutions();
      } else if (userType === 'student') {
        queryClient.invalidateQueries({ queryKey: ['credential-students'] });
      }

      toast.success('Password set successfully!', {
        description: 'The user can now log in with their new credentials'
      });

      setSetPasswordDialogOpen(false);
    } catch (error) {
      toast.error('Failed to set password');
    }
  };

  const handleRefresh = () => {
    refetchMeta();
    refetchOfficers();
    refetchInstitutions();
    if (selectedInstitution) {
      queryClient.invalidateQueries({ queryKey: ['credential-students'] });
    }
    toast.success('Data refreshed');
  };

  // Bulk Selection Helpers
  const toggleSelection = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    const newSet = new Set(set);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setFn(newSet);
  };

  const toggleAllMetaEmployees = (checked: boolean) => {
    if (checked) {
      setSelectedMetaEmployees(new Set(filteredMetaEmployees.map(e => e.id)));
    } else {
      setSelectedMetaEmployees(new Set());
    }
  };

  const toggleAllOfficers = (checked: boolean) => {
    if (checked) {
      setSelectedOfficers(new Set(filteredOfficers.filter(o => o.user_id).map(o => o.id)));
    } else {
      setSelectedOfficers(new Set());
    }
  };

  const toggleAllInstitutions = (checked: boolean) => {
    if (checked) {
      setSelectedInstitutions(new Set(filteredInstitutions.filter(i => i.admin_user_id && i.admin_email).map(i => i.id)));
    } else {
      setSelectedInstitutions(new Set());
    }
  };

  const toggleAllStudents = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(filteredStudents.filter(s => s.user_id && (s.email || s.parent_email)).map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  // Get selected users for bulk reset
  const getSelectedUsersForBulkReset = (type: typeof bulkResetType) => {
    switch (type) {
      case 'meta_employee':
        return metaEmployees
          .filter(e => selectedMetaEmployees.has(e.id))
          .map(e => ({ id: e.id, name: e.name, email: e.email }));
      case 'officer':
        return officers
          .filter(o => selectedOfficers.has(o.id) && o.user_id)
          .map(o => ({ id: o.id, name: o.full_name, email: o.email }));
      case 'institution_admin':
        return institutions
          .filter(i => selectedInstitutions.has(i.id) && i.admin_user_id && i.admin_email)
          .map(i => ({ id: i.admin_user_id!, name: i.admin_name || i.name, email: i.admin_email! }));
      case 'student':
        return students
          .filter(s => selectedStudents.has(s.id) && s.user_id && (s.email || s.parent_email))
          .map(s => ({ id: s.id, name: s.student_name, email: s.email || s.parent_email || '' }));
      default:
        return [];
    }
  };

  const openBulkResetDialog = (type: typeof bulkResetType) => {
    setBulkResetType(type);
    setBulkResetProgress({ current: 0, total: 0, errors: [] });
    setBulkResetDialogOpen(true);
  };

  const handleBulkReset = async () => {
    const users = getSelectedUsersForBulkReset(bulkResetType);
    if (users.length === 0) return;

    setIsBulkResetting(true);
    setBulkResetProgress({ current: 0, total: users.length, errors: [] });

    const result = await passwordService.sendBulkResetLinks(
      users.map(u => ({ email: u.email, name: u.name, userId: u.id, userType: bulkResetType })),
      (current, total) => setBulkResetProgress(prev => ({ ...prev, current, total }))
    );

    setBulkResetProgress(prev => ({ ...prev, errors: result.failed }));
    setIsBulkResetting(false);

    if (result.failed.length === 0) {
      toast.success(`Reset links sent to ${result.success} users`);
    } else if (result.success > 0) {
      toast.warning(`Sent ${result.success} links, ${result.failed.length} failed`);
    } else {
      toast.error(`Failed to send reset links`);
    }

    // Clear selection after completion
    if (result.failed.length === 0) {
      switch (bulkResetType) {
        case 'meta_employee': setSelectedMetaEmployees(new Set()); break;
        case 'officer': setSelectedOfficers(new Set()); break;
        case 'institution_admin': setSelectedInstitutions(new Set()); break;
        case 'student': setSelectedStudents(new Set()); break;
      }
    }
  };

  const closeBulkResetDialog = () => {
    if (!isBulkResetting) {
      setBulkResetDialogOpen(false);
    }
  };

  const getCredentialStatusBadge = (passwordChanged: boolean, mustChangePassword: boolean, hasUserId: boolean) => {
    if (!hasUserId) {
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">
          No Account
        </Badge>
      );
    }
    if (mustChangePassword) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Must Change
        </Badge>
      );
    }
    if (passwordChanged) {
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Configured
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        Pending Setup
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credential Management</h1>
            <p className="text-muted-foreground">
              Manage passwords and authentication for all users
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="meta-employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="meta-employees">Meta Employees</TabsTrigger>
            <TabsTrigger value="officers">Officers</TabsTrigger>
            <TabsTrigger value="institutions">Institutions</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          {/* Meta Employees Tab */}
          <TabsContent value="meta-employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meta Employees</CardTitle>
                <CardDescription>
                  Manage credentials for system administrators and staff
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={metaSearch}
                      onChange={(e) => setMetaSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={positionFilter} onValueChange={setPositionFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {uniquePositions.map(pos => (
                        <SelectItem key={pos} value={pos!}>
                          {pos?.toUpperCase().replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk Action Bar */}
                {selectedMetaEmployees.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium">
                      {selectedMetaEmployees.size} user(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedMetaEmployees(new Set())}>
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <Button size="sm" onClick={() => openBulkResetDialog('meta_employee')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reset Links
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedMetaEmployees.size === filteredMetaEmployees.length && filteredMetaEmployees.length > 0}
                            onCheckedChange={(checked) => toggleAllMetaEmployees(!!checked)}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Credential Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metaLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : filteredMetaEmployees.length > 0 ? (
                        filteredMetaEmployees.map((emp) => (
                          <TableRow key={emp.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedMetaEmployees.has(emp.id)}
                                onCheckedChange={() => toggleSelection(selectedMetaEmployees, setSelectedMetaEmployees, emp.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{emp.name}</TableCell>
                            <TableCell>{emp.email}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {emp.position_name?.toUpperCase().replace(/_/g, ' ') || 'Staff'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {emp.role.replace(/_/g, ' ').toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getCredentialStatusBadge(emp.password_changed, emp.must_change_password, true)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSetPassword(emp.id, emp.name, emp.email, 'meta_employee')}
                                >
                                  <Key className="h-4 w-4 mr-1" />
                                  Set Password
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSendResetLink(emp.email, emp.name, 'meta_employee')}
                                >
                                  <Mail className="h-4 w-4 mr-1" />
                                  Send Reset Link
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No employees found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Officers Tab */}
          <TabsContent value="officers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Innovation Officers</CardTitle>
                <CardDescription>
                  Manage credentials for innovation officers assigned to institutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={officerSearch}
                      onChange={(e) => setOfficerSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={officerStatusFilter} onValueChange={setOfficerStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bulk Action Bar */}
                {selectedOfficers.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium">
                      {selectedOfficers.size} officer(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedOfficers(new Set())}>
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <Button size="sm" onClick={() => openBulkResetDialog('officer')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reset Links
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedOfficers.size === filteredOfficers.filter(o => o.user_id).length && filteredOfficers.filter(o => o.user_id).length > 0}
                            onCheckedChange={(checked) => toggleAllOfficers(!!checked)}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Employee ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Credential Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {officersLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : filteredOfficers.length > 0 ? (
                        filteredOfficers.map((officer) => (
                          <TableRow key={officer.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedOfficers.has(officer.id)}
                                onCheckedChange={() => toggleSelection(selectedOfficers, setSelectedOfficers, officer.id)}
                                disabled={!officer.user_id}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{officer.full_name}</TableCell>
                            <TableCell>{officer.email}</TableCell>
                            <TableCell>{officer.employee_id || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={officer.status === 'active' ? 'default' : 'secondary'}>
                                {officer.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getCredentialStatusBadge(officer.password_changed, officer.must_change_password, !!officer.user_id)}
                            </TableCell>
                            <TableCell className="text-right">
                              {officer.user_id ? (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSetPassword(officer.id, officer.full_name, officer.email, 'officer')}
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    Set Password
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendResetLink(officer.email, officer.full_name, 'officer')}
                                  >
                                    <Mail className="h-4 w-4 mr-1" />
                                    Send Reset
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">No account created</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No officers found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Institutions Tab */}
          <TabsContent value="institutions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Institution Administrators</CardTitle>
                <CardDescription>
                  Manage credentials for onboarded institutions and their administrators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by institution name..."
                      value={institutionSearch}
                      onChange={(e) => setInstitutionSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="pending-credentials"
                      checked={showOnlyPending}
                      onCheckedChange={(checked) => setShowOnlyPending(checked as boolean)}
                    />
                    <label htmlFor="pending-credentials" className="text-sm cursor-pointer">
                      Show only institutions pending credential setup ({pendingCount})
                    </label>
                  </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedInstitutions.size > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-sm font-medium">
                      {selectedInstitutions.size} institution(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedInstitutions(new Set())}>
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <Button size="sm" onClick={() => openBulkResetDialog('institution_admin')}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reset Links
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedInstitutions.size === filteredInstitutions.filter(i => i.admin_user_id && i.admin_email).length && filteredInstitutions.filter(i => i.admin_user_id && i.admin_email).length > 0}
                            onCheckedChange={(checked) => toggleAllInstitutions(!!checked)}
                          />
                        </TableHead>
                        <TableHead>Institution Name</TableHead>
                        <TableHead>Admin Name</TableHead>
                        <TableHead>Admin Email</TableHead>
                        <TableHead>Credential Status</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {institutionsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : filteredInstitutions.length > 0 ? (
                        filteredInstitutions.map((inst) => (
                          <TableRow key={inst.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedInstitutions.has(inst.id)}
                                onCheckedChange={() => toggleSelection(selectedInstitutions, setSelectedInstitutions, inst.id)}
                                disabled={!inst.admin_user_id || !inst.admin_email}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{inst.name}</TableCell>
                            <TableCell>{inst.admin_name || '-'}</TableCell>
                            <TableCell>{inst.admin_email || '-'}</TableCell>
                            <TableCell>
                              {getCredentialStatusBadge(inst.password_changed, inst.must_change_password, !!inst.admin_user_id)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={inst.status === 'active' ? 'default' : 'secondary'}>
                                {inst.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {inst.admin_user_id && inst.admin_email ? (
                                <div className="flex justify-end gap-2 flex-wrap">
                                  {!inst.password_changed ? (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleSetPassword(inst.admin_user_id!, inst.admin_name || inst.name, inst.admin_email!, 'institution_admin')}
                                    >
                                      <Key className="h-4 w-4 mr-1" />
                                      Set Up Credentials
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSetPassword(inst.admin_user_id!, inst.admin_name || inst.name, inst.admin_email!, 'institution_admin')}
                                      >
                                        <Key className="h-4 w-4 mr-1" />
                                        Reset Password
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSendResetLink(inst.admin_email!, inst.admin_name || inst.name, 'institution_admin')}
                                      >
                                        <Mail className="h-4 w-4 mr-1" />
                                        Send Reset Link
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">No admin assigned</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No institutions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Students</CardTitle>
                <CardDescription>
                  Manage credentials for students by institution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an institution..." />
                  </SelectTrigger>
                  <SelectContent>
                    {institutionsList.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedInstitution && (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by roll number or name..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Bulk Action Bar */}
                    {selectedStudents.size > 0 && (
                      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="text-sm font-medium">
                          {selectedStudents.size} student(s) selected
                        </span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedStudents(new Set())}>
                            <X className="h-4 w-4 mr-1" />
                            Clear
                          </Button>
                          <Button size="sm" onClick={() => openBulkResetDialog('student')}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Reset Links
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedStudents.size === filteredStudents.filter(s => s.user_id && (s.email || s.parent_email)).slice(0, 20).length && filteredStudents.filter(s => s.user_id && (s.email || s.parent_email)).length > 0}
                                onCheckedChange={(checked) => toggleAllStudents(!!checked)}
                              />
                            </TableHead>
                            <TableHead>Roll Number</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Credential Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {studentsLoading ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ) : filteredStudents.length > 0 ? (
                            filteredStudents.slice(0, 20).map((student) => (
                              <TableRow key={student.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedStudents.has(student.id)}
                                    onCheckedChange={() => toggleSelection(selectedStudents, setSelectedStudents, student.id)}
                                    disabled={!student.user_id || (!student.email && !student.parent_email)}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{student.roll_number || '-'}</TableCell>
                                <TableCell>{student.student_name}</TableCell>
                                <TableCell>{student.email || student.parent_email || '-'}</TableCell>
                                <TableCell>{student.class_name || '-'}</TableCell>
                                <TableCell>
                                  {getCredentialStatusBadge(student.password_changed, student.must_change_password, !!student.user_id)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {student.user_id ? (
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSetPassword(student.id, student.student_name, student.email || student.parent_email || '', 'student')}
                                      >
                                        <Key className="h-4 w-4 mr-1" />
                                        Set Password
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleSendResetLink(student.email || student.parent_email || '', student.student_name, 'student')}
                                        disabled={!student.email && !student.parent_email}
                                      >
                                        <Mail className="h-4 w-4 mr-1" />
                                        Send Reset
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleSetPassword(student.id, student.student_name, student.email || student.parent_email || '', 'student')}
                                      disabled={!student.email && !student.parent_email}
                                    >
                                      <Key className="h-4 w-4 mr-1" />
                                      Create Account
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                No students found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {filteredStudents.length > 20 && (
                        <div className="p-4 text-center text-sm text-muted-foreground border-t">
                          Showing 20 of {filteredStudents.length} students. Use search to filter.
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!selectedInstitution && (
                  <div className="text-center py-8 text-muted-foreground">
                    Select an institution to manage student credentials
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Set Password Dialog */}
      {selectedUser && (
        <SetPasswordDialog
          open={setPasswordDialogOpen}
          onClose={() => {
            setSetPasswordDialogOpen(false);
            setSelectedUser(null);
          }}
          userName={selectedUser.name}
          userEmail={selectedUser.email}
          userId={selectedUser.id}
          userType={selectedUser.type}
          onSetPassword={async (password) => {
            await handleSetPasswordSuccess(selectedUser.id, password, selectedUser.type);
          }}
        />
      )}

      {/* Bulk Reset Dialog */}
      <BulkResetDialog
        open={bulkResetDialogOpen}
        onClose={closeBulkResetDialog}
        selectedUsers={getSelectedUsersForBulkReset(bulkResetType)}
        userType={bulkResetType}
        onConfirm={handleBulkReset}
        isProcessing={isBulkResetting}
        progress={bulkResetProgress}
      />
    </Layout>
  );
}
