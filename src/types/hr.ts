// HR Management Types

export interface JobPosting {
  id: string;
  job_title: string;
  department: string | null;
  location: string | null;
  employment_type: 'full_time' | 'part_time' | 'contract';
  description: string | null;
  required_skills: string[] | null;
  experience_level: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  min_experience_years: number;
  max_experience_years: number | null;
  number_of_openings: number;
  salary_range_min: number | null;
  salary_range_max: number | null;
  status: 'open' | 'closed' | 'on_hold';
  target_role: 'officer' | 'meta_staff';
  position_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string | null;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  experience_years: number | null;
  skills: string[] | null;
  resume_url: string | null;
  cover_letter: string | null;
  current_company: string | null;
  current_designation: string | null;
  expected_salary: number | null;
  notice_period_days: number | null;
  status: ApplicationStatus;
  hr_notes: string | null;
  source: 'direct' | 'referral' | 'linkedin' | 'job_portal';
  applied_at: string;
  updated_at: string;
  // Joined data
  job?: JobPosting;
}

export type ApplicationStatus = 
  | 'applied'
  | 'shortlisted'
  | 'rejected'
  | 'in_interview'
  | 'selected'
  | 'offer_sent'
  | 'offer_accepted'
  | 'offer_declined'
  | 'hired';

export interface InterviewStage {
  id: string;
  job_id: string;
  stage_name: string;
  stage_order: number;
  description: string | null;
  is_mandatory: boolean;
  created_at: string;
}

export interface CandidateInterview {
  id: string;
  application_id: string;
  stage_id: string;
  interview_type: 'online' | 'in_person' | 'phone';
  scheduled_date: string | null;
  scheduled_time: string | null;
  duration_minutes: number;
  location: string | null;
  meeting_link: string | null;
  interviewer_ids: string[] | null;
  interviewer_names: string[] | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  result: 'passed' | 'failed' | 'on_hold' | null;
  created_at: string;
  updated_at: string;
  // Joined data
  stage?: InterviewStage;
  application?: JobApplication;
  feedback?: InterviewFeedback[];
}

export interface InterviewFeedback {
  id: string;
  interview_id: string;
  interviewer_id: string | null;
  interviewer_name: string | null;
  technical_skills_rating: number | null;
  communication_rating: number | null;
  problem_solving_rating: number | null;
  cultural_fit_rating: number | null;
  overall_rating: number | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  detailed_feedback: string | null;
  submitted_at: string;
}

export interface CandidateOffer {
  id: string;
  application_id: string;
  job_title: string;
  department: string | null;
  offered_salary: number;
  joining_date: string | null;
  probation_period_months: number;
  benefits: string | null;
  offer_letter_url: string | null;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  sent_at: string | null;
  responded_at: string | null;
  expiry_date: string | null;
  candidate_response_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  application?: JobApplication;
}

// Form types
export interface CreateJobPostingData {
  job_title: string;
  department?: string;
  location?: string;
  employment_type: 'full_time' | 'part_time' | 'contract';
  description?: string;
  required_skills?: string[];
  experience_level: 'fresher' | 'junior' | 'mid' | 'senior' | 'lead';
  min_experience_years?: number;
  max_experience_years?: number;
  number_of_openings?: number;
  salary_range_min?: number;
  salary_range_max?: number;
  target_role: 'officer' | 'meta_staff';
  position_id?: string;
}

export interface CreateApplicationData {
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone?: string;
  experience_years?: number;
  skills?: string[];
  resume_url?: string;
  cover_letter?: string;
  current_company?: string;
  current_designation?: string;
  expected_salary?: number;
  notice_period_days?: number;
  source?: 'direct' | 'referral' | 'linkedin' | 'job_portal';
}

export interface ScheduleInterviewData {
  application_id: string;
  stage_id: string;
  interview_type: 'online' | 'in_person' | 'phone';
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes?: number;
  location?: string;
  meeting_link?: string;
  interviewer_ids?: string[];
  interviewer_names?: string[];
}

export interface CreateOfferData {
  application_id: string;
  job_title: string;
  department?: string;
  offered_salary: number;
  joining_date?: string;
  probation_period_months?: number;
  benefits?: string;
  expiry_date?: string;
}

// Stats for dashboard
export interface HRDashboardStats {
  totalOpenJobs: number;
  totalApplications: number;
  shortlistedCount: number;
  interviewsToday: number;
  offersExtended: number;
  hiredThisMonth: number;
}
