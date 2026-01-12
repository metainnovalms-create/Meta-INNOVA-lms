import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateOfficerRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  employee_id?: string;
  employment_type: string;
  annual_salary: number;
  hourly_rate?: number;
  overtime_rate_multiplier?: number;
  institution_id?: string;
  join_date?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const requestData: CreateOfficerRequest = await req.json();
    
    console.log(`[CreateOfficerUser] Creating officer user: ${requestData.email}`);

    // Validate required fields
    if (!requestData.email || !requestData.password || !requestData.full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch global leave settings from leave_settings table
    let sickLeave = 10; // default fallback
    let casualLeave = 12; // default fallback
    
    const { data: leaveSettings } = await supabaseAdmin
      .from('leave_settings')
      .select('setting_key, setting_value');
    
    if (leaveSettings) {
      for (const setting of leaveSettings) {
        if (setting.setting_key === 'sick_leave_per_year') {
          sickLeave = Number(setting.setting_value) || 10;
        } else if (setting.setting_key === 'casual_leave_per_year') {
          casualLeave = Number(setting.setting_value) || 12;
        } else if (setting.setting_key === 'leaves_per_year') {
          // If only total leaves is configured, split between sick and casual
          const totalLeaves = Number(setting.setting_value) || 22;
          sickLeave = Math.floor(totalLeaves / 2);
          casualLeave = totalLeaves - sickLeave;
        }
      }
    }
    
    const annualLeave = sickLeave + casualLeave;
    console.log(`[CreateOfficerUser] Using leave settings - Sick: ${sickLeave}, Casual: ${casualLeave}, Annual: ${annualLeave}`);

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: requestData.email,
      password: requestData.password,
      email_confirm: true,
      user_metadata: {
        name: requestData.full_name,
        role: 'officer'
      }
    });

    if (authError) {
      console.error('[CreateOfficerUser] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;
    console.log(`[CreateOfficerUser] Created auth user: ${userId}`);

    // Create user_roles entry for officer
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'officer'
      });

    if (roleError) {
      console.error('[CreateOfficerUser] Role insert error:', roleError);
      // Clean up: delete the auth user if role creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Failed to assign officer role: ' + roleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CreateOfficerUser] Assigned officer role to user: ${userId}`);

    // Update profiles table with institution_id if provided
    if (requestData.institution_id) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ institution_id: requestData.institution_id })
        .eq('id', userId);

      if (profileError) {
        console.log(`[CreateOfficerUser] Profile update warning: ${profileError.message}`);
        // Don't fail the request, just log the warning
      } else {
        console.log(`[CreateOfficerUser] Updated profile with institution_id: ${requestData.institution_id}`);
      }
    }

    // Create officer record with institution assignment
    const { data: officerData, error: officerError } = await supabaseAdmin
      .from('officers')
      .insert({
        user_id: userId,
        full_name: requestData.full_name,
        email: requestData.email,
        phone: requestData.phone || null,
        employee_id: requestData.employee_id || null,
        employment_type: requestData.employment_type || 'full_time',
        annual_salary: requestData.annual_salary || 0,
        hourly_rate: requestData.hourly_rate || null,
        overtime_rate_multiplier: requestData.overtime_rate_multiplier || 1.5,
        annual_leave_allowance: annualLeave,
        sick_leave_allowance: sickLeave,
        casual_leave_allowance: casualLeave,
        join_date: requestData.join_date || new Date().toISOString().split('T')[0],
        assigned_institutions: requestData.institution_id ? [requestData.institution_id] : []
      })
      .select()
      .single();

    if (officerError) {
      console.error('[CreateOfficerUser] Officer insert error:', officerError);
      // Clean up: delete the auth user and role if officer creation fails
      await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Failed to create officer record: ' + officerError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[CreateOfficerUser] Successfully created officer: ${officerData.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: userId,
        officer_id: officerData.id,
        officer: officerData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[CreateOfficerUser] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});