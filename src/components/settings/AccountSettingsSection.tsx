import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Lock, Mail, KeyRound, CheckCircle2, XCircle, Loader2, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { passwordService } from '@/services/password.service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AccountSettingsSectionProps {
  showAccountInfo?: boolean;
}

export function AccountSettingsSection({ showAccountInfo = true }: AccountSettingsSectionProps) {
  const { user } = useAuth();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  
  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Password validation
  const passwordValidation = passwordService.validatePasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword !== '';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    if (!currentPassword) {
      setErrors(['Current password is required']);
      return;
    }

    if (!passwordValidation.valid) {
      setErrors(passwordValidation.errors);
      return;
    }

    if (!passwordsMatch) {
      setErrors(['Passwords do not match']);
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await passwordService.changePassword(
        user?.id || '',
        currentPassword,
        newPassword
      );

      if (result.success) {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrors([result.error || 'Failed to change password']);
      }
    } catch (error) {
      setErrors(['An unexpected error occurred']);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setIsRequestingReset(true);
    try {
      await passwordService.sendResetLink(
        user?.email || '',
        user?.name || 'User',
        user?.role || 'user',
        user?.id
      );
      setShowResetDialog(false);
    } catch (error) {
      toast.error('Failed to send reset link');
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {errors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password requirements */}
              {newPassword && (
                <div className="mt-2 space-y-1 text-sm">
                  <PasswordRequirement met={newPassword.length >= 8} text="At least 8 characters" />
                  <PasswordRequirement met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
                  <PasswordRequirement met={/[a-z]/.test(newPassword)} text="One lowercase letter" />
                  <PasswordRequirement met={/[0-9]/.test(newPassword)} text="One number" />
                  <PasswordRequirement met={/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)} text="One special character" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-1 text-sm mt-1">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-green-500">Passwords match</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">Passwords do not match</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isChangingPassword || !passwordValidation.valid || !passwordsMatch}
            >
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Request Password Reset Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Password Reset via Email
          </CardTitle>
          <CardDescription>
            Request a password reset link sent to your registered email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              If you've forgotten your current password or prefer to reset via email, 
              we'll send a secure reset link to <strong>{user?.email}</strong>.
            </p>
            <Button variant="outline" onClick={() => setShowResetDialog(true)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Request Reset Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Information Card */}
      {showAccountInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and security status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{user?.name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Role</Label>
                <Badge variant="outline" className="capitalize">
                  {user?.role?.replace('_', ' ') || 'N/A'}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Password Status</Label>
                <div className="flex items-center gap-2">
                  {user?.password_changed ? (
                    <>
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Password set</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600">Using temporary password</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {user?.password_changed_at && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Last password change: {new Date(user.password_changed_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Password Reset</AlertDialogTitle>
            <AlertDialogDescription>
              A password reset link will be sent to <strong>{user?.email}</strong>.
              The link will expire in 1 hour.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRequestingReset}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestPasswordReset} disabled={isRequestingReset}>
              {isRequestingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <XCircle className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={met ? 'text-green-500' : 'text-muted-foreground'}>{text}</span>
    </div>
  );
}
