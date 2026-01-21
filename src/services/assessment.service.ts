import { supabase } from '@/integrations/supabase/client';
import { Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnswer, AssessmentPublishing } from '@/types/assessment';
import { gamificationDbService } from '@/services/gamification-db.service';

// Types for database operations
interface DbAssessment {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_points: number;
  pass_percentage: number;
  auto_submit: boolean;
  auto_evaluate: boolean;
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  allow_review_after_submission: boolean;
  certificate_template_id: string | null;
  created_by: string | null;
  created_by_role: string;
  institution_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DbQuestion {
  id: string;
  assessment_id: string;
  question_number: number;
  question_text: string;
  question_type: string;
  options: unknown;
  correct_option_id: string;
  points: number;
  time_limit_seconds: number | null;
  image_url: string | null;
  code_snippet: string | null;
  explanation: string | null;
  display_order: number;
  created_at: string;
}

interface DbClassAssignment {
  id: string;
  assessment_id: string;
  institution_id: string;
  class_id: string;
  assigned_by: string | null;
  assigned_at: string;
  institutions?: { id: string; name: string } | null;
  classes?: { id: string; class_name: string } | null;
}

interface DbAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  institution_id: string;
  class_id: string;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  status: string;
  created_at: string;
  profiles?: { id: string; name: string } | null;
  institutions?: { id: string; name: string } | null;
  classes?: { id: string; class_name: string } | null;
}

// Transform database assessment to frontend format
function transformAssessment(dbAssessment: DbAssessment, classAssignments: DbClassAssignment[] = [], questionCount: number = 0): Assessment {
  // Group class assignments by institution
  const publishedToMap = new Map<string, AssessmentPublishing>();
  
  classAssignments.forEach(ca => {
    const existing = publishedToMap.get(ca.institution_id);
    if (existing) {
      existing.class_ids.push(ca.class_id);
      if (ca.classes?.class_name) {
        existing.class_names.push(ca.classes.class_name);
      }
    } else {
      publishedToMap.set(ca.institution_id, {
        institution_id: ca.institution_id,
        institution_name: ca.institutions?.name || 'Unknown Institution',
        class_ids: [ca.class_id],
        class_names: ca.classes?.class_name ? [ca.classes.class_name] : []
      });
    }
  });

  return {
    id: dbAssessment.id,
    title: dbAssessment.title,
    description: dbAssessment.description || '',
    status: dbAssessment.status as Assessment['status'],
    start_time: dbAssessment.start_time,
    end_time: dbAssessment.end_time,
    duration_minutes: dbAssessment.duration_minutes,
    total_points: dbAssessment.total_points,
    pass_percentage: dbAssessment.pass_percentage,
    auto_submit: dbAssessment.auto_submit,
    auto_evaluate: dbAssessment.auto_evaluate,
    shuffle_questions: dbAssessment.shuffle_questions,
    show_results_immediately: dbAssessment.show_results_immediately,
    allow_review_after_submission: dbAssessment.allow_review_after_submission,
    certificate_template_id: dbAssessment.certificate_template_id || undefined,
    published_to: Array.from(publishedToMap.values()),
    question_count: questionCount,
    created_by: dbAssessment.created_by || '',
    created_by_role: dbAssessment.created_by_role as 'system_admin' | 'officer',
    institution_id: dbAssessment.institution_id || undefined,
    created_at: dbAssessment.created_at,
    updated_at: dbAssessment.updated_at
  };
}

// Transform database question to frontend format
function transformQuestion(dbQuestion: DbQuestion): AssessmentQuestion {
  return {
    id: dbQuestion.id,
    assessment_id: dbQuestion.assessment_id,
    question_number: dbQuestion.question_number,
    question_text: dbQuestion.question_text,
    question_type: dbQuestion.question_type as 'mcq',
    options: Array.isArray(dbQuestion.options) ? dbQuestion.options as AssessmentQuestion['options'] : [],
    correct_option_id: dbQuestion.correct_option_id,
    points: dbQuestion.points,
    time_limit_seconds: dbQuestion.time_limit_seconds || undefined,
    image_url: dbQuestion.image_url || undefined,
    code_snippet: dbQuestion.code_snippet || undefined,
    explanation: dbQuestion.explanation || undefined,
    order: dbQuestion.display_order,
    created_at: dbQuestion.created_at
  };
}

// Transform database attempt to frontend format
function transformAttempt(dbAttempt: DbAttempt, answers: AssessmentAnswer[] = []): AssessmentAttempt {
  return {
    id: dbAttempt.id,
    assessment_id: dbAttempt.assessment_id,
    student_id: dbAttempt.student_id,
    student_name: dbAttempt.profiles?.name || 'Unknown Student',
    institution_id: dbAttempt.institution_id,
    institution_name: dbAttempt.institutions?.name || 'Unknown Institution',
    class_id: dbAttempt.class_id,
    class_name: dbAttempt.classes?.class_name || 'Unknown Class',
    started_at: dbAttempt.started_at,
    submitted_at: dbAttempt.submitted_at || undefined,
    time_taken_seconds: dbAttempt.time_taken_seconds || undefined,
    score: dbAttempt.score,
    total_points: dbAttempt.total_points,
    percentage: Number(dbAttempt.percentage),
    passed: dbAttempt.passed,
    answers: answers,
    status: dbAttempt.status as AssessmentAttempt['status'],
    is_manual: (dbAttempt as any).is_manual || false,
    manual_notes: (dbAttempt as any).manual_notes || undefined,
    conducted_at: (dbAttempt as any).conducted_at || undefined,
    question_order: (dbAttempt as any).question_order || undefined,
    retake_allowed: (dbAttempt as any).retake_allowed || false
  };
}

export const assessmentService = {
  // ============================================
  // Assessment CRUD
  // ============================================
  
  async createAssessment(data: Partial<Assessment>): Promise<Assessment | null> {
    const { data: assessment, error } = await supabase
      .from('assessments')
      .insert({
        title: data.title!,
        description: data.description,
        status: data.status || 'draft',
        start_time: data.start_time!,
        end_time: data.end_time!,
        duration_minutes: data.duration_minutes || 30,
        total_points: data.total_points || 0,
        pass_percentage: data.pass_percentage || 70,
        auto_submit: data.auto_submit ?? true,
        auto_evaluate: data.auto_evaluate ?? true,
        shuffle_questions: data.shuffle_questions ?? false,
        show_results_immediately: data.show_results_immediately ?? true,
        allow_review_after_submission: data.allow_review_after_submission ?? true,
        certificate_template_id: data.certificate_template_id,
        created_by: data.created_by,
        created_by_role: data.created_by_role || 'system_admin',
        institution_id: data.institution_id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating assessment:', error);
      return null;
    }

    return transformAssessment(assessment as DbAssessment);
  },

  async getAssessments(filters?: { status?: string; institution_id?: string }): Promise<Assessment[]> {
    let query = supabase.from('assessments').select('*');
    
    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.institution_id) {
      query = query.eq('institution_id', filters.institution_id);
    }

    const { data: assessments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessments:', error);
      return [];
    }

    // Fetch class assignments and question counts for all assessments
    const assessmentIds = assessments.map(a => a.id);
    
    const [classAssignmentsResult, questionCountsResult] = await Promise.all([
      supabase
        .from('assessment_class_assignments')
        .select('*, institutions(id, name), classes(id, class_name)')
        .in('assessment_id', assessmentIds),
      supabase
        .from('assessment_questions')
        .select('assessment_id')
        .in('assessment_id', assessmentIds)
    ]);

    const classAssignmentsByAssessment = new Map<string, DbClassAssignment[]>();
    (classAssignmentsResult.data || []).forEach(ca => {
      const existing = classAssignmentsByAssessment.get(ca.assessment_id) || [];
      existing.push(ca as DbClassAssignment);
      classAssignmentsByAssessment.set(ca.assessment_id, existing);
    });

    const questionCountByAssessment = new Map<string, number>();
    (questionCountsResult.data || []).forEach(q => {
      questionCountByAssessment.set(q.assessment_id, (questionCountByAssessment.get(q.assessment_id) || 0) + 1);
    });

    return assessments.map(a => transformAssessment(
      a as DbAssessment,
      classAssignmentsByAssessment.get(a.id) || [],
      questionCountByAssessment.get(a.id) || 0
    ));
  },

  async getAssessmentById(id: string): Promise<Assessment | null> {
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching assessment:', error);
      return null;
    }

    // Fetch class assignments and questions
    const [classAssignmentsResult, questionsResult] = await Promise.all([
      supabase
        .from('assessment_class_assignments')
        .select('*, institutions(id, name), classes(id, class_name)')
        .eq('assessment_id', id),
      supabase
        .from('assessment_questions')
        .select('*')
        .eq('assessment_id', id)
    ]);

    const result = transformAssessment(
      assessment as DbAssessment,
      (classAssignmentsResult.data || []) as DbClassAssignment[],
      questionsResult.data?.length || 0
    );
    
    result.questions = (questionsResult.data || []).map(q => transformQuestion(q as DbQuestion));

    return result;
  },

  async updateAssessment(id: string, data: Partial<Assessment>): Promise<boolean> {
    // Calculate total points from questions if not provided
    let totalPoints = data.total_points;
    if (totalPoints === undefined && data.questions) {
      totalPoints = data.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    }

    const { error } = await supabase
      .from('assessments')
      .update({
        title: data.title,
        description: data.description,
        status: data.status,
        start_time: data.start_time,
        end_time: data.end_time,
        duration_minutes: data.duration_minutes,
        total_points: totalPoints,
        pass_percentage: data.pass_percentage,
        auto_submit: data.auto_submit,
        auto_evaluate: data.auto_evaluate,
        shuffle_questions: data.shuffle_questions,
        show_results_immediately: data.show_results_immediately,
        allow_review_after_submission: data.allow_review_after_submission,
        certificate_template_id: data.certificate_template_id
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating assessment:', error);
      return false;
    }

    return true;
  },

  async deleteAssessment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting assessment:', error);
      return false;
    }

    return true;
  },

  // ============================================
  // Questions Management
  // ============================================

  async addQuestions(assessmentId: string, questions: Partial<AssessmentQuestion>[]): Promise<boolean> {
    const questionsToInsert = questions.map((q, index) => ({
      assessment_id: assessmentId,
      question_number: q.question_number || index + 1,
      question_text: q.question_text!,
      question_type: q.question_type || 'mcq',
      options: JSON.parse(JSON.stringify(q.options || [])),
      correct_option_id: q.correct_option_id!,
      points: q.points || 1,
      time_limit_seconds: q.time_limit_seconds,
      image_url: q.image_url,
      code_snippet: q.code_snippet,
      explanation: q.explanation,
      display_order: q.order || index
    }));

    const { error } = await supabase
      .from('assessment_questions')
      .insert(questionsToInsert);

    if (error) {
      console.error('Error adding questions:', error);
      return false;
    }

    // Update total points on assessment
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);
    await supabase
      .from('assessments')
      .update({ total_points: totalPoints })
      .eq('id', assessmentId);

    return true;
  },

  async getQuestions(assessmentId: string): Promise<AssessmentQuestion[]> {
    const { data: questions, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('display_order');

    if (error) {
      console.error('Error fetching questions:', error);
      return [];
    }

    return questions.map(q => transformQuestion(q as DbQuestion));
  },

  async updateQuestion(questionId: string, data: Partial<AssessmentQuestion>): Promise<boolean> {
    const { error } = await supabase
      .from('assessment_questions')
      .update({
        question_text: data.question_text,
        options: data.options ? JSON.parse(JSON.stringify(data.options)) : undefined,
        correct_option_id: data.correct_option_id,
        points: data.points,
        time_limit_seconds: data.time_limit_seconds,
        image_url: data.image_url,
        code_snippet: data.code_snippet,
        explanation: data.explanation,
        display_order: data.order
      })
      .eq('id', questionId);

    if (error) {
      console.error('Error updating question:', error);
      return false;
    }

    return true;
  },

  async deleteQuestion(questionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('assessment_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.error('Error deleting question:', error);
      return false;
    }

    return true;
  },

  // ============================================
  // Publishing
  // ============================================

  async publishAssessment(id: string, publishing: AssessmentPublishing[]): Promise<boolean> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    // First, remove existing class assignments
    await supabase
      .from('assessment_class_assignments')
      .delete()
      .eq('assessment_id', id);

    // Create new class assignments
    const assignments: Array<{
      assessment_id: string;
      institution_id: string;
      class_id: string;
      assigned_by: string | null;
    }> = [];
    
    publishing.forEach(pub => {
      pub.class_ids.forEach(classId => {
        assignments.push({
          assessment_id: id,
          institution_id: pub.institution_id,
          class_id: classId,
          assigned_by: user?.id || null
        });
      });
    });

    if (assignments.length > 0) {
      const { error: assignmentError } = await supabase
        .from('assessment_class_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error publishing assessment:', assignmentError);
        return false;
      }
    }

    // Update assessment status to published
    const { error: updateError } = await supabase
      .from('assessments')
      .update({ status: 'published' })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating assessment status:', updateError);
      return false;
    }

    // Create notifications for students in published classes
    await this.createPublishNotifications(id, assignments.map(a => a.class_id));

    return true;
  },

  async unpublishAssessment(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('assessments')
      .update({ status: 'unpublished' })
      .eq('id', id);

    if (error) {
      console.error('Error unpublishing assessment:', error);
      return false;
    }

    return true;
  },

  async createPublishNotifications(assessmentId: string, classIds: string[]): Promise<void> {
    // Fetch assessment details
    const { data: assessment } = await supabase
      .from('assessments')
      .select('title, start_time, end_time')
      .eq('id', assessmentId)
      .single();

    if (!assessment) return;

    // Fetch students in the classes
    const { data: students } = await supabase
      .from('profiles')
      .select('id')
      .in('class_id', classIds);

    if (!students || students.length === 0) return;

    // Create notifications without link
    const notifications = students.map(student => ({
      recipient_id: student.id,
      type: 'assessment_scheduled',
      recipient_role: 'student',
      title: 'New Assessment Scheduled',
      message: `Assessment "${assessment.title}" has been scheduled. Available from ${new Date(assessment.start_time).toLocaleDateString()} to ${new Date(assessment.end_time).toLocaleDateString()}.`,
      metadata: { assessment_id: assessmentId }
    }));

    await supabase.from('notifications').insert(notifications);
  },

  // ============================================
  // Student Assessment Operations
  // ============================================

  async getStudentAssessments(studentId: string, classId: string, institutionId: string): Promise<Assessment[]> {
    // Get assessments published to the student's class
    const { data: assignments, error: assignmentError } = await supabase
      .from('assessment_class_assignments')
      .select('assessment_id')
      .eq('class_id', classId);

    if (assignmentError || !assignments || assignments.length === 0) {
      return [];
    }

    const assessmentIds = assignments.map(a => a.assessment_id);

    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('*')
      .in('id', assessmentIds)
      .eq('status', 'published');

    if (error) {
      console.error('Error fetching student assessments:', error);
      return [];
    }

    // Fetch class assignments for these assessments
    const { data: classAssignments } = await supabase
      .from('assessment_class_assignments')
      .select('*, institutions(id, name), classes(id, class_name)')
      .in('assessment_id', assessmentIds);

    // Fetch question counts
    const { data: questionCounts } = await supabase
      .from('assessment_questions')
      .select('assessment_id')
      .in('assessment_id', assessmentIds);

    const classAssignmentsByAssessment = new Map<string, DbClassAssignment[]>();
    (classAssignments || []).forEach(ca => {
      const existing = classAssignmentsByAssessment.get(ca.assessment_id) || [];
      existing.push(ca as DbClassAssignment);
      classAssignmentsByAssessment.set(ca.assessment_id, existing);
    });

    const questionCountByAssessment = new Map<string, number>();
    (questionCounts || []).forEach(q => {
      questionCountByAssessment.set(q.assessment_id, (questionCountByAssessment.get(q.assessment_id) || 0) + 1);
    });

    return assessments.map(a => transformAssessment(
      a as DbAssessment,
      classAssignmentsByAssessment.get(a.id) || [],
      questionCountByAssessment.get(a.id) || 0
    ));
  },

  async startAttempt(assessmentId: string, studentId: string, classId: string, institutionId: string): Promise<AssessmentAttempt | null> {
    // Check if there's already an in-progress attempt
    const { data: existingAttempt } = await supabase
      .from('assessment_attempts')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .eq('status', 'in_progress')
      .single();

    if (existingAttempt) {
      return transformAttempt(existingAttempt as DbAttempt);
    }

    // Get assessment total points
    const { data: assessment } = await supabase
      .from('assessments')
      .select('total_points')
      .eq('id', assessmentId)
      .single();

    const { data: attempt, error } = await supabase
      .from('assessment_attempts')
      .insert({
        assessment_id: assessmentId,
        student_id: studentId,
        class_id: classId,
        institution_id: institutionId,
        total_points: assessment?.total_points || 0,
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting attempt:', error);
      return null;
    }

    return transformAttempt(attempt as DbAttempt);
  },

  async saveAnswer(attemptId: string, questionId: string, selectedOptionId: string, isCorrect: boolean, pointsEarned: number, timeSpent: number): Promise<boolean> {
    const { error } = await supabase
      .from('assessment_answers')
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_spent_seconds: timeSpent
      }, {
        onConflict: 'attempt_id,question_id'
      });

    if (error) {
      console.error('Error saving answer:', error);
      return false;
    }

    return true;
  },

  async submitAttempt(attemptId: string, autoSubmit: boolean = false): Promise<boolean> {
    // Calculate score from answers
    const { data: answers } = await supabase
      .from('assessment_answers')
      .select('points_earned, time_spent_seconds')
      .eq('attempt_id', attemptId);

    const score = (answers || []).reduce((sum, a) => sum + a.points_earned, 0);
    const totalTime = (answers || []).reduce((sum, a) => sum + a.time_spent_seconds, 0);

    // Get attempt details
    const { data: attempt } = await supabase
      .from('assessment_attempts')
      .select('total_points, started_at')
      .eq('id', attemptId)
      .single();

    if (!attempt) return false;

    const percentage = attempt.total_points > 0 ? (score / attempt.total_points) * 100 : 0;
    
    // Get pass percentage from assessment
    const { data: assessmentAttempt } = await supabase
      .from('assessment_attempts')
      .select('assessment_id')
      .eq('id', attemptId)
      .single();

    let passed = false;
    if (assessmentAttempt) {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('pass_percentage')
        .eq('id', assessmentAttempt.assessment_id)
        .single();
      
      passed = percentage >= (assessment?.pass_percentage || 0);
    }

    const { error } = await supabase
      .from('assessment_attempts')
      .update({
        submitted_at: new Date().toISOString(),
        time_taken_seconds: totalTime,
        score,
        percentage,
        passed,
        status: autoSubmit ? 'auto_submitted' : 'submitted'
      })
      .eq('id', attemptId);

    if (error) {
      console.error('Error submitting attempt:', error);
      return false;
    }

    // Award XP for assessment completion
    try {
      const { data: attemptData } = await supabase
        .from('assessment_attempts')
        .select('student_id, institution_id, assessment_id')
        .eq('id', attemptId)
        .single();
      
      if (attemptData) {
        await gamificationDbService.awardAssessmentXP(
          attemptData.student_id,
          attemptData.institution_id,
          attemptData.assessment_id,
          passed,
          percentage
        );
      }
    } catch (xpError) {
      console.error('Error awarding assessment XP:', xpError);
      // Don't fail the submission if XP awarding fails
    }

    return true;
  },

  async getStudentAttempts(studentId: string): Promise<AssessmentAttempt[]> {
    const { data: attempts, error } = await supabase
      .from('assessment_attempts')
      .select('*, profiles:student_id(id, name), institutions:institution_id(id, name), classes:class_id(id, class_name)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching student attempts:', error);
      return [];
    }

    return attempts.map(a => transformAttempt(a as unknown as DbAttempt));
  },

  async getAttemptById(attemptId: string): Promise<AssessmentAttempt | null> {
    const { data: attempt, error } = await supabase
      .from('assessment_attempts')
      .select('*, profiles:student_id(id, name), institutions:institution_id(id, name), classes:class_id(id, class_name)')
      .eq('id', attemptId)
      .single();

    if (error) {
      console.error('Error fetching attempt:', error);
      return null;
    }

    // Fetch answers
    const { data: answers } = await supabase
      .from('assessment_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    const transformedAnswers: AssessmentAnswer[] = (answers || []).map(a => ({
      question_id: a.question_id,
      selected_option_id: a.selected_option_id,
      is_correct: a.is_correct,
      points_earned: a.points_earned,
      time_spent_seconds: a.time_spent_seconds
    }));

    return transformAttempt(attempt as unknown as DbAttempt, transformedAnswers);
  },

  // ============================================
  // Analytics & Reporting
  // ============================================

  async getAssessmentAttempts(assessmentId: string, filters?: { institution_id?: string; class_id?: string }): Promise<AssessmentAttempt[]> {
    let query = supabase
      .from('assessment_attempts')
      .select('*, profiles:student_id(id, name), institutions:institution_id(id, name), classes:class_id(id, class_name)')
      .eq('assessment_id', assessmentId);

    if (filters?.institution_id) {
      query = query.eq('institution_id', filters.institution_id);
    }
    
    if (filters?.class_id) {
      query = query.eq('class_id', filters.class_id);
    }

    const { data: attempts, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching assessment attempts:', error);
      return [];
    }

    return attempts.map(a => transformAttempt(a as unknown as DbAttempt));
  },

  async getAssessmentAnalytics(assessmentId: string) {
    const attempts = await this.getAssessmentAttempts(assessmentId);
    
    const completedAttempts = attempts.filter(a => a.status !== 'in_progress');
    const totalAttempts = attempts.length;
    const completedCount = completedAttempts.length;
    const inProgressCount = totalAttempts - completedCount;
    
    const averageScore = completedCount > 0 
      ? completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / completedCount 
      : 0;
    
    const passedCount = completedAttempts.filter(a => a.passed).length;
    const passRate = completedCount > 0 ? (passedCount / completedCount) * 100 : 0;
    
    const averageTime = completedCount > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0) / completedCount / 60
      : 0;

    // Group by institution
    const institutionMap = new Map<string, { name: string; attempts: AssessmentAttempt[] }>();
    attempts.forEach(a => {
      const existing = institutionMap.get(a.institution_id);
      if (existing) {
        existing.attempts.push(a);
      } else {
        institutionMap.set(a.institution_id, { name: a.institution_name, attempts: [a] });
      }
    });

    const institutionStats = Array.from(institutionMap.entries()).map(([id, data]) => {
      const completed = data.attempts.filter(a => a.status !== 'in_progress');
      const avg = completed.length > 0 
        ? completed.reduce((sum, a) => sum + a.percentage, 0) / completed.length 
        : 0;
      const passed = completed.filter(a => a.passed).length;
      
      return {
        institution_id: id,
        institution_name: data.name,
        attempts: data.attempts.length,
        average_score: avg,
        pass_rate: completed.length > 0 ? (passed / completed.length) * 100 : 0
      };
    });

    return {
      assessment_id: assessmentId,
      total_attempts: totalAttempts,
      completed_attempts: completedCount,
      in_progress_attempts: inProgressCount,
      average_score: averageScore,
      pass_rate: passRate,
      average_time_taken_minutes: averageTime,
      institution_stats: institutionStats,
      question_stats: [] // Would require more complex query
    };
  },

  // ============================================
  // Additional Methods for TakeAssessment
  // ============================================

  async updateAttemptQuestionOrder(attemptId: string, questionOrder: string[]): Promise<boolean> {
    const { error } = await supabase
      .from('assessment_attempts')
      .update({ question_order: questionOrder })
      .eq('id', attemptId);

    if (error) {
      console.error('Error updating question order:', error);
      return false;
    }

    return true;
  },

  async getAttemptAnswers(attemptId: string): Promise<AssessmentAnswer[]> {
    const { data: answers, error } = await supabase
      .from('assessment_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    if (error) {
      console.error('Error fetching answers:', error);
      return [];
    }

    return (answers || []).map(a => ({
      question_id: a.question_id,
      selected_option_id: a.selected_option_id,
      is_correct: a.is_correct,
      points_earned: a.points_earned,
      time_spent_seconds: a.time_spent_seconds
    }));
  },

  async createManualAttempt(data: {
    assessment_id: string;
    student_id: string;
    class_id: string;
    institution_id: string;
    score: number;
    total_points: number;
    percentage: number;
    passed: boolean;
    conducted_at: string;
    manual_notes?: string;
    is_absent?: boolean;
  }): Promise<boolean> {
    const { error } = await supabase
      .from('assessment_attempts')
      .insert({
        assessment_id: data.assessment_id,
        student_id: data.student_id,
        class_id: data.class_id,
        institution_id: data.institution_id,
        score: data.is_absent ? 0 : data.score,
        total_points: data.total_points,
        percentage: data.is_absent ? 0 : data.percentage,
        passed: data.is_absent ? false : data.passed,
        status: data.is_absent ? 'absent' : 'submitted',
        is_manual: true,
        manual_notes: data.manual_notes,
        conducted_at: data.conducted_at,
        started_at: data.conducted_at,
        submitted_at: data.conducted_at
      });

    if (error) {
      console.error('Error creating manual attempt:', error);
      return false;
    }

    return true;
  },

  async allowRetake(attemptId: string): Promise<boolean> {
    // 1. First delete all answers for this attempt
    const { error: answersError } = await supabase
      .from('assessment_answers')
      .delete()
      .eq('attempt_id', attemptId);

    if (answersError) {
      console.error('Error deleting attempt answers:', answersError);
      return false;
    }

    // 2. Delete the attempt itself
    const { error: attemptError } = await supabase
      .from('assessment_attempts')
      .delete()
      .eq('id', attemptId);

    if (attemptError) {
      console.error('Error deleting attempt:', attemptError);
      return false;
    }

    return true;
  }
};
