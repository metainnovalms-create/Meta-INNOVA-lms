import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { OfficerAssignment } from '@/types/institution';

export interface DatabaseOfficer {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  employee_id: string | null;
  profile_photo_url: string | null;
  status: string;
  assigned_institutions: string[] | null;
  created_at: string | null;
}

interface OfficerAssignmentRecord {
  officer_id: string;
  institution_id: string;
  assigned_at: string;
  officers: DatabaseOfficer;
}

// Hook to get officers assigned to a specific institution
export function useOfficersByInstitution(institutionId: string | undefined) {
  const [officers, setOfficers] = useState<OfficerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOfficers = async () => {
    if (!institutionId) {
      setOfficers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Query the junction table with officer details
      const { data, error } = await supabase
        .from('officer_institution_assignments')
        .select(`
          officer_id,
          institution_id,
          assigned_at,
          officers (
            id,
            full_name,
            email,
            phone,
            employee_id,
            profile_photo_url,
            status
          )
        `)
        .eq('institution_id', institutionId)
        .eq('status', 'active');

      if (error) throw error;

      const mappedOfficers: OfficerAssignment[] = (data || []).map((record: any) => ({
        officer_id: record.officers.id,
        officer_name: record.officers.full_name,
        employee_id: record.officers.employee_id || 'N/A',
        email: record.officers.email,
        phone: record.officers.phone || '',
        avatar: record.officers.profile_photo_url || undefined,
        assigned_date: record.assigned_at, // Use the actual assignment date
        total_courses: 0,
        total_teaching_hours: 0,
        status: record.officers.status as 'active' | 'inactive',
      }));

      setOfficers(mappedOfficers);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching assigned officers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [institutionId]);

  return { officers, isLoading, error, refetch: fetchOfficers };
}

// Hook to get officers NOT assigned to a specific institution (available for assignment)
export function useAvailableOfficers(institutionId: string | undefined) {
  const [officers, setOfficers] = useState<OfficerAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAvailableOfficers = async () => {
    if (!institutionId) {
      setOfficers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Get officers already assigned to this institution
      const { data: assignedOfficers } = await supabase
        .from('officer_institution_assignments')
        .select('officer_id')
        .eq('institution_id', institutionId)
        .eq('status', 'active');

      const assignedOfficerIds = (assignedOfficers || []).map(a => a.officer_id);

      // Get all active officers not in the assigned list
      let query = supabase
        .from('officers')
        .select('*')
        .eq('status', 'active');

      if (assignedOfficerIds.length > 0) {
        query = query.not('id', 'in', `(${assignedOfficerIds.join(',')})`);
      }

      const { data: allOfficers, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mappedOfficers: OfficerAssignment[] = (allOfficers || []).map((officer: DatabaseOfficer) => ({
        officer_id: officer.id,
        officer_name: officer.full_name,
        employee_id: officer.employee_id || 'N/A',
        email: officer.email,
        phone: officer.phone || '',
        avatar: officer.profile_photo_url || undefined,
        assigned_date: new Date().toISOString(),
        total_courses: 0,
        total_teaching_hours: 0,
        status: 'active',
      }));

      setOfficers(mappedOfficers);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching available officers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableOfficers();
  }, [institutionId]);

  return { officers, isLoading, error, refetch: fetchAvailableOfficers };
}

// Hook to manage officer assignments
export function useOfficerAssignment(institutionId: string | undefined) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const assignOfficer = async (officerId: string) => {
    if (!institutionId) {
      toast.error('Institution ID is required');
      return;
    }

    setIsAssigning(true);
    try {
      // Insert into the junction table
      const { error: insertError } = await supabase
        .from('officer_institution_assignments')
        .insert({
          officer_id: officerId,
          institution_id: institutionId,
          assigned_at: new Date().toISOString(),
          status: 'active'
        });

      if (insertError) throw insertError;

      // Also update the officers.assigned_institutions array for backward compatibility
      const { data: officer, error: fetchError } = await supabase
        .from('officers')
        .select('assigned_institutions')
        .eq('id', officerId)
        .single();

      if (fetchError) throw fetchError;

      const currentInstitutions = officer?.assigned_institutions || [];
      
      if (!currentInstitutions.includes(institutionId)) {
        const updatedInstitutions = [...currentInstitutions, institutionId];
        
        const { error: updateError } = await supabase
          .from('officers')
          .update({ assigned_institutions: updatedInstitutions })
          .eq('id', officerId);

        if (updateError) throw updateError;
      }
    } catch (err) {
      console.error('Error assigning officer:', err);
      throw err;
    } finally {
      setIsAssigning(false);
    }
  };

  const removeOfficer = async (officerId: string) => {
    if (!institutionId) {
      toast.error('Institution ID is required');
      return;
    }

    setIsRemoving(true);
    try {
      // Delete from the junction table
      const { error: deleteError } = await supabase
        .from('officer_institution_assignments')
        .delete()
        .eq('officer_id', officerId)
        .eq('institution_id', institutionId);

      if (deleteError) throw deleteError;

      // Also update the officers.assigned_institutions array for backward compatibility
      const { data: officer, error: fetchError } = await supabase
        .from('officers')
        .select('assigned_institutions')
        .eq('id', officerId)
        .single();

      if (fetchError) throw fetchError;

      const currentInstitutions = officer?.assigned_institutions || [];
      const updatedInstitutions = currentInstitutions.filter(
        (id: string) => id !== institutionId
      );
      
      const { error: updateError } = await supabase
        .from('officers')
        .update({ assigned_institutions: updatedInstitutions })
        .eq('id', officerId);

      if (updateError) throw updateError;
    } catch (err) {
      console.error('Error removing officer:', err);
      throw err;
    } finally {
      setIsRemoving(false);
    }
  };

  return { assignOfficer, removeOfficer, isAssigning, isRemoving };
}
