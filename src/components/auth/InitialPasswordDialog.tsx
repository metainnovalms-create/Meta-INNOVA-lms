import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface InitialPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  email: string;
  tempPassword: string;
  userType: 'System Admin' | 'Management' | 'Innovation Officer' | 'Student';
}

export function InitialPasswordDialog({
  open,
  onClose,
  userName,
  email,
  tempPassword,
  userType,
}: InitialPasswordDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{userType} Created Successfully</DialogTitle>
          <DialogDescription>
            Temporary password generated for {userName}. Please share this with the user securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input value={email} readOnly className="bg-muted" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Temporary Password</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={tempPassword}
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
              <strong>Important:</strong> This password is shown only once. The user must change it on first login for security.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
