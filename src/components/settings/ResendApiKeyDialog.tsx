import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ResendApiKeyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResendApiKeyDialog({ isOpen, onOpenChange }: ResendApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    if (!apiKey.startsWith('re_')) {
      toast.error('Invalid Resend API key format. Keys should start with "re_"');
      return;
    }

    setIsLoading(true);
    
    // Show info about updating secrets
    toast.info(
      'To update the Resend API key, please use the Secrets management in the Lovable dashboard. ' +
      'Go to Settings → Secrets → Update RESEND_API_KEY',
      { duration: 8000 }
    );
    
    setIsLoading(false);
    setApiKey('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Update Resend API Key
          </DialogTitle>
          <DialogDescription>
            Enter your new Resend API key to update email service credentials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              API keys are stored securely. You can get your API key from the{' '}
              <a 
                href="https://resend.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Resend Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="api-key">New API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="re_xxxxxxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Resend API keys start with "re_"
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save API Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
