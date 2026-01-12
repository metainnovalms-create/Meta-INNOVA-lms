import { supabase } from '@/integrations/supabase/client';
import { SDGInfo, SDGAnalytics } from '@/types/sdg';

// All 17 UN Sustainable Development Goals with official colors
export const SDG_GOALS: SDGInfo[] = [
  { id: 'SDG1', number: 1, title: 'No Poverty', description: 'End poverty in all its forms everywhere', color: '#E5243B' },
  { id: 'SDG2', number: 2, title: 'Zero Hunger', description: 'End hunger, achieve food security and improved nutrition', color: '#DDA63A' },
  { id: 'SDG3', number: 3, title: 'Good Health and Well-being', description: 'Ensure healthy lives and promote well-being for all', color: '#4C9F38' },
  { id: 'SDG4', number: 4, title: 'Quality Education', description: 'Ensure inclusive and equitable quality education', color: '#C5192D' },
  { id: 'SDG5', number: 5, title: 'Gender Equality', description: 'Achieve gender equality and empower all women and girls', color: '#FF3A21' },
  { id: 'SDG6', number: 6, title: 'Clean Water and Sanitation', description: 'Ensure availability and sustainable management of water', color: '#26BDE2' },
  { id: 'SDG7', number: 7, title: 'Affordable and Clean Energy', description: 'Ensure access to affordable, reliable, sustainable energy', color: '#FCC30B' },
  { id: 'SDG8', number: 8, title: 'Decent Work and Economic Growth', description: 'Promote sustained, inclusive and sustainable economic growth', color: '#A21942' },
  { id: 'SDG9', number: 9, title: 'Industry, Innovation and Infrastructure', description: 'Build resilient infrastructure, promote inclusive industrialization', color: '#FD6925' },
  { id: 'SDG10', number: 10, title: 'Reduced Inequalities', description: 'Reduce inequality within and among countries', color: '#DD1367' },
  { id: 'SDG11', number: 11, title: 'Sustainable Cities and Communities', description: 'Make cities and human settlements inclusive, safe, resilient', color: '#FD9D24' },
  { id: 'SDG12', number: 12, title: 'Responsible Consumption and Production', description: 'Ensure sustainable consumption and production patterns', color: '#BF8B2E' },
  { id: 'SDG13', number: 13, title: 'Climate Action', description: 'Take urgent action to combat climate change', color: '#3F7E44' },
  { id: 'SDG14', number: 14, title: 'Life Below Water', description: 'Conserve and sustainably use the oceans, seas and marine resources', color: '#0A97D9' },
  { id: 'SDG15', number: 15, title: 'Life on Land', description: 'Protect, restore and promote sustainable use of terrestrial ecosystems', color: '#56C02B' },
  { id: 'SDG16', number: 16, title: 'Peace, Justice and Strong Institutions', description: 'Promote peaceful and inclusive societies for sustainable development', color: '#00689D' },
  { id: 'SDG17', number: 17, title: 'Partnerships for the Goals', description: 'Strengthen the means of implementation and revitalize global partnership', color: '#19486A' },
];

// Convert number array to SDG ID string (e.g., [4, 9] -> ['SDG4', 'SDG9'])
export const numberToSDGIds = (numbers: number[]): string[] => {
  return numbers.map(n => `SDG${n}`);
};

// Convert SDG ID string to number (e.g., 'SDG4' -> 4)
export const sdgIdToNumber = (id: string): number => {
  return parseInt(id.replace('SDG', ''));
};

// Get SDG info by number
export const getSDGByNumber = (num: number): SDGInfo | undefined => {
  return SDG_GOALS.find(sdg => sdg.number === num);
};

// Get SDG info by ID
export const getSDGById = (id: string): SDGInfo | undefined => {
  return SDG_GOALS.find(sdg => sdg.id === id);
};

export const sdgService = {
  // Get all courses with their SDG goals
  async getCoursesWithSDGs() {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, course_code, description, status, sdg_goals')
      .in('status', ['active', 'published', 'draft']);
    
    if (error) throw error;
    return data || [];
  },

  // Get all projects with their SDG goals
  async getProjectsWithSDGs() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, status, sdg_goals, institution_id, progress, category, institutions(name)');
    
    if (error) throw error;
    return data || [];
  },

  // Update course SDG goals
  async updateCourseSDGs(courseId: string, sdgGoals: number[]) {
    const { error } = await supabase
      .from('courses')
      .update({ sdg_goals: sdgGoals })
      .eq('id', courseId);
    
    if (error) throw error;
  },

  // Get SDG analytics from real data
  async getSDGAnalytics(): Promise<SDGAnalytics[]> {
    // Fetch courses, projects, and project members
    const [courses, projects, projectMembersRes] = await Promise.all([
      this.getCoursesWithSDGs(),
      this.getProjectsWithSDGs(),
      supabase.from('project_members').select('project_id, student_id')
    ]);

    const projectMembers = projectMembersRes.data || [];

    // Calculate analytics for each SDG
    return SDG_GOALS.map(sdg => {
      const coursesWithSDG = courses.filter(c => {
        const goals = c.sdg_goals as number[] | null;
        return goals?.includes(sdg.number);
      }).length;

      // Get projects with this SDG
      const projectsWithThisSDG = projects.filter(p => {
        const goals = p.sdg_goals as number[] | null;
        return goals?.includes(sdg.number);
      });
      const projectsWithSDG = projectsWithThisSDG.length;

      // Calculate unique students impacted (from project_members table)
      const projectIdsWithSDG = projectsWithThisSDG.map(p => p.id);
      const studentsInSDGProjects = new Set(
        projectMembers
          .filter(m => projectIdsWithSDG.includes(m.project_id))
          .map(m => m.student_id)
      );
      const studentsImpacted = studentsInSDGProjects.size;

      return {
        sdg_goal: sdg.id as any,
        sdg_info: sdg,
        course_count: coursesWithSDG,
        project_count: projectsWithSDG,
        total_students_impacted: studentsImpacted,
        total_officers_involved: coursesWithSDG > 0 ? 1 : 0
      };
    });
  },

  // Get institution-specific SDG stats
  async getInstitutionSDGStats(institutionId: string) {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, sdg_goals, status, progress')
      .eq('institution_id', institutionId);

    if (error) throw error;

    const sdgCounts: Record<number, number> = {};

    projects?.forEach(p => {
      const goals = p.sdg_goals as number[] | null;
      goals?.forEach(g => {
        sdgCounts[g] = (sdgCounts[g] || 0) + 1;
      });
    });

    return {
      projects: projects || [],
      sdgCounts,
      totalProjects: projects?.length || 0
    };
  },

  // Get student's SDG contribution
  async getStudentSDGContribution(studentId: string) {
    // Get projects where student is a member
    const { data: memberProjects } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('student_id', studentId);

    const projectIds = memberProjects?.map(m => m.project_id) || [];

    let studentProjects: any[] = [];
    if (projectIds.length > 0) {
      const { data } = await supabase
        .from('projects')
        .select('id, title, sdg_goals, status, progress, category')
        .in('id', projectIds);
      studentProjects = data || [];
    }

    // Aggregate all SDGs from student's projects
    const sdgSet = new Set<number>();
    
    studentProjects.forEach(p => {
      const goals = p.sdg_goals as number[] | null;
      goals?.forEach(g => sdgSet.add(g));
    });

    return {
      projects: studentProjects,
      courses: [],
      activeSDGs: Array.from(sdgSet).sort((a, b) => a - b),
      totalProjects: studentProjects.length
    };
  },

  // Get institutions engaged in SDGs
  async getInstitutionsWithSDGs() {
    const { data, error } = await supabase
      .from('projects')
      .select('institution_id, institutions(id, name)')
      .not('sdg_goals', 'is', null);

    if (error) throw error;

    // Get unique institutions
    const uniqueInstitutions = new Map();
    data?.forEach(p => {
      if (p.institutions && !uniqueInstitutions.has(p.institution_id)) {
        uniqueInstitutions.set(p.institution_id, p.institutions);
      }
    });

    return Array.from(uniqueInstitutions.values());
  },

  // Get institution-wise SDG contributions for leaderboard
  async getInstitutionContributions() {
    // Fetch all required data in parallel
    const [
      institutionsRes,
      projectsRes,
      projectMembersRes,
      coursesRes,
      courseInstitutionAssignmentsRes
    ] = await Promise.all([
      supabase.from('institutions').select('id, name').eq('status', 'active'),
      supabase.from('projects').select('id, title, sdg_goals, institution_id, created_by_officer_id, status'),
      supabase.from('project_members').select('project_id, student_id'),
      supabase.from('courses').select('id, title, sdg_goals'),
      supabase.from('course_institution_assignments').select('course_id, institution_id')
    ]);

    const institutions = institutionsRes.data || [];
    const projects = projectsRes.data || [];
    const projectMembers = projectMembersRes.data || [];
    const courses = coursesRes.data || [];
    const courseAssignments = courseInstitutionAssignmentsRes.data || [];

    // Build course SDG map
    const courseSdgMap = new Map<string, number[]>();
    courses.forEach(c => {
      const goals = c.sdg_goals as number[] | null;
      if (goals && goals.length > 0) {
        courseSdgMap.set(c.id, goals);
      }
    });

    // Calculate contributions per institution
    const contributionsList = institutions.map(inst => {
      // Get institution's projects
      const instProjects = projects.filter(p => p.institution_id === inst.id);
      const sdgProjects = instProjects.filter(p => {
        const goals = p.sdg_goals as number[] | null;
        return goals && goals.length > 0;
      });

      // Get project IDs for this institution
      const sdgProjectIds = sdgProjects.map(p => p.id);

      // Count students in SDG projects
      const studentsInSDGProjects = new Set(
        projectMembers
          .filter(m => sdgProjectIds.includes(m.project_id))
          .map(m => m.student_id)
      );

      // Count unique officers who created SDG projects
      const officersInvolved = new Set(
        sdgProjects
          .filter(p => p.created_by_officer_id)
          .map(p => p.created_by_officer_id)
      );

      // Get courses assigned to this institution
      const instCourseIds = courseAssignments
        .filter(ca => ca.institution_id === inst.id)
        .map(ca => ca.course_id);
      
      const sdgCoursesAssigned = instCourseIds.filter(cid => courseSdgMap.has(cid)).length;

      // Collect all unique SDGs
      const uniqueSDGs = new Set<number>();
      sdgProjects.forEach(p => {
        const goals = p.sdg_goals as number[] | null;
        goals?.forEach(g => uniqueSDGs.add(g));
      });
      instCourseIds.forEach(cid => {
        const courseGoals = courseSdgMap.get(cid);
        courseGoals?.forEach(g => uniqueSDGs.add(g));
      });

      // SDG breakdown (projects per SDG)
      const sdgBreakdown: Record<number, { projects: number }> = {};
      sdgProjects.forEach(p => {
        const goals = p.sdg_goals as number[] | null;
        goals?.forEach(g => {
          if (!sdgBreakdown[g]) sdgBreakdown[g] = { projects: 0 };
          sdgBreakdown[g].projects++;
        });
      });

      // Calculate contribution score
      // Score = (SDG Projects × 3) + (Students × 1) + (SDG Courses × 2) + (Unique SDGs × 2)
      const contributionScore =
        (sdgProjects.length * 3) +
        (studentsInSDGProjects.size * 1) +
        (sdgCoursesAssigned * 2) +
        (uniqueSDGs.size * 2);

      return {
        institution_id: inst.id,
        institution_name: inst.name,
        total_projects: instProjects.length,
        sdg_projects: sdgProjects.length,
        students_in_sdg_projects: studentsInSDGProjects.size,
        officers_involved: officersInvolved.size,
        courses_assigned: instCourseIds.length,
        sdg_courses_assigned: sdgCoursesAssigned,
        unique_sdgs: Array.from(uniqueSDGs).sort((a, b) => a - b),
        contribution_score: contributionScore,
        sdg_breakdown: sdgBreakdown
      };
    });

    // Filter to only institutions with contributions and sort by score
    const activeContributions = contributionsList
      .filter(c => c.sdg_projects > 0 || c.sdg_courses_assigned > 0)
      .sort((a, b) => b.contribution_score - a.contribution_score);

    // Calculate global stats
    const allSDGs = new Set<number>();
    const allStudents = new Set<string>();
    let totalSDGProjects = 0;

    activeContributions.forEach(c => {
      c.unique_sdgs.forEach(sdg => allSDGs.add(sdg));
      totalSDGProjects += c.sdg_projects;
    });

    // Get all students impacted globally
    const allSDGProjectIds = projects
      .filter(p => {
        const goals = p.sdg_goals as number[] | null;
        return goals && goals.length > 0;
      })
      .map(p => p.id);
    
    projectMembers
      .filter(m => allSDGProjectIds.includes(m.project_id))
      .forEach(m => allStudents.add(m.student_id));

    return {
      institutions: activeContributions,
      globalStats: {
        total_institutions: activeContributions.length,
        total_sdg_projects: totalSDGProjects,
        total_sdgs_covered: allSDGs.size,
        total_students_impacted: allStudents.size
      }
    };
  }
};
