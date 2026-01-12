import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateStudentUserRequest {
  email: string;
  password: string;
  student_name: string;
  institution_id: string;
  class_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authorization header to verify caller is authorized
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the calling user has appropriate role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      console.error('[CreateStudentUser] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check caller's role - must be management, system_admin, or super_admin
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id);

    if (roleError) {
      console.error('[CreateStudentUser] Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roles = callerRoles?.map(r => r.role) || [];
    const allowedRoles = ['super_admin', 'system_admin', 'management', 'officer'];
    if (!roles.some(role => allowedRoles.includes(role))) {
      console.error('[CreateStudentUser] Insufficient permissions:', roles);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions to create students.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, student_name, institution_id, class_id }: CreateStudentUserRequest = await req.json();

    if (!email || !password || !student_name || !institution_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, student_name, institution_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CreateStudentUser] Creating student user:', email, 'for institution:', institution_id);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let studentUserId: string;

    if (existingUser) {
      console.log('[CreateStudentUser] User already exists:', existingUser.id);
      return new Response(
        JSON.stringify({ 
          error: 'This email is already registered in the system. Please use a different email address.',
          code: 'USER_EXISTS'
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: student_name,
      },
    });

    if (createError) {
      console.error('[CreateStudentUser] User creation error:', createError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    studentUserId = newUser.user.id;
    console.log('[CreateStudentUser] Created new user:', studentUserId);

    // Use upsert with retry to ensure profile is created with correct data
    // This handles timing issues where the trigger may or may not have created the profile yet
    const profileData = {
      id: studentUserId,
      email: email,
      name: student_name,
      institution_id: institution_id,
      class_id: class_id || null,
      must_change_password: true,
    };

    let profileSuccess = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!profileSuccess && retryCount < maxRetries) {
      // Wait before each attempt to allow trigger to potentially create profile
      await new Promise(resolve => setTimeout(resolve, 300 * (retryCount + 1)));
      
      // Try upsert - this will insert if not exists, or update if exists
      const { error: upsertError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (!upsertError) {
        profileSuccess = true;
        console.log('[CreateStudentUser] Profile upserted successfully on attempt:', retryCount + 1);
      } else {
        console.error('[CreateStudentUser] Profile upsert error on attempt', retryCount + 1, ':', upsertError);
        retryCount++;
      }
    }

    // Verify profile was created correctly
    if (profileSuccess) {
      const { data: verifyProfile, error: verifyError } = await supabaseAdmin
        .from('profiles')
        .select('id, institution_id, class_id, name')
        .eq('id', studentUserId)
        .single();

      if (verifyError || !verifyProfile) {
        console.error('[CreateStudentUser] Profile verification failed:', verifyError);
      } else if (!verifyProfile.institution_id) {
        // Profile exists but institution_id is null - force update
        console.log('[CreateStudentUser] Profile exists but institution_id is null, forcing update...');
        const { error: forceUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({
            institution_id: institution_id,
            class_id: class_id || null,
            name: student_name,
            must_change_password: true,
          })
          .eq('id', studentUserId);

        if (forceUpdateError) {
          console.error('[CreateStudentUser] Force update failed:', forceUpdateError);
        } else {
          console.log('[CreateStudentUser] Force update successful');
        }
      } else {
        console.log('[CreateStudentUser] Profile verified with institution_id:', verifyProfile.institution_id);
      }
    } else {
      console.error('[CreateStudentUser] Failed to create/update profile after', maxRetries, 'attempts');
    }

    // Assign student role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: studentUserId, role: 'student' },
        { onConflict: 'user_id,role' }
      );

    if (roleInsertError) {
      console.error('[CreateStudentUser] Role insert error:', roleInsertError);
      return new Response(
        JSON.stringify({ error: `Failed to assign student role: ${roleInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CreateStudentUser] Successfully created student user:', studentUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: studentUserId,
        message: 'Student user created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[CreateStudentUser] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
