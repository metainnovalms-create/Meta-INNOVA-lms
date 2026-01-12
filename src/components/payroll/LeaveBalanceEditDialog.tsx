import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface LeaveBalanceEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monthName: string;
  year: number;
  initialCarriedForward: number;
  initialAdditionalCredit: number;
  initialReason: string;
  onSave: (data: { carriedForward: number; additionalCredit: number; reason: string }) => void;
}

export function LeaveBalanceEditDialog({
  open,
  onOpenChange,
  monthName,
  year,
  initialCarriedForward,
  initialAdditionalCredit,
  initialReason,
  onSave,
}: LeaveBalanceEditDialogProps) {
  const [carriedForward, setCarriedForward] = useState(initialCarriedForward);
  const [additionalCredit, setAdditionalCredit] = useState(initialAdditionalCredit);
  const [reason, setReason] = useState(initialReason);

  useEffect(() => {
    setCarriedForward(initialCarriedForward);
    setAdditionalCredit(initialAdditionalCredit);
    setReason(initialReason);
  }, [initialCarriedForward, initialAdditionalCredit, initialReason]);

  const handleSave = () => {
    onSave({ carriedForward, additionalCredit, reason });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Leave Balance - {monthName} {year}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="carried">Carried Forward</Label>
            <Input
              id="carried"
              type="number"
              min="0"
              value={carriedForward}
              onChange={(e) => setCarriedForward(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Leave days carried over from previous month
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional">Additional Credit</Label>
            <Input
              id="additional"
              type="number"
              min="0"
              value={additionalCredit}
              onChange={(e) => setAdditionalCredit(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Bonus leave or special allocation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for this adjustment..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
