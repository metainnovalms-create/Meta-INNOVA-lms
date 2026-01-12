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
import { Clock, LogOut } from 'lucide-react';

interface SessionTimeoutWarningProps {
  open: boolean;
  remainingSeconds: number;
  onExtend: () => void;
  onLogout: () => void;
}

export function SessionTimeoutWarning({
  open,
  remainingSeconds,
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeDisplay = minutes > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}` 
    : `${seconds} seconds`;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <AlertDialogTitle className="text-center text-xl">
            Session Expiring Soon
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            <p>
              Your session will expire in <span className="font-bold text-foreground">{timeDisplay}</span> due to inactivity.
            </p>
            <p className="text-sm">
              Click "Stay Logged In" to continue your session, or you will be automatically logged out.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel onClick={onLogout} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Log Out Now
          </AlertDialogCancel>
          <AlertDialogAction onClick={onExtend} className="w-full sm:w-auto">
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
