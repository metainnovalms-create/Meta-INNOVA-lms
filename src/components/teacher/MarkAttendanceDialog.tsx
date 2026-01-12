import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MarkAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MarkAttendanceDialog = ({ open, onOpenChange }: MarkAttendanceDialogProps) => {
  const [status, setStatus] = useState<'present' | 'leave'>('present');
  const [leaveType, setLeaveType] = useState<'sick' | 'casual' | 'earned'>('sick');
  const [leaveReason, setLeaveReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (status === 'present') {
      toast.success('Attendance marked as Present', {
        description: `Recorded at ${new Date().toLocaleTimeString()}`,
      });
    } else {
      toast.success('Leave application submitted', {
        description: `${leaveType.charAt(0).toUpperCase() + leaveType.slice(1)} leave applied`,
      });
    }
    
    setIsSubmitting(false);
    onOpenChange(false);
    
    // Reset form
    setStatus('present');
    setLeaveType('sick');
    setLeaveReason('');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark Today's Attendance</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <RadioGroup value={status} onValueChange={(v) => setStatus(v as 'present' | 'leave')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="present" id="present" />
              <Label htmlFor="present" className="cursor-pointer">
                Mark as Present
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="leave" id="leave" />
              <Label htmlFor="leave" className="cursor-pointer">
                Apply for Leave
              </Label>
            </div>
          </RadioGroup>
          
          {status === 'leave' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select value={leaveType} onValueChange={(v) => setLeaveType(v as typeof leaveType)}>
                  <SelectTrigger id="leaveType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="earned">Earned Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for leave..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || (status === 'leave' && !leaveReason)}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
