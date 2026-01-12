import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getHRRatings,
  getHRRatingById,
  createHRRating,
  updateHRRating,
  deleteHRRating,
  getRatingsByTrainer,
  getRatingsByPeriod,
  getCumulativeStars,
  verifyProjectRating,
  HRRating,
  CreateHRRatingData,
  UpdateHRRatingData,
  HRRatingProject
} from '@/services/hrRating.service';

const QUERY_KEY = 'hr_ratings';

// Fetch all HR ratings
export function useHRRatings() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: getHRRatings
  });
}

// Fetch single HR rating by ID
export function useHRRatingById(id: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => (id ? getHRRatingById(id) : null),
    enabled: !!id
  });
}

// Fetch ratings by trainer
export function useRatingsByTrainer(trainerId: string | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'trainer', trainerId],
    queryFn: () => (trainerId ? getRatingsByTrainer(trainerId) : []),
    enabled: !!trainerId
  });
}

// Fetch ratings by period and year
export function useRatingsByPeriod(period: string | null, year: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'period', period, year],
    queryFn: () => (period && year ? getRatingsByPeriod(period, year) : []),
    enabled: !!period && !!year
  });
}

// Fetch cumulative stars for a trainer
export function useCumulativeStars(trainerId: string | null, year: number | null) {
  return useQuery({
    queryKey: [QUERY_KEY, 'cumulative', trainerId, year],
    queryFn: () => (trainerId && year ? getCumulativeStars(trainerId, year) : 0),
    enabled: !!trainerId && !!year
  });
}

// Create HR rating mutation
export function useCreateHRRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateHRRatingData) => createHRRating(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });
}

// Update HR rating mutation
export function useUpdateHRRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHRRatingData }) => updateHRRating(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, variables.id] });
    }
  });
}

// Delete HR rating mutation
export function useDeleteHRRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHRRating(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });
}

// Verify project rating mutation
export function useVerifyProjectRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, verifiedBy }: { projectId: string; verifiedBy: string }) =>
      verifyProjectRating(projectId, verifiedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    }
  });
}

// Real-time subscription hook
export function useRealtimeHRRatings() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('hr_ratings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hr_ratings'
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
export type { HRRating, CreateHRRatingData, UpdateHRRatingData, HRRatingProject };
