import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, GraduationCap, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useComprehensiveAnalytics } from '@/hooks/useComprehensiveAnalytics';
import { InstitutionOverview } from '@/components/analytics/InstitutionOverview';
import { ClassAnalyticsView } from '@/components/analytics/ClassAnalyticsView';
import { StudentAnalyticsView } from '@/components/analytics/StudentAnalyticsView';
import { Skeleton } from '@/components/ui/skeleton';

export default function ManagementAnalytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const institutionId = user?.institution_id || user?.tenant_id;
  const institutionName = (user as any)?.institution_name || 'Your Institution';

  const { data: analyticsData, isLoading } = useComprehensiveAnalytics(institutionId);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-96" />
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive performance insights for your institution
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Institution Overview
            </TabsTrigger>
            <TabsTrigger value="class" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Class Analytics
            </TabsTrigger>
            <TabsTrigger value="student" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Student Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {analyticsData && (
              <InstitutionOverview 
                data={analyticsData} 
                institutionName={institutionName} 
              />
            )}
          </TabsContent>

          <TabsContent value="class">
            {analyticsData && (
              <ClassAnalyticsView classes={analyticsData.classPerformance} />
            )}
          </TabsContent>

          <TabsContent value="student">
            {analyticsData && (
              <StudentAnalyticsView classes={analyticsData.classPerformance} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
