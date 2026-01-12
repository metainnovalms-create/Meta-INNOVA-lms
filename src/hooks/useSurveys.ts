import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getSurveys, 
  getSurveyById, 
  createSurvey, 
  updateSurveyStatus, 
  closeSurvey, 
  deleteSurvey,
  getActiveSurveysForStudent,
  getSurveyAnalytics,
  Survey,
  SurveyQuestion
} from "@/services/survey.service";
import { toast } from "sonner";

export function useSurveys(filters?: {
  status?: string;
  institution_id?: string;
  created_by?: string;
}) {
  return useQuery({
    queryKey: ['surveys', filters],
    queryFn: () => getSurveys(filters),
  });
}

export function useSurveyById(surveyId: string | undefined) {
  return useQuery({
    queryKey: ['survey', surveyId],
    queryFn: () => getSurveyById(surveyId!),
    enabled: !!surveyId,
  });
}

export function useActiveSurveysForStudent(
  studentId: string | undefined,
  institutionId: string | undefined,
  classId?: string
) {
  return useQuery({
    queryKey: ['active-surveys', studentId, institutionId, classId],
    queryFn: () => getActiveSurveysForStudent(studentId!, institutionId!, classId),
    enabled: !!studentId && !!institutionId,
  });
}

export function useSurveyAnalytics(surveyId: string | undefined) {
  return useQuery({
    queryKey: ['survey-analytics', surveyId],
    queryFn: () => getSurveyAnalytics(surveyId!),
    enabled: !!surveyId,
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ survey, questions }: { survey: Survey; questions: SurveyQuestion[] }) => 
      createSurvey(survey, questions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success("Survey created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create survey: ${error.message}`);
    },
  });
}

export function useUpdateSurveyStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ surveyId, status }: { surveyId: string; status: 'active' | 'closed' | 'draft' }) => 
      updateSurveyStatus(surveyId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success("Survey status updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update survey: ${error.message}`);
    },
  });
}

export function useCloseSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string) => closeSurvey(surveyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success("Survey closed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to close survey: ${error.message}`);
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (surveyId: string) => deleteSurvey(surveyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      toast.success("Survey deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete survey: ${error.message}`);
    },
  });
}
