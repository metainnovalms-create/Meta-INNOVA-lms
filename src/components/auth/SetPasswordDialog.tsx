import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { passwordService } from '@/services/password.service';
import { z } from 'zod';

const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[A-Z]/, 'Contains uppercase letter')
  .regex(/[a-z]/, 'Contains lowercase letter')
  .regex(/[0-9]/, 'Contains number')
  .regex(/[^A-Za-z0-9]/, 'Contains special character');

interface SetPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  userId: string;
  userType: 'meta_employee' | 'officer' | 'institution_admin' | 'student';
  onSetPassword?: (password: string) => Promise<void>;
}

export function SetPasswordDialog({
  open,
  onClose,
  userName,
  userEmail,
  userId,
  userType,
  onSetPassword
}: SetPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Password strength validation
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strengthScore = Object.values(checks).filter(Boolean).length;
  const getStrengthLabel = () => {
    if (strengthScore <= 2) return { label: 'Weak', color: 'text-red-500' };
    if (strengthScore <= 4) return { label: 'Medium', color: 'text-orange-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  const isValid = Object.values(checks).every(Boolean);

  const handleGeneratePassword = () => {
    const generated = passwordService.generateStrongPassword();
    setPassword(generated);
    setShowPassword(true);
    toast.success('Strong password generated');
  };

  const handleSubmit = async () => {
    if (!isValid) {
      toast.error('Password does not meet requirements');
      return;
    }

    setIsLoading(true);
    try {
      if (onSetPassword) {
        await onSetPassword(password);
      } else {
        await passwordService.setPassword(userId, password, userType);
      }
      toast.success(`Password set successfully for ${userName}`);
      onClose();
      setPassword('');
    } catch (error) {
      toast.error('Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setShowPassword(false);
    }
  }, [open]);

  const strength = getStrengthLabel();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Password for {userName}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {userEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="pr-10"
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

            {password && (
              <div className="flex items-center gap-2 text-sm">
                <span>Strength:</span>
                <span className={`font-medium ${strength.color}`}>{strength.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      strengthScore <= 2 ? 'bg-red-500' :
                      strengthScore <= 4 ? 'bg-orange-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(strengthScore / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGeneratePassword}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Strong Password
          </Button>

          <div className="space-y-2 border rounded-md p-3 bg-muted/50">
            <p className="text-sm font-medium">Password Requirements:</p>
            <div className="space-y-1">
              {[
                { key: 'length', label: 'At least 8 characters' },
                { key: 'uppercase', label: 'Contains uppercase letter' },
                { key: 'lowercase', label: 'Contains lowercase letter' },
                { key: 'number', label: 'Contains number' },
                { key: 'special', label: 'Contains special character (!@#$%^&*)' },
              ].map((req) => (
                <div key={req.key} className="flex items-center gap-2 text-sm">
                  {checks[req.key as keyof typeof checks] ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className={checks[req.key as keyof typeof checks] ? 'text-foreground' : 'text-muted-foreground'}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? 'Setting Password...' : 'Set Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
