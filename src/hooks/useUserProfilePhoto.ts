import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserProfilePhoto(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-profile-photo', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile photo:', error);
        return null;
      }
      
      return data?.avatar || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-profile-photo', userId] });
  };

  return {
    photoUrl: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    invalidate,
  };
}

export async function updateProfilePhoto(userId: string, photoUrl: string | null) {
  // Update profiles table - the database trigger will sync to students/officers
  const { error } = await supabase
    .from('profiles')
    .update({ avatar: photoUrl })
    .eq('id', userId);

  if (error) {
    console.error('Error updating profile photo:', error);
    throw error;
  }

  return true;
}
