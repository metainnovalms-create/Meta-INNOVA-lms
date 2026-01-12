import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ModuleData {
  id: string; // This is class_module_assignment.id
  module?: { id: string; title: string; course_id?: string }; // The actual course_modules record
  isModuleCompleted?: boolean;
}

interface UseLevelCompletionCertificateParams {
  studentRecordId: string | undefined;  // students.id
  studentUserId: string | undefined;    // profiles.id (auth user ID)
  modules: ModuleData[] | undefined;
  institutionId: string | undefined;
  courseId: string | undefined;
  courseTitle: string | undefined;
  classAssignmentId: string | undefined;
}

export function useLevelCompletionCertificate(
  studentRecordId: string | undefined,
  modules: ModuleData[] | undefined,
  institutionId: string | undefined,
  courseTitle: string | undefined,
  courseId?: string,
  classAssignmentId?: string
) {
  const { user } = useAuth();
  const studentUserId = user?.id; // This is profiles.id (auth user ID)
  
  // Track processed modules by course_modules.id (not class_module_assignment.id)
  const processedModulesRef = useRef<Set<string>>(new Set());

  const checkAndIssueCertificates = useCallback(async () => {
    if (!studentRecordId || !studentUserId || !modules || !institutionId) {
      console.log('[Certificate Hook] Missing required params:', { 
        studentRecordId: !!studentRecordId, 
        studentUserId: !!studentUserId,
        modules: modules?.length, 
        institutionId: !!institutionId 
      });
      return;
    }

    console.log('[Certificate Hook] Checking', modules.length, 'modules for student:', studentRecordId);

    for (const moduleData of modules) {
      // Get the actual course module ID (not class assignment ID)
      const courseModuleId = moduleData.module?.id;
      const moduleName = moduleData.module?.title || 'Level';
      const moduleCourseId = moduleData.module?.course_id || courseId;

      // Skip if no course module ID
      if (!courseModuleId) {
        console.log('[Certificate Hook] Skipping module without course_module.id:', moduleData.id);
        continue;
      }

      // Skip if module is not completed
      if (!moduleData.isModuleCompleted) {
        console.log('[Certificate Hook] Module not completed:', moduleName);
        continue;
      }
      
      // Skip if we've already processed this module in this session
      if (processedModulesRef.current.has(courseModuleId)) {
        console.log('[Certificate Hook] Already processed this session:', moduleName);
        continue;
      }

      console.log('[Certificate Hook] Checking certificate for completed module:', moduleName, '(', courseModuleId, ')');

      // Check if certificate already exists in database (using studentUserId for certificates)
      const { data: existing, error: checkError } = await supabase
        .from('student_certificates')
        .select('id')
        .eq('student_id', studentUserId)
        .eq('activity_type', 'level')
        .eq('activity_id', courseModuleId)
        .maybeSingle();

      if (checkError) {
        console.error('[Certificate Hook] Error checking existing certificate:', checkError);
        continue;
      }

      if (existing) {
        console.log('[Certificate Hook] Certificate already exists:', existing.id);
        processedModulesRef.current.add(courseModuleId);
        continue;
      }

      // Call edge function to issue certificate (server-side validation and issuance)
      console.log('[Certificate Hook] Calling edge function to issue certificate for:', moduleName);
      
      try {
        const { data, error } = await supabase.functions.invoke('issue-completion-certificates', {
          body: {
            studentRecordId,
            studentUserId,
            classAssignmentId: classAssignmentId || moduleData.id, // Use class_module_assignment.id as fallback
            courseId: moduleCourseId,
            moduleId: courseModuleId,
            institutionId,
            courseName: courseTitle,
            moduleName
          }
        });

        if (error) {
          console.error('[Certificate Hook] Edge function error:', error);
          processedModulesRef.current.add(courseModuleId);
          continue;
        }

        processedModulesRef.current.add(courseModuleId);
        
        if (data?.issued) {
          toast.success(`🎉 Certificate earned for completing ${moduleName}!`);
          console.log('[Certificate Hook] Certificate issued successfully for:', moduleName);
        } else {
          console.log('[Certificate Hook] Certificate not issued:', data?.message);
        }
      } catch (error) {
        console.error('[Certificate Hook] Failed to issue level certificate:', error);
        // Still mark as processed to avoid repeated errors
        processedModulesRef.current.add(courseModuleId);
      }
    }
  }, [studentRecordId, studentUserId, modules, institutionId, courseTitle, courseId, classAssignmentId]);

  useEffect(() => {
    checkAndIssueCertificates();
  }, [checkAndIssueCertificates]);

  // Return a function that can be called manually to re-check
  return { recheckCertificates: checkAndIssueCertificates };
}
