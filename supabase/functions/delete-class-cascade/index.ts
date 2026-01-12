import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const { data: { user }, error: authError } = await adminClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('[DeleteClass] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has appropriate role
    const allowedRoles = ['system_admin', 'super_admin', 'management'];
    const { data: roles, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', allowedRoles);

    if (roleError || !roles || roles.length === 0) {
      console.error('[DeleteClass] Insufficient permissions');
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to delete classes.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { classId, institutionId } = await req.json();

    if (!classId || !institutionId) {
      return new Response(
        JSON.stringify({ error: 'classId and institutionId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[DeleteClass] Starting cascade delete for class:', classId);

    // Verify class exists
    const { data: classData, error: classError } = await adminClient
      .from('classes')
      .select('id, class_name, section')
      .eq('id', classId)
      .eq('institution_id', institutionId)
      .single();

    if (classError || !classData) {
      return new Response(
        JSON.stringify({ error: 'Class not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deletionLog: string[] = [];

    // Get students in this class
    const { data: students } = await adminClient
      .from('students')
      .select('id, user_id')
      .eq('class_id', classId);
    const studentIds = (students || []).map(s => s.id);
    const studentUserIds = (students || []).filter(s => s.user_id).map(s => s.user_id);
    console.log('[DeleteClass] Found students:', studentIds.length);

    // Get course_class_assignments for this class
    const { data: courseClassAssignments } = await adminClient
      .from('course_class_assignments')
      .select('id')
      .eq('class_id', classId);
    const courseClassAssignmentIds = (courseClassAssignments || []).map(a => a.id);

    // 1. Delete student_content_completions
    if (courseClassAssignmentIds.length > 0) {
      const { error } = await adminClient
        .from('student_content_completions')
        .delete()
        .in('class_assignment_id', courseClassAssignmentIds);
      if (!error) deletionLog.push('student_content_completions');
    }

    // 2. Get class_module_assignments
    const { data: classModuleAssignments } = await adminClient
      .from('class_module_assignments')
      .select('id')
      .in('class_assignment_id', courseClassAssignmentIds.length > 0 ? courseClassAssignmentIds : ['00000000-0000-0000-0000-000000000000']);
    const classModuleAssignmentIds = (classModuleAssignments || []).map(a => a.id);

    // 3. Delete class_session_assignments
    if (classModuleAssignmentIds.length > 0) {
      const { error } = await adminClient
        .from('class_session_assignments')
        .delete()
        .in('class_module_assignment_id', classModuleAssignmentIds);
      if (!error) deletionLog.push('class_session_assignments');
    }

    // 4. Delete class_module_assignments
    if (courseClassAssignmentIds.length > 0) {
      const { error } = await adminClient
        .from('class_module_assignments')
        .delete()
        .in('class_assignment_id', courseClassAssignmentIds);
      if (!error) deletionLog.push('class_module_assignments');
    }

    // 5. Delete assessment_answers for students in this class
    const { data: attempts } = await adminClient
      .from('assessment_attempts')
      .select('id')
      .eq('class_id', classId);
    const attemptIds = (attempts || []).map(a => a.id);

    if (attemptIds.length > 0) {
      const { error } = await adminClient
        .from('assessment_answers')
        .delete()
        .in('attempt_id', attemptIds);
      if (!error) deletionLog.push('assessment_answers');
    }

    // 6. Delete assessment_attempts for this class
    const { error: attemptsError } = await adminClient
      .from('assessment_attempts')
      .delete()
      .eq('class_id', classId);
    if (!attemptsError) deletionLog.push('assessment_attempts');

    // 7. Delete assessment_class_assignments for this class
    const { error: assessClassError } = await adminClient
      .from('assessment_class_assignments')
      .delete()
      .eq('class_id', classId);
    if (!assessClassError) deletionLog.push('assessment_class_assignments');

    // 8. Delete assignment_submissions for this class
    const { error: submissionsError } = await adminClient
      .from('assignment_submissions')
      .delete()
      .eq('class_id', classId);
    if (!submissionsError) deletionLog.push('assignment_submissions');

    // 9. Delete assignment_class_assignments for this class
    const { error: assignClassError } = await adminClient
      .from('assignment_class_assignments')
      .delete()
      .eq('class_id', classId);
    if (!assignClassError) deletionLog.push('assignment_class_assignments');

    // 10. Delete class_session_attendance for this class
    const { error: attendanceError } = await adminClient
      .from('class_session_attendance')
      .delete()
      .eq('class_id', classId);
    if (!attendanceError) deletionLog.push('class_session_attendance');

    // 11. Delete officer_class_access_grants for this class
    const { error: accessError } = await adminClient
      .from('officer_class_access_grants')
      .delete()
      .eq('class_id', classId);
    if (!accessError) deletionLog.push('officer_class_access_grants');

    // 12. Delete institution_timetable_assignments for this class
    const { error: timetableError } = await adminClient
      .from('institution_timetable_assignments')
      .delete()
      .eq('class_id', classId);
    if (!timetableError) deletionLog.push('institution_timetable_assignments');

    // 13. Delete student XP, badges, certificates, streaks
    if (studentUserIds.length > 0) {
      await adminClient.from('student_badges').delete().in('student_id', studentUserIds);
      await adminClient.from('student_certificates').delete().in('student_id', studentUserIds);
      await adminClient.from('student_xp_transactions').delete().in('student_id', studentUserIds);
      await adminClient.from('student_streaks').delete().in('student_id', studentUserIds);
      deletionLog.push('student_badges', 'student_certificates', 'student_xp_transactions', 'student_streaks');
    }

    // 14. Delete event_interests for students in this class
    if (studentUserIds.length > 0) {
      await adminClient.from('event_interests').delete().in('student_id', studentUserIds);
      deletionLog.push('event_interests');
    }

    // 15. Delete event_class_assignments for this class
    const { error: eventClassError } = await adminClient
      .from('event_class_assignments')
      .delete()
      .eq('class_id', classId);
    if (!eventClassError) deletionLog.push('event_class_assignments');

    // 16. Delete students
    const { error: studentsError } = await adminClient
      .from('students')
      .delete()
      .eq('class_id', classId);
    if (!studentsError) deletionLog.push('students');

    // 17. Delete course_class_assignments (unassign courses from class)
    const { error: courseClassError } = await adminClient
      .from('course_class_assignments')
      .delete()
      .eq('class_id', classId);
    if (!courseClassError) deletionLog.push('course_class_assignments');

    // 18. Update profiles - set class_id to NULL
    const { error: profilesError } = await adminClient
      .from('profiles')
      .update({ class_id: null })
      .eq('class_id', classId);
    if (!profilesError) deletionLog.push('profiles_updated');

    // 19. Finally delete the class
    const { error: classDeleteError } = await adminClient
      .from('classes')
      .delete()
      .eq('id', classId);

    if (classDeleteError) {
      console.error('[DeleteClass] Failed to delete class:', classDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete class: ' + classDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    deletionLog.push('class');

    console.log('[DeleteClass] Cascade delete completed successfully');
    console.log('[DeleteClass] Deletion log:', deletionLog);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Class "${classData.class_name}${classData.section ? ' - ' + classData.section : ''}" and all related data deleted successfully`,
        deletedItems: deletionLog,
        studentsDeleted: studentIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DeleteClass] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
