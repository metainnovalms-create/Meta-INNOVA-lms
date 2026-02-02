import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Building2, GraduationCap, Users } from 'lucide-react';
import { useComprehensiveAnalytics } from '@/hooks/useComprehensiveAnalytics';
import { InstitutionOverview } from './InstitutionOverview';
import { ClassAnalyticsView } from './ClassAnalyticsView';
import { StudentAnalyticsView } from './StudentAnalyticsView';

interface ComprehensiveAnalyticsTabProps {
  institutionId: string;
  institutionName: string;
}

export function ComprehensiveAnalyticsTab({ institutionId, institutionName }: ComprehensiveAnalyticsTabProps) {
  const { data, isLoading, error } = useComprehensiveAnalytics(institutionId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Failed to load analytics</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total_students === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            No student data available. Analytics will appear once students and assessments are added.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Comprehensive Performance Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Institution, class, and student-level performance metrics for {institutionName}
        </p>
      </div>

      <Tabs defaultValue="institution" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="institution" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Institution Overview
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Class Analytics
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="institution">
          <InstitutionOverview data={data} institutionName={institutionName} />
        </TabsContent>

        <TabsContent value="classes">
          <ClassAnalyticsView classes={data.classPerformance} />
        </TabsContent>

        <TabsContent value="students">
          <StudentAnalyticsView classes={data.classPerformance} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
