import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AIDisabledBanner() {
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>AI Assistant Disabled</AlertTitle>
      <AlertDescription>
        Ask Metova is currently disabled by the administrator. Please try again later.
      </AlertDescription>
    </Alert>
  );
}
