import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

// Types matching database schema
export interface AppraisalProject {
  id: string;
  appraisal_id: string;
  project_title: string;
  grade_level: string | null;
  domain: string | null;
  contest_name: string | null;
  level: 'school' | 'district' | 'state' | 'national' | 'international' | null;
  result: string | null;
  display_order: number;
  created_at: string;
}

export interface ReviewSignOff {
  reviewer_name: string;
  reviewer_designation: string;
  comments: string;
  rating: number;
  signature_date: string;
}

export interface HRReview {
  hr_name: string;
  verification_status: 'verified' | 'pending' | 'rejected';
  comments: string;
  final_rating: number;
  signature_date: string;
}

export interface StudentFeedback {
  concept_clarity: number;
  responsiveness: number;
  mentorship_quality: number;
  contest_preparation: number;
  overall_satisfaction: number;
}

export interface PerformanceAppraisal {
  id: string;
  trainer_id: string;
  trainer_name: string;
  employee_id: string;
  institution_id: string | null;
  institution_name: string;
  reporting_period_from: string;
  reporting_period_to: string;
  lab_domains: string[];
  total_projects_mentored: number;
  total_instructional_hours: number;
  key_contributions: string[];
  innovations_introduced: string[];
  student_mentorship_experience: string | null;
  collaboration_coordination: string | null;
  student_feedback: StudentFeedback;
  student_comments_summary: string | null;
  future_goals: string[];
  planned_trainings: string[];
  support_needed: string | null;
  manager_review: ReviewSignOff | null;
  principal_review: ReviewSignOff | null;
  hr_review: HRReview | null;
  status: 'draft' | 'submitted' | 'manager_reviewed' | 'principal_reviewed' | 'completed';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined projects
  projects_summary?: AppraisalProject[];
}

export type CreateAppraisalData = Omit<PerformanceAppraisal, 'id' | 'created_at' | 'updated_at' | 'projects_summary'> & {
  projects_summary?: Omit<AppraisalProject, 'id' | 'appraisal_id' | 'created_at'>[];
};

export type UpdateAppraisalData = Partial<CreateAppraisalData>;

// Helper to safely cast JSON to typed object
function parseStudentFeedback(json: Json | null): StudentFeedback {
  const defaultFeedback: StudentFeedback = {
    concept_clarity: 0,
    responsiveness: 0,
    mentorship_quality: 0,
    contest_preparation: 0,
    overall_satisfaction: 0
  };
  if (!json || typeof json !== 'object' || Array.isArray(json)) return defaultFeedback;
  return { ...defaultFeedback, ...(json as unknown as StudentFeedback) };
}

function parseReviewSignOff(json: Json | null): ReviewSignOff | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  return json as unknown as ReviewSignOff;
}

function parseHRReview(json: Json | null): HRReview | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  return json as unknown as HRReview;
}

// Map database row to PerformanceAppraisal
function mapAppraisal(appraisal: Record<string, unknown>, projects: AppraisalProject[] = []): PerformanceAppraisal {
  return {
    id: appraisal.id as string,
    trainer_id: appraisal.trainer_id as string,
    trainer_name: appraisal.trainer_name as string,
    employee_id: appraisal.employee_id as string,
    institution_id: appraisal.institution_id as string | null,
    institution_name: appraisal.institution_name as string,
    reporting_period_from: appraisal.reporting_period_from as string,
    reporting_period_to: appraisal.reporting_period_to as string,
    lab_domains: (appraisal.lab_domains as string[]) || [],
    total_projects_mentored: (appraisal.total_projects_mentored as number) || 0,
    total_instructional_hours: (appraisal.total_instructional_hours as number) || 0,
    key_contributions: (appraisal.key_contributions as string[]) || [],
    innovations_introduced: (appraisal.innovations_introduced as string[]) || [],
    student_mentorship_experience: appraisal.student_mentorship_experience as string | null,
    collaboration_coordination: appraisal.collaboration_coordination as string | null,
    student_feedback: parseStudentFeedback(appraisal.student_feedback as Json),
    student_comments_summary: appraisal.student_comments_summary as string | null,
    future_goals: (appraisal.future_goals as string[]) || [],
    planned_trainings: (appraisal.planned_trainings as string[]) || [],
    support_needed: appraisal.support_needed as string | null,
    manager_review: parseReviewSignOff(appraisal.manager_review as Json),
    principal_review: parseReviewSignOff(appraisal.principal_review as Json),
    hr_review: parseHRReview(appraisal.hr_review as Json),
    status: appraisal.status as PerformanceAppraisal['status'],
    created_by: appraisal.created_by as string | null,
    created_at: appraisal.created_at as string,
    updated_at: appraisal.updated_at as string,
    projects_summary: projects
  };
}

// Fetch all appraisals with projects
export async function getAppraisals(): Promise<PerformanceAppraisal[]> {
  const { data: appraisals, error } = await supabase
    .from('performance_appraisals')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!appraisals || appraisals.length === 0) return [];

  // Fetch projects for each appraisal
  const appraisalIds = appraisals.map(a => a.id);
  const { data: projects, error: projectsError } = await supabase
    .from('appraisal_projects')
    .select('*')
    .in('appraisal_id', appraisalIds)
    .order('display_order', { ascending: true });

  if (projectsError) throw projectsError;

  // Map projects to appraisals
  return appraisals.map(appraisal => 
    mapAppraisal(
      appraisal as unknown as Record<string, unknown>,
      ((projects || []) as AppraisalProject[]).filter(p => p.appraisal_id === appraisal.id)
    )
  );
}

// Get single appraisal by ID
export async function getAppraisalById(id: string): Promise<PerformanceAppraisal | null> {
  const { data: appraisal, error } = await supabase
    .from('performance_appraisals')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  const { data: projects, error: projectsError } = await supabase
    .from('appraisal_projects')
    .select('*')
    .eq('appraisal_id', id)
    .order('display_order', { ascending: true });

  if (projectsError) throw projectsError;

  return mapAppraisal(
    appraisal as unknown as Record<string, unknown>,
    (projects || []) as AppraisalProject[]
  );
}

// Create new appraisal with projects
export async function createAppraisal(data: CreateAppraisalData): Promise<PerformanceAppraisal> {
  const { projects_summary, ...appraisalData } = data;

  const { data: appraisal, error } = await supabase
    .from('performance_appraisals')
    .insert([{
      trainer_id: appraisalData.trainer_id,
      trainer_name: appraisalData.trainer_name,
      employee_id: appraisalData.employee_id,
      institution_id: appraisalData.institution_id,
      institution_name: appraisalData.institution_name,
      reporting_period_from: appraisalData.reporting_period_from,
      reporting_period_to: appraisalData.reporting_period_to,
      lab_domains: appraisalData.lab_domains,
      total_projects_mentored: appraisalData.total_projects_mentored,
      total_instructional_hours: appraisalData.total_instructional_hours,
      key_contributions: appraisalData.key_contributions,
      innovations_introduced: appraisalData.innovations_introduced,
      student_mentorship_experience: appraisalData.student_mentorship_experience,
      collaboration_coordination: appraisalData.collaboration_coordination,
      student_feedback: appraisalData.student_feedback as unknown as Json,
      student_comments_summary: appraisalData.student_comments_summary,
      future_goals: appraisalData.future_goals,
      planned_trainings: appraisalData.planned_trainings,
      support_needed: appraisalData.support_needed,
      manager_review: appraisalData.manager_review as unknown as Json,
      principal_review: appraisalData.principal_review as unknown as Json,
      hr_review: appraisalData.hr_review as unknown as Json,
      status: appraisalData.status,
      created_by: appraisalData.created_by
    }])
    .select()
    .single();

  if (error) throw error;

  // Insert projects if any
  if (projects_summary && projects_summary.length > 0) {
    const projectsToInsert = projects_summary.map((p, index) => ({
      appraisal_id: appraisal.id,
      project_title: p.project_title,
      grade_level: p.grade_level,
      domain: p.domain,
      contest_name: p.contest_name,
      level: p.level,
      result: p.result,
      display_order: index
    }));

    const { error: projectsError } = await supabase
      .from('appraisal_projects')
      .insert(projectsToInsert);

    if (projectsError) throw projectsError;
  }

  return getAppraisalById(appraisal.id) as Promise<PerformanceAppraisal>;
}

// Update appraisal with projects
export async function updateAppraisal(id: string, data: UpdateAppraisalData): Promise<PerformanceAppraisal> {
  const { projects_summary, ...appraisalData } = data;

  const updatePayload: Record<string, unknown> = {};
  
  if (appraisalData.trainer_id !== undefined) updatePayload.trainer_id = appraisalData.trainer_id;
  if (appraisalData.trainer_name !== undefined) updatePayload.trainer_name = appraisalData.trainer_name;
  if (appraisalData.employee_id !== undefined) updatePayload.employee_id = appraisalData.employee_id;
  if (appraisalData.institution_id !== undefined) updatePayload.institution_id = appraisalData.institution_id;
  if (appraisalData.institution_name !== undefined) updatePayload.institution_name = appraisalData.institution_name;
  if (appraisalData.reporting_period_from !== undefined) updatePayload.reporting_period_from = appraisalData.reporting_period_from;
  if (appraisalData.reporting_period_to !== undefined) updatePayload.reporting_period_to = appraisalData.reporting_period_to;
  if (appraisalData.lab_domains !== undefined) updatePayload.lab_domains = appraisalData.lab_domains;
  if (appraisalData.total_projects_mentored !== undefined) updatePayload.total_projects_mentored = appraisalData.total_projects_mentored;
  if (appraisalData.total_instructional_hours !== undefined) updatePayload.total_instructional_hours = appraisalData.total_instructional_hours;
  if (appraisalData.key_contributions !== undefined) updatePayload.key_contributions = appraisalData.key_contributions;
  if (appraisalData.innovations_introduced !== undefined) updatePayload.innovations_introduced = appraisalData.innovations_introduced;
  if (appraisalData.student_mentorship_experience !== undefined) updatePayload.student_mentorship_experience = appraisalData.student_mentorship_experience;
  if (appraisalData.collaboration_coordination !== undefined) updatePayload.collaboration_coordination = appraisalData.collaboration_coordination;
  if (appraisalData.student_feedback !== undefined) updatePayload.student_feedback = appraisalData.student_feedback;
  if (appraisalData.student_comments_summary !== undefined) updatePayload.student_comments_summary = appraisalData.student_comments_summary;
  if (appraisalData.future_goals !== undefined) updatePayload.future_goals = appraisalData.future_goals;
  if (appraisalData.planned_trainings !== undefined) updatePayload.planned_trainings = appraisalData.planned_trainings;
  if (appraisalData.support_needed !== undefined) updatePayload.support_needed = appraisalData.support_needed;
  if (appraisalData.manager_review !== undefined) updatePayload.manager_review = appraisalData.manager_review;
  if (appraisalData.principal_review !== undefined) updatePayload.principal_review = appraisalData.principal_review;
  if (appraisalData.hr_review !== undefined) updatePayload.hr_review = appraisalData.hr_review;
  if (appraisalData.status !== undefined) updatePayload.status = appraisalData.status;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from('performance_appraisals')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
  }

  // Update projects if provided
  if (projects_summary !== undefined) {
    // Delete existing projects
    await supabase.from('appraisal_projects').delete().eq('appraisal_id', id);

    // Insert new projects
    if (projects_summary.length > 0) {
      const projectsToInsert = projects_summary.map((p, index) => ({
        appraisal_id: id,
        project_title: p.project_title,
        grade_level: p.grade_level,
        domain: p.domain,
        contest_name: p.contest_name,
        level: p.level,
        result: p.result,
        display_order: index
      }));

      const { error: projectsError } = await supabase
        .from('appraisal_projects')
        .insert(projectsToInsert);

      if (projectsError) throw projectsError;
    }
  }

  return getAppraisalById(id) as Promise<PerformanceAppraisal>;
}

// Delete appraisal (cascade deletes projects)
export async function deleteAppraisal(id: string): Promise<void> {
  const { error } = await supabase
    .from('performance_appraisals')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Submit review (manager, principal, or HR)
export async function submitAppraisalReview(
  id: string,
  reviewType: 'manager' | 'principal' | 'hr',
  reviewData: ReviewSignOff | HRReview
): Promise<PerformanceAppraisal> {
  const updatePayload: Record<string, unknown> = {};
  
  if (reviewType === 'manager') {
    updatePayload.manager_review = reviewData;
    updatePayload.status = 'manager_reviewed';
  } else if (reviewType === 'principal') {
    updatePayload.principal_review = reviewData;
    updatePayload.status = 'principal_reviewed';
  } else if (reviewType === 'hr') {
    updatePayload.hr_review = reviewData;
    updatePayload.status = 'completed';
  }

  const { error } = await supabase
    .from('performance_appraisals')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw error;

  return getAppraisalById(id) as Promise<PerformanceAppraisal>;
}

// Get appraisals by trainer
export async function getAppraisalsByTrainer(trainerId: string): Promise<PerformanceAppraisal[]> {
  const { data: appraisals, error } = await supabase
    .from('performance_appraisals')
    .select('*')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!appraisals || appraisals.length === 0) return [];

  const appraisalIds = appraisals.map(a => a.id);
  const { data: projects, error: projectsError } = await supabase
    .from('appraisal_projects')
    .select('*')
    .in('appraisal_id', appraisalIds)
    .order('display_order', { ascending: true });

  if (projectsError) throw projectsError;

  return appraisals.map(appraisal => 
    mapAppraisal(
      appraisal as unknown as Record<string, unknown>,
      ((projects || []) as AppraisalProject[]).filter(p => p.appraisal_id === appraisal.id)
    )
  );
}

// Get appraisals by institution
export async function getAppraisalsByInstitution(institutionId: string): Promise<PerformanceAppraisal[]> {
  const { data: appraisals, error } = await supabase
    .from('performance_appraisals')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!appraisals || appraisals.length === 0) return [];

  const appraisalIds = appraisals.map(a => a.id);
  const { data: projects, error: projectsError } = await supabase
    .from('appraisal_projects')
    .select('*')
    .in('appraisal_id', appraisalIds)
    .order('display_order', { ascending: true });

  if (projectsError) throw projectsError;

  return appraisals.map(appraisal => 
    mapAppraisal(
      appraisal as unknown as Record<string, unknown>,
      ((projects || []) as AppraisalProject[]).filter(p => p.appraisal_id === appraisal.id)
    )
  );
}
