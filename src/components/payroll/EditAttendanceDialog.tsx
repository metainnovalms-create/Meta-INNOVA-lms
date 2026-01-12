import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { DailyAttendanceRecord } from '@/services/payroll.service';

interface EditAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: DailyAttendanceRecord | null;
  onSuccess: () => void;
}

export function EditAttendanceDialog({ 
  open, 
  onOpenChange, 
  record,
  onSuccess 
}: EditAttendanceDialogProps) {
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when record changes
  useState(() => {
    if (record) {
      setCheckInTime(record.check_in_time ? format(parseISO(record.check_in_time), 'HH:mm') : '');
      setCheckOutTime(record.check_out_time ? format(parseISO(record.check_out_time), 'HH:mm') : '');
      setStatus(record.status || 'not_checked_in');
      setNotes(record.notes || '');
    }
  });

  const handleSubmit = async () => {
    if (!record) return;
    
    setIsSubmitting(true);
    try {
      const table = record.user_type === 'officer' ? 'officer_attendance' : 'staff_attendance';
      
      // Build the update object
      const updateData: Record<string, any> = {
        status,
        notes: notes || null,
        updated_at: new Date().toISOString()
      };
      
      // Handle check-in time
      if (checkInTime) {
        const checkInDate = new Date(`${record.date}T${checkInTime}:00`);
        updateData.check_in_time = checkInDate.toISOString();
      }
      
      // Handle check-out time
      if (checkOutTime) {
        const checkOutDate = new Date(`${record.date}T${checkOutTime}:00`);
        updateData.check_out_time = checkOutDate.toISOString();
        
        // Calculate total hours worked if both times are set
        if (checkInTime) {
          const checkInDate = new Date(`${record.date}T${checkInTime}:00`);
          const checkOutDateObj = new Date(`${record.date}T${checkOutTime}:00`);
          const hoursWorked = (checkOutDateObj.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);
          updateData.total_hours_worked = Math.max(0, hoursWorked);
          updateData.status = 'checked_out';
        }
      }
      
      // Mark as leave or holiday if selected
      if (status === 'leave' || status === 'holiday') {
        updateData.check_in_time = null;
        updateData.check_out_time = null;
        updateData.total_hours_worked = 0;
      }
      
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', record.id);
      
      if (error) throw error;
      
      toast.success('Attendance record updated');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Attendance Record</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Employee</Label>
            <p className="text-sm font-medium">{record.user_name}</p>
          </div>
          
          <div className="grid gap-2">
            <Label>Date</Label>
            <p className="text-sm">{format(parseISO(record.date), 'PPP')}</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="checked_out">Checked Out</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="no_pay">No Pay / LOP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {status !== 'leave' && status !== 'holiday' && status !== 'no_pay' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="checkIn">Check-in Time</Label>
                <Input
                  id="checkIn"
                  type="time"
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="checkOut">Check-out Time</Label>
                <Input
                  id="checkOut"
                  type="time"
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                />
              </div>
            </>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Admin Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add notes about this correction..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
