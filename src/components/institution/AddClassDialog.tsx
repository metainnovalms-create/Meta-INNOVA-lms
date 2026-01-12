import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InstitutionClass } from '@/types/student';

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (classData: Partial<InstitutionClass>) => void;
  existingClass?: InstitutionClass | null;
  institutionId: string;
}

export function AddClassDialog({ open, onOpenChange, onSave, existingClass, institutionId }: AddClassDialogProps) {
  const [formData, setFormData] = useState<Partial<InstitutionClass>>({
    class_name: '',
    display_order: 1,
    academic_year: '2024-2025',
    capacity: 40,
    room_number: '',
    status: 'active'
  });

  useEffect(() => {
    if (existingClass) {
      setFormData({
        class_name: existingClass.class_name,
        display_order: existingClass.display_order,
        academic_year: existingClass.academic_year,
        capacity: existingClass.capacity,
        room_number: existingClass.room_number,
        status: existingClass.status
      });
    } else {
      setFormData({
        class_name: '',
        display_order: 1,
        academic_year: '2024-2025',
        capacity: 40,
        room_number: '',
        status: 'active'
      });
    }
  }, [existingClass, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      institution_id: institutionId,
      created_at: existingClass?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{existingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
          <DialogDescription>
            Create a custom class name for this institution (e.g., "Grade 1 A", "Class 2D", "Standard V-B")
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Class Name */}
          <div className="space-y-2">
            <Label htmlFor="class_name">Class Name *</Label>
            <Input
              id="class_name"
              placeholder="e.g., Grade 1 A, Class 2D, Standard V-B"
              value={formData.class_name}
              onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              required
            />
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              min="1"
              value={formData.display_order}
              onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
            />
          </div>

          {/* Academic Year */}
          <div className="space-y-2">
            <Label htmlFor="academic_year">Academic Year</Label>
            <Input
              id="academic_year"
              placeholder="e.g., 2024-2025"
              value={formData.academic_year}
              onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
            />
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Student Capacity (Optional)</Label>
            <Input
              id="capacity"
              type="number"
              min="1"
              placeholder="e.g., 40"
              value={formData.capacity || ''}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })}
            />
          </div>

          {/* Room Number */}
          <div className="space-y-2">
            <Label htmlFor="room_number">Room Number (Optional)</Label>
            <Input
              id="room_number"
              placeholder="e.g., Room 101"
              value={formData.room_number || ''}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {existingClass ? 'Update Class' : 'Create Class'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
