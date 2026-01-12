import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ResumeProject {
  id: string;
  title: string;
  description: string | null;
  sdg_goals: string[];
  role: string | null;
}

export interface ResumeCertificate {
  id: string;
  activity_name: string;
  issued_date: string;
  grade: string | null;
}

export interface ResumeData {
  personal: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  education: {
    institution: string;
    className: string;
    section: string | null;
    academicYear: string | null;
  };
  skills: string[];
  projects: ResumeProject[];
  certificates: ResumeCertificate[];
  studentId: string | null;
}

export function useStudentResume() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['student-resume', user?.id],
    queryFn: async (): Promise<ResumeData> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // 1. Get student info with institution and class
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          id,
          student_name,
          email,
          address,
          parent_phone,
          institution_id,
          class_id,
          institutions!students_institution_id_fkey (
            name
          ),
          classes!students_class_id_fkey (
            class_name,
            section,
            academic_year
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (studentError) {
        console.error('Error fetching student:', studentError);
        throw studentError;
      }

      if (!studentData) {
        return {
          personal: {
            name: user.email?.split('@')[0] || 'Student',
            email: user.email || '',
            phone: '',
            address: '',
          },
          education: {
            institution: 'Not assigned',
            className: 'Not assigned',
            section: null,
            academicYear: null,
          },
          skills: [],
          projects: [],
          certificates: [],
          studentId: null,
        };
      }

      const institution = studentData.institutions as { name: string } | null;
      const classInfo = studentData.classes as { 
        class_name: string; 
        section: string | null; 
        academic_year: string | null 
      } | null;

      // 2. Get student's projects with SDG goals
      const { data: projectsData, error: projectsError } = await supabase
        .from('project_members')
        .select(`
          role,
          projects (
            id,
            title,
            description,
            sdg_goals
          )
        `)
        .eq('student_id', studentData.id);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
      }

      const projects: ResumeProject[] = (projectsData || [])
        .filter(pm => pm.projects)
        .map(pm => {
          const project = pm.projects as {
            id: string;
            title: string;
            description: string | null;
            sdg_goals: unknown;
          };
          
          // Parse SDG goals - handle different formats
          let sdgGoals: string[] = [];
          if (project.sdg_goals) {
            if (Array.isArray(project.sdg_goals)) {
              sdgGoals = project.sdg_goals.map(g => String(g));
            } else if (typeof project.sdg_goals === 'string') {
              sdgGoals = [project.sdg_goals];
            }
          }
          
          return {
            id: project.id,
            title: project.title,
            description: project.description,
            sdg_goals: sdgGoals,
            role: pm.role,
          };
        });

      // 3. Get student's certificates
      const { data: certificatesData, error: certificatesError } = await supabase
        .from('student_certificates')
        .select('id, activity_name, issued_date, grade')
        .eq('student_id', studentData.id)
        .order('issued_date', { ascending: false });

      if (certificatesError) {
        console.error('Error fetching certificates:', certificatesError);
      }

      const certificates: ResumeCertificate[] = (certificatesData || []).map(cert => ({
        id: cert.id,
        activity_name: cert.activity_name,
        issued_date: cert.issued_date,
        grade: cert.grade,
      }));

      // 4. Get skills from courses assigned to student's class
      let skills: string[] = [];
      if (studentData.class_id) {
        const { data: coursesData, error: coursesError } = await supabase
          .from('course_class_assignments')
          .select(`
            courses (
              title,
              learning_outcomes
            )
          `)
          .eq('class_id', studentData.class_id);

        if (coursesError) {
          console.error('Error fetching courses:', coursesError);
        }

        // Extract unique course titles as skills
        skills = (coursesData || [])
          .filter(cca => cca.courses)
          .map(cca => {
            const course = cca.courses as { title: string };
            return course.title;
          })
          .filter((title, index, self) => self.indexOf(title) === index);
      }

      return {
        personal: {
          name: studentData.student_name || 'Student',
          email: studentData.email || user.email || '',
          phone: studentData.parent_phone || '',
          address: studentData.address || '',
        },
        education: {
          institution: institution?.name || 'Not assigned',
          className: classInfo?.class_name || 'Not assigned',
          section: classInfo?.section || null,
          academicYear: classInfo?.academic_year || null,
        },
        skills,
        projects,
        certificates,
        studentId: studentData.id,
      };
    },
    enabled: !!user?.id,
  });
}
