import { supabase } from "@/integrations/supabase/client";

export interface SurveyResponseAnswer {
  question_id: string;
  answer_text?: string;
  answer_number?: number;
  answer_options?: string[];
}

export interface SurveyResponseSubmission {
  survey_id: string;
  student_id: string;
  institution_id: string;
  class_id?: string;
  answers: SurveyResponseAnswer[];
}

// Submit a survey response
export async function submitSurveyResponse(submission: SurveyResponseSubmission) {
  // First, create the response record
  const { data: responseData, error: responseError } = await supabase
    .from('survey_responses')
    .insert({
      survey_id: submission.survey_id,
      student_id: submission.student_id,
      institution_id: submission.institution_id,
      class_id: submission.class_id,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (responseError) throw responseError;

  // Then, insert all answers
  if (submission.answers.length > 0) {
    const answersToInsert = submission.answers.map(answer => ({
      response_id: responseData.id,
      question_id: answer.question_id,
      answer_text: answer.answer_text,
      answer_number: answer.answer_number,
      answer_options: answer.answer_options || [],
    }));

    const { error: answersError } = await supabase
      .from('survey_response_answers')
      .insert(answersToInsert);

    if (answersError) throw answersError;
  }

  return responseData;
}

// Get all responses for a survey
export async function getSurveyResponses(surveyId: string) {
  const { data, error } = await supabase
    .from('survey_responses')
    .select(`
      *,
      profiles:student_id (
        name,
        email
      ),
      classes:class_id (
        class_name,
        section
      ),
      institutions:institution_id (
        name
      ),
      survey_response_answers (
        question_id,
        answer_text,
        answer_number,
        answer_options
      )
    `)
    .eq('survey_id', surveyId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get a student's survey responses
export async function getStudentResponses(studentId: string) {
  const { data, error } = await supabase
    .from('survey_responses')
    .select(`
      *,
      surveys (
        title,
        description,
        deadline,
        status
      )
    `)
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Check if student has completed a survey
export async function hasStudentCompletedSurvey(studentId: string, surveyId: string) {
  const { data, error } = await supabase
    .from('survey_responses')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('survey_id', surveyId)
    .eq('status', 'submitted')
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

// Get response count for a survey
export async function getSurveyResponseCount(surveyId: string) {
  const { count, error } = await supabase
    .from('survey_responses')
    .select('id', { count: 'exact', head: true })
    .eq('survey_id', surveyId)
    .eq('status', 'submitted');

  if (error) throw error;
  return count || 0;
}

// Get responses by institution
export async function getResponsesByInstitution(surveyId: string, institutionId: string) {
  const { data, error } = await supabase
    .from('survey_responses')
    .select(`
      *,
      profiles:student_id (
        name,
        email
      ),
      survey_response_answers (
        question_id,
        answer_text,
        answer_number,
        answer_options
      )
    `)
    .eq('survey_id', surveyId)
    .eq('institution_id', institutionId)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}
