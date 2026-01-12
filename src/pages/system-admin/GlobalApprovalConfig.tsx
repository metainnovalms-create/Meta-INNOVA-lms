import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, ArrowRight, Users, GitBranch, Info, Crown, Briefcase, UserCog, Settings, Save, Loader2, MapPin, MapPinOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { approvalHierarchyService } from '@/services/leave.service';
import { positionService } from '@/services/position.service';
import { leaveSettingsService, type LeaveSettings } from '@/services/leaveSettings.service';
import { UserType } from '@/types/leave';

export default function GlobalApprovalConfig() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogApplicantType, setDialogApplicantType] = useState<UserType>('officer');
  const [dialogApplicantPositionId, setDialogApplicantPositionId] = useState<string | null>(null);
  const [selectedApproverPosition, setSelectedApproverPosition] = useState('');
  const [isFinalApprover, setIsFinalApprover] = useState(false);
  const [isOptional, setIsOptional] = useState(false);
  const [selectedPositionForConfig, setSelectedPositionForConfig] = useState('');
  
  // Leave settings state
  const [leaveSettings, setLeaveSettings] = useState<LeaveSettings>({
    leaves_per_year: 12,
    leaves_per_month: 1,
    max_carry_forward: 1,
    max_leaves_per_month: 2,
    gps_checkin_enabled: true
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingGps, setIsSavingGps] = useState(false);

  const { data: allPositions = [] } = useQuery({
    queryKey: ['positions'],
    queryFn: () => positionService.getAllPositions()
  });

  const { data: allHierarchies = [], isLoading } = useQuery({
    queryKey: ['approval-hierarchies'],
    queryFn: () => approvalHierarchyService.getAll()
  });

  // Fetch leave settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await leaveSettingsService.getSettings();
        setLeaveSettings(settings);
      } catch (error) {
        console.error('Failed to load leave settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Filter for global hierarchies (applicant_position_id is NULL)
  const officerHierarchies = allHierarchies.filter(
    h => h.applicant_type === 'officer' && !h.applicant_position_id
  ).sort((a, b) => a.approval_order - b.approval_order);

  const staffHierarchies = allHierarchies.filter(
    h => h.applicant_type === 'staff' && !h.applicant_position_id
  ).sort((a, b) => a.approval_order - b.approval_order);

  // Get position-specific hierarchies
  const getPositionHierarchies = (positionId: string) => {
    return allHierarchies.filter(
      h => h.applicant_position_id === positionId
    ).sort((a, b) => a.approval_order - b.approval_order);
  };

  // Get positions that have custom approval chains
  const positionsWithCustomChains = allPositions.filter(p => 
    allHierarchies.some(h => h.applicant_position_id === p.id)
  );

  // Get CEO position
  const ceoPosition = allPositions.find(p => p.is_ceo_position);

  const createMutation = useMutation({
    mutationFn: approvalHierarchyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-hierarchies'] });
      toast.success('Approver added to chain');
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: approvalHierarchyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-hierarchies'] });
      toast.success('Approver removed from chain');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedApproverPosition('');
    setIsFinalApprover(false);
    setIsOptional(false);
    setDialogApplicantPositionId(null);
  };

  const handleOpenDialog = (type: UserType, applicantPositionId: string | null = null) => {
    setDialogApplicantType(type);
    setDialogApplicantPositionId(applicantPositionId);
    setIsDialogOpen(true);
  };

  const handleAddApprover = () => {
    if (!selectedApproverPosition) {
      toast.error('Please select an approver position');
      return;
    }

    // Get the current chain based on whether it's position-specific or global
    let currentChain;
    if (dialogApplicantPositionId) {
      currentChain = getPositionHierarchies(dialogApplicantPositionId);
    } else {
      currentChain = dialogApplicantType === 'officer' ? officerHierarchies : staffHierarchies;
    }
    
    const nextOrder = currentChain.length > 0 
      ? Math.max(...currentChain.map(h => h.approval_order)) + 1 
      : 1;

    createMutation.mutate({
      applicant_type: dialogApplicantType,
      applicant_position_id: dialogApplicantPositionId,
      approver_position_id: selectedApproverPosition,
      approval_order: nextOrder,
      is_final_approver: isFinalApprover,
      is_optional: isOptional
    });
  };

  const handleDeleteApprover = (id: string) => {
    if (confirm('Remove this approver from the chain?')) {
      deleteMutation.mutate(id);
    }
  };

  const getPositionName = (positionId: string) => {
    const pos = allPositions.find(p => p.id === positionId);
    return pos?.display_name || 'Unknown';
  };

  const isCEOPosition = (positionId: string) => {
    const pos = allPositions.find(p => p.id === positionId);
    return pos?.is_ceo_position || false;
  };

  const getAvailableApprovers = (currentChain: typeof officerHierarchies) => {
    return allPositions.filter(p => 
      !currentChain.some(h => h.approver_position_id === p.id)
    );
  };

  // Get available approvers for the dialog
  const getDialogAvailableApprovers = () => {
    let currentChain;
    if (dialogApplicantPositionId) {
      currentChain = getPositionHierarchies(dialogApplicantPositionId);
    } else {
      currentChain = dialogApplicantType === 'officer' ? officerHierarchies : staffHierarchies;
    }
    return getAvailableApprovers(currentChain);
  };

  const availableApprovers = getDialogAvailableApprovers();

  const handleAddPositionConfig = () => {
    if (!selectedPositionForConfig) {
      toast.error('Please select a position');
      return;
    }
    // Open dialog to add first approver for this position
    const position = allPositions.find(p => p.id === selectedPositionForConfig);
    if (position) {
      handleOpenDialog('staff', selectedPositionForConfig);
      setSelectedPositionForConfig('');
    }
  };

  // Get positions that don't have custom chains yet (excluding CEO)
  const availablePositionsForConfig = allPositions.filter(p => 
    !p.is_ceo_position && 
    !positionsWithCustomChains.some(pc => pc.id === p.id)
  );

  const renderApprovalChain = (
    type: UserType, 
    hierarchies: typeof officerHierarchies, 
    icon: React.ReactNode,
    badgeClass: string,
    label: string,
    applicantPositionId: string | null = null
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {label} Leave Approval Chain
            </CardTitle>
            <CardDescription>
              {applicantPositionId 
                ? `Custom approval chain for ${label} position`
                : `When any ${label.toLowerCase()} applies for leave, approvals follow this sequence`
              }
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog(type, applicantPositionId)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Approver
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Chain */}
        {hierarchies.length === 0 ? (
          <div className="text-center py-8 border rounded-lg bg-muted/30">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium">No Approval Chain Configured</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Add approvers to create the leave approval workflow for {label.toLowerCase()}s
            </p>
            <Button className="mt-4" onClick={() => handleOpenDialog(type, applicantPositionId)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Approver
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={`py-2 px-4 ${badgeClass}`}>
              <Users className="h-4 w-4 mr-2" />
              {label} (Applicant)
            </Badge>
            {hierarchies.map((h, index) => (
              <div key={h.id} className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge 
                  className={`py-2 px-4 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors group ${
                    isCEOPosition(h.approver_position_id) ? 'bg-primary' : 'bg-green-500/20 text-green-700'
                  }`}
                  onClick={() => handleDeleteApprover(h.id)}
                >
                  <span className="group-hover:hidden flex items-center gap-2">
                    {isCEOPosition(h.approver_position_id) && <Crown className="h-3 w-3" />}
                    {index + 1}. {getPositionName(h.approver_position_id)}
                  </span>
                  <span className="hidden group-hover:inline"><Trash2 className="h-3 w-3" /></span>
                  {h.is_final_approver && <span className="ml-2 text-xs opacity-70">(Final)</span>}
                  {h.is_optional && <span className="ml-2 text-xs opacity-70">(Optional)</span>}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {hierarchies.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Chain Details</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Approver Position</TableHead>
                  <TableHead>CEO</TableHead>
                  <TableHead>Final Approver</TableHead>
                  <TableHead>Optional</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hierarchies.map(h => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <Badge variant="outline">{h.approval_order}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {isCEOPosition(h.approver_position_id) && (
                          <Crown className="h-4 w-4 text-primary" />
                        )}
                        {getPositionName(h.approver_position_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isCEOPosition(h.approver_position_id) ? (
                        <Badge className="bg-primary/20 text-primary">Yes</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {h.is_final_approver ? (
                        <Badge className="bg-green-500/20 text-green-600">Yes</Badge>
                      ) : 'No'}
                    </TableCell>
                    <TableCell>{h.is_optional ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteApprover(h.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderPositionSpecificChain = (position: typeof allPositions[0]) => {
    const hierarchies = getPositionHierarchies(position.id);
    return (
      <div key={position.id} className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">{position.display_name}</h3>
            <Badge variant="outline" className="text-xs">Custom Chain</Badge>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog('staff', position.id)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        
        {hierarchies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No approvers configured. Will use global chain.</p>
        ) : (
          <>
            {/* Visual chain */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="py-1.5 px-3 bg-orange-500/20 text-orange-700">
                {position.display_name}
              </Badge>
              {hierarchies.map((h, index) => (
                <div key={h.id} className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge 
                    className={`py-1.5 px-3 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors group ${
                      isCEOPosition(h.approver_position_id) ? 'bg-primary' : 'bg-green-500/20 text-green-700'
                    }`}
                    onClick={() => handleDeleteApprover(h.id)}
                  >
                    <span className="group-hover:hidden flex items-center gap-1">
                      {isCEOPosition(h.approver_position_id) && <Crown className="h-3 w-3" />}
                      {index + 1}. {getPositionName(h.approver_position_id)}
                      {h.is_final_approver && <span className="text-xs opacity-70">(Final)</span>}
                    </span>
                    <span className="hidden group-hover:inline"><Trash2 className="h-3 w-3" /></span>
                  </Badge>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Leave Approval Configuration</h1>
          <p className="text-muted-foreground">
            Configure who approves leave applications for Officers, Staff, and specific positions
          </p>
        </div>

        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global" className="gap-2">
              <GitBranch className="h-4 w-4" />
              Global Chains
            </TabsTrigger>
            <TabsTrigger value="position" className="gap-2">
              <UserCog className="h-4 w-4" />
              Position-Specific
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Leave Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-6">
            <Alert className="bg-primary/5 border-primary/20">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>Global chains</strong> apply to all Officers or Staff members unless they have a position with a custom approval chain configured.
              </AlertDescription>
            </Alert>

            {/* Officer Approval Chain */}
            {renderApprovalChain(
              'officer',
              officerHierarchies,
              <GitBranch className="h-5 w-5" />,
              'bg-blue-500/20 text-blue-700',
              'Officer'
            )}

            {/* Staff Approval Chain */}
            {renderApprovalChain(
              'staff',
              staffHierarchies,
              <Briefcase className="h-5 w-5" />,
              'bg-purple-500/20 text-purple-700',
              'Staff'
            )}
          </TabsContent>

          <TabsContent value="position" className="space-y-6">
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <strong>Position-specific chains</strong> override the global chain. If a staff member has a position with a custom chain, that chain will be used instead of the global staff chain.
              </AlertDescription>
            </Alert>

            {/* Add new position config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Add Position-Specific Approval Chain
                </CardTitle>
                <CardDescription>
                  Create a custom approval chain for a specific position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Select value={selectedPositionForConfig} onValueChange={setSelectedPositionForConfig}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select a position..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePositionsForConfig.map(pos => (
                        <SelectItem key={pos.id} value={pos.id}>
                          {pos.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddPositionConfig} disabled={!selectedPositionForConfig}>
                    <Plus className="h-4 w-4 mr-2" />
                    Configure Chain
                  </Button>
                </div>
                {availablePositionsForConfig.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    All positions already have custom chains or are CEO positions.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Existing position-specific chains */}
            {positionsWithCustomChains.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Configured Position Chains</CardTitle>
                  <CardDescription>
                    These positions have custom approval chains that override the global chain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {positionsWithCustomChains.map(position => renderPositionSpecificChain(position))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium">No Position-Specific Chains</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    All positions currently use the global approval chain. Add a position above to create a custom chain.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Leave Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {/* GPS Check-in/Check-out Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {leaveSettings.gps_checkin_enabled ? (
                    <MapPin className="h-5 w-5 text-green-600" />
                  ) : (
                    <MapPinOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  GPS-Based Check-in/Check-out
                </CardTitle>
                <CardDescription>
                  Control whether employees need to provide GPS location during attendance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Enable GPS Verification</span>
                      {leaveSettings.gps_checkin_enabled ? (
                        <Badge className="bg-green-500">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      When enabled, employees must provide their GPS location during check-in and check-out.
                    </p>
                  </div>
                  <Switch
                    checked={leaveSettings.gps_checkin_enabled}
                    disabled={isSavingGps}
                    onCheckedChange={async (checked) => {
                      setIsSavingGps(true);
                      try {
                        await leaveSettingsService.updateSetting('gps_checkin_enabled', checked);
                        setLeaveSettings(prev => ({ ...prev, gps_checkin_enabled: checked }));
                        toast.success(checked ? 'GPS verification enabled' : 'GPS verification disabled');
                      } catch (error) {
                        toast.error('Failed to update GPS setting');
                      } finally {
                        setIsSavingGps(false);
                      }
                    }}
                  />
                </div>
                
                {!leaveSettings.gps_checkin_enabled && (
                  <Alert className="bg-amber-500/10 border-amber-500/20">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-sm">
                      <strong>GPS Disabled:</strong> Employees can check in/out without location verification. 
                      Only time will be recorded. Enable this setting when GPS issues are resolved.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Alert className="bg-green-500/10 border-green-500/20">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm">
                <strong>Leave Settings</strong> configure the default leave policy for all employees. These values are used when calculating leave balances and entitlements.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Leave Policy Configuration
                </CardTitle>
                <CardDescription>
                  Configure default leave allowances and carry-over rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="leaves_per_year">Leaves Per Year</Label>
                    <Input
                      id="leaves_per_year"
                      type="number"
                      min="0"
                      value={leaveSettings.leaves_per_year}
                      onChange={(e) => setLeaveSettings({
                        ...leaveSettings,
                        leaves_per_year: parseInt(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Total leaves allocated per year for full-time employees
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leaves_per_month">Leaves Per Month</Label>
                    <Input
                      id="leaves_per_month"
                      type="number"
                      min="0"
                      value={leaveSettings.leaves_per_month}
                      onChange={(e) => setLeaveSettings({
                        ...leaveSettings,
                        leaves_per_month: parseInt(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leaves credited each month
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_carry_forward">Max Carry Forward</Label>
                    <Input
                      id="max_carry_forward"
                      type="number"
                      min="0"
                      value={leaveSettings.max_carry_forward}
                      onChange={(e) => setLeaveSettings({
                        ...leaveSettings,
                        max_carry_forward: parseInt(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum leaves that can be carried to the next month
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_leaves_per_month">Max Leaves Per Month</Label>
                    <Input
                      id="max_leaves_per_month"
                      type="number"
                      min="0"
                      value={leaveSettings.max_leaves_per_month}
                      onChange={(e) => setLeaveSettings({
                        ...leaveSettings,
                        max_leaves_per_month: parseInt(e.target.value) || 0
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum leaves allowed in a single month (including carry-over)
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button 
                    onClick={async () => {
                      setIsSavingSettings(true);
                      try {
                        await leaveSettingsService.updateAllSettings(leaveSettings);
                        toast.success('Leave settings saved successfully');
                      } catch (error) {
                        toast.error('Failed to save leave settings');
                      } finally {
                        setIsSavingSettings(false);
                      }
                    }}
                    disabled={isSavingSettings}
                  >
                    {isSavingSettings ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Configuration Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{leaveSettings.leaves_per_year}</p>
                    <p className="text-xs text-muted-foreground">Leaves/Year</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{leaveSettings.leaves_per_month}</p>
                    <p className="text-xs text-muted-foreground">Leaves/Month</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{leaveSettings.max_carry_forward}</p>
                    <p className="text-xs text-muted-foreground">Max Carry Forward</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{leaveSettings.max_leaves_per_month}</p>
                    <p className="text-xs text-muted-foreground">Max/Month</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Approver Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogApplicantPositionId 
                  ? `Add Approver for ${getPositionName(dialogApplicantPositionId)}`
                  : `Add Approver to ${dialogApplicantType === 'officer' ? 'Officer' : 'Staff'} Chain`
                }
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Approver Position</Label>
                <Select value={selectedApproverPosition} onValueChange={setSelectedApproverPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableApprovers.map(pos => (
                      <SelectItem key={pos.id} value={pos.id}>
                        <div className="flex items-center gap-2">
                          {pos.is_ceo_position && <Crown className="h-4 w-4 text-primary" />}
                          {pos.display_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableApprovers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    All positions are already in the approval chain
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Final Approver</Label>
                  <p className="text-xs text-muted-foreground">This approver's decision is final</p>
                </div>
                <Switch checked={isFinalApprover} onCheckedChange={setIsFinalApprover} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Optional</Label>
                  <p className="text-xs text-muted-foreground">Can be skipped in the chain</p>
                </div>
                <Switch checked={isOptional} onCheckedChange={setIsOptional} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
              <Button 
                onClick={handleAddApprover} 
                disabled={createMutation.isPending || !selectedApproverPosition}
              >
                Add Approver
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
