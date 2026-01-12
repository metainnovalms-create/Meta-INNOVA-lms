/**
 * Hook for managing officer class access grants
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OfficerClassAccessGrant {
  id: string;
  granting_officer_id: string;
  receiving_officer_id: string;
  class_id: string;
  institution_id: string;
  timetable_assignment_id?: string;
  access_type: 'temporary' | 'permanent';
  valid_from: string;
  valid_until?: string;
  reason?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  granting_officer?: { full_name: string };
  receiving_officer?: { full_name: string };
  class?: { class_name: string };
}

export interface CreateAccessGrantInput {
  receiving_officer_id: string;
  class_id: string;
  institution_id: string;
  timetable_assignment_id?: string;
  access_type: 'temporary' | 'permanent';
  valid_from: string;
  valid_until?: string;
  reason?: string;
}

export function useOfficerClassAccessGrants(officerId?: string) {
  return useQuery({
    queryKey: ['officer-class-access-grants', officerId],
    queryFn: async () => {
      if (!officerId) return [];
      
      const { data, error } = await supabase
        .from('officer_class_access_grants')
        .select('*')
        .or(`granting_officer_id.eq.${officerId},receiving_officer_id.eq.${officerId}`)
        .eq('is_active', true);

      if (error) throw error;
      return data as OfficerClassAccessGrant[];
    },
    enabled: !!officerId,
  });
}

export function useReceivedAccessGrants(officerId?: string) {
  return useQuery({
    queryKey: ['received-access-grants', officerId],
    queryFn: async () => {
      if (!officerId) return [];
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('officer_class_access_grants')
        .select(`
          *,
          granting_officer:officers!fk_granting_officer(full_name),
          class:classes!fk_class(class_name)
        `)
        .eq('receiving_officer_id', officerId)
        .eq('is_active', true)
        .lte('valid_from', today)
        .or(`valid_until.is.null,valid_until.gte.${today}`);

      if (error) throw error;
      return data as OfficerClassAccessGrant[];
    },
    enabled: !!officerId,
  });
}

export function useCreateAccessGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ grantingOfficerId, grant }: { grantingOfficerId: string; grant: CreateAccessGrantInput }) => {
      const { data, error } = await supabase
        .from('officer_class_access_grants')
        .insert({
          granting_officer_id: grantingOfficerId,
          receiving_officer_id: grant.receiving_officer_id,
          class_id: grant.class_id,
          institution_id: grant.institution_id,
          timetable_assignment_id: grant.timetable_assignment_id,
          access_type: grant.access_type,
          valid_from: grant.valid_from,
          valid_until: grant.valid_until,
          reason: grant.reason,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officer-class-access-grants'] });
      queryClient.invalidateQueries({ queryKey: ['received-access-grants'] });
      toast.success('Access granted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to grant access: ${error.message}`);
    },
  });
}

export function useRevokeAccessGrant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grantId: string) => {
      const { error } = await supabase
        .from('officer_class_access_grants')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', grantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['officer-class-access-grants'] });
      queryClient.invalidateQueries({ queryKey: ['received-access-grants'] });
      toast.success('Access revoked successfully');
    },
    onError: (error) => {
      toast.error(`Failed to revoke access: ${error.message}`);
    },
  });
}

// Check if officer has access to a class (as primary, secondary, backup, or granted)
export async function checkOfficerClassAccess(
  officerId: string,
  classId: string,
  institutionId: string
): Promise<{ hasAccess: boolean; accessType: 'primary' | 'secondary' | 'backup' | 'granted' | null }> {
  // Check timetable assignments
  const { data: timetableAccess } = await supabase
    .from('institution_timetable_assignments')
    .select('teacher_id, secondary_officer_id, backup_officer_id')
    .eq('class_id', classId)
    .eq('institution_id', institutionId);

  if (timetableAccess) {
    for (const assignment of timetableAccess) {
      if (assignment.teacher_id === officerId) {
        return { hasAccess: true, accessType: 'primary' };
      }
      if (assignment.secondary_officer_id === officerId) {
        return { hasAccess: true, accessType: 'secondary' };
      }
      if (assignment.backup_officer_id === officerId) {
        return { hasAccess: true, accessType: 'backup' };
      }
    }
  }

  // Check granted access
  const today = new Date().toISOString().split('T')[0];
  const { data: grantedAccess } = await supabase
    .from('officer_class_access_grants')
    .select('id')
    .eq('receiving_officer_id', officerId)
    .eq('class_id', classId)
    .eq('is_active', true)
    .lte('valid_from', today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .limit(1);

  if (grantedAccess && grantedAccess.length > 0) {
    return { hasAccess: true, accessType: 'granted' };
  }

  return { hasAccess: false, accessType: null };
}
