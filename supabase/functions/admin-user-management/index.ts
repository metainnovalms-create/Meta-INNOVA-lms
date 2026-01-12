import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserPayload {
  action: 'create_user';
  email: string;
  password: string;
  name: string;
  position_id: string;
  position_name: string;
  is_ceo: boolean;
  join_date?: string | null;
}

interface DeleteUserPayload {
  action: 'delete_user';
  user_id: string;
}

interface ResetPasswordPayload {
  action: 'reset_password';
  user_id: string;
  new_password: string;
}

interface UpdateUserPayload {
  action: 'update_user';
  user_id: string;
  updates: {
    name?: string;
    position_id?: string;
    position_name?: string;
    is_ceo?: boolean;
  };
}

type ActionPayload = CreateUserPayload | DeleteUserPayload | ResetPasswordPayload | UpdateUserPayload;

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated and has proper permissions
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth token to verify permissions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Client with user auth to check permissions
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get calling user
    const { data: { user: caller }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !caller) {
      console.error('[admin-user-management] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if caller is super_admin or CEO (system_admin with is_ceo)
    const { data: roles } = await supabaseAuth.from('user_roles').select('role').eq('user_id', caller.id);
    const { data: profile } = await supabaseAuth.from('profiles').select('is_ceo').eq('id', caller.id).single();
    
    const isSuperAdmin = roles?.some(r => r.role === 'super_admin');
    const isCeo = roles?.some(r => r.role === 'system_admin') && profile?.is_ceo;

    if (!isSuperAdmin && !isCeo) {
      console.error('[admin-user-management] Permission denied for user:', caller.id);
      return new Response(
        JSON.stringify({ error: 'Permission denied. Only CEO or Super Admin can manage users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const payload: ActionPayload = await req.json();
    console.log('[admin-user-management] Action:', payload.action);

    switch (payload.action) {
      case 'create_user': {
        const { email, password, name, position_id, position_name, is_ceo, join_date } = payload;
        
        // Create user in Supabase Auth
        const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: { name }
        });

        if (createError) {
          console.error('[admin-user-management] Create user error:', createError);
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const userId = authData.user.id;

        // Update profile with position info and join_date
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            name,
            position_id,
            position_name,
            is_ceo,
            join_date: join_date || new Date().toISOString().split('T')[0],
            must_change_password: true,
            password_changed: false
          })
          .eq('id', userId);

        if (profileError) {
          console.error('[admin-user-management] Update profile error:', profileError);
          // Clean up: delete the created user if profile update fails
          await supabaseAdmin.auth.admin.deleteUser(userId);
          return new Response(
            JSON.stringify({ error: 'Failed to update user profile' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Assign system_admin role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: userId, role: 'system_admin' });

        if (roleError) {
          console.error('[admin-user-management] Assign role error:', roleError);
        }

        console.log('[admin-user-management] User created successfully:', userId);
        return new Response(
          JSON.stringify({ 
            success: true, 
            user: { 
              id: userId, 
              email, 
              name,
              position_id,
              position_name,
              is_ceo
            } 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete_user': {
        const { user_id } = payload;

        // Prevent deleting yourself
        if (user_id === caller.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete yourself' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if target is CEO (prevent deleting CEO)
        const { data: targetProfile } = await supabaseAdmin
          .from('profiles')
          .select('is_ceo')
          .eq('id', user_id)
          .single();

        if (targetProfile?.is_ceo) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete CEO user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Delete user from Supabase Auth (cascades to profiles and user_roles)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

        if (deleteError) {
          console.error('[admin-user-management] Delete user error:', deleteError);
          return new Response(
            JSON.stringify({ error: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[admin-user-management] User deleted successfully:', user_id);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reset_password': {
        const { user_id, new_password } = payload;

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
          password: new_password
        });

        if (resetError) {
          console.error('[admin-user-management] Reset password error:', resetError);
          return new Response(
            JSON.stringify({ error: resetError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update profile to indicate password must be changed
        await supabaseAdmin
          .from('profiles')
          .update({ 
            must_change_password: true,
            password_changed: false 
          })
          .eq('id', user_id);

        console.log('[admin-user-management] Password reset successfully for:', user_id);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_user': {
        const { user_id, updates } = payload;

        const { error: updateError } = await supabaseAdmin
          .from('profiles')
          .update(updates)
          .eq('id', user_id);

        if (updateError) {
          console.error('[admin-user-management] Update user error:', updateError);
          return new Response(
            JSON.stringify({ error: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('[admin-user-management] User updated successfully:', user_id);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[admin-user-management] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
