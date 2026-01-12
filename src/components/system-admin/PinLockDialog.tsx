import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';

interface PinLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SYSTEM_PIN = '2580'; // Configurable system PIN

export function PinLockDialog({ open, onOpenChange, onSuccess }: PinLockDialogProps) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleVerify = () => {
    if (pin === SYSTEM_PIN) {
      toast.success('Access granted');
      onSuccess();
      onOpenChange(false);
      setPin('');
      setAttempts(0);
    } else {
      setAttempts(prev => prev + 1);
      toast.error('Incorrect PIN');
      setPin('');
      
      if (attempts >= 2) {
        toast.error('Too many attempts. Please contact administrator.');
        onOpenChange(false);
        setAttempts(0);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleVerify();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <DialogTitle>Protected Content</DialogTitle>
          </div>
          <DialogDescription>
            This section contains confidential information. Please enter your 4-digit PIN to access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              onKeyDown={handleKeyDown}
              maxLength={4}
              className="text-center text-2xl tracking-widest"
              autoFocus
            />
            {attempts > 0 && (
              <p className="text-sm text-destructive">
                Incorrect PIN. {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining.
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => {
                onOpenChange(false);
                setPin('');
                setAttempts(0);
              }}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleVerify}
              disabled={pin.length !== 4}
            >
              Verify
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
