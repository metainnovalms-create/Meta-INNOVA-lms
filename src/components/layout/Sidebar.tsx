import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useBranding } from '@/contexts/BrandingContext';
import logoImage from '@/assets/logo.png';
import { 
  Home, Users, User, Settings, LogOut, ChevronLeft, ChevronRight, ChevronDown,
  BookOpen, Target, Calendar, Award, BarChart,
  Building2, FileText, Trophy, Package, UserCheck, GraduationCap,
  MessageSquare, MessageCircle, Bell, Video, Newspaper,
  Shield, Phone, Clock, ShoppingCart, PieChart, Briefcase, CalendarCheck,
  LayoutDashboard, CheckSquare, ListTodo, Key, Star, History, CalendarDays
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { UserRole } from '@/types';
import { SystemAdminFeature } from '@/types/permissions';
import { canAccessFeature, isCEO } from '@/utils/permissionHelpers';
import { OfficerSidebarProfile } from './OfficerSidebarProfile';
import { OfficerDetails } from '@/services/systemadmin.service';
import { TeacherSidebarProfile } from '@/components/teacher/TeacherSidebarProfile';
import { getTeacherByEmail } from '@/data/mockTeacherData';
import { SchoolTeacher } from '@/types/teacher';
import { getPendingLeaveCount, getPendingLeaveCountByStage } from '@/data/mockLeaveData';
import { NotificationBell } from './NotificationBell';
import { SidebarProfileCard } from './SidebarProfileCard';
import { useUserProfilePhoto } from '@/hooks/useUserProfilePhoto';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationCategories, NotificationCategoryCounts } from '@/hooks/useNotificationCategories';

// Map menu item labels to notification categories
const MENU_NOTIFICATION_MAP: Record<string, keyof Omit<NotificationCategoryCounts, 'total'>> = {
  'Assessment Management': 'assessments',
  'Assessments': 'assessments',
  'Project Management': 'projects',
  'Projects': 'projects',
  'My Projects': 'projects',
  'Events': 'events',
  'Inventory Management': 'inventory',
  'Inventory & Purchase': 'inventory',
  'Lab Inventory': 'inventory',
  'Leave Approval': 'leave',
  'Leave Management': 'leave',
  'Leave': 'leave',
  'Course Management': 'courses',
  'My Courses': 'courses',
  'Courses & Sessions': 'courses',
  'Certificates': 'certificates',
};

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: UserRole[];
  feature?: SystemAdminFeature;
  ceoOnly?: boolean;
  isSubmenu?: boolean;
  children?: MenuItem[];
}

// Role-based menu configuration
const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, path: '/dashboard', roles: ['super_admin', 'system_admin', 'management', 'officer', 'teacher', 'student'] },
  // Super Admin menu items - Technical oversight
  { label: 'System Config', icon: <Settings className="h-5 w-5" />, path: '/system-config', roles: ['super_admin'] },
  { label: 'System Logs', icon: <History className="h-5 w-5" />, path: '/audit-logs', roles: ['super_admin'] },
  // System Admin menu items - Business operations
  { label: 'Institution Management', icon: <Building2 className="h-5 w-5" />, path: '/institutions', roles: ['system_admin'], feature: 'institution_management' },
  { label: 'Course Management', icon: <BookOpen className="h-5 w-5" />, path: '/course-management', roles: ['system_admin'], feature: 'course_management' },
  { label: 'Assessment Management', icon: <FileText className="h-5 w-5" />, path: '/assessments', roles: ['system_admin'], feature: 'assessment_management' },
  { label: 'Assignment Management', icon: <FileText className="h-5 w-5" />, path: '/assignments', roles: ['system_admin'], feature: 'assignment_management' },
  { label: 'Events Management', icon: <Trophy className="h-5 w-5" />, path: '/event-management', roles: ['system_admin'], feature: 'event_management' },
  // Officers Management
  { label: 'Officer Management', icon: <Users className="h-5 w-5" />, path: '/officers', roles: ['system_admin'], feature: 'officer_management' },
  // Project Management
  { label: 'Project Management', icon: <Target className="h-5 w-5" />, path: '/project-management', roles: ['system_admin'], feature: 'project_management' },
  // Inventory & Purchase
  { label: 'Inventory Management', icon: <Package className="h-5 w-5" />, path: '/inventory-management', roles: ['system_admin'], feature: 'inventory_management' },
  { label: 'Attendance & Payroll', icon: <PieChart className="h-5 w-5" />, path: '/payroll-management', roles: ['system_admin'], feature: 'payroll_management', ceoOnly: true },
  // Leave Approval (separate menu for approvers based on approval chain)
  { label: 'Leave Approval', icon: <CalendarCheck className="h-5 w-5" />, path: '/leave-approvals', roles: ['system_admin'], feature: 'leave_approvals' },
  { label: 'Global Approval Config', icon: <Shield className="h-5 w-5" />, path: '/global-approval-config', roles: ['system_admin'], feature: 'global_approval_config', ceoOnly: true },
  // Unified Leave menu for all system admins
  { label: 'Leave', icon: <CalendarDays className="h-5 w-5" />, path: '/leave', roles: ['system_admin'], feature: 'leave_management' },
  { label: 'Company Holidays', icon: <Calendar className="h-5 w-5" />, path: '/company-holidays', roles: ['system_admin'], feature: 'company_holidays' },
  // Position Management (CEO only)
  { label: 'RBAC Management', icon: <Shield className="h-5 w-5" />, path: '/position-management', roles: ['system_admin'], feature: 'position_management', ceoOnly: true },
  // Credential Management (Feature-based permissions)
  { label: 'Credential Management', icon: <Key className="h-5 w-5" />, path: '/credential-management', roles: ['system_admin'], feature: 'credential_management' },
  // Task Management & Task Allotment (Feature-based permissions)
  { label: 'Task Management', icon: <CheckSquare className="h-5 w-5" />, path: '/task-management', roles: ['system_admin'], feature: 'task_management' },
  { label: 'Task Allotment', icon: <ListTodo className="h-5 w-5" />, path: '/tasks', roles: ['system_admin'], feature: 'task_allotment' },
  // Gamification
  { label: 'Gamification', icon: <Trophy className="h-5 w-5" />, path: '/gamification', roles: ['system_admin'], feature: 'gamification' },
  { label: 'ATS Management', icon: <Briefcase className="h-5 w-5" />, path: '/hr-management', roles: ['system_admin'], feature: 'ats_management', ceoOnly: true },
  { label: 'Webinar Management', icon: <Video className="h-5 w-5" />, path: '/webinars', roles: ['system_admin'], feature: 'webinar_management' },
  // Reports & Invoice
  { label: 'Reports Management', icon: <FileText className="h-5 w-5" />, path: '/reports-management', roles: ['system_admin'], feature: 'reports_analytics' },
  { label: 'Invoice Management', icon: <FileText className="h-5 w-5" />, path: '/reports', roles: ['system_admin'], feature: 'reports_analytics' },
  // SDG Management
  { label: 'SDG Management', icon: <Target className="h-5 w-5" />, path: '/sdg-management', roles: ['system_admin'], feature: 'sdg_management' },
  // CRM & Ask Metova
  { label: 'Surveys & Feedback', icon: <MessageCircle className="h-5 w-5" />, path: '/survey-feedback', roles: ['system_admin'], feature: 'survey_feedback' },
  { label: 'Performance & Ratings', icon: <Star className="h-5 w-5" />, path: '/performance-ratings', roles: ['system_admin'], feature: 'performance_ratings' },
  { label: 'CRM & Clients', icon: <Phone className="h-5 w-5" />, path: '/crm', roles: ['system_admin'], feature: 'crm_clients' },
  { label: 'Newsletters', icon: <FileText className="h-5 w-5" />, path: '/newsletters', roles: ['system_admin'], feature: 'news_feeds' },
  { label: 'Ask Metova', icon: <MessageSquare className="h-5 w-5" />, path: '/ask-metova', roles: ['system_admin'], feature: 'ask_metova' },
  { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings', roles: ['system_admin'], feature: 'settings' },
  // Teacher menu items
  { label: 'My Courses', icon: <BookOpen className="h-5 w-5" />, path: '/courses', roles: ['teacher'] },
  { label: 'Grades', icon: <Award className="h-5 w-5" />, path: '/grades', roles: ['teacher'] },
  { label: 'Attendance', icon: <UserCheck className="h-5 w-5" />, path: '/attendance', roles: ['teacher'] },
  { label: 'Schedule', icon: <Calendar className="h-5 w-5" />, path: '/schedule', roles: ['teacher'] },
  { label: 'Materials', icon: <FileText className="h-5 w-5" />, path: '/materials', roles: ['teacher'] },
  { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings', roles: ['teacher'] },
  // Officer menu items
  { label: 'Task', icon: <CheckSquare className="h-5 w-5" />, path: '/tasks', roles: ['officer'] },
  { label: 'My Timetable', icon: <Calendar className="h-5 w-5" />, path: '/timetable', roles: ['officer'] },
  { label: 'Institution Calendar', icon: <CalendarDays className="h-5 w-5" />, path: '/institution-calendar', roles: ['officer'] },
  { label: 'Assessments', icon: <FileText className="h-5 w-5" />, path: '/assessments', roles: ['officer'] },
  { label: 'Assignments', icon: <FileText className="h-5 w-5" />, path: '/assignments', roles: ['officer'] },
  { label: 'My Profile', icon: <User className="h-5 w-5" />, path: '/profile', roles: ['officer'] },
  { label: 'Projects', icon: <Target className="h-5 w-5" />, path: '/projects', roles: ['officer'] },
  { label: 'Lab Inventory', icon: <Package className="h-5 w-5" />, path: '/inventory', roles: ['officer'] },
  { label: 'Class Attendance', icon: <UserCheck className="h-5 w-5" />, path: '/attendance', roles: ['officer'] },
  { label: 'Leave Management', icon: <CalendarCheck className="h-5 w-5" />, path: '/leave-management', roles: ['officer'] },
  { label: 'Events Management', icon: <Trophy className="h-5 w-5" />, path: '/events', roles: ['officer'] },
  { label: 'Ask Metova', icon: <MessageSquare className="h-5 w-5" />, path: '/ask-metova', roles: ['officer'] },
  { label: 'Webinar Management', icon: <Video className="h-5 w-5" />, path: '/webinars', roles: ['officer'] },
  { label: 'Newsletters', icon: <FileText className="h-5 w-5" />, path: '/newsletters', roles: ['officer'] },
  // { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings', roles: ['officer'] }, // Temporarily hidden
  // Student menu items
  { label: 'My Courses', icon: <BookOpen className="h-5 w-5" />, path: '/courses', roles: ['student'] },
  { label: 'Assessments', icon: <FileText className="h-5 w-5" />, path: '/assessments', roles: ['student'] },
  { label: 'Assignments', icon: <FileText className="h-5 w-5" />, path: '/assignments', roles: ['student'] },
  
  { label: 'My Projects', icon: <Target className="h-5 w-5" />, path: '/projects', roles: ['student'] },
  { label: 'Events Management', icon: <Trophy className="h-5 w-5" />, path: '/events', roles: ['student'] },
  { label: 'Timetable', icon: <Calendar className="h-5 w-5" />, path: '/timetable', roles: ['student'] },
  { label: 'Certificates', icon: <Award className="h-5 w-5" />, path: '/certificates', roles: ['student'] },
  { label: 'Gamification', icon: <BarChart className="h-5 w-5" />, path: '/gamification', roles: ['student'] },
  { label: 'Resume', icon: <FileText className="h-5 w-5" />, path: '/resume', roles: ['student'] },
  // { label: 'Settings', icon: <Settings className="h-5 w-5" />, path: '/settings', roles: ['student'] }, // Temporarily hidden
  { label: 'Ask Metova', icon: <MessageSquare className="h-5 w-5" />, path: '/ask-metova', roles: ['student'] },
  { label: 'Webinar Management', icon: <Video className="h-5 w-5" />, path: '/webinars', roles: ['student'] },
  { label: 'Newsletters', icon: <FileText className="h-5 w-5" />, path: '/newsletters', roles: ['student'] },
  { label: 'Feedback/Survey', icon: <MessageCircle className="h-5 w-5" />, path: '/feedback', roles: ['student'] },
  // System Admin - Configuration
  { label: 'ID Configuration', icon: <Settings className="h-5 w-5" />, path: '/id-configuration', roles: ['system_admin'], feature: 'id_configuration' },
  // Management menu items (merged with institution admin functionality)
  // { label: 'Teachers', icon: <Users className="h-5 w-5" />, path: '/teachers', roles: ['management'] }, // Temporarily removed
  { label: 'Students', icon: <GraduationCap className="h-5 w-5" />, path: '/students', roles: ['management'] },
  { label: 'Innovation Officers', icon: <UserCheck className="h-5 w-5" />, path: '/officers', roles: ['management'] },
  { label: 'Courses & Sessions', icon: <BookOpen className="h-5 w-5" />, path: '/courses-sessions', roles: ['management'] },
  { label: 'Assessments', icon: <FileText className="h-5 w-5" />, path: '/assessments', roles: ['management'] },
  { label: 'Assignments', icon: <FileText className="h-5 w-5" />, path: '/assignments', roles: ['management'] },
  { label: 'Analytics', icon: <BarChart className="h-5 w-5" />, path: '/analytics', roles: ['management'] },
  { label: 'Inventory & Purchase', icon: <Package className="h-5 w-5" />, path: '/inventory-purchase', roles: ['management'] },
  { label: 'Projects & Awards', icon: <Target className="h-5 w-5" />, path: '/projects-certificates', roles: ['management'] },
  { label: 'SDG Dashboard', icon: <Target className="h-5 w-5" />, path: '/sdg-dashboard', roles: ['management'] },
  { label: 'Events Management', icon: <Trophy className="h-5 w-5" />, path: '/events', roles: ['management'] },
  { label: 'Reports', icon: <FileText className="h-5 w-5" />, path: '/reports', roles: ['management'] },
  { label: 'Webinar Management', icon: <Video className="h-5 w-5" />, path: '/webinars', roles: ['management'] },
  { label: 'Newsletters', icon: <FileText className="h-5 w-5" />, path: '/newsletters', roles: ['management'] },
  { label: 'Timetable', icon: <Calendar className="h-5 w-5" />, path: '/timetable', roles: ['management'] },
  { label: 'Institution Calendar', icon: <CalendarDays className="h-5 w-5" />, path: '/institution-calendar', roles: ['management'] },
  { label: 'Attendance', icon: <Clock className="h-5 w-5" />, path: '/attendance', roles: ['management'] },
  { label: 'My Profile', icon: <User className="h-5 w-5" />, path: '/profile', roles: ['management'] },
  // Student menu items (additional)
  { label: 'SDG Contribution', icon: <Target className="h-5 w-5" />, path: '/sdg', roles: ['student'] },
  { label: 'My Profile', icon: <User className="h-5 w-5" />, path: '/profile', roles: ['student'] },
  // Teacher My Profile
  { label: 'My Profile', icon: <User className="h-5 w-5" />, path: '/profile', roles: ['teacher'] },
  // Notifications for all roles
  { label: 'Notifications', icon: <Bell className="h-5 w-5" />, path: '/notifications', roles: ['super_admin', 'system_admin', 'management', 'officer', 'teacher', 'student'] },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();
  const [officerProfile, setOfficerProfile] = useState<OfficerDetails | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<SchoolTeacher | null>(null);
  const [staffDesignation, setStaffDesignation] = useState<string | null>(null);
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0);
  const [managerLeaveCount, setManagerLeaveCount] = useState(0);
  const [agmLeaveCount, setAgmLeaveCount] = useState(0);
  const [ceoLeaveCount, setCeoLeaveCount] = useState(0);
  const [isApprover, setIsApprover] = useState(false);
  
  // Fetch notification category counts for sidebar indicators
  const { counts: notificationCounts } = useNotificationCategories(user?.id);
  
  // Fetch profile photo for sidebar display
  const { photoUrl } = useUserProfilePhoto(user?.id);

  // Check if user is an approver in any leave approval chain
  useEffect(() => {
    const checkIfApprover = async () => {
      if (!user?.position_id) {
        setIsApprover(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('leave_approval_hierarchy')
          .select('id')
          .eq('approver_position_id', user.position_id)
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setIsApprover(true);
        } else {
          setIsApprover(false);
        }
      } catch (err) {
        console.error('Error checking approver status:', err);
        setIsApprover(false);
      }
    };
    
    checkIfApprover();
  }, [user?.position_id]);

  useEffect(() => {
    // Fetch officer profile from Supabase if user is an officer
    const fetchOfficerProfile = async () => {
      if (user?.role === 'officer' && user?.id) {
        try {
          const { data, error } = await supabase
            .from('officers')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (!error && data) {
            // Map database fields to OfficerDetails interface
            setOfficerProfile({
              id: data.id,
              name: data.full_name,
              email: data.email,
              phone: data.phone || '',
              assigned_institutions: data.assigned_institutions || [],
              employment_type: data.employment_type as 'full_time' | 'part_time' | 'contract',
              salary: data.annual_salary || 0,
              join_date: data.join_date || '',
              status: data.status as 'active' | 'on_leave' | 'terminated',
              employee_id: data.employee_id || undefined,
              department: data.department || undefined,
              designation: data.designation || undefined,
              profile_photo_url: data.profile_photo_url || undefined,
            });
          }
        } catch (err) {
          console.error('Error fetching officer profile:', err);
        }
      }
    };
    
    fetchOfficerProfile();
    
    // Fetch teacher profile if user is a teacher
    if (user?.role === 'teacher' && user?.email) {
      const profile = getTeacherByEmail(user.email);
      setTeacherProfile(profile || null);
    }
    
    // Load pending leave counts and designation for system admin by position
    if (user?.role === 'system_admin') {
      // Fetch designation from profiles table
      const fetchDesignation = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('designation, position_name')
            .eq('id', user.id)
            .single();
          
          if (!error && data) {
            setStaffDesignation(data.designation || data.position_name || null);
          }
        } catch (err) {
          console.error('Error fetching staff designation:', err);
        }
      };
      fetchDesignation();
      
      // Manager sees manager_pending count
      if (user.position_name === 'manager') {
        setManagerLeaveCount(getPendingLeaveCountByStage('manager_pending'));
      }
      
      // AGM sees agm_pending count
      if (user.position_name === 'agm') {
        setAgmLeaveCount(getPendingLeaveCountByStage('agm_pending'));
      }
      
      // CEO sees ceo_pending count
      if (user.is_ceo) {
        setCeoLeaveCount(getPendingLeaveCountByStage('ceo_pending'));
      }
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        if (user.position_name === 'manager') {
          setManagerLeaveCount(getPendingLeaveCountByStage('manager_pending'));
        }
        if (user.position_name === 'agm') {
          setAgmLeaveCount(getPendingLeaveCountByStage('agm_pending'));
        }
        if (user.is_ceo) {
          setCeoLeaveCount(getPendingLeaveCountByStage('ceo_pending'));
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Get all user roles for multi-role filtering
  const userRoles = user?.roles || (user ? [user.role] : []);
  
  const visibleMenuItems = menuItems.filter((item) => {
    if (!user) return false;
    
    // Check if user has ANY of the item's allowed roles
    const hasMatchingRole = item.roles.some(r => userRoles.includes(r));
    if (!hasMatchingRole) return false;
    
    // If item requires system_admin role and user has it, check position permissions
    if (item.roles.includes('system_admin') && userRoles.includes('system_admin')) {
      // CEO-only items
      if (item.ceoOnly && !isCEO(user)) return false;
      
      // Feature-based items: Check DIRECTLY against user.allowed_features
      // This ensures sidebar visibility respects position settings even for super_admin users
      if (item.feature) {
        const userFeatures = user.allowed_features || [];
        if (!userFeatures.includes(item.feature)) return false;
      }
      
      // Leave Approval menu: only show if user is an approver in the approval chain
      if (item.feature === 'leave_approvals' && !isApprover) return false;
    }
    
    return true;
  });

  // Get base path for role-based routing (supports multi-role)
  const getFullPath = (path: string, itemRole?: UserRole) => {
    if (!user) return path;
    
    // Determine which role context to use for this menu item
    const roleForPath = itemRole || user.role;
    
    // Super admin routes
    if (roleForPath === 'super_admin' && userRoles.includes('super_admin')) {
      return `/super-admin${path}`;
    }

    // System admin routes
    if (roleForPath === 'system_admin' && userRoles.includes('system_admin')) {
      return `/system-admin${path}`;
    }

    // Teacher routes (with tenant path)
    if (roleForPath === 'teacher' && user.tenant_id) {
      const tenantStr = localStorage.getItem('tenant');
      const tenant = tenantStr ? JSON.parse(tenantStr) : null;
      const tenantSlug = tenant?.slug || 'default';
      return `/tenant/${tenantSlug}/teacher${path}`;
    }

    // Officer routes (with tenant path)
    if (roleForPath === 'officer' && user.tenant_id) {
      const tenantStr = localStorage.getItem('tenant');
      const tenant = tenantStr ? JSON.parse(tenantStr) : null;
      const tenantSlug = tenant?.slug || 'default';
      return `/tenant/${tenantSlug}/officer${path}`;
    }

    // Management routes (with tenant path) - merged institution admin
    if (roleForPath === 'management' && user.tenant_id) {
      const tenantStr = localStorage.getItem('tenant');
      const tenant = tenantStr ? JSON.parse(tenantStr) : null;
      const tenantSlug = tenant?.slug || 'default';
      return `/tenant/${tenantSlug}/management${path}`;
    }
    
    // Student routes (with tenant path)
    if (roleForPath === 'student' && user.tenant_id) {
      // Get tenant slug from localStorage
      const tenantStr = localStorage.getItem('tenant');
      const tenant = tenantStr ? JSON.parse(tenantStr) : null;
      const tenantSlug = tenant?.slug || 'default';
      return `/tenant/${tenantSlug}/student${path}`;
    }
    
    // For other roles, will be implemented in future phases
    return path;
  };

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-meta-dark text-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div className="flex h-16 items-center justify-between border-b border-meta-dark-lighter px-4">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden">
              <img 
                src={branding.logo_collapsed_url || logoImage} 
                alt="Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
            {branding.logo_expanded_url ? (
              <img 
                src={branding.logo_expanded_url} 
                alt="Site Logo" 
                className="h-8 max-w-[120px] object-contain" 
              />
            ) : (
              <span className="text-xl font-bold">Meta-INNOVA</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="text-white hover:bg-meta-dark-lighter hover:text-meta-accent ml-auto"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="text-white hover:bg-meta-dark-lighter hover:text-meta-accent"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {visibleMenuItems.map((item) => {
            // Determine the appropriate role for this item's path
            // For multi-role users, use the matching role from the item's roles
            const itemRole = item.roles.find(r => userRoles.includes(r));
            const fullPath = getFullPath(item.path, itemRole);
            const isActive = location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
            const showBadge = 
              (item.label === 'Manager Approvals' && managerLeaveCount > 0) ||
              (item.label === 'AGM Approvals' && agmLeaveCount > 0) ||
              (item.label === 'CEO Approvals' && ceoLeaveCount > 0);
            const badgeCount = 
              item.label === 'Manager Approvals' ? managerLeaveCount :
              item.label === 'AGM Approvals' ? agmLeaveCount :
              item.label === 'CEO Approvals' ? ceoLeaveCount : 0;
            
            // Check if this menu item has unread notifications
            const notificationCategory = MENU_NOTIFICATION_MAP[item.label];
            const hasUnreadNotifications = notificationCategory && notificationCounts[notificationCategory] > 0;
            
            return (
              <Link key={`${item.path}-${itemRole}`} to={fullPath}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-white hover:bg-meta-dark-lighter hover:text-meta-accent relative',
                    isActive && 'bg-meta-accent text-meta-dark hover:bg-meta-accent hover:text-meta-dark',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <div className="relative">
                    {item.icon}
                    {/* Notification indicator dot */}
                    {hasUnreadNotifications && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="ml-3">{item.label}</span>
                      {showBadge && (
                        <Badge variant="destructive" className="ml-auto">
                          {badgeCount}
                        </Badge>
                      )}
                      {/* Show notification dot on the right when not collapsed */}
                      {hasUnreadNotifications && !showBadge && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
                      )}
                    </>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t border-meta-dark-lighter">
        {userRoles.includes('officer') && officerProfile ? (
          <OfficerSidebarProfile officer={officerProfile} collapsed={collapsed} photoUrl={photoUrl} />
        ) : userRoles.includes('teacher') && teacherProfile ? (
          <TeacherSidebarProfile teacher={teacherProfile} collapsed={collapsed} photoUrl={photoUrl} />
        ) : user ? (
          // Profile card for other roles (management, student, system_admin, super_admin)
          <>
            <SidebarProfileCard
              userName={user.name || 'User'}
              photoUrl={photoUrl}
              subtitle={staffDesignation || user.position_name || (user.roles && user.roles.length > 1 
                ? user.roles.map(r => r.replace('_', ' ')).join(', ')
                : user.role?.replace('_', ' '))}
              profilePath={user.is_ceo ? getFullPath('/settings', 'system_admin' as UserRole) : getFullPath('/profile', user.role as UserRole)}
              collapsed={collapsed}
            />
          </>
        ) : null}
        
        {/* Logout Button with Notification Bell */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={cn(
                'flex-1 justify-start text-white hover:bg-red-600 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
            >
              <LogOut className="h-5 w-5" />
              {!collapsed && <span className="ml-3">Logout</span>}
            </Button>
            
            {!collapsed && user && ['system_admin', 'officer', 'student', 'management'].some(
              r => userRoles.includes(r as UserRole)
            ) && (
              <NotificationBell 
                userId={user.id} 
                userRole={user.role}
                notificationsPath={getFullPath('/notifications')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
