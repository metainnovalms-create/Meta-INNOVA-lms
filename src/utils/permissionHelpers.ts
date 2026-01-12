import { User, hasAnyRole } from '@/types';
import { SystemAdminFeature, ALL_SYSTEM_ADMIN_FEATURES } from '@/types/permissions';

/**
 * Check if user can access a specific feature.
 * Uses user.allowed_features which is populated at login time from the database.
 * 
 * IMPORTANT: For users with system_admin role + position, access is determined by
 * their position's visible_features, even if they also have super_admin role.
 * This ensures CEO sidebar visibility respects position selections.
 */
export const canAccessFeature = (user: User | null, feature: SystemAdminFeature): boolean => {
  if (!user) return false;

  // If user has system_admin role, check position-based features
  // This takes precedence over super_admin to respect position selections
  if (hasAnyRole(user, ['system_admin'])) {
    if (!user.allowed_features || user.allowed_features.length === 0) return false;
    return user.allowed_features.includes(feature);
  }

  // Pure super_admin (not system_admin) can access all features
  if (hasAnyRole(user, ['super_admin'])) return true;

  return false;
};

/**
 * Get all features the user can access.
 * Uses user.allowed_features which is populated at login time from the database.
 * 
 * IMPORTANT: For users with system_admin role + position, features are determined by
 * their position's visible_features, even if they also have super_admin role.
 */
export const getAccessibleFeatures = (user: User | null): SystemAdminFeature[] => {
  if (!user) return [];

  // If user has system_admin role, return position-based features
  // This takes precedence over super_admin to respect position selections
  if (hasAnyRole(user, ['system_admin'])) {
    return user.allowed_features || [];
  }

  // Pure super_admin (not system_admin) can access all features
  if (hasAnyRole(user, ['super_admin'])) return ALL_SYSTEM_ADMIN_FEATURES;

  return [];
};

/**
 * Check if user is CEO (has complete system access)
 */
export const isCEO = (user: User | null): boolean => {
  if (!user) return false;

  // Super admins should be treated as having CEO-level visibility
  if (hasAnyRole(user, ['super_admin'])) return true;

  if (!hasAnyRole(user, ['system_admin'])) return false;

  // Check is_ceo flag
  return user.is_ceo === true;
};

// No cache needed - features are stored on user object at login time
export const clearPositionCache = () => {
  // No-op: kept for backward compatibility but no longer needed
};
