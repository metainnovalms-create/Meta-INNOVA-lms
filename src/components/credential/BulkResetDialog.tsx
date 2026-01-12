import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface SelectedUser {
  id: string;
  name: string;
  email: string;
}

interface BulkResetDialogProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: SelectedUser[];
  userType: 'meta_employee' | 'officer' | 'institution_admin' | 'student';
  onConfirm: () => void;
  isProcessing: boolean;
  progress: { current: number; total: number; errors: Array<{ email: string; error: string }> };
}

const userTypeLabels: Record<string, string> = {
  meta_employee: 'Meta Employees',
  officer: 'Innovation Officers',
  institution_admin: 'Institution Administrators',
  student: 'Students',
};

export function BulkResetDialog({
  open,
  onClose,
  selectedUsers,
  userType,
  onConfirm,
  isProcessing,
  progress,
}: BulkResetDialogProps) {
  const progressPercent = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
  const isComplete = progress.current === progress.total && progress.total > 0;

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && !isProcessing && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {isProcessing ? 'Sending Reset Links...' : 'Confirm Bulk Password Reset'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isProcessing ? (
              <span>Please wait while reset links are being sent.</span>
            ) : (
              <span>
                You are about to send password reset links to{' '}
                <strong>{selectedUsers.length}</strong> {userTypeLabels[userType]?.toLowerCase() || 'users'}.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {progress.current} of {progress.total} emails sent
              </p>
            </div>
          )}

          {!isProcessing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected users:</p>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                <div className="space-y-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded"
                    >
                      <div className="truncate">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {progress.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{progress.errors.length} failed</span>
              </div>
              <ScrollArea className="h-[100px] border border-destructive/20 rounded-md p-2">
                <div className="space-y-1">
                  {progress.errors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive">
                      {err.email}: {err.error}
                    </p>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {isComplete && progress.errors.length === 0 && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">All reset links sent successfully!</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          {!isProcessing && !isComplete && (
            <>
              <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm}>
                <Mail className="h-4 w-4 mr-2" />
                Send {selectedUsers.length} Reset Links
              </AlertDialogAction>
            </>
          )}
          {isProcessing && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
          {isComplete && (
            <AlertDialogAction onClick={onClose}>Done</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
