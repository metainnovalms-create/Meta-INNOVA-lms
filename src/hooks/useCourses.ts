import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types matching database schema
export interface DbCourse {
  id: string;
  course_code: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail_url: string | null;
  difficulty: string;
  duration_weeks: number | null;
  prerequisites: string | null;
  learning_outcomes: string[];
  sdg_goals: string[];
  certificate_template_id: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCourseModule {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  display_order: number;
  certificate_template_id: string | null;
  created_at: string;
}

export interface DbCourseSession {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  description: string | null;
  display_order: number;
  duration_minutes: number | null;
  learning_objectives: string[];
  created_at: string;
}

export interface DbCourseContent {
  id: string;
  course_id: string;
  module_id: string;
  session_id: string;
  title: string;
  type: string; // 'pdf' | 'ppt' | 'youtube'
  file_path: string | null;
  youtube_url: string | null;
  duration_minutes: number | null;
  file_size_mb: number | null;
  display_order: number;
  views_count: number;
  created_at: string;
}

// Full course with nested structure
export interface CourseWithStructure extends DbCourse {
  modules: (DbCourseModule & {
    sessions: (DbCourseSession & {
      content: DbCourseContent[];
    })[];
  })[];
}

// ========== COURSES HOOKS ==========

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DbCourse[];
    }
  });
}

export function useCourseById(courseId: string | null) {
  return useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      // Fetch course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch modules
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order');

      if (modulesError) throw modulesError;

      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('course_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order');

      if (sessionsError) throw sessionsError;

      // Fetch content
      const { data: content, error: contentError } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order');

      if (contentError) throw contentError;

      // Build nested structure
      const modulesWithSessions = (modules || []).map(module => ({
        ...module,
        sessions: (sessions || [])
          .filter(s => s.module_id === module.id)
          .map(session => ({
            ...session,
            learning_objectives: (session.learning_objectives as string[]) || [],
            content: (content || []).filter(c => c.session_id === session.id)
          }))
      }));

      return {
        ...course,
        learning_outcomes: (course.learning_outcomes as string[]) || [],
        sdg_goals: (course.sdg_goals as string[]) || [],
        modules: modulesWithSessions
      } as CourseWithStructure;
    },
    enabled: !!courseId
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseData: Partial<DbCourse>) => {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          course_code: courseData.course_code!,
          title: courseData.title!,
          description: courseData.description,
          category: courseData.category || 'general',
          thumbnail_url: courseData.thumbnail_url,
          difficulty: courseData.difficulty || 'beginner',
          duration_weeks: courseData.duration_weeks || 4,
          prerequisites: courseData.prerequisites,
          learning_outcomes: courseData.learning_outcomes || [],
          sdg_goals: courseData.sdg_goals || [],
          certificate_template_id: courseData.certificate_template_id,
          status: courseData.status || 'draft',
          created_by: courseData.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create course: ${error.message}`);
    }
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, updates }: { courseId: string; updates: Partial<DbCourse> }) => {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Course updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update course: ${error.message}`);
    }
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete course: ${error.message}`);
    }
  });
}

// ========== MODULE HOOKS ==========

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, moduleData }: { courseId: string; moduleData: Partial<DbCourseModule> }) => {
      // Get max order
      const { data: existingModules } = await supabase
        .from('course_modules')
        .select('display_order')
        .eq('course_id', courseId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingModules?.[0]?.display_order !== undefined ? existingModules[0].display_order + 1 : 0;

      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title: moduleData.title!,
          description: moduleData.description,
          display_order: nextOrder,
          certificate_template_id: (moduleData as any).certificate_template_id || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Level added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add level: ${error.message}`);
    }
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, courseId, updates }: { moduleId: string; courseId: string; updates: Partial<DbCourseModule> }) => {
      const { data, error } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', moduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Module updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update module: ${error.message}`);
    }
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, courseId }: { moduleId: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Module deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete module: ${error.message}`);
    }
  });
}

// ========== SESSION HOOKS ==========

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, moduleId, sessionData }: { courseId: string; moduleId: string; sessionData: Partial<DbCourseSession> }) => {
      // Get max order
      const { data: existingSessions } = await supabase
        .from('course_sessions')
        .select('display_order')
        .eq('module_id', moduleId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingSessions?.[0]?.display_order ? existingSessions[0].display_order + 1 : 0;

      const { data, error } = await supabase
        .from('course_sessions')
        .insert({
          course_id: courseId,
          module_id: moduleId,
          title: sessionData.title!,
          description: sessionData.description,
          display_order: nextOrder,
          duration_minutes: sessionData.duration_minutes,
          learning_objectives: sessionData.learning_objectives || []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Session added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add session: ${error.message}`);
    }
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, courseId, updates }: { sessionId: string; courseId: string; updates: Partial<DbCourseSession> }) => {
      const { data, error } = await supabase
        .from('course_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Session updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update session: ${error.message}`);
    }
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, courseId }: { sessionId: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Session deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete session: ${error.message}`);
    }
  });
}

// ========== CONTENT HOOKS ==========

export function useCreateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      courseId, 
      moduleId, 
      sessionId, 
      contentData 
    }: { 
      courseId: string; 
      moduleId: string; 
      sessionId: string; 
      contentData: Partial<DbCourseContent> 
    }) => {
      // Get max order
      const { data: existingContent } = await supabase
        .from('course_content')
        .select('display_order')
        .eq('session_id', sessionId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingContent?.[0]?.display_order ? existingContent[0].display_order + 1 : 0;

      const { data, error } = await supabase
        .from('course_content')
        .insert({
          course_id: courseId,
          module_id: moduleId,
          session_id: sessionId,
          title: contentData.title!,
          type: contentData.type!,
          file_path: contentData.file_path,
          youtube_url: contentData.youtube_url,
          duration_minutes: contentData.duration_minutes,
          file_size_mb: contentData.file_size_mb,
          display_order: nextOrder
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Content added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to add content: ${error.message}`);
    }
  });
}

export function useUpdateContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, courseId, updates }: { contentId: string; courseId: string; updates: Partial<DbCourseContent> }) => {
      const { data, error } = await supabase
        .from('course_content')
        .update(updates)
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Content updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update content: ${error.message}`);
    }
  });
}

export function useDeleteContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contentId, courseId, filePath }: { contentId: string; courseId: string; filePath?: string | null }) => {
      // Delete file from storage if exists
      if (filePath) {
        await supabase.storage.from('course-content').remove([filePath]);
      }

      const { error } = await supabase
        .from('course_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Content deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete content: ${error.message}`);
    }
  });
}

// ========== COURSE ASSIGNMENTS HOOKS ==========

export function useCourseInstitutionAssignments(courseId?: string) {
  return useQuery({
    queryKey: ['course-institution-assignments', courseId],
    queryFn: async () => {
      let query = supabase
        .from('course_institution_assignments')
        .select('*, institutions(id, name, slug)');
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}

export function useAssignCourseToInstitution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, institutionId, assignedBy }: { courseId: string; institutionId: string; assignedBy?: string }) => {
      const { data, error } = await supabase
        .from('course_institution_assignments')
        .insert({
          course_id: courseId,
          institution_id: institutionId,
          assigned_by: assignedBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['course-institution-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['course', variables.courseId] });
      toast.success('Course assigned to institution');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Course is already assigned to this institution');
      } else {
        toast.error(`Failed to assign course: ${error.message}`);
      }
    }
  });
}

export function useUnassignCourseFromInstitution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, institutionId }: { courseId: string; institutionId: string }) => {
      const { error } = await supabase
        .from('course_institution_assignments')
        .delete()
        .eq('course_id', courseId)
        .eq('institution_id', institutionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-institution-assignments'] });
      toast.success('Course unassigned from institution');
    },
    onError: (error: any) => {
      toast.error(`Failed to unassign course: ${error.message}`);
    }
  });
}

// ========== CLASS ASSIGNMENTS HOOKS ==========

export function useCourseClassAssignments(institutionId?: string) {
  return useQuery({
    queryKey: ['course-class-assignments', institutionId],
    queryFn: async () => {
      let query = supabase
        .from('course_class_assignments')
        .select('*, courses(*), classes(*)');
      
      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!institutionId
  });
}

export function useAssignCourseToClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, classId, institutionId, assignedBy }: { courseId: string; classId: string; institutionId: string; assignedBy?: string }) => {
      const { data, error } = await supabase
        .from('course_class_assignments')
        .insert({
          course_id: courseId,
          class_id: classId,
          institution_id: institutionId,
          assigned_by: assignedBy
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-class-assignments'] });
      toast.success('Course assigned to class');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Course is already assigned to this class');
      } else {
        toast.error(`Failed to assign course: ${error.message}`);
      }
    }
  });
}

export function useUnassignCourseFromClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, classId }: { courseId: string; classId: string }) => {
      const { error } = await supabase
        .from('course_class_assignments')
        .delete()
        .eq('course_id', courseId)
        .eq('class_id', classId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-class-assignments'] });
      toast.success('Course unassigned from class');
    },
    onError: (error: any) => {
      toast.error(`Failed to unassign course: ${error.message}`);
    }
  });
}
