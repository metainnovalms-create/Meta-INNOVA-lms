import { supabase } from '@/integrations/supabase/client';
import { AuthResponse, User, UserRole } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  // Login with Supabase
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Login failed - no user data returned');
    }

    // Fetch ALL user roles from user_roles table (for multi-role support)
    const { data: rolesData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id);

    if (roleError) {
      console.error('Error fetching roles:', roleError);
    }

    // Get all roles as array
    const roles: UserRole[] = rolesData?.map(r => r.role as UserRole) || ['student'];
    // Primary role: prefer system_admin for CEO, otherwise use first role
    const role: UserRole = roles.includes('system_admin') ? 'system_admin' : roles[0];

    // Fetch user profile from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Build user object
    const user: User = {
      id: data.user.id,
      email: data.user.email || credentials.email,
      name: profileData?.name || data.user.user_metadata?.name || credentials.email.split('@')[0],
      avatar: profileData?.avatar || undefined,
      role,
      roles, // Include all roles for multi-role support
      position_id: profileData?.position_id || undefined,
      position_name: profileData?.position_name || undefined,
      is_ceo: profileData?.is_ceo || false,
      institution_id: profileData?.institution_id || undefined,
      tenant_id: profileData?.institution_id || undefined, // Add tenant_id for sidebar routing
      class_id: profileData?.class_id || undefined,
      created_at: profileData?.created_at || data.user.created_at,
      hourly_rate: profileData?.hourly_rate || undefined,
      overtime_rate_multiplier: profileData?.overtime_rate_multiplier || undefined,
      normal_working_hours: profileData?.normal_working_hours || undefined,
      password_changed: profileData?.password_changed || false,
      must_change_password: profileData?.must_change_password || false,
      password_changed_at: profileData?.password_changed_at || undefined,
    };

    // Fetch tenant/institution info if user has an institution
    let tenant: { id: string; name: string; slug: string } | undefined;
    let institutionId = profileData?.institution_id;

    // For officers, check assigned_institutions if profile doesn't have institution_id
    if (!institutionId && role === 'officer') {
      const { data: officerData } = await supabase
        .from('officers')
        .select('assigned_institutions')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (officerData?.assigned_institutions?.length > 0) {
        institutionId = officerData.assigned_institutions[0];
        // Update user object with institution_id
        user.institution_id = institutionId;
        user.tenant_id = institutionId;
      }
    }

    if (institutionId) {
      const { data: institutionData } = await supabase
        .from('institutions')
        .select('id, name, slug')
        .eq('id', institutionId)
        .maybeSingle();

      if (institutionData) {
        tenant = {
          id: institutionData.id,
          name: institutionData.name,
          slug: institutionData.slug,
        };
      }
    }

    // Store token and user data
    localStorage.setItem('authToken', data.session.access_token);
    localStorage.setItem('user', JSON.stringify(user));
    if (tenant) {
      localStorage.setItem('tenant', JSON.stringify(tenant));
    }

    return {
      success: true,
      token: data.session.access_token,
      user,
      tenant,
    };
  },

  // Logout
  async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
  },

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Check if token is valid
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Sync check for immediate use (checks localStorage)
  isAuthenticatedSync(): boolean {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Get tenant info
  getTenant(): { id: string; name: string; slug: string } | null {
    const tenantStr = localStorage.getItem('tenant');
    if (!tenantStr) return null;
    
    try {
      return JSON.parse(tenantStr);
    } catch {
      return null;
    }
  },

  // Get current session
  async getSession() {
    return supabase.auth.getSession();
  },

  // Refresh user data from database
  async refreshUserData(userId: string): Promise<User | null> {
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileData) return null;

    const roles: UserRole[] = rolesData?.map(r => r.role as UserRole) || ['student'];
    const role: UserRole = roles.includes('system_admin') ? 'system_admin' : roles[0];

    const user: User = {
      id: userId,
      email: profileData.email,
      name: profileData.name,
      avatar: profileData.avatar || undefined,
      role,
      roles,
      position_id: profileData.position_id || undefined,
      position_name: profileData.position_name || undefined,
      is_ceo: profileData.is_ceo || false,
      institution_id: profileData.institution_id || undefined,
      tenant_id: profileData.institution_id || undefined, // Add tenant_id for sidebar routing
      class_id: profileData.class_id || undefined,
      created_at: profileData.created_at || '',
      hourly_rate: profileData.hourly_rate || undefined,
      overtime_rate_multiplier: profileData.overtime_rate_multiplier || undefined,
      normal_working_hours: profileData.normal_working_hours || undefined,
      password_changed: profileData.password_changed || false,
      must_change_password: profileData.must_change_password || false,
      password_changed_at: profileData.password_changed_at || undefined,
    };

    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }
};
