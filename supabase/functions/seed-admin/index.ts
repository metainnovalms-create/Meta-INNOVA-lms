import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting seed-admin function...');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const adminEmail = 'ceo@metasagealliance.com';
    const adminPassword = 'ChangeMe@2025!';

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const existingUser = existingUsers?.users?.find(u => u.email === adminEmail);

    if (existingUser) {
      console.log('Admin user already exists, updating role and profile...');
      
      // Ensure role exists
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: existingUser.id,
          role: 'system_admin'
        }, { onConflict: 'user_id,role' });

      if (roleError) {
        console.error('Error upserting role:', roleError);
      }

      // Update profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          name: 'CEO - MetaSage Alliance',
          position_name: 'Chief Executive Officer',
          is_ceo: true,
          must_change_password: true
        })
        .eq('id', existingUser.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user already exists, role and profile updated',
          user_id: existingUser.id 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create new admin user
    console.log('Creating new admin user...');
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { 
        name: 'CEO - MetaSage Alliance',
        role: 'system_admin'
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: 'Failed to create admin user', details: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin user created:', newUser.user.id);

    // Add system_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'system_admin'
      });

    if (roleError) {
      console.error('Error inserting role:', roleError);
      return new Response(
        JSON.stringify({ error: 'User created but failed to assign role', details: roleError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Role assigned successfully');

    // Update profile with additional details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: 'CEO - MetaSage Alliance',
        position_name: 'Chief Executive Officer',
        is_ceo: true,
        must_change_password: true
      })
      .eq('id', newUser.user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    } else {
      console.log('Profile updated successfully');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        user_id: newUser.user.id,
        email: adminEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in seed-admin:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
