import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PendingProject {
  id: string;
  title: string;
  status: string;
  team: string;
}

/**
 * Hook to fetch projects pending review for the officer's institution
 */
export function useOfficerPendingProjects(institutionId: string | undefined) {
  return useQuery({
    queryKey: ['officer-pending-projects', institutionId],
    queryFn: async (): Promise<PendingProject[]> => {
      if (!institutionId) return [];

      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          title,
          status,
          created_by_officer_name,
          project_members (
            students (
              student_name
            )
          )
        `)
        .eq('institution_id', institutionId)
        .in('status', ['pending_review', 'submitted', 'ongoing'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching pending projects:', error);
        return [];
      }

      return (data || []).map(project => {
        // Get team name from project members
        let teamName = '';
        if (project.project_members && project.project_members.length > 0) {
          const memberNames = project.project_members
            .slice(0, 2)
            .map((m: any) => m.students?.student_name)
            .filter(Boolean);
          teamName = memberNames.length > 0 
            ? memberNames.join(', ') + (project.project_members.length > 2 ? ` +${project.project_members.length - 2}` : '')
            : 'No members';
        }

        return {
          id: project.id,
          title: project.title,
          status: project.status,
          team: teamName || project.created_by_officer_name || 'Unassigned',
        };
      });
    },
    enabled: !!institutionId,
  });
}
