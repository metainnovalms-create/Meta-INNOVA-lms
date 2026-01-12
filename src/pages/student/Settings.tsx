import { Layout } from '@/components/layout/Layout';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { passwordService } from '@/services/password.service';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function StudentSettings() {
  const { user } = useAuth();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    // Simulate API call to change password
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In real implementation, validate current password first
    const isCurrentPasswordValid = true; // Mock validation
    
    if (!isCurrentPasswordValid) {
      throw new Error('Incorrect current password');
    }
    
    console.log('Password changed successfully');
    toast.success('Password changed successfully!');
  };

  const handleRequestPasswordReset = async () => {
    if (!user?.email) {
      toast.error('Email not found. Please contact your institution admin.');
      return;
    }

    setIsRequestingReset(true);
    try {
      await passwordService.requestPasswordReset(user.email);
      toast.success('Password reset request sent to admin team');
      toast.info(`A reset link will be sent to ${user.email} by your institution admin`, {
        duration: 5000,
      });
      setShowResetDialog(false);
    } catch (error) {
      toast.error('Failed to send reset request. Please try again.');
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <>
      <Layout>
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account security and preferences
            </p>
          </div>

          {/* Change Password Section */}
          <ChangePasswordForm onChangePassword={handleChangePassword} />

          {/* Password Reset Request Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Forgot Your Password?</CardTitle>
                  <CardDescription>
                    Request a password reset link from your institution admin
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    If you don't remember your current password, you can request a reset link. 
                    The admin team of your institution will send a secure link to your registered email address.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Your registered email:</strong> {user?.email || 'Not available'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Institution ID:</strong> {user?.institution_id || 'Not available'}
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setShowResetDialog(true)}
                  className="w-full sm:w-auto"
                >
                  Request Password Reset
                </Button>

                <p className="text-xs text-muted-foreground">
                  Note: If you don't receive the reset link within 24 hours, please contact your institution admin directly.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{user?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{user?.role?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Institution ID</p>
                  <p className="font-medium">{user?.institution_id || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Password Reset?</AlertDialogTitle>
            <AlertDialogDescription>
              A password reset request will be sent to the admin team of your institution. They will send a secure reset link to{' '}
              <strong>{user?.email}</strong>.
              <br /><br />
              This may take up to 24 hours. If you don't receive the link, please contact your institution admin directly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRequestingReset}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestPasswordReset} disabled={isRequestingReset}>
              {isRequestingReset ? 'Sending...' : 'Send Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
