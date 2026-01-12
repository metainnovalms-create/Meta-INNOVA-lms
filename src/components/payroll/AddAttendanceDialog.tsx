import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { createAttendanceRecord } from '@/services/payroll.service';

interface Employee {
  id: string;
  name: string;
  email: string;
  type: 'officer' | 'staff';
}

interface AddAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onSuccess: () => void;
}

export function AddAttendanceDialog({ 
  open, 
  onOpenChange, 
  date,
  onSuccess 
}: AddAttendanceDialogProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [checkInTime, setCheckInTime] = useState('09:00');
  const [checkOutTime, setCheckOutTime] = useState('18:00');
  const [status, setStatus] = useState('checked_out');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    if (open) {
      loadEmployees();
      // Reset form
      setSelectedEmployee('');
      setCheckInTime('09:00');
      setCheckOutTime('18:00');
      setStatus('checked_out');
      setNotes('');
    }
  }, [open, date]);

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const allEmployees: Employee[] = [];
      
      // Fetch officers
      const { data: officers } = await supabase
        .from('officers')
        .select('id, full_name, email, user_id')
        .eq('status', 'active');
      
      if (officers) {
        for (const officer of officers) {
          allEmployees.push({
            id: officer.user_id || officer.id,
            name: officer.full_name,
            email: officer.email,
            type: 'officer'
          });
        }
      }
      
      // Fetch staff from profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, position_id, is_ceo')
        .not('position_id', 'is', null);
      
      if (profiles) {
        for (const profile of profiles) {
          if (profile.is_ceo) continue;
          if (allEmployees.some(e => e.id === profile.id)) continue;
          
          allEmployees.push({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            type: 'staff'
          });
        }
      }
      
      setEmployees(allEmployees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedEmployee || !date) {
      toast.error('Please select an employee');
      return;
    }
    
    const employee = employees.find(e => e.id === selectedEmployee);
    if (!employee) {
      toast.error('Employee not found');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await createAttendanceRecord(
        selectedEmployee,
        employee.type,
        date,
        status,
        status !== 'leave' && status !== 'holiday' && status !== 'no_pay' ? checkInTime : undefined,
        status !== 'leave' && status !== 'holiday' && status !== 'no_pay' ? checkOutTime : undefined,
        notes || `Manual entry by admin`
      );
      
      if (success) {
        toast.success('Attendance record created');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error('Failed to create attendance record');
      }
    } catch (error) {
      console.error('Error creating attendance:', error);
      toast.error('Failed to create attendance record');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Attendance Record</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Date</Label>
            <p className="text-sm font-medium">
              {date && format(parseISO(date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="employee">Employee</Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingEmployees ? "Loading..." : "Select employee"} />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.type === 'officer' ? 'Officer' : 'Staff'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checked_out">Present (Checked Out)</SelectItem>
                <SelectItem value="checked_in">Checked In Only</SelectItem>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Reason for manual entry..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedEmployee}>
            {isSubmitting ? 'Creating...' : 'Create Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
