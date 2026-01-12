import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitSurveyResponse,
  getSurveyResponses,
  getStudentResponses,
  hasStudentCompletedSurvey,
  getSurveyResponseCount,
  SurveyResponseSubmission,
} from "@/services/surveyResponse.service";
import { toast } from "sonner";

export function useSurveyResponses(surveyId: string | undefined) {
  return useQuery({
    queryKey: ['survey-responses', surveyId],
    queryFn: () => getSurveyResponses(surveyId!),
    enabled: !!surveyId,
  });
}

export function useStudentSurveyResponses(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student-survey-responses', studentId],
    queryFn: () => getStudentResponses(studentId!),
    enabled: !!studentId,
  });
}

export function useHasCompletedSurvey(studentId: string | undefined, surveyId: string | undefined) {
  return useQuery({
    queryKey: ['survey-completed', studentId, surveyId],
    queryFn: () => hasStudentCompletedSurvey(studentId!, surveyId!),
    enabled: !!studentId && !!surveyId,
  });
}

export function useSurveyResponseCount(surveyId: string | undefined) {
  return useQuery({
    queryKey: ['survey-response-count', surveyId],
    queryFn: () => getSurveyResponseCount(surveyId!),
    enabled: !!surveyId,
  });
}

export function useSubmitSurveyResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submission: SurveyResponseSubmission) => submitSurveyResponse(submission),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['survey-responses', variables.survey_id] });
      queryClient.invalidateQueries({ queryKey: ['student-survey-responses'] });
      queryClient.invalidateQueries({ queryKey: ['active-surveys'] });
      queryClient.invalidateQueries({ queryKey: ['survey-completed'] });
      toast.success("Survey response submitted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to submit response: ${error.message}`);
    },
  });
}
