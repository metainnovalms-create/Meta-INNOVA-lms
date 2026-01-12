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
      console.error('[DeleteInstitution] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has system_admin or super_admin role
    const allowedRoles = ['system_admin', 'super_admin'];
    const { data: roles, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', allowedRoles);

    if (roleError || !roles || roles.length === 0) {
      console.error('[DeleteInstitution] Insufficient permissions');
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only System Admin/Super Admin can delete institutions.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { institutionId } = await req.json();

    if (!institutionId) {
      return new Response(
        JSON.stringify({ error: 'institutionId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[DeleteInstitution] Starting cascade delete for institution:', institutionId);

    // Verify institution exists
    const { data: institution, error: instError } = await adminClient
      .from('institutions')
      .select('id, name')
      .eq('id', institutionId)
      .single();

    if (instError || !institution) {
      return new Response(
        JSON.stringify({ error: 'Institution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const deletionLog: string[] = [];

    // Get all classes for this institution
    const { data: classes } = await adminClient
      .from('classes')
      .select('id')
      .eq('institution_id', institutionId);
    const classIds = (classes || []).map(c => c.id);
    console.log('[DeleteInstitution] Found classes:', classIds.length);

    // Get all students for this institution
    const { data: students } = await adminClient
      .from('students')
      .select('id, user_id')
      .eq('institution_id', institutionId);
    const studentIds = (students || []).map(s => s.id);
    const studentUserIds = (students || []).filter(s => s.user_id).map(s => s.user_id);
    console.log('[DeleteInstitution] Found students:', studentIds.length);

    // Get course_class_assignments for this institution
    const { data: courseClassAssignments } = await adminClient
      .from('course_class_assignments')
      .select('id')
      .eq('institution_id', institutionId);
    const courseClassAssignmentIds = (courseClassAssignments || []).map(a => a.id);

    // 1. Delete student_content_completions (via class_assignment_id)
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

    // 5. Delete assessment_answers (need to get attempt_ids first)
    const { data: attempts } = await adminClient
      .from('assessment_attempts')
      .select('id')
      .eq('institution_id', institutionId);
    const attemptIds = (attempts || []).map(a => a.id);

    if (attemptIds.length > 0) {
      const { error } = await adminClient
        .from('assessment_answers')
        .delete()
        .in('attempt_id', attemptIds);
      if (!error) deletionLog.push('assessment_answers');
    }

    // 6. Delete assessment_attempts
    const { error: attemptsError } = await adminClient
      .from('assessment_attempts')
      .delete()
      .eq('institution_id', institutionId);
    if (!attemptsError) deletionLog.push('assessment_attempts');

    // 7. Delete assessment_class_assignments
    const { error: assessClassError } = await adminClient
      .from('assessment_class_assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!assessClassError) deletionLog.push('assessment_class_assignments');

    // 8. Delete assignment_submissions
    const { error: submissionsError } = await adminClient
      .from('assignment_submissions')
      .delete()
      .eq('institution_id', institutionId);
    if (!submissionsError) deletionLog.push('assignment_submissions');

    // 9. Delete assignment_class_assignments
    const { error: assignClassError } = await adminClient
      .from('assignment_class_assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!assignClassError) deletionLog.push('assignment_class_assignments');

    // 10. Delete class_session_attendance
    const { error: attendanceError } = await adminClient
      .from('class_session_attendance')
      .delete()
      .eq('institution_id', institutionId);
    if (!attendanceError) deletionLog.push('class_session_attendance');

    // 11. Delete officer_class_access_grants
    if (classIds.length > 0) {
      const { error } = await adminClient
        .from('officer_class_access_grants')
        .delete()
        .in('class_id', classIds);
      if (!error) deletionLog.push('officer_class_access_grants');
    }

    // 12. Delete institution_timetable_assignments
    const { error: timetableError } = await adminClient
      .from('institution_timetable_assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!timetableError) deletionLog.push('institution_timetable_assignments');

    // 13. Delete course_class_assignments
    const { error: courseClassError } = await adminClient
      .from('course_class_assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!courseClassError) deletionLog.push('course_class_assignments');

    // 14. Delete student XP, badges, certificates, streaks
    if (studentUserIds.length > 0) {
      await adminClient.from('student_badges').delete().in('student_id', studentUserIds);
      await adminClient.from('student_certificates').delete().in('student_id', studentUserIds);
      await adminClient.from('student_xp_transactions').delete().in('student_id', studentUserIds);
      await adminClient.from('student_streaks').delete().in('student_id', studentUserIds);
      deletionLog.push('student_badges', 'student_certificates', 'student_xp_transactions', 'student_streaks');
    }

    // 15. Delete student_feedback
    const { error: feedbackError } = await adminClient
      .from('student_feedback')
      .delete()
      .eq('institution_id', institutionId);
    if (!feedbackError) deletionLog.push('student_feedback');

    // 16. Delete event_interests for students
    if (studentUserIds.length > 0) {
      await adminClient.from('event_interests').delete().in('student_id', studentUserIds);
      deletionLog.push('event_interests');
    }

    // 17. Delete students
    const { error: studentsError } = await adminClient
      .from('students')
      .delete()
      .eq('institution_id', institutionId);
    if (!studentsError) deletionLog.push('students');

    // 18. Delete classes
    const { error: classesError } = await adminClient
      .from('classes')
      .delete()
      .eq('institution_id', institutionId);
    if (!classesError) deletionLog.push('classes');

    // 19. Delete course_institution_assignments (unassign courses)
    const { error: courseInstError } = await adminClient
      .from('course_institution_assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!courseInstError) deletionLog.push('course_institution_assignments');

    // 20. Delete institution_periods
    const { error: periodsError } = await adminClient
      .from('institution_periods')
      .delete()
      .eq('institution_id', institutionId);
    if (!periodsError) deletionLog.push('institution_periods');

    // 21. Delete institution_holidays
    const { error: holidaysError } = await adminClient
      .from('institution_holidays')
      .delete()
      .eq('institution_id', institutionId);
    if (!holidaysError) deletionLog.push('institution_holidays');

    // 22. Delete calendar_day_types
    const { error: calendarError } = await adminClient
      .from('calendar_day_types')
      .delete()
      .eq('institution_id', institutionId);
    if (!calendarError) deletionLog.push('calendar_day_types');

    // 23. Delete communication_log_attachments (need to get log ids first)
    const { data: commLogs } = await adminClient
      .from('communication_logs')
      .select('id')
      .eq('institution_id', institutionId);
    const commLogIds = (commLogs || []).map(l => l.id);

    if (commLogIds.length > 0) {
      await adminClient.from('communication_log_attachments').delete().in('communication_log_id', commLogIds);
      deletionLog.push('communication_log_attachments');
    }

    // 24. Delete communication_logs
    const { error: commLogError } = await adminClient
      .from('communication_logs')
      .delete()
      .eq('institution_id', institutionId);
    if (!commLogError) deletionLog.push('communication_logs');

    // 25. Delete reports
    const { error: reportsError } = await adminClient
      .from('reports')
      .delete()
      .eq('institution_id', institutionId);
    if (!reportsError) deletionLog.push('reports');

    // 26. Delete news_and_feeds
    const { error: newsError } = await adminClient
      .from('news_and_feeds')
      .delete()
      .eq('institution_id', institutionId);
    if (!newsError) deletionLog.push('news_and_feeds');

    // 27. Delete surveys
    const { error: surveysError } = await adminClient
      .from('surveys')
      .delete()
      .eq('institution_id', institutionId);
    if (!surveysError) deletionLog.push('surveys');

    // 28. Delete leaderboard_configs
    const { error: leaderboardError } = await adminClient
      .from('leaderboard_configs')
      .delete()
      .eq('institution_id', institutionId);
    if (!leaderboardError) deletionLog.push('leaderboard_configs');

    // 29. Delete id_counters
    const { error: countersError } = await adminClient
      .from('id_counters')
      .delete()
      .eq('institution_id', institutionId);
    if (!countersError) deletionLog.push('id_counters');

    // 29b. Delete assignments (the main assignments table)
    const { error: assignmentsError } = await adminClient
      .from('assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!assignmentsError) deletionLog.push('assignments');

    // 29c. Delete assessments
    const { error: assessmentsError } = await adminClient
      .from('assessments')
      .delete()
      .eq('institution_id', institutionId);
    if (!assessmentsError) deletionLog.push('assessments');

    // 29d. Delete invoices (and invoice_line_items)
    const { data: invoices } = await adminClient
      .from('invoices')
      .select('id')
      .eq('institution_id', institutionId);
    const invoiceIds = (invoices || []).map(i => i.id);

    if (invoiceIds.length > 0) {
      const { error: invoiceItemsError } = await adminClient
        .from('invoice_line_items')
        .delete()
        .in('invoice_id', invoiceIds);
      if (!invoiceItemsError) deletionLog.push('invoice_line_items');
    }

    const { error: invoicesError } = await adminClient
      .from('invoices')
      .delete()
      .eq('institution_id', institutionId);
    if (!invoicesError) deletionLog.push('invoices');

    // 30. Delete officer_attendance for this institution
    const { error: offAttError } = await adminClient
      .from('officer_attendance')
      .delete()
      .eq('institution_id', institutionId);
    if (!offAttError) deletionLog.push('officer_attendance');

    // 31. Delete event_class_assignments
    const { error: eventClassError } = await adminClient
      .from('event_class_assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!eventClassError) deletionLog.push('event_class_assignments');

    // 32. Delete officer_institution_assignments
    const { error: oiaError } = await adminClient
      .from('officer_institution_assignments')
      .delete()
      .eq('institution_id', institutionId);
    if (!oiaError) deletionLog.push('officer_institution_assignments');

    // 33. Update officers - remove institution from assigned_institutions array
    const { data: officers } = await adminClient
      .from('officers')
      .select('id, assigned_institutions')
      .contains('assigned_institutions', [institutionId]);

    for (const officer of (officers || [])) {
      const updatedInstitutions = (officer.assigned_institutions || []).filter(
        (id: string) => id !== institutionId
      );
      await adminClient
        .from('officers')
        .update({ assigned_institutions: updatedInstitutions })
        .eq('id', officer.id);
    }
    if (officers && officers.length > 0) deletionLog.push(`officers_unassigned: ${officers.length}`);

    // 33. Update profiles - set institution_id and class_id to NULL
    const { error: profilesError } = await adminClient
      .from('profiles')
      .update({ institution_id: null, class_id: null })
      .eq('institution_id', institutionId);
    if (!profilesError) deletionLog.push('profiles_updated');

    // 34. Finally delete the institution
    const { error: instDeleteError } = await adminClient
      .from('institutions')
      .delete()
      .eq('id', institutionId);

    if (instDeleteError) {
      console.error('[DeleteInstitution] Failed to delete institution:', instDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete institution: ' + instDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    deletionLog.push('institution');

    console.log('[DeleteInstitution] Cascade delete completed successfully');
    console.log('[DeleteInstitution] Deletion log:', deletionLog);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Institution "${institution.name}" and all related data deleted successfully`,
        deletedItems: deletionLog,
        studentsDeleted: studentIds.length,
        classesDeleted: classIds.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DeleteInstitution] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
