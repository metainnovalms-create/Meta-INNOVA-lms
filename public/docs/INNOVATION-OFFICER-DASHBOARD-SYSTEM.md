# Innovation Officer Dashboard System - Complete Documentation

> **Purpose**: Comprehensive documentation for backend developers to understand the Innovation Officer Dashboard frontend architecture, institutional isolation, GPS-based attendance, data flows, API requirements, and database schema for the Meta-Innova platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Officer Onboarding Workflow](#2-officer-onboarding-workflow)
3. [Officer Data Models](#3-officer-data-models)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Routing Configuration](#5-routing-configuration)
6. [Sidebar Menu Configuration](#6-sidebar-menu-configuration)
7. [Complete Page Breakdown](#7-complete-page-breakdown)
8. [GPS-Based Attendance & Payroll System](#8-gps-based-attendance--payroll-system)
9. [Bidirectional Synchronization Flows](#9-bidirectional-synchronization-flows)
10. [API Endpoints Specification](#10-api-endpoints-specification)
11. [Database Schema](#11-database-schema)
12. [Key Frontend Files Reference](#12-key-frontend-files-reference)
13. [Security Considerations](#13-security-considerations)

---

## 1. Architecture Overview

### 1.1 Multi-Tenant Structure with Officer-Institution Relationship

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         META-INNOVA PLATFORM                                 │
│                         (System Admin Level)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      SYSTEM ADMIN (CEO/MD/AGM)                       │    │
│  │                                                                      │    │
│  │  • Creates Innovation Officers via Officer Management               │    │
│  │  • Assigns officers to institutions (1:1 STRICT)                    │    │
│  │  • Sets credentials via Credential Management                       │    │
│  │  • Configures salary (hourly rate, overtime multiplier)             │    │
│  │  • Configures leave allowances (casual, sick, earned)               │    │
│  │  • Views attendance, approves leave, manages payroll                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    │               │               │                        │
│                    ▼               ▼               ▼                        │
│  ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐   │
│  │ INNOVATION OFFICER  │ │ INNOVATION OFFICER  │ │ INNOVATION OFFICER  │   │
│  │ Mr. Atif Ansari     │ │ Mr. Saran T (Sr.)   │ │ Mr. Sreeram R       │   │
│  │ off-msd-001         │ │ off-kga-001         │ │ off-kga-002         │   │
│  │ EMP-IOF-001         │ │ EMP-IOF-002         │ │ EMP-IOF-003         │   │
│  ├─────────────────────┤ ├─────────────────────┤ ├─────────────────────┤   │
│  │ ASSIGNED TO:        │ │ ASSIGNED TO:        │ │ ASSIGNED TO:        │   │
│  │ Modern School       │ │ Kikani Global       │ │ Kikani Global       │   │
│  │ inst-msd-001        │ │ inst-kga-001        │ │ inst-kga-001        │   │
│  │ (1:1 RELATIONSHIP)  │ │ (1:1 RELATIONSHIP)  │ │ (1:1 RELATIONSHIP)  │   │
│  └──────────┬──────────┘ └──────────┬──────────┘ └──────────┬──────────┘   │
│             │                       │                       │               │
│             │ CAN ONLY ACCESS       │ CAN ONLY ACCESS       │               │
│             ▼                       ▼                       ▼               │
│  ┌─────────────────────┐ ┌─────────────────────────────────────────────┐   │
│  │ MODERN SCHOOL       │ │ KIKANI GLOBAL ACADEMY                       │   │
│  │ inst-msd-001        │ │ inst-kga-001                                │   │
│  │                     │ │                                             │   │
│  │ • 350 Students      │ │ • 520 Students                              │   │
│  │ • Grades 6-12       │ │ • Grades 6-12                               │   │
│  │ • Sections A, B     │ │ • Sections A, B, C                          │   │
│  │ • Management Admin  │ │ • Management Admin                          │   │
│  └─────────────────────┘ └─────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Critical: Officer-Institution 1:1 Relationship

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OFFICER-INSTITUTION ASSIGNMENT RULE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  RULE: Each Innovation Officer is assigned to EXACTLY ONE institution       │
│                                                                              │
│  ┌─────────────────┐         ┌─────────────────┐                            │
│  │  Officer A      │────────►│  Institution X  │                            │
│  └─────────────────┘    1:1  └─────────────────┘                            │
│                                                                              │
│  CANNOT DO:                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                            │
│  │  Officer A      │────────►│  Institution X  │                            │
│  └─────────────────┘         └─────────────────┘                            │
│          │                   ┌─────────────────┐                            │
│          └──────────────────►│  Institution Y  │  ✗ NOT ALLOWED             │
│                              └─────────────────┘                            │
│                                                                              │
│  DATABASE ENFORCEMENT:                                                       │
│  UNIQUE constraint on officer_assignments.officer_id                        │
│                                                                              │
│  IMPLICATION:                                                                │
│  - Officer sees ONLY their assigned institution's data                      │
│  - Students list filtered to assigned institution                           │
│  - Projects created only for assigned institution students                  │
│  - Inventory managed only for assigned institution                          │
│  - Assessments filtered to assigned institution                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Data Flow Direction

```
                              ┌─────────────────┐
                              │  SYSTEM ADMIN   │
                              │  (Platform)     │
                              └────────┬────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           │ Creates/Configures        │ Creates/Publishes         │ Assigns Tasks
           │ Officer Records           │ Assessments, Courses      │ Manages Leave
           │                           │ Events, Gamification      │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INNOVATION OFFICER                                 │
│                                                                              │
│  RECEIVES FROM SYSTEM ADMIN:          SENDS TO SYSTEM ADMIN:                │
│  ├─ Salary configuration              ├─ Attendance (GPS-validated)         │
│  ├─ Leave allowances                  ├─ Leave applications                 │
│  ├─ Task assignments                  ├─ Task status updates                │
│  ├─ Timetable assignments             ├─ Audit reports                      │
│  └─ Published assessments             └─ Purchase requests                  │
│                                                                              │
│  RECEIVES FROM INSTITUTION:           SENDS TO INSTITUTION:                 │
│  ├─ Student list (filtered)           ├─ Projects created                   │
│  ├─ Class information                 ├─ Content completion                 │
│  └─ Inventory items                   ├─ Assessment results                 │
│                                        └─ Inventory updates                 │
│                                                                              │
│  RECEIVES FROM STUDENTS:              SENDS TO STUDENTS:                    │
│  ├─ Assignment submissions            ├─ Grades & feedback                  │
│  ├─ Project progress                  ├─ Timetable/schedule                 │
│  └─ Event interests                   └─ Content completion marks           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  INSTITUTION        │    │     STUDENTS        │    │  MANAGEMENT ADMIN   │
│  MANAGEMENT         │    │  (Assigned          │    │  (Institution)      │
│                     │    │   Institution Only) │    │                     │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

---

## 2. Officer Onboarding Workflow

### 2.1 Complete Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INNOVATION OFFICER ONBOARDING WORKFLOW                    │
└─────────────────────────────────────────────────────────────────────────────┘

Step 1: System Admin creates officer via Officer Management page
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  System Admin Dashboard → Officer Management → Add Officer                   │
│                                                                              │
│  Form Fields:                                                                │
│  ├─ name (required): "Mr. Atif Ansari"                                       │
│  ├─ email (required, unique): "atif.ansari@metainnova.com"                   │
│  ├─ phone (required): "+91-9876543210"                                       │
│  ├─ date_of_birth (required): "1990-05-15"                                   │
│  ├─ address (required): "South Extension, New Delhi"                         │
│  ├─ employment_type (required): "full_time" | "part_time" | "contract"       │
│  ├─ department (auto): "Innovation & STEM Education"                         │
│  │                                                                           │
│  ├─ SALARY CONFIGURATION:                                                    │
│  │   ├─ salary (monthly): 55000                                              │
│  │   ├─ hourly_rate: 343.75 (calculated or manual)                           │
│  │   ├─ overtime_rate_multiplier: 1.5                                        │
│  │   └─ normal_working_hours: 7 (hours per day)                              │
│  │                                                                           │
│  ├─ LEAVE ALLOWANCES:                                                        │
│  │   ├─ casual_leave: 12 (days per year)                                     │
│  │   ├─ sick_leave: 10 (days per year)                                       │
│  │   └─ earned_leave: 15 (days per year)                                     │
│  │                                                                           │
│  ├─ qualifications[]: ["M.Tech in Electronics", "B.E. Electronics"]          │
│  ├─ certifications[]: ["ATL Trainer Certification"]                          │
│  └─ skills[]: ["STEM Education", "Robotics", "Project Mentorship"]           │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 2: System generates Employee ID
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Employee ID Generation Pattern:                                             │
│                                                                              │
│  Format: EMP-IOF-{COUNTER}                                                   │
│                                                                              │
│  Examples:                                                                   │
│  ├─ EMP-IOF-001 (First innovation officer)                                   │
│  ├─ EMP-IOF-002 (Second innovation officer)                                  │
│  └─ EMP-IOF-003 (Third innovation officer)                                   │
│                                                                              │
│  Properties:                                                                 │
│  ├─ Unique across all officers                                               │
│  ├─ Sequential counter                                                       │
│  └─ Identifies officer type (IOF = Innovation Officer)                       │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 3: Officer record created with credential_status = 'pending'
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Officer Record Created:                                                     │
│  {                                                                           │
│    id: "off-msd-001",                                                        │
│    employee_id: "EMP-IOF-001",                                               │
│    name: "Mr. Atif Ansari",                                                  │
│    email: "atif.ansari@metainnova.com",                                      │
│    credential_status: "pending",                                             │
│    must_change_password: true,                                               │
│    status: "active",                                                         │
│    assigned_institutions: [],  // Empty until Step 5                         │
│    ...                                                                       │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 4: System Admin sets credentials via Credential Management
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Credential Management → Meta Employees Tab                                  │
│                                                                              │
│  1. Find officer with "Pending Setup" badge                                  │
│  2. Click "Set Up Credentials"                                               │
│  3. SetPasswordDialog opens:                                                 │
│     ├─ Auto-generate secure password (recommended)                           │
│     │   → Generates random string: "Xk9#mP2$vL7@"                            │
│     │   → Shows password ONCE for admin to communicate                       │
│     └─ OR manually set password                                              │
│        → Password strength validation:                                       │
│        → Min 8 chars, uppercase, lowercase, number, special char             │
│  4. Save → credential_status = 'configured'                                  │
│  5. Admin communicates temporary password to officer                         │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 5: System Admin assigns officer to institution
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Officer Detail Page → Institutions Tab → Assign Institution                 │
│                                                                              │
│  1. Click "Assign Institution" button                                        │
│  2. Select institution from dropdown:                                        │
│     ├─ Modern School Vasant Vihar (inst-msd-001)                             │
│     └─ Kikani Global Academy (inst-kga-001)                                  │
│  3. Confirm assignment                                                       │
│  4. officer_assignments record created:                                      │
│     {                                                                        │
│       officer_id: "off-msd-001",                                             │
│       institution_id: "inst-msd-001",                                        │
│       assigned_at: "2025-04-01T10:00:00Z"                                    │
│     }                                                                        │
│                                                                              │
│  CRITICAL: UNIQUE constraint on officer_id ensures 1:1 relationship          │
│  If officer already assigned, must remove existing assignment first          │
└─────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 6: Officer first login with forced password change
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  First Login Flow:                                                           │
│                                                                              │
│  1. Officer navigates to /login                                              │
│  2. Enters email + temporary password                                        │
│  3. Backend validates credentials                                            │
│  4. Backend returns:                                                         │
│     {                                                                        │
│       user: {                                                                │
│         id: "off-msd-001",                                                   │
│         role: "officer",                                                     │
│         institution_id: "inst-msd-001",                                      │
│         tenant_id: "modern-school-vasant-vihar"                             │
│       },                                                                     │
│       token: "jwt-token",                                                    │
│       must_change_password: true                                             │
│     }                                                                        │
│  5. Frontend redirects to /tenant/{slug}/officer/dashboard                   │
│  6. ForcePasswordChangeDialog appears (NON-DISMISSIBLE):                     │
│     ├─ Cannot close via X button                                             │
│     ├─ Cannot close via outside click                                        │
│     ├─ Cannot close via ESC key                                              │
│     └─ Must change password to proceed                                       │
│  7. Officer enters:                                                          │
│     ├─ Current temporary password                                            │
│     ├─ New password (with strength validation)                               │
│     └─ Confirm new password                                                  │
│  8. On success:                                                              │
│     ├─ must_change_password = false                                          │
│     ├─ password_changed_at = timestamp                                       │
│     └─ Dashboard becomes accessible                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Assignment Change Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Reassigning Officer to Different Institution:                               │
│                                                                              │
│  1. System Admin opens Officer Detail → Institutions Tab                     │
│  2. Views current assignment                                                 │
│  3. Clicks "Remove Assignment" on current institution                        │
│  4. Confirms removal (shows warning about data implications)                 │
│  5. officer_assignments record deleted                                       │
│  6. Clicks "Assign Institution" for new institution                          │
│  7. New officer_assignments record created                                   │
│                                                                              │
│  DATA IMPLICATIONS:                                                          │
│  - Officer loses access to previous institution data                         │
│  - Projects where officer was mentor remain but mentor_id preserved          │
│  - Timetable assignments for old institution become invalid                  │
│  - New timetable must be configured for new institution                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Officer Data Models

### 3.1 Officer Entity

```typescript
interface OfficerDetails {
  // Primary Identifiers
  id: string;                      // "off-msd-001"
  employee_id: string;             // "EMP-IOF-001"
  
  // Personal Information
  name: string;                    // "Mr. Atif Ansari"
  email: string;                   // "atif.ansari@metainnova.com"
  phone: string;                   // "+91-9876543210"
  date_of_birth: string;           // "1990-05-15"
  address: string;                 // "South Extension, New Delhi"
  profile_photo_url?: string;      // Avatar URL
  
  // Employment Details
  employment_type: 'full_time' | 'part_time' | 'contract';
  department: string;              // "Innovation & STEM Education"
  join_date: string;               // "2025-04-01"
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  
  // Institution Assignment (fetched from officer_assignments)
  assigned_institutions: string[]; // ["inst-msd-001"] - Always 0 or 1 element
  
  // Salary Configuration
  salary: number;                  // Monthly salary: 55000
  hourly_rate: number;             // ₹ per hour: 343.75
  overtime_rate_multiplier: number; // e.g., 1.5 for 1.5x pay
  normal_working_hours: number;    // Hours per day: 7
  
  // Leave Allowances (yearly)
  casual_leave?: number;           // Days: 12
  sick_leave?: number;             // Days: 10
  earned_leave?: number;           // Days: 15
  
  // Professional Details
  qualifications: string[];        // ["M.Tech in Electronics", ...]
  certifications: string[];        // ["ATL Trainer Certification", ...]
  skills: string[];                // ["STEM Education", "Robotics", ...]
  
  // Credential Status
  credential_status: 'pending' | 'configured';
  must_change_password: boolean;
  password_changed_at?: string;
}
```

### 3.2 Officer Assignment Entity

```typescript
interface OfficerAssignment {
  id: string;
  officer_id: string;              // Foreign key to officers
  institution_id: string;          // Foreign key to institutions
  assigned_at: string;             // Timestamp
  assigned_by: string;             // System admin who made assignment
  
  // Denormalized for convenience
  institution_name?: string;
  institution_slug?: string;
}

// CRITICAL: UNIQUE constraint on officer_id
// Each officer can have AT MOST ONE assignment
```

### 3.3 Officer Credentials Entity

```typescript
interface OfficerCredentials {
  id: string;
  officer_id: string;              // Foreign key to officers
  password_hash: string;           // bcrypt hash
  must_change_password: boolean;
  password_changed_at?: string;
  credential_status: 'pending' | 'configured';
  failed_attempts: number;
  locked_until?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
}
```

### 3.4 Officer Attendance Entity (GPS-Based)

```typescript
interface OfficerAttendance {
  id: string;
  officer_id: string;
  date: string;                    // "2024-12-10"
  
  // Check-in Details
  check_in_time?: string;          // "09:15 AM"
  check_in_location?: {
    latitude: number;              // 28.5678
    longitude: number;             // 77.2100
  };
  check_in_validated?: boolean;    // GPS within institution radius
  
  // Check-out Details
  check_out_time?: string;         // "05:30 PM"
  check_out_location?: {
    latitude: number;
    longitude: number;
  };
  check_out_validated?: boolean;
  
  // Calculated Fields
  total_hours?: number;            // 8.25 hours
  overtime_hours?: number;         // 1.25 hours (beyond normal_working_hours)
  
  // Status
  status: 'present' | 'absent' | 'leave' | 'half_day' | 'not_marked';
  
  // Metadata
  institution_id: string;          // Where attendance was marked
  created_at: string;
  updated_at: string;
}
```

### 3.5 Officer Timetable Slot Entity

```typescript
interface OfficerTimetableSlot {
  id: string;
  officer_id: string;
  
  // Schedule
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  start_time: string;              // "09:00"
  end_time: string;                // "10:00"
  
  // Class Details
  class: string;                   // "Grade 8A"
  class_id: string;                // "cls-msd-8a"
  subject: string;                 // "STEM Workshop - Robotics"
  room: string;                    // "Innovation Lab 1"
  
  // Session Details
  type: 'workshop' | 'lab' | 'mentoring' | 'project_review';
  batch?: string;                  // "Batch A" (optional for batched sessions)
  
  // Course Link
  course_id?: string;              // Links to Course
  current_module_id?: string;      // Tracks progress in course
  
  // Substitute Info (if officer on leave)
  status: 'active' | 'on_leave' | 'substitute';
  original_officer_id?: string;    // If this is a substitute slot
  original_officer_name?: string;
  leave_application_id?: string;
}
```

### 3.6 Officer Leave Balance Entity

```typescript
interface OfficerLeaveBalance {
  id: string;
  officer_id: string;
  year: number;                    // 2024
  
  // Allowances (set by System Admin during onboarding)
  casual_allowed: number;          // 12
  sick_allowed: number;            // 10
  earned_allowed: number;          // 15
  
  // Used (auto-calculated from approved leave applications)
  casual_used: number;             // 3
  sick_used: number;               // 2
  earned_used: number;             // 5
  
  // Remaining (calculated: allowed - used)
  casual_remaining: number;        // 9
  sick_remaining: number;          // 8
  earned_remaining: number;        // 10
  
  updated_at: string;
}
```

### 3.7 Officer Leave Application Entity

```typescript
interface OfficerLeaveApplication {
  id: string;
  officer_id: string;
  officer_name: string;
  institution_id: string;
  
  // Leave Details
  leave_type: 'casual' | 'sick' | 'earned';
  start_date: string;              // "2024-12-15"
  end_date: string;                // "2024-12-17"
  total_days: number;              // 3
  reason: string;
  
  // Substitute (required for teaching coverage)
  substitute_officer_id?: string;
  substitute_officer_name?: string;
  
  // Approval Workflow (2-stage for officers)
  status: 'pending' | 'manager_approved' | 'approved' | 'rejected';
  
  // Stage 1: Manager Approval
  manager_approved_by?: string;
  manager_approved_at?: string;
  manager_comments?: string;
  
  // Stage 2: AGM Approval
  agm_approved_by?: string;
  agm_approved_at?: string;
  agm_comments?: string;
  
  // Rejection
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  
  applied_at: string;
}
```

---

## 4. Authentication & Authorization

### 4.1 Officer Login Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          OFFICER LOGIN FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

     ┌─────────┐                                          ┌─────────────┐
     │  /login │                                          │   Backend   │
     └────┬────┘                                          └──────┬──────┘
          │                                                      │
          │  1. POST /api/v1/auth/login                          │
          │     { email, password }                              │
          │ ─────────────────────────────────────────────────────►
          │                                                      │
          │  2. Backend validates:                               │
          │     - Check officer exists in officers table         │
          │     - Verify password hash                           │
          │     - Check account not locked                       │
          │     - Check status is 'active'                       │
          │                                                      │
          │  3. Fetch officer's institution assignment:          │
          │     SELECT * FROM officer_assignments                │
          │     WHERE officer_id = ?                             │
          │                                                      │
          │  4. Return user data + JWT token                     │
          │ ◄─────────────────────────────────────────────────────
          │     {                                                │
          │       user: {                                        │
          │         id: "off-msd-001",                           │
          │         email: "atif@...",                           │
          │         name: "Mr. Atif Ansari",                     │
          │         role: "officer",                             │
          │         employee_id: "EMP-IOF-001",                  │
          │         institution_id: "inst-msd-001",              │
          │         institution_name: "Modern School...",        │
          │         tenant_id: "modern-school-vasant-vihar"      │
          │       },                                             │
          │       token: "jwt-token-with-institution-claim",     │
          │       must_change_password: false                    │
          │     }                                                │
          │                                                      │
          │  5. JWT Token Payload includes:                      │
          │     {                                                │
          │       sub: "off-msd-001",                            │
          │       role: "officer",                               │
          │       institution_id: "inst-msd-001",                │
          │       iat: timestamp,                                │
          │       exp: timestamp + 24h                           │
          │     }                                                │
          │                                                      │
          │  6. Frontend stores:                                 │
          │     - localStorage.user = user object                │
          │     - localStorage.token = jwt token                 │
          │     - localStorage.tenant = { slug, institution_id } │
          │                                                      │
          │  7. Redirect to:                                     │
          │     /tenant/{institution-slug}/officer/dashboard     │
          │                                                      │
     ┌────┴────┐                                          ┌──────┴──────┐
     │Dashboard│                                          │   Backend   │
     └─────────┘                                          └─────────────┘
```

### 4.2 JWT Token Structure

```typescript
// JWT Payload for Officer
interface OfficerJWTPayload {
  sub: string;           // Officer ID: "off-msd-001"
  role: 'officer';
  institution_id: string; // "inst-msd-001" - CRITICAL for filtering
  employee_id: string;    // "EMP-IOF-001"
  email: string;
  name: string;
  iat: number;           // Issued at
  exp: number;           // Expiration (24 hours)
}

// Every API request includes JWT in header
// Authorization: Bearer <jwt-token>

// Backend extracts institution_id from JWT to filter all queries
```

### 4.3 AuthContext for Officers

```typescript
// What the AuthContext provides for officers
interface AuthContextType {
  user: {
    id: string;              // "off-msd-001"
    email: string;
    name: string;
    role: 'officer';
    employee_id: string;     // "EMP-IOF-001"
    institution_id: string;  // "inst-msd-001" - Used for all filtering
    institution_name: string;
    tenant_id: string;       // URL slug
    avatar?: string;
  } | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

// Usage in components
const { user } = useAuth();
const institutionId = user.institution_id; // All queries use this
```

---

## 5. Routing Configuration

### 5.1 URL Structure

```
Base URL: /tenant/{institution-slug}/officer/{page}

Examples:
 /tenant/modern-school-vasant-vihar/officer/dashboard
 /tenant/modern-school-vasant-vihar/officer/teaching
 /tenant/modern-school-vasant-vihar/officer/projects
 /tenant/kikani-global-academy/officer/assessments
```

### 5.2 Complete Route Table

| Route Path | Component | Purpose |
|------------|-----------|---------|
| `/tenant/:tenantId/officer/dashboard` | `OfficerDashboard.tsx` | Main dashboard with stats, check-in |
| `/tenant/:tenantId/officer/teaching` | `Teaching.tsx` | Course content management, class sessions |
| `/tenant/:tenantId/officer/sessions` | `Sessions.tsx` | Personal timetable, schedule |
| `/tenant/:tenantId/officer/projects` | `OfficerProjects.tsx` | Create/manage student projects |
| `/tenant/:tenantId/officer/lab-inventory` | `LabInventory.tsx` | Stock management, purchase requests |
| `/tenant/:tenantId/officer/assessments` | `OfficerAssessments.tsx` | View/grade assessments |
| `/tenant/:tenantId/officer/assignments` | `OfficerAssignments.tsx` | Grade student submissions |
| `/tenant/:tenantId/officer/leave` | `LeaveManagement.tsx` | Apply for leave, view balance |
| `/tenant/:tenantId/officer/task` | `OfficerTask.tsx` | Teaching + Task Allotment tabs |
| `/tenant/:tenantId/officer/ask-metova` | `OfficerAskMetova.tsx` | AI assistant |
| `/tenant/:tenantId/officer/settings` | `OfficerSettings.tsx` | Password management |

### 5.3 Route Configuration

```typescript
// Officer Routes (all protected, role: 'officer')
<Route path="/tenant/:tenantId/officer" element={<ProtectedRoute allowedRoles={['officer']} />}>
  <Route path="dashboard" element={<OfficerDashboard />} />
  <Route path="teaching" element={<Teaching />} />
  <Route path="sessions" element={<Sessions />} />
  <Route path="projects" element={<OfficerProjects />} />
  <Route path="lab-inventory" element={<LabInventory />} />
  <Route path="assessments" element={<OfficerAssessments />} />
  <Route path="assignments" element={<OfficerAssignments />} />
  <Route path="leave" element={<LeaveManagement />} />
  <Route path="task" element={<OfficerTask />} />
  <Route path="ask-metova" element={<OfficerAskMetova />} />
  <Route path="settings" element={<OfficerSettings />} />
</Route>
```

---

## 6. Sidebar Menu Configuration

### 6.1 Officer Menu Items

| Order | Label           | Icon              | Path           | Component              |
|-------|-----------------|-------------------|----------------|------------------------|
| 1     | Dashboard       | `LayoutDashboard` | /dashboard     | OfficerDashboard.tsx   |
| 2     | Teaching        | `GraduationCap`   | /teaching      | Teaching.tsx           |
| 3     | Sessions        | `Calendar`        | /sessions      | Sessions.tsx           |
| 4     | Projects        | `Target`          | /projects      | OfficerProjects.tsx    |
| 5     | Lab Inventory   | `Package`         | /lab-inventory | LabInventory.tsx       |
| 6     | Assessments     | `FileText`        | /assessments   | OfficerAssessments.tsx |
| 7     | Assignments     | `ClipboardList`   | /assignments   | OfficerAssignments.tsx |
| 8     | Leave Management| `Calendar`        | /leave         | LeaveManagement.tsx    |
| 9     | Task            | `CheckSquare`     | /task          | OfficerTask.tsx        |
| 10    | Ask Metova      | `Bot`             | /ask-metova    | OfficerAskMetova.tsx   |
| 11    | Settings        | `Settings`        | /settings      | OfficerSettings.tsx    |

### 6.2 Sidebar Data Fetching Based on Institution

```typescript
// Sidebar.tsx - How institution context is loaded

const OfficerSidebar = () => {
  const { user } = useAuth();
  const institutionId = user?.institution_id;
  
  // All sidebar data queries use institutionId
  
  // Example: Fetch students for project team selection
  const students = useQuery({
    queryKey: ['students', institutionId],
    queryFn: () => getStudentsByInstitution(institutionId),
    enabled: !!institutionId
  });
  
  // Example: Fetch classes for teaching
  const classes = useQuery({
    queryKey: ['classes', institutionId],
    queryFn: () => getClassesByInstitution(institutionId),
    enabled: !!institutionId
  });
  
  // Example: Fetch inventory items
  const inventory = useQuery({
    queryKey: ['inventory', institutionId],
    queryFn: () => getInventoryByInstitution(institutionId),
    enabled: !!institutionId
  });
  
  return (
    <Sidebar>
      {menuItems.map(item => (
        <SidebarMenuItem 
          key={item.path}
          item={item}
          // Badge counts are institution-specific
          badge={getBadgeCount(item.path, institutionId)}
        />
      ))}
    </Sidebar>
  );
};

// getStudentsByInstitution query
const getStudentsByInstitution = async (institutionId: string) => {
  const response = await api.get(`/api/v1/institutions/${institutionId}/students`);
  return response.data;
};
```

### 6.3 Institution-Based Filtering Pattern

```typescript
// Pattern used across ALL officer pages

const OfficerComponent = () => {
  const { user } = useAuth();
  
  // CRITICAL: Get institution_id from authenticated user
  const institutionId = user?.institution_id;
  
  if (!institutionId) {
    return <Error message="No institution assigned" />;
  }
  
  // ALL data queries filtered by institutionId
  const { data: students } = useStudents(institutionId);
  const { data: classes } = useClasses(institutionId);
  const { data: projects } = useProjects(institutionId);
  const { data: assessments } = useAssessments(institutionId);
  const { data: inventory } = useInventory(institutionId);
  
  // Officer can ONLY see/modify data for their assigned institution
  return (
    <Layout>
      {/* All rendered data is institution-specific */}
    </Layout>
  );
};
```

---

## 7. Complete Page Breakdown

### 7.1 Dashboard (`OfficerDashboard.tsx`)

**Purpose**: Central hub with attendance check-in/out, salary tracker, quick stats.

**Data Sources**:
```typescript
const { user } = useAuth();
const officerId = user.id;
const institutionId = user.institution_id;

// Today's attendance
getOfficerAttendance(officerId, today)

// Salary tracker data (real-time calculation)
getOfficerSalaryTracker(officerId, currentMonth)

// Quick stats
getOfficerDashboardStats(officerId, institutionId)

// Upcoming sessions today
getOfficerTodaySessions(officerId)

// Leave balance
getOfficerLeaveBalance(officerId, currentYear)

// Assigned tasks
getOfficerTasks(officerId, 'pending')
```

**Key Components**:
- `AttendanceCheckInOut`: GPS-based check-in/check-out
- `SalaryTrackerCard`: Real-time earnings display
- `QuickStatsGrid`: Students count, projects, classes
- `TodaySchedule`: Today's sessions
- `LeaveBalanceCard`: Remaining leave days
- `PendingTasksCard`: Tasks needing attention

**UI Layout**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Welcome, Mr. Atif Ansari!                    Modern School Vasant Vihar    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │     ATTENDANCE STATUS           │  │     MY SALARY TRACKER            │   │
│  │                                 │  │                                  │   │
│  │  Status: Not Checked In         │  │  This Month: ₹45,250             │   │
│  │                                 │  │  ├─ Base: ₹38,500                │   │
│  │  [📍 Check In]                  │  │  ├─ Overtime: ₹6,750             │   │
│  │                                 │  │  └─ Hours: 145h / 154h          │   │
│  │  Location will be captured      │  │                                  │   │
│  │  automatically via GPS          │  │  [View Details]                  │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │ Students │ │ Projects │ │ Classes  │ │ Sessions │                        │
│  │   350    │ │    12    │ │    14    │ │    28    │                        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                        │
│                                                                              │
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐   │
│  │     TODAY'S SCHEDULE            │  │     LEAVE BALANCE               │   │
│  │                                 │  │                                  │   │
│  │  09:00 - Grade 8A - AI Lab 1   │  │  Casual: 9/12 remaining          │   │
│  │  10:00 - Grade 7B - Robotics   │  │  Sick: 8/10 remaining            │   │
│  │  11:30 - Grade 9A - IoT Lab    │  │  Earned: 10/15 remaining         │   │
│  │  ...                           │  │                                  │   │
│  └─────────────────────────────────┘  └─────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 7.2 Teaching (`Teaching.tsx`)

**Purpose**: Manage course content delivery, mark student attendance, mark content completion.

**Data Sources**:
```typescript
const { user } = useAuth();
const officerId = user.id;
const institutionId = user.institution_id;

// Courses assigned to officer
getOfficerCourses(officerId)

// Classes officer teaches
getOfficerClasses(officerId, institutionId)

// Students in each class (filtered by institution)
getStudentsByClass(classId, institutionId)

// Course content structure
getCourseWithLevels(courseId)

// Content completion status
getContentCompletionByClass(courseId, classId)
```

**Key Features**:
- Select class from dropdown (only assigned classes)
- View course curriculum with levels/sessions/content
- Mark content as "Complete" for entire class
- Auto-mark completion for all PRESENT students
- Track teaching progress per class

**Content Completion Flow**:
```
1. Officer selects class (e.g., Grade 8A)
   ↓
2. View course content hierarchy
   ↓
3. Click "Mark Complete" on content item
   ↓
4. System prompts for attendance check:
   "Mark completion for students who attended today's session?"
   ↓
5. Officer confirms
   ↓
6. System creates ContentCompletion records for ALL present students:
   {
     content_id,
     student_id,
     completed: true,
     completed_by: 'officer',
     officer_id: user.id,
     officer_name: user.name,
     session_date: today,
     class_id
   }
   ↓
7. Students see "Completed by Mr. Atif during class" badge
```

---

### 7.3 Sessions (`Sessions.tsx`)

**Purpose**: View personal timetable, weekly schedule.

**Data Sources**:
```typescript
const { user } = useAuth();
const officerId = user.id;

// Personal timetable
getOfficerTimetable(officerId)
```

**Key Features**:
- Weekly calendar view of all sessions
- Color-coded by session type (workshop, lab, mentoring)
- Click session for details
- See room assignments
- Export schedule

**Timetable Display**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     My Weekly Schedule - Mr. Atif Ansari                     │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   Time   │  Monday  │  Tuesday │Wednesday │ Thursday │  Friday  │ Saturday │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 9:00-    │ Grade 8A │ Grade 7B │ Grade 8A │ Grade 9A │ Grade 7B │ Project  │
│ 9:45     │ AI Fund. │ Robotics │ AI Fund. │ IoT      │ Robotics │ Reviews  │
│          │ Lab 1    │ Lab 2    │ Lab 1    │ Lab 3    │ Lab 2    │          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 9:45-    │ Grade 6A │ Grade 8B │ Grade 7A │ Grade 8A │ Grade 6B │          │
│ 10:30    │ Basics   │ AI Fund. │ Robotics │ AI Fund. │ Basics   │          │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### 7.4 Projects (`OfficerProjects.tsx`)

**Purpose**: Create and manage innovation projects with student teams.

**Data Sources**:
```typescript
const { user } = useAuth();
const officerId = user.id;
const institutionId = user.institution_id;

// Projects mentored by this officer (institution-filtered)
getOfficerProjects(officerId, institutionId)

// Students for team selection (ONLY from assigned institution)
getStudentsByInstitution(institutionId)

// Events for project assignment
getAvailableEvents()
```

**Key Features**:
- Create new project with student team
- Team members selected ONLY from assigned institution
- Each team member has individual class/section
- Cross-class teams supported
- Assign officer as mentor
- Link projects to events
- Track project progress

**Project Creation Flow**:
```
1. Click "Create Project"
   ↓
2. Enter project details:
   - Title
   - Description
   - SDG Goals
   - Objectives
   ↓
3. Select team members (institution-filtered):
   - Search students from institution
   - Select team leader (student)
   - Add team members
   - Each has their own class/section
   ↓
4. Officer auto-assigned as mentor
   ↓
5. Save project
   ↓
6. Project visible in:
   - Officer's Projects page
   - Students' "My Projects" (team members only)
   - Management's Projects view (institution-filtered)
   - System Admin's Project Management (all)
```

**Team Member Selection UI**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Add Team Members                                                            │
│                                                                              │
│  Search: [🔍 Search students...]        Institution: Modern School           │
│                                                                              │
│  Selected Team:                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ 👑 Rahul Sharma (Leader) - Grade 8A - MSD-2024-0125  [×]            │    │
│  │ 👤 Priya Patel (Member) - Grade 8B - MSD-2024-0130   [×]            │    │
│  │ 👤 Amit Singh (Member) - Grade 7A - MSD-2024-0089    [×]            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Available Students (Modern School only):                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ☐ Sneha Kumar - Grade 9A - MSD-2024-0201                            │    │
│  │ ☐ Vikram Reddy - Grade 8A - MSD-2024-0128                           │    │
│  │ ☐ Ananya Gupta - Grade 7B - MSD-2024-0095                           │    │
│  │ ...                                                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 7.5 Lab Inventory (`LabInventory.tsx`)

**Purpose**: Manage lab equipment, create purchase requests, submit audit reports.

**Data Sources**:
```typescript
const { user } = useAuth();
const officerId = user.id;
const institutionId = user.institution_id;

// Inventory items for assigned institution
getInventoryByInstitution(institutionId)

// Purchase requests created by officer
getPurchaseRequestsByOfficer(officerId)

// Audit records
getAuditRecordsByInstitution(institutionId)
```

**Tabs**:
1. **Inventory**: Current stock, add/update items
2. **Purchase Requests**: Create requests, track status
3. **Audit Reports**: Submit periodic audits

**Purchase Request Workflow**:
```
1. Officer creates purchase request
   ↓
2. Request status: 'pending_admin_review'
   ↓
3. System Admin reviews:
   - Approves → status: 'admin_approved'
   - Rejects → status: 'admin_rejected'
   ↓
4. If approved, Institution Management reviews:
   - Approves → status: 'management_approved'
   - Rejects → status: 'management_rejected'
   ↓
5. If approved, Fulfillment begins
   - Status: 'processing' → 'fulfilled'
```

---

### 7.6 Assessments (`OfficerAssessments.tsx`)

**Purpose**: View assessments published to institution, see student attempts.

**Data Sources**:
```typescript
const { user } = useAuth();
const institutionId = user.institution_id;

// Assessments published to this institution
getAssessmentsByInstitution(institutionId)

// Assessment attempts by students of this institution
getAssessmentAttemptsByInstitution(institutionId)
```

**Key Features**:
- View assessments for institution (created by System Admin OR Officer)
- Create institution-specific assessments
- View student performance analytics
- See attempt results

**Assessment Filtering Logic**:
```typescript
// Officer sees assessments where:
// 1. Created by System Admin AND published to officer's institution
// 2. OR created by this officer for their institution

const getOfficerAssessments = (institutionId, officerId) => {
  return assessments.filter(assessment => {
    const publishedToInstitution = assessment.publishing.institution_ids
      .includes(institutionId);
    const createdByOfficer = assessment.created_by === officerId;
    
    return publishedToInstitution || createdByOfficer;
  });
};
```

---

### 7.7 Assignments (`OfficerAssignments.tsx`)

**Purpose**: Grade student assignment submissions.

**Data Sources**:
```typescript
const { user } = useAuth();
const institutionId = user.institution_id;

// Assignments published to this institution
getAssignmentsByInstitution(institutionId)

// Submissions from students of this institution
getSubmissionsByInstitution(institutionId)
```

**Tabs**:
1. **Pending Grading**: Submissions awaiting grading
2. **Graded**: Completed submissions with scores
3. **All Assignments**: Full list

**Grading Flow**:
```
1. Officer selects submission to grade
   ↓
2. Views submitted content (file/text/URL)
   ↓
3. Enters rubric scores for each criteria
   ↓
4. Provides feedback comments
   ↓
5. Submits grade
   ↓
6. Submission status → 'graded'
   ↓
7. Student sees grade in their Assignments page
```

---

### 7.8 Leave Management (`LeaveManagement.tsx`)

**Purpose**: Apply for leave, view leave balance, track application status.

**Data Sources**:
```typescript
const { user } = useAuth();
const officerId = user.id;

// Leave balance
getOfficerLeaveBalance(officerId, currentYear)

// Leave applications
getOfficerLeaveApplications(officerId)

// Other officers for substitute selection
getOfficersByInstitution(user.institution_id)
```

**Tabs**:
1. **Apply for Leave**: Submit new application
2. **My Applications**: Track status
3. **Leave Balance**: View remaining days

**Leave Application Flow (2-Stage Approval)**:
```
1. Officer fills leave application:
   - Leave type (casual/sick/earned)
   - Start date, end date
   - Reason
   - Substitute officer (for class coverage)
   ↓
2. Application submitted → status: 'pending'
   ↓
3. Manager reviews:
   - Approves → status: 'manager_approved'
   - Rejects → status: 'rejected'
   ↓
4. AGM reviews (if manager approved):
   - Approves → status: 'approved'
   - Rejects → status: 'rejected'
   ↓
5. If approved:
   - Leave balance auto-deducted
   - Timetable slots marked with substitute
   - Student timetable shows substitute teacher
```

---

### 7.9 Task (`OfficerTask.tsx`)

**Purpose**: Teaching tasks + assigned tasks from System Admin.

**Data Sources**:
```typescript
const { user } = useAuth();
const officerId = user.id;

// Teaching-related data
getOfficerTimetable(officerId)
getOfficerCourses(officerId)

// Assigned tasks from System Admin
getTasksByAssignee(officerId)
```

**Tabs**:
1. **Teaching**: Course assignments, class sessions
2. **Task Allotment**: Tasks assigned by System Admin

**Task Allotment Features**:
- View assigned tasks
- Update task status (pending → in_progress → completed)
- Submit for approval when complete
- Add comments/updates

---

### 7.10 Ask Metova (`OfficerAskMetova.tsx`)

**Purpose**: AI assistant for officer queries.

**Features**:
- Chat interface
- Context-aware responses about students, schedule, inventory
- New chat / clear history
- Conversation persistence

---

### 7.11 Settings (`OfficerSettings.tsx`)

**Purpose**: Account settings, password management.

**Tabs**:
1. **Account Security**
   - Change password
   - Password strength validation
   - Request password reset

2. **Profile**
   - View profile info (read-only)
   - Update avatar

---

## 8. GPS-Based Attendance & Payroll System

### 8.1 Check-In Flow with GPS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     GPS-BASED CHECK-IN WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

1. Officer clicks "Check In" button
   │
   ▼
2. Browser requests GPS permission (if not granted)
   │
   ▼
3. Geolocation API fetches current coordinates
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  navigator.geolocation.getCurrentPosition(                                   │
│    (position) => {                                                           │
│      const { latitude, longitude } = position.coords;                        │
│      // Proceed with check-in                                                │
│    },                                                                        │
│    (error) => {                                                              │
│      // Handle GPS failure - allow check-in but flag for review              │
│    },                                                                        │
│    { enableHighAccuracy: true, timeout: 10000 }                              │
│  );                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
   │
   ▼
4. POST /api/v1/officers/:id/attendance/check-in
   {
     latitude: 28.5678,
     longitude: 77.2100,
     timestamp: "2024-12-10T09:15:00Z"
   }
   │
   ▼
5. Backend validates location against institution GPS config:
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Institution GPS Config:                                                     │
│  {                                                                           │
│    institution_id: "inst-msd-001",                                           │
│    latitude: 28.5680,                                                        │
│    longitude: 77.2105,                                                       │
│    radius_meters: 200  // Acceptable radius                                  │
│  }                                                                           │
│                                                                              │
│  Validation:                                                                 │
│  distance = haversineDistance(                                               │
│    officer_coords,                                                           │
│    institution_coords                                                        │
│  );                                                                          │
│  validated = distance <= radius_meters;                                      │
└─────────────────────────────────────────────────────────────────────────────┘
   │
   ▼
6. Attendance record created:
   {
     officer_id: "off-msd-001",
     date: "2024-12-10",
     check_in_time: "09:15 AM",
     check_in_location: { latitude: 28.5678, longitude: 77.2100 },
     check_in_validated: true,  // or false if outside radius
     status: "present"
   }
   │
   ▼
7. Frontend shows validation status:
   - ✅ "Location verified" (green badge)
   - ⚠️ "Location unverified - needs review" (orange badge)
```

### 8.2 Check-Out Flow

```
1. Officer clicks "Check Out" button
   │
   ▼
2. GPS location captured automatically
   │
   ▼
3. POST /api/v1/officers/:id/attendance/check-out
   │
   ▼
4. Backend calculates hours worked:
   │
   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Calculation:                                                                │
│                                                                              │
│  check_in = "09:15 AM"                                                       │
│  check_out = "06:30 PM"                                                      │
│                                                                              │
│  total_hours = timeDiff(check_out, check_in) = 9.25 hours                    │
│  normal_hours = officer.normal_working_hours = 7 hours                       │
│  overtime_hours = max(0, total_hours - normal_hours) = 2.25 hours            │
│                                                                              │
│  Attendance record updated:                                                  │
│  {                                                                           │
│    check_out_time: "06:30 PM",                                               │
│    check_out_location: { ... },                                              │
│    check_out_validated: true,                                                │
│    total_hours: 9.25,                                                        │
│    overtime_hours: 2.25                                                      │
│  }                                                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Payroll Calculation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MONTHLY PAYROLL CALCULATION                           │
└─────────────────────────────────────────────────────────────────────────────┘

Officer Config:
├─ hourly_rate: ₹343.75
├─ overtime_rate_multiplier: 1.5
└─ normal_working_hours: 7 (per day)

Month Data (December 2024):
├─ Working days: 22
├─ Days present: 20
├─ Days leave: 2
├─ Total normal hours worked: 20 × 7 = 140 hours
├─ Total overtime hours: 15 hours (accumulated)

Calculation:
┌─────────────────────────────────────────────────────────────────────────────┐
│  Base Pay:                                                                   │
│  = normal_hours × hourly_rate                                                │
│  = 140 × ₹343.75                                                             │
│  = ₹48,125                                                                   │
│                                                                              │
│  Overtime Pay:                                                               │
│  = overtime_hours × hourly_rate × overtime_multiplier                        │
│  = 15 × ₹343.75 × 1.5                                                        │
│  = ₹7,734.38                                                                 │
│                                                                              │
│  Gross Pay:                                                                  │
│  = Base Pay + Overtime Pay                                                   │
│  = ₹48,125 + ₹7,734.38                                                       │
│  = ₹55,859.38                                                                │
│                                                                              │
│  Deductions (if any):                                                        │
│  - Absent days without leave: 0                                              │
│  - Late penalties: ₹0                                                        │
│                                                                              │
│  Net Pay:                                                                    │
│  = ₹55,859.38                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.4 Salary Tracker Component (Officer Dashboard)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 MY SALARY TRACKER - December 2024                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Estimated Earnings This Month:                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          ₹45,250.00                                 │    │
│  │                          (In Progress)                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Breakdown:                                                                  │
│  ├─ Base Earnings:      ₹38,500.00  (112 hours × ₹343.75)                   │
│  ├─ Overtime:           ₹6,750.00   (13 hours × ₹343.75 × 1.5)              │
│  └─ Deductions:         ₹0.00                                               │
│                                                                              │
│  Hours Progress:                                                             │
│  ████████████████░░░░ 112/154 hours (73%)                                   │
│                                                                              │
│  Working Days: 16/22 completed                                               │
│  Overtime Hours: 13 hours accumulated                                        │
│                                                                              │
│  [View Full Attendance History]                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Bidirectional Synchronization Flows

### 9.1 Project Sync (Officer ↔ Student ↔ Management ↔ Admin)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROJECT BIDIRECTIONAL FLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘

CREATION (Officer → All Dashboards):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Officer creates project in OfficerProjects.tsx
   │
   ▼
2. POST /api/v1/projects
   {
     title: "Smart Irrigation System",
     description: "...",
     sdg_goals: [6, 13],
     mentor_id: "off-msd-001",          // Officer auto-assigned
     institution_id: "inst-msd-001",     // From officer's assignment
     team_members: [
       { student_id: "MSD-2024-0125", role: "leader", class: "8A" },
       { student_id: "MSD-2024-0130", role: "member", class: "8B" }
     ]
   }
   │
   ▼
3. Project visible in:
   │
   ├─► Officer's Projects page (as mentor)
   │
   ├─► Students' "My Projects" (team members only)
   │     - Student MSD-2024-0125 sees project
   │     - Student MSD-2024-0130 sees project
   │     - Other students DON'T see project
   │
   ├─► Management's Projects view (inst-msd-001 only)
   │
   └─► System Admin's Project Management (all projects)

EVENT ASSIGNMENT (Officer → Student):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Officer assigns project to event
   │
   ▼
2. PUT /api/v1/projects/:id/assign-event
   { event_id: "event-1" }
   │
   ▼
3. Project updated:
   { assigned_events: ["event-1"] }
   │
   ▼
4. Students see event badge on project:
   "🏆 Participating in: National Science Fair"
```

### 9.2 Content Completion Sync (Officer → Students)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  CONTENT COMPLETION BIDIRECTIONAL FLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

OFFICER MARKS COMPLETION:
━━━━━━━━━━━━━━━━━━━━━━━━━

1. Officer conducts class session (Grade 8A)
   │
   ▼
2. Officer marks content "Complete" in Teaching page
   │
   ▼
3. POST /api/v1/content/:id/mark-complete-for-class
   {
     officer_id: "off-msd-001",
     class_id: "cls-msd-8a",
     session_date: "2024-12-10"
   }
   │
   ▼
4. Backend fetches present students (from today's attendance or class roster)
   │
   ▼
5. Creates ContentCompletion for each present student:
   [
     { content_id, student_id: "s1", completed_by: "officer", officer_name: "Mr. Atif" },
     { content_id, student_id: "s2", completed_by: "officer", officer_name: "Mr. Atif" },
     ...
   ]
   │
   ▼
6. Students see in Course Detail → Learning Log:
   "📚 Introduction to AI - Video
    Completed by Mr. Atif Ansari during class on Dec 10, 2024"


STUDENT SELF-STUDY COMPLETION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student views content independently
   │
   ▼
2. Student marks "Complete"
   │
   ▼
3. POST /api/v1/content/:id/mark-complete
   { student_id: "..." }
   │
   ▼
4. ContentCompletion created:
   { completed_by: "self" }
   │
   ▼
5. Learning Log shows:
   "📚 Introduction to AI - Video
    Self-completed on Dec 11, 2024"
```

### 9.3 Attendance Sync (Officer → System Admin Payroll)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ATTENDANCE → PAYROLL SYNC FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

1. Officer checks in/out daily with GPS
   │
   ▼
2. Attendance records accumulate in officer_attendance table
   │
   ▼
3. System Admin views "Officer Attendance" page:
   - Selects institution
   - Selects officer
   - Selects month
   │
   ▼
4. System fetches:
   - All attendance records for officer/month
   - Officer's salary config
   │
   ▼
5. System calculates in real-time:
   - Total working hours
   - Total overtime hours
   - Base pay
   - Overtime pay
   - Net pay
   │
   ▼
6. System Admin can:
   - View detailed daily breakdown
   - Export attendance data
   - Process payroll (approve/release)
   │
   ▼
7. Officer sees "My Salary Tracker" on their dashboard (real-time)
```

### 9.4 Leave Approval Sync (Officer → Manager → AGM)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LEAVE APPROVAL BIDIRECTIONAL FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

1. Officer submits leave application
   │
   ▼
2. Status: 'pending'
   │
   ▼
3. Manager sees in "Manager Approvals" sidebar
   │
   ▼
4. Manager approves → Status: 'manager_approved'
   │
   ▼
5. AGM sees in "AGM Approvals" sidebar
   │
   ▼
6. AGM approves → Status: 'approved'
   │
   ▼
7. Automatic updates:
   ├─ Officer's leave_balance reduced
   ├─ Officer's timetable slots marked with substitute
   └─ Student timetables show substitute teacher name
   │
   ▼
8. Officer sees application status update
```

### 9.5 Inventory Sync (Officer → Admin → Management)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  INVENTORY BIDIRECTIONAL SYNC FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

PURCHASE REQUEST FLOW:
━━━━━━━━━━━━━━━━━━━━━━

1. Officer creates purchase request in Lab Inventory
   │
   ▼
2. Request visible in:
   ├─ Officer's "My Requests" tab
   └─ System Admin's "Purchase Requests" (all institutions)
   │
   ▼
3. System Admin approves → Status: 'admin_approved'
   │
   ▼
4. Request visible in Institution Management dashboard
   │
   ▼
5. Management approves → Status: 'management_approved'
   │
   ▼
6. Request proceeds to fulfillment
   │
   ▼
7. Once fulfilled → Inventory updated for institution

AUDIT REPORT FLOW:
━━━━━━━━━━━━━━━━━━

1. Officer submits audit report with inventory count
   │
   ▼
2. Report visible in:
   ├─ Officer's "Audit Reports" tab
   ├─ System Admin's Inventory Management
   └─ Institution Management's Inventory view
```

### 9.6 Assessment Sync (Admin → Officer → Student)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   ASSESSMENT BIDIRECTIONAL SYNC FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

SYSTEM ADMIN CREATES:
━━━━━━━━━━━━━━━━━━━━━

1. System Admin creates assessment
   │
   ▼
2. Publishes to institutions: [inst-msd-001, inst-kga-001]
   │
   ▼
3. Assessment visible in:
   ├─ Officer's Assessments page (institution-filtered)
   └─ Students' Assessments page (institution + class filtered)


OFFICER CREATES (Institution-Specific):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Officer creates assessment for their institution
   │
   ▼
2. Assessment auto-scoped to officer's institution
   │
   ▼
3. Assessment visible in:
   ├─ Officer's Assessments page
   └─ Students of that institution


STUDENT ATTEMPTS → OFFICER VIEWS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student completes assessment
   │
   ▼
2. Officer sees results in Assessment Analytics
   │
   ▼
3. System Admin sees aggregate analytics
```

---

## 10. API Endpoints Specification

### 10.1 Authentication APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────────────────┘

POST /api/v1/auth/login
━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "email": "atif.ansari@metainnova.com",
  "password": "securePassword123!"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "id": "off-msd-001",
      "email": "atif.ansari@metainnova.com",
      "name": "Mr. Atif Ansari",
      "role": "officer",
      "employee_id": "EMP-IOF-001",
      "institution_id": "inst-msd-001",
      "institution_name": "Modern School Vasant Vihar",
      "tenant_id": "modern-school-vasant-vihar",
      "avatar": "https://..."
    },
    "token": "jwt-token-with-institution-claim",
    "must_change_password": false
  }
}

Response (401 - No Institution Assigned):
{
  "success": false,
  "error": {
    "code": "NO_INSTITUTION_ASSIGNED",
    "message": "Officer has no institution assigned. Contact System Admin."
  }
}
```

### 10.2 Officer Profile APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         OFFICER PROFILE ENDPOINTS                            │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/officers/:officerId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "id": "off-msd-001",
    "employee_id": "EMP-IOF-001",
    "name": "Mr. Atif Ansari",
    "email": "atif.ansari@metainnova.com",
    "phone": "+91-9876543210",
    "date_of_birth": "1990-05-15",
    "address": "South Extension, New Delhi",
    "employment_type": "full_time",
    "department": "Innovation & STEM Education",
    "join_date": "2025-04-01",
    "status": "active",
    "salary": 55000,
    "hourly_rate": 343.75,
    "overtime_rate_multiplier": 1.5,
    "normal_working_hours": 7,
    "qualifications": [...],
    "certifications": [...],
    "skills": [...],
    "profile_photo_url": "https://...",
    "institution_assignment": {
      "institution_id": "inst-msd-001",
      "institution_name": "Modern School Vasant Vihar",
      "assigned_at": "2025-04-01T10:00:00Z"
    }
  }
}


GET /api/v1/officers/:officerId/dashboard-stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "total_students": 350,
    "total_projects": 12,
    "total_classes": 14,
    "weekly_sessions": 28,
    "pending_tasks": 3,
    "today_sessions": 4
  }
}
```

### 10.3 Attendance APIs (GPS-Based)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ATTENDANCE ENDPOINTS (GPS)                             │
└─────────────────────────────────────────────────────────────────────────────┘

POST /api/v1/officers/:officerId/attendance/check-in
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "latitude": 28.5678,
  "longitude": 77.2100,
  "timestamp": "2024-12-10T09:15:00Z"
}

Response:
{
  "success": true,
  "data": {
    "attendance_id": "att-uuid",
    "check_in_time": "09:15 AM",
    "check_in_location": {
      "latitude": 28.5678,
      "longitude": 77.2100
    },
    "check_in_validated": true,
    "validation_message": "Location verified - within institution radius",
    "institution_distance_meters": 45
  }
}


POST /api/v1/officers/:officerId/attendance/check-out
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "latitude": 28.5680,
  "longitude": 77.2102,
  "timestamp": "2024-12-10T18:30:00Z"
}

Response:
{
  "success": true,
  "data": {
    "attendance_id": "att-uuid",
    "check_out_time": "06:30 PM",
    "check_out_validated": true,
    "total_hours": 9.25,
    "overtime_hours": 2.25,
    "status": "present"
  }
}


GET /api/v1/officers/:officerId/attendance?month=2024-12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "month": "2024-12",
    "summary": {
      "present_days": 16,
      "absent_days": 0,
      "leave_days": 2,
      "total_working_hours": 140,
      "total_overtime_hours": 15
    },
    "daily_records": [
      {
        "date": "2024-12-10",
        "status": "present",
        "check_in_time": "09:15 AM",
        "check_out_time": "06:30 PM",
        "check_in_location": { "latitude": 28.5678, "longitude": 77.2100 },
        "check_out_location": { "latitude": 28.5680, "longitude": 77.2102 },
        "check_in_validated": true,
        "check_out_validated": true,
        "total_hours": 9.25,
        "overtime_hours": 2.25
      }
    ]
  }
}


GET /api/v1/officers/:officerId/salary-tracker?month=2024-12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "month": "2024-12",
    "salary_config": {
      "hourly_rate": 343.75,
      "overtime_rate_multiplier": 1.5,
      "normal_working_hours": 7
    },
    "attendance_summary": {
      "working_days": 22,
      "days_present": 16,
      "days_remaining": 6,
      "total_normal_hours": 112,
      "total_overtime_hours": 13
    },
    "earnings": {
      "base_pay": 38500.00,
      "overtime_pay": 6703.13,
      "gross_pay": 45203.13,
      "deductions": 0,
      "net_pay": 45203.13
    },
    "progress_percentage": 73
  }
}
```

### 10.4 Teaching APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TEACHING ENDPOINTS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/officers/:officerId/timetable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "officer_id": "off-msd-001",
    "officer_name": "Mr. Atif Ansari",
    "total_hours": 28,
    "slots": [
      {
        "id": "slot-1",
        "day": "Monday",
        "start_time": "09:00",
        "end_time": "09:45",
        "class": "Grade 8A",
        "class_id": "cls-msd-8a",
        "subject": "AI Fundamentals",
        "room": "Innovation Lab 1",
        "type": "workshop",
        "course_id": "course-ai-101",
        "status": "active"
      }
    ]
  }
}


GET /api/v1/officers/:officerId/classes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "classes": [
      {
        "class_id": "cls-msd-8a",
        "class_name": "Grade 8A",
        "student_count": 25,
        "courses_assigned": ["course-ai-101", "course-robotics-201"]
      }
    ]
  }
}


POST /api/v1/content/:contentId/mark-complete-for-class
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "officer_id": "off-msd-001",
  "class_id": "cls-msd-8a",
  "session_date": "2024-12-10",
  "present_student_ids": ["s1", "s2", "s3"]  // Optional, defaults to all enrolled
}

Response:
{
  "success": true,
  "data": {
    "content_id": "content-1",
    "completions_created": 23,
    "students_marked": [
      { "student_id": "s1", "student_name": "Rahul Sharma" },
      { "student_id": "s2", "student_name": "Priya Patel" }
    ]
  }
}
```

### 10.5 Project APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT ENDPOINTS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/officers/:officerId/projects
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project-1",
        "title": "Smart Irrigation System",
        "description": "...",
        "status": "ongoing",
        "progress_percentage": 65,
        "sdg_goals": [6, 13],
        "mentor_id": "off-msd-001",
        "institution_id": "inst-msd-001",
        "team_members": [
          {
            "student_id": "MSD-2024-0125",
            "name": "Rahul Sharma",
            "class": "Grade 8",
            "section": "A",
            "role": "leader"
          }
        ],
        "assigned_events": ["event-1"],
        "created_at": "2024-09-15T10:00:00Z"
      }
    ]
  }
}


POST /api/v1/projects
━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "title": "Smart Irrigation System",
  "description": "An IoT-based irrigation system...",
  "objectives": [...],
  "sdg_goals": [6, 13],
  "mentor_id": "off-msd-001",
  "institution_id": "inst-msd-001",  // From JWT
  "team_members": [
    {
      "student_id": "MSD-2024-0125",
      "role": "leader"
    },
    {
      "student_id": "MSD-2024-0130",
      "role": "member"
    }
  ]
}

Response:
{
  "success": true,
  "data": {
    "id": "project-uuid",
    "title": "Smart Irrigation System",
    "created_at": "2024-12-10T10:00:00Z"
  }
}


PUT /api/v1/projects/:projectId/assign-event
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "event_id": "event-1"
}

Response:
{
  "success": true,
  "data": {
    "project_id": "project-1",
    "assigned_events": ["event-1"]
  }
}


GET /api/v1/institutions/:institutionId/students
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Used for team member selection - ONLY returns students from this institution
Response:
{
  "success": true,
  "data": {
    "students": [
      {
        "id": "uuid",
        "student_id": "MSD-2024-0125",
        "name": "Rahul Sharma",
        "class": "Grade 8",
        "section": "A"
      }
    ]
  }
}
```

### 10.6 Assessment APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ASSESSMENT ENDPOINTS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/officers/:officerId/assessments
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: Uses JWT institution_id automatically

Response:
{
  "success": true,
  "data": {
    "assessments": [
      {
        "id": "assessment-1",
        "title": "Physics Mid-Term",
        "subject": "Physics",
        "total_questions": 30,
        "total_marks": 100,
        "duration_minutes": 60,
        "status": "published",
        "created_by": "system_admin",
        "attempts_count": 45,
        "average_score": 72.5
      }
    ]
  }
}


POST /api/v1/assessments (Officer creates)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Institution-specific assessment
Request:
{
  "title": "Robotics Quiz",
  "subject": "Robotics",
  "institution_id": "inst-msd-001",  // Auto from JWT
  "class_ids": ["cls-msd-8a", "cls-msd-8b"],
  "questions": [...],
  ...
}


GET /api/v1/assessments/:assessmentId/analytics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "total_attempts": 45,
    "completed_attempts": 42,
    "average_score": 72.5,
    "highest_score": 98,
    "lowest_score": 35,
    "pass_rate": 85.7,
    "score_distribution": {
      "90-100": 5,
      "80-89": 12,
      "70-79": 15,
      "60-69": 8,
      "below_60": 2
    },
    "per_question_analysis": [...]
  }
}
```

### 10.7 Assignment APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ASSIGNMENT ENDPOINTS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/officers/:officerId/assignments/submissions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?status=pending_grading

Response:
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "submission-1",
        "assignment_id": "assignment-1",
        "assignment_title": "Climate Change Research",
        "student": {
          "id": "uuid",
          "student_id": "MSD-2024-0125",
          "name": "Rahul Sharma",
          "class": "Grade 8A"
        },
        "submitted_at": "2024-12-14T22:30:00Z",
        "is_late": false,
        "status": "submitted"
      }
    ]
  }
}


PUT /api/v1/assignments/:assignmentId/submissions/:submissionId/grade
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "score": 85,
  "grade": "A",
  "feedback": "Excellent research and analysis...",
  "rubric_scores": [
    { "criteria": "Research Quality", "score": 25, "max_score": 30 },
    { "criteria": "Structure", "score": 28, "max_score": 30 },
    { "criteria": "Writing", "score": 18, "max_score": 20 },
    { "criteria": "Citations", "score": 14, "max_score": 20 }
  ],
  "graded_by": "off-msd-001"
}

Response:
{
  "success": true,
  "data": {
    "submission_id": "submission-1",
    "status": "graded",
    "score": 85,
    "graded_at": "2024-12-16T10:00:00Z"
  }
}
```

### 10.8 Inventory APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INVENTORY ENDPOINTS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/institutions/:institutionId/inventory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "inv-1",
        "name": "Arduino Uno R3",
        "category": "Electronics",
        "quantity": 25,
        "unit": "pieces",
        "location": "Lab Storage A",
        "status": "in_stock",
        "last_updated": "2024-12-01T10:00:00Z"
      }
    ]
  }
}


POST /api/v1/institutions/:institutionId/inventory
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "name": "Raspberry Pi 4",
  "category": "Electronics",
  "quantity": 10,
  "unit": "pieces",
  "location": "Lab Storage B"
}


POST /api/v1/purchase-requests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "institution_id": "inst-msd-001",
  "officer_id": "off-msd-001",
  "items": [
    {
      "name": "3D Printer Filament",
      "quantity": 10,
      "estimated_cost": 5000
    }
  ],
  "reason": "Running low on printing supplies",
  "priority": "medium"
}

Response:
{
  "success": true,
  "data": {
    "request_id": "pr-uuid",
    "status": "pending_admin_review",
    "created_at": "2024-12-10T10:00:00Z"
  }
}


POST /api/v1/audit-reports
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request: multipart/form-data
- institution_id: string
- officer_id: string
- audit_date: string
- items: JSON (inventory count)
- notes: string
- attachments: File[]

Response:
{
  "success": true,
  "data": {
    "audit_id": "audit-uuid",
    "submitted_at": "2024-12-10T10:00:00Z"
  }
}
```

### 10.9 Leave Management APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LEAVE MANAGEMENT ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/officers/:officerId/leave-balance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "year": 2024,
    "casual": { "allowed": 12, "used": 3, "remaining": 9 },
    "sick": { "allowed": 10, "used": 2, "remaining": 8 },
    "earned": { "allowed": 15, "used": 5, "remaining": 10 }
  }
}


POST /api/v1/leave-applications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "officer_id": "off-msd-001",
  "leave_type": "casual",
  "start_date": "2024-12-15",
  "end_date": "2024-12-17",
  "reason": "Personal work",
  "substitute_officer_id": "off-msd-002"
}

Response:
{
  "success": true,
  "data": {
    "application_id": "leave-uuid",
    "status": "pending",
    "applied_at": "2024-12-10T10:00:00Z"
  }
}


GET /api/v1/officers/:officerId/leave-applications
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": "leave-uuid",
        "leave_type": "casual",
        "start_date": "2024-12-15",
        "end_date": "2024-12-17",
        "total_days": 3,
        "status": "manager_approved",
        "applied_at": "2024-12-10T10:00:00Z",
        "manager_approved_at": "2024-12-11T09:00:00Z"
      }
    ]
  }
}
```

### 10.10 Task APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            TASK ENDPOINTS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/officers/:officerId/tasks
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task-1",
        "title": "Prepare curriculum for next quarter",
        "description": "...",
        "priority": "high",
        "status": "in_progress",
        "due_date": "2024-12-20",
        "assigned_by": "CEO",
        "assigned_at": "2024-12-01T10:00:00Z"
      }
    ]
  }
}


PUT /api/v1/tasks/:taskId/status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "status": "submitted_for_approval",
  "comment": "Task completed, ready for review"
}

Response:
{
  "success": true,
  "data": {
    "task_id": "task-1",
    "status": "submitted_for_approval",
    "updated_at": "2024-12-15T10:00:00Z"
  }
}
```

---

## 11. Database Schema

### 11.1 Officers Table

```sql
CREATE TABLE officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,  -- "EMP-IOF-001"
  
  -- Personal Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  profile_photo_url TEXT,
  
  -- Employment Details
  employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract')),
  department VARCHAR(100) DEFAULT 'Innovation & STEM Education',
  join_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  
  -- Salary Configuration
  salary DECIMAL(12, 2),                    -- Monthly salary
  hourly_rate DECIMAL(10, 2),               -- ₹ per hour
  overtime_rate_multiplier DECIMAL(4, 2) DEFAULT 1.5,
  normal_working_hours INTEGER DEFAULT 7,   -- Per day
  
  -- Professional Details
  qualifications TEXT[],
  certifications TEXT[],
  skills TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_officers_email ON officers(email);
CREATE INDEX idx_officers_employee_id ON officers(employee_id);
CREATE INDEX idx_officers_status ON officers(status);
```

### 11.2 Officer Assignments Table (1:1 with Institution)

```sql
CREATE TABLE officer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  
  -- CRITICAL: UNIQUE constraint ensures 1:1 relationship
  -- Each officer can only be assigned to ONE institution
  UNIQUE(officer_id)
);

CREATE INDEX idx_officer_assignments_institution ON officer_assignments(institution_id);
```

### 11.3 Officer Credentials Table

```sql
CREATE TABLE officer_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID UNIQUE NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  must_change_password BOOLEAN DEFAULT TRUE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  credential_status VARCHAR(20) DEFAULT 'pending' CHECK (credential_status IN ('pending', 'configured')),
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 11.4 Officer Attendance Table (GPS-Based)

```sql
CREATE TABLE officer_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  date DATE NOT NULL,
  
  -- Check-in
  check_in_time TIME,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(11, 8),
  check_in_validated BOOLEAN DEFAULT FALSE,
  check_in_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Check-out
  check_out_time TIME,
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(11, 8),
  check_out_validated BOOLEAN DEFAULT FALSE,
  check_out_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Calculated
  total_hours DECIMAL(5, 2),
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'not_marked' CHECK (status IN ('present', 'absent', 'leave', 'half_day', 'not_marked')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(officer_id, date)
);

CREATE INDEX idx_officer_attendance_date ON officer_attendance(date);
CREATE INDEX idx_officer_attendance_officer ON officer_attendance(officer_id);
CREATE INDEX idx_officer_attendance_institution ON officer_attendance(institution_id);
```

### 11.5 Officer Timetable Table

```sql
CREATE TABLE officer_timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  
  -- Schedule
  day VARCHAR(20) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Class Details
  class_id UUID NOT NULL REFERENCES institution_classes(id),
  class_name VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  room VARCHAR(100),
  
  -- Session Details
  type VARCHAR(20) NOT NULL CHECK (type IN ('workshop', 'lab', 'mentoring', 'project_review')),
  batch VARCHAR(50),
  
  -- Course Link
  course_id UUID REFERENCES courses(id),
  current_module_id UUID,
  
  -- Substitute Info
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'substitute')),
  original_officer_id UUID REFERENCES officers(id),
  original_officer_name VARCHAR(255),
  leave_application_id UUID REFERENCES leave_applications(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_officer_timetables_officer ON officer_timetables(officer_id);
CREATE INDEX idx_officer_timetables_class ON officer_timetables(class_id);
CREATE INDEX idx_officer_timetables_day ON officer_timetables(day);
```

### 11.6 Officer Leave Balance Table

```sql
CREATE TABLE officer_leave_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id UUID NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  
  -- Allowances
  casual_allowed INTEGER DEFAULT 12,
  sick_allowed INTEGER DEFAULT 10,
  earned_allowed INTEGER DEFAULT 15,
  
  -- Used
  casual_used INTEGER DEFAULT 0,
  sick_used INTEGER DEFAULT 0,
  earned_used INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(officer_id, year)
);

CREATE INDEX idx_leave_balances_officer ON officer_leave_balances(officer_id);
```

### 11.7 Leave Applications Table

```sql
CREATE TABLE leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Applicant (can be officer or meta staff)
  applicant_id UUID NOT NULL,
  applicant_type VARCHAR(20) NOT NULL CHECK (applicant_type IN ('officer', 'meta_staff')),
  applicant_name VARCHAR(255) NOT NULL,
  institution_id UUID REFERENCES institutions(id),  -- NULL for meta staff
  
  -- Leave Details
  leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('casual', 'sick', 'earned')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  reason TEXT NOT NULL,
  
  -- Substitute (for officers)
  substitute_officer_id UUID REFERENCES officers(id),
  substitute_officer_name VARCHAR(255),
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'manager_approved', 'approved', 'rejected')),
  
  -- Manager Approval (Stage 1 for officers)
  manager_approved_by UUID,
  manager_approved_at TIMESTAMP WITH TIME ZONE,
  manager_comments TEXT,
  
  -- AGM Approval (Stage 2 for officers) / CEO Approval (for meta staff)
  final_approved_by UUID,
  final_approved_at TIMESTAMP WITH TIME ZONE,
  final_comments TEXT,
  
  -- Rejection
  rejected_by UUID,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_leave_applications_applicant ON leave_applications(applicant_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_leave_applications_dates ON leave_applications(start_date, end_date);
```

### 11.8 Projects Table (Officer as Mentor)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  objectives TEXT[],
  
  -- Status
  status VARCHAR(20) DEFAULT 'proposed' CHECK (status IN ('proposed', 'ongoing', 'completed', 'on_hold', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  
  -- SDG Goals
  sdg_goals INTEGER[],  -- Array of SDG numbers [6, 13]
  
  -- Mentor (Innovation Officer)
  mentor_id UUID REFERENCES officers(id),
  
  -- Institution
  institution_id UUID NOT NULL REFERENCES institutions(id),
  
  -- Events
  assigned_events UUID[],  -- Array of event IDs
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_projects_mentor ON projects(mentor_id);
CREATE INDEX idx_projects_institution ON projects(institution_id);
CREATE INDEX idx_projects_status ON projects(status);
```

### 11.9 Project Members Table

```sql
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('leader', 'member')),
  class_name VARCHAR(50),
  section VARCHAR(10),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, student_id)
);

CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_student ON project_members(student_id);
```

### 11.10 Content Completions Table (Officer-Initiated)

```sql
CREATE TABLE content_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Who marked completion
  completed_by VARCHAR(20) NOT NULL CHECK (completed_by IN ('self', 'officer')),
  officer_id UUID REFERENCES officers(id),
  officer_name VARCHAR(255),
  session_date DATE,
  class_id UUID REFERENCES institution_classes(id),
  
  UNIQUE(student_id, content_id)
);

CREATE INDEX idx_content_completions_student ON content_completions(student_id);
CREATE INDEX idx_content_completions_course ON content_completions(course_id);
CREATE INDEX idx_content_completions_officer ON content_completions(officer_id);
```

### 11.11 Institution GPS Config Table

```sql
CREATE TABLE institution_gps_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID UNIQUE NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER DEFAULT 200,  -- Acceptable radius for validation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 12. Key Frontend Files Reference

| File Path                             | Purpose                                  |
|-------------------------------------|------------------------------------------|
| `src/pages/officer/Dashboard.tsx`   | Main dashboard with check-in, salary tracker |
| `src/pages/officer/Teaching.tsx`    | Course content management, mark completion |
| `src/pages/officer/Sessions.tsx`    | Personal timetable view                   |
| `src/pages/officer/Projects.tsx`    | Create/manage student projects            |
| `src/pages/officer/LabInventory.tsx`| Inventory, purchase requests, audits     |
| `src/pages/officer/Assessments.tsx` | View/create assessments                    |
| `src/pages/officer/Assignments.tsx` | Grade student submissions                  |
| `src/pages/officer/LeaveManagement.tsx` | Apply for leave, view balance          |
| `src/pages/officer/Task.tsx`        | Teaching + Task Allotment tabs             |
| `src/pages/officer/AskMetova.tsx`   | AI assistant                              |
| `src/pages/officer/Settings.tsx`    | Account settings, password                 |
| `src/components/officer/AttendanceCheckInOut.tsx` | GPS check-in/out component      |
| `src/components/officer/SalaryTrackerCard.tsx` | Real-time earnings display          |
| `src/components/officer/CreateProjectDialog.tsx` | Project creation form             |
| `src/components/officer/TeamMemberSelector.tsx` | Student selection (institution-filtered) |
| `src/components/layout/OfficerSidebarProfile.tsx` | Officer profile in sidebar        |
| `src/contexts/AuthContext.tsx`      | Authentication with institution context   |
| `src/services/officer.service.ts`   | Officer API service layer                  |
| `src/types/officer.ts`              | Officer type definitions                    |
| `src/utils/attendanceHelpers.ts`   | Payroll calculation utilities              |
| `src/utils/gpsHelpers.ts`           | GPS validation utilities                    |
| `src/data/mockOfficerData.ts`       | Mock data (dev only)                        |

---

## 13. Security Considerations

### 13.1 Institution Isolation (CRITICAL)

```typescript
// EVERY officer API endpoint MUST filter by institution_id from JWT

const officerAuthMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  
  // Verify officer exists and is active
  const officer = await db.officers.findUnique({ where: { id: decoded.sub } });
  if (!officer || officer.status !== 'active') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get officer's institution assignment
  const assignment = await db.officer_assignments.findUnique({
    where: { officer_id: officer.id }
  });
  
  if (!assignment) {
    return res.status(403).json({ error: 'No institution assigned' });
  }
  
  // Attach institution_id to request for all subsequent queries
  req.officer = officer;
  req.institution_id = assignment.institution_id;
  
  next();
};

// Usage in routes
app.get('/api/v1/officers/:id/students', officerAuthMiddleware, async (req, res) => {
  // ALWAYS filter by req.institution_id
  const students = await db.students.findMany({
    where: { institution_id: req.institution_id }
  });
  res.json({ success: true, data: { students } });
});
```

### 13.2 GPS Validation Logic

```typescript
// Haversine formula for distance calculation
const haversineDistance = (
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = coords1.latitude * Math.PI / 180;
  const φ2 = coords2.latitude * Math.PI / 180;
  const Δφ = (coords2.latitude - coords1.latitude) * Math.PI / 180;
  const Δλ = (coords2.longitude - coords1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Validate officer location against institution
const validateLocation = async (
  officerCoords: { latitude: number; longitude: number },
  institutionId: string
): Promise<{ validated: boolean; distance: number }> => {
  const gpsConfig = await db.institution_gps_config.findUnique({
    where: { institution_id: institutionId }
  });
  
  if (!gpsConfig) {
    return { validated: false, distance: -1 };
  }
  
  const distance = haversineDistance(officerCoords, {
    latitude: gpsConfig.latitude,
    longitude: gpsConfig.longitude
  });
  
  return {
    validated: distance <= gpsConfig.radius_meters,
    distance: Math.round(distance)
  };
};
```

### 13.3 Password Security

```typescript
// Password requirements for officers
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
};

// Forced password change enforcement
if (officer.must_change_password) {
  // Show ForcePasswordChangeDialog - non-dismissible
  // Cannot access any route until password changed
}
```

### 13.4 Leave Approval Chain

```typescript
// Officer leave requires 2-stage approval
// Stage 1: Manager
// Stage 2: AGM

const processLeaveApproval = async (applicationId, approverId, stage) => {
  const application = await db.leave_applications.findUnique({
    where: { id: applicationId }
  });
  
  if (application.applicant_type === 'officer') {
    if (stage === 'manager') {
      // Manager can only approve pending applications
      if (application.status !== 'pending') {
        throw new Error('Invalid status for manager approval');
      }
      await db.leave_applications.update({
        where: { id: applicationId },
        data: {
          status: 'manager_approved',
          manager_approved_by: approverId,
          manager_approved_at: new Date()
        }
      });
    } else if (stage === 'agm') {
      // AGM can only approve manager_approved applications
      if (application.status !== 'manager_approved') {
        throw new Error('Manager approval required first');
      }
      await db.leave_applications.update({
        where: { id: applicationId },
        data: {
          status: 'approved',
          final_approved_by: approverId,
          final_approved_at: new Date()
        }
      });
      
      // Deduct from leave balance
      await deductLeaveBalance(application);
      
      // Update timetable with substitute
      await updateTimetableWithSubstitute(application);
    }
  }
};
```

---

## Summary

This documentation provides a complete reference for backend developers to understand the Innovation Officer Dashboard system in the Meta-Innova platform. Key points:

1. **1:1 Officer-Institution Assignment**: Each officer is assigned to exactly ONE institution with UNIQUE constraint enforcement  
2. **Institutional Isolation**: All officer queries are filtered by their assigned institution_id from JWT  
3. **GPS-Based Attendance**: Check-in/out with automatic GPS capture and validation against institution coordinates  
4. **Real-Time Payroll**: Automatic calculation of hours worked, overtime, and earnings  
5. **2-Stage Leave Approval**: Manager → AGM approval chain for officer leave applications  
6. **Bidirectional Sync**: Data flows between Officer, Students, Management, and System Admin dashboards  
7. **Comprehensive APIs**: 40+ endpoints covering all officer functionality  
8. **Robust Database Schema**: 11 tables with proper indexing and constraints  

The frontend is built with React + TypeScript + Tailwind CSS, using localStorage for development and ready for API integration.
