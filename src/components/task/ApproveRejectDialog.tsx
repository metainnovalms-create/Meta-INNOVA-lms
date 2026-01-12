import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ApproveRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'approve' | 'reject';
  onConfirm: (reason?: string) => void;
  taskTitle: string;
}

export function ApproveRejectDialog({
  open,
  onOpenChange,
  mode,
  onConfirm,
  taskTitle,
}: ApproveRejectDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(mode === 'reject' ? reason : undefined);
    setReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'approve' ? 'Approve Task' : 'Reject Task'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {mode === 'approve' 
              ? `Are you sure you want to approve "${taskTitle}"? This will mark the task as completed.`
              : `Please provide a reason for rejecting "${taskTitle}".`
            }
          </p>

          {mode === 'reject' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why the task is being rejected..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mode === 'reject' && !reason.trim()}
            className={mode === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            variant={mode === 'reject' ? 'destructive' : 'default'}
          >
            {mode === 'approve' ? 'Approve Task' : 'Reject Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
