import { supabase } from '@/integrations/supabase/client';
import { 
  LeaveApplication, 
  LeaveBalance, 
  CalculatedLeaveBalance,
  LeaveApprovalHierarchy,
  CreateLeaveApplicationInput,
  ApprovalHierarchyInput,
  ApprovalChainItem,
  LeaveType,
  LeaveStatus,
  UserType,
  MAX_LEAVES_PER_MONTH,
  SubstituteAssignment
} from '@/types/leave';
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns';
import { leaveNotificationService } from './leaveNotification.service';

// Helper to safely parse JSON fields
const parseApprovalChain = (data: unknown): ApprovalChainItem[] => {
  if (Array.isArray(data)) return data as ApprovalChainItem[];
  return [];
};

const parseSubstituteAssignments = (data: unknown): SubstituteAssignment[] => {
  if (Array.isArray(data)) return data as SubstituteAssignment[];
  return [];
};

// =============================================
// LEAVE BALANCE SERVICE
// =============================================

export const leaveBalanceService = {
  getBalance: async (userId: string, year: number, month: number): Promise<CalculatedLeaveBalance | null> => {
    const { data, error } = await supabase.rpc('get_leave_balance', {
      p_user_id: userId,
      p_year: year,
      p_month: month
    });

    if (error) throw error;
    return data?.[0] || null;
  },

  getYearlyBalances: async (userId: string, year: number): Promise<LeaveBalance[]> => {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('month', { ascending: true });

    if (error) throw error;
    return (data || []).map(b => ({
      ...b,
      user_type: b.user_type as UserType
    }));
  },

  initializeBalance: async (userId: string, userType: UserType, officerId: string | null, year: number, month: number): Promise<string> => {
    const { data, error } = await supabase.rpc('initialize_leave_balance', {
      p_user_id: userId,
      p_user_type: userType,
      p_officer_id: officerId,
      p_year: year,
      p_month: month
    });

    if (error) throw error;
    return data;
  },

  getAllBalances: async (year: number, month: number): Promise<LeaveBalance[]> => {
    const { data, error } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('year', year)
      .eq('month', month);

    if (error) throw error;
    return (data || []).map(b => ({
      ...b,
      user_type: b.user_type as UserType
    }));
  },

  // Update balance when leave is approved
  updateBalanceOnApproval: async (
    userId: string, 
    userType: UserType, 
    officerId: string | null, 
    startDate: string,
    leaveType: LeaveType, 
    days: number
  ): Promise<void> => {
    const startMonth = parseInt(format(parseISO(startDate), 'M'));
    const startYear = parseInt(format(parseISO(startDate), 'yyyy'));

    // Initialize balance if it doesn't exist
    await supabase.rpc('initialize_leave_balance', {
      p_user_id: userId,
      p_user_type: userType,
      p_officer_id: officerId,
      p_year: startYear,
      p_month: startMonth
    });

    // Get the current balance
    const { data: currentBalance, error: fetchError } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('year', startYear)
      .eq('month', startMonth)
      .single();

    if (fetchError) throw fetchError;
    if (!currentBalance) return;

    // Update based on leave type
    const updateField = leaveType === 'sick' ? 'sick_leave_used' : 'casual_leave_used';
    const currentUsed = leaveType === 'sick' ? currentBalance.sick_leave_used : currentBalance.casual_leave_used;
    const newUsed = currentUsed + days;
    const totalUsed = currentBalance.sick_leave_used + currentBalance.casual_leave_used + days;
    const totalAvailable = currentBalance.monthly_credit + currentBalance.carried_forward;
    const newRemaining = Math.max(0, totalAvailable - totalUsed);

    const { error: updateError } = await supabase
      .from('leave_balances')
      .update({
        [updateField]: newUsed,
        balance_remaining: newRemaining,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentBalance.id);

    if (updateError) throw updateError;
  }
};

// =============================================
// LEAVE APPLICATION SERVICE
// =============================================

export const leaveApplicationService = {
  // Calculate all calendar days (including weekends)
  calculateWorkingDays: (startDate: string, endDate: string): number => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    return days.length; // Count all calendar days
  },

  // Calculate leave days excluding holidays only (legacy)
  calculateLeaveDaysExcludingHolidays: (
    startDate: string,
    endDate: string,
    holidayDates: string[]
  ): { totalCalendarDays: number; holidaysInRange: number; actualLeaveDays: number } => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    const totalCalendarDays = days.length;

    // Count holidays that fall within the range
    const holidaysInRange = days.filter((day) =>
      holidayDates.some((hd) => format(parseISO(hd), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
    ).length;

    return {
      totalCalendarDays,
      holidaysInRange,
      actualLeaveDays: Math.max(0, totalCalendarDays - holidaysInRange),
    };
  },

  // Calculate actual working days excluding weekends AND holidays from calendar
  calculateActualWorkingDays: (
    startDate: string,
    endDate: string,
    weekendDates: string[],
    holidayDates: string[]
  ): number => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    
    // Count non-working days
    const nonWorkingDays = days.filter((day) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isWeekend = weekendDates.some((wd) => format(parseISO(wd), 'yyyy-MM-dd') === dayStr);
      const isHoliday = holidayDates.some((hd) => format(parseISO(hd), 'yyyy-MM-dd') === dayStr);
      return isWeekend || isHoliday;
    }).length;
    
    return Math.max(0, days.length - nonWorkingDays);
  },

  getApprovalChain: async (applicantType: UserType, applicantPositionId?: string | null): Promise<LeaveApprovalHierarchy[]> => {
    // For staff with a position, first try position-specific chain
    if (applicantType === 'staff' && applicantPositionId) {
      const { data: positionChain, error: posError } = await supabase
        .from('leave_approval_hierarchy')
        .select('*')
        .eq('applicant_type', applicantType)
        .eq('applicant_position_id', applicantPositionId)
        .order('approval_order', { ascending: true });
      
      if (!posError && positionChain && positionChain.length > 0) {
        return positionChain.map(h => ({
          ...h,
          applicant_type: h.applicant_type as UserType
        }));
      }
    }

    // Fall back to global chain (applicant_position_id IS NULL)
    const { data: globalChain, error } = await supabase
      .from('leave_approval_hierarchy')
      .select('*')
      .eq('applicant_type', applicantType)
      .is('applicant_position_id', null)
      .order('approval_order', { ascending: true });

    if (error) throw error;
    return (globalChain || []).map(h => ({
      ...h,
      applicant_type: h.applicant_type as UserType
    }));
  },

  applyLeave: async (input: CreateLeaveApplicationInput): Promise<LeaveApplication> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;

    // Check if user is an officer
    const { data: officer } = await supabase
      .from('officers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const isOfficer = !!officer;
    const applicantType: UserType = isOfficer ? 'officer' : 'staff';
    
    // Determine calendar type and institution ID for fetching non-working days
    const calendarType = isOfficer ? 'institution' : 'company';
    const calendarInstitutionId = isOfficer && officer?.assigned_institutions?.[0] 
      ? officer.assigned_institutions[0] 
      : undefined;
    
    // Fetch non-working days (weekends + holidays) from the appropriate calendar
    let totalDays: number;
    try {
      const { getNonWorkingDaysInRange } = await import('./calendarDayType.service');
      const nonWorkingDays = await getNonWorkingDaysInRange(
        calendarType as 'company' | 'institution',
        input.start_date,
        input.end_date,
        calendarInstitutionId
      );
      
      totalDays = leaveApplicationService.calculateActualWorkingDays(
        input.start_date,
        input.end_date,
        nonWorkingDays.weekends,
        nonWorkingDays.holidays
      );
    } catch (error) {
      // Fallback to simple calendar day count if calendar service fails
      console.warn('Failed to fetch calendar data, using all calendar days:', error);
      totalDays = leaveApplicationService.calculateWorkingDays(input.start_date, input.end_date);
    }

    // Get approval chain
    const hierarchyChain = await leaveApplicationService.getApprovalChain(
      applicantType, 
      applicantType === 'staff' ? profile.position_id : null
    );

    const approvalChain: ApprovalChainItem[] = [];
    for (const h of hierarchyChain) {
      const { data: position } = await supabase
        .from('positions')
        .select('position_name, display_name')
        .eq('id', h.approver_position_id)
        .single();

      approvalChain.push({
        position_id: h.approver_position_id,
        position_name: position?.display_name || position?.position_name || 'Unknown',
        order: h.approval_order,
        status: 'pending'
      });
    }

    // Calculate balance and LOP
    const startMonth = parseInt(format(parseISO(input.start_date), 'M'));
    const startYear = parseInt(format(parseISO(input.start_date), 'yyyy'));
    const balance = await leaveBalanceService.getBalance(user.id, startYear, startMonth);
    
    // Fetch already approved leaves for this month to calculate actual available balance
    const monthStart = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;
    const monthEnd = `${startYear}-${String(startMonth).padStart(2, '0')}-31`;
    const { data: approvedLeaves } = await supabase
      .from('leave_applications')
      .select('paid_days')
      .eq('applicant_id', user.id)
      .eq('status', 'approved')
      .gte('start_date', monthStart)
      .lte('start_date', monthEnd);

    // Calculate used paid days from approved leaves
    const usedPaidDays = (approvedLeaves || []).reduce((sum, l) => sum + (l.paid_days || 0), 0);
    
    let paidDays = totalDays;
    let lopDays = 0;
    let isLop = false;

    if (balance) {
      // Subtract already used paid days from balance to get actual available
      const baseAvailable = Math.min(balance.balance_remaining, MAX_LEAVES_PER_MONTH - balance.total_used);
      const actualAvailable = Math.max(0, baseAvailable - usedPaidDays);
      
      if (totalDays > actualAvailable) {
        paidDays = Math.max(actualAvailable, 0);
        lopDays = totalDays - paidDays;
        isLop = lopDays > 0;
      }
    }

    let institutionId = profile.institution_id;
    let institutionName: string | null = null;

    if (isOfficer && officer?.assigned_institutions?.[0]) {
      institutionId = officer.assigned_institutions[0];
      const { data: inst } = await supabase
        .from('institutions')
        .select('name')
        .eq('id', institutionId)
        .single();
      institutionName = inst?.name || null;
    }

    const insertData = {
      applicant_id: user.id,
      applicant_name: profile.name,
      applicant_type: applicantType,
      officer_id: officer?.id || null,
      institution_id: institutionId,
      institution_name: institutionName,
      position_id: profile.position_id,
      position_name: profile.position_name,
      start_date: input.start_date,
      end_date: input.end_date,
      leave_type: input.leave_type,
      reason: input.reason,
      total_days: totalDays,
      is_lop: isLop,
      lop_days: lopDays,
      paid_days: paidDays,
      approval_chain: JSON.parse(JSON.stringify(approvalChain)),
      substitute_assignments: JSON.parse(JSON.stringify(input.substitute_assignments || []))
    };

    const { data, error } = await supabase
      .from('leave_applications')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    
    const result: LeaveApplication = {
      ...data,
      leave_type: data.leave_type as LeaveType,
      status: data.status as LeaveStatus,
      applicant_type: data.applicant_type as UserType,
      approval_chain: parseApprovalChain(data.approval_chain),
      substitute_assignments: parseSubstituteAssignments(data.substitute_assignments)
    };

    // Send notification to first approver
    try {
      await leaveNotificationService.notifyApproverOnSubmission(result);
      
      // Notify approvers about substitute assignments (NOT the substitutes yet - wait for approval)
      if (result.substitute_assignments && result.substitute_assignments.length > 0) {
        await leaveNotificationService.notifyApproversAboutSubstitutes(result);
      }
    } catch (notifError) {
      console.error('Failed to send submission notification:', notifError);
    }

    return result;
  },

  getMyApplications: async (): Promise<LeaveApplication[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('applicant_id', user.id)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(app => ({
      ...app,
      leave_type: app.leave_type as LeaveType,
      status: app.status as LeaveStatus,
      applicant_type: app.applicant_type as UserType,
      approval_chain: parseApprovalChain(app.approval_chain),
      substitute_assignments: parseSubstituteAssignments(app.substitute_assignments)
    }));
  },

  getPendingApplications: async (): Promise<LeaveApplication[]> => {
    const { data, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('status', 'pending')
      .order('applied_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(app => ({
      ...app,
      leave_type: app.leave_type as LeaveType,
      status: app.status as LeaveStatus,
      applicant_type: app.applicant_type as UserType,
      approval_chain: parseApprovalChain(app.approval_chain),
      substitute_assignments: parseSubstituteAssignments(app.substitute_assignments)
    }));
  },

  // Get pending applications for a specific approval level
  getPendingByApprovalLevel: async (level: number): Promise<LeaveApplication[]> => {
    const { data, error } = await supabase
      .from('leave_applications')
      .select('*')
      .eq('status', 'pending')
      .eq('current_approval_level', level)
      .order('applied_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(app => ({
      ...app,
      leave_type: app.leave_type as LeaveType,
      status: app.status as LeaveStatus,
      applicant_type: app.applicant_type as UserType,
      approval_chain: parseApprovalChain(app.approval_chain),
      substitute_assignments: parseSubstituteAssignments(app.substitute_assignments)
    }));
  },

  // Get pending applications for Project Manager (level 1)
  getManagerPendingApplications: async (): Promise<LeaveApplication[]> => {
    return leaveApplicationService.getPendingByApprovalLevel(1);
  },

  // Get pending applications for CEO (level 2)
  getCEOPendingApplications: async (): Promise<LeaveApplication[]> => {
    return leaveApplicationService.getPendingByApprovalLevel(2);
  },

  getAllApplications: async (filters?: { status?: LeaveStatus; year?: number; applicantType?: UserType }): Promise<LeaveApplication[]> => {
    let query = supabase.from('leave_applications').select('*').order('applied_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.year) query = query.gte('start_date', `${filters.year}-01-01`).lte('start_date', `${filters.year}-12-31`);
    if (filters?.applicantType) query = query.eq('applicant_type', filters.applicantType);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(app => ({
      ...app,
      leave_type: app.leave_type as LeaveType,
      status: app.status as LeaveStatus,
      applicant_type: app.applicant_type as UserType,
      approval_chain: parseApprovalChain(app.approval_chain),
      substitute_assignments: parseSubstituteAssignments(app.substitute_assignments)
    }));
  },

  approveApplication: async (id: string, comments?: string): Promise<LeaveApplication> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('name, position_id').eq('id', user.id).single();
    const { data: app, error: appError } = await supabase.from('leave_applications').select('*').eq('id', id).single();
    if (appError) throw appError;

    const approvalChain = parseApprovalChain(app.approval_chain);
    const currentLevel = app.current_approval_level;

    const updatedChain = approvalChain.map(a => {
      if (a.order === currentLevel) {
        return { ...a, status: 'approved' as const, approved_by: user.id, approved_by_name: profile?.name || 'Unknown', approved_at: new Date().toISOString(), comments };
      }
      return a;
    });

    const nextLevel = approvalChain.find(a => a.order === currentLevel + 1);
    const isFinalApproval = !nextLevel;

    const updateData: Record<string, unknown> = {
      approval_chain: JSON.parse(JSON.stringify(updatedChain)),
      current_approval_level: isFinalApproval ? currentLevel : currentLevel + 1
    };

    if (isFinalApproval) {
      updateData.status = 'approved';
      updateData.final_approved_by = user.id;
      updateData.final_approved_by_name = profile?.name;
      updateData.final_approved_at = new Date().toISOString();
    }

    const { data, error } = await supabase.from('leave_applications').update(updateData).eq('id', id).select().single();
    if (error) throw error;

    const result: LeaveApplication = {
      ...data,
      leave_type: data.leave_type as LeaveType,
      status: data.status as LeaveStatus,
      applicant_type: data.applicant_type as UserType,
      approval_chain: parseApprovalChain(data.approval_chain),
      substitute_assignments: parseSubstituteAssignments(data.substitute_assignments)
    };

    // Update leave balance when leave is finally approved using backend function
    if (isFinalApproval) {
      try {
        await supabase.rpc('apply_leave_application_to_balance', {
          p_application_id: result.id
        });
      } catch (balanceError) {
        console.error('Failed to update leave balance:', balanceError);
      }
    }

    // Send notifications
    try {
      // Notify applicant
      await leaveNotificationService.notifyApplicantOnApproval(result, profile?.name || 'Approver', isFinalApproval);
      
      if (isFinalApproval) {
        // Notify management when leave is finally approved
        await leaveNotificationService.notifyManagementOnOfficerLeave(result);
        
        // Notify substitutes about their assignment (only after final approval)
        if (result.substitute_assignments && result.substitute_assignments.length > 0) {
          await leaveNotificationService.notifySubstitutesOnAssignment(result);
        }
      } else {
        // Notify next approver
        await leaveNotificationService.notifyNextApprover(result, currentLevel);
      }
    } catch (notifError) {
      console.error('Failed to send approval notification:', notifError);
    }

    return result;
  },

  rejectApplication: async (id: string, reason: string): Promise<LeaveApplication> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
    const { data: app, error: appError } = await supabase.from('leave_applications').select('*').eq('id', id).single();
    if (appError) throw appError;

    const approvalChain = parseApprovalChain(app.approval_chain);
    const currentLevel = app.current_approval_level;

    const updatedChain = approvalChain.map(a => {
      if (a.order === currentLevel) {
        return { ...a, status: 'rejected' as const, approved_by: user.id, approved_by_name: profile?.name || 'Unknown', approved_at: new Date().toISOString(), comments: reason };
      }
      return a;
    });

    const { data, error } = await supabase
      .from('leave_applications')
      .update({
        status: 'rejected',
        approval_chain: JSON.parse(JSON.stringify(updatedChain)),
        rejection_reason: reason,
        rejected_by: user.id,
        rejected_by_name: profile?.name,
        rejected_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const result: LeaveApplication = {
      ...data,
      leave_type: data.leave_type as LeaveType,
      status: data.status as LeaveStatus,
      applicant_type: data.applicant_type as UserType,
      approval_chain: parseApprovalChain(data.approval_chain),
      substitute_assignments: parseSubstituteAssignments(data.substitute_assignments)
    };

    // Notify applicant of rejection
    try {
      await leaveNotificationService.notifyApplicantOnRejection(result, profile?.name || 'Approver', reason);
    } catch (notifError) {
      console.error('Failed to send rejection notification:', notifError);
    }

    return result;
  },

  cancelApplication: async (id: string): Promise<void> => {
    const { error } = await supabase.from('leave_applications').update({ status: 'cancelled' }).eq('id', id);
    if (error) throw error;
  }
};

// =============================================
// LEAVE APPROVAL HIERARCHY SERVICE
// =============================================

export const approvalHierarchyService = {
  getAll: async (): Promise<LeaveApprovalHierarchy[]> => {
    const { data, error } = await supabase.from('leave_approval_hierarchy').select('*').order('applicant_type').order('approval_order');
    if (error) throw error;
    return (data || []).map(h => ({ ...h, applicant_type: h.applicant_type as UserType }));
  },

  create: async (input: ApprovalHierarchyInput): Promise<LeaveApprovalHierarchy> => {
    const { data, error } = await supabase.from('leave_approval_hierarchy').insert(input).select().single();
    if (error) throw error;
    return { ...data, applicant_type: data.applicant_type as UserType };
  },

  update: async (id: string, input: Partial<ApprovalHierarchyInput>): Promise<LeaveApprovalHierarchy> => {
    const { data, error } = await supabase.from('leave_approval_hierarchy').update(input).eq('id', id).select().single();
    if (error) throw error;
    return { ...data, applicant_type: data.applicant_type as UserType };
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('leave_approval_hierarchy').delete().eq('id', id);
    if (error) throw error;
  },

  setHierarchy: async (applicantType: UserType, positionId: string | null, approvers: { positionId: string; order: number; isFinal: boolean }[]): Promise<void> => {
    let deleteQuery = supabase.from('leave_approval_hierarchy').delete().eq('applicant_type', applicantType);
    if (applicantType === 'staff' && positionId) deleteQuery = deleteQuery.eq('applicant_position_id', positionId);
    else if (applicantType === 'officer') deleteQuery = deleteQuery.is('applicant_position_id', null);
    await deleteQuery;

    if (approvers.length > 0) {
      const { error } = await supabase.from('leave_approval_hierarchy').insert(
        approvers.map(a => ({
          applicant_type: applicantType,
          applicant_position_id: applicantType === 'staff' ? positionId : null,
          approver_position_id: a.positionId,
          approval_order: a.order,
          is_final_approver: a.isFinal
        }))
      );
      if (error) throw error;
    }
  }
};
