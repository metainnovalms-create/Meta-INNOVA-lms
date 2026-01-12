import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for class module/session assignments
export type UnlockMode = 'manual' | 'sequential';

export interface ClassModuleAssignment {
  id: string;
  class_assignment_id: string;
  module_id: string;
  is_unlocked: boolean;
  unlock_order: number;
  unlock_mode: UnlockMode;
  created_at: string;
  updated_at: string;
  module?: {
    id: string;
    title: string;
    description: string | null;
    display_order: number;
  };
  session_assignments?: ClassSessionAssignment[];
}

export interface ClassSessionAssignment {
  id: string;
  class_module_assignment_id: string;
  session_id: string;
  is_unlocked: boolean;
  unlock_order: number;
  unlock_mode: UnlockMode;
  created_at: string;
  updated_at: string;
  session?: {
    id: string;
    title: string;
    description: string | null;
    display_order: number;
  };
}

export interface ClassCourseAssignmentWithDetails {
  id: string;
  class_id: string;
  course_id: string;
  institution_id: string;
  assigned_at: string;
  assigned_by: string | null;
  course?: {
    id: string;
    title: string;
    course_code: string;
    category: string;
    status: string;
    thumbnail_url: string | null;
  };
  module_assignments?: ClassModuleAssignment[];
}

// Fetch class course assignments with module/session details
export function useClassCourseAssignments(classId?: string) {
  return useQuery({
    queryKey: ['class-course-assignments', classId],
    queryFn: async () => {
      if (!classId) return [];

      // Get course class assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('course_class_assignments')
        .select(`
          id,
          class_id,
          course_id,
          institution_id,
          assigned_at,
          assigned_by,
          courses (
            id,
            title,
            course_code,
            category,
            status,
            thumbnail_url
          )
        `)
        .eq('class_id', classId);

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [];

      // Get module assignments for each course assignment
      const assignmentIds = assignments.map(a => a.id);
      const { data: moduleAssignments, error: moduleError } = await supabase
        .from('class_module_assignments')
        .select(`
          id,
          class_assignment_id,
          module_id,
          is_unlocked,
          unlock_order,
          unlock_mode,
          created_at,
          updated_at,
          course_modules (
            id,
            title,
            description,
            display_order
          )
        `)
        .in('class_assignment_id', assignmentIds)
        .order('unlock_order', { ascending: true });

      if (moduleError) throw moduleError;

      // Get session assignments for each module assignment
      const moduleAssignmentIds = moduleAssignments?.map(m => m.id) || [];
      let sessionAssignments: any[] = [];
      
      if (moduleAssignmentIds.length > 0) {
        const { data: sessions, error: sessionError } = await supabase
          .from('class_session_assignments')
          .select(`
            id,
            class_module_assignment_id,
            session_id,
            is_unlocked,
            unlock_order,
            unlock_mode,
            created_at,
            updated_at,
            course_sessions (
              id,
              title,
              description,
              display_order
            )
          `)
          .in('class_module_assignment_id', moduleAssignmentIds)
          .order('unlock_order', { ascending: true });

        if (sessionError) throw sessionError;
        sessionAssignments = sessions || [];
      }

      // Combine the data
      return assignments.map(assignment => ({
        ...assignment,
        course: assignment.courses,
        module_assignments: (moduleAssignments || [])
          .filter(ma => ma.class_assignment_id === assignment.id)
          .map(ma => ({
            ...ma,
            module: ma.course_modules,
            session_assignments: sessionAssignments
              .filter(sa => sa.class_module_assignment_id === ma.id)
              .map(sa => ({
                ...sa,
                session: sa.course_sessions,
              })),
          })),
      })) as ClassCourseAssignmentWithDetails[];
    },
    enabled: !!classId,
  });
}

// Assign course to class with modules and sessions (upsert logic - skips existing)
export function useAssignCourseToClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      courseId,
      institutionId,
      modules,
    }: {
      classId: string;
      courseId: string;
      institutionId: string;
      modules: {
        moduleId: string;
        isUnlocked: boolean;
        unlockOrder: number;
        unlockMode: UnlockMode;
        sessions: {
          sessionId: string;
          isUnlocked: boolean;
          unlockOrder: number;
          unlockMode: UnlockMode;
        }[];
      }[];
    }) => {
      // Check if course-class assignment already exists
      const { data: existingAssignment } = await supabase
        .from('course_class_assignments')
        .select('id')
        .eq('class_id', classId)
        .eq('course_id', courseId)
        .maybeSingle();

      let assignmentId: string;

      if (existingAssignment) {
        // Use existing assignment
        assignmentId = existingAssignment.id;
      } else {
        // Create new course class assignment
        const { data: newAssignment, error: assignmentError } = await supabase
          .from('course_class_assignments')
          .insert({
            class_id: classId,
            course_id: courseId,
            institution_id: institutionId,
          })
          .select()
          .single();

        if (assignmentError) throw assignmentError;
        assignmentId = newAssignment.id;
      }

      // Process module assignments
      for (const mod of modules) {
        // Check if module assignment already exists
        const { data: existingModule } = await supabase
          .from('class_module_assignments')
          .select('id')
          .eq('class_assignment_id', assignmentId)
          .eq('module_id', mod.moduleId)
          .maybeSingle();

        let moduleAssignmentId: string;

        if (existingModule) {
          // Skip - module already assigned, use existing ID
          moduleAssignmentId = existingModule.id;
        } else {
          // Create new module assignment
          const { data: newModule, error: moduleError } = await supabase
            .from('class_module_assignments')
            .insert({
              class_assignment_id: assignmentId,
              module_id: mod.moduleId,
              is_unlocked: mod.isUnlocked,
              unlock_order: mod.unlockOrder,
              unlock_mode: mod.unlockMode,
            })
            .select()
            .single();

          if (moduleError) throw moduleError;
          moduleAssignmentId = newModule.id;
        }

        // Process session assignments for this module
        for (const sess of mod.sessions) {
          // Check if session assignment already exists
          const { data: existingSession } = await supabase
            .from('class_session_assignments')
            .select('id')
            .eq('class_module_assignment_id', moduleAssignmentId)
            .eq('session_id', sess.sessionId)
            .maybeSingle();

          if (!existingSession) {
            // Only insert if doesn't exist
            const { error: sessionError } = await supabase
              .from('class_session_assignments')
              .insert({
                class_module_assignment_id: moduleAssignmentId,
                session_id: sess.sessionId,
                is_unlocked: sess.isUnlocked,
                unlock_order: sess.unlockOrder,
                unlock_mode: sess.unlockMode,
              });

            if (sessionError) throw sessionError;
          }
        }
      }

      return { id: assignmentId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-course-assignments', variables.classId] });
      toast.success('Course assigned successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to assign course: ${error.message}`);
    },
  });
}

// Remove course assignment from class
export function useRemoveCourseFromClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assignmentId, classId }: { assignmentId: string; classId: string }) => {
      const { error } = await supabase
        .from('course_class_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      return { assignmentId, classId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-course-assignments', variables.classId] });
      toast.success('Course assignment removed');
    },
    onError: (error: any) => {
      toast.error(`Failed to remove course: ${error.message}`);
    },
  });
}

// Toggle module unlock status
export function useToggleModuleUnlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleAssignmentId,
      isUnlocked,
      classId,
    }: {
      moduleAssignmentId: string;
      isUnlocked: boolean;
      classId: string;
    }) => {
      const { error } = await supabase
        .from('class_module_assignments')
        .update({ is_unlocked: isUnlocked })
        .eq('id', moduleAssignmentId);

      if (error) throw error;
      return { moduleAssignmentId, isUnlocked, classId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-course-assignments', variables.classId] });
      toast.success(variables.isUnlocked ? 'Module unlocked' : 'Module locked');
    },
    onError: (error: any) => {
      toast.error(`Failed to update module: ${error.message}`);
    },
  });
}

// Toggle session unlock status
export function useToggleSessionUnlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionAssignmentId,
      isUnlocked,
      classId,
    }: {
      sessionAssignmentId: string;
      isUnlocked: boolean;
      classId: string;
    }) => {
      const { error } = await supabase
        .from('class_session_assignments')
        .update({ is_unlocked: isUnlocked })
        .eq('id', sessionAssignmentId);

      if (error) throw error;
      return { sessionAssignmentId, isUnlocked, classId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['class-course-assignments', variables.classId] });
      toast.success(variables.isUnlocked ? 'Session unlocked' : 'Session locked');
    },
    onError: (error: any) => {
      toast.error(`Failed to update session: ${error.message}`);
    },
  });
}

// Fetch student courses (for student view - only unlocked modules/sessions)
// Note: userId parameter is the auth user ID, we need to convert to students.id for completions
export function useStudentCourses(userId?: string, classId?: string) {
  return useQuery({
    queryKey: ['student-courses', userId, classId],
    queryFn: async () => {
      if (!classId) return [];

      // First, get the student record ID from the auth user ID
      let studentRecordId: string | null = null;
      if (userId) {
        const { data: studentRecord, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();

        if (studentError) throw studentError;
        studentRecordId = studentRecord?.id || null;
      }

      // Get course class assignments for this class
      const { data: assignments, error: assignmentError } = await supabase
        .from('course_class_assignments')
        .select(`
          id,
          class_id,
          course_id,
          courses (
            id,
            title,
            course_code,
            description,
            category,
            difficulty,
            status,
            thumbnail_url,
            duration_weeks,
            learning_outcomes
          )
        `)
        .eq('class_id', classId);

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [];

      // Get ALL module assignments (including locked) so we can show titles
      const assignmentIds = assignments.map(a => a.id);
      const { data: moduleAssignments, error: moduleError } = await supabase
        .from('class_module_assignments')
        .select(`
          id,
          class_assignment_id,
          module_id,
          is_unlocked,
          unlock_order,
          course_modules (
            id,
            title,
            description,
            display_order
          )
        `)
        .in('class_assignment_id', assignmentIds)
        .order('unlock_order', { ascending: true });

      if (moduleError) throw moduleError;

      // Get ALL session assignments (including locked) so we can show titles
      const moduleAssignmentIds = moduleAssignments?.map(m => m.id) || [];
      let sessionAssignments: any[] = [];

      if (moduleAssignmentIds.length > 0) {
        const { data: sessions, error: sessionError } = await supabase
          .from('class_session_assignments')
          .select(`
            id,
            class_module_assignment_id,
            session_id,
            is_unlocked,
            unlock_order,
            course_sessions (
              id,
              title,
              description,
              display_order
            )
          `)
          .in('class_module_assignment_id', moduleAssignmentIds)
          .order('unlock_order', { ascending: true });

        if (sessionError) throw sessionError;
        sessionAssignments = sessions || [];
      }

      // Get content for UNLOCKED sessions only (not locked ones)
      const unlockedSessionIds = sessionAssignments
        .filter(s => s.is_unlocked === true)
        .map(s => s.session_id);
      let contentItems: any[] = [];

      if (unlockedSessionIds.length > 0) {
        const { data: content, error: contentError } = await supabase
          .from('course_content')
          .select('*')
          .in('session_id', unlockedSessionIds)
          .order('display_order', { ascending: true });

        if (contentError) throw contentError;
        contentItems = content || [];
      }

      // Get student completions using students.id (not auth user ID)
      let completions: any[] = [];
      if (studentRecordId && assignmentIds.length > 0) {
        const { data: studentCompletions, error: completionError } = await supabase
          .from('student_content_completions')
          .select('*')
          .eq('student_id', studentRecordId)
          .in('class_assignment_id', assignmentIds);

        if (completionError) throw completionError;
        completions = studentCompletions || [];
      }

      // Combine the data with session-level completion status
      return assignments.map(assignment => {
        const courseModules = (moduleAssignments || [])
          .filter(ma => ma.class_assignment_id === assignment.id)
          .map(ma => {
            const moduleSessions = sessionAssignments
              .filter(sa => sa.class_module_assignment_id === ma.id)
              .map(sa => {
                const sessionContentItems = contentItems
                  .filter(c => c.session_id === sa.session_id)
                  .map(c => ({
                    ...c,
                    isCompleted: completions.some(comp => comp.content_id === c.id),
                  }));

                // Session is completed if ALL content in it is completed
                const isSessionCompleted = sessionContentItems.length > 0 
                  && sessionContentItems.every(c => c.isCompleted);

                return {
                  ...sa,
                  session: sa.course_sessions,
                  content: sessionContentItems,
                  isSessionCompleted,
                };
              });

            // Module is completed if ALL sessions in it are completed
            const isModuleCompleted = moduleSessions.length > 0 
              && moduleSessions.filter(s => s.is_unlocked).every(s => s.isSessionCompleted);

            return {
              ...ma,
              module: ma.course_modules,
              sessions: moduleSessions,
              isModuleCompleted,
            };
          });

        // Calculate course progress
        const totalSessions = courseModules.flatMap(m => m.sessions).length;
        const completedSessions = courseModules.flatMap(m => m.sessions).filter(s => s.isSessionCompleted).length;
        const progressPercentage = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

        return {
          ...assignment,
          course: assignment.courses,
          modules: courseModules,
          completedSessions,
          totalSessions,
          progressPercentage,
        };
      });
    },
    enabled: !!classId,
  });
}

// Mark content as completed with certificate check
export function useMarkContentComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      studentId,
      contentId,
      classAssignmentId,
      watchPercentage = 100,
      // Optional params for certificate check
      moduleId,
      moduleName,
      courseId,
      courseTitle,
      institutionId,
      checkModuleCompletion,
    }: {
      studentId: string;
      contentId: string;
      classAssignmentId: string;
      watchPercentage?: number;
      moduleId?: string;
      moduleName?: string;
      courseId?: string;
      courseTitle?: string;
      institutionId?: string;
      checkModuleCompletion?: () => Promise<{ isModuleCompleted: boolean; allModulesCompleted: boolean }>;
    }) => {
      const { error } = await supabase
        .from('student_content_completions')
        .upsert({
          student_id: studentId,
          content_id: contentId,
          class_assignment_id: classAssignmentId,
          watch_percentage: watchPercentage,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      // Return the extra params for use in onSuccess
      return { moduleId, moduleName, courseId, courseTitle, institutionId, studentId, checkModuleCompletion };
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-courses'] });
      toast.success('Progress saved');
      
      // Check for certificate issuance if params provided
      if (data?.checkModuleCompletion && data?.moduleId && data?.institutionId) {
        try {
          // Import dynamically to avoid circular deps
          const { gamificationDbService } = await import('@/services/gamification-db.service');
          
          // Wait for query invalidation to settle, then check completion status
          setTimeout(async () => {
            try {
              const completionStatus = await data.checkModuleCompletion!();
              
              // Check for level/module certificate
              if (completionStatus.isModuleCompleted && data.moduleId && data.moduleName && data.courseTitle) {
                const result = await gamificationDbService.checkAndIssueLevelCertificate({
                  studentId: data.studentId,
                  institutionId: data.institutionId!,
                  moduleId: data.moduleId,
                  moduleName: data.moduleName,
                  courseTitle: data.courseTitle,
                  isModuleCompleted: true,
                });
                
                if (result.issued) {
                  toast.success(`🎉 Certificate earned for completing ${data.moduleName}!`);
                }
              }
              
              // Check for course completion certificate
              if (completionStatus.allModulesCompleted && data.courseId && data.courseTitle) {
                const courseResult = await gamificationDbService.checkAndIssueCourseCompletionCertificate({
                  studentId: data.studentId,
                  institutionId: data.institutionId!,
                  courseId: data.courseId,
                  courseTitle: data.courseTitle,
                  allModulesCompleted: true,
                });
                
                if (courseResult.issued) {
                  toast.success(`🏆 Course certificate earned for completing ${data.courseTitle}!`);
                }
              }
            } catch (certError) {
              console.error('Certificate check failed:', certError);
            }
          }, 500);
        } catch (importError) {
          console.error('Failed to import gamification service:', importError);
        }
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to save progress: ${error.message}`);
    },
  });
}

// Fetch institution course assignments (for management view - all courses assigned to institution)
export function useInstitutionCourseAssignments(institutionId?: string) {
  return useQuery({
    queryKey: ['institution-course-assignments', institutionId],
    queryFn: async () => {
      if (!institutionId) return [];

      // Get all course class assignments for this institution
      const { data: assignments, error: assignmentError } = await supabase
        .from('course_class_assignments')
        .select(`
          id,
          class_id,
          course_id,
          institution_id,
          assigned_at,
          assigned_by,
          courses (
            id,
            title,
            course_code,
            description,
            category,
            difficulty,
            status,
            thumbnail_url,
            duration_weeks,
            learning_outcomes
          ),
          classes (
            id,
            class_name,
            section
          )
        `)
        .eq('institution_id', institutionId);

      if (assignmentError) throw assignmentError;
      if (!assignments || assignments.length === 0) return [];

      // Get module assignments for all course assignments
      const assignmentIds = assignments.map(a => a.id);
      const { data: moduleAssignments, error: moduleError } = await supabase
        .from('class_module_assignments')
        .select(`
          id,
          class_assignment_id,
          module_id,
          is_unlocked,
          unlock_order,
          unlock_mode,
          course_modules (
            id,
            title,
            description,
            display_order
          )
        `)
        .in('class_assignment_id', assignmentIds)
        .order('unlock_order', { ascending: true });

      if (moduleError) throw moduleError;

      // Get session assignments
      const moduleAssignmentIds = moduleAssignments?.map(m => m.id) || [];
      let sessionAssignments: any[] = [];
      
      if (moduleAssignmentIds.length > 0) {
        const { data: sessions, error: sessionError } = await supabase
          .from('class_session_assignments')
          .select(`
            id,
            class_module_assignment_id,
            session_id,
            is_unlocked,
            unlock_order,
            unlock_mode,
            course_sessions (
              id,
              title,
              description,
              display_order
            )
          `)
          .in('class_module_assignment_id', moduleAssignmentIds)
          .order('unlock_order', { ascending: true });

        if (sessionError) throw sessionError;
        sessionAssignments = sessions || [];
      }

      // Get content for all sessions
      const sessionIds = sessionAssignments.map(s => s.session_id);
      let contentItems: any[] = [];

      if (sessionIds.length > 0) {
        const { data: content, error: contentError } = await supabase
          .from('course_content')
          .select('*')
          .in('session_id', sessionIds)
          .order('display_order', { ascending: true });

        if (contentError) throw contentError;
        contentItems = content || [];
      }

      // Group by course to get unique courses with their class assignments
      const courseMap = new Map<string, any>();
      
      assignments.forEach(assignment => {
        const courseId = assignment.course_id;
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            ...assignment.courses,
            classes: [],
            assignments: [],
            modules: [], // Add modules at course level for easier access
          });
        }
        
        const course = courseMap.get(courseId);
        course.classes.push({
          ...assignment.classes,
          assignment_id: assignment.id,
          assigned_at: assignment.assigned_at,
        });
        
        // Build module structure with sessions and content
        const assignmentModules = (moduleAssignments || [])
          .filter(ma => ma.class_assignment_id === assignment.id)
          .map(ma => ({
            ...ma,
            module: ma.course_modules,
            sessions: sessionAssignments
              .filter(sa => sa.class_module_assignment_id === ma.id)
              .map(sa => ({
                ...sa,
                session: sa.course_sessions,
                content: contentItems.filter(c => c.session_id === sa.session_id),
              })),
          }));

        // Merge modules at course level (take first assignment's modules as representative)
        if (course.modules.length === 0) {
          course.modules = assignmentModules;
        }
        
        course.assignments.push({
          id: assignment.id,
          class_id: assignment.class_id,
          class: assignment.classes,
          module_assignments: assignmentModules,
        });
      });

      return Array.from(courseMap.values());
    },
    enabled: !!institutionId,
  });
}

// Fetch all active courses (for management view - all CEO active/published courses)
export function useAllPublishedCourses() {
  return useQuery({
    queryKey: ['all-active-courses'],
    queryFn: async () => {
      // Get all active/published courses (management sees both active and published)
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          course_code,
          description,
          category,
          difficulty,
          status,
          thumbnail_url,
          duration_weeks,
          learning_outcomes,
          created_at
        `)
        .in('status', ['active', 'published'])
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      if (!courses || courses.length === 0) return [];

      // Get course IDs
      const courseIds = courses.map(c => c.id);

      // Get modules for all courses
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          id,
          course_id,
          title,
          description,
          display_order
        `)
        .in('course_id', courseIds)
        .order('display_order', { ascending: true });

      if (modulesError) throw modulesError;

      // Get sessions for all modules
      const moduleIds = modules?.map(m => m.id) || [];
      let sessions: any[] = [];
      
      if (moduleIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from('course_sessions')
          .select(`
            id,
            module_id,
            title,
            description,
            display_order
          `)
          .in('module_id', moduleIds)
          .order('display_order', { ascending: true });

        if (sessionsError) throw sessionsError;
        sessions = sessionsData || [];
      }

      // Get content for all sessions
      const sessionIds = sessions.map(s => s.id);
      let content: any[] = [];
      
      if (sessionIds.length > 0) {
        const { data: contentData, error: contentError } = await supabase
          .from('course_content')
          .select('*')
          .in('session_id', sessionIds)
          .order('display_order', { ascending: true });

        if (contentError) throw contentError;
        content = contentData || [];
      }

      // Combine the data
      return courses.map(course => ({
        ...course,
        modules: (modules || [])
          .filter(m => m.course_id === course.id)
          .map(m => ({
            id: m.id,
            module: {
              id: m.id,
              title: m.title,
              description: m.description,
            },
            is_unlocked: true, // Always unlocked for management view
            sessions: sessions
              .filter(s => s.module_id === m.id)
              .map(s => ({
                id: s.id,
                session: {
                  id: s.id,
                  title: s.title,
                  description: s.description,
                },
                is_unlocked: true, // Always unlocked for management view
                content: content.filter(c => c.session_id === s.id),
              })),
          })),
      }));
    },
  });
}
