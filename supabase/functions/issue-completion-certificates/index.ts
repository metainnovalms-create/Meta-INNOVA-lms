import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      studentRecordId,  // students.id
      studentUserId,    // profiles.id (auth user id) - REQUIRED for certificates
      classAssignmentId,
      courseId,
      moduleId,         // course_modules.id
      sessionId,        // optional - the session that was just completed
      institutionId,
      courseName,
      moduleName
    } = await req.json();

    console.log('=== Issue Certificate Request ===');
    console.log('studentRecordId:', studentRecordId);
    console.log('studentUserId:', studentUserId);
    console.log('moduleId:', moduleId);
    console.log('courseId:', courseId);
    console.log('sessionId:', sessionId);

    if (!studentRecordId || !studentUserId || !classAssignmentId || !courseId || !moduleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get institution ID if not provided
    let finalInstitutionId = institutionId;
    if (!finalInstitutionId) {
      const { data: studentData } = await supabase
        .from('students')
        .select('institution_id')
        .eq('id', studentRecordId)
        .single();
      finalInstitutionId = studentData?.institution_id;
    }

    if (!finalInstitutionId) {
      return new Response(
        JSON.stringify({ error: 'Could not determine institution ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Validate module completion by checking all content is completed
    // Get all sessions for this module
    const { data: sessions, error: sessionsError } = await supabase
      .from('course_sessions')
      .select('id')
      .eq('module_id', moduleId);

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch sessions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sessions || sessions.length === 0) {
      console.log('No sessions found for module:', moduleId);
      return new Response(
        JSON.stringify({ issued: false, message: 'No sessions found for this module' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sessionIds = sessions.map(s => s.id);

    // Get all content for these sessions
    const { data: allContent, error: contentError } = await supabase
      .from('course_content')
      .select('id')
      .in('session_id', sessionIds);

    if (contentError) {
      console.error('Error fetching content:', contentError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch content' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!allContent || allContent.length === 0) {
      console.log('No content found for module sessions');
      return new Response(
        JSON.stringify({ issued: false, message: 'No content found for this module' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentIds = allContent.map(c => c.id);

    // Get completed content for this student
    const { data: completions, error: completionsError } = await supabase
      .from('student_content_completions')
      .select('content_id')
      .eq('student_id', studentRecordId)
      .eq('class_assignment_id', classAssignmentId)
      .in('content_id', contentIds);

    if (completionsError) {
      console.error('Error fetching completions:', completionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch completions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const completedContentIds = new Set(completions?.map(c => c.content_id) || []);
    const isModuleCompleted = contentIds.every(id => completedContentIds.has(id));

    console.log('Total content items:', contentIds.length);
    console.log('Completed content items:', completedContentIds.size);
    console.log('Is module completed:', isModuleCompleted);

    if (!isModuleCompleted) {
      return new Response(
        JSON.stringify({ 
          issued: false, 
          message: 'Module not yet completed',
          completedCount: completedContentIds.size,
          totalCount: contentIds.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Check if certificate already exists (USING studentUserId for certificates)
    const { data: existingCert } = await supabase
      .from('student_certificates')
      .select('id')
      .eq('student_id', studentUserId)
      .eq('activity_type', 'level')
      .eq('activity_id', moduleId)
      .maybeSingle();

    if (existingCert) {
      console.log('Certificate already exists for this module');
      return new Response(
        JSON.stringify({ issued: false, message: 'Certificate already issued for this level' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Get active level/module certificate template
    const { data: template } = await supabase
      .from('certificate_templates')
      .select('id, name')
      .or('category.eq.module,category.eq.level')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!template) {
      console.warn('No active level/module certificate template found');
      return new Response(
        JSON.stringify({ issued: false, message: 'No certificate template available. Please create a level certificate template first.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Get module and course names if not provided
    let finalModuleName = moduleName;
    let finalCourseName = courseName;

    if (!finalModuleName || !finalCourseName) {
      const { data: moduleData } = await supabase
        .from('course_modules')
        .select('title, courses(title)')
        .eq('id', moduleId)
        .single();

      if (moduleData) {
        finalModuleName = finalModuleName || moduleData.title;
        finalCourseName = finalCourseName || (moduleData.courses as any)?.title;
      }
    }

    // 5. Generate verification code
    const verificationCode = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // 6. Issue certificate (USING studentUserId!)
    const { error: certError } = await supabase
      .from('student_certificates')
      .insert({
        student_id: studentUserId,  // This is the profile/auth user ID
        template_id: template.id,
        activity_type: 'level',
        activity_id: moduleId,
        activity_name: `${finalModuleName || 'Level'} - ${finalCourseName || 'Course'}`,
        institution_id: finalInstitutionId,
        verification_code: verificationCode
      });

    if (certError) {
      console.error('Failed to insert certificate:', certError);
      return new Response(
        JSON.stringify({ error: 'Failed to issue certificate', details: certError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Certificate issued successfully!');

    // 7. Award XP for level completion (USING studentUserId!)
    const { error: xpError } = await supabase
      .from('student_xp_transactions')
      .insert({
        student_id: studentUserId,  // This is the profile/auth user ID
        institution_id: finalInstitutionId,
        activity_type: 'level_completion',
        activity_id: moduleId,
        points_earned: 100,
        description: `Level completed: ${finalModuleName || 'Level'}`
      });

    if (xpError) {
      console.error('Failed to award XP (non-critical):', xpError);
    }

    // 8. Check if all modules in the course are now completed
    await checkAndIssueCourseCompletionCertificate(
      supabase,
      studentRecordId,
      studentUserId,
      classAssignmentId,
      courseId,
      finalCourseName,
      finalInstitutionId
    );

    return new Response(
      JSON.stringify({ 
        issued: true, 
        message: `Certificate issued for ${finalModuleName}`,
        moduleName: finalModuleName,
        courseName: finalCourseName,
        verificationCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in issue-completion-certificates:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function checkAndIssueCourseCompletionCertificate(
  supabase: any,
  studentRecordId: string,
  studentUserId: string,
  classAssignmentId: string,
  courseId: string,
  courseName: string | undefined,
  institutionId: string
) {
  try {
    // Get all modules for this course
    const { data: modules } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId);

    if (!modules || modules.length === 0) return;

    // Check if all modules have certificates issued
    const moduleIds = modules.map((m: any) => m.id);
    
    const { data: moduleCerts } = await supabase
      .from('student_certificates')
      .select('activity_id')
      .eq('student_id', studentUserId)
      .eq('activity_type', 'level')
      .in('activity_id', moduleIds);

    const issuedModuleIds = new Set(moduleCerts?.map((c: any) => c.activity_id) || []);
    const allModulesCompleted = moduleIds.every((id: string) => issuedModuleIds.has(id));

    if (!allModulesCompleted) {
      console.log(`Course not fully completed: ${issuedModuleIds.size}/${moduleIds.length} modules`);
      return;
    }

    // Check if course certificate already exists
    const { data: existingCert } = await supabase
      .from('student_certificates')
      .select('id')
      .eq('student_id', studentUserId)
      .eq('activity_type', 'course')
      .eq('activity_id', courseId)
      .maybeSingle();

    if (existingCert) {
      console.log('Course certificate already exists');
      return;
    }

    // Get course certificate template
    const { data: template } = await supabase
      .from('certificate_templates')
      .select('id')
      .eq('category', 'course')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (!template) {
      console.log('No active course certificate template found');
      return;
    }

    // Get course name if not provided
    let finalCourseName = courseName;
    if (!finalCourseName) {
      const { data: courseData } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();
      finalCourseName = courseData?.title;
    }

    // Generate verification code
    const verificationCode = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Issue course certificate
    await supabase
      .from('student_certificates')
      .insert({
        student_id: studentUserId,
        template_id: template.id,
        activity_type: 'course',
        activity_id: courseId,
        activity_name: finalCourseName || 'Course',
        institution_id: institutionId,
        verification_code: verificationCode
      });

    // Award course completion XP
    await supabase
      .from('student_xp_transactions')
      .insert({
        student_id: studentUserId,
        institution_id: institutionId,
        activity_type: 'course_completion',
        activity_id: courseId,
        points_earned: 500,
        description: `Course completed: ${finalCourseName || 'Course'}`
      });

    console.log('Course completion certificate issued!');
  } catch (error) {
    console.error('Error checking/issuing course certificate:', error);
  }
}
