/**
 * Delegated Classes Card - Shows classes delegated to the officer for today
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, BookOpen, AlertCircle } from 'lucide-react';
import { useReceivedAccessGrants } from '@/hooks/useOfficerClassAccess';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface DelegatedClassesCardProps {
  officerId: string;
  institutionId: string;
}

interface DelegatedClass {
  grantId: string;
  classId: string;
  className: string;
  subject: string;
  periodLabel: string;
  periodTime: string;
  grantingOfficerName: string;
  reason?: string;
}

export function DelegatedClassesCard({ officerId, institutionId }: DelegatedClassesCardProps) {
  // Get grants received by this officer
  const { data: accessGrants, isLoading: isLoadingGrants } = useReceivedAccessGrants(officerId);
  
  // Get timetable assignments for the delegated classes
  const { data: delegatedClasses, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['delegated-classes-today', officerId, accessGrants],
    queryFn: async () => {
      if (!accessGrants || accessGrants.length === 0) return [];
      
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      const delegated: DelegatedClass[] = [];
      
      for (const grant of accessGrants) {
        // Get timetable assignments for this class today
        const { data: assignments } = await supabase
          .from('institution_timetable_assignments')
          .select(`
            *,
            institution_periods!inner (
              label,
              start_time,
              end_time
            )
          `)
          .eq('class_id', grant.class_id)
          .eq('institution_id', institutionId)
          .eq('day', today);
        
        if (assignments) {
          for (const assignment of assignments) {
            delegated.push({
              grantId: grant.id,
              classId: grant.class_id,
              className: assignment.class_name,
              subject: assignment.subject,
              periodLabel: (assignment.institution_periods as any)?.label || '',
              periodTime: `${(assignment.institution_periods as any)?.start_time || ''} - ${(assignment.institution_periods as any)?.end_time || ''}`,
              grantingOfficerName: grant.granting_officer?.full_name || 'Management',
              reason: grant.reason || undefined,
            });
          }
        }
      }
      
      return delegated;
    },
    enabled: !!accessGrants && accessGrants.length > 0,
  });

  const isLoading = isLoadingGrants || isLoadingClasses;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Delegated Classes Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!delegatedClasses || delegatedClasses.length === 0) {
    return null; // Don't show card if no delegated classes
  }

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <Users className="h-5 w-5" />
            Delegated Classes Today
          </CardTitle>
          <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
            {delegatedClasses.length} {delegatedClasses.length === 1 ? 'class' : 'classes'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {delegatedClasses.map((cls) => (
            <div 
              key={`${cls.grantId}-${cls.periodLabel}`}
              className="flex items-center justify-between p-3 bg-background rounded-lg border"
            >
              <div className="flex items-start gap-3">
                <div className="bg-amber-500/10 p-2 rounded-lg">
                  <BookOpen className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-medium">{cls.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {cls.className} • {cls.periodLabel}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{cls.periodTime}</span>
                  </div>
                  {cls.reason && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      "{cls.reason}"
                    </p>
                  )}
                </div>
              </div>
              <Badge className="bg-amber-500 hover:bg-amber-600">
                Delegated
              </Badge>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center mt-2">
            <AlertCircle className="h-3 w-3 inline mr-1" />
            Access granted by management for today
          </p>
        </div>
      </CardContent>
    </Card>
  );
}