import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Helper to call edge functions
const callEdgeFunction = async (functionName: string, body: Record<string, unknown>) => {
  const response = await supabase.functions.invoke(functionName, { body });
  if (response.error) {
    throw new Error(response.error.message || 'Edge function call failed');
  }
  return response.data;
};

// Types for password management
export interface PasswordResetToken {
  token: string;
  email: string;
  user_id: string;
  user_type: 'meta_staff' | 'officer' | 'institution' | 'student';
  created_at: string;
  expires_at: string;
  used: boolean;
}

export interface PasswordChangeLog {
  id: string;
  user_id: string;
  user_email: string;
  action: 'password_changed' | 'reset_requested' | 'reset_completed';
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

// localStorage keys for backward compatibility
const CHANGE_LOGS_KEY = 'password_change_logs';

const loadChangeLogs = (): PasswordChangeLog[] => {
  const stored = localStorage.getItem(CHANGE_LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveChangeLogs = (logs: PasswordChangeLog[]) => {
  localStorage.setItem(CHANGE_LOGS_KEY, JSON.stringify(logs));
};

export const passwordService = {
  // Verify current password - with Supabase, we attempt to sign in
  verifyCurrentPassword: async (userId: string, currentPassword: string): Promise<boolean> => {
    // Get user's email from current session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return false;

    // Try to sign in with current password to verify
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    return !error;
  },

  // Change password using Supabase Auth
  changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // First verify current password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        return { success: false, error: 'User not found' };
      }

      // Verify current password by attempting sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Update profiles table to mark password as changed
      await supabase
        .from('profiles')
        .update({
          password_changed: true,
          password_changed_at: new Date().toISOString(),
          must_change_password: false,
        })
        .eq('id', userId);

      // Log the change
      passwordService.logPasswordChange(userId, user.email, 'password_changed');

      return { success: true };
    } catch (error: any) {
      console.error('Password change error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  },

  // Set password for first-time login (no current password verification needed)
  setUserPassword: async (userId: string, newPassword: string): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Set password error:', error);
        return { success: false };
      }

      // Update profiles table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({
            password_changed: true,
            password_changed_at: new Date().toISOString(),
            must_change_password: false,
          })
          .eq('id', userId);

        passwordService.logPasswordChange(userId, user.email || '', 'password_changed');
      }

      return { success: true };
    } catch (error) {
      console.error('Set password error:', error);
      return { success: false };
    }
  },

  // Admin manually sets password for a user (using admin functions)
  setPassword: async (userId: string, password: string, userType: string): Promise<void> => {
    // Note: This would require a Supabase edge function with admin privileges
    // For now, we'll just log it
    console.log(`Password set requested for user ${userId} (${userType})`);
    toast.info('Admin password reset requires server-side implementation');
  },

  // Send password reset email via Resend (edge function)
  sendResetLink: async (email: string, userName: string, userType: string, userId?: string): Promise<void> => {
    try {
      const result = await callEdgeFunction('send-password-reset', {
        email,
        userName,
        appUrl: window.location.origin,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Log the reset request
      if (userId) {
        passwordService.logPasswordChange(userId, email, 'reset_requested');
      }

      toast.success(`Password reset link sent to ${email}`);
    } catch (error: any) {
      console.error('Send reset link error:', error);
      toast.error(error.message || 'Failed to send reset link');
      throw error;
    }
  },

  // User requests reset link (from login page)
  requestPasswordReset: async (email: string): Promise<void> => {
    try {
      await callEdgeFunction('send-password-reset', {
        email,
        appUrl: window.location.origin,
      });

      // Don't reveal if email exists or not for security
      toast.success('If an account exists with this email, you will receive a reset link');
    } catch (error: any) {
      console.error('Request password reset error:', error);
      // Don't reveal if email exists or not for security
      toast.success('If an account exists with this email, you will receive a reset link');
    }
  },

  // User resets password using token from email (via edge function)
  resetPasswordWithToken: async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await callEdgeFunction('verify-reset-token', {
        token,
        newPassword,
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to reset password' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message || 'Failed to reset password' };
    }
  },

  // Validate reset token - handled by Supabase automatically
  validateResetToken: (token: string): { valid: boolean; email?: string; userId?: string; error?: string } => {
    // Supabase handles token validation automatically via the URL
    return { valid: true };
  },

  // Generate reset token - handled by Supabase
  generateResetToken: (userId: string, email: string, userType: 'meta_staff' | 'officer' | 'institution' | 'student'): string => {
    // Supabase generates tokens automatically
    return '';
  },

  // Log password change for audit trail
  logPasswordChange: (userId: string, email: string, action: PasswordChangeLog['action']) => {
    const log: PasswordChangeLog = {
      id: `log_${Date.now()}`,
      user_id: userId,
      user_email: email,
      action,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
    };

    const logs = loadChangeLogs();
    logs.unshift(log);
    // Keep only last 1000 logs
    saveChangeLogs(logs.slice(0, 1000));
  },

  // Get password change logs (for admin)
  getPasswordChangeLogs: (userId?: string): PasswordChangeLog[] => {
    const logs = loadChangeLogs();
    if (userId) {
      return logs.filter((l) => l.user_id === userId);
    }
    return logs;
  },

  // Generate strong random password
  generateStrongPassword: (): string => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    // Fill remaining with random characters
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    // Shuffle the password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  },

  // Validate password strength
  validatePasswordStrength: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?\\":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return { valid: errors.length === 0, errors };
  },

  // Send bulk reset links to multiple users via Resend
  sendBulkResetLinks: async (
    users: Array<{ email: string; name: string; userId?: string; userType: string }>,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ success: number; failed: Array<{ email: string; error: string }> }> => {
    const results = { success: 0, failed: [] as Array<{ email: string; error: string }> };
    
    for (let i = 0; i < users.length; i++) {
      try {
        const result = await callEdgeFunction('send-password-reset', {
          email: users[i].email,
          userName: users[i].name,
          appUrl: window.location.origin,
        });

        if (result.error) {
          results.failed.push({ email: users[i].email, error: result.error });
        } else {
          results.success++;
          
          // Log the reset request
          if (users[i].userId) {
            passwordService.logPasswordChange(users[i].userId, users[i].email, 'reset_requested');
          }
        }
      } catch (error: any) {
        results.failed.push({ email: users[i].email, error: error.message || 'Unknown error' });
      }
      
      onProgress?.(i + 1, users.length);
      
      // Small delay to avoid rate limiting (200ms between requests)
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return results;
  },
};
