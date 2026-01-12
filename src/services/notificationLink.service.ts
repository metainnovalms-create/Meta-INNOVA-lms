/**
 * Shared helper for generating role-aware notification links
 * Ensures notifications link to correct routes with proper tenant context
 */

// Helper to get tenant slug from localStorage
export const getTenantSlug = (): string => {
  try {
    const tenantStr = localStorage.getItem('tenant');
    const tenant = tenantStr ? JSON.parse(tenantStr) : null;
    return tenant?.slug || 'default';
  } catch {
    return 'default';
  }
};

/**
 * Generate role-aware notification link with proper tenant context
 * @param role - The recipient's role (officer, student, system_admin, etc.)
 * @param path - The path within that role's section (e.g., '/tasks', '/assignments')
 * @returns Full path with proper prefix based on role
 */
export const getNotificationLink = (role: string, path: string): string => {
  const slug = getTenantSlug();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  switch (role) {
    case 'system_admin':
      return `/system-admin${normalizedPath}`;
    case 'super_admin':
      return `/super-admin${normalizedPath}`;
    case 'officer':
      return `/tenant/${slug}/officer${normalizedPath}`;
    case 'management':
      return `/tenant/${slug}/management${normalizedPath}`;
    case 'teacher':
      return `/tenant/${slug}/teacher${normalizedPath}`;
    case 'student':
      return `/tenant/${slug}/student${normalizedPath}`;
    default:
      return normalizedPath;
  }
};
