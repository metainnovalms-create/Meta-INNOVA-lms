# Meta-Innova Innovation Academy Platform
## Complete Frontend System Documentation

**Version:** 1.0  
**Date:** December 2024  
**Purpose:** Backend Development Reference

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Multi-Tenant SaaS Architecture](#2-multi-tenant-saas-architecture)
3. [User ID Management Structure](#3-user-id-management-structure)
4. [User Roles & Detailed Functionality](#4-user-roles--detailed-functionality)
5. [Bidirectional Data Synchronization](#5-bidirectional-data-synchronization)
6. [Key Workflows](#6-key-workflows)
7. [Database Schema](#7-database-schema)
8. [Security Considerations](#8-security-considerations)
9. [API Endpoints Required](#9-api-endpoints-required)
10. [Frontend Files Reference](#10-frontend-files-reference)

---

## 1. Platform Overview

Meta-Innova is a comprehensive educational technology platform designed as a **multi-tenant SaaS** solution for STEM education delivery. The platform connects:

- **Meta-Innova (Service Provider)** - System Admin and internal team
- **Client Institutions (Tenants)** - Schools/Educational institutions
- **End Users** - Students, Teachers, Innovation Officers

### Core Value Proposition

- Centralized STEM curriculum delivery (23 courses)
- GPS-based attendance and payroll management
- Bidirectional real-time data synchronization
- Dynamic position-based permission system
- Comprehensive project and event management

---

## 2. Multi-Tenant SaaS Architecture

### Hierarchy Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    META-INNOVA PLATFORM                              │
│                    (Service Provider)                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────────────────────────────┐   │
│  │   SUPER ADMIN   │  │         SYSTEM ADMIN TEAM               │   │
│  │  (Technical)    │  │  ┌─────┬─────┬─────┬─────┬─────┬─────┐  │   │
│  │                 │  │  │ CEO │ MD  │ AGM │ GM  │ Mgr │Staff│  │   │
│  └─────────────────┘  │  └─────┴─────┴─────┴─────┴─────┴─────┘  │   │
│                       │  (Dynamic Positions with Custom Perms)   │   │
│                       └─────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              INNOVATION OFFICERS (Trainers)                   │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │
│  │  │  Officer 1   │  │  Officer 2   │  │  Officer N   │        │   │
│  │  │ (Inst A)     │  │ (Inst B)     │  │ (Inst X)     │        │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │   │
│  │  (Institutionally Isolated - See Only Assigned Institution)   │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENT INSTITUTIONS (Tenants)                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐    ┌─────────────────────────┐         │
│  │  Modern School Vasant   │    │  Kikani Global Academy  │         │
│  │  Vihar (inst-msd-001)   │    │  (inst-kga-001)         │         │
│  │  ┌───────────────────┐  │    │  ┌───────────────────┐  │         │
│  │  │ Management Admin  │  │    │  │ Management Admin  │  │         │
│  │  └───────────────────┘  │    │  └───────────────────┘  │         │
│  │  ┌───────────────────┐  │    │  ┌───────────────────┐  │         │
│  │  │ Teachers          │  │    │  │ Teachers          │  │         │
│  │  └───────────────────┘  │    │  └───────────────────┘  │         │
│  │  ┌───────────────────┐  │    │  ┌───────────────────┐  │         │
│  │  │ Students (350)    │  │    │  │ Students (520)    │  │         │
│  │  │ Grades 6-12       │  │    │  │ Grades 6-12       │  │         │
│  │  │ Sections A-B      │  │    │  │ Sections A-B-C    │  │         │
│  │  └───────────────────┘  │    │  └───────────────────┘  │         │
│  └─────────────────────────┘    └─────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

### Tenant Isolation Principles

| Layer | Isolation Type | Implementation |
|-------|---------------|----------------|
| Data | Row-level | `institution_id` foreign key on all tenant data |
| Officers | Strict | Officers see ONLY their assigned institution |
| Management | Tenant-scoped | Management sees ONLY their institution |
| Students | Tenant + Class | Students filtered by institution AND class |
| System Admin | Global | Full cross-tenant visibility |

---

## 3. User ID Management Structure

### ID Patterns by Entity Type

| Entity | Pattern | Example | Storage |
|--------|---------|---------|---------|
| Super Admin | `super-admin-{uuid}` | `super-admin-001` | `users` table |
| Meta Staff | `staff-{position}-{sequence}` | `staff-agm-001` | `users` table |
| Innovation Officer | `off-{inst-code}-{sequence}` | `off-msd-001` | `officers` table |
| Institution | `inst-{code}-{sequence}` | `inst-msd-001` | `institutions` table |
| Management Admin | `mgmt-{inst-code}-{sequence}` | `mgmt-msd-001` | `users` table |
| Student (Internal) | `std-{inst-code}-{sequence}` | `std-msd-0001` | `students` table |
| Student (Display) | `{INST}-{YEAR}-{XXXX}` | `MSD-2024-0001` | `display_id` field |
| Position | `pos-{name}-{sequence}` | `pos-ceo-001` | `positions` table |
| Class | `class-{inst}-{grade}-{section}` | `class-msd-6-A` | `classes` table |

### Student ID Lifecycle

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ONBOARDING    │────▶│   ENROLLMENT    │────▶│   GRADUATION    │
│                 │     │                 │     │                 │
│ Display ID:     │     │ Same ID kept    │     │ ID archived     │
│ MSD-2024-0001   │     │ across years    │     │ permanently     │
│ assigned        │     │ and courses     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘

Note: Student Display IDs are LIFELONG - never change regardless of 
course changes, class promotions, or institution transfers.
```

---

## 4. User Roles & Detailed Functionality

### 4.1 Super Admin (Technical Platform Oversight)

**Route Pattern:** `/super-admin/*`  
**Purpose:** Technical infrastructure management, tenant provisioning

#### Sidebar Menu

| Menu Item | Route | Functionality |
|-----------|-------|---------------|
| Dashboard | `/super-admin/dashboard` | System health, tenant metrics |
| Tenants | `/super-admin/tenants` | Create/manage tenant instances |
| Audit Logs | `/super-admin/audit-logs` | System-wide activity logging |
| Configuration | `/super-admin/configuration` | Platform-level settings |

#### Key Data Types

```typescript
interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  subscription_status: 'active' | 'inactive';
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  total_users: number;
  total_institutions: number;
  storage_used_gb: number;
  created_at: string;
}
```

---

### 4.2 System Admin (Business Operations)

**Route Pattern:** `/system-admin/*`  
**Purpose:** Customer management, employee management, business operations

#### Dynamic Position System

System Admin uses a **dynamic position system** where permissions are configured per-position:

```typescript
interface CustomPosition {
  id: string;
  position_name: string;           // e.g., "ceo", "agm", "manager"
  display_name: string;            // e.g., "Chief Executive Officer"
  visible_features: SystemAdminFeature[];  // Sidebar menus visible
  description: string;
  is_ceo_position?: boolean;       // CEO cannot lose Position Management
  user_count?: number;
}

type SystemAdminFeature = 
  | 'institution_management'
  | 'course_management'
  | 'assessment_management'
  | 'assignment_management'
  | 'event_management'
  | 'officer_management'
  | 'project_management'
  | 'inventory_management'
  | 'attendance_payroll'
  | 'leave_approvals'
  | 'institutional_calendar'
  | 'reports_analytics'
  | 'sdg_management'
  | 'task_management'
  | 'task_allotment'
  | 'credential_management'
  | 'gamification'
  | 'id_configuration'
  | 'survey_feedback'
  | 'performance_ratings';
```

#### Complete Sidebar Menu

| Menu Item | Route | Feature Flag | Functionality |
|-----------|-------|--------------|---------------|
| Dashboard | `/system-admin/dashboard` | (always visible) | KPIs, quick actions, overview |
| Position Management | `/system-admin/positions` | (CEO only) | Create/edit positions, assign features |
| Institution Management | `/system-admin/institutions` | `institution_management` | Onboard clients, manage agreements |
| Officer Management | `/system-admin/officers` | `officer_management` | Onboard trainers, assign institutions |
| Attendance & Payroll | `/system-admin/attendance` | `attendance_payroll` | GPS attendance, payroll calculations |
| Leave Approvals | `/system-admin/leave-management` | `leave_approvals` | Approve/reject leave applications |
| Course Management | `/system-admin/courses` | `course_management` | STEM curriculum, levels, content |
| Assessment Management | `/system-admin/assessments` | `assessment_management` | Create assessments, view analytics |
| Assignment Management | `/system-admin/assignments` | `assignment_management` | Create assignments, grading |
| Project Management | `/system-admin/projects` | `project_management` | All institution projects |
| Event Management | `/system-admin/events` | `event_management` | Platform-wide events |
| Inventory Management | `/system-admin/inventory` | `inventory_management` | Lab inventory, purchase requests |
| Institutional Calendar | `/system-admin/calendar` | `institutional_calendar` | Company & institution calendars |
| Task Management | `/system-admin/task-management` | `task_management` | Create/assign tasks |
| Task Allotment | `/system-admin/tasks` | `task_allotment` | View assigned tasks |
| Reports & Invoice | `/system-admin/reports` | `reports_analytics` | Analytics, invoice generation |
| SDG Management | `/system-admin/sdg-management` | `sdg_management` | UN SDG mapping to courses/projects |
| Credential Management | `/system-admin/credentials` | `credential_management` | Password management for all users |
| Gamification | `/system-admin/gamification` | `gamification` | Badges, XP, rewards, certificates |
| ID Configuration | `/system-admin/id-configuration` | `id_configuration` | Custom ID patterns |
| Surveys & Feedback | `/system-admin/surveys-feedback` | `survey_feedback` | Create surveys, view feedback |
| Performance & Ratings | `/system-admin/performance` | `performance_ratings` | Staff appraisals, HR ratings |
| CRM & Client Relations | `/system-admin/crm` | (always visible) | Communication, contracts, billing |
| Ask Metova | `/system-admin/ask-metova` | (always visible) | AI assistant |
| Settings | `/system-admin/settings` | (always visible) | Account, password management |

#### Key Data Types

```typescript
interface MetaStaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  position_id: string;
  position_name: string;
  department: string;
  status: 'active' | 'inactive';
  join_date: string;
  avatar?: string;
  hourly_rate: number;
  overtime_rate_multiplier: number;
  normal_working_hours: number;
  leave_balance: {
    casual: number;
    sick: number;
    earned: number;
  };
}
```

---

### 4.3 Innovation Officer (Trainer)

**Route Pattern:** `/tenant/{tenantSlug}/officer/*`  
**Purpose:** Deliver STEM education at assigned institution

#### CRITICAL: Institutional Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│  INNOVATION OFFICER ISOLATION CONSTRAINT                        │
├─────────────────────────────────────────────────────────────────┤
│  Officers can ONLY see data from their assigned institution:    │
│  ✓ Students from their institution                              │
│  ✓ Projects from their institution                              │
│  ✓ Inventory from their institution                             │
│  ✓ Assessments assigned to their institution                    │
│  ✗ Cannot see other institutions' data                          │
│  ✗ Cannot select students from other institutions               │
└─────────────────────────────────────────────────────────────────┘
```

#### Sidebar Menu

| Menu Item | Route | Functionality |
|-----------|-------|---------------|
| Dashboard | `/tenant/{slug}/officer/dashboard` | Personal KPIs, check-in/out with GPS |
| Sessions | `/tenant/{slug}/officer/sessions` | Teaching timetable |
| Teaching | `/tenant/{slug}/officer/teaching` | Course delivery, mark content complete |
| Students | `/tenant/{slug}/officer/students` | View assigned students |
| Assessments | `/tenant/{slug}/officer/assessments` | Institution assessments |
| Assignments | `/tenant/{slug}/officer/assignments` | Institution assignments |
| Projects | `/tenant/{slug}/officer/projects` | Create/manage student projects |
| Events | `/tenant/{slug}/officer/events` | View events, interested students |
| Lab Inventory | `/tenant/{slug}/officer/inventory` | Manage lab components, audits |
| Task | `/tenant/{slug}/officer/tasks` | Teaching + Task Allotment tabs |
| Leave Management | `/tenant/{slug}/officer/leave` | Apply for leave, view balance |
| Salary Tracker | `/tenant/{slug}/officer/salary` | View earnings, payroll history |
| Ask Metova | `/tenant/{slug}/officer/ask-metova` | AI assistant |
| Settings | `/tenant/{slug}/officer/settings` | Account, password management |

#### Key Data Types

```typescript
interface OfficerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  institutionId: string;
  institutionName: string;
  tenantSlug: string;
  status: 'active' | 'inactive';
  joinDate: string;
  avatar?: string;
  specializations: string[];
  assignedClasses: string[];
  hourly_rate: number;
  overtime_rate_multiplier: number;
  normal_working_hours: number;
  leave_balance: {
    casual: number;
    sick: number;
    earned: number;
  };
}
```

---

### 4.4 Management (Institution Admin)

**Route Pattern:** `/tenant/{tenantSlug}/management/*`  
**Purpose:** Institution-level administration

#### Sidebar Menu

| Menu Item | Route | Functionality |
|-----------|-------|---------------|
| Dashboard | `/tenant/{slug}/management/dashboard` | Institution KPIs, ROI metrics |
| Students | `/tenant/{slug}/management/students` | Manage institution students |
| Teachers | `/tenant/{slug}/management/teachers` | Manage regular teachers |
| STEM Course Catalog | `/tenant/{slug}/management/courses` | View courses, progress analytics |
| STEM Class Schedule | `/tenant/{slug}/management/timetable` | Officer timetables, class hours |
| Projects & Certificates | `/tenant/{slug}/management/projects` | Institution projects, certificates |
| Events & Activities | `/tenant/{slug}/management/events` | Institution event participation |
| Inventory & Purchase | `/tenant/{slug}/management/inventory` | Lab inventory, purchase status |
| Agreement Management | `/tenant/{slug}/management/agreements` | PIN-protected pricing details |
| Renewal & Contract | `/tenant/{slug}/management/renewal` | PIN-protected contract management |
| Reports & Analytics | `/tenant/{slug}/management/reports` | Institution-specific reports |
| Settings | `/tenant/{slug}/management/settings` | Account, password management |

---

### 4.5 Teacher (School Faculty)

**Route Pattern:** `/tenant/{tenantSlug}/teacher/*`  
**Purpose:** Regular school teacher functions

#### Sidebar Menu

| Menu Item | Route | Functionality |
|-----------|-------|---------------|
| Dashboard | `/tenant/{slug}/teacher/dashboard` | Teaching overview |
| My Classes | `/tenant/{slug}/teacher/classes` | Assigned classes |
| Students | `/tenant/{slug}/teacher/students` | Class students |
| Attendance | `/tenant/{slug}/teacher/attendance` | Take attendance |
| Settings | `/tenant/{slug}/teacher/settings` | Account management |

---

### 4.6 Student (Learner)

**Route Pattern:** `/tenant/{tenantSlug}/student/*`  
**Purpose:** Learn STEM courses, participate in projects/events

#### Sidebar Menu

| Menu Item | Route | Functionality |
|-----------|-------|---------------|
| Dashboard | `/tenant/{slug}/student/dashboard` | Progress overview, upcoming tasks |
| My Enrolled Courses | `/tenant/{slug}/student/courses` | Active courses with level access |
| Browse Courses | `/tenant/{slug}/student/browse-courses` | Optional self-study courses |
| Assessments | `/tenant/{slug}/student/assessments` | Available, completed, upcoming tests |
| Assignments | `/tenant/{slug}/student/assignments` | Pending, submitted, graded work |
| My Projects | `/tenant/{slug}/student/projects` | Team projects, progress tracking |
| Events | `/tenant/{slug}/student/events` | Express interest, view participation |
| Timetable | `/tenant/{slug}/student/timetable` | Class schedule (synced from officer) |
| Certificates | `/tenant/{slug}/student/certificates` | Earned certificates, download PDF |
| Feedback & Survey | `/tenant/{slug}/student/feedback` | Submit feedback, complete surveys |
| Settings | `/tenant/{slug}/student/settings` | Account, password management |

#### Key Data Types

```typescript
interface Student {
  id: string;
  display_id: string;              // Lifelong ID: "MSD-2024-0001"
  name: string;
  email: string;
  phone?: string;
  institution_id: string;
  institution_name: string;
  class_id: string;
  class_name: string;              // "Grade 6"
  section: string;                 // "A", "B", "C"
  enrollment_date: string;
  status: 'active' | 'inactive';
  avatar?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  address?: string;
}
```

---

## 5. Bidirectional Data Synchronization

### localStorage Keys (Frontend-First Development)

| Key | Data Type | Sync Direction | Dashboards |
|-----|-----------|----------------|------------|
| `students` | `Student[]` | System Admin ↔ Management ↔ Officer | All admin dashboards |
| `innovation_officers` | `OfficerDetails[]` | System Admin ↔ Officer | Admin, Officer |
| `meta_positions` | `CustomPosition[]` | System Admin only | Position Management |
| `meta_staff_members` | `MetaStaffMember[]` | System Admin only | Staff Management |
| `institutions` | `Institution[]` | System Admin ↔ Management | Admin, Management |
| `courses` | `Course[]` | System Admin ↔ Officer ↔ Student | All dashboards |
| `course_levels` | `CourseLevel[]` | System Admin ↔ Officer ↔ Student | Course Management |
| `admin_surveys` | `Survey[]` | System Admin → Student | Surveys |
| `survey_responses` | `SurveyResponse[]` | Student → System Admin | Surveys |
| `all_student_feedback` | `Feedback[]` | Student → System Admin | Feedback |
| `student_projects` | `Project[]` | Officer ↔ Student ↔ Admin | Project Management |
| `all_leave_applications` | `LeaveApplication[]` | All → Approvers | Leave Management |
| `leave_balances` | `LeaveBalance[]` | Admin ↔ Employee | Leave Tracking |
| `event_interests` | `EventInterest[]` | Student → Officer → Admin | Events |
| `inventory_items` | `InventoryItem[]` | Officer ↔ Admin ↔ Management | Inventory |
| `purchase_requests` | `PurchaseRequest[]` | Officer → Admin → Management | Inventory |
| `all_tasks` | `Task[]` | Admin ↔ Assignees | Task Management |
| `assessments` | `Assessment[]` | Admin ↔ Officer → Student | Assessments |
| `assignments` | `Assignment[]` | Admin ↔ Officer → Student | Assignments |
| `officer_timetables` | `TimetableSlot[]` | Admin → Officer → Student | Timetables |
| `institution_timetables` | `TimetableAssignment[]` | Admin → Institution | Timetables |
| `certificate_templates` | `CertificateTemplate[]` | Admin only | Gamification |
| `earned_certificates` | `EarnedCertificate[]` | System → Student | Certificates |

### Sync Pattern Example

```typescript
// Pattern for bidirectional sync
// 1. Load fresh data from localStorage
export const loadProjects = (): Project[] => {
  const stored = localStorage.getItem('student_projects');
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data if empty
  localStorage.setItem('student_projects', JSON.stringify(initialProjects));
  return initialProjects;
};

// 2. Save changes to localStorage
export const saveProjects = (projects: Project[]): void => {
  localStorage.setItem('student_projects', JSON.stringify(projects));
};

// 3. Filter by institution for officer isolation
export const getProjectsByInstitution = (institutionId: string): Project[] => {
  return loadProjects().filter(p => p.institution_id === institutionId);
};
```

---

## 6. Key Workflows

### 6.1 Leave Management Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAVE APPROVAL HIERARCHY                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INNOVATION OFFICER LEAVE (2-Stage):                            │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐      │
│  │ Officer │───▶│ Manager │───▶│   AGM   │───▶│Approved │      │
│  │ Applies │    │Approves │    │Approves │    │         │      │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘      │
│                                                                  │
│  META STAFF LEAVE (1-Stage):                                    │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                      │
│  │  Staff  │───▶│   CEO   │───▶│Approved │                      │
│  │ Applies │    │Approves │    │         │                      │
│  └─────────┘    └─────────┘    └─────────┘                      │
│                                                                  │
│  Note: CEO cannot apply for leave (excluded from menu)          │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Project Management Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                 PROJECT CREATION & SYNC                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Officer creates project (institution-isolated)              │
│     ┌──────────────────────────────────────────────────┐        │
│     │ Officer selects:                                  │        │
│     │ - Team leader (from their institution only)       │        │
│     │ - Team members (from their institution only)      │        │
│     │ - Each member has individual class/section        │        │
│     └──────────────────────────────────────────────────┘        │
│                          │                                       │
│                          ▼                                       │
│  2. Project saved to localStorage                               │
│     └── Syncs to: Officer Dashboard                             │
│                   Student "My Projects"                         │
│                   Management "Projects & Certificates"          │
│                   System Admin "Project Management"             │
│                                                                  │
│  3. Officer assigns project to events                           │
│     └── Students see event badges on their projects             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Course Completion Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│              SESSION-LINKED CONTENT COMPLETION                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Officer starts class session                                │
│     └── Takes attendance (present students recorded)            │
│                                                                  │
│  2. Officer teaches content                                     │
│     └── Marks content as "Complete"                             │
│                                                                  │
│  3. System auto-records for all present students:               │
│     ┌──────────────────────────────────────────────────┐        │
│     │ CompletionRecord {                                │        │
│     │   content_id: "content-123",                      │        │
│     │   student_id: "std-msd-0001",                     │        │
│     │   completed_by_officer: "off-msd-001",            │        │
│     │   officer_name: "Mr. Atif Ansari",                │        │
│     │   completed_at: "2024-12-03T10:30:00Z",           │        │
│     │   session_id: "session-456",                      │        │
│     │   completion_type: "class_session"                │        │
│     │ }                                                 │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  4. Students see in their dashboard:                            │
│     - Content tab: "✓ Completed by Mr. Atif during class"       │
│     - Learning Log: Full history with officer name & date       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 GPS Attendance & Payroll Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                GPS-BASED ATTENDANCE & PAYROLL                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Officer clicks "Check In" on dashboard                      │
│     └── Browser requests GPS permission                         │
│     └── GPS coordinates captured automatically                  │
│     └── Location validated against institution GPS + radius     │
│                                                                  │
│  2. Attendance record created:                                  │
│     ┌──────────────────────────────────────────────────┐        │
│     │ AttendanceRecord {                                │        │
│     │   officer_id: "off-msd-001",                      │        │
│     │   date: "2024-12-03",                             │        │
│     │   check_in: "09:00:00",                           │        │
│     │   check_in_location: { lat: 28.5674, lng: 77.21 },│        │
│     │   check_in_validated: true,                       │        │
│     │   check_out: null,                                │        │
│     │   check_out_location: null,                       │        │
│     │   total_hours: 0,                                 │        │
│     │   overtime_hours: 0                               │        │
│     │ }                                                 │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
│  3. Officer clicks "Check Out"                                  │
│     └── GPS captured again                                      │
│     └── Total hours calculated                                  │
│     └── Overtime determined (hours > normal_working_hours)      │
│                                                                  │
│  4. Payroll calculation:                                        │
│     ┌──────────────────────────────────────────────────┐        │
│     │ normal_pay = normal_hours × hourly_rate           │        │
│     │ overtime_pay = overtime_hours × hourly_rate ×     │        │
│     │                overtime_rate_multiplier           │        │
│     │ total_pay = normal_pay + overtime_pay             │        │
│     └──────────────────────────────────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.5 Password Management Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                  PASSWORD MANAGEMENT FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NEW USER ONBOARDING:                                           │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │  Admin  │───▶│ Temp Pass   │───▶│ Force Change│              │
│  │ Creates │    │ Generated   │    │ on 1st Login│              │
│  │  User   │    │ (shown once)│    │             │              │
│  └─────────┘    └─────────────┘    └─────────────┘              │
│                                                                  │
│  Password Requirements:                                         │
│  ✓ Minimum 8 characters                                         │
│  ✓ At least 1 uppercase letter                                  │
│  ✓ At least 1 lowercase letter                                  │
│  ✓ At least 1 number                                            │
│  ✓ At least 1 special character (!@#$%^&*)                      │
│                                                                  │
│  FORGOT PASSWORD FLOW:                                          │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐              │
│  │  User   │───▶│ Reset Link  │───▶│ Set New     │              │
│  │ Request │    │ Sent (1hr)  │    │ Password    │              │
│  └─────────┘    └─────────────┘    └─────────────┘              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    positions    │       │     users       │       │  institutions   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ position_name   │◄──────│ position_id (FK)│       │ name            │
│ display_name    │       │ email           │       │ slug            │
│ visible_features│       │ name            │       │ address         │
│ description     │       │ role            │       │ city            │
│ is_ceo_position │       │ institution_id  │──────▶│ state           │
│ created_at      │       │ class_id        │       │ gps_lat         │
│ created_by      │       │ password_hash   │       │ gps_lng         │
└─────────────────┘       │ must_change_pw  │       │ gps_radius      │
                          │ hourly_rate     │       │ subscription    │
                          │ overtime_mult   │       │ status          │
                          └─────────────────┘       └─────────────────┘
                                   │                        │
                                   │                        │
                                   ▼                        ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    officers     │       │    students     │       │    classes      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │       │ user_id (FK)    │       │ institution_id  │
│ institution_id  │       │ display_id      │       │ grade           │
│ designation     │       │ institution_id  │       │ section         │
│ specializations │       │ class_id (FK)   │◀──────│ student_count   │
│ assigned_classes│       │ section         │       │ created_at      │
│ hourly_rate     │       │ enrollment_date │       └─────────────────┘
│ overtime_mult   │       │ parent_info     │
│ leave_balance   │       │ status          │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    courses      │       │  course_levels  │       │    sessions     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ code            │◀──────│ course_id (FK)  │       │ level_id (FK)   │
│ title           │       │ level_number    │◀──────│ title           │
│ description     │       │ title           │       │ description     │
│ category        │       │ description     │       │ order           │
│ difficulty      │       │ accessible_cls  │       │ duration        │
│ duration        │       │ order           │       └─────────────────┘
│ outcomes        │       └─────────────────┘               │
│ prerequisites   │                                         │
│ sdg_goals       │       ┌─────────────────┐               │
└─────────────────┘       │    content      │               │
                          ├─────────────────┤               │
                          │ id (PK)         │◀──────────────┘
                          │ session_id (FK) │
                          │ title           │
                          │ type            │
                          │ url/data        │
                          │ duration        │
                          │ order           │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    projects     │       │ project_members │       │     events      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ title           │◀──────│ project_id (FK) │       │ title           │
│ description     │       │ student_id (FK) │       │ description     │
│ institution_id  │       │ role            │       │ type            │
│ officer_id      │       │ class_id        │       │ date_range      │
│ status          │       │ section         │       │ location        │
│ category        │       └─────────────────┘       │ capacity        │
│ sdg_goals       │                                 │ status          │
│ assigned_events │       ┌─────────────────┐       └─────────────────┘
└─────────────────┘       │ event_interests │               │
                          ├─────────────────┤               │
                          │ id (PK)         │◀──────────────┘
                          │ event_id (FK)   │
                          │ student_id (FK) │
                          │ registered_at   │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   assessments   │       │   assignments   │       │   submissions   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ title           │       │ title           │       │ assignment_id   │
│ description     │       │ description     │       │ student_id      │
│ type            │       │ type            │       │ content         │
│ duration        │       │ due_date        │       │ submitted_at    │
│ total_marks     │       │ total_marks     │       │ score           │
│ passing_score   │       │ rubric          │       │ feedback        │
│ questions       │       │ questions       │       │ status          │
│ published_to    │       │ published_to    │       └─────────────────┘
│ status          │       │ status          │
│ certificate_id  │       │ certificate_id  │
└─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│leave_applications│      │   attendance    │       │     tasks       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ applicant_id    │       │ user_id (FK)    │       │ title           │
│ applicant_type  │       │ date            │       │ description     │
│ leave_type      │       │ check_in        │       │ priority        │
│ start_date      │       │ check_in_gps    │       │ due_date        │
│ end_date        │       │ check_in_valid  │       │ assigned_to     │
│ reason          │       │ check_out       │       │ created_by      │
│ status          │       │ check_out_gps   │       │ status          │
│ approval_chain  │       │ check_out_valid │       │ approval_status │
│ substitute_id   │       │ total_hours     │       │ comments        │
└─────────────────┘       │ overtime_hours  │       └─────────────────┘
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    surveys      │       │survey_responses │       │    feedback     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ title           │◀──────│ survey_id (FK)  │       │ student_id      │
│ description     │       │ student_id      │       │ institution_id  │
│ deadline        │       │ answers         │       │ category        │
│ target_type     │       │ submitted_at    │       │ message         │
│ target_ids      │       └─────────────────┘       │ rating          │
│ questions       │                                 │ status          │
│ status          │                                 │ admin_response  │
│ created_by      │                                 │ is_anonymous    │
└─────────────────┘                                 └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│inventory_items  │       │purchase_requests│       │ audit_records   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │       │ institution_id  │       │ institution_id  │
│ category        │       │ officer_id      │       │ officer_id      │
│ institution_id  │       │ items           │       │ audit_date      │
│ quantity        │       │ total_cost      │       │ findings        │
│ status          │       │ justification   │       │ attachments     │
│ location        │       │ status          │       │ status          │
│ last_audit      │       │ approval_chain  │       │ created_at      │
└─────────────────┘       └─────────────────┘       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│cert_templates   │       │earned_certs     │       │   timetables    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ name            │◀──────│ template_id(FK) │       │ officer_id      │
│ image_url       │       │ student_id      │       │ institution_id  │
│ name_position   │       │ activity_type   │       │ class_id        │
│ font_settings   │       │ activity_id     │       │ day_of_week     │
│ activity_type   │       │ earned_at       │       │ period          │
│ created_by      │       │ verification_cd │       │ course_id       │
└─────────────────┘       └─────────────────┘       │ room            │
                                                    └─────────────────┘
```

---

## 8. Security Considerations

### 8.1 Role-Based Access Control (RBAC)

```sql
-- Row-Level Security Policy Example
CREATE POLICY "Officers see only their institution"
ON students
FOR SELECT
USING (
  institution_id = (
    SELECT institution_id FROM officers 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Management sees only their institution"
ON students
FOR ALL
USING (
  institution_id = (
    SELECT institution_id FROM users 
    WHERE id = auth.uid() AND role = 'management'
  )
);

CREATE POLICY "System admin sees all"
ON students
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'system_admin'
  )
);
```

### 8.2 Position-Based Feature Access

```typescript
// Check if user's position has access to a feature
const hasFeatureAccess = (
  userPosition: CustomPosition,
  feature: SystemAdminFeature
): boolean => {
  return userPosition.visible_features.includes(feature);
};

// Middleware example for API routes
const featureGuard = (requiredFeature: SystemAdminFeature) => {
  return async (req, res, next) => {
    const user = await getUserFromToken(req.headers.authorization);
    const position = await getPositionById(user.position_id);
    
    if (!position.visible_features.includes(requiredFeature)) {
      return res.status(403).json({ error: 'Feature not accessible' });
    }
    
    next();
  };
};
```

### 8.3 Institutional Isolation for Officers

```typescript
// All officer queries MUST include institution filter
const getStudentsForOfficer = async (officerId: string) => {
  const officer = await getOfficerById(officerId);
  
  // CRITICAL: Always filter by officer's institution
  return await db.students
    .where('institution_id', '==', officer.institution_id)
    .get();
};

// Project creation must validate team members
const createProject = async (projectData, officerId: string) => {
  const officer = await getOfficerById(officerId);
  
  // Validate all team members belong to officer's institution
  for (const member of projectData.team_members) {
    const student = await getStudentById(member.student_id);
    if (student.institution_id !== officer.institution_id) {
      throw new Error('Cannot add students from other institutions');
    }
  }
  
  return await db.projects.create({
    ...projectData,
    institution_id: officer.institution_id,
    created_by: officerId
  });
};
```

---

## 9. API Endpoints Required

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login with email/password |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/change-password` | Change password (authenticated) |

### Positions & Meta Staff

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/positions` | List all positions |
| POST | `/api/positions` | Create position |
| PUT | `/api/positions/:id` | Update position |
| DELETE | `/api/positions/:id` | Delete position |
| GET | `/api/meta-staff` | List all meta staff |
| POST | `/api/meta-staff` | Create meta staff member |
| PUT | `/api/meta-staff/:id` | Update meta staff |
| DELETE | `/api/meta-staff/:id` | Delete meta staff |

### Institutions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/institutions` | List all institutions |
| GET | `/api/institutions/:id` | Get institution details |
| POST | `/api/institutions` | Onboard new institution |
| PUT | `/api/institutions/:id` | Update institution |
| DELETE | `/api/institutions/:id` | Deactivate institution |
| GET | `/api/institutions/:id/classes` | Get institution classes |
| GET | `/api/institutions/:id/students` | Get institution students |
| GET | `/api/institutions/:id/timetable` | Get institution timetable |

### Officers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/officers` | List all officers |
| GET | `/api/officers/:id` | Get officer details |
| POST | `/api/officers` | Onboard new officer |
| PUT | `/api/officers/:id` | Update officer |
| DELETE | `/api/officers/:id` | Deactivate officer |
| GET | `/api/officers/:id/timetable` | Get officer timetable |
| GET | `/api/officers/:id/attendance` | Get officer attendance |
| POST | `/api/officers/:id/check-in` | Officer check-in with GPS |
| POST | `/api/officers/:id/check-out` | Officer check-out with GPS |

### Students

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students (filtered by role) |
| GET | `/api/students/:id` | Get student details |
| POST | `/api/students` | Onboard new student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Deactivate student |
| GET | `/api/students/:id/courses` | Get enrolled courses |
| GET | `/api/students/:id/progress` | Get learning progress |
| GET | `/api/students/:id/certificates` | Get earned certificates |

### Courses & Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses |
| GET | `/api/courses/:id` | Get course details with levels |
| POST | `/api/courses` | Create course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| GET | `/api/courses/:id/levels` | Get course levels |
| POST | `/api/courses/:id/levels` | Add level to course |
| PUT | `/api/levels/:id` | Update level |
| POST | `/api/content/:id/complete` | Mark content complete |
| GET | `/api/students/:id/learning-log` | Get student learning log |

### Assessments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments` | List assessments |
| GET | `/api/assessments/:id` | Get assessment details |
| POST | `/api/assessments` | Create assessment |
| PUT | `/api/assessments/:id` | Update assessment |
| DELETE | `/api/assessments/:id` | Delete assessment |
| POST | `/api/assessments/:id/submit` | Submit assessment attempt |
| GET | `/api/assessments/:id/analytics` | Get assessment analytics |

### Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List assignments |
| GET | `/api/assignments/:id` | Get assignment details |
| POST | `/api/assignments` | Create assignment |
| PUT | `/api/assignments/:id` | Update assignment |
| DELETE | `/api/assignments/:id` | Delete assignment |
| POST | `/api/assignments/:id/submit` | Submit assignment |
| PUT | `/api/submissions/:id/grade` | Grade submission |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects (filtered by role) |
| GET | `/api/projects/:id` | Get project details |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/assign-event` | Assign project to event |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events |
| GET | `/api/events/:id` | Get event details |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| POST | `/api/events/:id/interest` | Express interest in event |
| GET | `/api/events/:id/interests` | Get interested students |

### Leave Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leave/applications` | List leave applications |
| POST | `/api/leave/apply` | Apply for leave |
| PUT | `/api/leave/:id/approve` | Approve leave |
| PUT | `/api/leave/:id/reject` | Reject leave |
| GET | `/api/leave/balance/:userId` | Get leave balance |
| PUT | `/api/leave/balance/:userId` | Update leave balance |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filtered by role) |
| GET | `/api/tasks/:id` | Get task details |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| PUT | `/api/tasks/:id/status` | Update task status |
| POST | `/api/tasks/:id/submit` | Submit for approval |
| PUT | `/api/tasks/:id/approve` | Approve task |
| PUT | `/api/tasks/:id/reject` | Reject task |

### Surveys & Feedback

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/surveys` | List surveys |
| POST | `/api/surveys` | Create survey |
| PUT | `/api/surveys/:id` | Update survey |
| DELETE | `/api/surveys/:id` | Delete survey |
| POST | `/api/surveys/:id/respond` | Submit survey response |
| GET | `/api/surveys/:id/responses` | Get survey responses |
| GET | `/api/feedback` | List feedback |
| POST | `/api/feedback` | Submit feedback |
| PUT | `/api/feedback/:id/respond` | Respond to feedback |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List inventory items |
| POST | `/api/inventory` | Add inventory item |
| PUT | `/api/inventory/:id` | Update inventory item |
| DELETE | `/api/inventory/:id` | Delete inventory item |
| GET | `/api/purchase-requests` | List purchase requests |
| POST | `/api/purchase-requests` | Create purchase request |
| PUT | `/api/purchase-requests/:id/approve` | Approve request |
| PUT | `/api/purchase-requests/:id/reject` | Reject request |
| POST | `/api/audit-records` | Create audit record |

### Gamification & Certificates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/badges` | List badges |
| POST | `/api/badges` | Create badge |
| GET | `/api/xp-rules` | List XP rules |
| POST | `/api/xp-rules` | Create XP rule |
| GET | `/api/certificate-templates` | List templates |
| POST | `/api/certificate-templates` | Create template |
| GET | `/api/certificates/earned/:studentId` | Get earned certificates |
| POST | `/api/certificates/award` | Award certificate |

### Attendance & Payroll

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | List attendance records |
| GET | `/api/attendance/:userId/monthly` | Get monthly attendance |
| POST | `/api/attendance/check-in` | Check in with GPS |
| POST | `/api/attendance/check-out` | Check out with GPS |
| GET | `/api/payroll/:userId/monthly` | Get monthly payroll |
| POST | `/api/payroll/approve` | Approve payroll |

---

## 10. Frontend Files Reference

### Type Definitions

| File | Purpose |
|------|---------|
| `src/types/index.ts` | Core user and API types |
| `src/types/permissions.ts` | Position and feature types |
| `src/types/assessment.ts` | Assessment-related types |
| `src/types/assignment-management.ts` | Assignment types |
| `src/types/institution.ts` | Institution and class types |

### Mock Data Files

| File | Purpose |
|------|---------|
| `src/data/mockUsers.ts` | User authentication data |
| `src/data/mockPositions.ts` | Dynamic positions |
| `src/data/mockInstitutions.ts` | Institution data |
| `src/data/mockOfficerData.ts` | Officer profiles |
| `src/data/mockStudents.ts` | Student records |
| `src/data/mockMetaStaffData.ts` | Meta staff members |
| `src/data/mockCourses.ts` | STEM curriculum |
| `src/data/mockProjects.ts` | Project data |
| `src/data/mockEvents.ts` | Event data |
| `src/data/mockLeaveData.ts` | Leave applications |
| `src/data/mockTaskData.ts` | Task management |
| `src/data/mockSurveyFeedback.ts` | Surveys and feedback |
| `src/data/mockInventory.ts` | Inventory data |

### Core Components

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main routing configuration |
| `src/components/layout/Sidebar.tsx` | Dynamic sidebar |
| `src/contexts/AuthContext.tsx` | Authentication state |
| `src/services/api.ts` | API client with interceptors |

### Utility Functions

| File | Purpose |
|------|---------|
| `src/utils/roleHelpers.ts` | Role-based path helpers |
| `src/utils/timetableSync.ts` | Timetable synchronization |
| `src/services/passwordService.ts` | Password management |

---

## Appendix: Mock Data Institution Details

### Institution 1: Modern School Vasant Vihar

- **ID:** `inst-msd-001`
- **Location:** New Delhi
- **Student ID Pattern:** `MSD-{YEAR}-{XXXX}`
- **Classes:** Grades 6-12, Sections A & B (14 classes)
- **Total Students:** 350
- **Innovation Officer:** Mr. Atif Ansari (`off-msd-001`)

### Institution 2: Kikani Global Academy

- **ID:** `inst-kga-001`
- **Location:** Coimbatore
- **Student ID Pattern:** `KGA-{YEAR}-{XXXX}`
- **Classes:** Grades 6-12, Sections A, B & C (21 classes)
- **Total Students:** 520
- **Innovation Officers:**
  - Mr. Saran T (Senior) (`off-kga-001`)
  - Mr. Sreeram R (`off-kga-002`)

---

**Document End**

*This documentation is designed for backend developers to understand the complete frontend system architecture, data flows, and API requirements for the Meta-Innova Innovation Academy Platform.*
