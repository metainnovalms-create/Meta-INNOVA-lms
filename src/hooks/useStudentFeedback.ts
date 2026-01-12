import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitFeedback,
  getFeedbackList,
  getFeedbackById,
  updateFeedbackStatus,
  getStudentFeedback,
  getFeedbackStats,
  deleteFeedback,
  StudentFeedback,
  FeedbackFilters,
} from "@/services/studentFeedback.service";
import { toast } from "sonner";

export function useFeedbackList(filters?: FeedbackFilters) {
  return useQuery({
    queryKey: ['feedback-list', filters],
    queryFn: () => getFeedbackList(filters),
  });
}

export function useFeedbackById(feedbackId: string | undefined) {
  return useQuery({
    queryKey: ['feedback', feedbackId],
    queryFn: () => getFeedbackById(feedbackId!),
    enabled: !!feedbackId,
  });
}

export function useStudentOwnFeedback(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-feedback', studentId],
    queryFn: () => getStudentFeedback(studentId!),
    enabled: !!studentId,
  });
}

export function useFeedbackStats(institutionId?: string) {
  return useQuery({
    queryKey: ['feedback-stats', institutionId],
    queryFn: () => getFeedbackStats(institutionId),
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedback: StudentFeedback) => submitFeedback(feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] });
      queryClient.invalidateQueries({ queryKey: ['student-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      toast.success("Feedback submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit feedback: ${error.message}`);
    },
  });
}

export function useUpdateFeedbackStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      feedbackId,
      status,
      adminResponse,
      adminUserId,
    }: {
      feedbackId: string;
      status: 'submitted' | 'under_review' | 'resolved' | 'dismissed';
      adminResponse?: string;
      adminUserId?: string;
    }) => updateFeedbackStatus(feedbackId, status, adminResponse, adminUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] });
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      toast.success("Feedback status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update feedback: ${error.message}`);
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (feedbackId: string) => deleteFeedback(feedbackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-list'] });
      queryClient.invalidateQueries({ queryKey: ['feedback-stats'] });
      toast.success("Feedback deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete feedback: ${error.message}`);
    },
  });
}
