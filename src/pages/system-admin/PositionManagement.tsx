import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, Shield, Users, Key, Trash2, Crown, Search, Info, RefreshCw, Pencil } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { positionService } from '@/services/position.service';
import { metaStaffService } from '@/services/metastaff.service';
import { CustomPosition, SystemAdminFeature } from '@/types/permissions';
import { User } from '@/types';
import { CreatePositionDialog } from '@/components/position/CreatePositionDialog';
import { EditPositionDialog } from '@/components/position/EditPositionDialog';
import { PositionCard } from '@/components/position/PositionCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, AlertTriangle } from 'lucide-react';
import StaffDirectory from '@/components/staff/StaffDirectory';

export default function PositionManagement() {
  const { user, refreshUser } = useAuth();
  const [positions, setPositions] = useState<CustomPosition[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<CustomPosition | null>(null);
  const [positionUsers, setPositionUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    position_id: '',
    password_mode: 'auto' as 'auto' | 'custom',
    custom_password: '',
    join_date: new Date().toISOString().split('T')[0],
    // Leave allowances
    casual_leave: '12',
    sick_leave: '10',
    earned_leave: '15',
    // Salary fields
    annual_salary: '',
    hourly_rate: '',
    overtime_rate_multiplier: '1.5',
    normal_working_hours: '8',
  });
  
  // Edit user state
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserData, setEditUserData] = useState({
    name: '',
    annual_salary: '',
    hourly_rate: '',
    overtime_rate_multiplier: '1.5',
    normal_working_hours: '8',
  });
  const [credentialsDialog, setCredentialsDialog] = useState<{
    open: boolean;
    email: string;
    password: string;
    name: string;
  }>({
    open: false,
    email: '',
    password: '',
    name: '',
  });

  const loadAllData = useCallback(async () => {
    try {
      const data = await positionService.getAllPositions();
      setPositions(data);
      if (!selectedPosition && data.length > 0) {
        setSelectedPosition(data[0]);
      } else if (selectedPosition) {
        // Refresh selected position data
        const updatedPosition = data.find(p => p.id === selectedPosition.id);
        if (updatedPosition) {
          setSelectedPosition(updatedPosition);
        }
      }
    } catch (error) {
      toast.error('Failed to load positions');
    }
  }, [selectedPosition]);

  useEffect(() => {
    loadAllData();
    
    // Listen for focus to refresh data when returning to this page
    const handleFocus = () => loadAllData();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (selectedPosition) {
      loadPositionUsers(selectedPosition.id);
    }
  }, [selectedPosition]);

  const loadPositionUsers = async (positionId: string) => {
    try {
      const users = await positionService.getUsersByPosition(positionId);
      setPositionUsers(users);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleCreatePosition = async (data: {
    position_name: string;
    display_name: string;
    description: string;
    visible_features: SystemAdminFeature[];
  }) => {
    setIsLoading(true);
    try {
      await positionService.createPosition({
        position_name: data.position_name,
        display_name: data.display_name || data.position_name,
        description: data.description,
        visible_features: data.visible_features,
      });
      toast.success('Position created successfully');
      setIsCreateDialogOpen(false);
      loadAllData();
    } catch (error) {
      toast.error('Failed to create position');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPosition = async (data: {
    position_name: string;
    display_name: string;
    description: string;
    visible_features: SystemAdminFeature[];
  }) => {
    if (!selectedPosition) return;

    setIsLoading(true);
    try {
      await positionService.updatePosition(selectedPosition.id, data);
      toast.success('Position updated successfully');
      setIsEditDialogOpen(false);
      loadAllData();
      
      // If the edited position is the current user's position, refresh user data immediately
      if (selectedPosition.id === user?.position_id) {
        await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update position');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePosition = async (position: CustomPosition) => {
    if (!confirm(`Are you sure you want to delete "${position.display_name}"?`)) return;

    setIsLoading(true);
    try {
      await positionService.deletePosition(position.id);
      toast.success('Position deleted successfully');
      loadAllData();
      if (selectedPosition?.id === position.id) {
        setSelectedPosition(null);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete position');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserData.name || !newUserData.email || !newUserData.position_id) {
      toast.error('Please fill all fields');
      return;
    }

    if (newUserData.password_mode === 'custom' && !newUserData.custom_password) {
      toast.error('Please enter a custom password');
      return;
    }

    if (newUserData.password_mode === 'custom' && newUserData.custom_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      const result = await metaStaffService.createMetaStaff({
        name: newUserData.name,
        email: newUserData.email,
        position_id: newUserData.position_id,
        custom_password: newUserData.password_mode === 'custom' ? newUserData.custom_password : undefined,
        casual_leave: parseInt(newUserData.casual_leave) || 12,
        sick_leave: parseInt(newUserData.sick_leave) || 10,
        earned_leave: parseInt(newUserData.earned_leave) || 15,
        join_date: newUserData.join_date || undefined,
        annual_salary: parseFloat(newUserData.annual_salary) || undefined,
        hourly_rate: parseFloat(newUserData.hourly_rate) || undefined,
        overtime_rate_multiplier: parseFloat(newUserData.overtime_rate_multiplier) || 1.5,
        normal_working_hours: parseFloat(newUserData.normal_working_hours) || 8,
      });
      toast.success('User added successfully');
      setIsAddUserDialogOpen(false);
      setNewUserData({ 
        name: '', 
        email: '', 
        position_id: '', 
        password_mode: 'auto', 
        custom_password: '', 
        join_date: new Date().toISOString().split('T')[0],
        casual_leave: '12', 
        sick_leave: '10', 
        earned_leave: '15',
        annual_salary: '',
        hourly_rate: '',
        overtime_rate_multiplier: '1.5',
        normal_working_hours: '8',
      });

      setCredentialsDialog({
        open: true,
        email: result.user.email,
        password: result.password,
        name: result.user.name,
      });

      if (selectedPosition) {
        loadPositionUsers(selectedPosition.id);
      }
      loadAllData();
    } catch (error) {
      toast.error('Failed to add user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadAllData();
    if (selectedPosition) {
      await loadPositionUsers(selectedPosition.id);
    }
    toast.success('Data refreshed');
  };

  const handleResetPassword = async (userId: string, userName: string, userEmail: string) => {
    try {
      const newPassword = await metaStaffService.resetPassword(userId);
      setCredentialsDialog({
        open: true,
        email: userEmail,
        password: newPassword,
        name: userName,
      });
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    setIsLoading(true);
    try {
      await metaStaffService.deleteMetaStaff(userId);
      toast.success('User removed successfully');
      if (selectedPosition) {
        loadPositionUsers(selectedPosition.id);
      }
      loadAllData();
    } catch (error) {
      toast.error('Failed to remove user');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `Login Credentials\nName: ${credentialsDialog.name}\nEmail: ${credentialsDialog.email}\nPassword: ${credentialsDialog.password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard');
  };

  const filteredPositions = positions.filter(
    (pos) =>
      pos.position_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pos.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              RBAC Management
            </h1>
            <p className="text-muted-foreground">Role-based access control and position management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Position
            </Button>
          </div>
        </div>

        {/* Tabs for Positions and Staff Directory */}
        <Tabs defaultValue="positions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="staff">Staff Directory</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                Create unlimited custom positions (e.g., Project Coordinator, HR Manager, Sales Executive) and configure
                which sidebar menus each position can access. Users assigned to these positions will only see their configured menus.
              </AlertDescription>
            </Alert>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Badge variant="secondary">{positions.length} positions</Badge>
            </div>

        {/* Position Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPositions.map((position) => (
            <PositionCard
              key={position.id}
              position={position}
              isSelected={selectedPosition?.id === position.id}
              userCount={position.user_count || 0}
              isCEO={user?.is_ceo === true}
              onSelect={() => setSelectedPosition(position)}
              onEdit={() => {
                setSelectedPosition(position);
                setIsEditDialogOpen(true);
              }}
              onDelete={() => handleDeletePosition(position)}
            />
          ))}
        </div>

        {/* Selected Position Details */}
        {selectedPosition && (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {selectedPosition.is_ceo_position && <Crown className="h-5 w-5 text-yellow-600" />}
                      {selectedPosition.display_name}
                    </CardTitle>
                    <CardDescription>{selectedPosition.description}</CardDescription>
                  </div>
                  <Button onClick={() => setIsAddUserDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Assigned Users</span>
                    <Badge>{positionUsers.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Visible Menus</span>
                    <Badge>{selectedPosition.visible_features.length}</Badge>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-medium text-sm">Assigned Users</h4>
                    {positionUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No users assigned</p>
                    ) : (
                      positionUsers.map((metaUser) => (
                        <div
                          key={metaUser.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{metaUser.name}</p>
                              <p className="text-sm text-muted-foreground">{metaUser.email}</p>
                              {metaUser.hourly_rate && (
                                <p className="text-xs text-muted-foreground">₹{metaUser.hourly_rate}/hr</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingUser(metaUser);
                                setEditUserData({
                                  name: metaUser.name,
                                  annual_salary: '',
                                  hourly_rate: metaUser.hourly_rate?.toString() || '',
                                  overtime_rate_multiplier: metaUser.overtime_rate_multiplier?.toString() || '1.5',
                                  normal_working_hours: metaUser.normal_working_hours?.toString() || '8',
                                });
                                setIsEditUserDialogOpen(true);
                              }}
                              title="Edit User"
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResetPassword(metaUser.id, metaUser.name, metaUser.email)}
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteUser(metaUser.id)}
                              title="Remove User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
          </TabsContent>

          <TabsContent value="staff">
            <StaffDirectory />
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Position Dialog */}
      <CreatePositionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreatePosition}
        isLoading={isLoading}
      />

      {/* Edit Position Dialog */}
      <EditPositionDialog
        position={selectedPosition}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleEditPosition}
        isLoading={isLoading}
      />

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User to Position</DialogTitle>
            <DialogDescription>Create a new user and assign them to a position</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="join-date">Join Date</Label>
              <Input
                id="join-date"
                type="date"
                value={newUserData.join_date}
                onChange={(e) => setNewUserData({ ...newUserData, join_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="position">Position</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Don't see the position you need? Click <strong>Create Position</strong> to add custom positions like Project Coordinator, Intern, or Sales Executive first.
              </p>
              <Select
                value={newUserData.position_id}
                onValueChange={(value) => setNewUserData({ ...newUserData, position_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos.id} value={pos.id}>
                      {pos.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Password Generation</Label>
              <div className="space-y-3 mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="auto-password"
                    checked={newUserData.password_mode === 'auto'}
                    onChange={() => setNewUserData({ ...newUserData, password_mode: 'auto', custom_password: '' })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="auto-password" className="font-normal cursor-pointer">
                    Auto-generate secure password
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="custom-password"
                    checked={newUserData.password_mode === 'custom'}
                    onChange={() => setNewUserData({ ...newUserData, password_mode: 'custom' })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="custom-password" className="font-normal cursor-pointer">
                    Set custom temporary password
                  </Label>
                </div>
              </div>
            </div>
            {newUserData.password_mode === 'custom' && (
              <div>
                <Label htmlFor="custom-password-input">Custom Password</Label>
                <Input
                  id="custom-password-input"
                  type="password"
                  value={newUserData.custom_password}
                  onChange={(e) => setNewUserData({ ...newUserData, custom_password: e.target.value })}
                  placeholder="Enter temporary password (min 8 characters)"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 8 characters required
                </p>
              </div>
            )}

            {/* Salary Section */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium mb-3 block">Salary Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="annual-salary" className="text-xs text-muted-foreground">Annual Salary (₹)</Label>
                  <Input
                    id="annual-salary"
                    type="number"
                    min="0"
                    value={newUserData.annual_salary}
                    onChange={(e) => {
                      const annual = parseFloat(e.target.value) || 0;
                      const hourly = annual > 0 ? (annual / 12 / 22 / 8).toFixed(2) : '';
                      setNewUserData({ ...newUserData, annual_salary: e.target.value, hourly_rate: hourly });
                    }}
                    className="mt-1"
                    placeholder="e.g., 600000"
                  />
                </div>
                <div>
                  <Label htmlFor="hourly-rate" className="text-xs text-muted-foreground">Hourly Rate (₹)</Label>
                  <Input
                    id="hourly-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newUserData.hourly_rate}
                    onChange={(e) => setNewUserData({ ...newUserData, hourly_rate: e.target.value })}
                    className="mt-1"
                    placeholder="Auto-calculated or manual"
                  />
                </div>
                <div>
                  <Label htmlFor="overtime-rate" className="text-xs text-muted-foreground">Overtime Multiplier</Label>
                  <Input
                    id="overtime-rate"
                    type="number"
                    min="1"
                    step="0.1"
                    value={newUserData.overtime_rate_multiplier}
                    onChange={(e) => setNewUserData({ ...newUserData, overtime_rate_multiplier: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., 1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="working-hours" className="text-xs text-muted-foreground">Daily Working Hours</Label>
                  <Input
                    id="working-hours"
                    type="number"
                    min="1"
                    max="24"
                    value={newUserData.normal_working_hours}
                    onChange={(e) => setNewUserData({ ...newUserData, normal_working_hours: e.target.value })}
                    className="mt-1"
                    placeholder="e.g., 8"
                  />
                </div>
              </div>
            </div>

            {/* Leave Allowances Section */}
            <div className="border-t pt-4 mt-4">
              <Label className="text-sm font-medium mb-3 block">Leave Allowances (Days per Year)</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="casual-leave" className="text-xs text-muted-foreground">Casual</Label>
                  <Input
                    id="casual-leave"
                    type="number"
                    min="0"
                    value={newUserData.casual_leave}
                    onChange={(e) => setNewUserData({ ...newUserData, casual_leave: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sick-leave" className="text-xs text-muted-foreground">Sick</Label>
                  <Input
                    id="sick-leave"
                    type="number"
                    min="0"
                    value={newUserData.sick_leave}
                    onChange={(e) => setNewUserData({ ...newUserData, sick_leave: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="earned-leave" className="text-xs text-muted-foreground">Earned</Label>
                  <Input
                    id="earned-leave"
                    type="number"
                    min="0"
                    value={newUserData.earned_leave}
                    onChange={(e) => setNewUserData({ ...newUserData, earned_leave: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isLoading}>
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Display Dialog */}
      <Dialog
        open={credentialsDialog.open}
        onOpenChange={(open) => setCredentialsDialog({ ...credentialsDialog, open })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Login Credentials Created
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Save these credentials now! This is the only time the password will be shown.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="text-base font-medium">{credentialsDialog.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-base font-medium">{credentialsDialog.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Temporary Password</label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md font-mono text-sm">
                  <code className="flex-1">{credentialsDialog.password}</code>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyCredentials} className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy Credentials
              </Button>
              <Button
                variant="outline"
                onClick={() => setCredentialsDialog({ ...credentialsDialog, open: false })}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Update salary and work details for {editingUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editUserData.name}
                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-hourly-rate" className="text-xs text-muted-foreground">Hourly Rate (₹)</Label>
                <Input
                  id="edit-hourly-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editUserData.hourly_rate}
                  onChange={(e) => setEditUserData({ ...editUserData, hourly_rate: e.target.value })}
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <Label htmlFor="edit-annual-salary" className="text-xs text-muted-foreground">Annual Salary (₹)</Label>
                <Input
                  id="edit-annual-salary"
                  type="number"
                  min="0"
                  value={editUserData.annual_salary}
                  onChange={(e) => {
                    const annual = parseFloat(e.target.value) || 0;
                    const hourly = annual > 0 ? (annual / 12 / 22 / 8).toFixed(2) : editUserData.hourly_rate;
                    setEditUserData({ ...editUserData, annual_salary: e.target.value, hourly_rate: hourly });
                  }}
                  placeholder="e.g., 600000"
                />
              </div>
              <div>
                <Label htmlFor="edit-overtime-rate" className="text-xs text-muted-foreground">Overtime Multiplier</Label>
                <Input
                  id="edit-overtime-rate"
                  type="number"
                  min="1"
                  step="0.1"
                  value={editUserData.overtime_rate_multiplier}
                  onChange={(e) => setEditUserData({ ...editUserData, overtime_rate_multiplier: e.target.value })}
                  placeholder="e.g., 1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-working-hours" className="text-xs text-muted-foreground">Daily Working Hours</Label>
                <Input
                  id="edit-working-hours"
                  type="number"
                  min="1"
                  max="24"
                  value={editUserData.normal_working_hours}
                  onChange={(e) => setEditUserData({ ...editUserData, normal_working_hours: e.target.value })}
                  placeholder="e.g., 8"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!editingUser) return;
                setIsLoading(true);
                try {
                  await metaStaffService.updateMetaStaffProfile(editingUser.id, {
                    name: editUserData.name,
                    hourly_rate: parseFloat(editUserData.hourly_rate) || undefined,
                    overtime_rate_multiplier: parseFloat(editUserData.overtime_rate_multiplier) || 1.5,
                    normal_working_hours: parseFloat(editUserData.normal_working_hours) || 8,
                  });
                  toast.success('User profile updated');
                  setIsEditUserDialogOpen(false);
                  if (selectedPosition) {
                    loadPositionUsers(selectedPosition.id);
                  }
                } catch (error) {
                  toast.error('Failed to update user');
                } finally {
                  setIsLoading(false);
                }
              }} 
              disabled={isLoading}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
