import type { LeaveApplication, LeaveBalance } from "@/types/attendance";
import { createNotification, createNotificationForSystemAdmin } from '@/hooks/useNotifications';

// ========================================
// LOCALSTORAGE KEYS
// ========================================
const LEAVE_APPLICATIONS_KEY = 'all_leave_applications';
const LEAVE_BALANCES_KEY = 'leave_balances';

// ========================================
// MOCK DATA (Initial seed data)
// ========================================
const mockLeaveApplications: LeaveApplication[] = [
  // Mr. Atif Ansari - Modern School Vasant Vihar
  {
    id: "leave-msd-001",
    officer_id: "off-msd-001",
    officer_name: "Mr. Atif Ansari",
    applicant_type: "innovation_officer",
    approval_stage: "approved",
    start_date: "2025-01-20",
    end_date: "2025-01-22",
    leave_type: "casual",
    reason: "Family wedding ceremony",
    total_days: 3,
    status: "approved",
    applied_at: "2025-01-10T10:00:00Z",
    approved_by_manager: "Operations Manager",
    approved_by_manager_at: "2025-01-10T16:00:00Z",
    approved_by_agm: "AGM Operations",
    approved_by_agm_at: "2025-01-11T10:00:00Z",
    reviewed_by: "AGM Operations",
    reviewed_at: "2025-01-11T14:30:00Z",
  },
  {
    id: "leave-msd-002",
    officer_id: "off-msd-001",
    officer_name: "Mr. Atif Ansari",
    applicant_type: "innovation_officer",
    approval_stage: "manager_pending",
    start_date: "2025-02-15",
    end_date: "2025-02-16",
    leave_type: "sick",
    reason: "Medical checkup",
    total_days: 2,
    status: "pending",
    applied_at: "2025-02-10T09:00:00Z",
  },
  // Mr. Saran T - Kikani Global Academy
  {
    id: "leave-kga-001",
    officer_id: "off-kga-001",
    officer_name: "Mr. Saran T",
    applicant_type: "innovation_officer",
    approval_stage: "approved",
    start_date: "2025-01-05",
    end_date: "2025-01-07",
    leave_type: "earned",
    reason: "Personal work",
    total_days: 3,
    status: "approved",
    applied_at: "2024-12-28T10:00:00Z",
    approved_by_manager: "Operations Manager",
    approved_by_manager_at: "2024-12-28T15:00:00Z",
    approved_by_agm: "AGM Operations",
    approved_by_agm_at: "2024-12-29T09:00:00Z",
    reviewed_by: "AGM Operations",
    reviewed_at: "2024-12-29T11:00:00Z",
  },
  {
    id: "leave-kga-002",
    officer_id: "off-kga-001",
    officer_name: "Mr. Saran T",
    applicant_type: "innovation_officer",
    approval_stage: "rejected",
    rejection_stage: "manager",
    start_date: "2025-02-20",
    end_date: "2025-02-21",
    leave_type: "casual",
    reason: "Family function",
    total_days: 2,
    status: "rejected",
    applied_at: "2025-02-12T10:00:00Z",
    rejected_by: "Operations Manager",
    rejected_at: "2025-02-13T15:00:00Z",
    reviewed_by: "Operations Manager",
    reviewed_at: "2025-02-13T15:00:00Z",
    rejection_reason: "Critical classes scheduled during this period. Please reschedule.",
  },
  {
    id: "leave-kga-003",
    officer_id: "off-kga-001",
    officer_name: "Mr. Saran T",
    applicant_type: "innovation_officer",
    approval_stage: "approved",
    start_date: "2025-03-10",
    end_date: "2025-03-12",
    leave_type: "sick",
    reason: "Medical treatment",
    total_days: 3,
    status: "approved",
    applied_at: "2025-03-05T08:00:00Z",
    approved_by_manager: "Operations Manager",
    approved_by_manager_at: "2025-03-05T11:00:00Z",
    approved_by_agm: "AGM Operations",
    approved_by_agm_at: "2025-03-05T14:00:00Z",
    reviewed_by: "AGM Operations",
    reviewed_at: "2025-03-05T16:00:00Z",
  },
  // Mr. Sreeram R - Kikani Global Academy
  {
    id: "leave-kga-004",
    officer_id: "off-kga-002",
    officer_name: "Mr. Sreeram R",
    applicant_type: "innovation_officer",
    approval_stage: "approved",
    start_date: "2025-01-25",
    end_date: "2025-01-27",
    leave_type: "earned",
    reason: "Personal travel",
    total_days: 3,
    status: "approved",
    applied_at: "2025-01-15T10:00:00Z",
    approved_by_manager: "Operations Manager",
    approved_by_manager_at: "2025-01-15T14:00:00Z",
    approved_by_agm: "AGM Operations",
    approved_by_agm_at: "2025-01-16T10:00:00Z",
    reviewed_by: "AGM Operations",
    reviewed_at: "2025-01-16T11:30:00Z",
  },
  // Meta Staff Leave Applications
  {
    id: "leave-meta-001",
    officer_id: "7",
    officer_name: "Managing Director",
    applicant_type: "meta_staff",
    position: "md",
    approval_stage: "ceo_pending",
    start_date: "2025-02-10",
    end_date: "2025-02-12",
    leave_type: "earned",
    reason: "Conference attendance",
    total_days: 3,
    status: "pending",
    applied_at: "2025-02-01T10:00:00Z",
  },
  {
    id: "leave-meta-002",
    officer_id: "8",
    officer_name: "Operations Manager",
    applicant_type: "meta_staff",
    position: "manager",
    approval_stage: "approved",
    start_date: "2025-01-15",
    end_date: "2025-01-17",
    leave_type: "casual",
    reason: "Family emergency",
    total_days: 3,
    status: "approved",
    applied_at: "2025-01-08T09:00:00Z",
    reviewed_by: "System Admin CEO",
    reviewed_at: "2025-01-09T11:00:00Z",
  },
];

// Mock leave balances (initial seed)
const mockLeaveBalances: LeaveBalance[] = [
  // Innovation Officers
  { officer_id: "off-msd-001", sick_leave: 8, casual_leave: 10, earned_leave: 15, year: "2025" },
  { officer_id: "off-kga-001", sick_leave: 10, casual_leave: 12, earned_leave: 18, year: "2025" },
  { officer_id: "off-kga-002", sick_leave: 10, casual_leave: 12, earned_leave: 18, year: "2025" },
  // Meta Staff
  { officer_id: "6", sick_leave: 11, casual_leave: 11, earned_leave: 12, year: "2025" },
  { officer_id: "7", sick_leave: 11, casual_leave: 11, earned_leave: 12, year: "2025" },
  { officer_id: "9", sick_leave: 12, casual_leave: 12, earned_leave: 12, year: "2025" },
  { officer_id: "10", sick_leave: 12, casual_leave: 12, earned_leave: 12, year: "2025" },
  { officer_id: "8", sick_leave: 12, casual_leave: 12, earned_leave: 12, year: "2025" },
  { officer_id: "11", sick_leave: 12, casual_leave: 12, earned_leave: 12, year: "2025" },
];

// ========================================
// CENTRALIZED LOCALSTORAGE FUNCTIONS
// ========================================

/**
 * Load all leave applications from localStorage (centralized store)
 */
export const loadAllLeaveApplications = (): LeaveApplication[] => {
  const stored = localStorage.getItem(LEAVE_APPLICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse leave applications from localStorage", e);
    }
  }
  // Initialize from mock data if empty
  localStorage.setItem(LEAVE_APPLICATIONS_KEY, JSON.stringify(mockLeaveApplications));
  return [...mockLeaveApplications];
};

/**
 * Save all leave applications to localStorage (centralized store)
 */
export const saveAllLeaveApplications = (applications: LeaveApplication[]): void => {
  localStorage.setItem(LEAVE_APPLICATIONS_KEY, JSON.stringify(applications));
};

/**
 * Load all leave balances from localStorage
 */
export const loadLeaveBalances = (): LeaveBalance[] => {
  const stored = localStorage.getItem(LEAVE_BALANCES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse leave balances from localStorage", e);
    }
  }
  // Initialize from mock data if empty
  localStorage.setItem(LEAVE_BALANCES_KEY, JSON.stringify(mockLeaveBalances));
  return [...mockLeaveBalances];
};

/**
 * Save all leave balances to localStorage
 */
export const saveLeaveBalances = (balances: LeaveBalance[]): void => {
  localStorage.setItem(LEAVE_BALANCES_KEY, JSON.stringify(balances));
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get leave applications for a specific officer
 */
export const getLeaveApplicationsByOfficer = (officerId: string): LeaveApplication[] => {
  const allApps = loadAllLeaveApplications();
  return allApps.filter((app) => app.officer_id === officerId);
};

/**
 * Initialize or update leave balance for a user
 */
export const initializeLeaveBalance = (balance: LeaveBalance): void => {
  const balances = loadLeaveBalances();
  const existingIndex = balances.findIndex(
    (b) => b.officer_id === balance.officer_id && b.year === balance.year
  );
  
  if (existingIndex >= 0) {
    balances[existingIndex] = balance;
  } else {
    balances.push(balance);
  }
  
  saveLeaveBalances(balances);
};

/**
 * Get leave balance for an officer
 */
export const getLeaveBalance = (officerId: string, year: string): LeaveBalance => {
  const balances = loadLeaveBalances();
  const balance = balances.find(
    (b) => b.officer_id === officerId && b.year === year
  );
  
  return balance || {
    officer_id: officerId,
    sick_leave: 10,
    casual_leave: 12,
    earned_leave: 18,
    year,
  };
};

/**
 * Add a new leave application
 */
export const addLeaveApplication = (application: LeaveApplication): void => {
  const allApps = loadAllLeaveApplications();
  allApps.push(application);
  saveAllLeaveApplications(allApps);
  
  // Create notification for appropriate approver
  if (application.applicant_type === 'innovation_officer') {
    createNotificationForSystemAdmin(
      'leave_application_submitted',
      'New Leave Application',
      `${application.officer_name} has applied for ${application.leave_type} leave (${application.total_days} days)`,
      '/system-admin/manager-approvals',
      {
        leave_application_id: application.id,
        officer_id: application.officer_id,
        officer_name: application.officer_name,
        leave_type: application.leave_type,
        start_date: application.start_date,
        end_date: application.end_date,
        total_days: application.total_days,
      }
    );
  } else {
    // Meta staff - notify CEO
    createNotificationForSystemAdmin(
      'leave_application_submitted',
      'New Meta Staff Leave Application',
      `${application.officer_name} has applied for ${application.leave_type} leave (${application.total_days} days)`,
      '/system-admin/ceo-approvals',
      {
        leave_application_id: application.id,
        officer_id: application.officer_id,
        officer_name: application.officer_name,
        leave_type: application.leave_type,
        start_date: application.start_date,
        end_date: application.end_date,
        total_days: application.total_days,
      }
    );
  }
};

/**
 * Check if a date is on approved leave
 */
export const isDateOnLeave = (officerId: string, date: string): boolean => {
  const applications = getLeaveApplicationsByOfficer(officerId);
  const approvedApps = applications.filter((app) => app.status === "approved");
  
  return approvedApps.some((app) => {
    return date >= app.start_date && date <= app.end_date;
  });
};

/**
 * Get all approved leave dates for an officer
 */
export const getApprovedLeaveDates = (officerId: string): string[] => {
  const applications = getLeaveApplicationsByOfficer(officerId);
  const approvedApps = applications.filter((app) => app.status === "approved");
  
  const dates: string[] = [];
  approvedApps.forEach((app) => {
    const startDate = new Date(app.start_date);
    const endDate = new Date(app.end_date);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split("T")[0]);
    }
  });
  
  return dates;
};

/**
 * Get leave details for a specific date
 */
export const getTodayLeaveDetails = (
  officerId: string,
  date: string
): LeaveApplication | null => {
  const applications = getLeaveApplicationsByOfficer(officerId);
  const approvedApps = applications.filter((app) => app.status === "approved");
  
  return (
    approvedApps.find((app) => date >= app.start_date && date <= app.end_date) || null
  );
};

// ========================================
// GLOBAL LEAVE MANAGEMENT FUNCTIONS
// ========================================

/**
 * Get all leave applications (alias for loadAllLeaveApplications)
 */
export const getAllLeaveApplications = (): LeaveApplication[] => {
  return loadAllLeaveApplications();
};

/**
 * Get all pending leave applications
 */
export const getAllPendingLeaveApplications = (): LeaveApplication[] => {
  const allApps = loadAllLeaveApplications();
  return allApps.filter((app) => app.status === "pending").sort((a, b) => 
    new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
  );
};

/**
 * Get pending leave count
 */
export const getPendingLeaveCount = (): number => {
  return getAllPendingLeaveApplications().length;
};

/**
 * Get leave application by ID
 */
export const getLeaveApplicationById = (id: string): LeaveApplication | null => {
  const allApps = loadAllLeaveApplications();
  return allApps.find((app) => app.id === id) || null;
};

/**
 * Approve leave application (generic)
 */
export const approveLeaveApplication = (
  id: string,
  reviewerName: string,
  comments?: string
): void => {
  const allApps = loadAllLeaveApplications();
  const appIndex = allApps.findIndex((app) => app.id === id);
  
  if (appIndex !== -1) {
    allApps[appIndex].status = "approved";
    allApps[appIndex].reviewed_by = reviewerName;
    allApps[appIndex].reviewed_at = new Date().toISOString();
    allApps[appIndex].admin_comments = comments;
    
    saveAllLeaveApplications(allApps);
    
    // Notify the officer
    const app = allApps[appIndex];
    const userRole = app.applicant_type === 'innovation_officer' ? 'officer' : 'system_admin';
    const redirectPath = app.applicant_type === 'innovation_officer' 
      ? '/officer/leave-management' 
      : '/system-admin/leave-management';
    
    createNotification(
      app.officer_id,
      userRole,
      'leave_application_approved',
      'Leave Application Approved',
      `Your ${app.leave_type} leave application has been approved by ${reviewerName}`,
      redirectPath,
      {
        leave_application_id: id,
        leave_type: app.leave_type,
        start_date: app.start_date,
        end_date: app.end_date,
      }
    );
  }
};

/**
 * Reject leave application (generic)
 */
export const rejectLeaveApplication = (
  id: string,
  reviewerName: string,
  rejectionReason: string
): void => {
  const allApps = loadAllLeaveApplications();
  const appIndex = allApps.findIndex((app) => app.id === id);
  
  if (appIndex !== -1) {
    allApps[appIndex].status = "rejected";
    allApps[appIndex].reviewed_by = reviewerName;
    allApps[appIndex].reviewed_at = new Date().toISOString();
    allApps[appIndex].rejection_reason = rejectionReason;
    
    saveAllLeaveApplications(allApps);
    
    // Notify the officer
    const app = allApps[appIndex];
    const userRole = app.applicant_type === 'innovation_officer' ? 'officer' : 'system_admin';
    const redirectPath = app.applicant_type === 'innovation_officer' 
      ? '/officer/leave-management' 
      : '/system-admin/leave-management';
    
    createNotification(
      app.officer_id,
      userRole,
      'leave_application_rejected',
      'Leave Application Rejected',
      `Your ${app.leave_type} leave application has been rejected by ${reviewerName}`,
      redirectPath,
      {
        leave_application_id: id,
        leave_type: app.leave_type,
        rejection_reason: rejectionReason,
      }
    );
  }
};

/**
 * Cancel leave application
 */
export const cancelLeaveApplication = (id: string, officerId: string): void => {
  const allApps = loadAllLeaveApplications();
  const filteredApps = allApps.filter((app) => app.id !== id);
  saveAllLeaveApplications(filteredApps);
};

// ========================================
// HIERARCHICAL APPROVAL FUNCTIONS
// ========================================

/**
 * Manager approves Innovation Officer leave (first stage)
 * Moves to AGM pending stage
 */
export const approveLeaveApplicationManager = (
  id: string,
  managerName: string,
  comments?: string
): void => {
  const allApps = loadAllLeaveApplications();
  const appIndex = allApps.findIndex((app) => app.id === id);
  
  if (appIndex !== -1) {
    allApps[appIndex].approval_stage = "agm_pending";
    allApps[appIndex].approved_by_manager = managerName;
    allApps[appIndex].approved_by_manager_at = new Date().toISOString();
    allApps[appIndex].manager_comments = comments;
    
    saveAllLeaveApplications(allApps);
    
    // Notify the officer
    createNotification(
      allApps[appIndex].officer_id,
      'officer',
      'leave_application_approved',
      'Leave Application - Manager Approved',
      `Your ${allApps[appIndex].leave_type} leave has been approved by ${managerName}. Awaiting AGM approval.`,
      '/officer/leave-management',
      {
        leave_application_id: id,
        leave_type: allApps[appIndex].leave_type,
        start_date: allApps[appIndex].start_date,
        end_date: allApps[appIndex].end_date,
      }
    );
  }
};

/**
 * AGM approves Innovation Officer leave (final stage)
 * Marks as fully approved and deducts leave balance
 */
export const approveLeaveApplicationAGM = (
  id: string,
  agmName: string,
  comments?: string
): void => {
  const allApps = loadAllLeaveApplications();
  const appIndex = allApps.findIndex((app) => app.id === id);
  
  if (appIndex !== -1) {
    const app = allApps[appIndex];
    
    allApps[appIndex].status = "approved";
    allApps[appIndex].approval_stage = "approved";
    allApps[appIndex].approved_by_agm = agmName;
    allApps[appIndex].approved_by_agm_at = new Date().toISOString();
    allApps[appIndex].agm_comments = comments;
    allApps[appIndex].reviewed_by = agmName;
    allApps[appIndex].reviewed_at = new Date().toISOString();
    
    // Deduct leave balance
    const balance = getLeaveBalance(app.officer_id, "2025");
    if (app.leave_type === "casual") {
      balance.casual_leave = Math.max(0, balance.casual_leave - app.total_days);
    } else if (app.leave_type === "sick") {
      balance.sick_leave = Math.max(0, balance.sick_leave - app.total_days);
    } else if (app.leave_type === "earned") {
      balance.earned_leave = Math.max(0, balance.earned_leave - app.total_days);
    }
    initializeLeaveBalance(balance);
    
    saveAllLeaveApplications(allApps);
    
    // Notify the officer
    createNotification(
      app.officer_id,
      'officer',
      'leave_application_approved',
      'Leave Application Fully Approved',
      `Your ${app.leave_type} leave has been fully approved by ${agmName}`,
      '/officer/leave-management',
      {
        leave_application_id: id,
        leave_type: app.leave_type,
        start_date: app.start_date,
        end_date: app.end_date,
      }
    );
  }
};

/**
 * CEO approves Meta Staff leave (final stage)
 * Marks as fully approved and deducts leave balance
 */
export const approveLeaveApplicationCEO = (
  id: string,
  ceoName: string,
  comments?: string
): void => {
  const allApps = loadAllLeaveApplications();
  const appIndex = allApps.findIndex((app) => app.id === id);
  
  if (appIndex !== -1) {
    const app = allApps[appIndex];
    
    allApps[appIndex].status = "approved";
    allApps[appIndex].approval_stage = "approved";
    allApps[appIndex].reviewed_by = ceoName;
    allApps[appIndex].reviewed_at = new Date().toISOString();
    allApps[appIndex].admin_comments = comments;
    
    // Deduct leave balance for meta staff
    const balance = getLeaveBalance(app.officer_id, "2025");
    if (app.leave_type === "casual") {
      balance.casual_leave = Math.max(0, balance.casual_leave - app.total_days);
    } else if (app.leave_type === "sick") {
      balance.sick_leave = Math.max(0, balance.sick_leave - app.total_days);
    } else if (app.leave_type === "earned") {
      balance.earned_leave = Math.max(0, balance.earned_leave - app.total_days);
    }
    initializeLeaveBalance(balance);
    
    saveAllLeaveApplications(allApps);
    
    // Notify the meta staff user
    createNotification(
      app.officer_id,
      'system_admin',
      'leave_application_approved',
      'Leave Application Approved',
      `Your ${app.leave_type} leave has been approved by ${ceoName}`,
      '/system-admin/leave-management',
      {
        leave_application_id: id,
        leave_type: app.leave_type,
        start_date: app.start_date,
        end_date: app.end_date,
      }
    );
  }
};

/**
 * Reject leave application at any stage
 */
export const rejectLeaveApplicationHierarchical = (
  id: string,
  reviewerName: string,
  rejectionReason: string,
  stage: 'manager' | 'agm' | 'ceo'
): void => {
  const allApps = loadAllLeaveApplications();
  const appIndex = allApps.findIndex((app) => app.id === id);
  
  if (appIndex !== -1) {
    const app = allApps[appIndex];
    
    allApps[appIndex].status = "rejected";
    allApps[appIndex].approval_stage = "rejected";
    allApps[appIndex].rejected_by = reviewerName;
    allApps[appIndex].rejected_at = new Date().toISOString();
    allApps[appIndex].rejection_stage = stage;
    allApps[appIndex].rejection_reason = rejectionReason;
    allApps[appIndex].reviewed_by = reviewerName;
    allApps[appIndex].reviewed_at = new Date().toISOString();
    
    saveAllLeaveApplications(allApps);
    
    // Notify the user
    const userRole = app.applicant_type === 'innovation_officer' ? 'officer' : 'system_admin';
    const redirectPath = app.applicant_type === 'innovation_officer' 
      ? '/officer/leave-management' 
      : '/system-admin/leave-management';
    
    createNotification(
      app.officer_id,
      userRole,
      'leave_application_rejected',
      'Leave Application Rejected',
      `Your ${app.leave_type} leave has been rejected by ${reviewerName}`,
      redirectPath,
      {
        leave_application_id: id,
        leave_type: app.leave_type,
        rejection_reason: rejectionReason,
      }
    );
  }
};

/**
 * Get pending leave count by stage (for badge counts)
 */
export const getPendingLeaveCountByStage = (stage: 'manager_pending' | 'agm_pending' | 'ceo_pending'): number => {
  const allApps = loadAllLeaveApplications();
  return allApps.filter(app => app.approval_stage === stage && app.status === 'pending').length;
};

/**
 * Get leave applications by approval stage
 */
export const getLeaveApplicationsByStage = (stage: 'manager_pending' | 'agm_pending' | 'ceo_pending'): LeaveApplication[] => {
  const allApps = loadAllLeaveApplications();
  return allApps.filter(app => app.approval_stage === stage && app.status === 'pending');
};

// ========================================
// TIMETABLE INTEGRATION FUNCTIONS
// ========================================

/**
 * Update timetable slot status when leave is approved
 */
export const updateTimetableSlotStatus = (
  officerId: string,
  slotId: string,
  status: 'on_leave' | 'substitute',
  leaveApplicationId: string
): void => {
  // This will be implemented when connecting to backend
  console.log(`Updating slot ${slotId} for officer ${officerId} to status ${status}`);
};

/**
 * Add substitute slot to officer's timetable
 */
export const addSubstituteSlot = (
  substituteOfficerId: string,
  assignment: any,
  leaveApplication: any
): void => {
  // This will be implemented when connecting to backend
  console.log(`Adding substitute slot for officer ${substituteOfficerId}`);
};
