# Institution/Management Dashboard - Complete System Documentation

> **Version**: 1.0.0  
> **Last Updated**: December 2024  
> **Platform**: Meta-Innova Innovation Academy Platform  
> **Purpose**: Backend development reference for Institution Management Dashboard system

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Institution Onboarding (System Admin)](#2-institution-onboarding-system-admin)
3. [Credential Setup Flow](#3-credential-setup-flow)
4. [Login & First-Time Password Change](#4-login--first-time-password-change)
5. [Management Dashboard Routing](#5-management-dashboard-routing)
6. [Sidebar Menu Configuration](#6-sidebar-menu-configuration)
7. [Dashboard Pages Breakdown](#7-dashboard-pages-breakdown)
8. [Data Flow Architecture](#8-data-flow-architecture)
9. [API Endpoints Specification](#9-api-endpoints-specification)
10. [Database Schema](#10-database-schema)
11. [Frontend Files Reference](#11-frontend-files-reference)
12. [Implementation Notes](#12-implementation-notes)

---

## 1. Architecture Overview

The Institution/Management Dashboard system follows a four-phase workflow from institution onboarding to full dashboard access.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INSTITUTION DASHBOARD WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Phase 1: Institution Onboarding                                                │
│  ┌──────────────────┐    ┌────────────────────┐    ┌─────────────────────┐     │
│  │ CEO/System Admin │───▶│ Institution Mgmt   │───▶│ localStorage +      │     │
│  │                  │    │ Page               │    │ Context State       │     │
│  └──────────────────┘    └────────────────────┘    └─────────────────────┘     │
│                                                                                  │
│  Phase 2: Credential Setup                                                       │
│  ┌──────────────────┐    ┌────────────────────┐    ┌─────────────────────┐     │
│  │ Credential Mgmt  │───▶│ Institutions Tab   │───▶│ SetPasswordDialog   │     │
│  │ Page             │    │                    │    │ + Status Update     │     │
│  └──────────────────┘    └────────────────────┘    └─────────────────────┘     │
│                                                                                  │
│  Phase 3: First Login                                                            │
│  ┌──────────────────┐    ┌────────────────────┐    ┌─────────────────────┐     │
│  │ Management Admin │───▶│ password_changed?  │───▶│ ForcePasswordChange │     │
│  │ Login            │    │ check              │    │ Dialog              │     │
│  └──────────────────┘    └────────────────────┘    └─────────────────────┘     │
│                                                                                  │
│  Phase 4: Dashboard Access                                                       │
│  ┌──────────────────┐    ┌────────────────────┐    ┌─────────────────────┐     │
│  │ Route:           │───▶│ getInstitutionBy   │───▶│ Full Dashboard      │     │
│  │ /tenant/slug/... │    │ Slug()             │    │ + Sidebar           │     │
│  └──────────────────┘    └────────────────────┘    └─────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Workflow Sequence Diagram

```
┌─────────┐          ┌──────────────┐          ┌────────────┐          ┌───────────┐
│   CEO   │          │ System Admin │          │ Management │          │ Dashboard │
│         │          │   Pages      │          │   Admin    │          │   Pages   │
└────┬────┘          └──────┬───────┘          └─────┬──────┘          └─────┬─────┘
     │                      │                        │                       │
     │ 1. Add Institution   │                        │                       │
     │─────────────────────▶│                        │                       │
     │                      │                        │                       │
     │                      │ 2. Save to localStorage│                       │
     │                      │ + InstitutionContext   │                       │
     │                      │─────────┐              │                       │
     │                      │         │              │                       │
     │                      │◀────────┘              │                       │
     │                      │                        │                       │
     │ 3. Toast: Go to      │                        │                       │
     │    Credential Mgmt   │                        │                       │
     │◀─────────────────────│                        │                       │
     │                      │                        │                       │
     │ 4. Set Password      │                        │                       │
     │─────────────────────▶│                        │                       │
     │                      │                        │                       │
     │                      │ 5. Update credential   │                       │
     │                      │    status              │                       │
     │                      │─────────┐              │                       │
     │                      │         │              │                       │
     │                      │◀────────┘              │                       │
     │                      │                        │                       │
     │                      │ 6. Send credentials    │                       │
     │                      │    to admin            │                       │
     │                      │───────────────────────▶│                       │
     │                      │                        │                       │
     │                      │                        │ 7. First Login        │
     │                      │                        │─────────────────────▶ │
     │                      │                        │                       │
     │                      │                        │ 8. Force Password     │
     │                      │                        │    Change Dialog      │
     │                      │                        │◀──────────────────────│
     │                      │                        │                       │
     │                      │                        │ 9. Set New Password   │
     │                      │                        │─────────────────────▶ │
     │                      │                        │                       │
     │                      │                        │ 10. Full Dashboard    │
     │                      │                        │     Access            │
     │                      │                        │◀──────────────────────│
     │                      │                        │                       │
```

---

## 2. Institution Onboarding (System Admin)

### 2.1 Data Model: Institution

```typescript
interface Institution {
  // Core Identity
  id: string;                          // e.g., 'inst-msd-001'
  name: string;                        // 'Modern School Vasant Vihar'
  slug: string;                        // 'modern-school-vasant-vihar'
  code: string;                        // 'MSD-VV-001'
  type: 'university' | 'college' | 'school' | 'institute';
  
  // Location & Contact
  location: string;                    // 'New Delhi, India'
  established_year: number;            // 1998
  contact_email: string;               // 'admin@modernschool.edu'
  contact_phone: string;               // '+91-11-26143245'
  
  // Admin Info
  admin_name: string;                  // 'Dr. Rajesh Kumar'
  admin_email: string;                 // 'rajesh.kumar@modernschool.edu'
  
  // Statistics
  total_students: number;              // 350
  total_faculty: number;               // 45
  
  // GPS Configuration (for attendance validation)
  gps_location?: {
    latitude: number;                  // 28.5574
    longitude: number;                 // 77.1597
    address?: string;                  // 'Sector 10, Vasant Vihar'
  };
  attendance_radius_meters?: number;   // 200 (validation radius)
  
  // Working Hours Configuration
  normal_working_hours?: number;       // 8 hours per day
  
  // Pricing Model
  pricing_model?: {
    per_student_cost: number;          // ₹500 per student
    lms_cost?: number;                 // ₹10,000 LMS subscription
    lap_setup_cost: number;            // ₹50,000 one-time setup
    monthly_recurring_cost: number;    // ₹15,000 monthly
    trainer_monthly_fee: number;       // ₹25,000 trainer cost
  };
  
  // Contract Details
  contract_type: string;               // 'premium'
  contract_start_date: string;         // '2024-01-01'
  contract_expiry_date: string;        // '2025-12-31'
  contract_value: number;              // ₹500,000
  
  // Status
  subscription_status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}
```

### 2.2 Frontend Component: InstitutionManagement.tsx

**Location**: `src/pages/system-admin/InstitutionManagement.tsx`

**Form Data Structure**:
```typescript
interface InstitutionFormData {
  name: string;
  slug: string;
  code: string;
  type: 'school' | 'college' | 'university' | 'institute';
  location: string;
  established_year: number;
  contact_email: string;
  contact_phone: string;
  admin_name: string;
  admin_email: string;
  total_students: number;
  total_faculty: number;
  
  // GPS
  gps_latitude?: string;
  gps_longitude?: string;
  gps_address?: string;
  attendance_radius?: number;
  
  // Pricing
  per_student_cost?: number;
  lms_cost?: number;
  lap_setup_cost?: number;
  monthly_recurring_cost?: number;
  trainer_monthly_fee?: number;
  
  // Contract
  contract_type: string;
  contract_start_date: string;
  contract_expiry_date: string;
  contract_value: number;
}
```

**Submission Handler**:
```typescript
const handleAddInstitution = async () => {
  // 1. Validate form data
  if (!validateFormData(formData)) {
    toast.error('Please fill all required fields');
    return;
  }
  
  // 2. Create institution object
  const newInstitution: Institution = {
    id: generateInstitutionId(formData.code), // e.g., 'inst-msd-001'
    ...formData,
    gps_location: formData.gps_latitude ? {
      latitude: parseFloat(formData.gps_latitude),
      longitude: parseFloat(formData.gps_longitude),
      address: formData.gps_address
    } : undefined,
    pricing_model: {
      per_student_cost: formData.per_student_cost || 0,
      lms_cost: formData.lms_cost,
      lap_setup_cost: formData.lap_setup_cost || 0,
      monthly_recurring_cost: formData.monthly_recurring_cost || 0,
      trainer_monthly_fee: formData.trainer_monthly_fee || 0
    },
    subscription_status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // 3. Add to context (persists to localStorage)
  addInstitution(newInstitution);
  
  // 4. Show success toast with CTA
  toast.success('Institution added successfully', {
    description: 'Set up credentials for the institution admin',
    action: {
      label: 'Go to Credential Management',
      onClick: () => navigate('/system-admin/credential-management')
    }
  });
  
  // 5. Reset form
  resetFormData();
};
```

### 2.3 Institution ID Generation

```typescript
// ID Pattern: inst-{code}-{sequence}
function generateInstitutionId(code: string): string {
  const prefix = 'inst';
  const codeSlug = code.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 3);
  const sequence = '001'; // Auto-increment in backend
  return `${prefix}-${codeSlug}-${sequence}`;
}

// Examples:
// Modern School Vasant Vihar → inst-msd-001
// Kikani Global Academy → inst-kga-001
```

---

## 3. Credential Setup Flow

### 3.1 Component: CredentialManagement.tsx

**Location**: `src/pages/system-admin/CredentialManagement.tsx`

**Tab Structure**:
| Tab | Purpose | Data Source |
|-----|---------|-------------|
| Meta Employees | Internal staff credentials | `loadMetaStaff()` from localStorage |
| Institutions | Institution admin credentials | `mockInstitutions` + `credentialStatus` |
| Students | Student credentials by institution | `getStudentsByInstitution()` |

### 3.2 Institution Credential Status

```typescript
interface CredentialStatus {
  institutionId: string;
  status: 'configured' | 'pending';
  configuredAt?: string;
  configuredBy?: string;
}

// localStorage key: 'credentialStatus'
// Structure: Record<institutionId, CredentialStatus>

// Load credential status
function loadCredentialStatus(): Record<string, CredentialStatus> {
  const stored = localStorage.getItem('credentialStatus');
  return stored ? JSON.parse(stored) : {};
}

// Save credential status
function saveCredentialStatus(status: Record<string, CredentialStatus>): void {
  localStorage.setItem('credentialStatus', JSON.stringify(status));
}
```

### 3.3 SetPasswordDialog Component

**Location**: `src/components/auth/SetPasswordDialog.tsx`

**Props**:
```typescript
interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email: string;
    type: 'meta_staff' | 'officer' | 'institution' | 'student';
  };
  onSuccess: (password: string) => void;
}
```

**Password Validation Schema (Zod)**:
```typescript
const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
});
```

**Password Generation**:
```typescript
function generateSecurePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  return shuffleString(password);
}
```

### 3.4 Credential Setup Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREDENTIAL SETUP FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Navigate to Credential Management                            │
│     └── Click "Institutions" tab                                 │
│                                                                  │
│  2. Find Institution                                             │
│     └── Status Badge: "Pending Setup" (Orange)                   │
│     └── Status Badge: "Configured" (Green)                       │
│                                                                  │
│  3. Click "Set Up Credentials" button                            │
│     └── Opens SetPasswordDialog                                  │
│                                                                  │
│  4. In SetPasswordDialog:                                        │
│     ├── Option A: Click "Generate Password" (auto-generate)      │
│     └── Option B: Type custom password manually                  │
│                                                                  │
│  5. Password Validation:                                         │
│     ├── ✓ At least 8 characters                                  │
│     ├── ✓ At least 1 uppercase letter                           │
│     ├── ✓ At least 1 lowercase letter                           │
│     ├── ✓ At least 1 number                                     │
│     └── ✓ At least 1 special character                          │
│                                                                  │
│  6. Click "Set Password"                                         │
│     └── handleSetPasswordSuccess() called                        │
│                                                                  │
│  7. Update Credential Status:                                    │
│     ├── credentialStatus[institutionId] = {                      │
│     │     status: 'configured',                                  │
│     │     configuredAt: new Date().toISOString(),               │
│     │     configuredBy: currentUser.id                          │
│     │   }                                                        │
│     └── Save to localStorage                                     │
│                                                                  │
│  8. Success Toast + Badge Update                                 │
│     └── Badge changes to "Configured" (Green)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Login & First-Time Password Change

### 4.1 Login Component: Login.tsx

**Location**: `src/pages/Login.tsx`

**Authentication Flow**:
```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    // 1. Authenticate user
    const response = await mockAuthService.login(email, password);
    
    if (!response.success) {
      toast.error('Invalid credentials');
      return;
    }
    
    // 2. Store user data
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // 3. Check if management user needs password change
    if (response.user.role === 'management' && !response.user.password_changed) {
      setShowForcePasswordChange(true);
      setPendingUser(response.user);
      return;
    }
    
    // 4. Navigate to appropriate dashboard
    navigateToDashboard(response.user);
    
  } catch (error) {
    toast.error('Login failed');
  }
};
```

### 4.2 ForcePasswordChangeDialog Component

**Location**: `src/components/auth/ForcePasswordChangeDialog.tsx`

**Features**:
- **Non-dismissible**: Cannot close via X button, outside click, or ESC key
- **Three input fields**: Current password, new password, confirm password
- **Strength validation**: Same Zod schema as SetPasswordDialog
- **Visual indicators**: Password strength meter, requirements checklist

**Props**:
```typescript
interface ForcePasswordChangeDialogProps {
  open: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onPasswordChanged: () => void;
}
```

**Handler**:
```typescript
const handlePasswordChange = async () => {
  // 1. Validate current password
  const isCurrentValid = await passwordService.verifyPassword(
    user.id, 
    currentPassword
  );
  
  if (!isCurrentValid) {
    toast.error('Current password is incorrect');
    return;
  }
  
  // 2. Validate new password matches confirmation
  if (newPassword !== confirmPassword) {
    toast.error('Passwords do not match');
    return;
  }
  
  // 3. Validate password strength
  const validation = passwordSchema.safeParse({ password: newPassword });
  if (!validation.success) {
    toast.error('Password does not meet requirements');
    return;
  }
  
  // 4. Update password
  await passwordService.setUserPassword(user.id, user.role, newPassword);
  
  // 5. Update user record
  const updatedUser = {
    ...user,
    password_changed: true,
    must_change_password: false,
    password_changed_at: new Date().toISOString()
  };
  localStorage.setItem('user', JSON.stringify(updatedUser));
  
  // 6. Callback to complete login
  onPasswordChanged();
};
```

### 4.3 Post-Login Navigation

```typescript
const navigateToDashboard = (user: User) => {
  switch (user.role) {
    case 'system_admin':
      navigate('/system-admin/dashboard');
      break;
      
    case 'management':
      // Use tenant slug from user or localStorage
      const tenant = JSON.parse(localStorage.getItem('tenant') || '{}');
      navigate(`/tenant/${tenant.slug}/management/dashboard`);
      break;
      
    case 'officer':
      navigate('/officer/dashboard');
      break;
      
    case 'student':
      navigate('/students/dashboard');
      break;
      
    default:
      navigate('/');
  }
};
```

---

## 5. Management Dashboard Routing

### 5.1 URL Structure

```
/tenant/{institution-slug}/management/{page}

Examples:
/tenant/modern-school-vasant-vihar/management/dashboard
/tenant/modern-school-vasant-vihar/management/teachers
/tenant/modern-school-vasant-vihar/management/students
/tenant/kikani-global-academy/management/dashboard
```

### 5.2 Route Configuration (App.tsx)

```typescript
// Management Routes
<Route path="/tenant/:tenantId/management">
  <Route path="dashboard" element={<ManagementDashboard />} />
  <Route path="teachers" element={<ManagementTeachers />} />
  <Route path="students" element={<ManagementStudents />} />
  <Route path="officers" element={<ManagementOfficers />} />
  <Route path="courses-sessions" element={<CoursesAndSessions />} />
  <Route path="inventory-purchase" element={<InventoryAndPurchase />} />
  <Route path="projects-certificates" element={<ProjectsAndCertificates />} />
  <Route path="events" element={<ManagementEvents />} />
  <Route path="reports" element={<ManagementReports />} />
  <Route path="attendance" element={<ManagementAttendance />} />
  <Route path="settings" element={<ManagementSettings />} />
</Route>
```

### 5.3 Route Parameters

```typescript
// In management page components
import { useParams } from 'react-router-dom';

const ManagementDashboard = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  
  // tenantId is the institution slug
  // e.g., 'modern-school-vasant-vihar'
  
  // Load institution data
  const institution = getInstitutionBySlug(tenantId);
  
  if (!institution) {
    return <NotFound />;
  }
  
  return (
    <Layout>
      <InstitutionHeader institution={institution} />
      {/* Dashboard content */}
    </Layout>
  );
};
```

---

## 6. Sidebar Menu Configuration

### 6.1 Menu Items for Management Role

| Order | Label | Icon | Path | Component File |
|-------|-------|------|------|----------------|
| 1 | Dashboard | LayoutDashboard | /dashboard | Dashboard.tsx |
| 2 | Teachers | Users | /teachers | Teachers.tsx |
| 3 | Students | GraduationCap | /students | Students.tsx |
| 4 | Innovation Officers | UserCheck | /officers | Officers.tsx |
| 5 | Courses & Sessions | BookOpen | /courses-sessions | CoursesAndSessions.tsx |
| 6 | Inventory & Purchase | Package | /inventory-purchase | InventoryAndPurchase.tsx |
| 7 | Projects & Certificates | Target | /projects-certificates | ProjectsAndCertificates.tsx |
| 8 | Events & Activities | Trophy | /events | Events.tsx |
| 9 | Reports | FileText | /reports | Reports.tsx |
| 10 | Attendance | Clock | /attendance | Attendance.tsx |
| 11 | Settings | Settings | /settings | Settings.tsx |

### 6.2 Sidebar Path Resolution (Sidebar.tsx)

```typescript
const getFullPath = (path: string): string => {
  // For management role, prepend tenant-specific prefix
  if (user?.role === 'management' && user?.tenant_id) {
    const tenantStr = localStorage.getItem('tenant');
    const tenant = tenantStr ? JSON.parse(tenantStr) : null;
    const tenantSlug = tenant?.slug || 'default';
    return `/tenant/${tenantSlug}/management${path}`;
  }
  
  // For other roles, use role-specific prefix
  const rolePrefix = getRolePrefix(user?.role);
  return `${rolePrefix}${path}`;
};

// Example outputs for management role:
// getFullPath('/dashboard') → '/tenant/modern-school-vasant-vihar/management/dashboard'
// getFullPath('/teachers') → '/tenant/modern-school-vasant-vihar/management/teachers'
```

### 6.3 Menu Configuration Data Structure

```typescript
interface MenuItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: number;          // Notification count
  feature?: string;        // For permission checking
  subItems?: MenuItem[];   // Nested menu items
}

const managementMenuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Teachers', icon: Users, path: '/teachers' },
  { label: 'Students', icon: GraduationCap, path: '/students' },
  { label: 'Innovation Officers', icon: UserCheck, path: '/officers' },
  { label: 'Courses & Sessions', icon: BookOpen, path: '/courses-sessions' },
  { label: 'Inventory & Purchase', icon: Package, path: '/inventory-purchase' },
  { label: 'Projects & Certificates', icon: Target, path: '/projects-certificates' },
  { label: 'Events & Activities', icon: Trophy, path: '/events' },
  { label: 'Reports', icon: FileText, path: '/reports' },
  { label: 'Attendance', icon: Clock, path: '/attendance' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];
```

---

## 7. Dashboard Pages Breakdown

### 7.1 Dashboard (Dashboard.tsx)

**Purpose**: Value proposition showcase for institutional decision-makers (CEO/Principal level)

**Location**: `src/pages/management/Dashboard.tsx`

**Data Sources**:
- `getInstitutionBySlug(slug)` - Institution details
- `getInstitutionOfficers(institutionId)` - Assigned officers
- `getDepartmentMetrics()` - Department performance data

**Sections**:

| Section | Description | Components |
|---------|-------------|------------|
| Institution Header | Name, location, officers, academic year | `InstitutionHeader` |
| Platform Value Metrics | Engagement rate, completion rate, projects, connections | `Card` with statistics |
| ROI Highlights | Time saved, improved outcomes, satisfaction, compliance | `Card` with metrics |
| Critical Actions | Pending approvals, deadlines, alerts | `CriticalActionsCard` |
| Platform Features | LMS, Engagement, Operations, Analytics categories | Feature grid |
| Impact Metrics | Projects completed, events, SDG goals, employability | Impact cards |
| Competitive Advantages | Platform consolidation, STEM focus, cost reduction | Advantage list |
| Department Performance | Progress bars per department | Performance cards |
| Recent Activities | Timeline of recent events | Activity feed |
| System Alerts | Important notifications | Alert cards |

**Key UI Components**:
```typescript
// InstitutionHeader.tsx
interface InstitutionHeaderProps {
  institution: InstitutionDetails;
  officers?: OfficerAssignment[];
  academicYear?: string;
}

// CriticalActionsCard.tsx
interface CriticalAction {
  id: string;
  type: 'purchase' | 'payroll' | 'deadline' | 'approval';
  title: string;
  description: string;
  count: number;
  urgency: 'high' | 'medium' | 'low';
  deadline?: string;
  amount?: number;
  link: string;
}
```

---

### 7.2 Teachers (Teachers.tsx)

**Purpose**: Complete teacher management with CRUD operations

**Location**: `src/pages/management/Teachers.tsx`

**Data Sources**:
- `mockTeachers` array filtered by institution
- `localStorage` for teacher data persistence

**Features**:
| Feature | Description |
|---------|-------------|
| List View | Table with search, filter, pagination |
| Add Teacher | Dialog form with validation |
| View Details | Read-only detail dialog |
| Edit Teacher | Pre-filled form dialog |
| Delete Teacher | Confirmation dialog |
| Timetable Tab | Teacher schedule management |

**Data Model**:
```typescript
interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  subjects: string[];
  classes: string[];
  qualification: string;
  experience_years: number;
  join_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  institution_id: string;
}
```

**Components**:
- `TeacherDetailsDialog` - View teacher information
- `AddEditTeacherDialog` - Create/edit teacher form
- `DeleteTeacherDialog` - Confirm deletion
- `TimetableManagementTab` - Schedule view

---

### 7.3 Students (Students.tsx)

**Purpose**: View institution students (read-only for management)

**Location**: `src/pages/management/Students.tsx`

**Data Sources**:
- `getStudentsByInstitution(institutionId)` from localStorage

**Features**:
| Feature | Description |
|---------|-------------|
| Summary Cards | Total, active, gender distribution, classes |
| Search | By name, roll number, admission number |
| Filters | Class, section, gender, status |
| Export | CSV download |
| View Details | Read-only student dialog |

**Note**: Adding/removing students is managed by System Admin, not institution management.

**Data Model**:
```typescript
interface Student {
  id: string;                    // 'MSD-2024-0001'
  name: string;
  email: string;
  phone: string;
  class: string;                 // 'Grade 8'
  section: string;               // 'A'
  roll_number: string;
  admission_number: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  gender: 'male' | 'female' | 'other';
  date_of_birth: string;
  address: string;
  status: 'active' | 'inactive' | 'graduated';
  institution_id: string;
  enrolled_courses: string[];
  created_at: string;
}
```

---

### 7.4 Innovation Officers (Officers.tsx)

**Purpose**: View assigned innovation officers and their activities

**Location**: `src/pages/management/Officers.tsx`

**Data Sources**:
- `getInstitutionOfficers(institutionId)` - Officers assigned to institution
- `loadOfficers()` - Full officer details

**Features**:
| Feature | Description |
|---------|-------------|
| Officer Cards | Profile, department, status |
| Today's Attendance | Check-in/out status with GPS |
| Course Assignments | Courses officer is teaching |
| Session Count | Sessions conducted this month |
| View Schedule | Officer timetable dialog |

**Data Model**:
```typescript
interface OfficerAssignment {
  id: string;
  officer_id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;           // 'Innovation Officer' | 'Sr. Innovation Officer'
  department: string;
  institution_id: string;
  assigned_date: string;
  courses_assigned: number;
  students_handled: number;
  status: 'active' | 'on_leave' | 'inactive';
}
```

**Components**:
- `OfficerDetailsDialog` - Full officer profile
- `OfficerScheduleDialog` - Weekly timetable view

---

### 7.5 Courses & Sessions (CoursesAndSessions.tsx)

**Purpose**: View STEM course catalog and class schedules

**Location**: `src/pages/management/CoursesAndSessions.tsx`

**Tabs**:
| Tab | Component | Description |
|-----|-----------|-------------|
| Course Catalog | `ManagementCoursesView` | All 23 STEM courses with details |
| Class Schedule | `InstitutionTimetableView` | Officer timetables per class |

**Course Categories**:
1. Core STEM & Technology (9 courses)
2. Design, Making & Innovation (3 courses)
3. Sustainability & Social Sciences (4 courses)
4. Digital Media & Communication (2 courses)
5. Future Skills & Career Enablement (5 courses)

**Timetable Data Flow**:
```
System Admin configures periods → 
Institution timetable assignments created → 
syncInstitutionToOfficerTimetable() → 
Officer timetables generated → 
InstitutionTimetableView displays
```

---

### 7.6 Inventory & Purchase (InventoryAndPurchase.tsx)

**Purpose**: Lab inventory oversight and purchase request approval

**Location**: `src/pages/management/InventoryAndPurchase.tsx`

**Data Sources**:
- `loadInventoryItems()` - Lab components
- `loadPurchaseRequests()` - Purchase workflow
- `loadAuditRecords()` - Officer audit submissions

**Tabs**:
| Tab | Description |
|-----|-------------|
| Stock Overview | Read-only inventory view with quantities |
| Purchase Requests | Approve/reject workflow (only pre-approved by System Admin) |
| Audit Reports | View officer audit submissions |

**Purchase Request Workflow**:
```
┌──────────────────────────────────────────────────────────────────┐
│                   PURCHASE REQUEST WORKFLOW                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Innovation Officer creates purchase request                   │
│     └── Status: 'pending_admin_approval'                         │
│                                                                   │
│  2. System Admin (CEO/MD/AGM) reviews                            │
│     ├── Approve → Status: 'pending_institution_approval'         │
│     └── Reject → Status: 'rejected_by_admin'                     │
│                                                                   │
│  3. Institution Management reviews (pre-approved only)           │
│     ├── Approve → Status: 'approved'                             │
│     └── Reject → Status: 'rejected_by_institution'               │
│                                                                   │
│  4. Fulfillment                                                   │
│     └── Status: 'fulfilled'                                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Data Model**:
```typescript
interface PurchaseRequest {
  id: string;
  institution_id: string;
  officer_id: string;
  officer_name: string;
  items: PurchaseItem[];
  total_amount: number;
  justification: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: PurchaseRequestStatus;
  admin_approved_by?: string;
  admin_approved_at?: string;
  institution_approved_by?: string;
  institution_approved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

type PurchaseRequestStatus = 
  | 'pending_admin_approval'
  | 'rejected_by_admin'
  | 'pending_institution_approval'
  | 'rejected_by_institution'
  | 'approved'
  | 'fulfilled';
```

---

### 7.7 Projects & Certificates (ProjectsAndCertificates.tsx)

**Purpose**: View innovation projects managed by officers

**Location**: `src/pages/management/ProjectsAndCertificates.tsx`

**Data Sources**:
- `getProjectsByInstitution(institutionId)` - All institution projects
- `getShowcaseProjects(institutionId)` - Award-winning projects

**Tabs**:
| Tab | Description |
|-----|-------------|
| Project Registry | All projects with status, progress, SDG goals |
| Project Gallery | Showcase/award-winning projects |

**Data Model**:
```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  institution_id: string;
  officer_id: string;
  team_leader: ProjectMember;
  team_members: ProjectMember[];
  status: 'planning' | 'in_progress' | 'completed' | 'showcased';
  progress: number;              // 0-100
  sdg_goals: number[];           // [1, 4, 9] = SDG 1, 4, 9
  start_date: string;
  end_date?: string;
  events_assigned: string[];     // Event IDs
  created_at: string;
}

interface ProjectMember {
  student_id: string;
  name: string;
  class: string;
  section: string;
  role: 'leader' | 'member';
}
```

**Components**:
- `ProjectDetailsDialog` - Full project information
- `SDGBadges` - UN SDG goal indicators

---

### 7.8 Events (Events.tsx)

**Purpose**: View events and institution participation

**Location**: `src/pages/management/Events.tsx`

**Tabs**:
| Tab | Component | Description |
|-----|-----------|-------------|
| Events View | `EventsViewTab` | All platform events |
| Institution Participation | `InstitutionParticipationTab` | Students who expressed interest |

**Data Model**:
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  type: 'competition' | 'workshop' | 'seminar' | 'exhibition' | 'hackathon';
  date: string;
  end_date?: string;
  location: string;
  is_virtual: boolean;
  registration_deadline: string;
  max_participants?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
}

interface EventInterest {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string;
  class: string;
  section: string;
  institution_id: string;
  expressed_at: string;
}
```

---

### 7.9 Reports (Reports.tsx)

**Purpose**: Analytics, reports generation, and data export

**Location**: `src/pages/management/Reports.tsx`

**Tabs**:
| Tab | Description |
|-----|-------------|
| Performance Analytics | Metrics with period selector (weekly/monthly/quarterly) |
| Monthly Reports | Generate and download institutional reports |
| Export Data | PDF/CSV/Excel export options |

**Report Types**:
- Student Performance Report
- Attendance Summary Report
- Course Progress Report
- Project Status Report
- Event Participation Report

**Export Formats**:
- PDF (formatted report)
- CSV (raw data)
- Excel (formatted spreadsheet)

---

### 7.10 Attendance (Attendance.tsx)

**Purpose**: View attendance for officers, students, and teachers

**Location**: `src/pages/management/Attendance.tsx`

**Tabs**:
| Tab | Component | Description |
|-----|-----------|-------------|
| Officer Attendance | `OfficerAttendanceTab` | GPS-validated check-in/out |
| Student Attendance | `StudentAttendanceTab` | Class-wise attendance |
| Teacher Attendance | `TeacherAttendanceTab` | Teacher presence tracking |

**Officer Attendance Data**:
```typescript
interface AttendanceRecord {
  id: string;
  user_id: string;
  user_type: 'officer' | 'student' | 'teacher';
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_location?: {
    latitude: number;
    longitude: number;
  };
  check_out_location?: {
    latitude: number;
    longitude: number;
  };
  location_validated: boolean;
  total_hours?: number;
  overtime_hours?: number;
  status: 'present' | 'absent' | 'leave' | 'half_day';
  institution_id: string;
}
```

---

### 7.11 Settings (Settings.tsx)

**Purpose**: Account security and institution configuration

**Location**: `src/pages/management/Settings.tsx`

**Tabs**:
| Tab | Description |
|-----|-------------|
| Account Security | Password management, 2FA settings |
| Institution Profile | Name, code, contact info updates |
| Branding | Certificate templates, colors, signatures |
| Integrations | Email/SMS notifications, SMTP settings |

**Password Change Component**:
```typescript
// Uses same passwordSchema validation as other password components
const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
  // 1. Verify current password
  const isValid = await passwordService.verifyPassword(user.id, currentPassword);
  if (!isValid) {
    toast.error('Current password is incorrect');
    return;
  }
  
  // 2. Validate new password
  const validation = passwordSchema.safeParse({ password: newPassword });
  if (!validation.success) {
    toast.error('New password does not meet requirements');
    return;
  }
  
  // 3. Update password
  await passwordService.setUserPassword(user.id, user.role, newPassword);
  
  // 4. Log password change
  await passwordService.logPasswordChange(user.id, 'user_initiated');
  
  toast.success('Password updated successfully');
};
```

---

## 8. Data Flow Architecture

### 8.1 Institution Data Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LOADING FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  URL: /tenant/{slug}/management/{page}                          │
│                │                                                 │
│                ▼                                                 │
│  ┌─────────────────────────┐                                    │
│  │ useParams()             │                                    │
│  │ Extract: tenantId=slug  │                                    │
│  └───────────┬─────────────┘                                    │
│              │                                                   │
│              ▼                                                   │
│  ┌─────────────────────────┐                                    │
│  │ getInstitutionBySlug()  │                                    │
│  │ Source: mockInstitution │                                    │
│  │         Data.ts         │                                    │
│  └───────────┬─────────────┘                                    │
│              │                                                   │
│              ▼                                                   │
│  ┌─────────────────────────┐     ┌─────────────────────────┐   │
│  │ InstitutionDetails      │────▶│ InstitutionHeader       │   │
│  │ {                       │     │ Component               │   │
│  │   id, name, slug,       │     └─────────────────────────┘   │
│  │   location, officers,   │                                    │
│  │   students, ...         │     ┌─────────────────────────┐   │
│  │ }                       │────▶│ Page-specific           │   │
│  └─────────────────────────┘     │ Data Fetching           │   │
│                                  └───────────┬─────────────┘   │
│                                              │                  │
│                                              ▼                  │
│                                  ┌─────────────────────────┐   │
│                                  │ getStudentsByInstitution│   │
│                                  │ getInstitutionOfficers  │   │
│                                  │ getProjectsByInstitution│   │
│                                  │ etc.                    │   │
│                                  └─────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Key Data Loading Functions

```typescript
// Institution Details
getInstitutionBySlug(slug: string): InstitutionDetails | undefined
getInstitutionById(id: string): InstitutionDetails | undefined

// Students
getStudentsByInstitution(institutionId: string): Student[]

// Officers
getInstitutionOfficers(institutionId: string): OfficerAssignment[]
loadOfficers(): OfficerDetails[]

// Inventory
getInventoryByInstitution(institutionId: string): InventoryItem[]
getPurchaseRequestsByInstitution(institutionId: string): PurchaseRequest[]
getAuditRecordsByInstitution(institutionId: string): AuditRecord[]

// Projects
getProjectsByInstitution(institutionId: string): Project[]
getShowcaseProjects(institutionId: string): Project[]

// Events
getEventInterestsByInstitution(institutionId: string): EventInterest[]

// Timetables
getStudentTimetable(institutionId: string, classId: string): TimetableSlot[]
```

### 8.3 Bidirectional Synchronization Pattern

```typescript
// Pattern used across all features for localStorage persistence
// Designed for easy backend API migration

// Load function - reads from localStorage
function loadData<T>(key: string, initialData: T[]): T[] {
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data on first load
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
}

// Save function - writes to localStorage
function saveData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Usage example
const students = loadData('institution_students', mockStudents);
saveData('institution_students', [...students, newStudent]);

// Backend migration: Replace localStorage calls with API calls
// loadData → GET /api/v1/students?institution_id=xxx
// saveData → POST /api/v1/students
```

---

## 9. API Endpoints Specification

### 9.1 Institution Management APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ INSTITUTION MANAGEMENT APIs                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ POST   /api/v1/institutions                                                  │
│        Description: Create new institution                                   │
│        Request Body: InstitutionCreateRequest                               │
│        Response: { success: true, data: Institution }                       │
│                                                                              │
│ GET    /api/v1/institutions                                                  │
│        Description: List all institutions                                    │
│        Query Params: ?status=active&page=1&limit=10                         │
│        Response: { success: true, data: Institution[], pagination: {...} }  │
│                                                                              │
│ GET    /api/v1/institutions/:id                                              │
│        Description: Get institution details                                  │
│        Response: { success: true, data: Institution }                       │
│                                                                              │
│ PUT    /api/v1/institutions/:id                                              │
│        Description: Update institution                                       │
│        Request Body: InstitutionUpdateRequest                               │
│        Response: { success: true, data: Institution }                       │
│                                                                              │
│ DELETE /api/v1/institutions/:id                                              │
│        Description: Delete institution (soft delete)                         │
│        Response: { success: true }                                          │
│                                                                              │
│ GET    /api/v1/institutions/:id/students                                     │
│        Description: Get students by institution                              │
│        Query Params: ?class=8&section=A&status=active                       │
│        Response: { success: true, data: Student[], pagination: {...} }      │
│                                                                              │
│ GET    /api/v1/institutions/:id/officers                                     │
│        Description: Get assigned officers                                    │
│        Response: { success: true, data: OfficerAssignment[] }               │
│                                                                              │
│ GET    /api/v1/institutions/:id/inventory                                    │
│        Description: Get institution inventory                                │
│        Response: { success: true, data: InventoryItem[] }                   │
│                                                                              │
│ GET    /api/v1/institutions/:id/projects                                     │
│        Description: Get institution projects                                 │
│        Query Params: ?status=in_progress                                    │
│        Response: { success: true, data: Project[] }                         │
│                                                                              │
│ GET    /api/v1/institutions/:id/analytics                                    │
│        Description: Get institution analytics                                │
│        Query Params: ?period=monthly                                        │
│        Response: { success: true, data: InstitutionAnalytics }              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Authentication APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AUTHENTICATION APIs                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ POST   /api/v1/auth/login                                                    │
│        Description: User login                                               │
│        Request Body: { email: string, password: string }                    │
│        Response: {                                                          │
│          success: true,                                                     │
│          data: {                                                            │
│            user: User,                                                      │
│            token: string,                                                   │
│            must_change_password: boolean                                    │
│          }                                                                  │
│        }                                                                    │
│                                                                              │
│ POST   /api/v1/auth/logout                                                   │
│        Description: User logout                                              │
│        Headers: Authorization: Bearer {token}                               │
│        Response: { success: true }                                          │
│                                                                              │
│ POST   /api/v1/auth/force-change-password                                    │
│        Description: Force password change on first login                     │
│        Request Body: {                                                      │
│          current_password: string,                                          │
│          new_password: string                                               │
│        }                                                                    │
│        Response: { success: true, data: { token: string } }                 │
│                                                                              │
│ POST   /api/v1/auth/change-password                                          │
│        Description: User-initiated password change                           │
│        Request Body: {                                                      │
│          current_password: string,                                          │
│          new_password: string                                               │
│        }                                                                    │
│        Response: { success: true }                                          │
│                                                                              │
│ POST   /api/v1/auth/forgot-password                                          │
│        Description: Request password reset link                              │
│        Request Body: { email: string }                                      │
│        Response: { success: true, message: 'Reset link sent' }              │
│                                                                              │
│ POST   /api/v1/auth/reset-password                                           │
│        Description: Reset password with token                                │
│        Request Body: { token: string, new_password: string }                │
│        Response: { success: true }                                          │
│                                                                              │
│ GET    /api/v1/auth/me                                                       │
│        Description: Get current user                                         │
│        Headers: Authorization: Bearer {token}                               │
│        Response: { success: true, data: User }                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.3 Credential Management APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CREDENTIAL MANAGEMENT APIs                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ GET    /api/v1/credentials/institutions                                      │
│        Description: List institutions with credential status                 │
│        Response: {                                                          │
│          success: true,                                                     │
│          data: [{                                                           │
│            institution: Institution,                                        │
│            credential_status: 'configured' | 'pending',                     │
│            configured_at?: string,                                          │
│            configured_by?: string                                           │
│          }]                                                                 │
│        }                                                                    │
│                                                                              │
│ POST   /api/v1/credentials/set-password                                      │
│        Description: Set user password (admin action)                         │
│        Request Body: {                                                      │
│          user_id: string,                                                   │
│          user_type: 'meta_staff' | 'officer' | 'institution' | 'student',  │
│          password: string                                                   │
│        }                                                                    │
│        Response: { success: true }                                          │
│                                                                              │
│ POST   /api/v1/credentials/generate-password                                 │
│        Description: Auto-generate secure password                            │
│        Response: { success: true, data: { password: string } }              │
│                                                                              │
│ POST   /api/v1/credentials/send-reset-link                                   │
│        Description: Send password reset email                                │
│        Request Body: {                                                      │
│          user_id: string,                                                   │
│          user_type: string,                                                 │
│          email: string                                                      │
│        }                                                                    │
│        Response: { success: true, message: 'Reset link sent' }              │
│                                                                              │
│ GET    /api/v1/credentials/audit-log                                         │
│        Description: Get password change audit log                            │
│        Query Params: ?user_id=xxx&from_date=xxx&to_date=xxx                 │
│        Response: { success: true, data: PasswordChangeLog[] }               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.4 Management Dashboard APIs

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MANAGEMENT DASHBOARD APIs                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ Teachers                                                                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/teachers                            │
│ POST   /api/v1/management/:institutionId/teachers                            │
│ GET    /api/v1/management/:institutionId/teachers/:id                        │
│ PUT    /api/v1/management/:institutionId/teachers/:id                        │
│ DELETE /api/v1/management/:institutionId/teachers/:id                        │
│                                                                              │
│ Students (Read-only for management)                                          │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/students                            │
│ GET    /api/v1/management/:institutionId/students/:id                        │
│ GET    /api/v1/management/:institutionId/students/export                     │
│                                                                              │
│ Officers                                                                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/officers                            │
│ GET    /api/v1/management/:institutionId/officers/:id                        │
│ GET    /api/v1/management/:institutionId/officers/:id/schedule               │
│ GET    /api/v1/management/:institutionId/officers/:id/attendance             │
│                                                                              │
│ Inventory & Purchase                                                         │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/inventory                           │
│ GET    /api/v1/management/:institutionId/purchase-requests                   │
│ PUT    /api/v1/management/:institutionId/purchase-requests/:id/approve       │
│ PUT    /api/v1/management/:institutionId/purchase-requests/:id/reject        │
│ GET    /api/v1/management/:institutionId/audit-records                       │
│                                                                              │
│ Projects                                                                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/projects                            │
│ GET    /api/v1/management/:institutionId/projects/:id                        │
│ GET    /api/v1/management/:institutionId/projects/showcase                   │
│                                                                              │
│ Events                                                                       │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/events                              │
│ GET    /api/v1/management/:institutionId/events/:id/participants             │
│                                                                              │
│ Reports & Analytics                                                          │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/analytics                           │
│ GET    /api/v1/management/:institutionId/reports                             │
│ POST   /api/v1/management/:institutionId/reports/generate                    │
│ GET    /api/v1/management/:institutionId/reports/:id/download                │
│                                                                              │
│ Attendance                                                                   │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/attendance/officers                 │
│ GET    /api/v1/management/:institutionId/attendance/students                 │
│ GET    /api/v1/management/:institutionId/attendance/teachers                 │
│                                                                              │
│ Settings                                                                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ GET    /api/v1/management/:institutionId/settings                            │
│ PUT    /api/v1/management/:institutionId/settings                            │
│ PUT    /api/v1/management/:institutionId/settings/branding                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Database Schema

### 10.1 Institutions Table

```sql
-- Main institutions table
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  code VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('school', 'college', 'university', 'institute')),
  location TEXT,
  established_year INTEGER,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  admin_name VARCHAR(255),
  admin_email VARCHAR(255),
  total_students INTEGER DEFAULT 0,
  total_faculty INTEGER DEFAULT 0,
  
  -- GPS Configuration
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  gps_address TEXT,
  attendance_radius_meters INTEGER DEFAULT 200,
  normal_working_hours INTEGER DEFAULT 8,
  
  -- Contract Details
  contract_type VARCHAR(100),
  contract_start_date DATE,
  contract_expiry_date DATE,
  contract_value DECIMAL(12, 2),
  
  -- Status
  subscription_status VARCHAR(50) DEFAULT 'active' 
    CHECK (subscription_status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- Indexes
CREATE INDEX idx_institutions_slug ON institutions(slug);
CREATE INDEX idx_institutions_status ON institutions(subscription_status);
CREATE INDEX idx_institutions_type ON institutions(type);
```

### 10.2 Institution Pricing Table

```sql
-- Separate table for pricing model (one-to-one with institutions)
CREATE TABLE institution_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  per_student_cost DECIMAL(10, 2) DEFAULT 0,
  lms_cost DECIMAL(10, 2) DEFAULT 0,
  lap_setup_cost DECIMAL(10, 2) DEFAULT 0,
  monthly_recurring_cost DECIMAL(10, 2) DEFAULT 0,
  trainer_monthly_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(institution_id)
);

-- Index
CREATE INDEX idx_institution_pricing_institution ON institution_pricing(institution_id);
```

### 10.3 Institution Admins Table

```sql
-- Management users for each institution
CREATE TABLE institution_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'management',
  designation VARCHAR(100),
  
  -- Password status
  password_changed BOOLEAN DEFAULT FALSE,
  must_change_password BOOLEAN DEFAULT TRUE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(institution_id, email)
);

-- Indexes
CREATE INDEX idx_institution_admins_institution ON institution_admins(institution_id);
CREATE INDEX idx_institution_admins_email ON institution_admins(email);
CREATE INDEX idx_institution_admins_user ON institution_admins(user_id);
```

### 10.4 User Credentials Table

```sql
-- Unified credentials table for all user types
CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL 
    CHECK (user_type IN ('meta_staff', 'officer', 'institution_admin', 'student', 'teacher')),
  
  -- Password
  password_hash TEXT NOT NULL,
  password_salt TEXT,
  
  -- Status
  password_changed BOOLEAN DEFAULT FALSE,
  must_change_password BOOLEAN DEFAULT TRUE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  
  -- Security
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, user_type)
);

-- Indexes
CREATE INDEX idx_user_credentials_user ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_type ON user_credentials(user_type);
```

### 10.5 Password Reset Tokens Table

```sql
-- Password reset tokens with expiry
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Token valid for 1 hour by default
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Index for token lookup
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id, user_type);
```

### 10.6 Password Change Logs Table

```sql
-- Audit log for password changes
CREATE TABLE password_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL 
    CHECK (action IN ('set_by_admin', 'user_changed', 'force_changed', 'reset_via_link')),
  performed_by UUID, -- Admin who set password (null if user-initiated)
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for audit queries
CREATE INDEX idx_password_change_logs_user ON password_change_logs(user_id, user_type);
CREATE INDEX idx_password_change_logs_date ON password_change_logs(created_at);
```

### 10.7 Teachers Table

```sql
-- Teachers managed by institution
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Profile
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(100),
  subjects TEXT[], -- Array of subjects
  classes TEXT[], -- Array of classes
  qualification VARCHAR(255),
  experience_years INTEGER DEFAULT 0,
  join_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'on_leave')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(institution_id, email)
);

-- Indexes
CREATE INDEX idx_teachers_institution ON teachers(institution_id);
CREATE INDEX idx_teachers_department ON teachers(department);
CREATE INDEX idx_teachers_status ON teachers(status);
```

### 10.8 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE RELATIONSHIPS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐         ┌─────────────────────┐                        │
│  │  institutions   │────────▶│ institution_pricing │                        │
│  │                 │  1:1    │                     │                        │
│  └────────┬────────┘         └─────────────────────┘                        │
│           │                                                                  │
│           │ 1:N                                                              │
│           ▼                                                                  │
│  ┌─────────────────┐         ┌─────────────────────┐                        │
│  │institution_admins│───────▶│  user_credentials   │                        │
│  │                 │  1:1    │                     │                        │
│  └─────────────────┘         └─────────────────────┘                        │
│           │                            ▲                                     │
│           │                            │                                     │
│           │                   ┌────────┴────────┐                           │
│           │                   │                 │                            │
│           │           ┌───────┴───────┐ ┌───────┴───────┐                   │
│           │           │ meta_staff    │ │   officers    │                   │
│           │           └───────────────┘ └───────────────┘                   │
│           │                                     │                            │
│           │ 1:N                                 │ N:1                        │
│           ▼                                     ▼                            │
│  ┌─────────────────┐                   ┌─────────────────┐                  │
│  │    teachers     │                   │officer_assignments│                │
│  └─────────────────┘                   │ (to institutions)│                  │
│                                        └─────────────────┘                  │
│           │                                                                  │
│           │ 1:N (institution)                                               │
│           ▼                                                                  │
│  ┌─────────────────┐         ┌─────────────────────┐                        │
│  │    students     │────────▶│  user_credentials   │                        │
│  │                 │  1:1    │                     │                        │
│  └─────────────────┘         └─────────────────────┘                        │
│                                        │                                     │
│                                        │ 1:N                                 │
│                                        ▼                                     │
│                              ┌─────────────────────┐                        │
│                              │password_change_logs │                        │
│                              └─────────────────────┘                        │
│                                        │                                     │
│                                        │ 1:N                                 │
│                                        ▼                                     │
│                              ┌─────────────────────┐                        │
│                              │password_reset_tokens│                        │
│                              └─────────────────────┘                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Frontend Files Reference

### 11.1 Page Components

| File Path | Purpose |
|-----------|---------|
| `src/pages/management/Dashboard.tsx` | Main dashboard with value metrics and ROI highlights |
| `src/pages/management/Teachers.tsx` | Teacher management with full CRUD operations |
| `src/pages/management/Students.tsx` | Student listing (read-only for management) |
| `src/pages/management/Officers.tsx` | View assigned innovation officers |
| `src/pages/management/CoursesAndSessions.tsx` | Course catalog and class schedules |
| `src/pages/management/InventoryAndPurchase.tsx` | Inventory oversight and purchase approval |
| `src/pages/management/ProjectsAndCertificates.tsx` | Innovation projects and certificates |
| `src/pages/management/Events.tsx` | Events and institution participation |
| `src/pages/management/Reports.tsx` | Analytics and report generation |
| `src/pages/management/Attendance.tsx` | Attendance tracking for all user types |
| `src/pages/management/Settings.tsx` | Account and institution settings |

### 11.2 Shared Components

| File Path | Purpose |
|-----------|---------|
| `src/components/layout/Sidebar.tsx` | Sidebar navigation with role-based menu |
| `src/components/layout/Layout.tsx` | Main layout wrapper |
| `src/components/management/InstitutionHeader.tsx` | Reusable institution header |
| `src/components/auth/SetPasswordDialog.tsx` | Password setting dialog |
| `src/components/auth/ForcePasswordChangeDialog.tsx` | Forced password change |

### 11.3 Data & Services

| File Path | Purpose |
|-----------|---------|
| `src/data/mockInstitutionData.ts` | Institution mock data and helpers |
| `src/data/mockOfficerData.ts` | Officer mock data with CRUD |
| `src/data/mockStudentData.ts` | Student mock data with helpers |
| `src/contexts/InstitutionDataContext.tsx` | Institution state management |
| `src/services/institution.service.ts` | Institution API service |
| `src/services/management.service.ts` | Management API service |
| `src/services/passwordService.ts` | Password management service |

### 11.4 Types

| File Path | Purpose |
|-----------|---------|
| `src/types/institution.ts` | Institution-related type definitions |
| `src/types/student.ts` | Student type definitions |
| `src/types/index.ts` | Shared type exports |

---

## 12. Implementation Notes

### 12.1 Current Implementation Gap

**Issue**: Newly onboarded institutions are saved to `InstitutionDataContext` but their management admin credentials are not automatically added to `mockUsers.ts` authentication array, preventing login.

**Current Flow (Frontend-First)**:
```
1. CEO adds institution via InstitutionManagement.tsx
2. Institution saved to localStorage via InstitutionDataContext
3. CEO sets password in CredentialManagement.tsx
4. Credential status updated in localStorage
5. ❌ No corresponding user entry in mockUsers for authentication
6. ❌ Management admin cannot login
```

**Backend Solution**:
```
1. POST /api/v1/institutions creates institution
2. Automatically create institution_admin entry
3. Automatically create user_credentials entry with must_change_password=true
4. When admin sets password via Credential Management, update user_credentials
5. Login checks user_credentials for authentication
6. ✅ Management admin can login and is forced to change password
```

### 12.2 localStorage Keys Used

| Key | Purpose | Data Type |
|-----|---------|-----------|
| `tenant` | Current tenant info (slug, name) | `{ slug: string, name: string }` |
| `user` | Authenticated user data | `User` |
| `credentialStatus` | Institution credential setup status | `Record<institutionId, CredentialStatus>` |
| `institution_officers` | Officer assignments per institution | `Record<institutionId, OfficerAssignment[]>` |
| `inventory_items` | Lab inventory data | `InventoryItem[]` |
| `purchase_requests` | Purchase request workflow | `PurchaseRequest[]` |
| `audit_records` | Audit report submissions | `AuditRecord[]` |
| `projects` | Project data | `Project[]` |
| `event_interests` | Event interest registrations | `EventInterest[]` |
| `institution_students` | Students by institution | `Student[]` |
| `institution_teachers` | Teachers by institution | `Teacher[]` |
| `password_change_logs` | Password audit trail | `PasswordChangeLog[]` |
| `password_reset_tokens` | Active reset tokens | `PasswordResetToken[]` |

### 12.3 Backend Migration Checklist

When migrating from localStorage to backend APIs:

- [ ] Replace `localStorage.getItem()` calls with API `GET` requests
- [ ] Replace `localStorage.setItem()` calls with API `POST`/`PUT` requests
- [ ] Implement JWT token management for authentication
- [ ] Add API error handling and retry logic
- [ ] Implement optimistic updates for better UX
- [ ] Add loading states during API calls
- [ ] Implement proper cache invalidation
- [ ] Add offline support if needed

### 12.4 Security Considerations

1. **Password Hashing**: Use bcrypt with salt for password storage
2. **JWT Tokens**: Short-lived access tokens (15 min) + refresh tokens (7 days)
3. **Rate Limiting**: Limit login attempts to prevent brute force
4. **HTTPS**: All API calls must use HTTPS
5. **Input Validation**: Validate all inputs server-side
6. **SQL Injection**: Use parameterized queries (Prisma handles this)
7. **XSS Prevention**: Sanitize all user inputs displayed in UI
8. **CORS**: Configure proper CORS policies
9. **Institution Isolation**: Management users can only access their institution's data
10. **Audit Logging**: Log all sensitive operations (password changes, data exports)

---

## Appendix A: Mock Data Examples

### A.1 Institution Example

```json
{
  "id": "inst-msd-001",
  "name": "Modern School Vasant Vihar",
  "slug": "modern-school-vasant-vihar",
  "code": "MSD-VV-001",
  "type": "school",
  "location": "New Delhi, India",
  "established_year": 1998,
  "contact_email": "admin@modernschool.edu",
  "contact_phone": "+91-11-26143245",
  "admin_name": "Dr. Rajesh Kumar",
  "admin_email": "rajesh.kumar@modernschool.edu",
  "total_students": 350,
  "total_faculty": 45,
  "gps_location": {
    "latitude": 28.5574,
    "longitude": 77.1597,
    "address": "Sector 10, Vasant Vihar, New Delhi"
  },
  "attendance_radius_meters": 200,
  "pricing_model": {
    "per_student_cost": 500,
    "lms_cost": 10000,
    "lap_setup_cost": 50000,
    "monthly_recurring_cost": 15000,
    "trainer_monthly_fee": 25000
  },
  "contract_type": "premium",
  "contract_start_date": "2024-01-01",
  "contract_expiry_date": "2025-12-31",
  "contract_value": 500000,
  "subscription_status": "active"
}
```

### A.2 Management User Example

```json
{
  "id": "mgmt-msd-001",
  "name": "Dr. Rajesh Kumar",
  "email": "rajesh.kumar@modernschool.edu",
  "role": "management",
  "tenant_id": "inst-msd-001",
  "institution_name": "Modern School Vasant Vihar",
  "password_changed": true,
  "must_change_password": false,
  "password_changed_at": "2024-01-15T10:30:00Z",
  "last_login_at": "2024-12-09T08:00:00Z",
  "status": "active"
}
```

---

## Appendix B: API Request/Response Examples

### B.1 Create Institution

**Request**:
```http
POST /api/v1/institutions
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Delhi Public School",
  "slug": "delhi-public-school",
  "code": "DPS-001",
  "type": "school",
  "location": "New Delhi, India",
  "contact_email": "admin@dps.edu",
  "contact_phone": "+91-11-12345678",
  "admin_name": "Dr. Priya Sharma",
  "admin_email": "priya.sharma@dps.edu",
  "pricing_model": {
    "per_student_cost": 600,
    "lms_cost": 12000,
    "lap_setup_cost": 60000,
    "monthly_recurring_cost": 18000,
    "trainer_monthly_fee": 30000
  },
  "contract_type": "enterprise",
  "contract_start_date": "2025-01-01",
  "contract_expiry_date": "2026-12-31",
  "contract_value": 750000
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "inst-dps-001",
    "name": "Delhi Public School",
    "slug": "delhi-public-school",
    "code": "DPS-001",
    "type": "school",
    "subscription_status": "active",
    "created_at": "2024-12-09T10:00:00Z"
  },
  "message": "Institution created successfully. Please set up credentials for the admin."
}
```

### B.2 Login

**Request**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "rajesh.kumar@modernschool.edu",
  "password": "TempPassword123!"
}
```

**Response (First Login)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "mgmt-msd-001",
      "name": "Dr. Rajesh Kumar",
      "email": "rajesh.kumar@modernschool.edu",
      "role": "management",
      "tenant_id": "inst-msd-001"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "must_change_password": true
  }
}
```

---

*Document generated for Meta-Innova Innovation Academy Platform*  
*Backend Development Reference*  
*Version 1.0.0 - December 2024*
