import { supabase } from '@/integrations/supabase/client';
import { notificationService } from './notification.service';
import { LeaveApplication } from '@/types/leave';
import { format } from 'date-fns';

// Helper to get tenant-aware route
const getTenantSlug = (): string => {
  try {
    const tenantStr = localStorage.getItem('tenant');
    const tenant = tenantStr ? JSON.parse(tenantStr) : null;
    return tenant?.slug || 'default';
  } catch {
    return 'default';
  }
};

// Generate role-aware notification links
const getNotificationLink = (role: string, path: string): string => {
  const slug = getTenantSlug();
  
  switch (role) {
    case 'system_admin':
      return `/system-admin${path}`;
    case 'super_admin':
      return `/super-admin${path}`;
    case 'officer':
      return `/tenant/${slug}/officer${path}`;
    case 'management':
      return `/tenant/${slug}/management${path}`;
    case 'teacher':
      return `/tenant/${slug}/teacher${path}`;
    case 'student':
      return `/tenant/${slug}/student${path}`;
    default:
      return path;
  }
};

export const leaveNotificationService = {
  /**
   * Notify first approver when a new leave application is submitted
   */
  notifyApproverOnSubmission: async (application: LeaveApplication): Promise<void> => {
    if (!application.approval_chain || application.approval_chain.length === 0) {
      console.log('No approval chain defined, skipping notification');
      return;
    }

    const firstApprover = application.approval_chain.find(a => a.order === 1);
    if (!firstApprover?.position_id) return;

    // Find users with the approver position
    const { data: approvers } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('position_id', firstApprover.position_id);

    if (!approvers || approvers.length === 0) {
      console.log('No approvers found for position:', firstApprover.position_name);
      return;
    }

    // Send notification to all users with the approver position
    for (const approver of approvers) {
      await notificationService.createNotification(
        approver.id,
        'system_admin',
        'leave_pending_approval',
        'New Leave Application',
        `${application.applicant_name} has submitted a ${application.leave_type} leave request from ${format(new Date(application.start_date), 'MMM dd')} to ${format(new Date(application.end_date), 'MMM dd, yyyy')} (${application.total_days} days)`,
        getNotificationLink('system_admin', '/leave-approvals'),
        {
          leave_application_id: application.id,
          applicant_name: application.applicant_name,
          leave_type: application.leave_type,
          start_date: application.start_date,
          end_date: application.end_date,
          total_days: application.total_days,
          approver_position: firstApprover.position_name
        }
      );
    }
  },

  /**
   * Notify next approver in chain after current level approval
   */
  notifyNextApprover: async (application: LeaveApplication, currentLevel: number): Promise<void> => {
    if (!application.approval_chain) return;

    const nextApprover = application.approval_chain.find(a => a.order === currentLevel + 1);
    if (!nextApprover?.position_id) return;

    const { data: approvers } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('position_id', nextApprover.position_id);

    if (!approvers || approvers.length === 0) return;

    for (const approver of approvers) {
      await notificationService.createNotification(
        approver.id,
        'system_admin',
        'leave_pending_approval',
        'Leave Application Pending Your Approval',
        `${application.applicant_name}'s ${application.leave_type} leave request requires your approval (${application.total_days} days: ${format(new Date(application.start_date), 'MMM dd')} - ${format(new Date(application.end_date), 'MMM dd')})`,
        getNotificationLink('system_admin', '/leave-approvals'),
        {
          leave_application_id: application.id,
          applicant_name: application.applicant_name,
          leave_type: application.leave_type,
          start_date: application.start_date,
          end_date: application.end_date,
          total_days: application.total_days,
          approver_position: nextApprover.position_name
        }
      );
    }
  },

  /**
   * Notify applicant when their leave is approved at any level
   */
  notifyApplicantOnApproval: async (application: LeaveApplication, approverName: string, isFinal: boolean): Promise<void> => {
    const title = isFinal ? 'Leave Application Approved' : 'Leave Application Progress';
    const message = isFinal 
      ? `Your ${application.leave_type} leave from ${format(new Date(application.start_date), 'MMM dd')} to ${format(new Date(application.end_date), 'MMM dd, yyyy')} has been approved by ${approverName}`
      : `Your ${application.leave_type} leave request has been approved by ${approverName}. Waiting for next level approval.`;

    const recipientRole = application.applicant_type === 'officer' ? 'officer' : 'system_admin';
    const path = application.applicant_type === 'officer' ? '/leave-management' : '/leave';

    await notificationService.createNotification(
      application.applicant_id,
      recipientRole,
      isFinal ? 'leave_application_approved' : 'leave_pending_approval',
      title,
      message,
      getNotificationLink(recipientRole, path),
      {
        leave_application_id: application.id,
        leave_type: application.leave_type,
        start_date: application.start_date,
        end_date: application.end_date,
        total_days: application.total_days
      }
    );
  },

  /**
   * Notify applicant when their leave is rejected
   */
  notifyApplicantOnRejection: async (application: LeaveApplication, rejectorName: string, reason: string): Promise<void> => {
    const recipientRole = application.applicant_type === 'officer' ? 'officer' : 'system_admin';
    const path = application.applicant_type === 'officer' ? '/leave-management' : '/leave';

    await notificationService.createNotification(
      application.applicant_id,
      recipientRole,
      'leave_application_rejected',
      'Leave Application Rejected',
      `Your ${application.leave_type} leave request from ${format(new Date(application.start_date), 'MMM dd')} to ${format(new Date(application.end_date), 'MMM dd, yyyy')} was rejected by ${rejectorName}. Reason: ${reason}`,
      getNotificationLink(recipientRole, path),
      {
        leave_application_id: application.id,
        leave_type: application.leave_type,
        start_date: application.start_date,
        end_date: application.end_date,
        rejection_reason: reason
      }
    );
  },

  /**
   * Notify management/institution admin when an officer is on approved leave
   */
  notifyManagementOnOfficerLeave: async (application: LeaveApplication): Promise<void> => {
    if (application.applicant_type !== 'officer' || !application.institution_id) return;

    // Get management users for the institution
    const { data: managementUsers } = await supabase
      .from('profiles')
      .select('id, name, position_id')
      .eq('institution_id', application.institution_id);

    // Get users with management role
    const { data: managementRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'management');

    const managementRoleUserIds = new Set(managementRoles?.map(r => r.user_id) || []);

    // Filter to management users in this institution
    const institutionManagers = managementUsers?.filter(u => 
      managementRoleUserIds.has(u.id) && u.id !== application.applicant_id
    ) || [];

    // Also notify system admins
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['system_admin', 'super_admin']);

    const allNotifyIds = new Set<string>();
    
    institutionManagers.forEach(m => allNotifyIds.add(m.id));
    adminRoles?.forEach(a => {
      if (a.user_id !== application.applicant_id) {
        allNotifyIds.add(a.user_id);
      }
    });

    for (const userId of allNotifyIds) {
      // Check user role to generate correct link
      const isManager = institutionManagers.some(m => m.id === userId);
      const role = isManager ? 'management' : 'system_admin';
      const path = isManager ? '/dashboard' : '/officers';

      await notificationService.createNotification(
        userId,
        role,
        'officer_on_leave',
        'Officer On Leave',
        `${application.applicant_name} will be on ${application.leave_type} leave from ${format(new Date(application.start_date), 'MMM dd')} to ${format(new Date(application.end_date), 'MMM dd, yyyy')} (${application.total_days} days). Reason: ${application.reason}`,
        getNotificationLink(role, path),
        {
          leave_application_id: application.id,
          officer_name: application.applicant_name,
          officer_id: application.officer_id,
          leave_type: application.leave_type,
          start_date: application.start_date,
          end_date: application.end_date,
          total_days: application.total_days,
          institution_id: application.institution_id,
          institution_name: application.institution_name,
          reason: application.reason
        }
      );
    }
  },

  /**
   * Notify substitutes when they are assigned to cover classes
   */
  notifySubstitutesOnAssignment: async (application: LeaveApplication): Promise<void> => {
    const substitutes = application.substitute_assignments;
    if (!substitutes || substitutes.length === 0) return;

    // Group by substitute officer to avoid duplicate notifications
    const substituteMap = new Map<string, typeof substitutes>();
    
    for (const sub of substitutes) {
      if (!sub.substitute_officer_id) continue;
      
      const existing = substituteMap.get(sub.substitute_officer_id) || [];
      existing.push(sub);
      substituteMap.set(sub.substitute_officer_id, existing);
    }

    // Find officer user_ids and send notifications
    for (const [officerId, assignments] of substituteMap) {
      // Try to find in officers table first
      const { data: officer } = await supabase
        .from('officers')
        .select('user_id, full_name')
        .eq('id', officerId)
        .single();

      // If not found in officers, it might be a profile id (for staff with positions)
      let userId = officer?.user_id;
      if (!userId) {
        // Check if it's a profile id directly
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', officerId)
          .single();
        
        if (profile) {
          userId = profile.id;
        }
      }

      if (!userId) continue;

      const classesText = assignments.map(a => 
        `${a.class_name || 'Class'} on ${format(new Date(a.date), 'PP')} (${a.period_label || 'Period'})`
      ).slice(0, 3).join(', ');

      const moreText = assignments.length > 3 ? ` and ${assignments.length - 3} more` : '';

      // Determine the recipient role
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      const recipientRole = roles?.some(r => r.role === 'officer') ? 'officer' : 'system_admin';
      const path = recipientRole === 'officer' ? '/timetable' : '/dashboard';

      await notificationService.createNotification(
        userId,
        recipientRole,
        'substitute_assigned',
        'Substitute Assignment',
        `You have been assigned to cover for ${application.applicant_name}: ${classesText}${moreText}`,
        getNotificationLink(recipientRole, path),
        {
          application_id: application.id,
          original_officer: application.applicant_name,
          assignments: assignments
        }
      );
    }
  },

  /**
   * Notify approvers about substitute assignments when leave is submitted
   */
  notifyApproversAboutSubstitutes: async (application: LeaveApplication): Promise<void> => {
    const substitutes = application.substitute_assignments;
    if (!substitutes || substitutes.length === 0) return;
    if (!application.approval_chain || application.approval_chain.length === 0) return;

    // Build substitute summary
    const substituteNames = [...new Set(substitutes.map(s => s.substitute_officer_name).filter(Boolean))];
    const classesCount = substitutes.length;
    
    const message = `Substitutes arranged for ${application.applicant_name}'s leave (${format(new Date(application.start_date), 'MMM dd')} - ${format(new Date(application.end_date), 'MMM dd')}): ${substituteNames.join(', ')} will cover ${classesCount} class${classesCount > 1 ? 'es' : ''}`;

    // Notify all approvers in the chain
    for (const approver of application.approval_chain) {
      if (!approver.position_id) continue;

      const { data: approvers } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('position_id', approver.position_id);

      if (!approvers) continue;

      for (const profile of approvers) {
        await notificationService.createNotification(
          profile.id,
          'system_admin',
          'substitute_info',
          'Substitute Arrangements for Leave',
          message,
          getNotificationLink('system_admin', '/leave-approvals'),
          {
            leave_application_id: application.id,
            applicant_name: application.applicant_name,
            substitute_names: substituteNames,
            classes_count: classesCount,
            start_date: application.start_date,
            end_date: application.end_date
          }
        );
      }
    }
  }
};
