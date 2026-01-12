import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getAppraisals,
  getAppraisalById,
  createAppraisal,
  updateAppraisal,
  deleteAppraisal,
  submitAppraisalReview,
  getAppraisalsByTrainer,
  getAppraisalsByInstitution,
  PerformanceAppraisal,
  CreateAppraisalData,
  UpdateAppraisalData,
  ReviewSignOff,
  HRReview
} from '@/services/performanceAppraisal.service';

const QUERY_KEY = 'performance_appraisals';

// Fetch all appraisals
export function useAppraisals() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: getAppraisals
  });
}

// Fetch single appraisal by ID
export function useAppraisalById(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => (id ? getAppraisalById(id) : null),
    enabled: !!id
  });
}

// Fetch appraisals by trainer
export function useAppraisalsByTrainer(trainerId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'trainer', trainerId],
    queryFn: () => (trainerId ? getAppraisalsByTrainer(trainerId) : []),
    enabled: !!trainerId
  });
}

// Fetch appraisals by institution
export function useAppraisalsByInstitution(institutionId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'institution', institutionId],
    queryFn: () => (institutionId ? getAppraisalsByInstitution(institutionId) : []),
    enabled: !!institutionId
  });
}

// Create appraisal mutation
export function useCreateAppraisal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppraisalData) => createAppraisal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });
}

// Update appraisal mutation
export function useUpdateAppraisal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppraisalData }) => updateAppraisal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    }
  });
}

// Delete appraisal mutation
export function useDeleteAppraisal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAppraisal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });
}

// Submit review mutation
export function useSubmitAppraisalReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      reviewType,
      reviewData
    }: {
      id: string;
      reviewType: 'manager' | 'principal' | 'hr';
      reviewData: ReviewSignOff | HRReview;
    }) => submitAppraisalReview(id, reviewType, reviewData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    }
  });
}

// Real-time subscription hook
export function useRealtimeAppraisals() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('performance_appraisals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_appraisals'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// Export types
export type { PerformanceAppraisal, CreateAppraisalData, UpdateAppraisalData, ReviewSignOff, HRReview };
