import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Student } from "@/types/student";
import { getStatusColor, calculateAge } from "@/utils/studentHelpers";
import { Edit, Trash2, Phone, Mail, MapPin, Calendar, Users } from "lucide-react";

interface StudentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function StudentDetailsDialog({
  isOpen,
  onOpenChange,
  student,
  onEdit,
  onDelete,
  readOnly = false,
}: StudentDetailsDialogProps) {
  if (!student) return null;

  const age = calculateAge(student.date_of_birth);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-4 pb-4 border-b">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.avatar} alt={student.student_name} />
              <AvatarFallback>{student.student_name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{student.student_name}</h3>
                  <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                </div>
                <Badge className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Roll Number</p>
                <p className="font-medium">{student.roll_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Admission Number</p>
                <p className="font-medium">{student.admission_number}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Class & Section</p>
                <p className="font-medium">{student.class} - {student.section}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{new Date(student.date_of_birth).toLocaleDateString()} (Age: {age})</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{student.gender}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Blood Group</p>
                <p className="font-medium">{student.blood_group || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Admission Date</p>
                <p className="font-medium">{new Date(student.admission_date).toLocaleDateString()}</p>
              </div>
              {student.previous_school && (
                <div>
                  <p className="text-muted-foreground">Previous School</p>
                  <p className="font-medium">{student.previous_school}</p>
                </div>
              )}
            </div>
          </div>

          {/* Parent/Guardian Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Parent/Guardian Information
            </h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Parent Name</p>
                  <p className="font-medium">{student.parent_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p className="font-medium">{student.parent_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{student.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-muted-foreground text-xs">Address</p>
                  <p className="font-medium">{student.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {!readOnly && onEdit && onDelete && (
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={onEdit} className="flex-1">
                <Edit className="h-4 w-4 mr-2" />
                Edit Student
              </Button>
              <Button onClick={onDelete} variant="destructive" className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Student
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
