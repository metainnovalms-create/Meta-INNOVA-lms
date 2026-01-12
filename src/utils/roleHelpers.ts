import { User, UserRole } from '@/types';

export const getRoleBasePath = (role: UserRole, tenantSlug?: string): string => {
  // System-level roles don't need tenant slug
  if (role === 'super_admin') {
    return '/super-admin';
  }
  if (role === 'system_admin') {
    return '/system-admin';
  }
  
  // Tenant-level roles require tenant slug
  if (!tenantSlug) {
    console.warn(`[RoleHelpers] Missing tenant slug for role: ${role}`);
    // Return login as fallback to prevent undefined in URL
    return '/login';
  }
  
  const tenantPaths: Record<string, string> = {
    management: `/tenant/${tenantSlug}/management`,
    officer: `/tenant/${tenantSlug}/officer`,
    teacher: `/tenant/${tenantSlug}/teacher`,
    student: `/tenant/${tenantSlug}/student`,
  };
  
  return tenantPaths[role] || '/login';
};

export const getRoleDashboardPath = (role: UserRole, tenantSlug?: string): string => {
  const basePath = getRoleBasePath(role, tenantSlug);
  // If basePath is /login (fallback), don't append /dashboard
  if (basePath === '/login') {
    return '/login';
  }
  return `${basePath}/dashboard`;
};

// Get dashboard path for multi-role user (prioritizes super_admin for CEO)
export const getMultiRoleDashboardPath = (user: User, tenantSlug?: string): string => {
  const roles = user.roles || [user.role];
  
  // Priority: super_admin > system_admin > others
  if (roles.includes('super_admin')) {
    return '/super-admin/dashboard';
  }
  if (roles.includes('system_admin')) {
    return '/system-admin/dashboard';
  }
  
  // For tenant-level roles, require tenant slug
  if (!tenantSlug && ['management', 'officer', 'teacher', 'student'].includes(user.role)) {
    console.error('[RoleHelpers] Missing tenant slug for tenant-level role:', user.role);
    // This indicates a data issue - user has a tenant role but no institution
    return '/login';
  }
  
  return getRoleDashboardPath(user.role, tenantSlug);
};
