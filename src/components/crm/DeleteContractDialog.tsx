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
import { Loader2, AlertTriangle, FileText, Trash2 } from "lucide-react";
import { ContractDetail } from "@/data/mockCRMData";

interface DeleteContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractDetail | null;
  onConfirmDelete: (contract: ContractDetail) => void;
  isDeleting?: boolean;
}

export function DeleteContractDialog({
  open,
  onOpenChange,
  contract,
  onConfirmDelete,
  isDeleting = false,
}: DeleteContractDialogProps) {
  if (!contract) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Contract
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to delete the contract for{" "}
              <span className="font-semibold text-foreground">
                {contract.institution_name}
              </span>
              ?
            </p>
            
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-destructive">
                This will permanently delete:
              </p>
              <ul className="text-sm text-destructive/80 space-y-1 ml-4 list-disc">
                <li>The contract record</li>
                {contract.documents.length > 0 && (
                  <li className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {contract.documents.length} attached document(s)
                  </li>
                )}
                <li>All storage files will be removed</li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground font-medium">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirmDelete(contract)}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Contract
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
