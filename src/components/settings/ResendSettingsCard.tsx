import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, Key, AlertCircle } from 'lucide-react';
import { ResendApiKeyDialog } from './ResendApiKeyDialog';

export function ResendSettingsCard() {
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  
  // Resend free tier limits
  const freeMonthlyLimit = 3000;
  const dailyLimit = 100;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Service (Resend)
              </CardTitle>
              <CardDescription>
                Manage your Resend API key for sending transactional emails
              </CardDescription>
            </div>
            <Badge variant="default" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Configured
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quota Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Monthly Limit</span>
              </div>
              <p className="text-2xl font-bold">{freeMonthlyLimit.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">emails/month (Free Tier)</p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Daily Limit</span>
              </div>
              <p className="text-2xl font-bold">{dailyLimit}</p>
              <p className="text-xs text-muted-foreground">emails/day limit</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
              Free Tier Information
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Resend's free tier includes 3,000 emails per month and 100 emails per day. 
              For higher limits, upgrade your Resend plan at resend.com/pricing.
            </p>
          </div>

          {/* API Key Management */}
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">API Key</p>
                <p className="text-sm text-muted-foreground">••••••••••••••••</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsApiKeyDialogOpen(true)}>
              Update API Key
            </Button>
          </div>
        </CardContent>
      </Card>

      <ResendApiKeyDialog 
        isOpen={isApiKeyDialogOpen} 
        onOpenChange={setIsApiKeyDialogOpen}
      />
    </>
  );
}
