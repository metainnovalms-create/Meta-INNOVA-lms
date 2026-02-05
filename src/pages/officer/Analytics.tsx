import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, GraduationCap, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useComprehensiveAnalytics } from '@/hooks/useComprehensiveAnalytics';
import { InstitutionOverview } from '@/components/analytics/InstitutionOverview';
import { ClassAnalyticsView } from '@/components/analytics/ClassAnalyticsView';
import { StudentAnalyticsView } from '@/components/analytics/StudentAnalyticsView';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

export default function OfficerAnalytics() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [assignedInstitution, setAssignedInstitution] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [loadingAssignment, setLoadingAssignment] = useState(true);

  const fetchAssignedInstitution = useCallback(async () => {
    if (!user?.id) {
      setLoadingAssignment(false);
      return;
    }
    
    try {
      // Fetch officer assignment from officer_institution_assignments table
      const { data: assignment } = await supabase
        .from('officer_institution_assignments')
        .select('institution_id')
        .eq('officer_id', user.id)
        .maybeSingle();

      if (assignment?.institution_id) {
        // Fetch institution details
        const { data: institution } = await supabase
          .from('institutions')
          .select('id, name')
          .eq('id', assignment.institution_id)
          .single();

        if (institution) {
          setAssignedInstitution({
            id: institution.id,
            name: institution.name,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching assigned institution:', error);
    } finally {
      setLoadingAssignment(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssignedInstitution();
  }, [fetchAssignedInstitution]);

  const { data: analyticsData, isLoading } = useComprehensiveAnalytics(
    assignedInstitution?.id
  );

  if (loadingAssignment || isLoading) {
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

  if (!assignedInstitution) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Performance insights for your assigned institution
            </p>
          </div>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No Institution Assigned</p>
              <p className="text-muted-foreground text-sm mt-1">
                You are not currently assigned to any institution. Please contact your administrator.
              </p>
            </CardContent>
          </Card>
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
            Performance insights for <span className="font-medium text-foreground">{assignedInstitution.name}</span>
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
                institutionName={assignedInstitution.name} 
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
