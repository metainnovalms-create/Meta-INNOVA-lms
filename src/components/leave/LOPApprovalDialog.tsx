import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { LeaveApplication } from '@/types/leave';
import { format, parseISO } from 'date-fns';
import { ApplicantLeaveBalanceCard } from './ApplicantLeaveBalanceCard';

interface LOPApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: LeaveApplication | null;
  onConfirm: (lopDays: number, paidDays: number, comments: string) => void;
  isPending?: boolean;
}

export function LOPApprovalDialog({ 
  open, 
  onOpenChange, 
  application, 
  onConfirm,
  isPending 
}: LOPApprovalDialogProps) {
  const [lopMode, setLopMode] = useState<'complete' | 'partial'>('complete');
  const [paidDaysInput, setPaidDaysInput] = useState('0');
  const [comments, setComments] = useState('');

  if (!application) return null;

  const totalDays = application.total_days;
  const paidDays = lopMode === 'complete' ? 0 : Math.min(parseInt(paidDaysInput) || 0, totalDays);
  const lopDays = totalDays - paidDays;

  const handleConfirm = () => {
    onConfirm(lopDays, paidDays, comments);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setLopMode('complete');
      setPaidDaysInput('0');
      setComments('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Mark as Loss of Pay (LOP)
          </DialogTitle>
          <DialogDescription>
            Approve this leave with LOP deduction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Application Summary */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Applicant</span>
              <span className="font-medium">{application.applicant_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date Range</span>
              <span className="font-medium">
                {format(parseISO(application.start_date), 'PP')} - {format(parseISO(application.end_date), 'PP')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Days</span>
              <Badge variant="secondary">{totalDays} day(s)</Badge>
            </div>
          </div>

          {/* Applicant Leave Balance */}
          <ApplicantLeaveBalanceCard
            applicantId={application.applicant_id}
            leaveMonth={parseISO(application.start_date).getMonth() + 1}
            leaveYear={parseISO(application.start_date).getFullYear()}
            requestedDays={totalDays}
            compact
          />

          {/* LOP Mode Selection */}
          <div className="space-y-3">
            <Label>LOP Type</Label>
            <RadioGroup value={lopMode} onValueChange={(v) => setLopMode(v as 'complete' | 'partial')}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="complete" id="complete" />
                <Label htmlFor="complete" className="flex-1 cursor-pointer">
                  <div className="font-medium">Complete LOP</div>
                  <div className="text-sm text-muted-foreground">
                    All {totalDays} day(s) will be marked as LOP
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="partial" id="partial" />
                <Label htmlFor="partial" className="flex-1 cursor-pointer">
                  <div className="font-medium">Partial LOP</div>
                  <div className="text-sm text-muted-foreground">
                    Some days will be paid, rest as LOP
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Partial LOP Input */}
          {lopMode === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="paidDays">Number of Paid Days</Label>
              <Input
                id="paidDays"
                type="number"
                min="0"
                max={totalDays}
                value={paidDaysInput}
                onChange={(e) => setPaidDaysInput(e.target.value)}
                placeholder="Enter number of paid days"
              />
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">Paid: {paidDays} day(s)</span>
                <span className="text-red-600">LOP: {lopDays} day(s)</span>
              </div>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments about this LOP approval..."
              rows={3}
            />
          </div>

          {/* Summary */}
          <div className="bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">LOP Summary</span>
            </div>
            <div className="text-sm space-y-1">
              <p>• <span className="text-green-600 font-medium">{paidDays}</span> day(s) will be paid</p>
              <p>• <span className="text-red-600 font-medium">{lopDays}</span> day(s) will be deducted from salary</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isPending || (lopMode === 'partial' && lopDays <= 0)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isPending ? 'Processing...' : 'Approve with LOP'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
