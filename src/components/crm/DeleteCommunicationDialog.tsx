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
import { Loader2 } from "lucide-react";
import { CommunicationLog } from "@/types/communicationLog";

interface DeleteCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communication: CommunicationLog | null;
  onConfirmDelete: (communication: CommunicationLog) => void;
  isDeleting?: boolean;
}

export function DeleteCommunicationDialog({
  open,
  onOpenChange,
  communication,
  onConfirmDelete,
  isDeleting = false,
}: DeleteCommunicationDialogProps) {
  if (!communication) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Communication Log</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete this communication log?
            </p>
            <div className="bg-muted p-3 rounded-lg mt-2 space-y-1">
              <p className="font-medium text-foreground">{communication.subject}</p>
              <p className="text-sm">{communication.institution_name}</p>
            </div>
            <p className="text-destructive mt-2">
              This will permanently delete the communication log and all attached files. This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmDelete(communication)}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
