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
import { SchoolTeacher } from "@/types/teacher";
import { AlertTriangle } from "lucide-react";

interface DeleteTeacherDialogProps {
  teacher: SchoolTeacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteTeacherDialog({
  teacher,
  open,
  onOpenChange,
  onConfirm,
}: DeleteTeacherDialogProps) {
  if (!teacher) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Teacher
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground">{teacher.name}</span>{" "}
              (<span className="font-mono">{teacher.employee_id}</span>)?
            </p>
            <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
              <p className="font-medium text-foreground">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Permanently remove the teacher from the system</li>
                <li>Unassign them from {teacher.classes_taught.length} classes</li>
                <li>Affect {teacher.total_students} students</li>
                <li>Remove all associated records</li>
              </ul>
            </div>
            <p className="text-destructive font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Teacher
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
