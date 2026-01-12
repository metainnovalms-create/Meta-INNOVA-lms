import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface AdminResetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  email: string;
  onResetPassword: () => Promise<string>;
}

export function AdminResetPasswordDialog({
  open,
  onClose,
  userName,
  email,
  onResetPassword,
}: AdminResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordGenerated, setPasswordGenerated] = useState(false);

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const generatedPassword = await onResetPassword();
      setNewPassword(generatedPassword);
      setPasswordGenerated(true);
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setNewPassword('');
    setPasswordGenerated(false);
    setCopied(false);
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            Generate a new temporary password for {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input value={email} readOnly className="bg-muted" />
          </div>

          {!passwordGenerated ? (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to generate a new temporary password for this user.
              </p>
              <Button onClick={handleReset} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Generating...' : 'Generate New Password'}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">New Temporary Password</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={newPassword}
                      type={showPassword ? 'text' : 'password'}
                      readOnly
                      className="bg-muted font-mono pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
                <p className="text-sm text-amber-900 dark:text-amber-200">
                  <strong>Important:</strong> Share this password securely with the user. They must change it on their next login.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {passwordGenerated ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
