import { supabase } from "@/integrations/supabase/client";

export interface StudentFeedback {
  id?: string;
  student_id: string;
  student_name?: string;
  institution_id: string;
  category: 'course' | 'officer' | 'facility' | 'general' | 'other';
  subject: string;
  feedback_text: string;
  rating?: number;
  is_anonymous?: boolean;
  related_course_id?: string;
  related_officer_id?: string;
  status?: 'submitted' | 'under_review' | 'resolved' | 'dismissed';
  admin_response?: string;
  admin_response_by?: string;
  admin_response_at?: string;
}

export interface FeedbackFilters {
  status?: string;
  category?: string;
  institution_id?: string;
  student_id?: string;
}

// Submit new feedback
export async function submitFeedback(feedback: StudentFeedback) {
  const { data, error } = await supabase
    .from('student_feedback')
    .insert({
      student_id: feedback.student_id,
      student_name: feedback.is_anonymous ? null : feedback.student_name,
      institution_id: feedback.institution_id,
      category: feedback.category,
      subject: feedback.subject,
      feedback_text: feedback.feedback_text,
      rating: feedback.rating,
      is_anonymous: feedback.is_anonymous || false,
      related_course_id: feedback.related_course_id,
      related_officer_id: feedback.related_officer_id,
      status: 'submitted',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get feedback list with filters
export async function getFeedbackList(filters?: FeedbackFilters) {
  let query = supabase
    .from('student_feedback')
    .select(`
      *,
      profiles:student_id (
        name,
        email
      ),
      institutions:institution_id (
        name
      ),
      courses:related_course_id (
        title
      ),
      officers:related_officer_id (
        full_name
      )
    `)
    .order('submitted_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.institution_id) {
    query = query.eq('institution_id', filters.institution_id);
  }
  if (filters?.student_id) {
    query = query.eq('student_id', filters.student_id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Get feedback by ID
export async function getFeedbackById(feedbackId: string) {
  const { data, error } = await supabase
    .from('student_feedback')
    .select(`
      *,
      profiles:student_id (
        name,
        email
      ),
      institutions:institution_id (
        name
      ),
      courses:related_course_id (
        title
      ),
      officers:related_officer_id (
        full_name
      )
    `)
    .eq('id', feedbackId)
    .single();

  if (error) throw error;
  return data;
}

// Update feedback status and add admin response
export async function updateFeedbackStatus(
  feedbackId: string,
  status: 'submitted' | 'under_review' | 'resolved' | 'dismissed',
  adminResponse?: string,
  adminUserId?: string
) {
  const updateData: any = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: adminUserId,
  };

  if (adminResponse) {
    updateData.admin_response = adminResponse;
    updateData.admin_response_by = adminUserId;
    updateData.admin_response_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('student_feedback')
    .update(updateData)
    .eq('id', feedbackId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Get student's own feedback
export async function getStudentFeedback(studentId: string) {
  const { data, error } = await supabase
    .from('student_feedback')
    .select('*')
    .eq('student_id', studentId)
    .order('submitted_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get feedback statistics
export async function getFeedbackStats(institutionId?: string) {
  let query = supabase
    .from('student_feedback')
    .select('status, category, rating');

  if (institutionId) {
    query = query.eq('institution_id', institutionId);
  }

  const { data, error } = await query;
  if (error) throw error;

  const stats = {
    total: data.length,
    by_status: {
      submitted: 0,
      under_review: 0,
      resolved: 0,
      dismissed: 0,
    } as Record<string, number>,
    by_category: {} as Record<string, number>,
    average_rating: 0,
  };

  let ratingSum = 0;
  let ratingCount = 0;

  data.forEach(feedback => {
    // Status count
    stats.by_status[feedback.status] = (stats.by_status[feedback.status] || 0) + 1;
    
    // Category count
    stats.by_category[feedback.category] = (stats.by_category[feedback.category] || 0) + 1;
    
    // Rating average
    if (feedback.rating) {
      ratingSum += feedback.rating;
      ratingCount++;
    }
  });

  stats.average_rating = ratingCount > 0 ? ratingSum / ratingCount : 0;

  return stats;
}

// Delete feedback (admin only)
export async function deleteFeedback(feedbackId: string) {
  const { error } = await supabase
    .from('student_feedback')
    .delete()
    .eq('id', feedbackId);

  if (error) throw error;
}
