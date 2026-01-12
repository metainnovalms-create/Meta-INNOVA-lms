// User Role Enum
export type UserRole = 
  | 'super_admin'
  | 'system_admin'
  | 'management'
  | 'officer'
  | 'teacher'
  | 'student';

import { SystemAdminFeature } from './permissions';

// User Interface
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole; // Primary role (for backward compatibility)
  roles?: UserRole[]; // All user roles (for multi-role users like CEO)
  position_id?: string; // Dynamic position reference
  position_name?: string; // Display name for position
  is_ceo?: boolean; // True for CEO position
  allowed_features?: SystemAdminFeature[]; // Features this user can access based on position
  tenant_id?: string; // null for super_admin
  institution_id?: string;
  class_id?: string; // Student's class ID
  created_at: string;
  // Salary configuration (for meta staff and officers)
  annual_salary?: number;
  hourly_rate?: number;
  overtime_rate_multiplier?: number;
  normal_working_hours?: number;
  // Password management
  password_changed?: boolean; // Has user changed their initial password?
  must_change_password?: boolean; // Force password change on next login
  password_changed_at?: string; // Timestamp of last password change
}

// Helper to check if user has a specific role
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false;
  const userRoles = user.roles || [user.role];
  return userRoles.includes(role);
};

// Helper to check if user has any of the specified roles
export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user) return false;
  const userRoles = user.roles || [user.role];
  return roles.some(role => userRoles.includes(role));
};


// Auth Response
export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  tenant?: {
    id: string;
    name: string;
    slug: string; // for URL path
  };
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
