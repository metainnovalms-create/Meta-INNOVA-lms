import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Users, BookOpen, Gamepad2, Target, Bot, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformGuidePDF } from '@/components/platform-guide/PlatformGuidePDF';

const roles = [
  {
    title: 'CEO / System Admin',
    icon: Users,
    color: 'bg-purple-100 text-purple-700',
    features: ['Multi-institution management', 'Revenue analytics', 'Course creation', 'Position configuration'],
  },
  {
    title: 'Institution Management',
    icon: BookOpen,
    color: 'bg-blue-100 text-blue-700',
    features: ['Student enrollment', 'Officer supervision', 'Inventory oversight', 'Performance monitoring'],
  },
  {
    title: 'Innovation Officer',
    icon: Target,
    color: 'bg-green-100 text-green-700',
    features: ['GPS attendance', 'Course delivery', 'Project mentoring', 'Session attendance'],
  },
  {
    title: 'Student',
    icon: Gamepad2,
    color: 'bg-orange-100 text-orange-700',
    features: ['Interactive learning', 'Gamification', 'Project collaboration', 'Resume builder'],
  },
];

const modules = [
  { name: 'LMS', description: 'Course management & delivery', icon: '📚' },
  { name: 'HRMS', description: 'Leave, attendance & payroll', icon: '👥' },
  { name: 'IMS/WMS', description: 'Inventory & purchases', icon: '📦' },
  { name: 'ERP', description: 'CRM, invoicing & reports', icon: '💼' },
  { name: 'Gamification', description: 'XP, badges & leaderboards', icon: '🎮' },
  { name: 'SDG Tracking', description: 'UN goals alignment', icon: '🌍' },
  { name: 'AI Analytics', description: 'Ask Metova assistant', icon: '🤖' },
];

const walkthroughSteps = [
  { time: '0-2 min', title: 'Login & Overview' },
  { time: '2-7 min', title: 'CEO Dashboard' },
  { time: '7-12 min', title: 'Management View' },
  { time: '12-16 min', title: 'Officer Experience' },
  { time: '16-20 min', title: 'Student Portal' },
];

export default function PlatformGuide() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<PlatformGuidePDF />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'META-INNOVA_Platform_Guide.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Platform Guide downloaded successfully!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Guide</h1>
            <p className="text-muted-foreground">
              Comprehensive overview and walkthrough guide for client presentations
            </p>
          </div>
          <Button onClick={handleDownload} disabled={isGenerating} size="lg" className="gap-2">
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF Guide
              </>
            )}
          </Button>
        </div>

        {/* Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>META-INNOVA Platform Overview</CardTitle>
                <CardDescription>
                  Multi-tenant LMS + ERP for STEM Education Excellence
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              META-INNOVA combines powerful learning management with enterprise resource planning, 
              providing educational institutions with a complete digital infrastructure for delivering 
              world-class STEM education. The platform features GPS-verified attendance, gamified learning, 
              SDG tracking, and AI-powered analytics.
            </p>
          </CardContent>
        </Card>

        {/* User Roles */}
        <div>
          <h2 className="text-lg font-semibold mb-4">User Roles & Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((role) => (
              <Card key={role.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${role.color}`}>
                      <role.icon className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm">{role.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {role.features.map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Core Modules */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Core Modules</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {modules.map((module) => (
              <Card key={module.name} className="text-center">
                <CardContent className="pt-4 pb-3">
                  <div className="text-2xl mb-2">{module.icon}</div>
                  <p className="font-medium text-sm">{module.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{module.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Walkthrough Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <CardTitle className="text-base">Live Walkthrough Script</CardTitle>
                <CardDescription>20-minute demonstration plan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {walkthroughSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
                >
                  <div className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{step.time}</p>
                    <p className="text-sm font-medium">{step.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Key Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Complete data isolation between institutions',
                'GPS-verified attendance with payroll integration',
                'Gamified learning increases engagement by 40%',
                'AI-powered insights with Ask Metova',
                'SDG tracking for global impact measurement',
              ].map((benefit) => (
                <div key={benefit} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-5 w-5 text-purple-600" />
                Technical Highlights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                'Cloud-based SaaS with 99.9% uptime',
                'Multi-tenant architecture for scalability',
                'Role-based access control (RBAC)',
                'Real-time data synchronization',
                'Mobile-responsive design',
              ].map((tech) => (
                <div key={tech} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{tech}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Download CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
            <div className="text-center md:text-left">
              <h3 className="font-semibold text-lg">Ready to share with clients?</h3>
              <p className="text-sm text-muted-foreground">
                Download the complete PDF guide with all sections, walkthrough script, and value propositions.
              </p>
            </div>
            <Button onClick={handleDownload} disabled={isGenerating} size="lg" className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
