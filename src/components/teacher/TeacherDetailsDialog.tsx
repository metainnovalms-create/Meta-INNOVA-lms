import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SchoolTeacher } from "@/types/teacher";
import { Mail, Phone, Award, BookOpen, Users, Calendar, TrendingUp, Edit, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface TeacherDetailsDialogProps {
  teacher: SchoolTeacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TeacherDetailsDialog({
  teacher,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: TeacherDetailsDialogProps) {
  if (!teacher) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      on_leave: "secondary",
      inactive: "destructive",
    } as const;
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "Active",
      on_leave: "On Leave",
      inactive: "Inactive",
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Teacher Details</DialogTitle>
          <DialogDescription>
            Complete information about {teacher.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Name and Status */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold">{teacher.name}</h3>
              <Badge variant="outline" className="mt-2">
                {teacher.employee_id}
              </Badge>
            </div>
            <Badge variant={getStatusBadge(teacher.status)}>
              {getStatusLabel(teacher.status)}
            </Badge>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">
              Personal Information
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{teacher.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{teacher.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Qualification:</span>
                <span className="text-sm">{teacher.qualification}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Joined:</span>
                <span className="text-sm">{teacher.joining_date}</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Experience:</span>
                <span className="text-sm">{teacher.experience_years} years</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Teaching Assignment */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">
              Teaching Assignments
            </h4>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Subjects
                </p>
                <div className="flex flex-wrap gap-2">
                  {teacher.subjects.map((subject) => (
                    <Badge key={subject} variant="secondary">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Classes Taught
                </p>
                <p className="text-sm text-muted-foreground">
                  {teacher.classes_taught.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Total Students:</span>
                <span className="text-sm">{teacher.total_students}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm uppercase text-muted-foreground">
              Performance Metrics
            </h4>
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Average Attendance:</span>
                <span className="text-sm">{teacher.average_attendance}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Active:</span>
                <span className="text-sm">{teacher.last_active}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Teacher
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
