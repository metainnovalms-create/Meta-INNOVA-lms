# Student Dashboard System - Complete Documentation

> **Purpose**: Comprehensive documentation for backend developers to understand the Student Dashboard frontend architecture, data flows, API requirements, and database schema for the Meta-Innova platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Student Onboarding Workflow](#2-student-onboarding-workflow)
3. [Student Data Models](#3-student-data-models)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Routing Configuration](#5-routing-configuration)
6. [Sidebar Menu Configuration](#6-sidebar-menu-configuration)
7. [Complete Page Breakdown](#7-complete-page-breakdown)
8. [Data Linkage Architecture](#8-data-linkage-architecture)
9. [Bidirectional Synchronization Flows](#9-bidirectional-synchronization-flows)
10. [API Endpoints Specification](#10-api-endpoints-specification)
11. [Database Schema](#11-database-schema)
12. [Key Frontend Files Reference](#12-key-frontend-files-reference)
13. [Security Considerations](#13-security-considerations)

---

## 1. Architecture Overview

### 1.1 Multi-Tenant Hierarchical Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    META-INNOVA PLATFORM                          │
│                    (System Admin Level)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │  Institution A       │    │  Institution B       │           │
│  │  (Modern School)     │    │  (Kikani Global)     │           │
│  │  inst-msd-001        │    │  inst-kga-001        │           │
│  ├──────────────────────┤    ├──────────────────────┤           │
│  │  Management Admin    │    │  Management Admin    │           │
│  │  Innovation Officer  │    │  Innovation Officers │           │
│  │  (Atif Ansari)       │    │  (Saran T, Sreeram R)│           │
│  ├──────────────────────┤    ├──────────────────────┤           │
│  │  Classes:            │    │  Classes:            │           │
│  │  Grade 6A, 6B        │    │  Grade 6A, 6B, 6C    │           │
│  │  Grade 7A, 7B        │    │  Grade 7A, 7B, 7C    │           │
│  │  ... to Grade 12     │    │  ... to Grade 12     │           │
│  ├──────────────────────┤    ├──────────────────────┤           │
│  │  Students:           │    │  Students:           │           │
│  │  350 total           │    │  520 total           │           │
│  │  MSD-2024-XXXX IDs   │    │  KGA-2024-XXXX IDs   │           │
│  └──────────────────────┘    └──────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Student Data Isolation Principles

1. **Institution Isolation**: Students can ONLY access data from their own institution
2. **Class-Based Filtering**: Assessments/Assignments filtered by student's class_id
3. **Level-Based Course Access**: Course content filtered by class-to-level mappings
4. **Project Membership**: Students see only projects where they are team members

### 1.3 Data Flow Direction

```
┌─────────────────┐     Creates/Publishes      ┌─────────────────┐
│  System Admin   │ ─────────────────────────► │   Assessments   │
│                 │                            │   Assignments   │
│                 │                            │   Events        │
│                 │                            │   Surveys       │
│                 │                            │   Courses       │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                               Filters by institution_id
                                               and class_id
                                                        │
                                                        ▼
┌─────────────────┐     Creates/Assigns        ┌─────────────────┐
│ Innovation      │ ─────────────────────────► │   Projects      │
│ Officer         │                            │   Timetable     │
│                 │                            │   Content       │
│ (Institutional  │                            │   Completion    │
│  Isolation)     │                            │                 │
└─────────────────┘                            └────────┬────────┘
                                                        │
                                               Filters by officer's
                                               institution + class
                                                        │
                                                        ▼
┌─────────────────┐     Views/Submits          ┌─────────────────┐
│    STUDENT      │ ◄────────────────────────► │   Dashboard     │
│                 │                            │   My Courses    │
│ institution_id  │     Responses sync back    │   Assessments   │
│ class_id        │     to Admin dashboards    │   Assignments   │
│ section         │                            │   Projects      │
└─────────────────┘                            └─────────────────┘
```

---

## 2. Student Onboarding Workflow

### 2.1 Complete Onboarding Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     STUDENT ONBOARDING WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

Step 1: Institution Management adds student
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Institution Management Dashboard → Students → Add Student               │
│                                                                          │
│  Form Fields:                                                            │
│  ├─ student_name (required)                                              │
│  ├─ email (required, unique)                                             │
│  ├─ date_of_birth (required)                                             │
│  ├─ gender (required: male/female/other)                                 │
│  ├─ class_id (required, dropdown from institution classes)               │
│  ├─ section (required: A/B/C)                                            │
│  ├─ roll_number (required, unique within class)                          │
│  ├─ admission_number (required, unique within institution)               │
│  ├─ admission_date (required)                                            │
│  ├─ parent_name (required)                                               │
│  ├─ parent_phone (required)                                              │
│  ├─ parent_email (optional)                                              │
│  ├─ address (required)                                                   │
│  ├─ blood_group (optional)                                               │
│  └─ previous_school (optional)                                           │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 2: System generates lifelong Student ID
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Student ID Generation Pattern:                                          │
│                                                                          │
│  Format: {INSTITUTION_CODE}-{YEAR}-{COUNTER}                             │
│                                                                          │
│  Examples:                                                               │
│  ├─ MSD-2024-0001 (Modern School, first student of 2024)                 │
│  ├─ MSD-2024-0350 (Modern School, 350th student)                         │
│  ├─ KGA-2024-0001 (Kikani Global, first student of 2024)                 │
│  └─ KGA-2024-0520 (Kikani Global, 520th student)                         │
│                                                                          │
│  Properties:                                                             │
│  ├─ Lifelong: Never changes, even if student transfers                   │
│  ├─ Unique: Globally unique across all institutions                      │
│  └─ Traceable: Institution code embedded for origin tracking             │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 3: Student record created with credential_status = 'pending'
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Student Record Created:                                                 │
│  {                                                                       │
│    id: "uuid-generated",                                                 │
│    student_id: "MSD-2024-0125",                                          │
│    student_name: "Rahul Sharma",                                         │
│    institution_id: "inst-msd-001",                                       │
│    class_id: "cls-msd-8a",                                               │
│    credential_status: "pending",                                         │
│    must_change_password: true,                                           │
│    ...                                                                   │
│  }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 4: System Admin sets credentials via Credential Management
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Credential Management → Students Tab                                    │
│                                                                          │
│  1. Select institution from dropdown                                     │
│  2. Find student with "Pending Setup" badge                              │
│  3. Click "Set Up Credentials"                                           │
│  4. SetPasswordDialog opens:                                             │
│     ├─ Auto-generate secure password (recommended)                       │
│     └─ OR manually set password (8+ chars, uppercase, lowercase,         │
│        number, special char)                                             │
│  5. Save → credential_status = 'configured'                              │
│  6. Communicate temporary password to student/parent                     │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ▼
Step 5: Student first login with forced password change
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  First Login Flow:                                                       │
│                                                                          │
│  1. Student navigates to /login                                          │
│  2. Enters email + temporary password                                    │
│  3. Authentication succeeds                                              │
│  4. System checks must_change_password === true                          │
│  5. ForcePasswordChangeDialog appears (non-dismissible)                  │
│     ├─ Cannot close via X button                                         │
│     ├─ Cannot close via outside click                                    │
│     └─ Cannot close via ESC key                                          │
│  6. Student enters:                                                      │
│     ├─ Current temporary password                                        │
│     ├─ New password (with strength validation)                           │
│     └─ Confirm new password                                              │
│  7. On success:                                                          │
│     ├─ must_change_password = false                                      │
│     ├─ password_changed_at = timestamp                                   │
│     └─ Redirect to /tenant/{slug}/student/dashboard                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Bulk Student Upload (CSV)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Bulk Upload Workflow:                                                   │
│                                                                          │
│  1. Download CSV template with required columns                          │
│  2. Fill student data (max 1000 rows, 5MB file limit)                    │
│  3. Upload CSV file                                                      │
│  4. System parses and validates:                                         │
│     ├─ Required fields present                                           │
│     ├─ Email uniqueness                                                  │
│     ├─ Roll number uniqueness within class                               │
│     ├─ Admission number uniqueness within institution                    │
│     └─ Valid class_id references                                         │
│  5. Preview shows valid/invalid rows                                     │
│  6. Import options:                                                      │
│     ├─ Skip duplicates                                                   │
│     └─ Update existing records                                           │
│  7. Import executes, returns BulkUploadResult                            │
└─────────────────────────────────────────────────────────────────────────┘

BulkUploadResult Interface:
{
  imported: number;      // Successfully added
  updated: number;       // Existing records updated
  skipped: number;       // Duplicates skipped
  failed: number;        // Failed rows
  duplicates?: string[]; // List of duplicate identifiers
  errors?: Array<{
    row: number;
    roll_number: string;
    error: string;
  }>;
}
```

---

## 3. Student Data Models

### 3.1 Student Entity

```typescript
interface Student {
  // Primary Identifiers
  id: string;                    // UUID, database primary key
  student_id: string;            // Lifelong ID: "MSD-2024-0125"
  
  // Personal Information
  student_name: string;          // Full name
  date_of_birth: string;         // ISO date: "2010-05-15"
  gender: 'male' | 'female' | 'other';
  blood_group?: string;          // Optional: "A+", "B-", "O+", etc.
  avatar?: string;               // Profile image URL
  
  // Academic Information
  class: string;                 // Display name: "Grade 8"
  section: string;               // "A", "B", "C"
  class_id: string;              // Foreign key: "cls-msd-8a"
  roll_number: string;           // Unique within class: "15"
  admission_number: string;      // Unique within institution: "ADM-2024-0125"
  admission_date: string;        // ISO date
  previous_school?: string;      // Optional
  
  // Institution Link
  institution_id: string;        // Foreign key: "inst-msd-001"
  
  // Guardian Information
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  address: string;
  
  // Status & Timestamps
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  created_at: string;            // ISO timestamp
}
```

### 3.2 User Authentication Context

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'student';
  tenant_id: string;              // Institution slug for URL routing
  
  // Student-Specific Fields
  institution_id: string;         // "inst-msd-001"
  student_id: string;             // "MSD-2024-0125"
  class_id: string;               // "cls-msd-8a"
  class_name: string;             // "Grade 8"
  section: string;                // "A"
  
  // Credential Status
  password_changed: boolean;
  must_change_password: boolean;
  
  // Avatar
  avatar?: string;
}
```

### 3.3 Institution Class Entity

```typescript
interface InstitutionClass {
  id: string;                     // "cls-msd-8a"
  institution_id: string;         // "inst-msd-001"
  class_name: string;             // "Grade 8"
  display_order: number;          // For sorting: 8
  academic_year: string;          // "2024-2025"
  capacity?: number;              // Max students
  class_teacher_id?: string;      // Teacher assignment
  room_number?: string;           // Physical location
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}
```

---

## 4. Authentication & Authorization

### 4.1 Login Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         STUDENT LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────────────┘

     ┌─────────┐                                          ┌─────────────┐
     │  /login │                                          │   Backend   │
     └────┬────┘                                          └──────┬──────┘
          │                                                      │
          │  1. POST /api/v1/auth/login                          │
          │     { email, password }                              │
          │ ─────────────────────────────────────────────────────►
          │                                                      │
          │  2. Validate credentials                             │
          │     - Check user exists                              │
          │     - Verify password hash                           │
          │     - Check account not locked                       │
          │                                                      │
          │  3. Return user data + JWT token                     │
          │ ◄─────────────────────────────────────────────────────
          │     {                                                │
          │       user: { id, email, name, role: 'student',      │
          │               institution_id, class_id, ... },       │
          │       token: "jwt-token",                            │
          │       must_change_password: true/false               │
          │     }                                                │
          │                                                      │
          │  4. If must_change_password === true                 │
          │     → Show ForcePasswordChangeDialog                 │
          │                                                      │
          │  5. Store in localStorage:                           │
          │     - user object                                    │
          │     - token                                          │
          │     - tenant: { slug, name, institution_id }         │
          │                                                      │
          │  6. Redirect to /tenant/{slug}/student/dashboard     │
          │                                                      │
     ┌────┴────┐                                          ┌──────┴──────┐
     │Dashboard│                                          │   Backend   │
     └─────────┘                                          └─────────────┘
```

### 4.2 Protected Route Implementation

```typescript
// Route protection logic
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  // Verify tenant_id matches URL
  const { tenantId } = useParams();
  if (user.tenant_id !== tenantId) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};
```

### 4.3 Session Management

```typescript
// AuthContext structure
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

// Session storage keys
localStorage.setItem('user', JSON.stringify(user));
localStorage.setItem('token', jwtToken);
localStorage.setItem('tenant', JSON.stringify({
  slug: 'modern-school-vasant-vihar',
  name: 'Modern School Vasant Vihar',
  institution_id: 'inst-msd-001'
}));
```

---

## 5. Routing Configuration

### 5.1 URL Structure

```
Base URL: /tenant/{institution-slug}/student/{page}

Examples:
/tenant/modern-school-vasant-vihar/student/dashboard
/tenant/modern-school-vasant-vihar/student/courses
/tenant/modern-school-vasant-vihar/student/courses/course-ai-101
/tenant/kikani-global-academy/student/assessments
```

### 5.2 Complete Route Table

| Route Path | Component | Purpose |
|------------|-----------|---------|
| `/tenant/:tenantId/student/dashboard` | `Dashboard.tsx` | Main student dashboard |
| `/tenant/:tenantId/student/courses` | `Courses.tsx` | Browse and enrolled courses |
| `/tenant/:tenantId/student/courses/:courseId` | `CourseDetail.tsx` | Course content viewer |
| `/tenant/:tenantId/student/assessments` | `Assessments.tsx` | View/take assessments |
| `/tenant/:tenantId/student/assessments/:assessmentId` | `TakeAssessment.tsx` | Assessment attempt |
| `/tenant/:tenantId/student/assignments` | `Assignments.tsx` | View/submit assignments |
| `/tenant/:tenantId/student/assignments/:assignmentId` | `AssignmentSubmission.tsx` | Submit assignment |
| `/tenant/:tenantId/student/projects` | `Projects.tsx` | My innovation projects |
| `/tenant/:tenantId/student/events` | `Events.tsx` | Events & activities |
| `/tenant/:tenantId/student/timetable` | `Timetable.tsx` | Class schedule |
| `/tenant/:tenantId/student/certificates` | `Certificates.tsx` | Earned certificates |
| `/tenant/:tenantId/student/gamification` | `Gamification.tsx` | Badges & leaderboard |
| `/tenant/:tenantId/student/resume` | `Resume.tsx` | Auto-generated resume |
| `/tenant/:tenantId/student/feedback` | `FeedbackSurvey.tsx` | Surveys & feedback |
| `/tenant/:tenantId/student/ask-metova` | `AskMetova.tsx` | AI assistant |
| `/tenant/:tenantId/student/settings` | `Settings.tsx` | Account settings |

### 5.3 Route Configuration in App.tsx

```typescript
// Student Routes (all protected, role: 'student')
<Route path="/tenant/:tenantId/student" element={<ProtectedRoute allowedRoles={['student']} />}>
  <Route path="dashboard" element={<StudentDashboard />} />
  <Route path="courses" element={<StudentCourses />} />
  <Route path="courses/:courseId" element={<StudentCourseDetail />} />
  <Route path="assessments" element={<StudentAssessments />} />
  <Route path="assessments/:assessmentId" element={<TakeAssessment />} />
  <Route path="assignments" element={<StudentAssignments />} />
  <Route path="assignments/:assignmentId" element={<AssignmentSubmission />} />
  <Route path="projects" element={<StudentProjects />} />
  <Route path="events" element={<StudentEvents />} />
  <Route path="timetable" element={<StudentTimetable />} />
  <Route path="certificates" element={<StudentCertificates />} />
  <Route path="gamification" element={<StudentGamification />} />
  <Route path="resume" element={<StudentResume />} />
  <Route path="feedback" element={<StudentFeedbackSurvey />} />
  <Route path="ask-metova" element={<StudentAskMetova />} />
  <Route path="settings" element={<StudentSettings />} />
</Route>
```

---

## 6. Sidebar Menu Configuration

### 6.1 Student Menu Items

| Order | Label | Icon | Path | Component |
|-------|-------|------|------|-----------|
| 1 | Dashboard | `LayoutDashboard` | /dashboard | Dashboard.tsx |
| 2 | My Courses | `BookOpen` | /courses | Courses.tsx |
| 3 | Assessments | `FileText` | /assessments | Assessments.tsx |
| 4 | Assignments | `ClipboardList` | /assignments | Assignments.tsx |
| 5 | My Projects | `Target` | /projects | Projects.tsx |
| 6 | Events & Activities | `Trophy` | /events | Events.tsx |
| 7 | Timetable | `Calendar` | /timetable | Timetable.tsx |
| 8 | Certificates | `Award` | /certificates | Certificates.tsx |
| 9 | Gamification | `Star` | /gamification | Gamification.tsx |
| 10 | Resume | `FileUser` | /resume | Resume.tsx |
| 11 | Feedback/Survey | `MessageSquare` | /feedback | FeedbackSurvey.tsx |
| 12 | Ask Metova | `Bot` | /ask-metova | AskMetova.tsx |
| 13 | Settings | `Settings` | /settings | Settings.tsx |

### 6.2 Sidebar Path Resolution

```typescript
// From Sidebar.tsx
const getFullPath = (path: string): string => {
  if (user?.role === 'student' && user?.tenant_id) {
    const tenantStr = localStorage.getItem('tenant');
    const tenant = tenantStr ? JSON.parse(tenantStr) : null;
    const tenantSlug = tenant?.slug || user.tenant_id;
    return `/tenant/${tenantSlug}/student${path}`;
  }
  return path;
};

// Example output:
// Input: "/dashboard"
// Output: "/tenant/modern-school-vasant-vihar/student/dashboard"
```

---

## 7. Complete Page Breakdown

### 7.1 Dashboard (`Dashboard.tsx`)

**Purpose**: Central hub showing student's learning progress, gamification stats, and quick actions.

**Data Sources**:
```typescript
// Data fetching
const { user } = useAuth();
const institutionId = user.institution_id;
const studentId = user.student_id;
const classId = user.class_id;

// Gamification data
getStudentGamificationData(studentId)  // Points, badges, streak

// Projects
getStudentProjects(studentId)  // Projects where student is member

// Courses
getEnrolledCourses(studentId, classId)  // Courses with progress

// Upcoming items
getUpcomingAssessments(institutionId, classId)
getUpcomingAssignments(institutionId, classId)
getUpcomingEvents(institutionId)
```

**Key Components**:
- `GamificationOverview`: Points, rank, streak, recent badges
- `QuickStats`: Total courses, projects, certificates, attendance
- `UpcomingDeadlines`: Next assessments, assignments due
- `RecentActivity`: Timeline of completed content, submissions
- `ProjectHighlights`: Active projects with progress
- `LeaderboardPreview`: Top 5 students in class

**UI Layout**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Welcome, {student_name}!        [Points: 2450] [Rank: #12]     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Courses  │ │ Projects │ │Certificates│ │Attendance│           │
│  │    5     │ │    2     │ │     8     │ │   92%    │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│  ┌───────────────────────────┐ ┌───────────────────────────┐    │
│  │     Upcoming Deadlines    │ │      Active Projects      │    │
│  │  • Math Quiz - Tomorrow   │ │  • Smart Irrigation       │    │
│  │  • Physics Assignment     │ │    Progress: 65%          │    │
│  │    Due in 3 days          │ │  • Waste Mgmt App         │    │
│  └───────────────────────────┘ │    Progress: 40%          │    │
│                                 └───────────────────────────┘    │
│  ┌───────────────────────────┐ ┌───────────────────────────┐    │
│  │     Recent Badges         │ │    Class Leaderboard      │    │
│  │  🏆 Quick Learner         │ │  1. Priya S.     3200 pts │    │
│  │  🎯 Project Champion      │ │  2. Rahul K.     2890 pts │    │
│  └───────────────────────────┘ │  ...                      │    │
│                                 │  12. You        2450 pts │    │
│                                 └───────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7.2 My Courses (`Courses.tsx`)

**Purpose**: Browse available courses and view enrolled courses with level-based access.

**Data Sources**:
```typescript
const { user } = useAuth();
const classId = user.class_id;

// Enrolled courses with progress
getEnrolledCourses(user.student_id)

// Available courses (filtered by class access)
getAvailableCourses(classId)

// Level access mapping
getClassLevelAccess(classId)  // Returns which levels this class can access
```

**Key Features**:
- **Two Tabs**: "My Enrolled Courses" | "Browse Courses"
- **Level-Based Access**: Class 4 sees Levels 1-7, Class 6 sees Levels 1-11
- **Progress Tracking**: Visual progress bars per course
- **Enrollment**: "Enroll" button for available courses

**Level Access Control**:
```typescript
interface ClassLevelAccess {
  class_id: string;
  class_name: string;        // "Grade 8"
  course_id: string;
  accessible_levels: number[]; // [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}

// Example: Grade 4 can access Levels 1-7
// Grade 6 can access Levels 1-11
// Grade 10 can access all levels
```

**Course Card Display**:
```
┌─────────────────────────────────────────┐
│  [Thumbnail]                             │
│                                          │
│  Artificial Intelligence Fundamentals   │
│  Category: Core STEM & Technology        │
│  Difficulty: Beginner                    │
│  Duration: 40 hours                      │
│                                          │
│  Progress: ████████░░ 78%                │
│  Levels Completed: 8/11                  │
│                                          │
│  [Continue Learning]                     │
└─────────────────────────────────────────┘
```

---

### 7.3 Course Detail (`CourseDetail.tsx`)

**Purpose**: View course content, track completion, access learning materials.

**Data Sources**:
```typescript
const { courseId } = useParams();
const { user } = useAuth();

// Course with levels
getCourseWithLevels(courseId)

// Student's accessible levels
getAccessibleLevels(courseId, user.class_id)

// Completion status per content item
getContentCompletionStatus(courseId, user.student_id)

// Learning log
getStudentLearningLog(courseId, user.student_id)
```

**Tabs**:
1. **Overview**: Course description, learning outcomes, prerequisites
2. **Content**: Hierarchical view of Levels → Sessions → Content items
3. **Learning Log**: Timeline of completed content with metadata

**Content Structure**:
```
Course: AI Fundamentals
├── Level 1: Introduction to AI
│   ├── Session 1.1: What is AI?
│   │   ├── Content: Introduction Video (YouTube) ✅
│   │   ├── Content: AI Basics PDF ✅
│   │   └── Content: Quiz: AI Concepts
│   └── Session 1.2: History of AI
│       ├── Content: Timeline Presentation ✅
│       └── Content: Interactive Simulation
├── Level 2: Machine Learning Basics
│   ├── Session 2.1: ML Fundamentals
│   │   ├── Content: ML Overview Video
│   │   └── Content: Hands-on Exercise
│   └── ...
└── Level 3: (Locked - requires Level 2 completion)
```

**Completion Tracking**:
```typescript
interface ContentCompletion {
  content_id: string;
  student_id: string;
  completed: boolean;
  completed_at?: string;
  completed_by: 'self' | 'officer';  // Self-study vs class session
  officer_id?: string;                // If completed during class
  officer_name?: string;
  session_date?: string;
}
```

**Learning Log Entry**:
```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Introduction to Machine Learning - PDF                       │
│  Completed: December 5, 2024 at 10:30 AM                         │
│  Marked complete by: Mr. Atif Ansari (Innovation Officer)        │
│  During class session for Grade 8A                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7.4 Assessments (`Assessments.tsx`)

**Purpose**: View available, upcoming, and completed assessments; take tests.

**Data Sources**:
```typescript
const { user } = useAuth();

// Filter assessments by institution AND class
getStudentAssessments(user.institution_id, user.class_id)

// Past attempts
getAssessmentAttempts(user.student_id)
```

**Tabs**:
1. **Available**: Assessments open for attempt now
2. **Upcoming**: Scheduled assessments not yet open
3. **Completed**: Past assessments with scores

**Assessment Card**:
```
┌─────────────────────────────────────────────────────────────────┐
│  Physics Mid-Term Assessment                                     │
│  Subject: Physics | Class: Grade 8                               │
│                                                                  │
│  📅 Available: Dec 10, 2024 - Dec 12, 2024                       │
│  ⏱️ Duration: 60 minutes                                         │
│  📝 Questions: 30 | Total Marks: 100                             │
│  🔄 Attempts Allowed: 1                                          │
│                                                                  │
│  [Start Assessment]                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Assessment Attempt Flow**:
```
1. Click "Start Assessment"
   ↓
2. Confirmation dialog (cannot pause once started)
   ↓
3. Assessment interface loads:
   - Timer countdown (top-right)
   - Question navigation (sidebar)
   - Question content + options (main area)
   - Mark for review checkbox
   ↓
4. Auto-submit on timer expiry OR manual submit
   ↓
5. Results page (if immediate feedback enabled)
   - Score, percentage, time taken
   - Correct/incorrect breakdown
   - Review answers (if allowed)
```

**Assessment Filtering Logic**:
```typescript
// Backend query logic
const getStudentAssessments = (institutionId, classId) => {
  return assessments.filter(assessment => {
    // Check if published to student's institution
    const publishedToInstitution = assessment.publishing.institution_ids
      .includes(institutionId) || assessment.publishing.institution_ids.length === 0;
    
    // Check if published to student's class
    const publishedToClass = assessment.publishing.class_ids
      .includes(classId) || assessment.publishing.class_ids.length === 0;
    
    // Check status is published
    const isPublished = assessment.status === 'published';
    
    return publishedToInstitution && publishedToClass && isPublished;
  });
};
```

---

### 7.5 Assignments (`Assignments.tsx`)

**Purpose**: View assignments, submit work, track grades.

**Data Sources**:
```typescript
const { user } = useAuth();

// Assignments filtered by institution + class
getStudentAssignments(user.institution_id, user.class_id)

// Student's submissions
getStudentSubmissions(user.student_id)
```

**Tabs**:
1. **Pending**: Not yet submitted, ordered by due date
2. **Submitted**: Awaiting grading
3. **Graded**: Completed with feedback and scores

**Assignment Types**:
```typescript
type AssignmentType = 
  | 'file_upload'      // Upload PDF, DOC, images
  | 'text_submission'  // Rich text editor
  | 'url_submission'   // Submit link (GitHub, etc.)
  | 'multi_question';  // Multiple questions with different types
```

**Assignment Card**:
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 Research Paper: Climate Change Impact                        │
│  Subject: Environmental Science | Type: File Upload              │
│                                                                  │
│  📅 Due: December 15, 2024 at 11:59 PM                           │
│  ⏰ Time Remaining: 5 days 6 hours                               │
│  📊 Max Score: 100 points                                        │
│                                                                  │
│  Allowed Formats: PDF, DOCX, DOC                                 │
│  Max File Size: 10 MB                                            │
│                                                                  │
│  [View Details] [Submit Assignment]                              │
└─────────────────────────────────────────────────────────────────┘
```

**Submission Interface by Type**:
```
File Upload:
- Drag & drop zone
- File preview
- Multiple files (if allowed)
- Progress indicator

Text Submission:
- Rich text editor
- Word count
- Auto-save draft

URL Submission:
- URL input field
- URL validation
- Preview embed (if supported)

Multi-Question:
- Question-by-question navigation
- Progress indicator
- Save draft per question
```

**Graded Assignment View**:
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 Research Paper: Climate Change Impact                        │
│  Status: ✅ Graded                                               │
│                                                                  │
│  Score: 85/100 (Grade: A)                                        │
│  Submitted: December 14, 2024 at 10:30 PM (On time)              │
│  Graded by: Mr. Atif Ansari                                      │
│                                                                  │
│  Feedback:                                                       │
│  "Excellent research and well-structured arguments. Could        │
│   improve the conclusion section with more specific examples."   │
│                                                                  │
│  Rubric Breakdown:                                               │
│  ├─ Research Quality: 25/30                                      │
│  ├─ Structure & Organization: 28/30                              │
│  ├─ Writing Quality: 18/20                                       │
│  └─ Citations: 14/20                                             │
│                                                                  │
│  [View Submission] [Download Feedback]                           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7.6 My Projects (`Projects.tsx`)

**Purpose**: View innovation projects where student is a team member.

**Data Sources**:
```typescript
const { user } = useAuth();

// Projects where student is team member or leader
getStudentProjects(user.student_id)

// Project details with team info
getProjectWithTeam(projectId)
```

**Key Features**:
- View projects where student is member or leader
- See project status, progress, SDG goals
- View team members from potentially different classes
- See assigned events (if project assigned to competition)

**Project Card**:
```
┌─────────────────────────────────────────────────────────────────┐
│  🌱 Smart Irrigation System                                      │
│  SDG Goals: 🎯6 Clean Water | 🎯13 Climate Action                │
│                                                                  │
│  Status: Ongoing | Progress: 65%                                 │
│  ████████████░░░░░░░░                                            │
│                                                                  │
│  Team:                                                           │
│  👑 Rahul Sharma (You) - Team Leader - Grade 8A                  │
│  👤 Priya Patel - Member - Grade 8B                              │
│  👤 Amit Singh - Member - Grade 7A                               │
│                                                                  │
│  Mentor: Mr. Atif Ansari (Innovation Officer)                    │
│                                                                  │
│  🏆 Participating in: National Science Fair 2024                 │
│                                                                  │
│  [View Details]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Project Detail View**:
- Project description and objectives
- SDG goal alignment with badges
- Team members with roles and classes
- Progress timeline
- Assigned events with participation badges
- Mentor information

---

### 7.7 Events & Activities (`Events.tsx`)

**Purpose**: Browse events, express interest, track participation.

**Data Sources**:
```typescript
const { user } = useAuth();

// Events visible to student's institution
getEventsForInstitution(user.institution_id)

// Student's event interests
getStudentEventInterests(user.student_id)
```

**Tabs**:
1. **Upcoming Events**: Open for interest registration
2. **My Interests**: Events student has expressed interest in
3. **Participated**: Past events with certificates

**Event Card**:
```
┌─────────────────────────────────────────────────────────────────┐
│  [Banner Image]                                                  │
│                                                                  │
│  🏆 National Innovation Challenge 2024                           │
│  Type: Competition | Status: Open                                │
│                                                                  │
│  📅 Event: January 15-17, 2025                                   │
│  📝 Registration: Open until December 31, 2024                   │
│  📍 Venue: IIT Delhi Campus                                      │
│                                                                  │
│  Eligibility: Grades 8-12 | Max Participants: 500                │
│                                                                  │
│  🎁 Prizes:                                                      │
│  • 1st Place: ₹50,000 + Certificate                              │
│  • 2nd Place: ₹30,000 + Certificate                              │
│  • 3rd Place: ₹20,000 + Certificate                              │
│                                                                  │
│  [Express Interest]                                              │
└─────────────────────────────────────────────────────────────────┘
```

**Interest Registration Flow**:
```
1. Student clicks "Express Interest"
   ↓
2. Confirmation dialog
   ↓
3. Interest recorded with:
   - student_id
   - student_name
   - class_name, section
   - institution_id, institution_name
   - registered_at timestamp
   ↓
4. Button changes to "Interest Registered ✓"
   ↓
5. Interest visible to:
   - Innovation Officer (institution-filtered)
   - System Admin (all institutions)
   - Institution Management (institution-filtered)
```

**EventInterest Data Model**:
```typescript
interface EventInterest {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  section: string;
  institution_id: string;
  institution_name: string;
  registered_at: string;
}
```

---

### 7.8 Timetable (`Timetable.tsx`)

**Purpose**: View weekly class schedule synced from officer timetables.

**Data Sources**:
```typescript
const { user } = useAuth();

// Get timetable from officer schedules
getStudentTimetable(user.institution_id, user.class_id)
```

**Sync Logic**:
```typescript
// Timetable is derived from Innovation Officer schedules
// Officers have timetables assigned by System Admin
// Student timetable filters officer timetables by:
//   1. Officer's assigned institution matches student's institution
//   2. Officer's timetable slot matches student's class

const getStudentTimetable = (institutionId: string, classId: string) => {
  // Get all officers assigned to this institution
  const officers = getOfficersByInstitution(institutionId);
  
  // Get their timetables
  const officerTimetables = officers.flatMap(officer => 
    getOfficerTimetable(officer.id)
  );
  
  // Filter to this class's schedule
  return officerTimetables
    .filter(slot => slot.class_id === classId)
    .map(slot => ({
      day: slot.day,
      startTime: slot.start_time,
      endTime: slot.end_time,
      subject: slot.subject,
      teacher: slot.officer_name,
      room: slot.room_number,
      type: slot.session_type  // lecture, lab, practical
    }));
};
```

**Timetable Display**:
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Weekly Timetable - Grade 8A                          │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   Time   │  Monday  │  Tuesday │Wednesday │ Thursday │  Friday  │ Saturday │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 9:00-    │ AI       │ Robotics │ AI       │ IoT      │ Robotics │ Project  │
│ 9:45     │ Mr. Atif │ Mr. Atif │ Mr. Atif │ Mr. Atif │ Mr. Atif │ Work     │
│          │ Lab 1    │ Lab 2    │ Lab 1    │ Lab 3    │ Lab 2    │          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 9:45-    │ IoT      │ Design   │ Robotics │ AI       │ Project  │          │
│ 10:30    │ Mr. Atif │ Thinking │ Mr. Atif │ Mr. Atif │ Work     │          │
│          │ Lab 3    │ Mr. Atif │ Lab 2    │ Lab 1    │          │          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ ...      │ ...      │ ...      │ ...      │ ...      │ ...      │ ...      │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### 7.9 Certificates (`Certificates.tsx`)

**Purpose**: View and download earned certificates.

**Data Sources**:
```typescript
const { user } = useAuth();

// All certificates earned by student
getStudentCertificates(user.student_id)
```

**Certificate Categories**:
```typescript
type CertificateCategory = 'course' | 'assignment' | 'assessment' | 'event';
```

**Certificate Award Triggers**:
```
Course Certificate:
  → Awarded when all accessible levels completed

Assignment Certificate:
  → Awarded when assignment graded with passing score
  → If assignment has certificate_template_id attached

Assessment Certificate:
  → Awarded when assessment completed with passing score
  → If assessment has certificate_template_id attached

Event Certificate:
  → Awarded after event participation confirmed
  → If event has certificate_template_id attached
```

**Certificate Card**:
```
┌─────────────────────────────────────────────────────────────────┐
│  [Certificate Thumbnail Preview]                                 │
│                                                                  │
│  🎓 AI Fundamentals - Course Completion                          │
│  Category: Course                                                │
│                                                                  │
│  Issued: December 5, 2024                                        │
│  Verification Code: CERT-AI-2024-0125                            │
│                                                                  │
│  [Preview] [Download PDF] [Verify]                               │
└─────────────────────────────────────────────────────────────────┘
```

**StudentCertificate Data Model**:
```typescript
interface StudentCertificate {
  id: string;
  student_id: string;
  student_name: string;
  template_id: string;
  activity_type: 'course' | 'assignment' | 'assessment' | 'event';
  activity_id: string;
  activity_name: string;
  institution_name: string;
  issued_date: string;
  completion_date: string;
  certificate_url: string;       // Generated PDF URL
  verification_code: string;     // Unique verification code
  qr_code_url: string;           // QR code for verification
  grade?: string;                // Optional grade/score
}
```

---

### 7.10 Gamification (`Gamification.tsx`)

**Purpose**: View points, badges, leaderboard ranking.

**Data Sources**:
```typescript
const { user } = useAuth();

// Student gamification data
getStudentGamification(user.student_id)

// Class leaderboard
getClassLeaderboard(user.class_id)

// Institution leaderboard
getInstitutionLeaderboard(user.institution_id)
```

**Gamification Data Model**:
```typescript
interface StudentGamification {
  student_id: string;
  total_points: number;
  class_rank: number;
  institution_rank: number;
  streak_days: number;
  
  badges_earned: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'achievement' | 'participation' | 'excellence' | 'milestone';
    earned_at: string;
  }>;
  
  badges_locked: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    points_required: number;
    progress: number;  // 0-100 percentage
  }>;
  
  points_breakdown: {
    sessions: number;      // Points from attending sessions
    projects: number;      // Points from project progress
    attendance: number;    // Points from attendance streak
    assessments: number;   // Points from assessment scores
    assignments: number;   // Points from assignment completion
  };
}
```

**XP Earning Rules** (configured by System Admin):
```typescript
interface XPRule {
  activity: string;
  points: number;
  description: string;
}

// Example rules:
[
  { activity: 'session_attendance', points: 10, description: 'Attend a session' },
  { activity: 'assessment_completion', points: 50, description: 'Complete an assessment' },
  { activity: 'perfect_score', points: 100, description: 'Score 100% on assessment' },
  { activity: 'project_submission', points: 75, description: 'Submit project milestone' },
  { activity: 'assignment_submission', points: 25, description: 'Submit assignment on time' },
  { activity: 'daily_login', points: 5, description: 'Log in daily' },
  { activity: 'early_submission', points: 15, description: 'Submit before deadline' },
]
```

**Leaderboard Display**:
```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Class 8A Leaderboard                    [Class] [Institution]│
├─────────────────────────────────────────────────────────────────┤
│  Rank  │  Student           │  Points  │  Badges  │  Streak     │
├────────┼────────────────────┼──────────┼──────────┼─────────────┤
│  🥇 1  │  Priya Sharma      │  3,250   │    12    │  🔥 45 days │
│  🥈 2  │  Rahul Kumar       │  2,890   │    10    │  🔥 30 days │
│  🥉 3  │  Amit Singh        │  2,750   │     9    │  🔥 28 days │
│     4  │  Sneha Patel       │  2,600   │     8    │  🔥 15 days │
│     5  │  Vikram Reddy      │  2,450   │     8    │  🔥 22 days │
│  ...   │  ...               │  ...     │  ...     │  ...        │
│ ★ 12   │  You (Ravi M.)     │  2,100   │     6    │  🔥 10 days │
└─────────────────────────────────────────────────────────────────┘
```

---

### 7.11 Resume (`Resume.tsx`)

**Purpose**: Auto-generated resume showcasing achievements.

**Data Sources**:
```typescript
const { user } = useAuth();

// Aggregate all student achievements
getResumeData(user.student_id)
```

**Resume Sections**:
1. **Profile**: Name, class, institution, avatar
2. **Courses Completed**: List with certificates
3. **Projects**: Innovation projects with roles and SDG goals
4. **Assessments**: Scores and achievements
5. **Certificates**: All earned certificates
6. **Badges & Achievements**: Gamification badges
7. **Event Participation**: Events participated in
8. **Skills**: Derived from completed courses

**Export Options**:
- Download as PDF
- Share link (public view)
- Print-friendly version

---

### 7.12 Feedback/Survey (`FeedbackSurvey.tsx`)

**Purpose**: Respond to surveys, submit feedback.

**Data Sources**:
```typescript
const { user } = useAuth();

// Surveys targeted to student's institution
getSurveysForStudent(user.institution_id, user.class_id)

// Student's survey responses
getSurveyResponses(user.student_id)

// Student's submitted feedback
getStudentFeedback(user.student_id)
```

**Tabs**:
1. **Surveys**: Available surveys to complete
2. **Submit Feedback**: General feedback form
3. **My Responses**: History of submissions

**Survey Types**:
- Course feedback
- Instructor rating
- Facility feedback
- General satisfaction

**Feedback Form**:
```
┌─────────────────────────────────────────────────────────────────┐
│  📝 Submit Feedback                                              │
│                                                                  │
│  Category: [Dropdown: Course / Officer / Facility / General]    │
│                                                                  │
│  Rating: ⭐⭐⭐⭐☆ (4/5)                                           │
│                                                                  │
│  Subject: [Text input]                                           │
│                                                                  │
│  Description:                                                    │
│  [Rich text area]                                                │
│                                                                  │
│  ☐ Submit anonymously                                            │
│                                                                  │
│  [Submit Feedback]                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Bidirectional Sync**:
```
Student submits feedback
        ↓
Saved to feedback storage
        ↓
Visible in System Admin Surveys & Feedback page
        ↓
Admin responds
        ↓
Student sees response in "My Responses" tab
```

---

### 7.13 Ask Metova (`AskMetova.tsx`)

**Purpose**: AI assistant for student queries.

**Features**:
- Chat interface for questions
- Context-aware responses about courses, schedule, deadlines
- New chat / clear history
- Conversation persistence

**Suggested Queries**:
- "What assignments are due this week?"
- "How many points do I need for the next badge?"
- "Explain the concept of machine learning"
- "What events are coming up?"

---

### 7.14 Settings (`Settings.tsx`)

**Purpose**: Account settings and password management.

**Tabs**:
1. **Account Security**
   - Change password
   - Password strength validation
   - Request password reset

2. **Profile**
   - View profile (mostly read-only)
   - Update avatar
   - View class/section info

---

## 8. Data Linkage Architecture

### 8.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA LINKAGE ARCHITECTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────┐
                              │  SYSTEM ADMIN   │
                              │  (Platform)     │
                              └────────┬────────┘
                                       │
           ┌───────────────────────────┼───────────────────────────┐
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│    Assessments      │    │    Assignments      │    │      Events         │
│    Surveys          │    │    Courses          │    │      Gamification   │
└──────────┬──────────┘    └──────────┬──────────┘    └──────────┬──────────┘
           │                           │                           │
           │  Published to             │  Published to             │
           │  institution_ids[]        │  institution_ids[]        │
           │  class_ids[]              │  class_ids[]              │
           │                           │                           │
           ▼                           ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INSTITUTION                                        │
│                        (e.g., inst-msd-001)                                  │
│                                                                              │
│  ┌─────────────────┐                           ┌─────────────────┐           │
│  │   Management    │                           │Innovation Officer│          │
│  │     Admin       │                           │ (Institutional   │          │
│  └─────────────────┘                           │   Isolation)     │          │
│                                                └────────┬─────────┘          │
│                                                         │                    │
│                                           Creates/Manages│                    │
│                                                         ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         PROJECTS                                     │    │
│  │   - project_id                                                       │    │
│  │   - mentor_id → officer_id                                           │    │
│  │   - team_members[] → student_ids with class/section                  │    │
│  │   - assigned_events[] → event_ids                                    │    │
│  └───────────────────────────────────────────┬─────────────────────────┘    │
│                                               │                              │
│                                               │                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                          CLASSES                                     │    │
│  │                                                                      │    │
│  │   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │   │ Grade 6A │  │ Grade 6B │  │ Grade 7A │  │ Grade 7B │  ...       │    │
│  │   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘            │    │
│  │        │              │              │              │                │    │
│  └────────┼──────────────┼──────────────┼──────────────┼────────────────┘    │
│           │              │              │              │                     │
│           ▼              ▼              ▼              ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         STUDENTS                                     │    │
│  │                                                                      │    │
│  │   ┌─────────────────────────────────────────────────────────────┐   │    │
│  │   │  Student Entity:                                             │   │    │
│  │   │  - id (UUID)                                                 │   │    │
│  │   │  - student_id (MSD-2024-XXXX) ← Lifelong, never changes      │   │    │
│  │   │  - institution_id ← Links to institution                     │   │    │
│  │   │  - class_id ← Links to class (can change on promotion)       │   │    │
│  │   │  - section                                                   │   │    │
│  │   └─────────────────────────────────────────────────────────────┘   │    │
│  │                                                                      │    │
│  │   Student sees:                                                      │    │
│  │   ├─ Assessments WHERE institution_id = mine AND class_id = mine    │    │
│  │   ├─ Assignments WHERE institution_id = mine AND class_id = mine    │    │
│  │   ├─ Courses WHERE class has level access                           │    │
│  │   ├─ Projects WHERE I am in team_members[]                          │    │
│  │   ├─ Events WHERE institution_id = mine OR public                   │    │
│  │   ├─ Surveys WHERE institution_id = mine                            │    │
│  │   └─ Timetable derived from Officer schedules for my class          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Key Relationship Mappings

```typescript
// Student → Institution
student.institution_id → institution.id

// Student → Class
student.class_id → institution_class.id

// Student → Assessments (through publishing)
assessment.publishing.institution_ids.includes(student.institution_id) &&
assessment.publishing.class_ids.includes(student.class_id)

// Student → Assignments (through publishing)
assignment.publishing.institution_ids.includes(student.institution_id) &&
assignment.publishing.class_ids.includes(student.class_id)

// Student → Courses (through level access)
course_level_access.class_id === student.class_id

// Student → Projects (through membership)
project.team_members.find(m => m.student_id === student.student_id)

// Student → Events (through institution)
event.institution_ids.includes(student.institution_id) ||
event.institution_ids.length === 0  // Public event

// Student → Timetable (through officer schedule)
officer.institution_id === student.institution_id &&
officer_timetable.class_id === student.class_id

// Student → Officer (through project mentorship)
project.mentor_id → officer.id WHERE student in project.team_members
```

---

## 9. Bidirectional Synchronization Flows

### 9.1 Assessment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ASSESSMENT BIDIRECTIONAL FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

CREATION (System Admin → Student):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. System Admin creates assessment
   │
   ▼
2. Selects publishing targets:
   - institution_ids: ['inst-msd-001', 'inst-kga-001']
   - class_ids: ['cls-msd-8a', 'cls-msd-8b', 'cls-kga-8a']
   │
   ▼
3. Assessment saved with status: 'published'
   │
   ▼
4. Student Dashboard queries:
   getStudentAssessments(institution_id, class_id)
   │
   ▼
5. Student sees assessment in "Available" tab


ATTEMPT (Student → System Admin):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student starts assessment attempt
   │
   ▼
2. AssessmentAttempt created:
   {
     id: 'attempt-uuid',
     assessment_id: 'assessment-id',
     student_id: 'student-id',
     started_at: timestamp,
     status: 'in_progress'
   }
   │
   ▼
3. Student submits answers
   │
   ▼
4. Attempt updated:
   {
     submitted_at: timestamp,
     status: 'submitted',
     score: calculated,
     percentage: calculated,
     answers: [...]
   }
   │
   ▼
5. System Admin views in Assessment Analytics:
   - Total attempts
   - Average score
   - Score distribution
   - Per-question analysis


DATA SYNC FUNCTIONS:
━━━━━━━━━━━━━━━━━━━━

// Frontend (localStorage during development)
loadAssessments()              → Read from localStorage
saveAssessments(assessments)   → Write to localStorage

// Backend API (production)
GET  /api/v1/assessments?institution_id=X&class_id=Y
POST /api/v1/assessments/:id/attempts
PUT  /api/v1/assessment-attempts/:id/submit
```

### 9.2 Assignment Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ASSIGNMENT BIDIRECTIONAL FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

CREATION (System Admin → Student):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. System Admin creates assignment (6-step wizard)
   │
   ▼
2. Publishes to institutions and classes
   │
   ▼
3. Student sees in "Pending" tab


SUBMISSION (Student → Officer/Admin):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student views assignment details
   │
   ▼
2. Submits based on type:
   - File upload → Upload file(s)
   - Text → Submit rich text
   - URL → Submit link
   - Multi-question → Answer all questions
   │
   ▼
3. Submission created with status: 'submitted'
   │
   ▼
4. Visible to Innovation Officer (institution-filtered)
   │
   ▼
5. Officer grades with rubric and feedback
   │
   ▼
6. Submission updated: status: 'graded', score, feedback
   │
   ▼
7. Student sees in "Graded" tab with feedback
```

### 9.3 Project Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PROJECT BIDIRECTIONAL FLOW                             │
└─────────────────────────────────────────────────────────────────────────────┘

CREATION (Officer → Student):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Innovation Officer creates project
   - Selects team members (from their institution only)
   - Each member has: student_id, name, class, section, role
   - Assigns themselves as mentor
   │
   ▼
2. Project saved with mentor_id = officer.id
   │
   ▼
3. Students in team_members[] see project in "My Projects"


EVENT ASSIGNMENT (Officer → Student):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Officer assigns project to event
   │
   ▼
2. project.assigned_events.push(event_id)
   │
   ▼
3. Student sees event badge on project card:
   "🏆 Participating in: National Science Fair"
```

### 9.4 Event Interest Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    EVENT INTEREST BIDIRECTIONAL FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

INTEREST (Student → Officer/Admin):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student views event
   │
   ▼
2. Clicks "Express Interest"
   │
   ▼
3. EventInterest created:
   {
     event_id,
     student_id,
     student_name,
     class_name,
     section,
     institution_id,
     institution_name,
     registered_at
   }
   │
   ▼
4. Visible in:
   - Innovation Officer Dashboard (institution-filtered)
   - System Admin Event Management (all)
   - Institution Management (institution-filtered)
```

### 9.5 Timetable Sync Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIMETABLE BIDIRECTIONAL FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

SYNC DIRECTION: System Admin → Officer → Student
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. System Admin configures institution timetable
   - Period definitions
   - Class-subject-officer assignments
   │
   ▼
2. syncInstitutionToOfficerTimetable() runs
   - Converts institution assignments to officer slots
   │
   ▼
3. Officer sees personal schedule in "Sessions" page
   │
   ▼
4. Student requests timetable:
   getStudentTimetable(institution_id, class_id)
   │
   ▼
5. Function filters officer timetables:
   - Officer assigned to this institution
   - Slot assigned to this class
   │
   ▼
6. Student sees class schedule with:
   - Subject
   - Teacher (officer name)
   - Room
   - Time slot
```

### 9.6 Survey/Feedback Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SURVEY/FEEDBACK BIDIRECTIONAL FLOW                        │
└─────────────────────────────────────────────────────────────────────────────┘

SURVEY (Admin → Student → Admin):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. System Admin creates survey
   - Targets: institution_ids, class_ids, or all
   │
   ▼
2. Student sees survey in Feedback/Survey page
   │
   ▼
3. Student submits responses
   │
   ▼
4. Admin sees responses in Survey Analytics


FEEDBACK (Student → Admin):
━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Student submits feedback
   │
   ▼
2. Admin sees in Feedback Management
   │
   ▼
3. Admin responds
   │
   ▼
4. Student sees admin response in "My Responses"
```

### 9.7 Content Completion Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CONTENT COMPLETION BIDIRECTIONAL FLOW                      │
└─────────────────────────────────────────────────────────────────────────────┘

OFFICER-INITIATED COMPLETION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Officer conducts class session
   │
   ▼
2. Officer marks content as "Complete" for session
   │
   ▼
3. System auto-marks completion for all PRESENT students:
   {
     content_id,
     student_id,
     completed: true,
     completed_by: 'officer',
     officer_id,
     officer_name,
     session_date,
     class_id
   }
   │
   ▼
4. Students see in Learning Log:
   "Completed by Mr. Atif during class on Dec 5, 2024"


SELF-STUDY COMPLETION:
━━━━━━━━━━━━━━━━━━━━━━

1. Student views content independently
   │
   ▼
2. Student marks as "Complete"
   │
   ▼
3. Completion recorded:
   {
     content_id,
     student_id,
     completed: true,
     completed_by: 'self',
     completed_at
   }
   │
   ▼
4. Learning Log shows:
   "Self-completed on Dec 6, 2024"
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
  "email": "student@example.com",
  "password": "securePassword123!"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "name": "Rahul Sharma",
      "role": "student",
      "tenant_id": "modern-school-vasant-vihar",
      "institution_id": "inst-msd-001",
      "student_id": "MSD-2024-0125",
      "class_id": "cls-msd-8a",
      "class_name": "Grade 8",
      "section": "A",
      "avatar": "https://..."
    },
    "token": "jwt-token-here",
    "must_change_password": false
  }
}

Response (401 Unauthorized):
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}


POST /api/v1/auth/force-change-password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "current_password": "tempPassword123",
  "new_password": "NewSecure@2024",
  "confirm_password": "NewSecure@2024"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Password changed successfully",
    "must_change_password": false
  }
}


POST /api/v1/auth/change-password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "current_password": "currentPassword",
  "new_password": "NewSecure@2024"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}


POST /api/v1/auth/forgot-password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "email": "student@example.com"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Password reset link sent to email"
  }
}


POST /api/v1/auth/reset-password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "token": "reset-token-from-email",
  "new_password": "NewSecure@2024"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}


GET /api/v1/auth/me
━━━━━━━━━━━━━━━━━━━
Headers: Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "user": { ... }  // Same as login response user object
  }
}
```

### 10.2 Student Profile APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         STUDENT PROFILE ENDPOINTS                            │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "student_id": "MSD-2024-0125",
    "student_name": "Rahul Sharma",
    "email": "rahul@example.com",
    "date_of_birth": "2010-05-15",
    "gender": "male",
    "class": "Grade 8",
    "section": "A",
    "class_id": "cls-msd-8a",
    "roll_number": "15",
    "admission_number": "ADM-2024-0125",
    "admission_date": "2024-04-01",
    "institution_id": "inst-msd-001",
    "parent_name": "Suresh Sharma",
    "parent_phone": "+91-9876543210",
    "parent_email": "suresh@example.com",
    "address": "123 Main St, New Delhi",
    "blood_group": "B+",
    "avatar": "https://...",
    "status": "active",
    "created_at": "2024-04-01T10:00:00Z"
  }
}


PUT /api/v1/students/:studentId/avatar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request: multipart/form-data
- avatar: File (image)

Response:
{
  "success": true,
  "data": {
    "avatar_url": "https://storage.../avatars/student-uuid.jpg"
  }
}
```

### 10.3 Course APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COURSE ENDPOINTS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/courses/enrolled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course-ai-101",
        "title": "AI Fundamentals",
        "description": "...",
        "thumbnail": "https://...",
        "category": "Core STEM & Technology",
        "difficulty": "beginner",
        "duration_hours": 40,
        "progress_percentage": 75,
        "levels_completed": 8,
        "total_accessible_levels": 11,
        "enrolled_at": "2024-09-01T10:00:00Z"
      }
    ]
  }
}


GET /api/v1/students/:studentId/courses/available
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?class_id=cls-msd-8a

Response:
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": "course-robotics-201",
        "title": "Advanced Robotics",
        "description": "...",
        "category": "Core STEM & Technology",
        "difficulty": "intermediate",
        "duration_hours": 50,
        "accessible_levels": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        "enrolled": false
      }
    ]
  }
}


POST /api/v1/students/:studentId/courses/:courseId/enroll
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "enrollment_id": "enrollment-uuid",
    "course_id": "course-robotics-201",
    "enrolled_at": "2024-12-10T10:00:00Z"
  }
}


GET /api/v1/courses/:courseId/content
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?student_id=X&class_id=Y  (for level filtering)

Response:
{
  "success": true,
  "data": {
    "course": {
      "id": "course-ai-101",
      "title": "AI Fundamentals",
      "description": "...",
      "learning_outcomes": [...],
      "prerequisites": [...]
    },
    "levels": [
      {
        "id": "level-1",
        "level_number": 1,
        "title": "Introduction to AI",
        "description": "...",
        "accessible": true,
        "completed": true,
        "sessions": [
          {
            "id": "session-1-1",
            "title": "What is AI?",
            "description": "...",
            "content_items": [
              {
                "id": "content-1",
                "title": "Introduction Video",
                "type": "youtube",
                "url": "https://youtube.com/...",
                "duration_minutes": 15,
                "completed": true,
                "completed_by": "officer",
                "completed_at": "2024-12-05T10:30:00Z",
                "officer_name": "Mr. Atif Ansari"
              }
            ]
          }
        ]
      },
      {
        "id": "level-12",
        "level_number": 12,
        "title": "Advanced Topics",
        "accessible": false,  // Class 8 cannot access Level 12+
        "locked_reason": "Not available for your class"
      }
    ]
  }
}


POST /api/v1/content/:contentId/mark-complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "student_id": "student-uuid"
}

Response:
{
  "success": true,
  "data": {
    "content_id": "content-1",
    "completed": true,
    "completed_at": "2024-12-10T14:30:00Z",
    "completed_by": "self"
  }
}


GET /api/v1/students/:studentId/courses/:courseId/learning-log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "log-1",
        "content_id": "content-1",
        "content_title": "Introduction Video",
        "content_type": "youtube",
        "level_title": "Introduction to AI",
        "session_title": "What is AI?",
        "completed_at": "2024-12-05T10:30:00Z",
        "completed_by": "officer",
        "officer_name": "Mr. Atif Ansari"
      }
    ]
  }
}
```

### 10.4 Assessment APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ASSESSMENT ENDPOINTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/assessments
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?institution_id=X&class_id=Y

Response:
{
  "success": true,
  "data": {
    "available": [
      {
        "id": "assessment-1",
        "title": "Physics Mid-Term",
        "subject": "Physics",
        "total_questions": 30,
        "total_marks": 100,
        "duration_minutes": 60,
        "start_datetime": "2024-12-10T09:00:00Z",
        "end_datetime": "2024-12-12T23:59:00Z",
        "attempts_allowed": 1,
        "attempts_used": 0
      }
    ],
    "upcoming": [...],
    "completed": [
      {
        "id": "assessment-2",
        "title": "Math Quiz",
        "score": 85,
        "total_marks": 100,
        "percentage": 85,
        "attempted_at": "2024-12-01T10:00:00Z"
      }
    ]
  }
}


GET /api/v1/assessments/:assessmentId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "id": "assessment-1",
    "title": "Physics Mid-Term",
    "description": "...",
    "instructions": "...",
    "subject": "Physics",
    "total_questions": 30,
    "total_marks": 100,
    "duration_minutes": 60,
    "passing_percentage": 40,
    "start_datetime": "2024-12-10T09:00:00Z",
    "end_datetime": "2024-12-12T23:59:00Z",
    "attempts_allowed": 1,
    "shuffle_questions": true,
    "shuffle_options": true,
    "show_results_immediately": true,
    "allow_review": true
  }
}


POST /api/v1/assessments/:assessmentId/start-attempt
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "student_id": "student-uuid"
}

Response:
{
  "success": true,
  "data": {
    "attempt_id": "attempt-uuid",
    "started_at": "2024-12-10T10:00:00Z",
    "ends_at": "2024-12-10T11:00:00Z",
    "questions": [
      {
        "id": "q-1",
        "question_text": "What is Newton's first law?",
        "question_type": "mcq",
        "options": [
          { "id": "opt-a", "text": "Law of Inertia" },
          { "id": "opt-b", "text": "Law of Acceleration" },
          { "id": "opt-c", "text": "Law of Action-Reaction" },
          { "id": "opt-d", "text": "Law of Gravity" }
        ],
        "marks": 2
      }
    ]
  }
}


PUT /api/v1/assessment-attempts/:attemptId/answer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "question_id": "q-1",
  "selected_option_id": "opt-a",
  "marked_for_review": false
}

Response:
{
  "success": true,
  "data": {
    "saved": true
  }
}


POST /api/v1/assessment-attempts/:attemptId/submit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "attempt_id": "attempt-uuid",
    "submitted_at": "2024-12-10T10:45:00Z",
    "score": 85,
    "total_marks": 100,
    "percentage": 85,
    "passed": true,
    "time_taken_seconds": 2700,
    "show_results": true
  }
}


GET /api/v1/assessment-attempts/:attemptId/results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "score": 85,
    "total_marks": 100,
    "percentage": 85,
    "passed": true,
    "correct_answers": 28,
    "incorrect_answers": 2,
    "unanswered": 0,
    "time_taken_seconds": 2700,
    "questions": [
      {
        "id": "q-1",
        "question_text": "What is Newton's first law?",
        "selected_option_id": "opt-a",
        "correct_option_id": "opt-a",
        "is_correct": true,
        "marks_earned": 2,
        "explanation": "Newton's first law is also known as the Law of Inertia."
      }
    ]
  }
}
```

### 10.5 Assignment APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ASSIGNMENT ENDPOINTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/assignments
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?institution_id=X&class_id=Y

Response:
{
  "success": true,
  "data": {
    "pending": [
      {
        "id": "assignment-1",
        "title": "Climate Change Research Paper",
        "subject": "Environmental Science",
        "type": "file_upload",
        "due_date": "2024-12-15",
        "due_time": "23:59",
        "max_score": 100,
        "allowed_file_types": ["pdf", "docx"],
        "max_file_size_mb": 10
      }
    ],
    "submitted": [
      {
        "id": "assignment-2",
        "title": "Math Problem Set",
        "submitted_at": "2024-12-08T10:00:00Z",
        "status": "submitted"
      }
    ],
    "graded": [
      {
        "id": "assignment-3",
        "title": "History Essay",
        "score": 85,
        "max_score": 100,
        "grade": "A",
        "graded_at": "2024-12-05T15:00:00Z",
        "feedback": "Excellent analysis..."
      }
    ]
  }
}


GET /api/v1/assignments/:assignmentId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "id": "assignment-1",
    "title": "Climate Change Research Paper",
    "description": "Write a comprehensive research paper...",
    "instructions": "...",
    "subject": "Environmental Science",
    "type": "file_upload",
    "due_date": "2024-12-15",
    "due_time": "23:59",
    "max_score": 100,
    "allowed_file_types": ["pdf", "docx", "doc"],
    "max_file_size_mb": 10,
    "max_files": 1,
    "late_submission_policy": "penalty",
    "late_penalty_percentage": 10,
    "rubric": [
      { "criteria": "Research Quality", "max_score": 30 },
      { "criteria": "Structure", "max_score": 30 },
      { "criteria": "Writing", "max_score": 20 },
      { "criteria": "Citations", "max_score": 20 }
    ]
  }
}


POST /api/v1/assignments/:assignmentId/submit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request (file_upload): multipart/form-data
- student_id: string
- files: File[]

Request (text_submission):
{
  "student_id": "student-uuid",
  "content": "Rich text content here..."
}

Request (url_submission):
{
  "student_id": "student-uuid",
  "url": "https://github.com/student/project"
}

Request (multi_question):
{
  "student_id": "student-uuid",
  "answers": [
    { "question_id": "q-1", "answer": "Answer text..." },
    { "question_id": "q-2", "selected_options": ["opt-a", "opt-c"] }
  ]
}

Response:
{
  "success": true,
  "data": {
    "submission_id": "submission-uuid",
    "submitted_at": "2024-12-14T22:30:00Z",
    "is_late": false,
    "status": "submitted"
  }
}


GET /api/v1/students/:studentId/assignments/:assignmentId/submission
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "submission_id": "submission-uuid",
    "submitted_at": "2024-12-14T22:30:00Z",
    "is_late": false,
    "status": "graded",
    "score": 85,
    "max_score": 100,
    "grade": "A",
    "feedback": "Excellent research...",
    "graded_by": "Mr. Atif Ansari",
    "graded_at": "2024-12-16T10:00:00Z",
    "rubric_scores": [
      { "criteria": "Research Quality", "score": 25, "max_score": 30 },
      { "criteria": "Structure", "score": 28, "max_score": 30 },
      { "criteria": "Writing", "score": 18, "max_score": 20 },
      { "criteria": "Citations", "score": 14, "max_score": 20 }
    ],
    "submitted_files": [
      {
        "name": "research_paper.pdf",
        "url": "https://storage.../submissions/...",
        "size_mb": 2.5
      }
    ]
  }
}
```

### 10.6 Project APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROJECT ENDPOINTS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/projects
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
        "mentor": {
          "id": "officer-1",
          "name": "Mr. Atif Ansari"
        },
        "team_members": [
          {
            "student_id": "MSD-2024-0125",
            "name": "Rahul Sharma",
            "class": "Grade 8",
            "section": "A",
            "role": "leader"
          },
          {
            "student_id": "MSD-2024-0130",
            "name": "Priya Patel",
            "class": "Grade 8",
            "section": "B",
            "role": "member"
          }
        ],
        "assigned_events": [
          {
            "event_id": "event-1",
            "event_title": "National Science Fair 2024"
          }
        ],
        "created_at": "2024-09-15T10:00:00Z",
        "updated_at": "2024-12-01T14:00:00Z"
      }
    ]
  }
}


GET /api/v1/projects/:projectId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "id": "project-1",
    "title": "Smart Irrigation System",
    "description": "An IoT-based irrigation system...",
    "objectives": [...],
    "status": "ongoing",
    "progress_percentage": 65,
    "sdg_goals": [6, 13],
    "mentor": {
      "id": "officer-1",
      "name": "Mr. Atif Ansari",
      "email": "atif@metainnova.com"
    },
    "team_members": [...],
    "assigned_events": [...],
    "milestones": [
      {
        "id": "milestone-1",
        "title": "Research Phase",
        "status": "completed",
        "completed_at": "2024-10-01T10:00:00Z"
      },
      {
        "id": "milestone-2",
        "title": "Prototype Development",
        "status": "in_progress",
        "progress": 60
      }
    ],
    "timeline": [
      {
        "date": "2024-09-15",
        "event": "Project started"
      },
      {
        "date": "2024-10-01",
        "event": "Research phase completed"
      }
    ],
    "created_at": "2024-09-15T10:00:00Z"
  }
}
```

### 10.7 Event APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            EVENT ENDPOINTS                                   │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/events
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?institution_id=X

Response:
{
  "success": true,
  "data": {
    "upcoming": [
      {
        "id": "event-1",
        "title": "National Innovation Challenge 2024",
        "event_type": "competition",
        "status": "published",
        "registration_start": "2024-11-01",
        "registration_end": "2024-12-31",
        "event_start": "2025-01-15",
        "event_end": "2025-01-17",
        "venue": "IIT Delhi Campus",
        "banner_image": "https://...",
        "max_participants": 500,
        "eligibility_criteria": "Grades 8-12",
        "prizes": ["₹50,000", "₹30,000", "₹20,000"],
        "interested": false
      }
    ],
    "interested": [...],
    "participated": [...]
  }
}


POST /api/v1/events/:eventId/express-interest
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "student_id": "student-uuid",
  "student_name": "Rahul Sharma",
  "class_name": "Grade 8",
  "section": "A",
  "institution_id": "inst-msd-001",
  "institution_name": "Modern School Vasant Vihar"
}

Response:
{
  "success": true,
  "data": {
    "interest_id": "interest-uuid",
    "registered_at": "2024-12-10T10:00:00Z"
  }
}


DELETE /api/v1/events/:eventId/interests/:interestId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "message": "Interest removed successfully"
  }
}
```

### 10.8 Certificate APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CERTIFICATE ENDPOINTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/certificates
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "certificates": [
      {
        "id": "cert-1",
        "template_id": "template-1",
        "activity_type": "course",
        "activity_id": "course-ai-101",
        "activity_name": "AI Fundamentals",
        "institution_name": "Modern School Vasant Vihar",
        "issued_date": "2024-12-05",
        "completion_date": "2024-12-05",
        "certificate_url": "https://storage.../certificates/cert-1.pdf",
        "verification_code": "CERT-AI-2024-0125",
        "qr_code_url": "https://storage.../qr/cert-1.png",
        "grade": "A"
      }
    ]
  }
}


GET /api/v1/certificates/:certificateId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    // Full certificate details
  }
}


GET /api/v1/certificates/verify/:verificationCode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response (Public endpoint):
{
  "success": true,
  "data": {
    "valid": true,
    "student_name": "Rahul Sharma",
    "activity_name": "AI Fundamentals",
    "activity_type": "course",
    "issued_date": "2024-12-05",
    "institution_name": "Modern School Vasant Vihar"
  }
}
```

### 10.9 Gamification APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        GAMIFICATION ENDPOINTS                                │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/gamification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "total_points": 2450,
    "class_rank": 12,
    "institution_rank": 45,
    "streak_days": 10,
    "badges_earned": [
      {
        "id": "badge-1",
        "name": "Quick Learner",
        "description": "Completed 5 courses",
        "icon": "🏆",
        "category": "achievement",
        "earned_at": "2024-12-01T10:00:00Z"
      }
    ],
    "badges_locked": [
      {
        "id": "badge-2",
        "name": "Project Champion",
        "description": "Complete 10 projects",
        "icon": "🎯",
        "points_required": 5000,
        "progress": 45
      }
    ],
    "points_breakdown": {
      "sessions": 500,
      "projects": 800,
      "attendance": 350,
      "assessments": 600,
      "assignments": 200
    }
  }
}


GET /api/v1/leaderboard/class/:classId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "student_id": "student-uuid",
        "name": "Priya Sharma",
        "avatar": "https://...",
        "points": 3250,
        "badges_count": 12,
        "streak_days": 45
      }
    ],
    "current_user_rank": 12,
    "total_students": 35
  }
}


GET /api/v1/leaderboard/institution/:institutionId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "leaderboard": [...],
    "current_user_rank": 45,
    "total_students": 350
  }
}
```

### 10.10 Timetable APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TIMETABLE ENDPOINTS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/timetable
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?institution_id=X&class_id=Y

Response:
{
  "success": true,
  "data": {
    "class_name": "Grade 8A",
    "academic_year": "2024-2025",
    "slots": [
      {
        "day": "Monday",
        "day_index": 0,
        "start_time": "09:00",
        "end_time": "09:45",
        "subject": "AI Fundamentals",
        "teacher": "Mr. Atif Ansari",
        "room": "Lab 1",
        "type": "lecture"
      },
      {
        "day": "Monday",
        "day_index": 0,
        "start_time": "09:45",
        "end_time": "10:30",
        "subject": "IoT Basics",
        "teacher": "Mr. Atif Ansari",
        "room": "Lab 3",
        "type": "practical"
      }
    ]
  }
}
```

### 10.11 Survey & Feedback APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SURVEY & FEEDBACK ENDPOINTS                             │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/surveys
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Query: ?institution_id=X

Response:
{
  "success": true,
  "data": {
    "available": [
      {
        "id": "survey-1",
        "title": "Course Feedback Survey",
        "description": "...",
        "deadline": "2024-12-20",
        "questions_count": 10,
        "completed": false
      }
    ],
    "completed": [...]
  }
}


GET /api/v1/surveys/:surveyId
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "id": "survey-1",
    "title": "Course Feedback Survey",
    "description": "...",
    "questions": [
      {
        "id": "q-1",
        "question_text": "Rate the course content quality",
        "type": "rating",
        "required": true
      },
      {
        "id": "q-2",
        "question_text": "Which topics did you find most useful?",
        "type": "multiple_choice",
        "options": ["AI Basics", "Machine Learning", "Neural Networks"],
        "allow_multiple": true
      }
    ]
  }
}


POST /api/v1/surveys/:surveyId/responses
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "student_id": "student-uuid",
  "answers": [
    { "question_id": "q-1", "rating": 4 },
    { "question_id": "q-2", "selected_options": ["AI Basics", "Machine Learning"] }
  ]
}

Response:
{
  "success": true,
  "data": {
    "response_id": "response-uuid",
    "submitted_at": "2024-12-10T10:00:00Z"
  }
}


POST /api/v1/students/:studentId/feedback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Request:
{
  "category": "course",
  "subject": "Feedback about AI course",
  "description": "I really enjoyed the hands-on exercises...",
  "rating": 4,
  "anonymous": false
}

Response:
{
  "success": true,
  "data": {
    "feedback_id": "feedback-uuid",
    "submitted_at": "2024-12-10T10:00:00Z",
    "status": "submitted"
  }
}


GET /api/v1/students/:studentId/feedback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "feedback": [
      {
        "id": "feedback-1",
        "subject": "Feedback about AI course",
        "category": "course",
        "status": "resolved",
        "submitted_at": "2024-12-01T10:00:00Z",
        "admin_response": "Thank you for your feedback! We're glad you enjoyed the exercises.",
        "responded_at": "2024-12-02T14:00:00Z"
      }
    ]
  }
}
```

### 10.12 Resume APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            RESUME ENDPOINTS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

GET /api/v1/students/:studentId/resume
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response:
{
  "success": true,
  "data": {
    "profile": {
      "name": "Rahul Sharma",
      "class": "Grade 8A",
      "institution": "Modern School Vasant Vihar",
      "student_id": "MSD-2024-0125",
      "avatar": "https://..."
    },
    "courses_completed": [
      {
        "title": "AI Fundamentals",
        "completion_date": "2024-12-05",
        "grade": "A",
        "certificate_url": "https://..."
      }
    ],
    "projects": [
      {
        "title": "Smart Irrigation System",
        "role": "Team Leader",
        "sdg_goals": [6, 13],
        "status": "ongoing"
      }
    ],
    "assessments": [
      {
        "title": "Physics Mid-Term",
        "score": 85,
        "percentage": 85
      }
    ],
    "certificates": [...],
    "badges": [...],
    "events_participated": [...],
    "skills": ["Python", "IoT", "Machine Learning", "Arduino"]
  }
}


GET /api/v1/students/:studentId/resume/pdf
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response: PDF file download
```

---

## 11. Database Schema

### 11.1 Students Table

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) UNIQUE NOT NULL,        -- Lifelong ID: MSD-2024-0125
  institution_id UUID NOT NULL REFERENCES institutions(id),
  class_id UUID NOT NULL REFERENCES institution_classes(id),
  
  -- Personal Information
  student_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  blood_group VARCHAR(10),
  avatar_url TEXT,
  
  -- Academic Information
  roll_number VARCHAR(50) NOT NULL,
  admission_number VARCHAR(50) NOT NULL,
  admission_date DATE NOT NULL,
  section VARCHAR(10) NOT NULL,
  previous_school TEXT,
  
  -- Guardian Information
  parent_name VARCHAR(255) NOT NULL,
  parent_phone VARCHAR(20) NOT NULL,
  parent_email VARCHAR(255),
  address TEXT NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(institution_id, roll_number, class_id),
  UNIQUE(institution_id, admission_number)
);

CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_students_email ON students(email);
```

### 11.2 Student Credentials Table

```sql
CREATE TABLE student_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
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

### 11.3 Course Enrollments Table

```sql
CREATE TABLE student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
```

### 11.4 Content Completion Table

```sql
CREATE TABLE content_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES course_content(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by VARCHAR(20) NOT NULL CHECK (completed_by IN ('self', 'officer')),
  officer_id UUID REFERENCES officers(id),
  officer_name VARCHAR(255),
  session_date DATE,
  
  UNIQUE(student_id, content_id)
);

CREATE INDEX idx_content_completions_student ON content_completions(student_id);
CREATE INDEX idx_content_completions_course ON content_completions(course_id);
```

### 11.5 Assessment Attempts Table

```sql
CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  time_taken_seconds INTEGER,
  
  -- Results
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  score DECIMAL(8, 2),
  total_marks DECIMAL(8, 2),
  percentage DECIMAL(5, 2),
  passed BOOLEAN,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
```

### 11.6 Assessment Answers Table

```sql
CREATE TABLE assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES assessment_questions(id),
  selected_option_id UUID REFERENCES assessment_options(id),
  text_answer TEXT,
  is_correct BOOLEAN,
  marks_earned DECIMAL(6, 2),
  marked_for_review BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_assessment_answers_attempt ON assessment_answers(attempt_id);
```

### 11.7 Assignment Submissions Table

```sql
CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Submission Content
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('file', 'text', 'url', 'multi_question')),
  text_content TEXT,
  url_content TEXT,
  
  -- Timing
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_late BOOLEAN DEFAULT FALSE,
  
  -- Grading
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
  score DECIMAL(8, 2),
  max_score DECIMAL(8, 2),
  grade VARCHAR(10),
  feedback TEXT,
  graded_by UUID REFERENCES officers(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  
  -- Late Penalty
  original_score DECIMAL(8, 2),
  penalty_applied DECIMAL(5, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
```

### 11.8 Submission Files Table

```sql
CREATE TABLE submission_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_submission_files_submission ON submission_files(submission_id);
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

### 11.10 Event Interests Table

```sql
CREATE TABLE event_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(255) NOT NULL,
  class_name VARCHAR(50) NOT NULL,
  section VARCHAR(10) NOT NULL,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  institution_name VARCHAR(255) NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(event_id, student_id)
);

CREATE INDEX idx_event_interests_event ON event_interests(event_id);
CREATE INDEX idx_event_interests_student ON event_interests(student_id);
CREATE INDEX idx_event_interests_institution ON event_interests(institution_id);
```

### 11.11 Student Certificates Table

```sql
CREATE TABLE student_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES certificate_templates(id),
  
  -- Activity Link
  activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('course', 'assignment', 'assessment', 'event')),
  activity_id UUID NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  
  -- Certificate Details
  institution_name VARCHAR(255) NOT NULL,
  issued_date DATE NOT NULL,
  completion_date DATE NOT NULL,
  certificate_url TEXT NOT NULL,
  verification_code VARCHAR(50) UNIQUE NOT NULL,
  qr_code_url TEXT,
  grade VARCHAR(20),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_student_certificates_student ON student_certificates(student_id);
CREATE INDEX idx_student_certificates_verification ON student_certificates(verification_code);
```

### 11.12 Gamification Points Table

```sql
CREATE TABLE gamification_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  class_rank INTEGER,
  institution_rank INTEGER,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  
  -- Points Breakdown
  points_sessions INTEGER DEFAULT 0,
  points_projects INTEGER DEFAULT 0,
  points_attendance INTEGER DEFAULT 0,
  points_assessments INTEGER DEFAULT 0,
  points_assignments INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id)
);

CREATE INDEX idx_gamification_student ON gamification_points(student_id);
CREATE INDEX idx_gamification_rank ON gamification_points(total_points DESC);
```

### 11.13 Student Badges Table

```sql
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(student_id, badge_id)
);

CREATE INDEX idx_student_badges_student ON student_badges(student_id);
```

### 11.14 Survey Responses Table

```sql
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(survey_id, student_id)
);

CREATE TABLE survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  answer_text TEXT,
  rating INTEGER,
  selected_options TEXT[],
  
  UNIQUE(response_id, question_id)
);

CREATE INDEX idx_survey_responses_student ON survey_responses(student_id);
CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
```

### 11.15 Feedback Table

```sql
CREATE TABLE student_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id),
  
  -- Feedback Content
  category VARCHAR(20) NOT NULL CHECK (category IN ('course', 'officer', 'facility', 'general')),
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  anonymous BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'resolved', 'dismissed')),
  
  -- Admin Response
  admin_response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_student ON student_feedback(student_id);
CREATE INDEX idx_feedback_institution ON student_feedback(institution_id);
CREATE INDEX idx_feedback_status ON student_feedback(status);
```

### 11.16 Class Level Access Table

```sql
CREATE TABLE class_level_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES institution_classes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  accessible_levels INTEGER[] NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(class_id, course_id)
);

CREATE INDEX idx_class_level_access_class ON class_level_access(class_id);
CREATE INDEX idx_class_level_access_course ON class_level_access(course_id);
```

---

## 12. Key Frontend Files Reference

| File Path | Purpose |
|-----------|---------|
| `src/pages/student/Dashboard.tsx` | Main student dashboard with stats and quick actions |
| `src/pages/student/Courses.tsx` | Browse and enrolled courses |
| `src/pages/student/CourseDetail.tsx` | Course content viewer with learning log |
| `src/pages/student/Assessments.tsx` | Assessment list with tabs |
| `src/pages/student/TakeAssessment.tsx` | Assessment attempt interface |
| `src/pages/student/Assignments.tsx` | Assignment list with tabs |
| `src/pages/student/AssignmentSubmission.tsx` | Assignment submission interface |
| `src/pages/student/Projects.tsx` | Student's innovation projects |
| `src/pages/student/Events.tsx` | Events with interest registration |
| `src/pages/student/Timetable.tsx` | Weekly class schedule |
| `src/pages/student/Certificates.tsx` | Earned certificates dashboard |
| `src/pages/student/Gamification.tsx` | Badges, points, leaderboard |
| `src/pages/student/Resume.tsx` | Auto-generated resume |
| `src/pages/student/FeedbackSurvey.tsx` | Surveys and feedback submission |
| `src/pages/student/AskMetova.tsx` | AI assistant chat |
| `src/pages/student/Settings.tsx` | Account settings and password |
| `src/contexts/AuthContext.tsx` | Authentication state management |
| `src/components/layout/Sidebar.tsx` | Navigation sidebar |
| `src/types/student.ts` | Student type definitions |
| `src/types/assessment.ts` | Assessment type definitions |
| `src/types/assignment-management.ts` | Assignment type definitions |
| `src/types/events.ts` | Event type definitions |
| `src/types/gamification.ts` | Gamification type definitions |
| `src/services/student.service.ts` | Student API service layer |
| `src/utils/studentTimetableHelpers.ts` | Timetable sync utilities |
| `src/utils/assessmentHelpers.ts` | Assessment utility functions |
| `src/utils/assignmentHelpers.ts` | Assignment utility functions |
| `src/data/mockStudentData.ts` | Mock student data (dev only) |

---

## 13. Security Considerations

### 13.1 Institution Isolation

```typescript
// Every student query MUST filter by institution_id
const getStudentData = async (studentId: string) => {
  const student = await db.students.findUnique({ where: { id: studentId } });
  
  // All subsequent queries use student.institution_id
  const assessments = await db.assessments.findMany({
    where: {
      publishing: {
        institution_ids: { has: student.institution_id }
      }
    }
  });
};
```

### 13.2 Class-Based Access Control

```typescript
// Assessments and Assignments filtered by class_id
const getStudentAssessments = async (institutionId: string, classId: string) => {
  return db.assessments.findMany({
    where: {
      status: 'published',
      publishing: {
        institution_ids: { has: institutionId },
        class_ids: { has: classId }  // Critical filter
      }
    }
  });
};
```

### 13.3 Level-Based Course Access

```typescript
// Students can only access course levels their class is assigned to
const getCourseContent = async (courseId: string, classId: string) => {
  const levelAccess = await db.classLevelAccess.findUnique({
    where: { class_id: classId, course_id: courseId }
  });
  
  const levels = await db.courseLevels.findMany({
    where: {
      course_id: courseId,
      level_number: { in: levelAccess.accessible_levels }
    }
  });
  
  return levels;
};
```

### 13.4 Project Membership Verification

```typescript
// Students can only view projects where they are team members
const getStudentProjects = async (studentId: string) => {
  return db.projects.findMany({
    where: {
      team_members: {
        some: { student_id: studentId }
      }
    }
  });
};
```

### 13.5 Password Security

```typescript
// Password requirements
const passwordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Password hashing
const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

// Forced password change on first login
if (user.must_change_password) {
  // Show ForcePasswordChangeDialog (non-dismissible)
  // Cannot access any route until password changed
}
```

### 13.6 JWT Token Validation

```typescript
// Every API request validates JWT
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists and is active
    const user = await db.students.findUnique({ where: { id: decoded.id } });
    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### 13.7 Rate Limiting

```typescript
// Protect assessment endpoints from abuse
const assessmentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many assessment attempts, please try again later'
});

app.post('/api/v1/assessments/:id/start-attempt', assessmentRateLimiter, ...);
```

---

## Summary

This documentation provides a complete reference for backend developers to understand the Student Dashboard system in the Meta-Innova platform. Key points:

1. **Multi-tenant architecture** with strict institution isolation
2. **Class-based filtering** for assessments, assignments, and course content
3. **Level-based course access** controlled by class-level mappings
4. **Bidirectional data sync** between System Admin, Officers, and Students
5. **Comprehensive API specifications** for all student features
6. **Robust database schema** with proper indexing and constraints
7. **Security measures** including JWT auth, password policies, and rate limiting

The frontend is built with React + TypeScript + Tailwind CSS, using localStorage for development and ready for API integration.
