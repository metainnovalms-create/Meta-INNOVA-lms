import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvailableSubstituteOption {
  id: string;
  name: string;
  type: 'none' | 'officer' | 'staff';
  skills?: string[];
}

/**
 * Fetches available substitutes (officers and staff) from the same institution
 * Excludes the current user and adds a "No Substitute Required" option
 */
export function useAvailableSubstitutes(
  institutionId: string | undefined,
  excludeUserId: string | undefined
) {
  return useQuery({
    queryKey: ['available-substitutes', institutionId, excludeUserId],
    queryFn: async (): Promise<AvailableSubstituteOption[]> => {
      const substitutes: AvailableSubstituteOption[] = [
        { id: 'no-substitute', name: 'No Substitute Required', type: 'none' }
      ];
      
      if (!institutionId) return substitutes;
      
      // Fetch active officers from the same institution
      const { data: officers, error: officersError } = await supabase
        .from('officers')
        .select('id, user_id, full_name, skills')
        .contains('assigned_institutions', [institutionId])
        .eq('status', 'active');
      
      if (officersError) {
        console.error('Error fetching officers for substitutes:', officersError);
      } else if (officers) {
        officers.forEach(officer => {
          // Exclude the current user
          if (officer.user_id !== excludeUserId) {
            substitutes.push({
              id: officer.user_id || officer.id,
              name: officer.full_name,
              type: 'officer',
              skills: Array.isArray(officer.skills) ? officer.skills as string[] : []
            });
          }
        });
      }
      
      // Optionally fetch staff from the same institution (profiles table)
      const { data: staffProfiles, error: staffError } = await supabase
        .from('profiles')
        .select('id, name, position_name')
        .eq('institution_id', institutionId)
        .not('id', 'is', null);
      
      if (staffError) {
        console.error('Error fetching staff for substitutes:', staffError);
      } else if (staffProfiles) {
        staffProfiles.forEach(staff => {
          // Exclude the current user and avoid duplicates with officers
          if (staff.id !== excludeUserId) {
            // Check if this person is already in the list as an officer
            const isAlreadyOfficer = substitutes.some(s => s.id === staff.id);
            if (!isAlreadyOfficer) {
              substitutes.push({
                id: staff.id,
                name: staff.name + (staff.position_name ? ` (${staff.position_name})` : ' (Staff)'),
                type: 'staff'
              });
            }
          }
        });
      }
      
      return substitutes;
    },
    enabled: !!institutionId
  });
}

/**
 * Hook to get the current officer's institution ID
 */
export function useOfficerInstitution(userId: string | undefined) {
  return useQuery({
    queryKey: ['officer-institution', userId],
    queryFn: async (): Promise<string | null> => {
      if (!userId) return null;
      
      const { data: officer, error } = await supabase
        .from('officers')
        .select('assigned_institutions')
        .eq('user_id', userId)
        .single();
      
      if (error || !officer?.assigned_institutions?.length) {
        return null;
      }
      
      return officer.assigned_institutions[0];
    },
    enabled: !!userId
  });
}
