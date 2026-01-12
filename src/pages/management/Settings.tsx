import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Award, Mail, Save, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { getInstitutionBySlug } from "@/data/mockInstitutionData";
import { useLocation } from "react-router-dom";
import { AccountSettingsSection } from "@/components/settings/AccountSettingsSection";

const InstitutionProfileTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Institution Information</CardTitle>
          <CardDescription>Manage your institution's basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="inst-name">Institution Name</Label>
              <Input id="inst-name" defaultValue="Engineering College - Main Campus" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-code">Institution Code</Label>
              <Input id="inst-code" defaultValue="EC-MC-001" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" defaultValue="123 Education Street, Tech City, State - 560001" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input id="phone" defaultValue="+91 80 1234 5678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" type="email" defaultValue="info@college.edu" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic-year">Academic Year</Label>
            <Input id="academic-year" defaultValue="2024-2025" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Institution Logo URL</Label>
            <Input id="logo" placeholder="https://example.com/logo.png" />
          </div>

          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const BrandingTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Certificate Template</CardTitle>
          <CardDescription>Customize certificate formats and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cert-header">Certificate Header Text</Label>
            <Input id="cert-header" defaultValue="Meta-INNOVA Innovation Certificate" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cert-footer">Footer Text</Label>
            <Textarea 
              id="cert-footer" 
              defaultValue="This certifies that the above-named student has successfully completed the innovation program."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input id="primary-color" type="color" defaultValue="#0F766E" className="w-20 h-10" />
                <Input defaultValue="#0F766E" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex gap-2">
                <Input id="accent-color" type="color" defaultValue="#FB923C" className="w-20 h-10" />
                <Input defaultValue="#FB923C" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature-1">Principal Signature Name</Label>
            <Input id="signature-1" defaultValue="Dr. Suresh Reddy" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature-2">Coordinator Signature Name</Label>
            <Input id="signature-2" defaultValue="Prof. Meena Iyer" />
          </div>

          <div className="pt-4 border-t">
            <Button>
              <Award className="h-4 w-4 mr-2" />
              Preview Certificate
            </Button>
            <Button variant="outline" className="ml-2">
              <Save className="h-4 w-4 mr-2" />
              Save Template
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const IntegrationsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Configure email settings for institution notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Student Enrollment Notifications</Label>
              <p className="text-sm text-muted-foreground">Send emails when new students are enrolled</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Attendance Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert for low attendance rates</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Project Milestone Updates</Label>
              <p className="text-sm text-muted-foreground">Notify about project progress updates</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP Host</Label>
              <Input id="smtp-host" placeholder="smtp.gmail.com" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" placeholder="587" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtp-user">SMTP Username</Label>
                <Input id="smtp-user" placeholder="notifications@college.edu" />
              </div>
            </div>
          </div>

          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Email Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Notifications</CardTitle>
          <CardDescription>Configure SMS settings for urgent notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications Enabled</Label>
              <p className="text-sm text-muted-foreground">Enable SMS for critical alerts</p>
            </div>
            <Switch />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sms-provider">SMS Provider API Key</Label>
            <Input id="sms-provider" type="password" placeholder="Enter API key" />
          </div>

          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save SMS Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Settings = () => {
  // Extract institution from URL
  const location = useLocation();
  const institutionSlug = location.pathname.split('/')[2];
  const institution = getInstitutionBySlug(institutionSlug);

  return (
    <Layout>
      <div className="space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institution.established_year}
            location={institution.location}
            totalStudents={institution.total_students}
            academicYear={institution.academic_year}
            userRole="Management Portal"
            assignedOfficers={institution.assigned_officers.map(o => o.officer_name)}
          />
        )}
        
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage institution profile, branding, and integrations</p>
        </div>

        <Tabs defaultValue="security" className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Account Security</span>
              <span className="sm:hidden">Security</span>
            </TabsTrigger>
            <TabsTrigger value="profile">Institution Profile</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
          </TabsList>
          <TabsContent value="security" className="mt-6">
            <AccountSettingsSection />
          </TabsContent>
          <TabsContent value="profile" className="mt-6">
            <InstitutionProfileTab />
          </TabsContent>
          <TabsContent value="branding" className="mt-6">
            <BrandingTab />
          </TabsContent>
          <TabsContent value="integrations" className="mt-6">
            <IntegrationsTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings;
