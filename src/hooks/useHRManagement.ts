import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  JobPosting,
  JobApplication,
  InterviewStage,
  CandidateInterview,
  InterviewFeedback,
  CandidateOffer,
  CreateJobPostingData,
  CreateApplicationData,
  ScheduleInterviewData,
  CreateOfferData,
} from '@/types/hr';

// ============ JOB POSTINGS ============

export function useJobPostings() {
  return useQuery({
    queryKey: ['job-postings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as JobPosting[];
    },
  });
}

export function useJobPosting(id: string) {
  return useQuery({
    queryKey: ['job-posting', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as JobPosting;
    },
    enabled: !!id,
  });
}

export function useCreateJobPosting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateJobPostingData) => {
      const { data: result, error } = await supabase
        .from('job_postings')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      toast({ title: 'Job posting created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create job posting', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateJobPosting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<JobPosting> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('job_postings')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      queryClient.invalidateQueries({ queryKey: ['job-posting', variables.id] });
      toast({ title: 'Job posting updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update job posting', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteJobPosting() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-postings'] });
      toast({ title: 'Job posting deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete job posting', description: error.message, variant: 'destructive' });
    },
  });
}

// ============ JOB APPLICATIONS ============

export function useJobApplications(jobId?: string) {
  return useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: async () => {
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job:job_postings(*)
        `)
        .order('applied_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (JobApplication & { job: JobPosting })[];
    },
  });
}

export function useJobApplication(id: string) {
  return useQuery({
    queryKey: ['job-application', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job:job_postings(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as JobApplication & { job: JobPosting };
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      const { data: result, error } = await supabase
        .from('job_applications')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast({ title: 'Application submitted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to submit application', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<JobApplication> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('job_applications')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      queryClient.invalidateQueries({ queryKey: ['job-application', variables.id] });
      toast({ title: 'Application updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update application', description: error.message, variant: 'destructive' });
    },
  });
}

// ============ INTERVIEW STAGES ============

export function useInterviewStages(jobId: string) {
  return useQuery({
    queryKey: ['interview-stages', jobId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_stages')
        .select('*')
        .eq('job_id', jobId)
        .order('stage_order', { ascending: true });

      if (error) throw error;
      return data as InterviewStage[];
    },
    enabled: !!jobId,
  });
}

export function useCreateInterviewStages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (stages: Omit<InterviewStage, 'id' | 'created_at'>[]) => {
      const { data, error } = await supabase
        .from('interview_stages')
        .insert(stages)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      if (variables[0]?.job_id) {
        queryClient.invalidateQueries({ queryKey: ['interview-stages', variables[0].job_id] });
      }
      toast({ title: 'Interview stages created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create interview stages', description: error.message, variant: 'destructive' });
    },
  });
}

// ============ CANDIDATE INTERVIEWS ============

export function useCandidateInterviews(applicationId?: string) {
  return useQuery({
    queryKey: ['candidate-interviews', applicationId],
    queryFn: async () => {
      let query = supabase
        .from('candidate_interviews')
        .select(`
          *,
          stage:interview_stages(*),
          application:job_applications(*, job:job_postings(*))
        `)
        .order('scheduled_date', { ascending: true });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CandidateInterview[];
    },
  });
}

export function useScheduleInterview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: ScheduleInterviewData) => {
      // Update application status to in_interview
      await supabase
        .from('job_applications')
        .update({ status: 'in_interview' })
        .eq('id', data.application_id);

      const { data: result, error } = await supabase
        .from('candidate_interviews')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-interviews'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast({ title: 'Interview scheduled successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to schedule interview', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CandidateInterview> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('candidate_interviews')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-interviews'] });
      toast({ title: 'Interview updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update interview', description: error.message, variant: 'destructive' });
    },
  });
}

// ============ INTERVIEW FEEDBACK ============

export function useInterviewFeedback(interviewId: string) {
  return useQuery({
    queryKey: ['interview-feedback', interviewId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interview_feedback')
        .select('*')
        .eq('interview_id', interviewId);

      if (error) throw error;
      return data as InterviewFeedback[];
    },
    enabled: !!interviewId,
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<InterviewFeedback, 'id' | 'submitted_at'>) => {
      const { data: result, error } = await supabase
        .from('interview_feedback')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['interview-feedback', variables.interview_id] });
      toast({ title: 'Feedback submitted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to submit feedback', description: error.message, variant: 'destructive' });
    },
  });
}

// ============ CANDIDATE OFFERS ============

export function useCandidateOffers(applicationId?: string) {
  return useQuery({
    queryKey: ['candidate-offers', applicationId],
    queryFn: async () => {
      let query = supabase
        .from('candidate_offers')
        .select(`
          *,
          application:job_applications(*, job:job_postings(*))
        `)
        .order('created_at', { ascending: false });

      if (applicationId) {
        query = query.eq('application_id', applicationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (CandidateOffer & { application: JobApplication & { job: JobPosting } })[];
    },
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateOfferData) => {
      const { data: result, error } = await supabase
        .from('candidate_offers')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-offers'] });
      toast({ title: 'Offer created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create offer', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CandidateOffer> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('candidate_offers')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['candidate-offers'] });
      queryClient.invalidateQueries({ queryKey: ['candidate-offers', variables.id] });
      toast({ title: 'Offer updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update offer', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('candidate_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-offers'] });
      toast({ title: 'Offer deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete offer', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSendOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ offerId, applicationId }: { offerId: string; applicationId: string }) => {
      // Update offer status
      const { error: offerError } = await supabase
        .from('candidate_offers')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', offerId);

      if (offerError) throw offerError;

      // Update application status
      const { error: appError } = await supabase
        .from('job_applications')
        .update({ status: 'offer_sent' })
        .eq('id', applicationId);

      if (appError) throw appError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-offers'] });
      queryClient.invalidateQueries({ queryKey: ['job-applications'] });
      toast({ title: 'Offer sent successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send offer', description: error.message, variant: 'destructive' });
    },
  });
}

// ============ DASHBOARD STATS ============

export function useHRDashboardStats() {
  return useQuery({
    queryKey: ['hr-dashboard-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

      // Get open jobs count
      const { count: openJobs } = await supabase
        .from('job_postings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // Get total applications
      const { count: totalApps } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true });

      // Get shortlisted count
      const { count: shortlisted } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'shortlisted');

      // Get today's interviews
      const { count: interviewsToday } = await supabase
        .from('candidate_interviews')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today)
        .eq('status', 'scheduled');

      // Get offers extended
      const { count: offers } = await supabase
        .from('candidate_offers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent');

      // Get hired this month
      const { count: hired } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'hired')
        .gte('updated_at', startOfMonth);

      return {
        totalOpenJobs: openJobs || 0,
        totalApplications: totalApps || 0,
        shortlistedCount: shortlisted || 0,
        interviewsToday: interviewsToday || 0,
        offersExtended: offers || 0,
        hiredThisMonth: hired || 0,
      };
    },
  });
}
