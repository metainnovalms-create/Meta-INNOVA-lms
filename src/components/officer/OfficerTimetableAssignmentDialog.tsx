import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OfficerTimetableSlot } from "@/types/officer";
import { OfficerDetails } from "@/services/systemadmin.service";
import { useState, useEffect } from "react";
import { Clock, AlertCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { mockCourses } from "@/data/mockCourseData";

interface OfficerTimetableAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officer: OfficerDetails | null;
  existingSlots?: OfficerTimetableSlot[];
  onSave: (slots: OfficerTimetableSlot[]) => void;
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

const STEM_ACTIVITY_TYPES = [
  { value: 'workshop', label: 'Workshop', color: 'bg-blue-50 border-blue-200' },
  { value: 'lab', label: 'Lab', color: 'bg-green-50 border-green-200' },
  { value: 'mentoring', label: 'Mentoring', color: 'bg-yellow-50 border-yellow-200' },
  { value: 'project_review', label: 'Project Review', color: 'bg-purple-50 border-purple-200' },
] as const;

const STEM_ROOMS = [
  'Innovation Lab 1',
  'Innovation Lab 2',
  'Electronics Lab',
  'Maker Space',
  'Robotics Lab',
  'Computer Lab',
  'Science Lab',
  'Conference Room',
  'Auditorium',
];

export function OfficerTimetableAssignmentDialog({ 
  open, 
  onOpenChange, 
  officer, 
  existingSlots = [], 
  onSave 
}: OfficerTimetableAssignmentDialogProps) {
  const [slots, setSlots] = useState<OfficerTimetableSlot[]>(existingSlots);
  const [editingSlot, setEditingSlot] = useState<{ day: string; timeSlot: string } | null>(null);
  const [formData, setFormData] = useState<{
    class: string;
    subject: string;
    room: string;
    type: 'workshop' | 'lab' | 'mentoring' | 'project_review';
    batch: string;
    course_id: string;
    current_module_id: string;
  }>({
    class: '',
    subject: '',
    room: '',
    type: 'workshop',
    batch: '',
    course_id: '',
    current_module_id: '',
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
      type: 'workshop',
      batch: 'none',
      course_id: 'none',
      current_module_id: '',
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
        batch: existing.batch || 'none',
        course_id: existing.course_id || 'none',
        current_module_id: existing.current_module_id || '',
      });
    } else {
      resetForm();
    }
    setEditingSlot({ day, timeSlot: timeSlot.start });
  };

  const handleSaveSlot = () => {
    if (!officer || !editingSlot) return;
    
    if (!formData.class || !formData.subject || !formData.room) {
      toast.error('Please fill in all required fields');
      return;
    }

    const timeSlot = TIME_SLOTS.find(t => t.start === editingSlot.timeSlot);
    if (!timeSlot) return;

    const newSlot: OfficerTimetableSlot = {
      id: `${officer.id}-${editingSlot.day}-${editingSlot.timeSlot}`,
      officer_id: officer.id,
      day: editingSlot.day as any,
      start_time: timeSlot.start,
      end_time: timeSlot.end,
      class: formData.class,
      subject: formData.subject,
      room: formData.room,
      type: formData.type,
      batch: formData.batch === 'none' ? undefined : formData.batch || undefined,
      course_id: formData.course_id === 'none' ? undefined : formData.course_id || undefined,
      current_module_id: formData.current_module_id || undefined,
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
    onOpenChange(false);
  };

  const totalHours = slots.length;
  const activityTypeColor = (type: string) => {
    return STEM_ACTIVITY_TYPES.find(t => t.value === type)?.color || '';
  };

  if (!officer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Assign STEM Schedule - {officer.name}
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary">{officer.employee_id}</Badge>
            <Badge variant="secondary">Innovation Officer</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold">Total Hours: {totalHours} hrs/week</p>
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
                                activityTypeColor(slot.type)
                              )}
                              onClick={() => handleSlotClick(day, timeSlot)}
                            >
                              <div className="font-semibold text-[10px] uppercase text-muted-foreground">
                                {slot.type}
                              </div>
                              <div className="font-semibold">{slot.subject}</div>
                              <div className="text-muted-foreground">{slot.class}</div>
                              {slot.batch && (
                                <div className="text-muted-foreground text-[10px]">{slot.batch}</div>
                              )}
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
                  <Input 
                    placeholder="e.g., Class 8A" 
                    value={formData.class}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input 
                    placeholder="e.g., Robotics Workshop" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room *</Label>
                  <Select value={formData.room} onValueChange={(v) => setFormData({...formData, room: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {STEM_ROOMS.map(room => (
                        <SelectItem key={room} value={room}>{room}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Activity Type</Label>
                  <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STEM_ACTIVITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Batch (Optional)</Label>
                  <Select value={formData.batch} onValueChange={(v) => setFormData({...formData, batch: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="No batch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Batch</SelectItem>
                      <SelectItem value="Batch A">Batch A</SelectItem>
                      <SelectItem value="Batch B">Batch B</SelectItem>
                      <SelectItem value="Batch C">Batch C</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Linked Course (Optional)</Label>
                  <Select value={formData.course_id} onValueChange={(v) => setFormData({...formData, course_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Course</SelectItem>
                      {mockCourses.slice(0, 5).map(course => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
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
