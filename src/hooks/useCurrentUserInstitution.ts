import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCurrentUserInstitution() {
  const { data: institutionId, isLoading, error } = useQuery({
    queryKey: ['current-user-institution'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('institution_id')
        .eq('id', user.id)
        .maybeSingle();
        
      if (error) {
        console.error('[useCurrentUserInstitution] Error fetching profile:', error);
        throw error;
      }
      
      return profile?.institution_id || null;
    },
    staleTime: 60000, // 1 minute
  });

  return { institutionId, isLoading, error };
}

// Hook to get full institution details for current user
export function useCurrentUserInstitutionDetails() {
  const { institutionId, isLoading: isLoadingId } = useCurrentUserInstitution();
  
  const { data: institution, isLoading: isLoadingInstitution, error } = useQuery({
    queryKey: ['current-user-institution-details', institutionId],
    queryFn: async () => {
      if (!institutionId) return null;
      
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('id', institutionId)
        .maybeSingle();
        
      if (error) {
        console.error('[useCurrentUserInstitutionDetails] Error:', error);
        throw error;
      }
      
      return data;
    },
    enabled: !!institutionId,
    staleTime: 60000,
  });

  return { 
    institution, 
    institutionId,
    isLoading: isLoadingId || isLoadingInstitution, 
    error 
  };
}
