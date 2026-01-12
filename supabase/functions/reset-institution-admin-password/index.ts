import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create admin client with service role key for user management
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Create regular client to verify the calling user's auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const regularClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the calling user is authenticated and has proper role
    const { data: { user }, error: authError } = await regularClient.auth.getUser();
    if (authError || !user) {
      console.error('[ResetPassword] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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

    if (roleError) {
      console.error('[ResetPassword] Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!roles || roles.length === 0) {
      console.error('[ResetPassword] Insufficient permissions for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only CEO/System Admin can reset institution passwords.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { institution_id, new_password } = await req.json();

    if (!institution_id || !new_password) {
      return new Response(
        JSON.stringify({ error: 'Missing institution_id or new_password' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (new_password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ResetPassword] Looking up institution:', institution_id);

    // Get the institution and its admin user
    const { data: institution, error: instError } = await adminClient
      .from('institutions')
      .select('id, name, admin_user_id, contact_info')
      .eq('id', institution_id)
      .maybeSingle();

    if (instError || !institution) {
      console.error('[ResetPassword] Institution not found:', instError);
      return new Response(
        JSON.stringify({ error: 'Institution not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let adminUserId = institution.admin_user_id;

    // If no admin_user_id, try to find by admin_email in contact_info
    if (!adminUserId) {
      const contactInfo = institution.contact_info as Record<string, any> || {};
      const adminEmail = contactInfo.admin_email;

      if (adminEmail) {
        console.log('[ResetPassword] Looking up admin by email:', adminEmail);
        
        // Find user by email in profiles
        const { data: profile, error: profileError } = await adminClient
          .from('profiles')
          .select('id')
          .eq('email', adminEmail)
          .eq('institution_id', institution_id)
          .maybeSingle();

        if (profile) {
          adminUserId = profile.id;
          
          // Update institution with admin_user_id for future use
          await adminClient
            .from('institutions')
            .update({ admin_user_id: adminUserId })
            .eq('id', institution_id);
        }
      }
    }

    if (!adminUserId) {
      console.error('[ResetPassword] No admin user found for institution');
      return new Response(
        JSON.stringify({ error: 'No admin user found for this institution. Please create an admin user first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ResetPassword] Resetting password for user:', adminUserId);

    // Reset the password using admin API
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      adminUserId,
      { password: new_password }
    );

    if (updateError) {
      console.error('[ResetPassword] Password update error:', updateError);
      return new Response(
        JSON.stringify({ error: `Failed to reset password: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update profile to indicate password was reset (requires change on next login)
    await adminClient
      .from('profiles')
      .update({ 
        must_change_password: true,
        password_changed: false 
      })
      .eq('id', adminUserId);

    console.log('[ResetPassword] Password reset successful for institution:', institution.name);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Password reset successfully for ${institution.name} admin` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ResetPassword] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});