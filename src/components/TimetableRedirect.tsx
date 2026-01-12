import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Smart redirect component for /timetable route.
 * Redirects authenticated users to their role-specific timetable page.
 */
export function TimetableRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Get tenant slug from localStorage
  const tenantStr = localStorage.getItem('tenant');
  let tenantSlug: string | null = null;
  
  if (tenantStr) {
    try {
      const tenant = JSON.parse(tenantStr);
      tenantSlug = tenant.slug;
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Determine redirect based on role
  const role = user.role;

  // Roles that need tenant-based timetable routes
  if (['student', 'officer', 'management', 'teacher'].includes(role)) {
    if (tenantSlug) {
      return <Navigate to={`/tenant/${tenantSlug}/${role}/timetable`} replace />;
    }
    // No tenant slug available, redirect to login
    return <Navigate to="/login" replace />;
  }

  // System admin and super admin don't have timetable pages
  // Redirect to their dashboard
  if (role === 'system_admin') {
    return <Navigate to="/system-admin/dashboard" replace />;
  }

  if (role === 'super_admin') {
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  // Fallback to login
  return <Navigate to="/login" replace />;
}
