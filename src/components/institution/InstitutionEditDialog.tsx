import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Key, Users, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Institution {
  id: string;
  name: string;
  slug: string;
  max_users: number;
  license_expiry: string;
  license_type: string;
  subscription_status: 'active' | 'inactive' | 'suspended';
  admin_email?: string;
  admin_user_id?: string;
}

interface InstitutionEditDialogProps {
  institution: Institution | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Institution>) => Promise<void>;
}

export function InstitutionEditDialog({ 
  institution, 
  open, 
  onOpenChange,
  onSave 
}: InstitutionEditDialogProps) {
  const [maxUsers, setMaxUsers] = useState(institution?.max_users || 500);
  const [licenseExpiry, setLicenseExpiry] = useState(institution?.license_expiry || '');
  const [licenseType, setLicenseType] = useState(institution?.license_type || 'basic');
  const [isActive, setIsActive] = useState(institution?.subscription_status === 'active');
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Reset form when institution changes
  useState(() => {
    if (institution) {
      setMaxUsers(institution.max_users || 500);
      setLicenseExpiry(institution.license_expiry || '');
      setLicenseType(institution.license_type || 'basic');
      setIsActive(institution.subscription_status === 'active');
      setNewPassword('');
      setShowPasswordSection(false);
    }
  });

  const handleSave = async () => {
    if (!institution) return;
    
    setIsSaving(true);
    try {
      // Update institution directly in database with new columns
      const { error } = await supabase
        .from('institutions')
        .update({
          max_users: maxUsers,
          license_expiry: licenseExpiry || null, // Convert empty string to null for date field
          license_type: licenseType,
          status: isActive ? 'active' : 'inactive',
        })
        .eq('id', institution.id);

      if (error) {
        throw new Error(error.message);
      }

      // Also call the hook's onSave for cache invalidation
      await onSave(institution.id, {
        max_users: maxUsers,
        license_expiry: licenseExpiry,
        license_type: licenseType,
        subscription_status: isActive ? 'active' : 'inactive',
      });
      
      toast.success('Institution updated successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update institution:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update institution');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!institution || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsResettingPassword(true);
    try {
      // Call the edge function to reset password
      const { data, error } = await supabase.functions.invoke('reset-institution-admin-password', {
        body: {
          institution_id: institution.id,
          new_password: newPassword,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Admin password reset successfully');
      setNewPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  if (!institution) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Institution: {institution.name}</DialogTitle>
          <DialogDescription>
            Update license settings, user limits, and account status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* License Settings */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              License Settings
            </h4>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="license_type">License Type</Label>
                <Select value={licenseType} onValueChange={setLicenseType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_users" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Max Users
                </Label>
                <Input
                  id="max_users"
                  type="number"
                  min={1}
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_expiry" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                License Expiry Date
              </Label>
              <Input
                id="license_expiry"
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
              />
            </div>
          </div>

          {/* Account Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Account Status</Label>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Institution account is active' : 'Institution account is inactive'}
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          {/* Password Reset Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                Admin Password Reset
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? 'Cancel' : 'Reset Password'}
              </Button>
            </div>

            {showPasswordSection && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new_password"
                      type="text"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateRandomPassword}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will reset the password for the institution admin ({institution.admin_email || 'N/A'})
                  </p>
                </div>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || !newPassword}
                  className="w-full"
                  variant="destructive"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Confirm Password Reset'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}