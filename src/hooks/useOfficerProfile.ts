import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OfficerProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  employee_id: string | null;
  assigned_institutions: string[];
  department: string | null;
  designation: string | null;
  status: string;
  profile_photo_url: string | null;
  annual_salary: number | null;
}

/**
 * Hook to get officer profile by user_id
 */
export function useOfficerByUserId(userId: string | undefined) {
  return useQuery({
    queryKey: ['officer', 'by-user', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('officers')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No officer found for this user
          return null;
        }
        throw error;
      }
      
      return data as OfficerProfile;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to get officer's primary institution ID
 */
export function useOfficerPrimaryInstitution(userId: string | undefined) {
  const { data: officer, isLoading, error } = useOfficerByUserId(userId);
  
  const primaryInstitutionId = officer?.assigned_institutions?.[0] || null;
  
  return {
    officerId: officer?.id || null,
    primaryInstitutionId,
    officer,
    isLoading,
    error,
  };
}
