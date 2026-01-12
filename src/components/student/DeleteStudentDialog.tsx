import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Student } from "@/types/student";
import { AlertCircle } from "lucide-react";

interface DeleteStudentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  onConfirm: (studentId: string) => void;
}

export function DeleteStudentDialog({
  isOpen,
  onOpenChange,
  student,
  onConfirm,
}: DeleteStudentDialogProps) {
  if (!student) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Delete Student
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <div className="py-3">
              <p className="font-medium text-foreground">
                {student.student_name}
              </p>
              <p className="text-sm">
                Roll Number: {student.roll_number} | {student.class} - {student.section}
              </p>
            </div>
            <p>
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            <p className="text-sm bg-muted p-2 rounded">
              <strong>Note:</strong> Attendance records and academic history will be archived.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(student.id)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Student
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
