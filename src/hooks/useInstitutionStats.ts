import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface OfficerOnLeave {
  officerName: string;
  startDate: string;
  endDate: string;
  leaveType: string;
}

export interface InstitutionStats {
  totalStudents: number;
  totalClasses: number;
  totalProjects: number;
  activeProjects: number;
  totalCourses: number;
  totalOfficers: number;
  officersOnLeave: number;
  officersOnLeaveDetails: OfficerOnLeave[];
  pendingPurchases: number;
  totalXP: number;
  totalBadges: number;
  assessmentAttempts: number;
  avgAssessmentScore: number;
  assignmentSubmissions: number;
  avgAssignmentMarks: number;
  pendingPurchaseAmount: number;
}

export interface CriticalActionItem {
  id: string;
  type: 'purchase' | 'info' | 'deadline' | 'payroll';
  title: string;
  description: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  deadline?: string;
  amount?: number;
  link: string;
}

export interface DbInstitution {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  type: string | null;
  status: string | null;
  address: {
    city?: string;
    state?: string;
    location?: string;
  } | null;
  settings: {
    established_year?: string;
    academic_year?: string;
  } | null;
  contact_info: Record<string, unknown> | null;
  admin_user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useInstitutionStats(institutionSlug: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [institution, setInstitution] = useState<DbInstitution | null>(null);
  const [stats, setStats] = useState<InstitutionStats>({
    totalStudents: 0,
    totalClasses: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalCourses: 0,
    totalOfficers: 0,
    officersOnLeave: 0,
    officersOnLeaveDetails: [],
    pendingPurchases: 0,
    totalXP: 0,
    totalBadges: 0,
    assessmentAttempts: 0,
    avgAssessmentScore: 0,
    assignmentSubmissions: 0,
    avgAssignmentMarks: 0,
    pendingPurchaseAmount: 0,
  });
  const [criticalActions, setCriticalActions] = useState<CriticalActionItem[]>([]);
  const [assignedOfficers, setAssignedOfficers] = useState<string[]>([]);

  useEffect(() => {
    if (!institutionSlug) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      
      try {
        // 1. Fetch institution
        const { data: inst } = await supabase
          .from('institutions')
          .select('*')
          .eq('slug', institutionSlug)
          .maybeSingle();

        if (!inst) {
          setLoading(false);
          return;
        }

        // Cast the data to our interface
        const institutionData: DbInstitution = {
          id: inst.id,
          name: inst.name,
          slug: inst.slug,
          code: inst.code,
          type: inst.type,
          status: inst.status,
          address: inst.address as DbInstitution['address'],
          settings: inst.settings as DbInstitution['settings'],
          contact_info: inst.contact_info as Record<string, unknown>,
          admin_user_id: inst.admin_user_id,
          created_at: inst.created_at,
          updated_at: inst.updated_at,
        };
        
        setInstitution(institutionData);
        const institutionId = inst.id;

        // 2. Fetch all counts in parallel
        const [
          studentsResult,
          classesResult,
          projectsResult,
          activeProjectsResult,
          coursesResult,
          officersResult,
          pendingPurchasesResult,
          xpResult,
          badgesResult,
          assessmentAttemptsResult,
          assignmentSubmissionsResult,
        ] = await Promise.all([
          // Total students
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId),
          // Total classes
          supabase.from('classes').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId),
          // Total projects
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId),
          // Active projects
          supabase.from('projects').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId).eq('status', 'active'),
          // Total courses assigned
          supabase.from('course_institution_assignments').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId),
          // Officers assigned to this institution
          supabase.from('officers').select('id, full_name, assigned_institutions').contains('assigned_institutions', [institutionId]),
          // Pending purchase requests
          supabase.from('purchase_requests').select('id, total_estimated_cost', { count: 'exact' }).eq('institution_id', institutionId).eq('status', 'pending'),
          // Total XP earned
          supabase.from('student_xp_transactions').select('points_earned').eq('institution_id', institutionId),
          // Total badges earned
          supabase.from('student_badges').select('*', { count: 'exact', head: true }).eq('institution_id', institutionId),
          // Assessment attempts
          supabase.from('assessment_attempts').select('percentage').eq('institution_id', institutionId),
          // Assignment submissions
          supabase.from('assignment_submissions').select('marks_obtained, assignments!inner(total_marks)').eq('institution_id', institutionId),
        ]);

        // Calculate stats
        const totalXP = xpResult.data?.reduce((sum, t) => sum + (t.points_earned || 0), 0) || 0;
        const assessmentScores = assessmentAttemptsResult.data || [];
        const avgAssessmentScore = assessmentScores.length > 0 
          ? Math.round(assessmentScores.reduce((sum, a) => sum + (a.percentage || 0), 0) / assessmentScores.length)
          : 0;
        
        const submissions = assignmentSubmissionsResult.data || [];
        const avgAssignmentMarks = submissions.length > 0
          ? Math.round(submissions.reduce((sum, s) => sum + ((s.marks_obtained || 0) / ((s.assignments as any)?.total_marks || 100) * 100), 0) / submissions.length)
          : 0;

        const pendingPurchaseAmount = pendingPurchasesResult.data?.reduce((sum, p) => sum + (p.total_estimated_cost || 0), 0) || 0;

        // Get officer names
        const officers = officersResult.data || [];
        setAssignedOfficers(officers.map(o => o.full_name));

        // Fetch officers currently on approved leave today
        const today = new Date().toISOString().split('T')[0];
        const officerIds = officers.map(o => o.id);
        
        let officersOnLeaveDetails: OfficerOnLeave[] = [];
        if (officerIds.length > 0) {
          const { data: activeLeaves } = await supabase
            .from('leave_applications')
            .select('applicant_name, start_date, end_date, leave_type')
            .eq('status', 'approved')
            .lte('start_date', today)
            .gte('end_date', today)
            .in('officer_id', officerIds);
          
          officersOnLeaveDetails = (activeLeaves || []).map(l => ({
            officerName: l.applicant_name || 'Unknown',
            startDate: l.start_date,
            endDate: l.end_date,
            leaveType: l.leave_type || 'Leave',
          }));
        }

        setStats({
          totalStudents: studentsResult.count || 0,
          totalClasses: classesResult.count || 0,
          totalProjects: projectsResult.count || 0,
          activeProjects: activeProjectsResult.count || 0,
          totalCourses: coursesResult.count || 0,
          totalOfficers: officers.length,
          officersOnLeave: officersOnLeaveDetails.length,
          officersOnLeaveDetails,
          pendingPurchases: pendingPurchasesResult.count || 0,
          totalXP,
          totalBadges: badgesResult.count || 0,
          assessmentAttempts: assessmentScores.length,
          avgAssessmentScore,
          assignmentSubmissions: submissions.length,
          avgAssignmentMarks,
          pendingPurchaseAmount,
        });

        // Build critical actions from real data
        const actions: CriticalActionItem[] = [];
        
        if ((pendingPurchasesResult.count || 0) > 0) {
          actions.push({
            id: 'purchase',
            type: 'purchase',
            title: 'Purchase Requests',
            description: 'Pending approval for equipment and supplies',
            count: pendingPurchasesResult.count || 0,
            urgency: (pendingPurchasesResult.count || 0) > 5 ? 'high' : 'medium',
            amount: pendingPurchaseAmount,
            link: `/tenant/${institutionSlug}/management/inventory-purchase`,
          });
        }

        // Show officers currently on leave as informational notice
        if (officersOnLeaveDetails.length > 0) {
          actions.push({
            id: 'leave-notice',
            type: 'info',
            title: 'Officers on Leave Today',
            description: officersOnLeaveDetails.map(o => o.officerName).join(', '),
            count: officersOnLeaveDetails.length,
            urgency: 'low',
            link: `/tenant/${institutionSlug}/management/officers`,
          });
        }

        // Check for ungraded assignments
        const { count: ungradedCount } = await supabase
          .from('assignment_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('institution_id', institutionId)
          .eq('status', 'submitted');

        if ((ungradedCount || 0) > 0) {
          actions.push({
            id: 'assignments',
            type: 'deadline',
            title: 'Ungraded Assignments',
            description: 'Student submissions awaiting grading',
            count: ungradedCount || 0,
            urgency: (ungradedCount || 0) > 10 ? 'high' : 'medium',
            link: `/tenant/${institutionSlug}/management/assignments`,
          });
        }

        setCriticalActions(actions);
      } catch (error) {
        console.error('Error fetching institution stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [institutionSlug]);

  return { loading, institution, stats, criticalActions, assignedOfficers, refetch: () => {} };
}
