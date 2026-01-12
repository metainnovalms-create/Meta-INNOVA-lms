import { supabase } from "@/integrations/supabase/client";

export interface SurveyQuestion {
  id?: string;
  survey_id?: string;
  question_text: string;
  question_type: 'mcq' | 'multiple_select' | 'rating' | 'text' | 'long_text' | 'linear_scale';
  options?: string[];
  is_required?: boolean;
  scale_min?: number;
  scale_max?: number;
  display_order: number;
}

export interface Survey {
  id?: string;
  title: string;
  description?: string;
  created_by?: string;
  created_by_name: string;
  institution_id?: string | null;
  target_audience: 'all_students' | 'specific_institution' | 'specific_class';
  target_class_ids?: string[];
  deadline: string;
  status: 'active' | 'closed' | 'draft';
  created_at?: string;
  updated_at?: string;
  questions?: SurveyQuestion[];
}

export interface SurveyWithQuestions extends Survey {
  survey_questions: SurveyQuestion[];
  response_count?: number;
}

// Create a new survey with questions
export async function createSurvey(survey: Survey, questions: SurveyQuestion[]) {
  const { data: surveyData, error: surveyError } = await supabase
    .from('surveys')
    .insert({
      title: survey.title,
      description: survey.description,
      created_by: survey.created_by,
      created_by_name: survey.created_by_name,
      institution_id: survey.institution_id,
      target_audience: survey.target_audience,
      target_class_ids: survey.target_class_ids || [],
      deadline: survey.deadline,
      status: survey.status,
    })
    .select()
    .single();

  if (surveyError) throw surveyError;

  // Insert questions
  if (questions.length > 0) {
    const questionsWithSurveyId = questions.map((q, index) => ({
      survey_id: surveyData.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options || [],
      is_required: q.is_required ?? true,
      scale_min: q.scale_min,
      scale_max: q.scale_max,
      display_order: index,
    }));

    const { error: questionsError } = await supabase
      .from('survey_questions')
      .insert(questionsWithSurveyId);

    if (questionsError) throw questionsError;
  }

  return surveyData;
}

// Get all surveys with optional filtering
export async function getSurveys(filters?: {
  status?: string;
  institution_id?: string;
  created_by?: string;
}) {
  let query = supabase
    .from('surveys')
    .select(`
      *,
      survey_questions (id),
      survey_responses (id)
    `)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.institution_id) {
    query = query.eq('institution_id', filters.institution_id);
  }
  if (filters?.created_by) {
    query = query.eq('created_by', filters.created_by);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Add response count
  return data.map(survey => ({
    ...survey,
    response_count: survey.survey_responses?.length || 0,
    question_count: survey.survey_questions?.length || 0,
  }));
}

// Get a single survey with questions
export async function getSurveyById(surveyId: string) {
  const { data, error } = await supabase
    .from('surveys')
    .select(`
      *,
      survey_questions (
        id,
        question_text,
        question_type,
        options,
        is_required,
        scale_min,
        scale_max,
        display_order
      )
    `)
    .eq('id', surveyId)
    .single();

  if (error) throw error;

  // Sort questions by display_order
  if (data.survey_questions) {
    data.survey_questions.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order);
  }

  return data;
}

// Update survey status
export async function updateSurveyStatus(surveyId: string, status: 'active' | 'closed' | 'draft') {
  const { data, error } = await supabase
    .from('surveys')
    .update({ status })
    .eq('id', surveyId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Close a survey
export async function closeSurvey(surveyId: string) {
  return updateSurveyStatus(surveyId, 'closed');
}

// Delete a survey
export async function deleteSurvey(surveyId: string) {
  const { error } = await supabase
    .from('surveys')
    .delete()
    .eq('id', surveyId);

  if (error) throw error;
}

// Get active surveys for a student
export async function getActiveSurveysForStudent(studentId: string, institutionId: string, classId?: string) {
  const { data, error } = await supabase
    .from('surveys')
    .select(`
      *,
      survey_questions (
        id,
        question_text,
        question_type,
        options,
        is_required,
        scale_min,
        scale_max,
        display_order
      ),
      survey_responses!left (
        id,
        student_id,
        status
      )
    `)
    .eq('status', 'active')
    .gte('deadline', new Date().toISOString());

  if (error) throw error;

  // Filter surveys targeting this student and check completion
  return data
    .filter(survey => {
      if (survey.target_audience === 'all_students') return true;
      if (survey.target_audience === 'specific_institution' && survey.institution_id === institutionId) return true;
      if (survey.target_audience === 'specific_class' && classId && survey.target_class_ids?.includes(classId)) return true;
      return false;
    })
    .map(survey => {
      const studentResponse = survey.survey_responses?.find((r: any) => r.student_id === studentId);
      return {
        ...survey,
        is_completed: studentResponse?.status === 'submitted',
        student_response_id: studentResponse?.id,
      };
    });
}

// Get survey analytics
export async function getSurveyAnalytics(surveyId: string) {
  const { data: responses, error: responsesError } = await supabase
    .from('survey_responses')
    .select(`
      *,
      survey_response_answers (
        question_id,
        answer_text,
        answer_number,
        answer_options
      )
    `)
    .eq('survey_id', surveyId)
    .eq('status', 'submitted');

  if (responsesError) throw responsesError;

  const { data: questions, error: questionsError } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('display_order');

  if (questionsError) throw questionsError;

  // Aggregate responses by question
  const questionAnalytics = questions.map(question => {
    const answers = responses.flatMap(r => 
      r.survey_response_answers.filter((a: any) => a.question_id === question.id)
    );

    let analytics: any = {
      question_id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      total_responses: answers.length,
    };

    if (question.question_type === 'mcq' || question.question_type === 'multiple_select') {
      const optionCounts: Record<string, number> = {};
      answers.forEach((a: any) => {
        const selectedOptions = a.answer_options || [];
        selectedOptions.forEach((opt: string) => {
          optionCounts[opt] = (optionCounts[opt] || 0) + 1;
        });
      });
      analytics.option_counts = optionCounts;
    } else if (question.question_type === 'rating' || question.question_type === 'linear_scale') {
      const numbers = answers.map((a: any) => a.answer_number).filter(Boolean);
      analytics.average = numbers.length > 0 ? numbers.reduce((a: number, b: number) => a + b, 0) / numbers.length : 0;
      analytics.distribution = {};
      numbers.forEach((n: number) => {
        analytics.distribution[n] = (analytics.distribution[n] || 0) + 1;
      });
    } else {
      analytics.text_responses = answers.map((a: any) => a.answer_text).filter(Boolean);
    }

    return analytics;
  });

  return {
    total_responses: responses.length,
    questions: questionAnalytics,
  };
}
