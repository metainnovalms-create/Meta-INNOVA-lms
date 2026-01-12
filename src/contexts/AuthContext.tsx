import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { SystemAdminFeature, ALL_SYSTEM_ADMIN_FEATURES } from '@/types/permissions';
import { supabase } from '@/integrations/supabase/client';
import { logLogin, logLogout } from '@/services/systemLog.service';
import { gamificationDbService } from '@/services/gamification-db.service';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlock
          setTimeout(async () => {
            await fetchAndSetUser(session.user.id);
          }, 0);
        } else {
          setUser(null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('tenant');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await fetchAndSetUser(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSetUser = async (userId: string) => {
    try {
      // Fetch ALL user roles (for multi-role support)
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        const roles: UserRole[] = rolesData?.map(r => r.role as UserRole) || ['student'];
        // Primary role: prefer system_admin for CEO, otherwise use first role
        const role: UserRole = roles.includes('system_admin') ? 'system_admin' : roles[0];
        
        // Get institution_id from profile or officers table (for officers)
        let institutionId = profileData.institution_id;
        
        // For officers, check assigned_institutions if profile doesn't have institution_id
        if (!institutionId && role === 'officer') {
          const { data: officerData } = await supabase
            .from('officers')
            .select('assigned_institutions')
            .eq('user_id', userId)
            .maybeSingle();

          if (officerData?.assigned_institutions?.length > 0) {
            institutionId = officerData.assigned_institutions[0];
          }
        }
        
        // Fetch tenant info if user has institution and it's not already in localStorage
        let tenantSlug: string | undefined;
        if (institutionId) {
          const existingTenant = localStorage.getItem('tenant');
          if (existingTenant) {
            try {
              const parsed = JSON.parse(existingTenant);
              tenantSlug = parsed.slug;
            } catch {}
          }
          
          if (!tenantSlug) {
            const { data: institutionData } = await supabase
              .from('institutions')
              .select('id, name, slug')
              .eq('id', institutionId)
              .maybeSingle();
            
            if (institutionData) {
              tenantSlug = institutionData.slug;
              localStorage.setItem('tenant', JSON.stringify({
                id: institutionData.id,
                name: institutionData.name,
                slug: institutionData.slug,
              }));
            }
          }
        }
        
        // Fetch allowed features based on position
        // PRIORITY: system_admin with position_id uses position.visible_features for SIDEBAR VISIBILITY
        // Even if user also has super_admin, sidebar should respect position selections
        let allowedFeatures: SystemAdminFeature[] = [];
        
        // System admins (including CEO) with position get features from their position
        // This takes precedence over super_admin for sidebar visibility
        if (roles.includes('system_admin') && profileData.position_id) {
          const { data: positionData } = await supabase
            .from('positions')
            .select('visible_features')
            .eq('id', profileData.position_id)
            .maybeSingle();
          
          if (positionData) {
            // CEO and other positions use their saved visible_features
            // CEO's visible_features will always include 'position_management' (protected in EditPositionDialog)
            allowedFeatures = (positionData.visible_features as SystemAdminFeature[]) || [];
          }
        }
        // Pure super_admin (not a positioned system_admin) gets all features
        else if (roles.includes('super_admin')) {
          allowedFeatures = ALL_SYSTEM_ADMIN_FEATURES;
        }
        
        const userData: User = {
          id: userId,
          email: profileData.email,
          name: profileData.name,
          avatar: profileData.avatar || undefined,
          role,
          roles, // Include all roles
          position_id: profileData.position_id || undefined,
          position_name: profileData.position_name || undefined,
          is_ceo: profileData.is_ceo || false,
          allowed_features: allowedFeatures, // Include allowed features
          institution_id: institutionId || undefined,
          tenant_id: institutionId || undefined, // Add tenant_id for sidebar routing
          class_id: profileData.class_id || undefined,
          created_at: profileData.created_at || '',
          hourly_rate: profileData.hourly_rate || undefined,
          overtime_rate_multiplier: profileData.overtime_rate_multiplier || undefined,
          normal_working_hours: profileData.normal_working_hours || undefined,
          password_changed: profileData.password_changed || false,
          must_change_password: profileData.must_change_password || false,
          password_changed_at: profileData.password_changed_at || undefined,
        };

        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Log login activity (deferred to avoid blocking)
        setTimeout(() => {
          logLogin(userId, userData.name, userData.email, userData.role);
        }, 100);
        
        // Update streak on login for students (deferred to avoid blocking)
        if (userData.role === 'student' && institutionId) {
          setTimeout(() => {
            gamificationDbService.updateStreak(userId, institutionId);
          }, 200);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const login = (userData: User, token: string) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    // Log logout before clearing session
    await logLogout();
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
  };

  // Refresh user data without requiring logout/login
  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchAndSetUser(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
