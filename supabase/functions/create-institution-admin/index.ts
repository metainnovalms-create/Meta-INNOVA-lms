import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAdminRequest {
  admin_email: string;
  admin_name: string;
  admin_password: string;
  institution_id: string;
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

    // Verify the calling user has super_admin or system_admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !callingUser) {
      console.error('[CreateAdmin] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check caller's role
    const { data: callerRoles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id);

    if (roleError) {
      console.error('[CreateAdmin] Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const roles = callerRoles?.map(r => r.role) || [];
    if (!roles.includes('super_admin') && !roles.includes('system_admin')) {
      console.error('[CreateAdmin] Insufficient permissions:', roles);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only super_admin or system_admin can create institution admins.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { admin_email, admin_name, admin_password, institution_id }: CreateAdminRequest = await req.json();

    if (!admin_email || !admin_password || !institution_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: admin_email, admin_password, institution_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CreateAdmin] Creating admin for institution:', institution_id);

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === admin_email);

    let adminUserId: string;

    if (existingUser) {
      console.log('[CreateAdmin] User already exists:', existingUser.id);
      adminUserId = existingUser.id;

      // Update their profile with institution_id if not set
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          institution_id,
          name: admin_name || existingUser.email?.split('@')[0],
        })
        .eq('id', adminUserId);

      if (profileUpdateError) {
        console.error('[CreateAdmin] Profile update error:', profileUpdateError);
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: admin_email,
        password: admin_password,
        email_confirm: true,
        user_metadata: {
          name: admin_name,
        },
      });

      if (createError) {
        console.error('[CreateAdmin] User creation error:', createError);
        return new Response(
          JSON.stringify({ error: `Failed to create user: ${createError.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      adminUserId = newUser.user.id;
      console.log('[CreateAdmin] Created new user:', adminUserId);

      // Update profile with institution_id (profile should be auto-created by trigger)
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          institution_id,
          name: admin_name,
          must_change_password: true,
        })
        .eq('id', adminUserId);

      if (profileUpdateError) {
        console.error('[CreateAdmin] Profile update error:', profileUpdateError);
        // Try to insert if update failed (profile might not exist yet)
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: adminUserId,
            email: admin_email,
            name: admin_name,
            institution_id,
            must_change_password: true,
          });
        
        if (insertError) {
          console.error('[CreateAdmin] Profile insert error:', insertError);
        }
      }
    }

    // Assign management role (upsert to avoid duplicates)
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: adminUserId, role: 'management' },
        { onConflict: 'user_id,role' }
      );

    if (roleInsertError) {
      console.error('[CreateAdmin] Role insert error:', roleInsertError);
      return new Response(
        JSON.stringify({ error: `Failed to assign role: ${roleInsertError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update institution with admin_user_id
    const { error: institutionUpdateError } = await supabaseAdmin
      .from('institutions')
      .update({ admin_user_id: adminUserId })
      .eq('id', institution_id);

    if (institutionUpdateError) {
      console.error('[CreateAdmin] Institution update error:', institutionUpdateError);
      return new Response(
        JSON.stringify({ error: `Failed to link admin to institution: ${institutionUpdateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[CreateAdmin] Successfully created/updated admin:', adminUserId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        admin_user_id: adminUserId,
        message: existingUser ? 'Existing user assigned as admin' : 'New admin user created'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[CreateAdmin] Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
