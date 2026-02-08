import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { InstitutionDataProvider } from "@/contexts/InstitutionDataContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { PlatformSettingsProvider } from "@/contexts/PlatformSettingsContext";
import { SessionTimeoutProvider } from "@/components/layout/SessionTimeoutProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import Maintenance from "./pages/Maintenance";
// SuperAdminDashboard removed - using CEOAnalyticsDashboard as dashboard
import SuperAdminSystemConfig from "./pages/super-admin/SystemConfig";
import SuperAdminAuditLogs from "./pages/super-admin/AuditLogs";
import CEOAnalyticsDashboard from "./pages/super-admin/CEOAnalyticsDashboard";
import SystemAdminDashboard from "./pages/system-admin/Dashboard";
import InstitutionManagement from "./pages/system-admin/InstitutionManagement";
import InvoiceManagement from "./pages/system-admin/InvoiceManagement";
import OfficerManagement from "./pages/system-admin/OfficerManagement";
import SystemAdminOfficerAttendance from "./pages/system-admin/OfficerAttendance";
import StaffAttendancePayroll from "./pages/system-admin/StaffAttendancePayroll";
import InventoryManagement from "./pages/system-admin/InventoryManagement";
import CompanyInventory from "./pages/system-admin/CompanyInventory";
import CredentialManagement from "./pages/system-admin/CredentialManagement";
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentProjects from "./pages/student/Projects";
import StudentTimetable from "./pages/student/Timetable";
import StudentCertificates from "./pages/student/Certificates";
import AskMetova from "./pages/student/AskMetova";
import FeedbackSurvey from "./pages/student/FeedbackSurvey";
import StudentGamification from "./pages/student/Gamification";
import StudentResume from "./pages/student/Resume";
import StudentEvents from "./pages/student/Events";
import StudentSettings from "./pages/student/Settings";

import OfficerDashboard from "./pages/officer/Dashboard";
import OfficerSessions from "./pages/officer/Sessions";
import OfficerProjects from "./pages/officer/Projects";
import OfficerInventory from "./pages/officer/Inventory";
import OfficerAttendance from "./pages/officer/Attendance";
import OfficerEvents from "./pages/officer/Events";
import InstitutionDashboard from "./pages/institution/Dashboard";
import InstitutionTeachers from "./pages/institution/Teachers";
import InstitutionStudents from "./pages/institution/Students";
import ManagementStudents from "./pages/management/Students";
import InstitutionCourses from "./pages/institution/Courses";
import InstitutionReports from "./pages/institution/Reports";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherCourses from "./pages/teacher/Courses";
import TeacherGrades from "./pages/teacher/Grades";
import TeacherAttendance from "./pages/teacher/Attendance";
import TeacherSchedule from "./pages/teacher/Schedule";
import TeacherMaterials from "./pages/teacher/Materials";
import ManagementDashboard from "./pages/management/Dashboard";
// import ManagementTeachers from "./pages/management/Teachers"; // Temporarily removed
import ManagementOfficers from "./pages/management/Officers";
import CoursesAndSessions from "./pages/management/CoursesAndSessions";
import InventoryAndPurchase from "./pages/management/InventoryAndPurchase";
import ProjectsAndCertificates from "./pages/management/ProjectsAndCertificates";
import ManagementSettings from "./pages/management/Settings";
import Attendance from "./pages/management/Attendance";
import ManagementReports from "./pages/management/Reports";
import ManagementTimetable from "./pages/management/Timetable";
import ManagementEvents from "./pages/management/Events";
import ManagementCourseDetail from "./pages/management/CourseDetail";
import ManagementProfile from "./pages/management/Profile";
import ManagementAssessments from "./pages/management/Assessments";
import ManagementAnalytics from "./pages/management/Analytics";
import ManagementSDGDashboard from "./pages/management/SDGDashboard";
import StudentSDGContribution from "./pages/student/SDGContribution";
import StudentProfile from "./pages/student/Profile";
import TeacherProfile from "./pages/teacher/Profile";
import SystemAdminCourseManagement from "./pages/system-admin/CourseManagement";
import SystemAdminCourseDetail from "./pages/system-admin/CourseDetail";
import SystemAdminAssessmentManagement from "./pages/system-admin/AssessmentManagement";

import OfficerCourseManagement from "./pages/officer/CourseManagement";
import OfficerCourseContentViewer from "./pages/officer/CourseContentViewer";
import OfficerTeachingSession from "./pages/officer/TeachingSession";
import OfficerProfile from "./pages/officer/Profile";
import OfficerLeave from "./pages/officer/OfficerLeave";
import OfficerAssessmentManagement from "./pages/officer/AssessmentManagement";
import OfficerAskMetova from "./pages/officer/AskMetova";
import OfficerInstitutionCalendar from "./pages/officer/InstitutionCalendar";
import ManagementInstitutionCalendar from "./pages/management/InstitutionCalendar";
import StudentCourseDetail from "./pages/student/CourseDetail";
import StudentAssessments from "./pages/student/Assessments";
import StudentAssignments from "./pages/student/Assignments";
import SystemAdminAssignmentManagement from "./pages/system-admin/AssignmentManagement";

import TakeAssessment from "./pages/student/TakeAssessment";
import InstitutionalCalendar from "./pages/system-admin/InstitutionalCalendar";
import InstitutionDetail from "./pages/system-admin/InstitutionDetail";
import ClassDetail from "./pages/system-admin/ClassDetail";
import OfficerDetail from "./pages/system-admin/OfficerDetail";
import StaffDetail from "./pages/system-admin/StaffDetail";
import ProjectManagement from "./pages/system-admin/ProjectManagement";
import SystemAdminLeaveApprovals from "./pages/system-admin/LeaveApprovals";
import MetaStaffLeaveManagement from "./pages/system-admin/MetaStaffLeaveManagement";
import ManagerLeaveApprovals from "./pages/system-admin/ManagerLeaveApprovals";
import AGMLeaveApprovals from "./pages/system-admin/AGMLeaveApprovals";
import CEOLeaveApprovals from "./pages/system-admin/CEOLeaveApprovals";
import EventManagement from "./pages/system-admin/EventManagement";
import CompanyHolidays from "./pages/system-admin/CompanyHolidays";
import LeaveApply from "./pages/system-admin/LeaveApply";
import LeaveStatus from "./pages/system-admin/LeaveStatus";
import LeaveTracking from "./pages/system-admin/LeaveTracking";
import LeaveCalendarPage from "./pages/system-admin/LeaveCalendarPage";
import LeaveRecords from "./pages/system-admin/LeaveRecords";
import Leave from "./pages/system-admin/Leave";
import GlobalApprovalConfig from "./pages/system-admin/GlobalApprovalConfig";
import Performance from "./pages/management/Performance";
import SystemAdminPositionManagement from "./pages/system-admin/PositionManagement";
import MetaStaffDetail from "./pages/system-admin/MetaStaffDetail";
import SystemAdminTaskManagement from "./pages/system-admin/TaskManagement";
import SystemAdminTasks from "./pages/system-admin/Tasks";
import SystemAdminGamification from "./pages/system-admin/GamificationManagement";
import OfficerTasks from "./pages/officer/Tasks";
import OfficerTimetable from "./pages/officer/Timetable";
import IdConfiguration from "./pages/system-admin/IdConfiguration";
import SDGManagement from "./pages/system-admin/SDGManagement";
import SystemAdminAskMetova from "./pages/system-admin/AskMetova";
import SystemAdminCRM from "./pages/system-admin/CRM";
import SurveyFeedbackManagement from "./pages/system-admin/SurveyFeedbackManagement";
import PerformanceRatings from "./pages/system-admin/PerformanceRatings";
import SystemAdminSettings from "./pages/system-admin/Settings";
import OfficerSettings from "./pages/officer/Settings";
import TeacherSettings from "./pages/teacher/Settings";
import NotificationsPage from "./pages/common/NotificationsPage";
import { TimetableRedirect } from "./components/TimetableRedirect";
import PayrollDashboard from "./pages/system-admin/PayrollDashboard";
import SystemAdminWebinarManagement from "./pages/system-admin/WebinarManagement";
import StudentWebinars from "./pages/student/Webinars";
import OfficerWebinars from "./pages/officer/Webinars";
import ManagementWebinars from "./pages/management/Webinars";
import OfficerAssignments from "./pages/officer/Assignments";
import ManagementAssignments from "./pages/management/Assignments";
import ReportsManagement from "./pages/system-admin/ReportsManagement";
import NewsletterManagement from "./pages/system-admin/NewsletterManagement";
import PlatformGuide from "./pages/system-admin/PlatformGuide";
import Newsletters from "./pages/shared/Newsletters";

// HR Management imports
import HRDashboard from "./pages/system-admin/hr/HRDashboard";
import HRJobPostings from "./pages/system-admin/hr/JobPostings";
import HRJobDetail from "./pages/system-admin/hr/JobDetail";
import HRApplications from "./pages/system-admin/hr/Applications";
import HRApplicationDetail from "./pages/system-admin/hr/ApplicationDetail";
import HRInterviews from "./pages/system-admin/hr/Interviews";
import HROffers from "./pages/system-admin/hr/Offers";

// Public Careers imports
import CareersPage from "./pages/careers/CareersPage";
import JobApplicationPage from "./pages/careers/JobApplicationPage";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrandingProvider>
        <PlatformSettingsProvider>
          <InstitutionDataProvider>
            <SessionTimeoutProvider>
              <TooltipProvider>
              <Toaster />
              <Sonner position="top-right" />
              <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/maintenance" element={<Maintenance />} />
            
            {/* Public Careers Routes */}
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/careers/apply/:jobId" element={<JobApplicationPage />} />
            
            {/* Smart redirect for /timetable - redirects to role-specific timetable */}
            <Route path="/timetable" element={<TimetableRedirect />} />
            
            {/* Super Admin Routes - Technical Platform Oversight */}
            <Route
              path="/super-admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <CEOAnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/system-config"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminSystemConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <SuperAdminAuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admin/notifications"
              element={
                <ProtectedRoute allowedRoles={['super_admin']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* System Admin Routes - Business Operations & Customer Onboarding */}
            <Route
              path="/system-admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/institutions"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="institution_management">
                  <InstitutionManagement />
                </ProtectedRoute>
              }
            />
          <Route
            path="/system-admin/institutions/:institutionId"
            element={
              <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="institution_management">
                <InstitutionDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-admin/institutions/:institutionId/classes/:classId"
            element={
              <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="institution_management">
                <ClassDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-admin/officers/:officerId"
            element={
              <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="officer_management">
                <OfficerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-admin/staff/:staffId"
            element={
              <ProtectedRoute allowedRoles={['system_admin', 'super_admin']} requiredFeature="officer_management">
                <StaffDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-admin/meta-staff/:staffId"
            element={
              <ProtectedRoute allowedRoles={['system_admin', 'super_admin']}>
                <MetaStaffDetail />
              </ProtectedRoute>
            }
          />
            <Route
              path="/system-admin/reports"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="reports_analytics">
                  <InvoiceManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/reports-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="reports_analytics">
                  <ReportsManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/sdg-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="sdg_management">
                  <SDGManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/officers"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="officer_management">
                  <OfficerManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/officer-attendance"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="attendance_payroll">
                  <SystemAdminOfficerAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/payroll-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <PayrollDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/staff-attendance-payroll"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <StaffAttendancePayroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/leave-approvals"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="leave_approvals">
                  <SystemAdminLeaveApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/leave-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <MetaStaffLeaveManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/manager-leave-approvals"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <ManagerLeaveApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/agm-leave-approvals"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <AGMLeaveApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/ceo-leave-approvals"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <CEOLeaveApprovals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/company-holidays"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <CompanyHolidays />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/leave"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <Leave />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/global-approval-config"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <GlobalApprovalConfig />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/inventory-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="inventory_management">
                  <InventoryManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/company-inventory"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="company_inventory">
                  <CompanyInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/course-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="course_management">
                  <SystemAdminCourseManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="course_management">
                  <SystemAdminCourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/assessments"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="assessment_management">
                  <SystemAdminAssessmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/institutional-calendar"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="institutional_calendar">
                  <InstitutionalCalendar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/project-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="project_management">
                  <ProjectManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/event-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="event_management">
                  <EventManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/position-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminPositionManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/platform-guide"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <PlatformGuide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/credential-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="credential_management">
                  <CredentialManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/task-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminTaskManagement />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/system-admin/tasks" 
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminTasks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/system-admin/gamification" 
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminGamification />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/system-admin/id-configuration"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <IdConfiguration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/ask-metova"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminAskMetova />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/survey-feedback"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="survey_feedback">
                  <SurveyFeedbackManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/crm"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminCRM />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/performance-ratings"
              element={
                <ProtectedRoute allowedRoles={['system_admin']} requiredFeature="performance_ratings">
                  <PerformanceRatings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/notifications"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/settings"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/webinars"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminWebinarManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/assignments"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <SystemAdminAssignmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/newsletters"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <NewsletterManagement />
                </ProtectedRoute>
              }
            />
            
            {/* HR Management Routes */}
            <Route
              path="/system-admin/hr-management"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <HRDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/hr-management/jobs"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <HRJobPostings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/hr-management/jobs/:id"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <HRJobDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/hr-management/applications"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <HRApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/hr-management/applications/:id"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <HRApplicationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/hr-management/interviews"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <HRInterviews />
                </ProtectedRoute>
              }
            />
            <Route
              path="/system-admin/hr-management/offers"
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <HROffers />
                </ProtectedRoute>
              }
            />

            {/* Teacher Routes (path-based multi-tenancy) */}
            <Route
              path="/tenant/:tenantId/teacher/dashboard"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/courses"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/grades"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherGrades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/attendance"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/schedule"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/materials"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherMaterials />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/settings"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/profile"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/teacher/notifications"
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />


            {/* Officer Routes (path-based multi-tenancy) */}
            <Route
              path="/tenant/:tenantId/officer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/sessions"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/projects"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/inventory"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerInventory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/attendance"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/tasks"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerTasks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/courses/:courseId/viewer"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerCourseContentViewer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/teaching/:courseId"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerTeachingSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/profile"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/leave-management"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerLeave />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/events"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/assessments"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerAssessmentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/assignments"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/ask-metova"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerAskMetova />
                </ProtectedRoute>
              }
            />
            {/* Temporarily hidden - Officer Settings
            <Route
              path="/tenant/:tenantId/officer/settings"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerSettings />
                </ProtectedRoute>
              }
            />
            */}
            <Route
              path="/tenant/:tenantId/officer/timetable"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/notifications"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/officer/webinars"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerWebinars />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenant/:tenantId/officer/newsletters"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <Newsletters />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenant/:tenantId/officer/institution-calendar"
              element={
                <ProtectedRoute allowedRoles={['officer']}>
                  <OfficerInstitutionCalendar />
                </ProtectedRoute>
              }
            />

            {/* Management Routes (path-based multi-tenancy) - Merged with institution admin */}
            <Route
              path="/tenant/:tenantId/management/dashboard"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementDashboard />
                </ProtectedRoute>
              }
            />
            {/* Temporarily removed - Management Teachers
            <Route
              path="/tenant/:tenantId/management/teachers"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementTeachers />
                </ProtectedRoute>
              }
            />
            */}
            <Route
              path="/tenant/:tenantId/management/students"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/officers"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementOfficers />
                </ProtectedRoute>
              }
            />
            {/* Combined Functionality Routes */}
            <Route
              path="/tenant/:tenantId/management/courses-sessions"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <CoursesAndSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/inventory-purchase"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <InventoryAndPurchase />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/projects-certificates"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ProjectsAndCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/reports"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementReports />
                </ProtectedRoute>
              }
            />
            {/* Temporarily hidden - Management Settings
            <Route
              path="/tenant/:tenantId/management/settings"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementSettings />
                </ProtectedRoute>
              }
            />
            */}
            <Route
              path="/tenant/:tenantId/management/attendance"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/events"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementCourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/timetable"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/profile"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/assignments"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/assessments"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementAssessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/analytics"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/sdg-dashboard"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementSDGDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/notifications"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/management/webinars"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementWebinars />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenant/:tenantId/management/newsletters"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <Newsletters />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tenant/:tenantId/management/institution-calendar"
              element={
                <ProtectedRoute allowedRoles={['management']}>
                  <ManagementInstitutionCalendar />
                </ProtectedRoute>
              }
            />

            {/* Student Routes (path-based multi-tenancy) */}
            <Route
              path="/tenant/:tenantId/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/courses"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentCourses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentCourseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/projects"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProjects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/timetable"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentTimetable />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/certificates"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentCertificates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/gamification"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentGamification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/resume"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentResume />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/events"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/assessments"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAssessments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/assignments"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/assessments/:assessmentId/take"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <TakeAssessment />
                </ProtectedRoute>
              }
            />
            {/* Temporarily hidden - Student Settings
            <Route
              path="/tenant/:tenantId/student/settings"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSettings />
                </ProtectedRoute>
              }
            />
            */}
            <Route
              path="/tenant/:tenantId/student/profile"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/notifications"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/sdg"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSDGContribution />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/ask-metova"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <AskMetova />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/feedback"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <FeedbackSurvey />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/webinars"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentWebinars />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tenant/:tenantId/student/newsletters"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Newsletters />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Catch all */}
            <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </SessionTimeoutProvider>
        </InstitutionDataProvider>
      </PlatformSettingsProvider>
      </BrandingProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
