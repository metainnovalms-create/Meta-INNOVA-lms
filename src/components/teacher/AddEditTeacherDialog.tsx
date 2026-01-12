import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SchoolTeacher, SCHOOL_SUBJECTS, CLASS_LEVELS } from "@/types/teacher";
import { getClassesByInstitution } from "@/data/mockClassData";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useParams } from "react-router-dom";

interface AddEditTeacherDialogProps {
  teacher?: SchoolTeacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (teacher: Omit<SchoolTeacher, 'id'> & { id?: string }) => void;
  mode: 'add' | 'edit';
  nextEmployeeId?: string;
  institutionId?: string;
}

const QUALIFICATIONS = [
  'B.Ed',
  'M.Ed',
  'B.A.',
  'M.A.',
  'B.Sc.',
  'M.Sc.',
  'B.Com',
  'M.Com',
  'B.Tech',
  'M.Tech',
  'B.E.',
  'M.E.',
];

export function AddEditTeacherDialog({
  teacher,
  open,
  onOpenChange,
  onSave,
  mode,
  nextEmployeeId,
  institutionId,
}: AddEditTeacherDialogProps) {
  const { tenantId } = useParams();
  const effectiveInstitutionId = institutionId || tenantId || '1';
  const institutionClasses = getClassesByInstitution(effectiveInstitutionId);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    phone: string;
    employee_id: string;
    joining_date: string;
    qualification: string;
    experience_years: number;
    status: 'active' | 'on_leave' | 'inactive';
    average_attendance: number;
    subjects: string[];
    classes_taught: string[];
    total_students: number;
    last_active: string;
  }>({
    name: '',
    email: '',
    phone: '',
    employee_id: nextEmployeeId || '',
    joining_date: '',
    qualification: '',
    experience_years: 0,
    status: 'active',
    average_attendance: 100,
    subjects: [],
    classes_taught: [],
    total_students: 0,
    last_active: new Date().toISOString().split('T')[0],
  });

  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  useEffect(() => {
    if (mode === 'edit' && teacher) {
      setFormData({
        name: teacher.name,
        email: teacher.email,
        phone: teacher.phone,
        employee_id: teacher.employee_id,
        joining_date: teacher.joining_date,
        qualification: teacher.qualification,
        experience_years: teacher.experience_years,
        status: teacher.status,
        average_attendance: teacher.average_attendance,
        subjects: teacher.subjects,
        classes_taught: teacher.classes_taught,
        total_students: teacher.total_students,
        last_active: teacher.last_active,
      });
    } else if (mode === 'add') {
      setFormData({
        name: '',
        email: '',
        phone: '',
        employee_id: nextEmployeeId || '',
        joining_date: new Date().toISOString().split('T')[0],
        qualification: '',
        experience_years: 0,
        status: 'active',
        average_attendance: 100,
        subjects: [],
        classes_taught: [],
        total_students: 0,
        last_active: new Date().toISOString().split('T')[0],
      });
    }
  }, [teacher, mode, open, nextEmployeeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Valid email is required');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (formData.subjects.length === 0) {
      toast.error('At least one subject is required');
      return;
    }
    if (formData.classes_taught.length === 0) {
      toast.error('At least one class is required');
      return;
    }
    if (!formData.qualification) {
      toast.error('Qualification is required');
      return;
    }
    if (formData.experience_years < 0 || formData.experience_years > 50) {
      toast.error('Experience years must be between 0 and 50');
      return;
    }

    if (mode === 'edit' && teacher) {
      onSave({ ...formData, id: teacher.id });
    } else {
      onSave(formData);
    }
  };

  const addSubject = () => {
    if (selectedSubject && !formData.subjects.includes(selectedSubject)) {
      setFormData({ ...formData, subjects: [...formData.subjects, selectedSubject] });
      setSelectedSubject('');
    }
  };

  const removeSubject = (subject: string) => {
    setFormData({ ...formData, subjects: formData.subjects.filter(s => s !== subject) });
  };

  const addClass = () => {
    if (selectedClass && !formData.classes_taught.includes(selectedClass)) {
      setFormData({ ...formData, classes_taught: [...formData.classes_taught, selectedClass] });
      setSelectedClass('');
    }
  };

  const removeClass = (className: string) => {
    setFormData({ ...formData, classes_taught: formData.classes_taught.filter(c => c !== className) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Fill in the details to add a new teacher to the system' 
              : 'Update teacher information'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Mrs. Sarah Johnson"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID *</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  placeholder="e.g., TCH001"
                  required
                  disabled={mode === 'edit'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@school.edu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joining_date">Joining Date *</Label>
                <Input
                  id="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience_years">Experience (years) *</Label>
                <Input
                  id="experience_years"
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Teaching Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">
              Teaching Information
            </h4>

            <div className="space-y-2">
              <Label>Subjects Taught *</Label>
              <div className="flex gap-2">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addSubject} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="gap-1">
                    {subject}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeSubject(subject)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Classes Taught *</Label>
              <div className="flex gap-2">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutionClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.class_name}>
                        {cls.class_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={addClass} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.classes_taught.map((className) => (
                  <Badge key={className} variant="secondary" className="gap-1">
                    {className}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeClass(className)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification *</Label>
                <Select
                  value={formData.qualification}
                  onValueChange={(value) => setFormData({ ...formData, qualification: value })}
                >
                  <SelectTrigger id="qualification">
                    <SelectValue placeholder="Select qualification" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALIFICATIONS.map((qual) => (
                      <SelectItem key={qual} value={qual}>
                        {qual}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_students">Total Students</Label>
                <Input
                  id="total_students"
                  type="number"
                  min="0"
                  value={formData.total_students}
                  onChange={(e) => setFormData({ ...formData, total_students: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Employment Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">
              Employment Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="average_attendance">Attendance (%)</Label>
                <Input
                  id="average_attendance"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.average_attendance}
                  onChange={(e) => setFormData({ ...formData, average_attendance: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Add Teacher' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
