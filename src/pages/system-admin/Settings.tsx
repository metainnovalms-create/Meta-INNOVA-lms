import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Mail, Settings as SettingsIcon, FileText, ClipboardList, Bot } from 'lucide-react';
import { AccountSettingsSection } from '@/components/settings/AccountSettingsSection';
import { InvoiceSettingsTab } from '@/components/settings/InvoiceSettingsTab';
import { ReportSettingsTab } from '@/components/settings/ReportSettingsTab';
import { AISettingsTab } from '@/components/settings/AISettingsTab';
import { SystemPreferencesTab } from '@/components/settings/SystemPreferencesTab';
import { ResendSettingsCard } from '@/components/settings/ResendSettingsCard';
import { EmailTemplateSettingsCard } from '@/components/settings/EmailTemplateSettingsCard';

const EmailConfigurationTab = () => {
  return (
    <div className="space-y-6">
      {/* Resend Settings */}
      <ResendSettingsCard />
      
      {/* Email Template Settings */}
      <EmailTemplateSettingsCard />
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
