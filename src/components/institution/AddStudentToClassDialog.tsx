import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DatePickerWithYearMonth } from "@/components/ui/date-picker-with-year-month";
import { Student } from "@/types/student";
import { InstitutionClass } from "@/types/institution";

import { idGenerationService } from '@/services/id-generation.service';
import { useRollNumberGenerator } from '@/hooks/useRollNumberGenerator';
import { useState, useEffect } from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AddStudentToClassDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classData: InstitutionClass;
  institutionId: string;
  existingStudents: Student[];
  onSave: (student: Omit<Student, 'id' | 'created_at'>) => Promise<void>;
  mode?: 'add' | 'edit';
  student?: Student;
}

export function AddStudentToClassDialog({
  isOpen,
  onOpenChange,
  classData,
  institutionId,
  existingStudents,
  onSave,
  mode = 'add',
  student,
}: AddStudentToClassDialogProps) {
  const { generateRollNumber } = useRollNumberGenerator(institutionId);
  
  const [formData, setFormData] = useState({
    student_name: '',
    email: '',
    password: '',
    roll_number: '',
    admission_number: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    blood_group: '',
    admission_date: format(new Date(), 'yyyy-MM-dd'),
    previous_school: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive' | 'transferred' | 'graduated',
  });

  const [dobDate, setDobDate] = useState<Date>();
  const [admissionDate, setAdmissionDate] = useState<Date>(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && student) {
      setFormData({
        student_name: student.student_name,
        email: student.email || '',
        password: '',
        roll_number: student.roll_number,
        admission_number: student.admission_number,
        date_of_birth: student.date_of_birth,
        gender: student.gender,
        blood_group: student.blood_group || '',
        admission_date: student.admission_date,
        previous_school: student.previous_school || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        address: student.address || '',
        status: student.status,
      });
      setDobDate(new Date(student.date_of_birth));
      setAdmissionDate(new Date(student.admission_date));
    } else if (mode === 'add' && isOpen) {
      // Reset form for new student - roll number will be generated at submit time
      setFormData({
        student_name: '',
        email: '',
        password: '',
        roll_number: '', // Will be auto-generated at submit
        admission_number: '',
        date_of_birth: '',
        gender: 'male',
        blood_group: '',
        admission_date: format(new Date(), 'yyyy-MM-dd'),
        previous_school: '',
        parent_name: '',
        parent_phone: '',
        address: '',
        status: 'active',
      });
      setDobDate(undefined);
      setAdmissionDate(new Date());
    }
  }, [mode, student, isOpen, existingStudents, institutionId]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Only required: Full Name, Email, Password, Date of Birth, Gender
    if (!formData.student_name.trim()) newErrors.student_name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (mode === 'add' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (mode === 'add' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';

    // Age validation
    if (formData.date_of_birth) {
      const dob = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 3 || age > 25) {
        newErrors.date_of_birth = 'Age must be between 3 and 25 years';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fix all validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate roll number at submit time for uniqueness
      const rollNum = mode === 'add' ? await generateRollNumber() : formData.roll_number;
      
      // Generate student_id using ID generation service
      const idResponse = await idGenerationService.generateId({
        entity_type: 'student',
        institution_id: institutionId,
      });

      const studentData = {
        ...formData,
        roll_number: rollNum,
        student_id: idResponse.success ? idResponse.data.id : `STU-TEMP-${Date.now()}`,
        email: formData.email,
        institution_id: institutionId,
        class_id: classData.id,
        class: classData.class_name,
        section: 'A',
        blood_group: formData.blood_group || null,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null,
        address: formData.address || null,
        avatar: student?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.student_name}`,
      };

      await onSave(studentData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save student:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Student to' : 'Edit Student in'} {classData.class_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="font-semibold mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="student_name">Full Name *</Label>
                <Input
                  id="student_name"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className={errors.student_name ? 'border-destructive' : ''}
                />
                {errors.student_name && <p className="text-xs text-destructive mt-1">{errors.student_name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email * (For Student Login)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@school.edu"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="password">{mode === 'add' ? 'Password *' : 'Password (leave blank to keep unchanged)'}</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={mode === 'add' ? 'Min 6 characters' : '••••••••'}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>

              <div>
                <Label>Date of Birth *</Label>
                <DatePickerWithYearMonth
                  date={dobDate}
                  onDateChange={(date) => {
                    setDobDate(date);
                    setFormData({ ...formData, date_of_birth: date ? format(date, 'yyyy-MM-dd') : '' });
                  }}
                  placeholder="Pick date of birth"
                  minYear={1990}
                  maxYear={new Date().getFullYear() - 3}
                  disabled={(date) => date > new Date()}
                  hasError={!!errors.date_of_birth}
                />
                {errors.date_of_birth && <p className="text-xs text-destructive mt-1">{errors.date_of_birth}</p>}
              </div>

              <div>
                <Label>Gender *</Label>
                <Select value={formData.gender} onValueChange={(value: any) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Blood Group</Label>
                <Select value={formData.blood_group} onValueChange={(value) => setFormData({ ...formData, blood_group: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blood group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {bloodGroups.map(bg => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="font-semibold mb-3">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Class</Label>
                <Input value={classData.class_name} disabled className="bg-muted" />
              </div>

              <div>
                <Label>Section</Label>
                <Input value="A" disabled className="bg-muted" />
              </div>

              <div>
                <Label>Roll Number (Auto-generated)</Label>
                <Input 
                  value={mode === 'edit' ? formData.roll_number : 'Will be generated on save'} 
                  disabled 
                  className="bg-muted text-muted-foreground" 
                />
              </div>

              <div>
                <Label>Admission Number (Optional)</Label>
                <Input
                  value={formData.admission_number}
                  onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                  placeholder="Enter admission number (optional)"
                />
              </div>

              <div>
                <Label>Admission Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {admissionDate ? format(admissionDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={admissionDate}
                      onSelect={(date) => {
                        setAdmissionDate(date || new Date());
                        setFormData({ ...formData, admission_date: date ? format(date, 'yyyy-MM-dd') : '' });
                      }}
                      disabled={(date) => date > new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Previous School</Label>
                <Input
                  value={formData.previous_school}
                  onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Parent/Guardian Information (Optional) */}
          <div>
            <h3 className="font-semibold mb-3">Parent/Guardian Information (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Parent Name</Label>
                <Input
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  placeholder="Optional"
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="+91-9876543210 (Optional)"
                />
              </div>

              <div className="col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  placeholder="Optional"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Student' : 'Update Student'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
