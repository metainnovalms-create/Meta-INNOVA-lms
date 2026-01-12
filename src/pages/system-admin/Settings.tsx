import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Mail, Settings as SettingsIcon, Save, FileText, ClipboardList, Bot } from 'lucide-react';
import { AccountSettingsSection } from '@/components/settings/AccountSettingsSection';
import { InvoiceSettingsTab } from '@/components/settings/InvoiceSettingsTab';
import { ReportSettingsTab } from '@/components/settings/ReportSettingsTab';
import { AISettingsTab } from '@/components/settings/AISettingsTab';
import { SystemPreferencesTab } from '@/components/settings/SystemPreferencesTab';
import { ResendSettingsCard } from '@/components/settings/ResendSettingsCard';

const EmailConfigurationTab = () => {
  return (
    <div className="space-y-6">
      {/* Resend Settings */}
      <ResendSettingsCard />
      
      <Card>
        <CardHeader>
          <CardTitle>SMTP Configuration</CardTitle>
          <CardDescription>Configure email server settings for notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" placeholder="smtp.gmail.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input id="smtp-port" placeholder="587" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-user">SMTP Username</Label>
              <Input id="smtp-user" placeholder="notifications@metainnova.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">SMTP Password</Label>
              <Input id="smtp-password" type="password" placeholder="••••••••" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Use TLS</Label>
              <p className="text-sm text-muted-foreground">Enable TLS encryption for email</p>
            </div>
            <Switch defaultChecked />
          </div>

          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save SMTP Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>Configure email notification templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="from-name">From Name</Label>
            <Input id="from-name" defaultValue="Meta-INNOVA Platform" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-email">From Email</Label>
            <Input id="from-email" defaultValue="noreply@metainnova.com" />
          </div>
          <Button variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            Test Email Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
// SystemPreferencesTab is now imported from components

export default function SystemAdminSettings() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account security and system preferences</p>
        </div>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-6">
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Prefs</span>
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Invoice</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="mt-6">
            <AccountSettingsSection />
          </TabsContent>

          <TabsContent value="email" className="mt-6">
            <EmailConfigurationTab />
          </TabsContent>

          <TabsContent value="preferences" className="mt-6">
            <SystemPreferencesTab />
          </TabsContent>

          <TabsContent value="invoice" className="mt-6">
            <InvoiceSettingsTab />
          </TabsContent>

          <TabsContent value="reports" className="mt-6">
            <ReportSettingsTab />
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <AISettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
