import { useQuery,useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClassAssessmentMapping {
  id: string;
  class_id: string;
  institution_id: string;
  academic_year: string;
  fa1_assessment_id: string | null;
  fa2_assessment_id: string | null;
  final_assessment_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MappingWithDetails extends ClassAssessmentMapping {
  fa1_assessment?: { id: string; title: string } | null;
  fa2_assessment?: { id: string; title: string } | null;
  final_assessment?: { id: string; title: string } | null;
}

export function useClassAssessmentMapping(classId: string | undefined, academicYear: string = '2024-25') {
  const queryClient = useQueryClient();

  const { data: mapping, isLoading, error } = useQuery({
    queryKey: ['class-assessment-mapping', classId, academicYear],
    queryFn: async (): Promise<MappingWithDetails | null> => {
      if (!classId) return null;

      // First get the mapping
      const { data: mappingData, error: mappingError } = await supabase
        .from('class_assessment_mapping')
        .select('*')
        .eq('class_id', classId)
        .eq('academic_year', academicYear)
        .maybeSingle();

      if (mappingError) {
        console.error('Error fetching mapping:', mappingError);
        return null;
      }

      if (!mappingData) return null;

      // Fetch assessment details separately
      const assessmentIds = [
        mappingData.fa1_assessment_id,
        mappingData.fa2_assessment_id,
        mappingData.final_assessment_id,
      ].filter(Boolean);

      let assessmentsMap: Record<string, { id: string; title: string }> = {};
      if (assessmentIds.length > 0) {
        const { data: assessments } = await supabase
          .from('assessments')
          .select('id, title')
          .in('id', assessmentIds);
        
        assessmentsMap = Object.fromEntries(
          (assessments || []).map(a => [a.id, { id: a.id, title: a.title }])
        );
      }

      return {
        ...mappingData,
        fa1_assessment: mappingData.fa1_assessment_id ? assessmentsMap[mappingData.fa1_assessment_id] || null : null,
        fa2_assessment: mappingData.fa2_assessment_id ? assessmentsMap[mappingData.fa2_assessment_id] || null : null,
        final_assessment: mappingData.final_assessment_id ? assessmentsMap[mappingData.final_assessment_id] || null : null,
      };
    },
    enabled: !!classId,
  });

  const saveMappingMutation = useMutation({
    mutationFn: async (data: {
      class_id: string;
      institution_id: string;
      academic_year: string;
      fa1_assessment_id: string | null;
      fa2_assessment_id: string | null;
      final_assessment_id: string | null;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { data: result, error } = await supabase
        .from('class_assessment_mapping')
        .upsert({
          ...data,
          created_by: user?.user?.id,
        }, {
          onConflict: 'class_id,academic_year',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-assessment-mapping'] });
      toast.success('Assessment mapping saved successfully');
    },
    onError: (error) => {
      console.error('Error saving mapping:', error);
      toast.error('Failed to save assessment mapping');
    },
  });

  return {
    mapping,
    isLoading,
    error,
    saveMapping: saveMappingMutation.mutate,
    isSaving: saveMappingMutation.isPending,
  };
}

export function useInstitutionMappings(institutionId: string | undefined, academicYear: string = '2024-25') {
  return useQuery({
    queryKey: ['institution-assessment-mappings', institutionId, academicYear],
    queryFn: async (): Promise<MappingWithDetails[]> => {
      if (!institutionId) return [];

      const { data: mappings, error } = await supabase
        .from('class_assessment_mapping')
        .select('*')
        .eq('institution_id', institutionId)
        .eq('academic_year', academicYear);

      if (error) {
        console.error('Error fetching mappings:', error);
        return [];
      }

      if (!mappings || mappings.length === 0) return [];

      // Collect all assessment IDs
      const assessmentIds = mappings.flatMap(m => [
        m.fa1_assessment_id,
        m.fa2_assessment_id,
        m.final_assessment_id,
      ]).filter(Boolean) as string[];

      let assessmentsMap: Record<string, { id: string; title: string }> = {};
      if (assessmentIds.length > 0) {
        const { data: assessments } = await supabase
          .from('assessments')
          .select('id, title')
          .in('id', [...new Set(assessmentIds)]);
        
        assessmentsMap = Object.fromEntries(
          (assessments || []).map(a => [a.id, { id: a.id, title: a.title }])
        );
      }

      return mappings.map(m => ({
        ...m,
        fa1_assessment: m.fa1_assessment_id ? assessmentsMap[m.fa1_assessment_id] || null : null,
        fa2_assessment: m.fa2_assessment_id ? assessmentsMap[m.fa2_assessment_id] || null : null,
        final_assessment: m.final_assessment_id ? assessmentsMap[m.final_assessment_id] || null : null,
      }));
    },
    enabled: !!institutionId,
  });
}

export function useClassAssignedAssessments(classId: string | undefined) {
  return useQuery({
    queryKey: ['class-assigned-assessments', classId],
    queryFn: async () => {
      if (!classId) return [];

      const { data, error } = await supabase
        .from('assessment_class_assignments')
        .select(`
          assessment_id,
          assessments:assessment_id (
            id,
            title,
            status,
            duration_minutes,
            total_points
          )
        `)
        .eq('class_id', classId);

      if (error) {
        console.error('Error fetching assigned assessments:', error);
        return [];
      }

      return data?.map(d => d.assessments).filter(Boolean) || [];
    },
    enabled: !!classId,
  });
}
