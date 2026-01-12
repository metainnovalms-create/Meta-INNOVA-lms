# META-INNOVA BACKEND COMPLETE DOCUMENTATION
## Production-Ready Backend Implementation Guide

**Version:** 2.0  
**Last Updated:** December 2024  
**Platform:** Meta-Innova Innovation Academy Platform  
**Architecture:** Multi-Tenant SaaS

---

## Table of Contents

1. [System Architecture & Project Setup](#1-system-architecture--project-setup)
2. [Complete Database Schema](#2-complete-database-schema)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [API Endpoints Documentation](#4-api-endpoints-documentation)
5. [Special Business Logic](#5-special-business-logic)
6. [OpenAPI/Swagger Specification](#6-openapiswagger-specification)
7. [Postman Collection](#7-postman-collection)
8. [Developer Setup Guide](#8-developer-setup-guide)
9. [Error Code Reference](#9-error-code-reference)
10. [Deployment Guide](#10-deployment-guide)

---

## 1. System Architecture & Project Setup

### 1.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Framework | Express.js 4.x |
| ORM | Prisma 5.x |
| Database | Neon PostgreSQL (Serverless) |
| Authentication | JWT + bcrypt |
| Validation | Zod |
| File Storage | Supabase Storage / AWS S3 |
| Email | Nodemailer + SendGrid |
| Caching | Redis (optional) |
| Deployment | Vercel / Render / Railway |

### 1.2 Project Structure

```
meta-innova-backend/
├── prisma/
│   ├── schema.prisma          # Complete database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client configuration
│   │   ├── env.ts             # Environment variables
│   │   └── cors.ts            # CORS configuration
│   ├── middleware/
│   │   ├── auth.middleware.ts         # JWT verification
│   │   ├── rbac.middleware.ts         # Role-based access control
│   │   ├── institution.middleware.ts  # Institution isolation
│   │   ├── validation.middleware.ts   # Zod validation
│   │   ├── error.middleware.ts        # Global error handler
│   │   └── upload.middleware.ts       # File upload (multer)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │   ├── users/
│   │   ├── institutions/
│   │   ├── officers/
│   │   ├── students/
│   │   ├── courses/
│   │   ├── assessments/
│   │   ├── assignments/
│   │   ├── projects/
│   │   ├── events/
│   │   ├── leave/
│   │   ├── attendance/
│   │   ├── payroll/
│   │   ├── inventory/
│   │   ├── crm/
│   │   ├── surveys/
│   │   ├── gamification/
│   │   ├── calendar/
│   │   ├── tasks/
│   │   ├── performance/
│   │   └── reports/
│   ├── utils/
│   │   ├── jwt.util.ts
│   │   ├── password.util.ts
│   │   ├── gps.util.ts
│   │   ├── payroll.util.ts
│   │   ├── id-generator.util.ts
│   │   └── email.util.ts
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   └── app.ts                 # Express app entry
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

### 1.3 Environment Configuration

```env
# .env.example

# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/metainnova?sslmode=require"

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_REFRESH_EXPIRES_IN=30d

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRES=3600000  # 1 hour in ms

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app

# File Storage (Supabase)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
STORAGE_BUCKET=documents

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@metainnova.com

# GPS Configuration
GPS_VALIDATION_RADIUS_METERS=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### 1.4 Express App Setup

```typescript
// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';
import { corsConfig } from './config/cors';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import institutionRoutes from './modules/institutions/institution.routes';
import officerRoutes from './modules/officers/officer.routes';
import studentRoutes from './modules/students/student.routes';
import courseRoutes from './modules/courses/course.routes';
import assessmentRoutes from './modules/assessments/assessment.routes';
import assignmentRoutes from './modules/assignments/assignment.routes';
import projectRoutes from './modules/projects/project.routes';
import eventRoutes from './modules/events/event.routes';
import leaveRoutes from './modules/leave/leave.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import payrollRoutes from './modules/payroll/payroll.routes';
import inventoryRoutes from './modules/inventory/inventory.routes';
import crmRoutes from './modules/crm/crm.routes';
import surveyRoutes from './modules/surveys/survey.routes';
import gamificationRoutes from './modules/gamification/gamification.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import taskRoutes from './modules/tasks/task.routes';
import performanceRoutes from './modules/performance/performance.routes';
import reportRoutes from './modules/reports/report.routes';
import credentialRoutes from './modules/credentials/credential.routes';
import positionRoutes from './modules/positions/position.routes';
import timetableRoutes from './modules/timetable/timetable.routes';
import certificateRoutes from './modules/certificates/certificate.routes';
import idConfigRoutes from './modules/id-config/id-config.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(corsConfig));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: { success: false, error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/institutions`, institutionRoutes);
app.use(`${API_PREFIX}/officers`, officerRoutes);
app.use(`${API_PREFIX}/students`, studentRoutes);
app.use(`${API_PREFIX}/courses`, courseRoutes);
app.use(`${API_PREFIX}/assessments`, assessmentRoutes);
app.use(`${API_PREFIX}/assignments`, assignmentRoutes);
app.use(`${API_PREFIX}/projects`, projectRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/leave`, leaveRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/payroll`, payrollRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/crm`, crmRoutes);
app.use(`${API_PREFIX}/surveys`, surveyRoutes);
app.use(`${API_PREFIX}/gamification`, gamificationRoutes);
app.use(`${API_PREFIX}/calendar`, calendarRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/performance`, performanceRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/credentials`, credentialRoutes);
app.use(`${API_PREFIX}/positions`, positionRoutes);
app.use(`${API_PREFIX}/timetable`, timetableRoutes);
app.use(`${API_PREFIX}/certificates`, certificateRoutes);
app.use(`${API_PREFIX}/id-config`, idConfigRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Global error handler
app.use(errorMiddleware);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
```

---

## 2. Complete Database Schema

### 2.1 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  super_admin
  system_admin
  management
  officer
  teacher
  student
}

enum LeaveStatus {
  pending
  manager_approved
  agm_approved
  approved
  rejected
  cancelled
}

enum LeaveType {
  casual
  sick
  earned
  unpaid
  maternity
  paternity
}

enum AttendanceStatus {
  present
  absent
  half_day
  late
  on_leave
  holiday
  weekend
}

enum PayrollStatus {
  pending
  processing
  approved
  paid
  rejected
}

enum ProjectStatus {
  draft
  proposed
  approved
  in_progress
  completed
  on_hold
  cancelled
}

enum EventStatus {
  draft
  upcoming
  ongoing
  completed
  cancelled
}

enum AssessmentStatus {
  draft
  published
  active
  closed
  archived
}

enum AssignmentStatus {
  draft
  published
  active
  closed
  archived
}

enum SubmissionStatus {
  not_started
  in_progress
  submitted
  late_submitted
  graded
  returned
}

enum CourseStatus {
  draft
  published
  active
  archived
}

enum CourseDifficulty {
  beginner
  intermediate
  advanced
}

enum ContentType {
  video
  pdf
  document
  presentation
  link
  quiz
  simulation
}

enum TaskStatus {
  pending
  in_progress
  submitted_for_approval
  completed
  rejected
  cancelled
}

enum TaskPriority {
  low
  medium
  high
  urgent
}

enum PurchaseRequestStatus {
  pending
  admin_approved
  admin_rejected
  institution_approved
  institution_rejected
  fulfilled
  cancelled
}

enum ContractStatus {
  draft
  active
  expired
  terminated
  pending_renewal
}

enum InvoiceStatus {
  draft
  sent
  paid
  overdue
  cancelled
}

enum SurveyStatus {
  draft
  active
  closed
}

enum FeedbackStatus {
  submitted
  under_review
  resolved
  dismissed
}

enum CertificateActivityType {
  course
  assignment
  assessment
  event
}

enum GenderType {
  male
  female
  other
}

enum StudentStatus {
  active
  inactive
  transferred
  graduated
}

enum TimetableSlotType {
  workshop
  lab
  mentoring
  project_review
  lecture
  practical
}

// ============================================
// CORE SYSTEM TABLES
// ============================================

model Tenant {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  domain      String?
  logo_url    String?
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  institutions Institution[]
  users        User[]

  @@map("tenants")
}

model User {
  id                    String    @id @default(uuid())
  email                 String    @unique
  password_hash         String
  name                  String
  avatar                String?
  role                  UserRole
  position_id           String?
  position_name         String?
  is_ceo                Boolean   @default(false)
  tenant_id             String?
  institution_id        String?
  class_id              String?
  hourly_rate           Decimal?  @db.Decimal(10, 2)
  overtime_rate_multiplier Decimal? @db.Decimal(4, 2)
  normal_working_hours  Int?
  password_changed      Boolean   @default(false)
  must_change_password  Boolean   @default(true)
  password_changed_at   DateTime?
  is_active             Boolean   @default(true)
  last_login            DateTime?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  tenant              Tenant?              @relation(fields: [tenant_id], references: [id])
  position            Position?            @relation(fields: [position_id], references: [id])
  institution         Institution?         @relation(fields: [institution_id], references: [id])
  user_roles          UserRoleMapping[]
  password_history    PasswordHistory[]
  password_reset_tokens PasswordResetToken[]
  audit_logs          AuditLog[]
  notifications       Notification[]
  
  // Relations for different user types
  officer_profile     Officer?
  student_profile     Student?
  meta_staff_profile  MetaStaff?
  
  // Task relations
  tasks_created       Task[]               @relation("TaskCreator")
  tasks_assigned      Task[]               @relation("TaskAssignee")
  task_comments       TaskComment[]
  
  // Leave relations
  leave_applications  LeaveApplication[]   @relation("LeaveApplicant")
  leave_approvals     LeaveApproval[]

  @@index([email])
  @@index([tenant_id])
  @@index([institution_id])
  @@index([position_id])
  @@map("users")
}

model UserRoleMapping {
  id         String   @id @default(uuid())
  user_id    String
  role       UserRole
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([user_id, role])
  @@map("user_roles")
}

model Position {
  id               String   @id @default(uuid())
  position_name    String   @unique
  display_name     String
  description      String?
  is_ceo_position  Boolean  @default(false)
  is_active        Boolean  @default(true)
  created_by       String
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  users            User[]
  visible_features PositionFeature[]
  meta_staff       MetaStaff[]

  @@map("positions")
}

model PositionFeature {
  id          String @id @default(uuid())
  position_id String
  feature     String

  position Position @relation(fields: [position_id], references: [id], onDelete: Cascade)

  @@unique([position_id, feature])
  @@map("position_features")
}

model PasswordHistory {
  id            String   @id @default(uuid())
  user_id       String
  password_hash String
  changed_at    DateTime @default(now())
  changed_by    String?
  change_type   String   // 'user_change', 'admin_reset', 'force_change'

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("password_history")
}

model PasswordResetToken {
  id         String   @id @default(uuid())
  user_id    String
  token      String   @unique
  expires_at DateTime
  used       Boolean  @default(false)
  created_at DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@map("password_reset_tokens")
}

model AuditLog {
  id          String   @id @default(uuid())
  user_id     String?
  action      String
  entity_type String
  entity_id   String?
  old_values  Json?
  new_values  Json?
  ip_address  String?
  user_agent  String?
  created_at  DateTime @default(now())

  user User? @relation(fields: [user_id], references: [id])

  @@index([user_id])
  @@index([entity_type, entity_id])
  @@index([created_at])
  @@map("audit_logs")
}

model Notification {
  id          String   @id @default(uuid())
  user_id     String
  title       String
  message     String
  type        String   // 'info', 'success', 'warning', 'error'
  link        String?
  is_read     Boolean  @default(false)
  created_at  DateTime @default(now())

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id, is_read])
  @@map("notifications")
}

// ============================================
// INSTITUTION TABLES
// ============================================

model Institution {
  id                    String   @id @default(uuid())
  institution_id        String   @unique // Generated ID like MSD-2024-001
  tenant_id             String
  name                  String
  display_name          String?
  address               String
  city                  String
  state                 String
  country               String   @default("India")
  pincode               String
  phone                 String
  email                 String
  website               String?
  logo_url              String?
  principal_name        String?
  principal_email       String?
  principal_phone       String?
  
  // Agreement/Pricing
  per_student_cost      Decimal? @db.Decimal(10, 2)
  lms_cost              Decimal? @db.Decimal(10, 2)
  lap_setup_cost        Decimal? @db.Decimal(10, 2)
  monthly_recurring_cost Decimal? @db.Decimal(10, 2)
  trainer_monthly_fee   Decimal? @db.Decimal(10, 2)
  agreement_start_date  DateTime?
  agreement_end_date    DateTime?
  
  // GPS Configuration
  gps_latitude          Decimal? @db.Decimal(10, 8)
  gps_longitude         Decimal? @db.Decimal(11, 8)
  gps_radius_meters     Int      @default(100)
  
  total_students        Int      @default(0)
  is_active             Boolean  @default(true)
  credential_configured Boolean  @default(false)
  created_at            DateTime @default(now())
  updated_at            DateTime @updatedAt

  tenant              Tenant               @relation(fields: [tenant_id], references: [id])
  users               User[]
  classes             InstitutionClass[]
  officers            OfficerAssignment[]
  students            Student[]
  periods             InstitutionPeriod[]
  timetable_slots     TimetableSlot[]
  academic_years      AcademicYear[]
  holidays            Holiday[]
  inventory_items     InventoryItem[]
  purchase_requests   PurchaseRequest[]
  audit_records       InventoryAuditRecord[]
  events              Event[]
  projects            Project[]
  assessments         AssessmentPublishing[]
  assignments         AssignmentPublishing[]
  surveys             SurveyTarget[]
  contracts           Contract[]
  invoices            Invoice[]
  communication_logs  CommunicationLog[]
  calendar_events     CalendarEvent[]

  @@index([tenant_id])
  @@index([institution_id])
  @@map("institutions")
}

model InstitutionClass {
  id              String   @id @default(uuid())
  institution_id  String
  class_name      String
  section         String?
  display_order   Int      @default(0)
  academic_year   String
  capacity        Int?
  room_number     String?
  class_teacher_id String?
  status          String   @default("active")
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  institution     Institution          @relation(fields: [institution_id], references: [id], onDelete: Cascade)
  students        Student[]
  timetable_slots TimetableSlot[]
  course_assignments ClassCourseAssignment[]
  assessment_publishing AssessmentClassPublishing[]
  assignment_publishing AssignmentClassPublishing[]

  @@unique([institution_id, class_name, section, academic_year])
  @@map("institution_classes")
}

model InstitutionPeriod {
  id             String @id @default(uuid())
  institution_id String
  period_number  Int
  name           String
  start_time     String // "09:00"
  end_time       String // "09:45"
  is_break       Boolean @default(false)

  institution Institution @relation(fields: [institution_id], references: [id], onDelete: Cascade)

  @@unique([institution_id, period_number])
  @@map("institution_periods")
}

model AcademicYear {
  id             String   @id @default(uuid())
  institution_id String
  name           String   // "2024-25"
  start_date     DateTime
  end_date       DateTime
  is_current     Boolean  @default(false)
  created_at     DateTime @default(now())

  institution Institution    @relation(fields: [institution_id], references: [id], onDelete: Cascade)
  terms       AcademicTerm[]

  @@unique([institution_id, name])
  @@map("academic_years")
}

model AcademicTerm {
  id               String   @id @default(uuid())
  academic_year_id String
  name             String   // "Term 1", "Semester 1"
  start_date       DateTime
  end_date         DateTime

  academic_year AcademicYear @relation(fields: [academic_year_id], references: [id], onDelete: Cascade)

  @@map("academic_terms")
}

model Holiday {
  id             String   @id @default(uuid())
  institution_id String?  // null for company-wide holidays
  name           String
  date           DateTime
  type           String   // 'national', 'state', 'institution', 'company'
  is_recurring   Boolean  @default(false)
  created_at     DateTime @default(now())

  institution Institution? @relation(fields: [institution_id], references: [id], onDelete: Cascade)

  @@map("holidays")
}

// ============================================
// PEOPLE MANAGEMENT
// ============================================

model MetaStaff {
  id                       String   @id @default(uuid())
  user_id                  String   @unique
  employee_id              String   @unique // Generated ID
  position_id              String
  department               String?
  phone                    String?
  emergency_contact        String?
  date_of_joining          DateTime
  date_of_birth            DateTime?
  blood_group              String?
  
  // Salary Configuration
  hourly_rate              Decimal  @db.Decimal(10, 2)
  overtime_rate_multiplier Decimal  @default(1.5) @db.Decimal(4, 2)
  normal_working_hours     Int      @default(8)
  salary_type              String   @default("monthly") // 'monthly', 'hourly'
  
  // Leave Allowances
  casual_leave_balance     Int      @default(12)
  sick_leave_balance       Int      @default(12)
  earned_leave_balance     Int      @default(15)
  
  is_active                Boolean  @default(true)
  created_at               DateTime @default(now())
  updated_at               DateTime @updatedAt

  user                User                   @relation(fields: [user_id], references: [id], onDelete: Cascade)
  position            Position               @relation(fields: [position_id], references: [id])
  attendance_records  StaffAttendanceRecord[]
  payroll_records     StaffPayrollRecord[]
  leave_applications  LeaveApplication[]     @relation("StaffLeaveApplications")

  @@map("meta_staff")
}

model Officer {
  id                       String   @id @default(uuid())
  user_id                  String   @unique
  officer_id               String   @unique // Generated ID like OFF-MSD-001
  designation              String
  specialization           String?
  phone                    String
  emergency_contact        String?
  date_of_joining          DateTime
  date_of_birth            DateTime?
  blood_group              String?
  qualification            String?
  experience_years         Int?
  
  // Salary Configuration
  hourly_rate              Decimal  @db.Decimal(10, 2)
  overtime_rate_multiplier Decimal  @default(1.5) @db.Decimal(4, 2)
  normal_working_hours     Int      @default(8)
  salary_type              String   @default("hourly")
  
  // Leave Allowances (yearly)
  casual_leave_balance     Int      @default(12)
  sick_leave_balance       Int      @default(12)
  earned_leave_balance     Int      @default(15)
  
  status                   String   @default("active")
  is_active                Boolean  @default(true)
  created_at               DateTime @default(now())
  updated_at               DateTime @updatedAt

  user                User                    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  assignments         OfficerAssignment[]
  timetable_slots     TimetableSlot[]
  attendance_records  AttendanceRecord[]
  payroll_records     PayrollRecord[]
  leave_applications  LeaveApplication[]      @relation("OfficerLeaveApplications")
  documents           OfficerDocument[]
  course_assignments  CourseAssignment[]
  projects            Project[]
  content_completions ContentCompletion[]
  performance_appraisals PerformanceAppraisal[]
  hr_ratings          HRRating[]

  @@map("officers")
}

model OfficerAssignment {
  id             String   @id @default(uuid())
  officer_id     String
  institution_id String
  start_date     DateTime
  end_date       DateTime?
  is_primary     Boolean  @default(true)
  is_active      Boolean  @default(true)
  created_at     DateTime @default(now())

  officer     Officer     @relation(fields: [officer_id], references: [id], onDelete: Cascade)
  institution Institution @relation(fields: [institution_id], references: [id], onDelete: Cascade)

  @@unique([officer_id, institution_id])
  @@map("officer_assignments")
}

model OfficerDocument {
  id           String   @id @default(uuid())
  officer_id   String
  document_type String  // 'resume', 'id_proof', 'qualification', 'experience'
  file_name    String
  file_url     String
  uploaded_at  DateTime @default(now())

  officer Officer @relation(fields: [officer_id], references: [id], onDelete: Cascade)

  @@map("officer_documents")
}

model Student {
  id               String        @id @default(uuid())
  user_id          String?       @unique
  student_id       String        @unique // Lifelong ID
  student_name     String
  roll_number      String
  admission_number String
  class            String
  section          String
  class_id         String
  institution_id   String
  admission_date   DateTime
  date_of_birth    DateTime
  gender           GenderType
  status           StudentStatus @default(active)
  parent_name      String
  parent_phone     String
  parent_email     String
  address          String
  avatar           String?
  blood_group      String?
  previous_school  String?
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt

  institution          Institution              @relation(fields: [institution_id], references: [id])
  institution_class    InstitutionClass         @relation(fields: [class_id], references: [id])
  course_enrollments   CourseEnrollment[]
  assessment_attempts  AssessmentAttempt[]
  assignment_submissions AssignmentSubmission[]
  project_memberships  ProjectMember[]
  event_interests      EventInterest[]
  content_progress     ContentProgress[]
  certificates         StudentCertificate[]
  badges               StudentBadge[]
  xp_records           StudentXP[]
  survey_responses     SurveyResponse[]
  feedback             Feedback[]

  @@unique([institution_id, roll_number, class, section])
  @@index([institution_id])
  @@index([class_id])
  @@map("students")
}

// ============================================
// TIMETABLE MANAGEMENT
// ============================================

model TimetableSlot {
  id                    String          @id @default(uuid())
  officer_id            String
  institution_id        String
  class_id              String
  day                   String          // 'Monday', 'Tuesday', etc.
  start_time            String
  end_time              String
  subject               String
  room                  String?
  type                  TimetableSlotType @default(lecture)
  batch                 String?
  course_id             String?
  current_module_id     String?
  status                String          @default("active")
  original_officer_id   String?
  original_officer_name String?
  leave_application_id  String?
  created_at            DateTime        @default(now())
  updated_at            DateTime        @updatedAt

  officer       Officer          @relation(fields: [officer_id], references: [id])
  institution   Institution      @relation(fields: [institution_id], references: [id])
  class         InstitutionClass @relation(fields: [class_id], references: [id])
  course        Course?          @relation(fields: [course_id], references: [id])

  @@index([officer_id])
  @@index([institution_id, class_id])
  @@index([day])
  @@map("timetable_slots")
}

// ============================================
// COURSE MANAGEMENT (Level-Based)
// ============================================

model Course {
  id               String           @id @default(uuid())
  course_code      String           @unique
  title            String
  description      String
  category         String
  difficulty       CourseDifficulty
  status           CourseStatus     @default(draft)
  thumbnail_url    String?
  duration_hours   Int
  prerequisites    String[]
  learning_outcomes String[]
  sdg_goals        Int[]            // Array of SDG numbers 1-17
  created_by       String
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt

  levels             CourseLevel[]
  assignments        CourseAssignment[]
  enrollments        CourseEnrollment[]
  timetable_slots    TimetableSlot[]
  class_assignments  ClassCourseAssignment[]
  certificate_template CertificateTemplate? @relation(fields: [certificate_template_id], references: [id])
  certificate_template_id String?

  @@map("courses")
}

model CourseLevel {
  id           String   @id @default(uuid())
  course_id    String
  level_number Int
  title        String
  description  String?
  created_at   DateTime @default(now())

  course   Course          @relation(fields: [course_id], references: [id], onDelete: Cascade)
  sessions CourseSession[]

  @@unique([course_id, level_number])
  @@map("course_levels")
}

model CourseSession {
  id          String   @id @default(uuid())
  level_id    String
  title       String
  description String?
  order       Int
  created_at  DateTime @default(now())

  level    CourseLevel     @relation(fields: [level_id], references: [id], onDelete: Cascade)
  contents CourseContent[]

  @@map("course_sessions")
}

model CourseContent {
  id           String      @id @default(uuid())
  session_id   String
  title        String
  type         ContentType
  content_url  String?
  content_data Json?
  duration_minutes Int?
  order        Int
  is_mandatory Boolean     @default(true)
  created_at   DateTime    @default(now())

  session     CourseSession       @relation(fields: [session_id], references: [id], onDelete: Cascade)
  progress    ContentProgress[]
  completions ContentCompletion[]

  @@map("course_contents")
}

model ContentProgress {
  id              String   @id @default(uuid())
  student_id      String
  content_id      String
  completed       Boolean  @default(false)
  completed_at    DateTime?
  completed_by_id String?  // Officer who marked it complete
  completed_by_name String?
  session_context String?  // Class session during which it was completed
  progress_percent Int     @default(0)
  last_accessed   DateTime?
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt

  student Student       @relation(fields: [student_id], references: [id], onDelete: Cascade)
  content CourseContent @relation(fields: [content_id], references: [id], onDelete: Cascade)

  @@unique([student_id, content_id])
  @@map("content_progress")
}

model ContentCompletion {
  id           String   @id @default(uuid())
  content_id   String
  officer_id   String
  class_id     String
  completed_at DateTime @default(now())
  notes        String?

  content CourseContent @relation(fields: [content_id], references: [id], onDelete: Cascade)
  officer Officer       @relation(fields: [officer_id], references: [id])

  @@map("content_completions")
}

model CourseAssignment {
  id             String   @id @default(uuid())
  course_id      String
  officer_id     String
  institution_id String
  assigned_at    DateTime @default(now())
  is_active      Boolean  @default(true)

  course  Course  @relation(fields: [course_id], references: [id], onDelete: Cascade)
  officer Officer @relation(fields: [officer_id], references: [id])

  @@unique([course_id, officer_id, institution_id])
  @@map("course_assignments")
}

model ClassCourseAssignment {
  id             String   @id @default(uuid())
  class_id       String
  course_id      String
  accessible_levels Int[] // Array of level numbers accessible to this class
  assigned_by    String
  assigned_at    DateTime @default(now())

  class  InstitutionClass @relation(fields: [class_id], references: [id], onDelete: Cascade)

  @@unique([class_id, course_id])
  @@map("class_course_assignments")
}

model CourseEnrollment {
  id               String   @id @default(uuid())
  student_id       String
  course_id        String
  enrolled_at      DateTime @default(now())
  completed_at     DateTime?
  progress_percent Int      @default(0)
  status           String   @default("enrolled") // 'enrolled', 'in_progress', 'completed', 'dropped'

  student Student @relation(fields: [student_id], references: [id], onDelete: Cascade)

  @@unique([student_id, course_id])
  @@map("course_enrollments")
}

// ============================================
// ASSESSMENT MANAGEMENT
// ============================================

model Assessment {
  id                  String           @id @default(uuid())
  title               String
  description         String?
  instructions        String?
  duration_minutes    Int
  total_marks         Int
  passing_marks       Int
  status              AssessmentStatus @default(draft)
  
  // Settings
  shuffle_questions   Boolean          @default(false)
  shuffle_options     Boolean          @default(false)
  show_results        Boolean          @default(true)
  allow_review        Boolean          @default(true)
  max_attempts        Int              @default(1)
  
  // Scheduling
  start_date          DateTime?
  end_date            DateTime?
  
  // Creation context
  created_by          String
  created_by_role     String           // 'system_admin' or 'officer'
  institution_id      String?          // Only for officer-created
  
  certificate_template_id String?
  created_at          DateTime         @default(now())
  updated_at          DateTime         @updatedAt

  questions  AssessmentQuestion[]
  publishing AssessmentPublishing[]
  attempts   AssessmentAttempt[]
  certificate_template CertificateTemplate? @relation(fields: [certificate_template_id], references: [id])

  @@map("assessments")
}

model AssessmentQuestion {
  id               String  @id @default(uuid())
  assessment_id    String
  question_text    String
  question_type    String  // 'mcq', 'true_false', 'short_answer', 'long_answer'
  options          Json?   // Array of {id, text, isCorrect}
  correct_answer   String?
  marks            Int
  order            Int
  explanation      String?
  image_url        String?

  assessment Assessment         @relation(fields: [assessment_id], references: [id], onDelete: Cascade)
  answers    AssessmentAnswer[]

  @@map("assessment_questions")
}

model AssessmentPublishing {
  id             String @id @default(uuid())
  assessment_id  String
  institution_id String

  assessment  Assessment                   @relation(fields: [assessment_id], references: [id], onDelete: Cascade)
  institution Institution                  @relation(fields: [institution_id], references: [id])
  classes     AssessmentClassPublishing[]

  @@unique([assessment_id, institution_id])
  @@map("assessment_publishing")
}

model AssessmentClassPublishing {
  id            String @id @default(uuid())
  publishing_id String
  class_id      String

  publishing       AssessmentPublishing @relation(fields: [publishing_id], references: [id], onDelete: Cascade)
  institution_class InstitutionClass    @relation(fields: [class_id], references: [id])

  @@unique([publishing_id, class_id])
  @@map("assessment_class_publishing")
}

model AssessmentAttempt {
  id             String   @id @default(uuid())
  assessment_id  String
  student_id     String
  started_at     DateTime @default(now())
  submitted_at   DateTime?
  score          Int?
  percentage     Decimal? @db.Decimal(5, 2)
  passed         Boolean?
  time_taken_minutes Int?
  status         String   @default("in_progress") // 'in_progress', 'submitted', 'graded'

  assessment Assessment         @relation(fields: [assessment_id], references: [id])
  student    Student            @relation(fields: [student_id], references: [id])
  answers    AssessmentAnswer[]

  @@map("assessment_attempts")
}

model AssessmentAnswer {
  id          String  @id @default(uuid())
  attempt_id  String
  question_id String
  answer      String?
  is_correct  Boolean?
  marks_obtained Int?

  attempt  AssessmentAttempt  @relation(fields: [attempt_id], references: [id], onDelete: Cascade)
  question AssessmentQuestion @relation(fields: [question_id], references: [id])

  @@unique([attempt_id, question_id])
  @@map("assessment_answers")
}

// ============================================
// ASSIGNMENT MANAGEMENT
// ============================================

model StandaloneAssignment {
  id                    String           @id @default(uuid())
  title                 String
  description           String
  instructions          String?
  assignment_type       String           // 'file_upload', 'text', 'url', 'multi_question'
  status                AssignmentStatus @default(draft)
  
  // Timing
  start_date            DateTime?
  due_date              DateTime
  
  // Submission settings
  max_file_size_mb      Int              @default(10)
  allowed_file_types    String[]
  max_submissions       Int              @default(1)
  late_submission_policy String          @default("not_allowed") // 'not_allowed', 'penalty', 'allowed'
  late_penalty_percent  Int?
  
  // Grading
  total_points          Int
  passing_points        Int?
  grading_type          String           @default("points") // 'points', 'rubric', 'pass_fail'
  
  // Creation
  created_by            String
  certificate_template_id String?
  created_at            DateTime         @default(now())
  updated_at            DateTime         @updatedAt

  questions   AssignmentQuestion[]
  rubrics     AssignmentRubric[]
  publishing  AssignmentPublishing[]
  submissions AssignmentSubmission[]
  attachments AssignmentAttachment[]
  certificate_template CertificateTemplate? @relation(fields: [certificate_template_id], references: [id])

  @@map("standalone_assignments")
}

model AssignmentQuestion {
  id             String @id @default(uuid())
  assignment_id  String
  question_text  String
  question_type  String // 'mcq', 'short_answer', 'long_answer', 'file_upload'
  options        Json?
  correct_answer String?
  points         Int
  order          Int
  explanation    String?

  assignment StandaloneAssignment   @relation(fields: [assignment_id], references: [id], onDelete: Cascade)
  answers    AssignmentAnswer[]

  @@map("assignment_questions")
}

model AssignmentRubric {
  id            String @id @default(uuid())
  assignment_id String
  criteria      String
  description   String?
  max_points    Int
  order         Int

  assignment StandaloneAssignment @relation(fields: [assignment_id], references: [id], onDelete: Cascade)

  @@map("assignment_rubrics")
}

model AssignmentAttachment {
  id            String @id @default(uuid())
  assignment_id String
  file_name     String
  file_url      String
  file_type     String
  uploaded_at   DateTime @default(now())

  assignment StandaloneAssignment @relation(fields: [assignment_id], references: [id], onDelete: Cascade)

  @@map("assignment_attachments")
}

model AssignmentPublishing {
  id             String @id @default(uuid())
  assignment_id  String
  institution_id String

  assignment  StandaloneAssignment        @relation(fields: [assignment_id], references: [id], onDelete: Cascade)
  institution Institution                 @relation(fields: [institution_id], references: [id])
  classes     AssignmentClassPublishing[]

  @@unique([assignment_id, institution_id])
  @@map("assignment_publishing")
}

model AssignmentClassPublishing {
  id            String @id @default(uuid())
  publishing_id String
  class_id      String

  publishing       AssignmentPublishing @relation(fields: [publishing_id], references: [id], onDelete: Cascade)
  institution_class InstitutionClass    @relation(fields: [class_id], references: [id])

  @@unique([publishing_id, class_id])
  @@map("assignment_class_publishing")
}

model AssignmentSubmission {
  id               String           @id @default(uuid())
  assignment_id    String
  student_id       String
  status           SubmissionStatus @default(not_started)
  
  // Submission content
  submitted_text   String?
  submitted_url    String?
  submitted_at     DateTime?
  
  // Grading
  grade            Int?
  percentage       Decimal?         @db.Decimal(5, 2)
  feedback         String?
  graded_by        String?
  graded_at        DateTime?
  
  // Rubric scores
  rubric_scores    Json?            // Array of {rubric_id, score}
  
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt

  assignment StandaloneAssignment @relation(fields: [assignment_id], references: [id])
  student    Student              @relation(fields: [student_id], references: [id])
  files      SubmissionFile[]
  answers    AssignmentAnswer[]

  @@unique([assignment_id, student_id])
  @@map("assignment_submissions")
}

model SubmissionFile {
  id            String   @id @default(uuid())
  submission_id String
  file_name     String
  file_url      String
  file_type     String
  file_size     Int
  uploaded_at   DateTime @default(now())

  submission AssignmentSubmission @relation(fields: [submission_id], references: [id], onDelete: Cascade)

  @@map("submission_files")
}

model AssignmentAnswer {
  id            String  @id @default(uuid())
  submission_id String
  question_id   String
  answer        String?
  is_correct    Boolean?
  points_earned Int?

  submission AssignmentSubmission @relation(fields: [submission_id], references: [id], onDelete: Cascade)
  question   AssignmentQuestion   @relation(fields: [question_id], references: [id])

  @@unique([submission_id, question_id])
  @@map("assignment_answers")
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

model Project {
  id               String        @id @default(uuid())
  project_id       String        @unique // Generated ID
  title            String
  description      String
  category         String
  status           ProjectStatus @default(draft)
  institution_id   String
  officer_id       String
  
  // Dates
  start_date       DateTime?
  end_date         DateTime?
  actual_end_date  DateTime?
  
  // SDG
  sdg_goals        Int[]
  
  // Images
  thumbnail_url    String?
  gallery_urls     String[]
  
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt

  institution    Institution       @relation(fields: [institution_id], references: [id])
  officer        Officer           @relation(fields: [officer_id], references: [id])
  members        ProjectMember[]
  progress_updates ProgressUpdate[]
  event_links    EventProjectLink[]

  @@map("projects")
}

model ProjectMember {
  id         String  @id @default(uuid())
  project_id String
  student_id String
  role       String  // 'leader', 'member'
  class      String
  section    String
  joined_at  DateTime @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  student Student @relation(fields: [student_id], references: [id])

  @@unique([project_id, student_id])
  @@map("project_members")
}

model ProgressUpdate {
  id          String   @id @default(uuid())
  project_id  String
  title       String
  description String
  progress    Int      // 0-100
  attachments String[]
  created_by  String
  created_at  DateTime @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)

  @@map("progress_updates")
}

// ============================================
// EVENT MANAGEMENT
// ============================================

model Event {
  id             String      @id @default(uuid())
  event_id       String      @unique // Generated ID
  title          String
  description    String
  event_type     String      // 'competition', 'workshop', 'exhibition', 'hackathon'
  status         EventStatus @default(draft)
  institution_id String?     // null for company-wide events
  
  // Dates
  start_date     DateTime
  end_date       DateTime
  registration_deadline DateTime?
  
  // Location
  venue          String?
  is_virtual     Boolean     @default(false)
  virtual_link   String?
  
  // Capacity
  max_participants Int?
  
  // Images
  banner_url     String?
  
  certificate_template_id String?
  created_by     String
  created_at     DateTime    @default(now())
  updated_at     DateTime    @updatedAt

  institution   Institution?        @relation(fields: [institution_id], references: [id])
  interests     EventInterest[]
  project_links EventProjectLink[]
  certificate_template CertificateTemplate? @relation(fields: [certificate_template_id], references: [id])

  @@map("events")
}

model EventInterest {
  id             String   @id @default(uuid())
  event_id       String
  student_id     String
  student_name   String
  class          String
  section        String
  institution_id String
  registered_at  DateTime @default(now())

  event   Event   @relation(fields: [event_id], references: [id], onDelete: Cascade)
  student Student @relation(fields: [student_id], references: [id])

  @@unique([event_id, student_id])
  @@map("event_interests")
}

model EventProjectLink {
  id         String   @id @default(uuid())
  event_id   String
  project_id String
  linked_at  DateTime @default(now())

  event   Event   @relation(fields: [event_id], references: [id], onDelete: Cascade)
  project Project @relation(fields: [project_id], references: [id])

  @@unique([event_id, project_id])
  @@map("event_project_links")
}

// ============================================
// LEAVE MANAGEMENT
// ============================================

model LeaveApplication {
  id              String      @id @default(uuid())
  applicant_id    String
  applicant_type  String      // 'officer', 'meta_staff'
  leave_type      LeaveType
  start_date      DateTime
  end_date        DateTime
  reason          String
  status          LeaveStatus @default(pending)
  
  // Documents
  supporting_docs String[]
  
  // Substitute (for officers)
  substitute_officer_id String?
  
  // Timestamps
  applied_at      DateTime    @default(now())
  updated_at      DateTime    @updatedAt

  user            User                 @relation("LeaveApplicant", fields: [applicant_id], references: [id])
  officer         Officer?             @relation("OfficerLeaveApplications", fields: [applicant_id], references: [id], map: "leave_officer_fk")
  meta_staff      MetaStaff?           @relation("StaffLeaveApplications", fields: [applicant_id], references: [id], map: "leave_staff_fk")
  approvals       LeaveApproval[]
  substitute_assignments SubstituteAssignment[]

  @@map("leave_applications")
}

model LeaveApproval {
  id                   String      @id @default(uuid())
  leave_application_id String
  approver_id          String
  approver_role        String      // 'manager', 'agm', 'ceo'
  status               String      // 'approved', 'rejected'
  comments             String?
  approved_at          DateTime    @default(now())

  leave_application LeaveApplication @relation(fields: [leave_application_id], references: [id], onDelete: Cascade)
  approver          User             @relation(fields: [approver_id], references: [id])

  @@map("leave_approvals")
}

model SubstituteAssignment {
  id                   String   @id @default(uuid())
  leave_application_id String
  original_slot_id     String
  substitute_officer_id String
  date                 DateTime
  status               String   @default("pending") // 'pending', 'confirmed', 'completed'

  leave_application LeaveApplication @relation(fields: [leave_application_id], references: [id], onDelete: Cascade)

  @@map("substitute_assignments")
}

model LeaveBalance {
  id               String @id @default(uuid())
  user_id          String
  year             Int
  casual_total     Int    @default(12)
  casual_used      Int    @default(0)
  sick_total       Int    @default(12)
  sick_used        Int    @default(0)
  earned_total     Int    @default(15)
  earned_used      Int    @default(0)
  updated_at       DateTime @updatedAt

  @@unique([user_id, year])
  @@map("leave_balances")
}

// ============================================
// ATTENDANCE & PAYROLL
// ============================================

model AttendanceRecord {
  id               String           @id @default(uuid())
  officer_id       String
  date             DateTime
  status           AttendanceStatus
  
  // Check-in/out
  check_in_time    DateTime?
  check_out_time   DateTime?
  
  // GPS Data
  check_in_latitude  Decimal?       @db.Decimal(10, 8)
  check_in_longitude Decimal?       @db.Decimal(11, 8)
  check_out_latitude Decimal?       @db.Decimal(10, 8)
  check_out_longitude Decimal?      @db.Decimal(11, 8)
  check_in_validated Boolean?
  check_out_validated Boolean?
  
  // Hours
  total_hours      Decimal?         @db.Decimal(5, 2)
  overtime_hours   Decimal?         @db.Decimal(5, 2)
  
  notes            String?
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt

  officer Officer @relation(fields: [officer_id], references: [id])

  @@unique([officer_id, date])
  @@index([officer_id, date])
  @@map("attendance_records")
}

model StaffAttendanceRecord {
  id               String           @id @default(uuid())
  meta_staff_id    String
  date             DateTime
  status           AttendanceStatus
  
  check_in_time    DateTime?
  check_out_time   DateTime?
  check_in_latitude  Decimal?       @db.Decimal(10, 8)
  check_in_longitude Decimal?       @db.Decimal(11, 8)
  check_out_latitude Decimal?       @db.Decimal(10, 8)
  check_out_longitude Decimal?      @db.Decimal(11, 8)
  check_in_validated Boolean?
  check_out_validated Boolean?
  
  total_hours      Decimal?         @db.Decimal(5, 2)
  overtime_hours   Decimal?         @db.Decimal(5, 2)
  notes            String?
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt

  meta_staff MetaStaff @relation(fields: [meta_staff_id], references: [id])

  @@unique([meta_staff_id, date])
  @@map("staff_attendance_records")
}

model PayrollRecord {
  id                 String        @id @default(uuid())
  officer_id         String
  month              Int
  year               Int
  
  // Attendance Summary
  working_days       Int
  days_present       Int
  days_absent        Int
  days_leave         Int
  total_hours        Decimal       @db.Decimal(7, 2)
  overtime_hours     Decimal       @db.Decimal(7, 2)
  
  // Earnings
  basic_pay          Decimal       @db.Decimal(12, 2)
  overtime_pay       Decimal       @db.Decimal(12, 2)
  allowances         Decimal       @db.Decimal(12, 2) @default(0)
  gross_salary       Decimal       @db.Decimal(12, 2)
  
  // Deductions
  pf_employee        Decimal       @db.Decimal(10, 2) @default(0)
  pf_employer        Decimal       @db.Decimal(10, 2) @default(0)
  esi_employee       Decimal       @db.Decimal(10, 2) @default(0)
  esi_employer       Decimal       @db.Decimal(10, 2) @default(0)
  professional_tax   Decimal       @db.Decimal(10, 2) @default(0)
  tds                Decimal       @db.Decimal(10, 2) @default(0)
  other_deductions   Decimal       @db.Decimal(10, 2) @default(0)
  total_deductions   Decimal       @db.Decimal(12, 2)
  
  // Net
  net_pay            Decimal       @db.Decimal(12, 2)
  
  status             PayrollStatus @default(pending)
  approved_by        String?
  approved_at        DateTime?
  paid_at            DateTime?
  
  created_at         DateTime      @default(now())
  updated_at         DateTime      @updatedAt

  officer Officer    @relation(fields: [officer_id], references: [id])
  payslip Payslip?

  @@unique([officer_id, month, year])
  @@map("payroll_records")
}

model StaffPayrollRecord {
  id                 String        @id @default(uuid())
  meta_staff_id      String
  month              Int
  year               Int
  
  working_days       Int
  days_present       Int
  days_absent        Int
  days_leave         Int
  total_hours        Decimal       @db.Decimal(7, 2)
  overtime_hours     Decimal       @db.Decimal(7, 2)
  
  basic_pay          Decimal       @db.Decimal(12, 2)
  overtime_pay       Decimal       @db.Decimal(12, 2)
  allowances         Decimal       @db.Decimal(12, 2) @default(0)
  gross_salary       Decimal       @db.Decimal(12, 2)
  
  pf_employee        Decimal       @db.Decimal(10, 2) @default(0)
  pf_employer        Decimal       @db.Decimal(10, 2) @default(0)
  esi_employee       Decimal       @db.Decimal(10, 2) @default(0)
  esi_employer       Decimal       @db.Decimal(10, 2) @default(0)
  professional_tax   Decimal       @db.Decimal(10, 2) @default(0)
  tds                Decimal       @db.Decimal(10, 2) @default(0)
  other_deductions   Decimal       @db.Decimal(10, 2) @default(0)
  total_deductions   Decimal       @db.Decimal(12, 2)
  
  net_pay            Decimal       @db.Decimal(12, 2)
  
  status             PayrollStatus @default(pending)
  approved_by        String?
  approved_at        DateTime?
  paid_at            DateTime?
  
  created_at         DateTime      @default(now())
  updated_at         DateTime      @updatedAt

  meta_staff MetaStaff @relation(fields: [meta_staff_id], references: [id])

  @@unique([meta_staff_id, month, year])
  @@map("staff_payroll_records")
}

model Payslip {
  id               String   @id @default(uuid())
  payroll_id       String   @unique
  payslip_number   String   @unique
  pdf_url          String?
  generated_at     DateTime @default(now())
  downloaded_at    DateTime?

  payroll PayrollRecord @relation(fields: [payroll_id], references: [id])

  @@map("payslips")
}

// ============================================
// INVENTORY MANAGEMENT
// ============================================

model InventoryItem {
  id               String   @id @default(uuid())
  institution_id   String
  item_code        String
  name             String
  category         String
  description      String?
  
  // Quantity
  quantity         Int
  min_quantity     Int      @default(0)
  unit             String   @default("units")
  
  // Location
  location         String?
  shelf_number     String?
  
  // Status
  condition        String   @default("good") // 'good', 'fair', 'poor', 'damaged'
  status           String   @default("available") // 'available', 'in_use', 'maintenance', 'disposed'
  
  // Value
  unit_price       Decimal? @db.Decimal(10, 2)
  
  last_audit_date  DateTime?
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  institution Institution @relation(fields: [institution_id], references: [id])

  @@unique([institution_id, item_code])
  @@map("inventory_items")
}

model PurchaseRequest {
  id               String                @id @default(uuid())
  request_number   String                @unique
  institution_id   String
  requested_by     String
  
  // Status workflow
  status           PurchaseRequestStatus @default(pending)
  
  // Approval tracking
  admin_approved_by String?
  admin_approved_at DateTime?
  admin_comments    String?
  institution_approved_by String?
  institution_approved_at DateTime?
  institution_comments String?
  
  // Totals
  total_amount     Decimal              @db.Decimal(12, 2)
  
  notes            String?
  created_at       DateTime             @default(now())
  updated_at       DateTime             @updatedAt

  institution Institution            @relation(fields: [institution_id], references: [id])
  items       PurchaseRequestItem[]

  @@map("purchase_requests")
}

model PurchaseRequestItem {
  id                 String  @id @default(uuid())
  purchase_request_id String
  item_name          String
  category           String
  quantity           Int
  estimated_price    Decimal @db.Decimal(10, 2)
  justification      String?

  purchase_request PurchaseRequest @relation(fields: [purchase_request_id], references: [id], onDelete: Cascade)

  @@map("purchase_request_items")
}

model InventoryAuditRecord {
  id             String   @id @default(uuid())
  institution_id String
  audit_date     DateTime
  audited_by     String
  auditor_name   String
  
  // Summary
  items_audited  Int
  items_ok       Int
  items_missing  Int
  items_damaged  Int
  
  findings       String?
  recommendations String?
  attachments    String[]
  
  created_at     DateTime @default(now())

  institution Institution @relation(fields: [institution_id], references: [id])

  @@map("inventory_audit_records")
}

// ============================================
// CRM MODULE
// ============================================

model CommunicationLog {
  id             String   @id @default(uuid())
  institution_id String
  type           String   // 'call', 'email', 'meeting', 'visit'
  subject        String
  description    String
  contact_person String
  contact_email  String?
  contact_phone  String?
  date           DateTime
  priority       String   @default("medium")
  status         String   @default("completed")
  next_action    String?
  next_action_date DateTime?
  logged_by      String
  created_at     DateTime @default(now())

  institution Institution @relation(fields: [institution_id], references: [id])

  @@map("communication_logs")
}

model Contract {
  id                 String         @id @default(uuid())
  contract_number    String         @unique
  institution_id     String
  
  // Dates
  start_date         DateTime
  end_date           DateTime
  
  // Value
  annual_value       Decimal        @db.Decimal(12, 2)
  payment_terms      String?
  
  // Status
  status             ContractStatus @default(draft)
  
  // Terms
  terms_conditions   String?
  special_clauses    String?
  
  // Renewal
  auto_renewal       Boolean        @default(false)
  renewal_reminder_days Int         @default(30)
  
  signed_by          String?
  signed_at          DateTime?
  created_at         DateTime       @default(now())
  updated_at         DateTime       @updatedAt

  institution Institution @relation(fields: [institution_id], references: [id])

  @@map("contracts")
}

model Invoice {
  id               String        @id @default(uuid())
  invoice_number   String        @unique
  institution_id   String
  
  // Dates
  invoice_date     DateTime
  due_date         DateTime
  
  // Amounts
  subtotal         Decimal       @db.Decimal(12, 2)
  tax_amount       Decimal       @db.Decimal(10, 2) @default(0)
  discount_amount  Decimal       @db.Decimal(10, 2) @default(0)
  total_amount     Decimal       @db.Decimal(12, 2)
  
  // Status
  status           InvoiceStatus @default(draft)
  
  // Payment
  paid_amount      Decimal       @db.Decimal(12, 2) @default(0)
  paid_at          DateTime?
  payment_method   String?
  
  notes            String?
  pdf_url          String?
  created_at       DateTime      @default(now())
  updated_at       DateTime      @updatedAt

  institution Institution    @relation(fields: [institution_id], references: [id])
  line_items  InvoiceLineItem[]

  @@map("invoices")
}

model InvoiceLineItem {
  id           String  @id @default(uuid())
  invoice_id   String
  description  String
  quantity     Int     @default(1)
  unit_price   Decimal @db.Decimal(10, 2)
  total_price  Decimal @db.Decimal(10, 2)

  invoice Invoice @relation(fields: [invoice_id], references: [id], onDelete: Cascade)

  @@map("invoice_line_items")
}

model CRMTask {
  id             String   @id @default(uuid())
  institution_id String?
  title          String
  description    String?
  type           String   // 'follow_up', 'renewal_reminder', 'payment', 'meeting'
  priority       String   @default("medium")
  due_date       DateTime
  completed      Boolean  @default(false)
  completed_at   DateTime?
  assigned_to    String?
  created_by     String
  created_at     DateTime @default(now())

  @@map("crm_tasks")
}

// ============================================
// SURVEYS & FEEDBACK
// ============================================

model Survey {
  id           String       @id @default(uuid())
  title        String
  description  String?
  status       SurveyStatus @default(draft)
  
  // Target
  target_type  String       // 'all', 'institution', 'class'
  
  deadline     DateTime?
  created_by   String
  created_at   DateTime     @default(now())
  updated_at   DateTime     @updatedAt

  questions SurveyQuestion[]
  targets   SurveyTarget[]
  responses SurveyResponse[]

  @@map("surveys")
}

model SurveyQuestion {
  id            String @id @default(uuid())
  survey_id     String
  question_text String
  question_type String // 'mcq', 'rating', 'text', 'linear_scale', 'multiple_select'
  options       Json?
  required      Boolean @default(true)
  order         Int

  survey  Survey                 @relation(fields: [survey_id], references: [id], onDelete: Cascade)
  answers SurveyResponseAnswer[]

  @@map("survey_questions")
}

model SurveyTarget {
  id             String @id @default(uuid())
  survey_id      String
  institution_id String

  survey      Survey      @relation(fields: [survey_id], references: [id], onDelete: Cascade)
  institution Institution @relation(fields: [institution_id], references: [id])

  @@unique([survey_id, institution_id])
  @@map("survey_targets")
}

model SurveyResponse {
  id           String   @id @default(uuid())
  survey_id    String
  student_id   String
  submitted_at DateTime @default(now())

  survey  Survey                 @relation(fields: [survey_id], references: [id])
  student Student                @relation(fields: [student_id], references: [id])
  answers SurveyResponseAnswer[]

  @@unique([survey_id, student_id])
  @@map("survey_responses")
}

model SurveyResponseAnswer {
  id          String @id @default(uuid())
  response_id String
  question_id String
  answer      String?

  response SurveyResponse @relation(fields: [response_id], references: [id], onDelete: Cascade)
  question SurveyQuestion @relation(fields: [question_id], references: [id])

  @@unique([response_id, question_id])
  @@map("survey_response_answers")
}

model Feedback {
  id              String         @id @default(uuid())
  student_id      String
  institution_id  String
  category        String         // 'course', 'officer', 'facility', 'general'
  subject         String
  message         String
  rating          Int?           // 1-5
  is_anonymous    Boolean        @default(false)
  status          FeedbackStatus @default(submitted)
  
  // Admin response
  admin_response  String?
  responded_by    String?
  responded_at    DateTime?
  
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  student Student @relation(fields: [student_id], references: [id])

  @@map("feedback")
}

// ============================================
// GAMIFICATION & CERTIFICATES
// ============================================

model Badge {
  id           String   @id @default(uuid())
  name         String
  description  String
  icon_url     String
  category     String   // 'achievement', 'milestone', 'skill', 'participation'
  criteria     Json     // Conditions to earn badge
  points       Int      @default(0)
  is_active    Boolean  @default(true)
  created_at   DateTime @default(now())

  student_badges StudentBadge[]

  @@map("badges")
}

model StudentBadge {
  id         String   @id @default(uuid())
  student_id String
  badge_id   String
  earned_at  DateTime @default(now())

  student Student @relation(fields: [student_id], references: [id], onDelete: Cascade)
  badge   Badge   @relation(fields: [badge_id], references: [id])

  @@unique([student_id, badge_id])
  @@map("student_badges")
}

model XPRule {
  id          String @id @default(uuid())
  action      String @unique // 'course_complete', 'assessment_pass', 'project_complete', etc.
  description String
  xp_amount   Int
  is_active   Boolean @default(true)

  @@map("xp_rules")
}

model StudentXP {
  id         String   @id @default(uuid())
  student_id String
  action     String
  xp_amount  Int
  source_id  String?  // ID of the activity that earned XP
  earned_at  DateTime @default(now())

  student Student @relation(fields: [student_id], references: [id], onDelete: Cascade)

  @@map("student_xp")
}

model Reward {
  id           String  @id @default(uuid())
  name         String
  description  String
  type         String  // 'digital', 'physical', 'certificate'
  xp_required  Int
  quantity     Int?
  image_url    String?
  is_active    Boolean @default(true)

  @@map("rewards")
}

model CertificateTemplate {
  id                 String                  @id @default(uuid())
  name               String
  description        String?
  activity_type      CertificateActivityType
  template_image_url String
  
  // Name overlay configuration
  name_position_x    Int
  name_position_y    Int
  name_font_size     Int                     @default(24)
  name_font_color    String                  @default("#000000")
  name_font_family   String                  @default("Arial")
  
  is_active          Boolean                 @default(true)
  created_by         String
  created_at         DateTime                @default(now())
  updated_at         DateTime                @updatedAt

  courses            Course[]
  assessments        Assessment[]
  assignments        StandaloneAssignment[]
  events             Event[]
  student_certificates StudentCertificate[]

  @@map("certificate_templates")
}

model StudentCertificate {
  id                String                  @id @default(uuid())
  student_id        String
  template_id       String
  activity_type     CertificateActivityType
  activity_id       String
  activity_name     String
  institution_name  String
  
  issued_date       DateTime                @default(now())
  completion_date   DateTime
  certificate_url   String?
  qr_code_url       String?
  verification_code String                  @unique
  grade             String?

  student  Student             @relation(fields: [student_id], references: [id])
  template CertificateTemplate @relation(fields: [template_id], references: [id])

  @@unique([student_id, activity_type, activity_id])
  @@map("student_certificates")
}

// ============================================
// CALENDAR & TASKS
// ============================================

model CalendarEvent {
  id             String   @id @default(uuid())
  title          String
  description    String?
  start_date     DateTime
  end_date       DateTime
  all_day        Boolean  @default(false)
  type           String   // 'company', 'institution', 'academic', 'holiday'
  institution_id String?
  color          String?
  created_by     String
  created_at     DateTime @default(now())

  institution Institution? @relation(fields: [institution_id], references: [id])

  @@map("calendar_events")
}

model Task {
  id                   String      @id @default(uuid())
  title                String
  description          String
  category             String      // 'administrative', 'operational', 'strategic', 'technical', 'other'
  priority             TaskPriority
  status               TaskStatus  @default(pending)
  
  // Assignment
  created_by_id        String
  created_by_name      String
  created_by_position  String
  assigned_to_id       String
  assigned_to_name     String
  assigned_to_position String
  assigned_to_role     String      // 'system_admin' or 'officer'
  
  // Dates
  due_date             DateTime
  completed_at         DateTime?
  
  // Attachments
  attachments          String[]
  progress_percentage  Int         @default(0)
  
  // Approval workflow
  submitted_at         DateTime?
  approved_by_id       String?
  approved_by_name     String?
  approved_at          DateTime?
  rejection_reason     String?
  
  created_at           DateTime    @default(now())
  updated_at           DateTime    @updatedAt

  creator   User          @relation("TaskCreator", fields: [created_by_id], references: [id])
  assignee  User          @relation("TaskAssignee", fields: [assigned_to_id], references: [id])
  comments  TaskComment[]

  @@map("tasks")
}

model TaskComment {
  id         String   @id @default(uuid())
  task_id    String
  user_id    String
  user_name  String
  comment    String
  created_at DateTime @default(now())

  task Task @relation(fields: [task_id], references: [id], onDelete: Cascade)
  user User @relation(fields: [user_id], references: [id])

  @@map("task_comments")
}

// ============================================
// PERFORMANCE & RATINGS
// ============================================

model PerformanceAppraisal {
  id             String   @id @default(uuid())
  officer_id     String
  period_start   DateTime
  period_end     DateTime
  
  // Scores (1-5)
  teaching_quality     Int?
  student_engagement   Int?
  curriculum_delivery  Int?
  professionalism      Int?
  innovation           Int?
  overall_rating       Decimal? @db.Decimal(3, 2)
  
  // Text fields
  strengths            String?
  areas_of_improvement String?
  goals                String?
  manager_feedback     String?
  self_reflection      String?
  
  // Status
  status               String   @default("draft") // 'draft', 'submitted', 'reviewed', 'finalized'
  
  reviewed_by          String?
  reviewed_at          DateTime?
  created_at           DateTime @default(now())
  updated_at           DateTime @updatedAt

  officer Officer @relation(fields: [officer_id], references: [id])

  @@map("performance_appraisals")
}

model HRRating {
  id             String   @id @default(uuid())
  officer_id     String
  quarter        Int      // 1-4
  year           Int
  
  // Star ratings
  project_stars  Int      @default(0)
  achievement_stars Int   @default(0)
  total_stars    Int      @default(0)
  
  // Details
  projects       Json?    // Array of project ratings
  achievements   String?
  comments       String?
  
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  officer Officer @relation(fields: [officer_id], references: [id])

  @@unique([officer_id, quarter, year])
  @@map("hr_ratings")
}

// ============================================
// ID CONFIGURATION
// ============================================

model IDConfiguration {
  id             String   @id @default(uuid())
  entity_type    String   @unique // 'employee', 'institution', 'student', 'officer'
  prefix         String
  suffix         String?
  separator      String   @default("-")
  include_year   Boolean  @default(true)
  include_month  Boolean  @default(false)
  counter_padding Int     @default(4)
  current_counter Int     @default(0)
  sample_format  String?
  created_at     DateTime @default(now())
  updated_at     DateTime @updatedAt

  @@map("id_configurations")
}

model GeneratedID {
  id           String   @id @default(uuid())
  entity_type  String
  entity_id    String
  generated_id String   @unique
  generated_at DateTime @default(now())
  generated_by String

  @@index([entity_type, entity_id])
  @@map("generated_ids")
}
```

---

## 3. Authentication & Authorization

### 3.1 JWT Authentication

```typescript
// src/utils/jwt.util.ts
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  positionId?: string;
  institutionId?: string;
  tenantId?: string;
}

export const generateTokens = (user: User) => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    positionId: user.position_id || undefined,
    institutionId: user.institution_id || undefined,
    tenantId: user.tenant_id || undefined,
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
};
```

### 3.2 Password Utilities

```typescript
// src/utils/password.util.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  const all = uppercase + lowercase + numbers + special;

  let password = '';
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];

  for (let i = 4; i < length; i++) {
    password += all[crypto.randomInt(all.length)];
  }

  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const validatePasswordStrength = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return { valid: errors.length === 0, errors };
};
```

### 3.3 Authentication Middleware

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { prisma } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    positionId?: string;
    institutionId?: string;
    tenantId?: string;
    visibleFeatures?: string[];
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        position: {
          include: {
            visible_features: true,
          },
        },
      },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive',
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      positionId: user.position_id || undefined,
      institutionId: user.institution_id || undefined,
      tenantId: user.tenant_id || undefined,
      visibleFeatures: user.position?.visible_features.map(f => f.feature) || [],
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};
```

### 3.4 RBAC Middleware

```typescript
// src/middleware/rbac.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserRole } from '@prisma/client';

type RoleOrFeature = UserRole | string;

/**
 * Check if user has required role(s) or feature(s)
 */
export const authorize = (...allowedRolesOrFeatures: RoleOrFeature[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userRole = req.user.role as UserRole;
    const userFeatures = req.user.visibleFeatures || [];

    // Check if any allowed role/feature matches
    const hasAccess = allowedRolesOrFeatures.some(roleOrFeature => {
      // Check if it's a role
      if (Object.values(UserRole).includes(roleOrFeature as UserRole)) {
        return userRole === roleOrFeature;
      }
      // Check if it's a feature
      return userFeatures.includes(roleOrFeature);
    });

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

/**
 * Security definer function for role checks (prevents RLS recursion)
 */
export const hasRole = async (userId: string, role: UserRole): Promise<boolean> => {
  const { prisma } = await import('../config/database');
  
  const userRole = await prisma.userRoleMapping.findFirst({
    where: {
      user_id: userId,
      role: role,
    },
  });

  return !!userRole;
};
```

### 3.5 Institution Isolation Middleware

```typescript
// src/middleware/institution.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Ensures users can only access data from their assigned institution
 * This is critical for Innovation Officers who are institutionally isolated
 */
export const enforceInstitutionIsolation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  // System admins and super admins can access all institutions
  if (['super_admin', 'system_admin'].includes(req.user.role)) {
    return next();
  }

  // Officers and students must have an institution
  if (['officer', 'student'].includes(req.user.role)) {
    if (!req.user.institutionId) {
      return res.status(403).json({
        success: false,
        error: 'No institution assigned to your account',
      });
    }

    // Add institution filter to request for use in controllers
    req.institutionFilter = { institution_id: req.user.institutionId };
  }

  // Management users can access their own institution
  if (req.user.role === 'management') {
    if (!req.user.institutionId) {
      return res.status(403).json({
        success: false,
        error: 'No institution assigned to your account',
      });
    }
    req.institutionFilter = { institution_id: req.user.institutionId };
  }

  next();
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      institutionFilter?: { institution_id: string };
    }
  }
}
```

---

## 4. API Endpoints Documentation

### 4.1 Authentication Endpoints

#### POST /api/v1/auth/login
**Description:** Authenticate user and return tokens

**Request Body:**
```typescript
{
  email: string;      // Required, valid email
  password: string;   // Required, min 8 chars
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    token: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      position_id?: string;
      position_name?: string;
      institution_id?: string;
      must_change_password: boolean;
    };
    tenant?: {
      id: string;
      name: string;
      slug: string;
    };
  };
}
```

**Response (401):**
```typescript
{
  success: false;
  error: "Invalid email or password";
}
```

**Business Logic:**
1. Find user by email
2. Verify password hash
3. Check if user is active
4. Generate JWT tokens
5. Update last_login timestamp
6. Return user data with must_change_password flag

---

#### POST /api/v1/auth/refresh
**Description:** Refresh access token using refresh token

**Request Body:**
```typescript
{
  refreshToken: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    token: string;
    refreshToken: string;
  };
}
```

---

#### POST /api/v1/auth/logout
**Description:** Invalidate user session

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```typescript
{
  success: true;
  message: "Logged out successfully";
}
```

---

#### POST /api/v1/auth/change-password
**Description:** Change password for authenticated user

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
{
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "Password changed successfully";
}
```

**Validation:**
- New password must meet strength requirements
- New password must not match current password
- confirmPassword must match newPassword

---

#### POST /api/v1/auth/force-change-password
**Description:** Force password change on first login

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```typescript
{
  currentPassword: string;  // Temporary password
  newPassword: string;
  confirmPassword: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "Password changed successfully";
  data: {
    must_change_password: false;
  };
}
```

**Business Logic:**
1. Verify current (temporary) password
2. Validate new password strength
3. Hash new password
4. Update user: `must_change_password = false`, `password_changed = true`
5. Log password change in audit

---

#### POST /api/v1/auth/request-reset
**Description:** Request password reset email

**Request Body:**
```typescript
{
  email: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "If an account exists with this email, a reset link has been sent";
}
```

**Business Logic:**
1. Find user by email (don't reveal if not found)
2. Generate secure reset token
3. Store token with 1-hour expiry
4. Send email with reset link
5. Always return success (security)

---

#### POST /api/v1/auth/reset-password
**Description:** Reset password using token from email

**Request Body:**
```typescript
{
  token: string;
  newPassword: string;
  confirmPassword: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  message: "Password reset successfully";
}
```

---

#### GET /api/v1/auth/me
**Description:** Get current authenticated user

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```typescript
{
  success: true;
  data: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: UserRole;
    position_id?: string;
    position_name?: string;
    institution_id?: string;
    tenant_id?: string;
    visible_features: string[];
    must_change_password: boolean;
  };
}
```

---

### 4.2 User Management Endpoints

#### GET /api/v1/users
**Description:** Get all users (paginated)

**Auth:** `system_admin`, `super_admin`

**Query Parameters:**
```
page?: number (default: 1)
limit?: number (default: 20)
role?: UserRole
search?: string
institution_id?: string
position_id?: string
is_active?: boolean
```

**Response (200):**
```typescript
{
  success: true;
  data: {
    users: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

---

#### POST /api/v1/users
**Description:** Create new user

**Auth:** `system_admin`, `super_admin`

**Request Body:**
```typescript
{
  email: string;
  name: string;
  role: UserRole;
  position_id?: string;
  institution_id?: string;
  tenant_id?: string;
  password?: string;        // If not provided, auto-generate
  auto_generate_password?: boolean;
}
```

**Response (201):**
```typescript
{
  success: true;
  data: {
    user: User;
    temporaryPassword?: string;  // Only returned if auto-generated
  };
  message: "User created successfully";
}
```

---

#### GET /api/v1/users/:id
**Description:** Get user by ID

**Auth:** `system_admin`, `super_admin`, or self

**Response (200):**
```typescript
{
  success: true;
  data: User;
}
```

---

#### PATCH /api/v1/users/:id
**Description:** Update user

**Auth:** `system_admin`, `super_admin`

**Request Body:**
```typescript
{
  name?: string;
  email?: string;
  role?: UserRole;
  position_id?: string;
  institution_id?: string;
  is_active?: boolean;
  hourly_rate?: number;
  overtime_rate_multiplier?: number;
  normal_working_hours?: number;
}
```

---

#### DELETE /api/v1/users/:id
**Description:** Soft delete user (set is_active = false)

**Auth:** `system_admin`, `super_admin`

---

### 4.3 Position Management Endpoints

#### GET /api/v1/positions
**Description:** Get all positions

**Auth:** `system_admin`

**Response (200):**
```typescript
{
  success: true;
  data: Position[];
}
```

---

#### POST /api/v1/positions
**Description:** Create new position

**Auth:** `system_admin` with `position_management` feature, or CEO

**Request Body:**
```typescript
{
  position_name: string;
  display_name: string;
  description?: string;
  visible_features: string[];
  is_ceo_position?: boolean;
}
```

**Response (201):**
```typescript
{
  success: true;
  data: Position;
}
```

**Business Logic:**
1. Validate position_name is unique
2. If is_ceo_position, ensure only one CEO position exists
3. Create position
4. Create PositionFeature records for each visible_feature

---

#### PATCH /api/v1/positions/:id
**Description:** Update position

**Auth:** `system_admin` with `position_management` feature

**Request Body:**
```typescript
{
  position_name?: string;
  display_name?: string;
  description?: string;
  visible_features?: string[];
}
```

**Business Logic:**
- CEO position cannot have `position_management` feature removed
- Deletes existing PositionFeature records and recreates

---

#### DELETE /api/v1/positions/:id
**Description:** Delete position

**Auth:** `system_admin` with `position_management` feature

**Business Logic:**
- Cannot delete CEO position
- Cannot delete if users are assigned

---

#### GET /api/v1/positions/:id/features
**Description:** Get features for a specific position

**Auth:** `system_admin`

**Response (200):**
```typescript
{
  success: true;
  data: {
    position_id: string;
    features: string[];
  };
}
```

---

### 4.4 Institution Endpoints

#### GET /api/v1/institutions
**Description:** Get all institutions

**Auth:** `system_admin`, `management` (filtered to own)

**Query Parameters:**
```
page?: number
limit?: number
search?: string
is_active?: boolean
city?: string
state?: string
```

---

#### POST /api/v1/institutions
**Description:** Create new institution

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  name: string;
  display_name?: string;
  address: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  phone: string;
  email: string;
  website?: string;
  principal_name?: string;
  principal_email?: string;
  principal_phone?: string;
  
  // Agreement/Pricing
  per_student_cost?: number;
  lms_cost?: number;
  lap_setup_cost?: number;
  monthly_recurring_cost?: number;
  trainer_monthly_fee?: number;
  agreement_start_date?: string;
  agreement_end_date?: string;
  
  // GPS
  gps_latitude?: number;
  gps_longitude?: number;
  gps_radius_meters?: number;
  
  tenant_id: string;
}
```

**Business Logic:**
1. Generate institution_id using ID configuration
2. Create institution record
3. Return institution (credential_configured = false)

---

#### PATCH /api/v1/institutions/:id
**Description:** Update institution

---

#### DELETE /api/v1/institutions/:id
**Description:** Soft delete institution

---

#### POST /api/v1/institutions/:id/gps-config
**Description:** Set GPS configuration for institution

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  gps_latitude: number;
  gps_longitude: number;
  gps_radius_meters: number;
}
```

---

#### GET /api/v1/institutions/:id/classes
**Description:** Get all classes for an institution

**Response (200):**
```typescript
{
  success: true;
  data: InstitutionClass[];
}
```

---

#### POST /api/v1/institutions/:id/classes
**Description:** Create class in institution

**Request Body:**
```typescript
{
  class_name: string;
  section?: string;
  academic_year: string;
  capacity?: number;
  room_number?: string;
  class_teacher_id?: string;
}
```

---

#### GET /api/v1/institutions/:id/periods
**Description:** Get period configuration

---

#### POST /api/v1/institutions/:id/periods
**Description:** Set period configuration

**Request Body:**
```typescript
{
  periods: Array<{
    period_number: number;
    name: string;
    start_time: string;
    end_time: string;
    is_break: boolean;
  }>;
}
```

---

### 4.5 Officer Endpoints

#### GET /api/v1/officers
**Description:** Get all officers

**Auth:** `system_admin`

**Query Parameters:**
```
page?: number
limit?: number
search?: string
institution_id?: string
status?: string
```

---

#### POST /api/v1/officers
**Description:** Create new officer

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  // User data
  email: string;
  name: string;
  password?: string;
  auto_generate_password?: boolean;
  
  // Officer data
  designation: string;
  specialization?: string;
  phone: string;
  emergency_contact?: string;
  date_of_joining: string;
  date_of_birth?: string;
  blood_group?: string;
  qualification?: string;
  experience_years?: number;
  
  // Salary
  hourly_rate: number;
  overtime_rate_multiplier?: number;
  normal_working_hours?: number;
  salary_type?: string;
  
  // Leave allowances
  casual_leave_balance?: number;
  sick_leave_balance?: number;
  earned_leave_balance?: number;
  
  // Assignment
  institution_id: string;
}
```

**Business Logic:**
1. Create User with role='officer'
2. Generate officer_id using ID configuration
3. Create Officer record
4. Create OfficerAssignment
5. Create LeaveBalance for current year
6. Return officer with temporary password if auto-generated

---

#### GET /api/v1/officers/:id
**Description:** Get officer by ID

---

#### PATCH /api/v1/officers/:id
**Description:** Update officer

---

#### DELETE /api/v1/officers/:id
**Description:** Deactivate officer

---

#### GET /api/v1/officers/:id/timetable
**Description:** Get officer's timetable

**Response (200):**
```typescript
{
  success: true;
  data: {
    officer_id: string;
    slots: TimetableSlot[];
    total_hours: number;
  };
}
```

---

#### POST /api/v1/officers/:id/leave-balance
**Description:** Set officer leave balance

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  year: number;
  casual_total: number;
  sick_total: number;
  earned_total: number;
}
```

---

#### GET /api/v1/officers/:id/attendance
**Description:** Get officer attendance records

**Query Parameters:**
```
month: number
year: number
```

---

### 4.6 Student Endpoints

#### GET /api/v1/students
**Description:** Get all students

**Auth:** `system_admin`, `management`, `officer` (filtered by institution)

**Query Parameters:**
```
page?: number
limit?: number
search?: string
institution_id?: string
class_id?: string
class?: string
section?: string
status?: string
```

---

#### POST /api/v1/students
**Description:** Create new student

**Auth:** `system_admin`, `management`

**Request Body:**
```typescript
{
  student_name: string;
  roll_number: string;
  admission_number: string;
  class: string;
  section: string;
  class_id: string;
  institution_id: string;
  admission_date: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  address: string;
  blood_group?: string;
  previous_school?: string;
}
```

**Business Logic:**
1. Generate student_id using ID configuration (lifelong ID)
2. Optionally create User account
3. Create Student record
4. Update institution total_students count

---

#### POST /api/v1/students/bulk-upload
**Description:** Bulk upload students from CSV

**Auth:** `system_admin`, `management`

**Request:** `multipart/form-data` with CSV file

**Response (200):**
```typescript
{
  success: true;
  data: {
    imported: number;
    updated: number;
    skipped: number;
    failed: number;
    errors: Array<{
      row: number;
      roll_number: string;
      error: string;
    }>;
  };
}
```

---

#### GET /api/v1/students/institution/:institutionId
**Description:** Get students by institution

**Auth:** `system_admin`, `management`, `officer` (own institution only)

---

#### GET /api/v1/students/class/:classId
**Description:** Get students by class

---

### 4.7 Course Endpoints

#### GET /api/v1/courses
**Description:** Get all courses

**Query Parameters:**
```
page?: number
limit?: number
search?: string
category?: string
difficulty?: string
status?: string
```

---

#### POST /api/v1/courses
**Description:** Create new course

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  course_code: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnail_url?: string;
  duration_hours: number;
  prerequisites?: string[];
  learning_outcomes?: string[];
  sdg_goals?: number[];
  certificate_template_id?: string;
}
```

---

#### GET /api/v1/courses/:id
**Description:** Get course by ID with full structure

**Response (200):**
```typescript
{
  success: true;
  data: {
    ...course,
    levels: Array<{
      ...level,
      sessions: Array<{
        ...session,
        contents: Content[];
      }>;
    }>;
  };
}
```

---

#### PATCH /api/v1/courses/:id
**Description:** Update course

---

#### DELETE /api/v1/courses/:id
**Description:** Archive course

---

#### POST /api/v1/courses/:id/levels
**Description:** Add level to course

**Request Body:**
```typescript
{
  level_number: number;
  title: string;
  description?: string;
}
```

---

#### POST /api/v1/courses/:courseId/levels/:levelId/sessions
**Description:** Add session to level

---

#### POST /api/v1/courses/sessions/:sessionId/contents
**Description:** Add content to session

**Request Body:**
```typescript
{
  title: string;
  type: ContentType;
  content_url?: string;
  content_data?: object;
  duration_minutes?: number;
  order: number;
  is_mandatory?: boolean;
}
```

---

#### POST /api/v1/courses/:id/assign-class
**Description:** Assign course to class with level access

**Request Body:**
```typescript
{
  class_id: string;
  accessible_levels: number[];  // Array of level numbers
}
```

---

#### POST /api/v1/content/:contentId/complete
**Description:** Mark content as complete for a student

**Auth:** `student`, `officer`

**Request Body:**
```typescript
{
  student_id?: string;  // Required if officer is marking
}
```

---

#### POST /api/v1/content/:contentId/complete-batch
**Description:** Mark content complete for all present students in a class

**Auth:** `officer`

**Request Body:**
```typescript
{
  class_id: string;
  present_student_ids: string[];
  session_context?: string;
}
```

**Business Logic:**
1. Get officer info for completion metadata
2. For each student in present_student_ids:
   - Create/update ContentProgress with completed=true
   - Set completed_by_id, completed_by_name, session_context
3. Create ContentCompletion audit record

---

### 4.8 Assessment Endpoints

#### GET /api/v1/assessments
**Description:** Get all assessments

**Auth:** `system_admin`, `officer` (filtered by institution)

---

#### POST /api/v1/assessments
**Description:** Create new assessment

**Auth:** `system_admin`, `officer`

**Request Body:**
```typescript
{
  title: string;
  description?: string;
  instructions?: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_results?: boolean;
  allow_review?: boolean;
  max_attempts?: number;
  start_date?: string;
  end_date?: string;
  institution_id?: string;  // Required for officers
  certificate_template_id?: string;
  
  questions: Array<{
    question_text: string;
    question_type: string;
    options?: Array<{id: string; text: string; isCorrect: boolean}>;
    correct_answer?: string;
    marks: number;
    order: number;
    explanation?: string;
    image_url?: string;
  }>;
  
  publishing?: Array<{
    institution_id: string;
    class_ids: string[];
  }>;
}
```

**Business Logic:**
- If created by officer, set institution_id and created_by_role='officer'
- If created by system_admin, created_by_role='system_admin'

---

#### PATCH /api/v1/assessments/:id
**Description:** Update assessment

---

#### DELETE /api/v1/assessments/:id
**Description:** Archive assessment

---

#### POST /api/v1/assessments/:id/publish
**Description:** Publish assessment to institutions/classes

**Request Body:**
```typescript
{
  publishing: Array<{
    institution_id: string;
    class_ids: string[];
  }>;
}
```

---

#### POST /api/v1/assessments/:id/attempt
**Description:** Start assessment attempt

**Auth:** `student`

**Response (200):**
```typescript
{
  success: true;
  data: {
    attempt_id: string;
    questions: Question[];  // Shuffled if enabled
    duration_minutes: number;
    started_at: string;
  };
}
```

---

#### POST /api/v1/assessments/attempts/:attemptId/submit
**Description:** Submit assessment attempt

**Auth:** `student`

**Request Body:**
```typescript
{
  answers: Array<{
    question_id: string;
    answer: string;
  }>;
}
```

**Business Logic:**
1. Calculate score based on correct answers
2. Determine if passed
3. Update attempt with score, percentage, passed, submitted_at
4. If passed and certificate_template_id exists, auto-award certificate
5. Award XP based on XP rules

---

#### GET /api/v1/assessments/:id/analytics
**Description:** Get assessment analytics

**Auth:** `system_admin`, `officer`

---

### 4.9 Assignment Endpoints

#### GET /api/v1/assignments
**Description:** Get all assignments

---

#### POST /api/v1/assignments
**Description:** Create new assignment

**Request Body:**
```typescript
{
  title: string;
  description: string;
  instructions?: string;
  assignment_type: 'file_upload' | 'text' | 'url' | 'multi_question';
  start_date?: string;
  due_date: string;
  max_file_size_mb?: number;
  allowed_file_types?: string[];
  max_submissions?: number;
  late_submission_policy?: string;
  late_penalty_percent?: number;
  total_points: number;
  passing_points?: number;
  grading_type?: string;
  certificate_template_id?: string;
  
  questions?: Array<{...}>;  // For multi_question type
  rubrics?: Array<{
    criteria: string;
    description?: string;
    max_points: number;
    order: number;
  }>;
  
  publishing?: Array<{
    institution_id: string;
    class_ids: string[];
  }>;
}
```

---

#### PATCH /api/v1/assignments/:id
**Description:** Update assignment

---

#### POST /api/v1/assignments/:id/submit
**Description:** Submit assignment

**Auth:** `student`

**Request:** `multipart/form-data` for file uploads

**Request Body:**
```typescript
{
  submitted_text?: string;
  submitted_url?: string;
  answers?: Array<{question_id: string; answer: string}>;
  // files attached via multipart
}
```

---

#### POST /api/v1/assignments/submissions/:submissionId/grade
**Description:** Grade assignment submission

**Auth:** `system_admin`, `officer`

**Request Body:**
```typescript
{
  grade: number;
  feedback?: string;
  rubric_scores?: Array<{
    rubric_id: string;
    score: number;
  }>;
}
```

**Business Logic:**
1. Update submission with grade, feedback, graded_by, graded_at
2. Calculate percentage
3. If passed and certificate exists, auto-award certificate
4. Award XP

---

### 4.10 Project Endpoints

#### GET /api/v1/projects
**Description:** Get all projects

**Auth:** `system_admin`, `management`, `officer` (filtered), `student` (own projects)

---

#### POST /api/v1/projects
**Description:** Create new project

**Auth:** `officer`

**Request Body:**
```typescript
{
  title: string;
  description: string;
  category: string;
  start_date?: string;
  end_date?: string;
  sdg_goals?: number[];
  thumbnail_url?: string;
  
  members: Array<{
    student_id: string;
    role: 'leader' | 'member';
    class: string;
    section: string;
  }>;
}
```

**Business Logic:**
1. Verify officer can only create for their institution
2. Generate project_id
3. Create project with institution_id from officer's assignment
4. Create ProjectMember records
5. Students automatically see project in their dashboard

---

#### PATCH /api/v1/projects/:id
**Description:** Update project

---

#### POST /api/v1/projects/:id/progress
**Description:** Add progress update

**Request Body:**
```typescript
{
  title: string;
  description: string;
  progress: number;  // 0-100
  attachments?: string[];
}
```

---

#### POST /api/v1/projects/:id/assign-event
**Description:** Assign project to event

**Request Body:**
```typescript
{
  event_id: string;
}
```

---

### 4.11 Event Endpoints

#### GET /api/v1/events
**Description:** Get all events

---

#### POST /api/v1/events
**Description:** Create new event

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  title: string;
  description: string;
  event_type: string;
  institution_id?: string;  // null for company-wide
  start_date: string;
  end_date: string;
  registration_deadline?: string;
  venue?: string;
  is_virtual?: boolean;
  virtual_link?: string;
  max_participants?: number;
  banner_url?: string;
  certificate_template_id?: string;
}
```

---

#### POST /api/v1/events/:id/interest
**Description:** Express interest in event

**Auth:** `student`

**Business Logic:**
1. Verify student's institution can participate (if institution-specific)
2. Check registration deadline
3. Check max participants
4. Create EventInterest record
5. Bidirectional: interest appears in Officer/Admin dashboards

---

#### GET /api/v1/events/:id/interests
**Description:** Get interested students for event

**Auth:** `system_admin`, `officer` (filtered by institution)

---

### 4.12 Leave Management Endpoints

#### GET /api/v1/leave/applications
**Description:** Get leave applications

**Auth:** Based on role:
- `officer`, `system_admin` (meta_staff): own applications
- `system_admin` with manager approval feature: pending manager approvals
- `system_admin` with AGM approval feature: pending AGM approvals
- `system_admin` with CEO approval feature: pending CEO approvals

---

#### POST /api/v1/leave/applications
**Description:** Create leave application

**Auth:** `officer`, `system_admin` (meta_staff)

**Request Body:**
```typescript
{
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  supporting_docs?: string[];
  substitute_officer_id?: string;  // For officers only
}
```

**Business Logic:**
1. Validate leave balance
2. Calculate leave days
3. Create LeaveApplication with status='pending'
4. If officer, create SubstituteAssignment records for affected timetable slots
5. Notify appropriate approver(s)

---

#### POST /api/v1/leave/applications/:id/approve
**Description:** Approve leave application

**Auth:** Based on applicant_type and current approval stage

**Request Body:**
```typescript
{
  comments?: string;
}
```

**Business Logic (Officers - 2-stage):**
1. Manager approves → status='manager_approved'
2. AGM approves → status='approved', deduct leave balance

**Business Logic (Meta Staff - 1-stage):**
1. CEO approves → status='approved', deduct leave balance

---

#### POST /api/v1/leave/applications/:id/reject
**Description:** Reject leave application

**Request Body:**
```typescript
{
  comments: string;  // Required
}
```

---

#### GET /api/v1/leave/balance/:userId
**Description:** Get leave balance for user

---

### 4.13 Attendance Endpoints

#### POST /api/v1/attendance/check-in
**Description:** Officer/Staff check-in with GPS

**Auth:** `officer`, `system_admin` (meta_staff)

**Request Body:**
```typescript
{
  latitude: number;
  longitude: number;
}
```

**Business Logic:**
1. Get user's assigned institution (for officers)
2. Validate GPS coordinates against institution config
3. Create/update attendance record with:
   - check_in_time
   - check_in_latitude, check_in_longitude
   - check_in_validated (based on GPS validation)
4. Return validation status

---

#### POST /api/v1/attendance/check-out
**Description:** Officer/Staff check-out with GPS

**Request Body:**
```typescript
{
  latitude: number;
  longitude: number;
}
```

**Business Logic:**
1. Find today's attendance record
2. Update with check-out data
3. Calculate total_hours and overtime_hours
4. Overtime = max(0, total_hours - normal_working_hours)

---

#### GET /api/v1/attendance/officer/:officerId
**Description:** Get officer attendance records

**Query Parameters:**
```
month: number
year: number
```

---

#### GET /api/v1/attendance/staff/:staffId
**Description:** Get meta staff attendance records

---

### 4.14 Payroll Endpoints

#### GET /api/v1/payroll/officers/:officerId
**Description:** Get officer payroll records

**Query Parameters:**
```
month?: number
year?: number
```

---

#### POST /api/v1/payroll/generate
**Description:** Generate payroll for month

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  officer_id?: string;  // If not provided, generate for all
  month: number;
  year: number;
}
```

**Business Logic:**
See Section 5.2 for detailed payroll calculation logic.

---

#### POST /api/v1/payroll/:id/approve
**Description:** Approve payroll

**Auth:** `system_admin` (CEO/AGM)

---

#### POST /api/v1/payroll/:id/reject
**Description:** Reject payroll

**Request Body:**
```typescript
{
  reason: string;
}
```

---

#### GET /api/v1/payroll/:id/payslip
**Description:** Get/Generate payslip PDF

---

### 4.15 Inventory Endpoints

#### GET /api/v1/inventory
**Description:** Get inventory items

**Auth:** `system_admin`, `management`, `officer` (filtered)

---

#### POST /api/v1/inventory
**Description:** Add inventory item

**Auth:** `officer`, `system_admin`

**Request Body:**
```typescript
{
  institution_id: string;
  item_code: string;
  name: string;
  category: string;
  description?: string;
  quantity: number;
  min_quantity?: number;
  unit?: string;
  location?: string;
  shelf_number?: string;
  condition?: string;
  unit_price?: number;
}
```

---

#### PATCH /api/v1/inventory/:id
**Description:** Update inventory item

---

#### POST /api/v1/inventory/purchase-requests
**Description:** Create purchase request

**Auth:** `officer`

**Request Body:**
```typescript
{
  institution_id: string;
  items: Array<{
    item_name: string;
    category: string;
    quantity: number;
    estimated_price: number;
    justification?: string;
  }>;
  notes?: string;
}
```

---

#### POST /api/v1/inventory/purchase-requests/:id/admin-approve
**Description:** System Admin approval (stage 1)

**Auth:** `system_admin`

---

#### POST /api/v1/inventory/purchase-requests/:id/institution-approve
**Description:** Institution approval (stage 2)

**Auth:** `management`

---

#### POST /api/v1/inventory/audit-records
**Description:** Create audit record

**Auth:** `officer`

**Request Body:**
```typescript
{
  institution_id: string;
  items_audited: number;
  items_ok: number;
  items_missing: number;
  items_damaged: number;
  findings?: string;
  recommendations?: string;
  attachments?: string[];
}
```

---

### 4.16 Survey & Feedback Endpoints

#### GET /api/v1/surveys
**Description:** Get surveys

**Auth:** `system_admin`, `student` (targeted surveys only)

---

#### POST /api/v1/surveys
**Description:** Create survey

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  title: string;
  description?: string;
  target_type: 'all' | 'institution' | 'class';
  target_institution_ids?: string[];
  deadline?: string;
  
  questions: Array<{
    question_text: string;
    question_type: string;
    options?: any;
    required?: boolean;
    order: number;
  }>;
}
```

---

#### POST /api/v1/surveys/:id/respond
**Description:** Submit survey response

**Auth:** `student`

**Request Body:**
```typescript
{
  answers: Array<{
    question_id: string;
    answer: string;
  }>;
}
```

---

#### GET /api/v1/surveys/:id/responses
**Description:** Get survey responses

**Auth:** `system_admin`

---

#### GET /api/v1/feedback
**Description:** Get feedback

**Auth:** `system_admin`, `student` (own feedback)

---

#### POST /api/v1/feedback
**Description:** Submit feedback

**Auth:** `student`

**Request Body:**
```typescript
{
  category: string;
  subject: string;
  message: string;
  rating?: number;
  is_anonymous?: boolean;
}
```

---

#### POST /api/v1/feedback/:id/respond
**Description:** Respond to feedback

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  admin_response: string;
  status: FeedbackStatus;
}
```

---

### 4.17 Gamification Endpoints

#### GET /api/v1/gamification/badges
**Description:** Get all badges

---

#### POST /api/v1/gamification/badges
**Description:** Create badge

**Auth:** `system_admin`

---

#### GET /api/v1/gamification/xp-rules
**Description:** Get XP rules

---

#### POST /api/v1/gamification/xp-rules
**Description:** Create/Update XP rule

**Auth:** `system_admin`

---

#### GET /api/v1/gamification/rewards
**Description:** Get rewards

---

#### GET /api/v1/gamification/leaderboard/:scope
**Description:** Get leaderboard

**Query Parameters:**
```
scope: 'global' | 'institution' | 'class'
institution_id?: string
class_id?: string
limit?: number
```

**Response (200):**
```typescript
{
  success: true;
  data: Array<{
    rank: number;
    student_id: string;
    student_name: string;
    total_xp: number;
    badge_count: number;
  }>;
}
```

---

### 4.18 Certificate Endpoints

#### GET /api/v1/certificates/templates
**Description:** Get certificate templates

**Auth:** `system_admin`

---

#### POST /api/v1/certificates/templates
**Description:** Create certificate template

**Auth:** `system_admin`

**Request:** `multipart/form-data`

**Request Body:**
```typescript
{
  name: string;
  description?: string;
  activity_type: CertificateActivityType;
  template_image: File;  // Uploaded image
  name_position_x: number;
  name_position_y: number;
  name_font_size?: number;
  name_font_color?: string;
  name_font_family?: string;
}
```

---

#### POST /api/v1/certificates/generate
**Description:** Generate certificate for student

**Auth:** `system_admin`, automatic (via triggers)

**Request Body:**
```typescript
{
  student_id: string;
  template_id: string;
  activity_type: CertificateActivityType;
  activity_id: string;
  activity_name: string;
  institution_name: string;
  completion_date: string;
  grade?: string;
}
```

**Business Logic:**
1. Generate unique verification_code
2. Generate QR code with verification URL
3. Render certificate image with student name overlay
4. Upload to storage
5. Create StudentCertificate record

---

#### GET /api/v1/certificates/student/:studentId
**Description:** Get student's certificates

**Auth:** `student` (own), `system_admin`

---

#### GET /api/v1/certificates/verify/:code
**Description:** Verify certificate (public endpoint)

**Response (200):**
```typescript
{
  success: true;
  data: {
    student_name: string;
    activity_name: string;
    activity_type: string;
    institution_name: string;
    issued_date: string;
    grade?: string;
    valid: true;
  };
}
```

---

### 4.19 Task Endpoints

#### GET /api/v1/tasks
**Description:** Get tasks

**Auth:** Based on role and feature:
- Creator: tasks they created
- Assignee: tasks assigned to them
- `task_management` feature: all tasks

---

#### POST /api/v1/tasks
**Description:** Create task

**Auth:** `system_admin` with `task_management` feature

**Request Body:**
```typescript
{
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  assigned_to_id: string;
  due_date: string;
  attachments?: string[];
}
```

---

#### PATCH /api/v1/tasks/:id
**Description:** Update task

---

#### POST /api/v1/tasks/:id/submit-for-approval
**Description:** Submit task for approval

**Auth:** Task assignee

---

#### POST /api/v1/tasks/:id/approve
**Description:** Approve completed task

**Auth:** Task creator

---

#### POST /api/v1/tasks/:id/reject
**Description:** Reject task

**Auth:** Task creator

**Request Body:**
```typescript
{
  rejection_reason: string;
}
```

---

#### POST /api/v1/tasks/:id/comments
**Description:** Add comment to task

---

### 4.20 Timetable Endpoints

#### GET /api/v1/timetable/institution/:institutionId
**Description:** Get institution timetable

---

#### POST /api/v1/timetable/institution/:institutionId
**Description:** Create/Update institution timetable slots

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  slots: Array<{
    officer_id: string;
    class_id: string;
    day: string;
    start_time: string;
    end_time: string;
    subject: string;
    room?: string;
    type?: TimetableSlotType;
    batch?: string;
    course_id?: string;
  }>;
}
```

---

#### GET /api/v1/timetable/officer/:officerId
**Description:** Get officer's timetable

---

#### GET /api/v1/timetable/class/:classId
**Description:** Get class timetable

---

#### GET /api/v1/timetable/student/:studentId
**Description:** Get student's timetable (based on class)

---

#### POST /api/v1/timetable/sync/:institutionId
**Description:** Sync institution timetable to officers

**Auth:** `system_admin`

**Business Logic:**
1. Get all institution timetable assignments
2. Create/update TimetableSlot records for each officer
3. Return sync status

---

### 4.21 Calendar Endpoints

#### GET /api/v1/calendar/events
**Description:** Get calendar events

**Query Parameters:**
```
start_date: string
end_date: string
type?: string
institution_id?: string
```

---

#### POST /api/v1/calendar/events
**Description:** Create calendar event

**Auth:** `system_admin`

---

#### GET /api/v1/calendar/holidays
**Description:** Get holidays

---

#### POST /api/v1/calendar/holidays
**Description:** Create holiday

---

### 4.22 Performance Endpoints

#### GET /api/v1/performance/appraisals
**Description:** Get performance appraisals

**Auth:** `system_admin`

---

#### POST /api/v1/performance/appraisals
**Description:** Create appraisal

**Auth:** `system_admin`

---

#### GET /api/v1/performance/hr-ratings
**Description:** Get HR ratings

---

#### POST /api/v1/performance/hr-ratings
**Description:** Create/Update HR rating

---

### 4.23 Report Endpoints

#### GET /api/v1/reports/dashboard/system
**Description:** Get system admin dashboard metrics

**Auth:** `system_admin`

**Response (200):**
```typescript
{
  success: true;
  data: {
    total_institutions: number;
    total_officers: number;
    total_students: number;
    active_courses: number;
    monthly_revenue: number;
    attendance_rate: number;
    project_completion_rate: number;
    // ... more metrics
  };
}
```

---

#### GET /api/v1/reports/dashboard/officer/:officerId
**Description:** Get officer dashboard data

---

#### GET /api/v1/reports/dashboard/student/:studentId
**Description:** Get student dashboard data

---

#### GET /api/v1/reports/institution/:institutionId/monthly
**Description:** Get monthly institution report

**Query Parameters:**
```
month: number
year: number
```

---

#### GET /api/v1/reports/invoice/:institutionId/generate
**Description:** Generate monthly invoice report

**Query Parameters:**
```
month: number
year: number
```

---

### 4.24 Credential Management Endpoints

#### GET /api/v1/credentials/users
**Description:** Get users for credential management

**Auth:** `system_admin` with `credential_management` feature

**Query Parameters:**
```
type: 'meta_staff' | 'institution' | 'student'
search?: string
institution_id?: string
```

---

#### POST /api/v1/credentials/set-password
**Description:** Admin set password for user

**Auth:** `system_admin` with `credential_management` feature

**Request Body:**
```typescript
{
  user_id: string;
  password?: string;
  auto_generate?: boolean;
}
```

---

#### POST /api/v1/credentials/send-reset-link
**Description:** Send password reset link

**Auth:** `system_admin` with `credential_management` feature

**Request Body:**
```typescript
{
  user_id: string;
}
```

---

### 4.25 ID Configuration Endpoints

#### GET /api/v1/id-config
**Description:** Get all ID configurations

**Auth:** `system_admin`

---

#### POST /api/v1/id-config
**Description:** Create/Update ID configuration

**Auth:** `system_admin`

**Request Body:**
```typescript
{
  entity_type: string;
  prefix: string;
  suffix?: string;
  separator?: string;
  include_year?: boolean;
  include_month?: boolean;
  counter_padding?: number;
}
```

---

#### GET /api/v1/id-config/:entityType/preview
**Description:** Preview next generated ID

**Response (200):**
```typescript
{
  success: true;
  data: {
    preview: "MSD-2024-0001";
  };
}
```

---

## 5. Special Business Logic

### 5.1 GPS Validation Logic

```typescript
// src/utils/gps.util.ts

interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @returns Distance in meters
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Validate if user is within institution's GPS radius
 */
export const validateGPSLocation = (
  userCoords: Coordinates,
  institutionCoords: Coordinates,
  radiusMeters: number
): { valid: boolean; distance: number } => {
  const distance = calculateDistance(userCoords, institutionCoords);
  return {
    valid: distance <= radiusMeters,
    distance: Math.round(distance),
  };
};
```

### 5.2 Payroll Calculation Logic

```typescript
// src/utils/payroll.util.ts

import Decimal from 'decimal.js';

interface PayrollInput {
  officer: {
    hourly_rate: number;
    overtime_rate_multiplier: number;
    normal_working_hours: number;
  };
  attendance: {
    working_days: number;
    days_present: number;
    days_absent: number;
    days_leave: number;
    total_hours: number;
    overtime_hours: number;
  };
  deductions?: {
    pf_applicable?: boolean;
    esi_applicable?: boolean;
    pt_applicable?: boolean;
    tds_applicable?: boolean;
    other_deductions?: number;
  };
}

interface PayrollOutput {
  earnings: {
    basic_pay: number;
    overtime_pay: number;
    gross_salary: number;
  };
  deductions: {
    pf_employee: number;
    pf_employer: number;
    esi_employee: number;
    esi_employer: number;
    professional_tax: number;
    tds: number;
    other_deductions: number;
    total_deductions: number;
  };
  net_pay: number;
}

export const calculatePayroll = (input: PayrollInput): PayrollOutput => {
  const { officer, attendance, deductions = {} } = input;
  
  // Calculate basic pay (total hours × hourly rate)
  const basicPay = new Decimal(attendance.total_hours)
    .times(officer.hourly_rate)
    .toNumber();
  
  // Calculate overtime pay (overtime hours × hourly rate × overtime multiplier)
  const overtimePay = new Decimal(attendance.overtime_hours)
    .times(officer.hourly_rate)
    .times(officer.overtime_rate_multiplier)
    .toNumber();
  
  const grossSalary = basicPay + overtimePay;
  
  // Calculate deductions
  let pfEmployee = 0;
  let pfEmployer = 0;
  if (deductions.pf_applicable !== false) {
    // PF is 12% of basic (capped at ₹15,000 basic)
    const pfBase = Math.min(basicPay, 15000);
    pfEmployee = new Decimal(pfBase).times(0.12).toNumber();
    pfEmployer = pfEmployee;
  }
  
  let esiEmployee = 0;
  let esiEmployer = 0;
  if (deductions.esi_applicable !== false && grossSalary <= 21000) {
    // ESI applicable only if gross <= ₹21,000
    esiEmployee = new Decimal(grossSalary).times(0.0075).toNumber();
    esiEmployer = new Decimal(grossSalary).times(0.0325).toNumber();
  }
  
  let professionalTax = 0;
  if (deductions.pt_applicable !== false) {
    // Maharashtra PT slabs
    if (grossSalary > 10000) {
      professionalTax = 200;
    } else if (grossSalary > 7500) {
      professionalTax = 175;
    }
  }
  
  // TDS (simplified - actual TDS requires annual income projection)
  let tds = 0;
  if (deductions.tds_applicable !== false) {
    const annualIncome = grossSalary * 12;
    if (annualIncome > 1000000) {
      tds = new Decimal(grossSalary).times(0.30).toNumber();
    } else if (annualIncome > 500000) {
      tds = new Decimal(grossSalary).times(0.20).toNumber();
    } else if (annualIncome > 250000) {
      tds = new Decimal(grossSalary).times(0.05).toNumber();
    }
  }
  
  const otherDeductions = deductions.other_deductions || 0;
  
  const totalDeductions = pfEmployee + esiEmployee + professionalTax + tds + otherDeductions;
  const netPay = grossSalary - totalDeductions;
  
  return {
    earnings: {
      basic_pay: Math.round(basicPay * 100) / 100,
      overtime_pay: Math.round(overtimePay * 100) / 100,
      gross_salary: Math.round(grossSalary * 100) / 100,
    },
    deductions: {
      pf_employee: Math.round(pfEmployee * 100) / 100,
      pf_employer: Math.round(pfEmployer * 100) / 100,
      esi_employee: Math.round(esiEmployee * 100) / 100,
      esi_employer: Math.round(esiEmployer * 100) / 100,
      professional_tax: Math.round(professionalTax * 100) / 100,
      tds: Math.round(tds * 100) / 100,
      other_deductions: Math.round(otherDeductions * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
    },
    net_pay: Math.round(netPay * 100) / 100,
  };
};
```

### 5.3 Leave Approval Workflow

```typescript
// src/modules/leave/leave.service.ts

import { prisma } from '../../config/database';
import { LeaveStatus } from '@prisma/client';

interface ApprovalResult {
  success: boolean;
  newStatus: LeaveStatus;
  message: string;
}

export const processLeaveApproval = async (
  leaveApplicationId: string,
  approverId: string,
  approverRole: string,
  action: 'approve' | 'reject',
  comments?: string
): Promise<ApprovalResult> => {
  const application = await prisma.leaveApplication.findUnique({
    where: { id: leaveApplicationId },
    include: { approvals: true },
  });

  if (!application) {
    throw new Error('Leave application not found');
  }

  // OFFICER WORKFLOW (2-stage)
  if (application.applicant_type === 'officer') {
    if (application.status === 'pending' && approverRole === 'manager') {
      // Stage 1: Manager approval
      if (action === 'reject') {
        await updateLeaveStatus(leaveApplicationId, 'rejected', approverId, approverRole, comments);
        return { success: true, newStatus: 'rejected', message: 'Leave rejected by manager' };
      }
      
      await updateLeaveStatus(leaveApplicationId, 'manager_approved', approverId, approverRole, comments);
      // Notify AGM
      return { success: true, newStatus: 'manager_approved', message: 'Approved by manager, pending AGM approval' };
    }
    
    if (application.status === 'manager_approved' && approverRole === 'agm') {
      // Stage 2: AGM approval
      if (action === 'reject') {
        await updateLeaveStatus(leaveApplicationId, 'rejected', approverId, approverRole, comments);
        return { success: true, newStatus: 'rejected', message: 'Leave rejected by AGM' };
      }
      
      await updateLeaveStatus(leaveApplicationId, 'approved', approverId, approverRole, comments);
      await deductLeaveBalance(application);
      return { success: true, newStatus: 'approved', message: 'Leave approved' };
    }
  }

  // META STAFF WORKFLOW (1-stage, CEO only)
  if (application.applicant_type === 'meta_staff') {
    if (application.status === 'pending' && approverRole === 'ceo') {
      if (action === 'reject') {
        await updateLeaveStatus(leaveApplicationId, 'rejected', approverId, approverRole, comments);
        return { success: true, newStatus: 'rejected', message: 'Leave rejected' };
      }
      
      await updateLeaveStatus(leaveApplicationId, 'approved', approverId, approverRole, comments);
      await deductLeaveBalance(application);
      return { success: true, newStatus: 'approved', message: 'Leave approved' };
    }
  }

  throw new Error('Invalid approval action for current status');
};

const updateLeaveStatus = async (
  id: string,
  status: LeaveStatus,
  approverId: string,
  approverRole: string,
  comments?: string
) => {
  await prisma.$transaction([
    prisma.leaveApplication.update({
      where: { id },
      data: { status },
    }),
    prisma.leaveApproval.create({
      data: {
        leave_application_id: id,
        approver_id: approverId,
        approver_role: approverRole,
        status: status === 'rejected' ? 'rejected' : 'approved',
        comments,
      },
    }),
  ]);
};

const deductLeaveBalance = async (application: any) => {
  const year = new Date().getFullYear();
  const days = calculateLeaveDays(application.start_date, application.end_date);
  
  const balanceField = `${application.leave_type}_used`;
  
  await prisma.leaveBalance.update({
    where: {
      user_id_year: {
        user_id: application.applicant_id,
        year,
      },
    },
    data: {
      [balanceField]: { increment: days },
    },
  });
};

const calculateLeaveDays = (startDate: Date, endDate: Date): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};
```

### 5.4 ID Generation Logic

```typescript
// src/utils/id-generator.util.ts

import { prisma } from '../config/database';

export const generateEntityId = async (entityType: string): Promise<string> => {
  const config = await prisma.iDConfiguration.findUnique({
    where: { entity_type: entityType },
  });

  if (!config) {
    throw new Error(`ID configuration not found for entity type: ${entityType}`);
  }

  // Increment counter
  const updatedConfig = await prisma.iDConfiguration.update({
    where: { entity_type: entityType },
    data: { current_counter: { increment: 1 } },
  });

  const parts: string[] = [];

  // Prefix
  if (config.prefix) {
    parts.push(config.prefix);
  }

  // Year
  if (config.include_year) {
    parts.push(new Date().getFullYear().toString());
  }

  // Month
  if (config.include_month) {
    parts.push((new Date().getMonth() + 1).toString().padStart(2, '0'));
  }

  // Counter
  const counter = updatedConfig.current_counter.toString().padStart(config.counter_padding, '0');
  parts.push(counter);

  // Suffix
  if (config.suffix) {
    parts.push(config.suffix);
  }

  const generatedId = parts.join(config.separator);

  // Log generated ID
  await prisma.generatedID.create({
    data: {
      entity_type: entityType,
      entity_id: '', // Will be updated after entity creation
      generated_id: generatedId,
      generated_by: 'system',
    },
  });

  return generatedId;
};

// Usage examples:
// generateEntityId('student') => "MSD-2024-0001"
// generateEntityId('officer') => "OFF-KGA-001"
// generateEntityId('institution') => "INST-2024-001"
```

### 5.5 Certificate Generation Logic

```typescript
// src/utils/certificate.util.ts

import sharp from 'sharp';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { uploadFile } from './storage.util';

interface CertificateData {
  studentName: string;
  activityName: string;
  activityType: string;
  institutionName: string;
  completionDate: Date;
  grade?: string;
}

interface TemplateConfig {
  templateImageUrl: string;
  namePositionX: number;
  namePositionY: number;
  nameFontSize: number;
  nameFontColor: string;
  nameFontFamily: string;
}

export const generateCertificate = async (
  data: CertificateData,
  template: TemplateConfig
): Promise<{
  certificateUrl: string;
  qrCodeUrl: string;
  verificationCode: string;
}> => {
  // Generate unique verification code
  const verificationCode = `CERT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  
  // Generate QR code
  const verificationUrl = `${process.env.APP_URL}/verify-certificate/${verificationCode}`;
  const qrCodeBuffer = await QRCode.toBuffer(verificationUrl, {
    width: 150,
    margin: 1,
  });
  
  // Download template image
  const templateResponse = await fetch(template.templateImageUrl);
  const templateBuffer = Buffer.from(await templateResponse.arrayBuffer());
  
  // Get image dimensions
  const metadata = await sharp(templateBuffer).metadata();
  const width = metadata.width || 1920;
  const height = metadata.height || 1080;
  
  // Create SVG overlay for text
  const svgText = `
    <svg width="${width}" height="${height}">
      <style>
        .name { 
          fill: ${template.nameFontColor}; 
          font-size: ${template.nameFontSize}px; 
          font-family: ${template.nameFontFamily};
          font-weight: bold;
        }
      </style>
      <text 
        x="${template.namePositionX}" 
        y="${template.namePositionY}" 
        class="name"
        text-anchor="middle"
      >
        ${data.studentName}
      </text>
    </svg>
  `;
  
  // Composite certificate
  const certificateBuffer = await sharp(templateBuffer)
    .composite([
      {
        input: Buffer.from(svgText),
        top: 0,
        left: 0,
      },
      {
        input: qrCodeBuffer,
        top: height - 180,
        left: width - 180,
      },
    ])
    .png()
    .toBuffer();
  
  // Upload to storage
  const certificateUrl = await uploadFile(
    certificateBuffer,
    `certificates/${verificationCode}.png`,
    'image/png'
  );
  
  const qrCodeUrl = await uploadFile(
    qrCodeBuffer,
    `qrcodes/${verificationCode}.png`,
    'image/png'
  );
  
  return {
    certificateUrl,
    qrCodeUrl,
    verificationCode,
  };
};
```

---

## 6. OpenAPI/Swagger Specification

```yaml
# openapi.yaml (excerpt)
openapi: 3.0.3
info:
  title: Meta-Innova API
  description: |
    Backend API for Meta-Innova Innovation Academy Platform.
    Multi-tenant SaaS platform for educational institutions.
  version: 1.0.0
  contact:
    name: Meta-Innova Support
    email: support@metainnova.com

servers:
  - url: https://api.metainnova.com/api/v1
    description: Production
  - url: http://localhost:3000/api/v1
    description: Development

tags:
  - name: Authentication
    description: User authentication and authorization
  - name: Users
    description: User management
  - name: Institutions
    description: Institution management
  - name: Officers
    description: Innovation Officer management
  - name: Students
    description: Student management
  - name: Courses
    description: Course and learning management
  - name: Assessments
    description: Assessment management
  - name: Assignments
    description: Assignment management
  - name: Projects
    description: Project management
  - name: Events
    description: Event management
  - name: Leave
    description: Leave management
  - name: Attendance
    description: Attendance tracking
  - name: Payroll
    description: Payroll management
  - name: Inventory
    description: Inventory management
  - name: CRM
    description: Client relationship management
  - name: Surveys
    description: Surveys and feedback
  - name: Gamification
    description: Gamification and certificates
  - name: Tasks
    description: Task management
  - name: Reports
    description: Reports and analytics

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        role:
          type: string
          enum: [super_admin, system_admin, management, officer, teacher, student]
        position_id:
          type: string
          format: uuid
        institution_id:
          type: string
          format: uuid
        must_change_password:
          type: boolean
    
    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
        password:
          type: string
          minLength: 8
    
    LoginResponse:
      type: object
      properties:
        success:
          type: boolean
        data:
          type: object
          properties:
            token:
              type: string
            refreshToken:
              type: string
            user:
              $ref: '#/components/schemas/User'
    
    Error:
      type: object
      properties:
        success:
          type: boolean
          default: false
        error:
          type: string

paths:
  /auth/login:
    post:
      tags:
        - Authentication
      summary: Login user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: Successful login
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
  
  /auth/me:
    get:
      tags:
        - Authentication
      summary: Get current user
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Current user data
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    $ref: '#/components/schemas/User'

# ... (additional paths for all endpoints)
```

---

## 7. Postman Collection

```json
{
  "info": {
    "name": "Meta-Innova API",
    "description": "Complete API collection for Meta-Innova Platform",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ],
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{token}}",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "var jsonData = pm.response.json();",
                  "if (jsonData.success && jsonData.data.token) {",
                  "    pm.collectionVariables.set('token', jsonData.data.token);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"email\": \"system@metainnova.com\",\n    \"password\": \"system123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/auth/me",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "me"]
            }
          }
        },
        {
          "name": "Change Password",
          "request": {
            "method": "POST",
            "body": {
              "mode": "raw",
              "raw": "{\n    \"currentPassword\": \"system123\",\n    \"newPassword\": \"NewPass123!\",\n    \"confirmPassword\": \"NewPass123!\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/auth/change-password",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "change-password"]
            }
          }
        }
      ]
    },
    {
      "name": "Institutions",
      "item": [
        {
          "name": "Get All Institutions",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/institutions",
              "host": ["{{baseUrl}}"],
              "path": ["institutions"]
            }
          }
        },
        {
          "name": "Create Institution",
          "request": {
            "method": "POST",
            "body": {
              "mode": "raw",
              "raw": "{\n    \"name\": \"Modern School Vasant Vihar\",\n    \"address\": \"Vasant Vihar\",\n    \"city\": \"New Delhi\",\n    \"state\": \"Delhi\",\n    \"pincode\": \"110057\",\n    \"phone\": \"+91-11-26151514\",\n    \"email\": \"admin@modernschool.edu\",\n    \"tenant_id\": \"tenant-uuid\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/institutions",
              "host": ["{{baseUrl}}"],
              "path": ["institutions"]
            }
          }
        }
      ]
    },
    {
      "name": "Officers",
      "item": [
        {
          "name": "Get All Officers",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/officers",
              "host": ["{{baseUrl}}"],
              "path": ["officers"]
            }
          }
        },
        {
          "name": "Create Officer",
          "request": {
            "method": "POST",
            "body": {
              "mode": "raw",
              "raw": "{\n    \"email\": \"atif.ansari@metainnova.com\",\n    \"name\": \"Mr. Atif Ansari\",\n    \"auto_generate_password\": true,\n    \"designation\": \"Innovation Officer\",\n    \"phone\": \"+91-9876543210\",\n    \"date_of_joining\": \"2024-01-15\",\n    \"hourly_rate\": 500,\n    \"institution_id\": \"inst-msd-001\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/officers",
              "host": ["{{baseUrl}}"],
              "path": ["officers"]
            }
          }
        }
      ]
    },
    {
      "name": "Attendance",
      "item": [
        {
          "name": "Check In",
          "request": {
            "method": "POST",
            "body": {
              "mode": "raw",
              "raw": "{\n    \"latitude\": 28.5574,\n    \"longitude\": 77.1641\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/attendance/check-in",
              "host": ["{{baseUrl}}"],
              "path": ["attendance", "check-in"]
            }
          }
        },
        {
          "name": "Check Out",
          "request": {
            "method": "POST",
            "body": {
              "mode": "raw",
              "raw": "{\n    \"latitude\": 28.5574,\n    \"longitude\": 77.1641\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "{{baseUrl}}/attendance/check-out",
              "host": ["{{baseUrl}}"],
              "path": ["attendance", "check-out"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 8. Developer Setup Guide

### 8.1 Prerequisites

- Node.js 20+
- npm or yarn
- PostgreSQL (or Neon account)
- Git

### 8.2 Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/metainnova/backend.git
cd backend

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Update .env with your values
# - DATABASE_URL (Neon connection string)
# - JWT_SECRET (generate: openssl rand -base64 32)
# - Other required values

# 5. Generate Prisma client
npx prisma generate

# 6. Run migrations
npx prisma migrate dev

# 7. Seed database
npx prisma db seed

# 8. Start development server
npm run dev
```

### 8.3 Database Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.util';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Meta-Innova',
      slug: 'metainnova',
    },
  });

  // Create positions
  const ceoPosition = await prisma.position.create({
    data: {
      position_name: 'ceo',
      display_name: 'Chief Executive Officer',
      is_ceo_position: true,
      created_by: 'system',
      visible_features: {
        create: [
          { feature: 'institution_management' },
          { feature: 'course_management' },
          { feature: 'officer_management' },
          { feature: 'attendance_payroll' },
          { feature: 'leave_approvals' },
          { feature: 'reports_analytics' },
          { feature: 'credential_management' },
          { feature: 'position_management' },
          { feature: 'task_management' },
          { feature: 'crm_management' },
        ],
      },
    },
  });

  // Create System Admin (CEO)
  const systemAdmin = await prisma.user.create({
    data: {
      email: 'system@metainnova.com',
      password_hash: await hashPassword('system123'),
      name: 'System Administrator',
      role: 'system_admin',
      position_id: ceoPosition.id,
      is_ceo: true,
      tenant_id: tenant.id,
      must_change_password: false,
      password_changed: true,
    },
  });

  // Create Institutions
  const modernSchool = await prisma.institution.create({
    data: {
      institution_id: 'inst-msd-001',
      tenant_id: tenant.id,
      name: 'Modern School Vasant Vihar',
      address: 'Vasant Vihar',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110057',
      phone: '+91-11-26151514',
      email: 'admin@modernschool.edu',
      gps_latitude: 28.5574,
      gps_longitude: 77.1641,
      gps_radius_meters: 100,
      total_students: 350,
    },
  });

  const kikaniAcademy = await prisma.institution.create({
    data: {
      institution_id: 'inst-kga-001',
      tenant_id: tenant.id,
      name: 'Kikani Global Academy',
      address: 'Coimbatore',
      city: 'Coimbatore',
      state: 'Tamil Nadu',
      country: 'India',
      pincode: '641001',
      phone: '+91-422-2345678',
      email: 'admin@kikaniacademy.edu',
      gps_latitude: 11.0168,
      gps_longitude: 76.9558,
      gps_radius_meters: 100,
      total_students: 520,
    },
  });

  // Create Officers
  const atifUser = await prisma.user.create({
    data: {
      email: 'atif.ansari@metainnova.com',
      password_hash: await hashPassword('officer123'),
      name: 'Mr. Atif Ansari',
      role: 'officer',
      tenant_id: tenant.id,
      institution_id: modernSchool.id,
      must_change_password: true,
    },
  });

  await prisma.officer.create({
    data: {
      user_id: atifUser.id,
      officer_id: 'OFF-MSD-001',
      designation: 'Innovation Officer',
      phone: '+91-9876543210',
      date_of_joining: new Date('2024-01-15'),
      hourly_rate: 500,
      overtime_rate_multiplier: 1.5,
      normal_working_hours: 8,
      casual_leave_balance: 12,
      sick_leave_balance: 12,
      earned_leave_balance: 15,
      assignments: {
        create: {
          institution_id: modernSchool.id,
          start_date: new Date('2024-01-15'),
          is_primary: true,
        },
      },
    },
  });

  // Create ID Configurations
  await prisma.iDConfiguration.createMany({
    data: [
      {
        entity_type: 'student',
        prefix: 'STU',
        include_year: true,
        counter_padding: 4,
      },
      {
        entity_type: 'officer',
        prefix: 'OFF',
        include_year: false,
        counter_padding: 3,
      },
      {
        entity_type: 'institution',
        prefix: 'INST',
        include_year: true,
        counter_padding: 3,
      },
    ],
  });

  // Create sample courses
  await prisma.course.create({
    data: {
      course_code: 'AI-101',
      title: 'Introduction to Artificial Intelligence',
      description: 'Comprehensive introduction to AI concepts and applications',
      category: 'Core STEM & Technology',
      difficulty: 'beginner',
      status: 'published',
      duration_hours: 40,
      prerequisites: [],
      learning_outcomes: [
        'Understand fundamental AI concepts',
        'Apply machine learning basics',
        'Develop simple AI projects',
      ],
      sdg_goals: [4, 9],
      created_by: systemAdmin.id,
      levels: {
        create: [
          {
            level_number: 1,
            title: 'AI Fundamentals',
            sessions: {
              create: [
                {
                  title: 'What is AI?',
                  order: 1,
                  contents: {
                    create: [
                      {
                        title: 'Introduction to AI Video',
                        type: 'video',
                        content_url: 'https://youtube.com/watch?v=example',
                        duration_minutes: 15,
                        order: 1,
                      },
                      {
                        title: 'AI History PDF',
                        type: 'pdf',
                        content_url: '/content/ai-history.pdf',
                        order: 2,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 8.4 Connecting Frontend

Update your frontend environment:

```env
# Frontend .env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_USE_MOCK_API=false
```

Update API service:

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 9. Error Code Reference

| Code | HTTP Status | Message | Description |
|------|-------------|---------|-------------|
| AUTH_001 | 401 | Invalid email or password | Login credentials incorrect |
| AUTH_002 | 401 | Token expired | JWT has expired |
| AUTH_003 | 401 | Invalid token | JWT malformed or invalid |
| AUTH_004 | 403 | Account disabled | User account is inactive |
| AUTH_005 | 400 | Password requirements not met | Password doesn't meet strength requirements |
| AUTH_006 | 400 | Password change required | Must change temporary password |
| PERM_001 | 403 | Insufficient permissions | User lacks required role/feature |
| PERM_002 | 403 | Institution access denied | User trying to access another institution's data |
| VAL_001 | 400 | Validation error | Request body validation failed |
| VAL_002 | 400 | Missing required field | Required field not provided |
| VAL_003 | 400 | Invalid format | Field format is invalid |
| RES_001 | 404 | Resource not found | Requested resource doesn't exist |
| RES_002 | 409 | Resource already exists | Duplicate resource |
| RES_003 | 409 | Resource in use | Cannot delete resource with dependencies |
| GPS_001 | 400 | GPS validation failed | User outside allowed radius |
| GPS_002 | 400 | GPS coordinates required | Check-in/out requires location |
| LEAVE_001 | 400 | Insufficient leave balance | Not enough leave days |
| LEAVE_002 | 400 | Invalid approval stage | Wrong approver for current status |
| PAY_001 | 400 | Payroll already exists | Payroll for month/year already generated |
| PAY_002 | 400 | Attendance incomplete | Cannot generate payroll without attendance |
| SYS_001 | 500 | Internal server error | Unexpected server error |
| SYS_002 | 503 | Service unavailable | Temporary service outage |

### Error Response Format

```typescript
{
  success: false,
  error: {
    code: "AUTH_001",
    message: "Invalid email or password",
    details?: any  // Optional additional info
  }
}
```

---

## 10. Deployment Guide

### 10.1 Vercel Deployment

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/app.ts"
    }
  ]
}
```

### 10.2 Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...@neon.tech/metainnova?sslmode=require
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
ALLOWED_ORIGINS=https://yourdomain.com
```

### 10.3 Database Migration (Production)

```bash
# Generate migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy
```

### 10.4 Health Check Endpoint

```typescript
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});
```

---

## Appendix A: Feature Permission Mapping

| Feature Key | Display Name | Default Roles |
|-------------|--------------|---------------|
| institution_management | Institution Management | CEO, MD, AGM |
| course_management | Course Management | CEO, MD, AGM, GM |
| assessment_management | Assessment Management | CEO, MD, AGM, GM, Manager |
| assignment_management | Assignment Management | CEO, MD, AGM, GM, Manager |
| event_management | Event Management | CEO, MD, AGM, GM |
| officer_management | Officer Management | CEO, MD, AGM |
| project_management | Project Management | CEO, MD, AGM, GM, Manager |
| inventory_management | Inventory Management | CEO, MD, AGM, GM, Manager |
| attendance_payroll | Attendance & Payroll | CEO, MD, AGM |
| leave_approvals | Leave Approvals | CEO (meta staff), Manager + AGM (officers) |
| institutional_calendar | Institutional Calendar | CEO, MD, AGM, GM, Manager |
| reports_analytics | Reports & Invoice | CEO, MD, AGM, GM |
| sdg_management | SDG Management | CEO, MD, AGM |
| task_management | Task Management | CEO, MD, AGM, GM |
| task_allotment | Task Allotment | Manager, Admin Staff |
| credential_management | Credential Management | CEO, MD, AGM |
| gamification | Gamification | CEO, MD, AGM, GM, Manager |
| id_configuration | ID Configuration | CEO, MD, AGM |
| survey_feedback | Surveys & Feedback | CEO, MD, AGM, GM, Manager |
| performance_ratings | Performance & Ratings | CEO, MD, AGM |
| crm_management | CRM & Client Relations | CEO, MD, AGM, GM |
| position_management | Position Management | CEO only (cannot be disabled) |

---

## Appendix B: Database Index Strategy

```sql
-- High-frequency query indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_students_institution ON students(institution_id);
CREATE INDEX idx_students_class ON students(class_id);
CREATE INDEX idx_attendance_officer_date ON attendance_records(officer_id, date);
CREATE INDEX idx_leave_applicant_status ON leave_applications(applicant_id, status);
CREATE INDEX idx_timetable_officer ON timetable_slots(officer_id);
CREATE INDEX idx_timetable_class ON timetable_slots(class_id);
CREATE INDEX idx_content_progress_student ON content_progress(student_id);
CREATE INDEX idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_projects_institution ON projects(institution_id);
CREATE INDEX idx_events_institution ON events(institution_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

## Appendix C: API Rate Limits

| Endpoint Category | Rate Limit | Window |
|-------------------|------------|--------|
| Authentication | 5 requests | 15 minutes |
| Password Reset | 3 requests | 1 hour |
| File Upload | 10 requests | 1 minute |
| General API | 100 requests | 15 minutes |
| Reports/Analytics | 20 requests | 1 minute |
| Bulk Operations | 5 requests | 5 minutes |

---

**Document End**

*This documentation is auto-generated and matches the frontend implementation. For questions or updates, contact the development team.*
