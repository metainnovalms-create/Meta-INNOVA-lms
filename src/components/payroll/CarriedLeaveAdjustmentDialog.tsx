/**
 * Carried Leave Adjustment Dialog
 * Allows CEO to manually adjust carried leave balances
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays, Plus, Minus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CarriedLeaveAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  employeeType: 'officer' | 'staff';
  currentCarriedLeave: number;
  onAdjustmentComplete?: () => void;
}

export function CarriedLeaveAdjustmentDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  employeeType,
  currentCarriedLeave,
  onAdjustmentComplete,
}: CarriedLeaveAdjustmentDialogProps) {
  const { user } = useAuth();
  const [adjustmentType, setAdjustmentType] = useState<'credit' | 'debit' | 'correction'>('credit');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate new value
  const newValue = (() => {
    const amount = parseFloat(adjustmentAmount) || 0;
    switch (adjustmentType) {
      case 'credit':
        return currentCarriedLeave + amount;
      case 'debit':
        return Math.max(0, currentCarriedLeave - amount);
      case 'correction':
        return amount;
      default:
        return currentCarriedLeave;
    }
  })();

  const handleSave = async () => {
    if (!user || !adjustmentAmount || !reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Find the leave balance record
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      const { data: balanceRecord, error: fetchError } = await supabase
        .from('leave_balances')
        .select('id, carried_forward')
        .eq('user_id', employeeId)
        .eq('user_type', employeeType)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!balanceRecord) {
        toast.error('Leave balance record not found');
        return;
      }

      // Update the leave balance
      const { error: updateError } = await supabase
        .from('leave_balances')
        .update({
          carried_forward: newValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', balanceRecord.id);

      if (updateError) throw updateError;

      // Log the adjustment
      const amount = parseFloat(adjustmentAmount);
      await supabase.from('leave_balance_adjustments').insert({
        leave_balance_id: balanceRecord.id,
        user_id: employeeId,
        user_type: employeeType,
        adjustment_type: adjustmentType,
        previous_value: currentCarriedLeave,
        new_value: newValue,
        adjustment_amount: adjustmentType === 'correction' ? newValue - currentCarriedLeave : 
          adjustmentType === 'debit' ? -amount : amount,
        reason: reason,
        adjusted_by: user.id,
        adjusted_by_name: user.name,
      });

      toast.success('Leave balance adjusted successfully');
      onOpenChange(false);
      onAdjustmentComplete?.();

      // Reset form
      setAdjustmentAmount('');
      setReason('');
      setAdjustmentType('credit');
    } catch (error) {
      console.error('Error adjusting leave balance:', error);
      toast.error('Failed to adjust leave balance');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Adjust Carried Leave
          </DialogTitle>
          <DialogDescription>
            Manually adjust carried leave balance for {employeeName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance Display */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Current Carried Leave</p>
              <p className="text-2xl font-bold">{currentCarriedLeave} days</p>
            </div>
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
          </div>

          {/* Adjustment Type */}
          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <Select
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as 'credit' | 'debit' | 'correction')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-600" />
                    <span>Credit (Add days)</span>
                  </div>
                </SelectItem>
                <SelectItem value="debit">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-600" />
                    <span>Debit (Remove days)</span>
                  </div>
                </SelectItem>
                <SelectItem value="correction">
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span>Set to exact value</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {adjustmentType === 'correction' ? 'New Balance (days)' : 'Amount (days)'}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.5"
              min="0"
              placeholder={adjustmentType === 'correction' ? 'Enter new balance' : 'Enter days'}
              value={adjustmentAmount}
              onChange={(e) => setAdjustmentAmount(e.target.value)}
            />
          </div>

          {/* Preview */}
          {adjustmentAmount && (
            <div className="flex items-center justify-center gap-3 p-3 bg-primary/5 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Current</p>
                <p className="font-semibold">{currentCarriedLeave}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">New</p>
                <p className="font-semibold text-primary">{newValue.toFixed(1)}</p>
              </div>
              <Badge
                variant="outline"
                className={
                  newValue > currentCarriedLeave
                    ? 'bg-green-500/10 text-green-700 border-green-500/20'
                    : newValue < currentCarriedLeave
                      ? 'bg-red-500/10 text-red-700 border-red-500/20'
                      : ''
                }
              >
                {newValue > currentCarriedLeave ? '+' : ''}
                {(newValue - currentCarriedLeave).toFixed(1)} days
              </Badge>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Adjustment *</Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for this adjustment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !adjustmentAmount || !reason.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
