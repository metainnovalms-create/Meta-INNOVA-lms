import { supabase } from '@/integrations/supabase/client';

export interface Assignment {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  submission_end_date: string;
  question_doc_url: string | null;
  created_by: string | null;
  created_by_role: string;
  institution_id: string | null;
  status: string;
  total_marks: number;
  passing_marks: number;
  allow_resubmit: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssignmentWithClasses extends Assignment {
  classes: { id: string; class_name: string; section: string | null }[];
  submissions_count?: number;
}

export interface AssignmentFormData {
  title: string;
  description?: string;
  start_date: string;
  submission_end_date: string;
  question_doc_url?: string;
  institution_id?: string;
  status?: string;
  total_marks?: number;
  passing_marks?: number;
  allow_resubmit?: boolean;
  class_ids?: string[];
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  institution_id: string;
  class_id: string;
  submission_pdf_url: string;
  submitted_at: string;
  marks_obtained: number | null;
  feedback: string | null;
  graded_by: string | null;
  graded_at: string | null;
  status: string;
}

export const assignmentService = {
  async getAssignments(institutionId?: string): Promise<AssignmentWithClasses[]> {
    let query = (supabase as any)
      .from('assignments')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (institutionId) {
      query = query.eq('institution_id', institutionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get class assignments
    const assignmentIds = (data || []).map((a: Assignment) => a.id);
    if (assignmentIds.length === 0) return [];

    const { data: classAssignments } = await (supabase as any)
      .from('assignment_class_assignments')
      .select('assignment_id, class_id, classes:class_id(id, class_name, section)')
      .in('assignment_id', assignmentIds);

    // Get submissions count
    const { data: submissions } = await (supabase as any)
      .from('assignment_submissions')
      .select('assignment_id')
      .in('assignment_id', assignmentIds);

    return (data || []).map((assignment: Assignment) => {
      const assignedClasses = (classAssignments || [])
        .filter((ca: any) => ca.assignment_id === assignment.id)
        .map((ca: any) => ca.classes)
        .filter(Boolean);
      
      const submissionsCount = (submissions || []).filter((s: any) => s.assignment_id === assignment.id).length;

      return {
        ...assignment,
        classes: assignedClasses,
        submissions_count: submissionsCount
      };
    });
  },

  async getAllAssignments(): Promise<AssignmentWithClasses[]> {
    const { data, error } = await (supabase as any)
      .from('assignments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const assignmentIds = (data || []).map((a: Assignment) => a.id);
    if (assignmentIds.length === 0) return [];

    const { data: classAssignments } = await (supabase as any)
      .from('assignment_class_assignments')
      .select('assignment_id, class_id, classes:class_id(id, class_name, section)')
      .in('assignment_id', assignmentIds);

    return (data || []).map((assignment: Assignment) => ({
      ...assignment,
      classes: (classAssignments || [])
        .filter((ca: any) => ca.assignment_id === assignment.id)
        .map((ca: any) => ca.classes)
        .filter(Boolean)
    }));
  },

  async getAssignment(id: string): Promise<AssignmentWithClasses | null> {
    const { data, error } = await (supabase as any)
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;

    const { data: classAssignments } = await (supabase as any)
      .from('assignment_class_assignments')
      .select('class_id, classes:class_id(id, class_name, section)')
      .eq('assignment_id', id);

    return {
      ...data,
      classes: (classAssignments || []).map((ca: any) => ca.classes).filter(Boolean)
    };
  },

  async createAssignment(formData: AssignmentFormData, role: string = 'system_admin'): Promise<Assignment> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await (supabase as any)
      .from('assignments')
      .insert({
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        submission_end_date: formData.submission_end_date,
        question_doc_url: formData.question_doc_url,
        institution_id: formData.institution_id,
        status: formData.status || 'draft',
        total_marks: formData.total_marks || 100,
        passing_marks: formData.passing_marks || 40,
        allow_resubmit: formData.allow_resubmit !== false,
        created_by: userData?.user?.id,
        created_by_role: role
      })
      .select()
      .single();

    if (error) throw error;

    // Assign to classes if provided
    if (formData.class_ids && formData.class_ids.length > 0) {
      const classAssignments = formData.class_ids.map(classId => ({
        assignment_id: data.id,
        class_id: classId,
        institution_id: formData.institution_id,
        assigned_by: userData?.user?.id
      }));

      await (supabase as any)
        .from('assignment_class_assignments')
        .insert(classAssignments);
    }

    return data;
  },

  async getAssignmentsForInstitution(institutionId: string): Promise<AssignmentWithClasses[]> {
    const { data, error } = await (supabase as any)
      .from('assignments')
      .select('*')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const assignmentIds = (data || []).map((a: Assignment) => a.id);
    if (assignmentIds.length === 0) return [];

    const { data: classAssignments } = await (supabase as any)
      .from('assignment_class_assignments')
      .select('assignment_id, class_id, classes:class_id(id, class_name, section)')
      .in('assignment_id', assignmentIds);

    // Get submissions count
    const { data: submissions } = await (supabase as any)
      .from('assignment_submissions')
      .select('assignment_id')
      .in('assignment_id', assignmentIds);

    return (data || []).map((assignment: Assignment) => {
      const assignedClasses = (classAssignments || [])
        .filter((ca: any) => ca.assignment_id === assignment.id)
        .map((ca: any) => ca.classes)
        .filter(Boolean);
      
      const submissionsCount = (submissions || []).filter((s: any) => s.assignment_id === assignment.id).length;

      return {
        ...assignment,
        classes: assignedClasses,
        submissions_count: submissionsCount
      };
    });
  },

  async updateAssignment(id: string, formData: Partial<AssignmentFormData>): Promise<Assignment> {
    const { data, error } = await (supabase as any)
      .from('assignments')
      .update({
        title: formData.title,
        description: formData.description,
        start_date: formData.start_date,
        submission_end_date: formData.submission_end_date,
        question_doc_url: formData.question_doc_url,
        status: formData.status,
        total_marks: formData.total_marks,
        passing_marks: formData.passing_marks,
        allow_resubmit: formData.allow_resubmit,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update class assignments if provided
    if (formData.class_ids !== undefined) {
      await (supabase as any)
        .from('assignment_class_assignments')
        .delete()
        .eq('assignment_id', id);

      if (formData.class_ids.length > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const classAssignments = formData.class_ids.map(classId => ({
          assignment_id: id,
          class_id: classId,
          institution_id: formData.institution_id || data.institution_id,
          assigned_by: userData?.user?.id
        }));

        await (supabase as any)
          .from('assignment_class_assignments')
          .insert(classAssignments);
      }
    }

    return data;
  },

  async deleteAssignment(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('assignments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Submission functions
  async getSubmissions(assignmentId: string): Promise<AssignmentSubmission[]> {
    const { data, error } = await (supabase as any)
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async submitAssignment(params: {
    assignmentId: string;
    studentId: string;
    institutionId: string;
    classId: string;
    pdfUrl: string;
  }): Promise<AssignmentSubmission> {
    const { data, error } = await (supabase as any)
      .from('assignment_submissions')
      .upsert({
        assignment_id: params.assignmentId,
        student_id: params.studentId,
        institution_id: params.institutionId,
        class_id: params.classId,
        submission_pdf_url: params.pdfUrl,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }, { onConflict: 'assignment_id,student_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async gradeSubmission(submissionId: string, marks: number, feedback?: string): Promise<AssignmentSubmission> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await (supabase as any)
      .from('assignment_submissions')
      .update({
        marks_obtained: marks,
        feedback,
        graded_by: userData?.user?.id,
        graded_at: new Date().toISOString(),
        status: 'graded'
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getStudentSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    const { data, error } = await (supabase as any)
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .single();

    if (error) return null;
    return data;
  }
};
