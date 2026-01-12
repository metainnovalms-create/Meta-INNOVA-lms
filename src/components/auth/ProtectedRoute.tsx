import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, hasAnyRole } from '@/types';
import { SystemAdminFeature } from '@/types/permissions';
import { canAccessFeature } from '@/utils/permissionHelpers';
import { usePlatformSettings } from '@/contexts/PlatformSettingsContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredFeature?: SystemAdminFeature;
}

// Roles that bypass maintenance mode
const ADMIN_ROLES: UserRole[] = ['super_admin', 'system_admin'];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  requiredFeature
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { settings, isLoading: settingsLoading } = usePlatformSettings();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is admin
  const userRoles = user?.roles || [user?.role];
  const isAdmin = userRoles.some(role => role && ADMIN_ROLES.includes(role as UserRole));

  // Check if user's role is affected by maintenance mode
  const userRole = user?.role;
  const isAffectedByMaintenance = userRole && settings.maintenanceAffectedRoles.includes(userRole);

  // Active navigation when maintenance mode changes - redirect affected roles immediately
  useEffect(() => {
    if (!isLoading && !settingsLoading && isAuthenticated && settings.maintenanceMode && isAffectedByMaintenance) {
      console.log('Maintenance mode activated - actively redirecting user to maintenance page', { userRole });
      navigate('/maintenance', { replace: true });
    }
  }, [settings.maintenanceMode, settings.maintenanceAffectedRoles, isAffectedByMaintenance, userRole, isAuthenticated, isLoading, settingsLoading, navigate]);

  if (isLoading || settingsLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-meta-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: User not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check maintenance mode - redirect affected roles to maintenance page
  if (settings.maintenanceMode && isAffectedByMaintenance) {
    console.log('ProtectedRoute: Maintenance mode active, redirecting affected user', { userRole });
    return <Navigate to="/maintenance" replace />;
  }

  // Check if user has ANY of the allowed roles (multi-role support)
  if (allowedRoles && user && !hasAnyRole(user, allowedRoles)) {
    console.log('ProtectedRoute: Access denied', {
      userRoles: user.roles || [user.role],
      allowedRoles,
      path: location.pathname
    });
    return <Navigate to="/unauthorized" replace />;
  }

  // Check feature-based permission for system_admin
  if (requiredFeature && userRoles.includes('system_admin')) {
    if (!canAccessFeature(user!, requiredFeature)) {
      console.log('ProtectedRoute: Feature access denied', {
        userPositionId: user?.position_id,
        requiredFeature,
        path: location.pathname
      });
      return <Navigate to="/unauthorized" replace />;
    }
  }

  console.log('ProtectedRoute: Access granted', {
    userRole: user?.role,
    path: location.pathname
  });

  return <>{children}</>;
};
