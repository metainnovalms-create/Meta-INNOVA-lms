import { User } from '@/types';
import { SystemAdminFeature } from '@/types/permissions';
import { supabase } from '@/integrations/supabase/client';
import { positionService, clearPositionsCache } from './position.service';

// Helper to get current auth token
const getAuthToken = async (): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated. Please log in again.');
  }
  return session.access_token;
};

// Generate a temporary password
const generateTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specialChars = '@#$%&*!';
  let password = '';
  
  // Generate 8 random alphanumeric characters
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add 1-2 special characters
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  return password;
};

export const metaStaffService = {
  // Get all meta staff (system_admin users)
  getMetaStaff: async (): Promise<User[]> => {
    // Get all users with system_admin role
    const { data: roleUsers, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'system_admin');

    if (roleError) throw roleError;
    if (!roleUsers || roleUsers.length === 0) return [];

    const userIds = roleUsers.map(r => r.user_id);

    // Get profiles for these users
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    if (profileError) throw profileError;

    return (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      name: p.name,
      avatar: p.avatar || undefined,
      role: 'system_admin' as const,
      roles: ['system_admin'] as const,
      position_id: p.position_id || undefined,
      position_name: p.position_name || undefined,
      is_ceo: p.is_ceo || false,
      institution_id: p.institution_id || undefined,
      created_at: p.created_at || '',
      hourly_rate: p.hourly_rate || undefined,
      overtime_rate_multiplier: p.overtime_rate_multiplier || undefined,
      normal_working_hours: p.normal_working_hours || undefined,
      password_changed: p.password_changed || false,
      must_change_password: p.must_change_password || false,
    }));
  },

  // Create a new meta staff user
  createMetaStaff: async (data: {
    name: string;
    email: string;
    position_id: string;
    custom_password?: string;
    casual_leave?: number;
    sick_leave?: number;
    earned_leave?: number;
    join_date?: string;
    annual_salary?: number;
    hourly_rate?: number;
    overtime_rate_multiplier?: number;
    normal_working_hours?: number;
  }): Promise<{ user: User; password: string }> => {
    // Get position details
    const position = await positionService.getPositionById(data.position_id);
    if (!position) throw new Error('Position not found');

    // Generate password
    const tempPassword = data.custom_password || generateTemporaryPassword();

    // Call Edge Function to create user with explicit auth token
    const token = await getAuthToken();
    const { data: result, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'create_user',
        email: data.email,
        password: tempPassword,
        name: data.name,
        position_id: data.position_id,
        position_name: position.position_name,
        is_ceo: position.is_ceo_position || false,
        join_date: data.join_date || null,
        hourly_rate: data.hourly_rate || null,
        overtime_rate_multiplier: data.overtime_rate_multiplier || 1.5,
        normal_working_hours: data.normal_working_hours || 8
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (error) {
      console.error('[metaStaffService] Create error:', error);
      throw new Error(error.message || 'Failed to create user');
    }

    if (result?.error) {
      throw new Error(result.error);
    }

    const user: User = {
      id: result.user.id,
      email: data.email,
      name: data.name,
      role: 'system_admin',
      roles: ['system_admin'],
      position_id: data.position_id,
      position_name: position.position_name,
      is_ceo: position.is_ceo_position || false,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
      created_at: new Date().toISOString(),
      must_change_password: true,
      password_changed: false,
      hourly_rate: data.hourly_rate,
      overtime_rate_multiplier: data.overtime_rate_multiplier,
      normal_working_hours: data.normal_working_hours
    };

    return { user, password: tempPassword };
  },

  // Update user position
  updatePosition: async (userId: string, position_id: string): Promise<void> => {
    const position = await positionService.getPositionById(position_id);
    if (!position) throw new Error('Position not found');

    const token = await getAuthToken();
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'update_user',
        user_id: userId,
        updates: {
          position_id: position_id,
          position_name: position.position_name,
          is_ceo: position.is_ceo_position || false
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  // Delete meta staff user
  deleteMetaStaff: async (userId: string): Promise<void> => {
    const token = await getAuthToken();
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'delete_user',
        user_id: userId
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  // Get position permissions
  getPositionPermissions: async (position_id: string): Promise<SystemAdminFeature[]> => {
    return positionService.getPositionFeatures(position_id);
  },

  // Update position permissions
  updatePositionPermissions: async (
    position_id: string,
    features: SystemAdminFeature[]
  ): Promise<void> => {
    await positionService.updatePosition(position_id, { visible_features: features });
    clearPositionsCache();
  },

  // Reset user password
  resetPassword: async (userId: string): Promise<string> => {
    const newPassword = generateTemporaryPassword();

    const token = await getAuthToken();
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'reset_password',
        user_id: userId,
        new_password: newPassword
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return newPassword;
  },

  // Set specific password
  setPassword: async (userId: string, password: string): Promise<void> => {
    const token = await getAuthToken();
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'reset_password',
        user_id: userId,
        new_password: password
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  // Get single meta staff by ID
  getMetaStaffById: async (userId: string): Promise<User | null> => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!profile) return null;

    // Verify they are system_admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const isSystemAdmin = roles?.some(r => r.role === 'system_admin');
    if (!isSystemAdmin) return null;

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar || undefined,
      role: 'system_admin',
      roles: ['system_admin'],
      position_id: profile.position_id || undefined,
      position_name: profile.position_name || undefined,
      is_ceo: profile.is_ceo || false,
      institution_id: profile.institution_id || undefined,
      created_at: profile.created_at || '',
      hourly_rate: profile.hourly_rate || undefined,
      overtime_rate_multiplier: profile.overtime_rate_multiplier || undefined,
      normal_working_hours: profile.normal_working_hours || undefined,
      password_changed: profile.password_changed || false,
      must_change_password: profile.must_change_password || false,
    };
  },

  // Update meta staff details
  updateMetaStaff: async (userId: string, updates: Partial<User>): Promise<void> => {
    const token = await getAuthToken();
    const { data, error } = await supabase.functions.invoke('admin-user-management', {
      body: {
        action: 'update_user',
        user_id: userId,
        updates: {
          name: updates.name,
          position_id: updates.position_id,
          position_name: updates.position_name,
          is_ceo: updates.is_ceo
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
  },

  // Update meta staff profile with salary details
  updateMetaStaffProfile: async (userId: string, updates: {
    name?: string;
    hourly_rate?: number;
    overtime_rate_multiplier?: number;
    normal_working_hours?: number;
  }): Promise<void> => {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: updates.name,
        hourly_rate: updates.hourly_rate,
        overtime_rate_multiplier: updates.overtime_rate_multiplier,
        normal_working_hours: updates.normal_working_hours
      })
      .eq('id', userId);

    if (error) throw error;
  },
};
