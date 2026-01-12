import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SchoolTeacher, TimetableSlot } from "@/types/teacher";
import { useState, useEffect } from "react";
import { Clock, AlertCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TimetableAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: SchoolTeacher | null;
  existingSlots?: TimetableSlot[];
  onSave: (slots: TimetableSlot[]) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const TIME_SLOTS = [
  { start: '08:00', end: '09:00', label: '8:00 - 9:00 AM' },
  { start: '09:00', end: '10:00', label: '9:00 - 10:00 AM' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00 AM' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00 PM' },
  { start: '12:00', end: '13:00', label: '12:00 - 1:00 PM (Lunch)' },
  { start: '13:00', end: '14:00', label: '1:00 - 2:00 PM' },
  { start: '14:00', end: '15:00', label: '2:00 - 3:00 PM' },
  { start: '15:00', end: '16:00', label: '3:00 - 4:00 PM' },
  { start: '16:00', end: '17:00', label: '4:00 - 5:00 PM' },
];

const SESSION_TYPES = [
  { value: 'lecture', label: 'Lecture' },
  { value: 'lab', label: 'Lab' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'practical', label: 'Practical' },
] as const;

export function TimetableAssignmentDialog({ 
  open, 
  onOpenChange, 
  teacher, 
  existingSlots = [], 
  onSave 
}: TimetableAssignmentDialogProps) {
  const [slots, setSlots] = useState<TimetableSlot[]>(existingSlots);
  const [editingSlot, setEditingSlot] = useState<{ day: string; timeSlot: string } | null>(null);
  const [formData, setFormData] = useState<{
    class: string;
    subject: string;
    room: string;
    type: 'lecture' | 'lab' | 'tutorial' | 'practical';
  }>({
    class: '',
    subject: '',
    room: '',
    type: 'lecture',
  });

  useEffect(() => {
    if (open) {
      setSlots(existingSlots);
      setEditingSlot(null);
      resetForm();
    }
  }, [open, existingSlots]);

  const resetForm = () => {
    setFormData({
      class: '',
      subject: '',
      room: '',
      type: 'lecture',
    });
  };

  const getSlotForTime = (day: string, startTime: string) => {
    return slots.find(s => s.day === day && s.start_time === startTime);
  };

  const handleSlotClick = (day: string, timeSlot: typeof TIME_SLOTS[0]) => {
    const existing = getSlotForTime(day, timeSlot.start);
    if (existing) {
      setFormData({
        class: existing.class,
        subject: existing.subject,
        room: existing.room,
        type: existing.type,
      });
    } else {
      resetForm();
    }
    setEditingSlot({ day, timeSlot: timeSlot.start });
  };

  const handleSaveSlot = () => {
    if (!teacher || !editingSlot) return;
    
    if (!formData.class || !formData.subject || !formData.room) {
      toast.error('Please fill in all fields');
      return;
    }

    const timeSlot = TIME_SLOTS.find(t => t.start === editingSlot.timeSlot);
    if (!timeSlot) return;

    const newSlot: TimetableSlot = {
      id: `${teacher.id}-${editingSlot.day}-${editingSlot.timeSlot}`,
      teacher_id: teacher.id,
      day: editingSlot.day as any,
      start_time: timeSlot.start,
      end_time: timeSlot.end,
      class: formData.class,
      subject: formData.subject,
      room: formData.room,
      type: formData.type,
    };

    setSlots(prev => {
      const filtered = prev.filter(s => 
        !(s.day === editingSlot.day && s.start_time === editingSlot.timeSlot)
      );
      return [...filtered, newSlot];
    });

    setEditingSlot(null);
    resetForm();
    toast.success('Slot assigned successfully');
  };

  const handleDeleteSlot = (day: string, startTime: string) => {
    setSlots(prev => prev.filter(s => !(s.day === day && s.start_time === startTime)));
    if (editingSlot?.day === day && editingSlot?.timeSlot === startTime) {
      setEditingSlot(null);
      resetForm();
    }
    toast.success('Slot removed');
  };

  const handleSaveTimetable = () => {
    if (slots.length === 0) {
      toast.error('Please assign at least one time slot');
      return;
    }
    onSave(slots);
    toast.success('Timetable saved successfully');
    onOpenChange(false);
  };

  const totalHours = slots.length;

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Assign Timetable - {teacher.name} ({teacher.employee_id})
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">Subjects: {teacher.subjects.join(', ')}</Badge>
            <Badge variant="secondary">Classes: {teacher.classes_taught.join(', ')}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Total Teaching Hours: {totalHours} hrs/week</p>
              <p className="text-sm text-muted-foreground">Free Periods: {(DAYS.length * TIME_SLOTS.length) - totalHours}</p>
            </div>
            {totalHours > 35 && (
              <div className="ml-auto flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">High workload (35+ hrs)</span>
              </div>
            )}
          </div>

          {/* Timetable Grid */}
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-left font-semibold min-w-[100px]">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="p-2 text-center font-semibold min-w-[120px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((timeSlot, idx) => (
                  <tr key={timeSlot.start} className={cn("border-b", idx === 4 && "bg-orange-50/50")}>
                    <td className="p-2 text-xs text-muted-foreground font-medium">
                      {timeSlot.label}
                    </td>
                    {DAYS.map(day => {
                      const slot = getSlotForTime(day, timeSlot.start);
                      const isEditing = editingSlot?.day === day && editingSlot?.timeSlot === timeSlot.start;
                      
                      return (
                        <td key={`${day}-${timeSlot.start}`} className="p-1">
                          {slot ? (
                            <div 
                              className={cn(
                                "p-2 rounded border text-xs cursor-pointer transition-colors h-full",
                                isEditing ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50",
                                slot.type === 'lab' && "bg-blue-50 border-blue-200",
                                slot.type === 'practical' && "bg-green-50 border-green-200",
                                slot.type === 'tutorial' && "bg-purple-50 border-purple-200",
                              )}
                              onClick={() => handleSlotClick(day, timeSlot)}
                            >
                              <div className="font-semibold">{slot.subject}</div>
                              <div className="text-muted-foreground">{slot.class}</div>
                              <div className="text-muted-foreground">{slot.room}</div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSlot(day, timeSlot.start);
                                }}
                                className="mt-1 text-destructive hover:text-destructive/80"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSlotClick(day, timeSlot)}
                              className={cn(
                                "w-full h-full min-h-[60px] p-2 rounded border-2 border-dashed text-xs transition-colors",
                                isEditing 
                                  ? "border-primary bg-primary/5" 
                                  : "border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/30"
                              )}
                            >
                              {isEditing ? 'Editing...' : '+'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Editing Form */}
          {editingSlot && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="font-semibold mb-4">
                Edit Slot: {editingSlot.day}, {TIME_SLOTS.find(t => t.start === editingSlot.timeSlot)?.label}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select value={formData.class} onValueChange={(v) => setFormData({...formData, class: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacher.classes_taught.map(cls => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData({...formData, subject: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {teacher.subjects.map(subj => (
                        <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room *</Label>
                  <Input 
                    placeholder="e.g., Room 201" 
                    value={formData.room}
                    onChange={(e) => setFormData({...formData, room: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSaveSlot} size="sm">
                  <Save className="h-3 w-3 mr-1" />
                  Save Slot
                </Button>
                <Button 
                  onClick={() => {
                    setEditingSlot(null);
                    resetForm();
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveTimetable}>
            <Save className="h-4 w-4 mr-2" />
            Save Timetable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
