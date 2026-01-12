# Assessment, Assignment & Event Management Systems
## Complete Backend Development Documentation

> **Version:** 1.0  
> **Platform:** Meta-Innova Innovation Academy  
> **Last Updated:** December 2024  
> **Purpose:** Backend development reference for three interconnected management systems

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Assessment Management System](#2-assessment-management-system)
3. [Assignment Management System](#3-assignment-management-system)
4. [Event Management System](#4-event-management-system)
5. [Bidirectional Data Flow](#5-bidirectional-data-flow)
6. [Database Schema](#6-database-schema)
7. [API Endpoints Specification](#7-api-endpoints-specification)
8. [Backend Infrastructure](#8-backend-infrastructure)
9. [Security Considerations](#9-security-considerations)
10. [Frontend Components Reference](#10-frontend-components-reference)

---

## 1. System Architecture Overview

### 1.1 Multi-Dashboard Integration

All three systems (Assessment, Assignment, Event) follow the same multi-tenant architecture with bidirectional synchronization across four dashboard types:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        META-INNOVA PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  SYSTEM ADMIN    │    │ INNOVATION       │    │  MANAGEMENT      │       │
│  │  DASHBOARD       │    │ OFFICER          │    │  DASHBOARD       │       │
│  │                  │    │ DASHBOARD        │    │                  │       │
│  │  • Create All    │───▶│  • View All      │    │  • View          │       │
│  │  • Publish       │    │  • Create Own    │───▶│    Institution   │       │
│  │  • Manage        │    │  • Review        │    │    Data          │       │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘       │
│           │                       │                       │                  │
│           │                       │                       │                  │
│           ▼                       ▼                       ▼                  │
│  ┌──────────────────────────────────────────────────────────────────┐       │
│  │                      STUDENT DASHBOARD                            │       │
│  │                                                                   │       │
│  │  • View Available Assessments/Assignments/Events                 │       │
│  │  • Take Assessments → Results sync back to Admin/Officer         │       │
│  │  • Submit Assignments → Grading syncs back                       │       │
│  │  • Express Event Interest → Syncs to Officer/Management          │       │
│  └──────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Role-Based Access Summary

| Role | Assessment | Assignment | Event |
|------|------------|------------|-------|
| **System Admin** | Create, Publish to All Institutions | Create, Publish to All Institutions | Create, Manage All Events |
| **Innovation Officer** | View All + Create Institution-Specific | View All + Create Institution-Specific | View All + Review Institution Students |
| **Management** | View Institution Analytics | View Institution Analytics | View Events + Institution Participation |
| **Student** | Take Assessments, View Results | Submit Assignments, View Grades | View Events, Express Interest |

### 1.3 Institutional Isolation Principle

```
CRITICAL: All data filtering happens at institution level

Innovation Officer → Can ONLY see/create for assigned institution
Management → Can ONLY see their institution's data
Students → Can ONLY see assessments/assignments published to their institution + class
```

---

## 2. Assessment Management System

### 2.1 System Overview

MCQ-based assessment system with automatic grading, timed tests, and comprehensive analytics.

**Key Features:**
- Multiple Choice Questions (MCQ) only
- Auto-evaluation with immediate scoring
- Time-limited assessments (overall duration)
- Shuffle questions option
- Results and review after submission
- Certificate attachment for passing

### 2.2 Assessment Data Model

```typescript
interface Assessment {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'unpublished' | 'upcoming' | 'ongoing' | 'completed';
  
  // Timing
  start_time: string;      // ISO datetime - when assessment becomes available
  end_time: string;        // ISO datetime - when assessment closes
  duration_minutes: number; // Total time allowed to complete
  
  // Scoring
  total_points: number;
  pass_percentage: number;  // e.g., 70 for 70%
  
  // Settings
  auto_submit: boolean;     // Auto-submit when time runs out
  auto_evaluate: boolean;   // Auto-grade immediately
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  allow_review_after_submission: boolean;
  
  // Publishing - which institutions/classes can access
  published_to: AssessmentPublishing[];
  
  // Questions
  question_count: number;
  questions?: AssessmentQuestion[];
  
  // Certificate
  certificate_template_id?: string;
  
  // Metadata
  created_by: string;
  created_by_role: 'system_admin' | 'officer';
  institution_id?: string;  // Only for officer-created assessments
  created_at: string;
  updated_at: string;
}

interface AssessmentPublishing {
  institution_id: string;
  institution_name: string;
  class_ids: string[];
  class_names: string[];
}

interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_number: number;
  question_text: string;
  question_type: 'mcq';
  
  options: MCQOption[];
  correct_option_id: string;
  
  points: number;
  image_url?: string;
  code_snippet?: string;
  explanation?: string;  // Shown after submission
  
  order: number;
  created_at: string;
}

interface MCQOption {
  id: string;
  option_label: string;  // A, B, C, D
  option_text: string;
  order: number;
}

interface AssessmentAttempt {
  id: string;
  assessment_id: string;
  student_id: string;
  student_name: string;
  institution_id: string;
  institution_name: string;
  class_id: string;
  class_name: string;
  
  started_at: string;
  submitted_at?: string;
  time_taken_seconds?: number;
  
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  
  answers: AssessmentAnswer[];
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'evaluated';
}

interface AssessmentAnswer {
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  points_earned: number;
  time_spent_seconds: number;
}
```

### 2.3 Dashboard Breakdown

#### 2.3.1 System Admin Dashboard - Assessment Management

**Route:** `/system-admin/assessment-management`

**Tab Structure:**
| Tab | Function | Components |
|-----|----------|------------|
| **All Assessments** | View, filter, search all assessments | Assessment cards with status badges, action buttons (View, Edit, Delete) |
| **Create Assessment** | 5-step wizard for creating new assessments | Multi-step form with validation |

**Create Assessment Wizard (5 Steps):**

```
Step 1: Basic Info
├── Title (required)
├── Description (required)
├── Duration in minutes (required)
├── Start Date/Time (required)
├── End Date/Time (required)
├── Pass Percentage (default: 70)
└── Certificate Template Selection (optional)

Step 2: Settings
├── Auto Submit (toggle)
├── Auto Evaluate (toggle)
├── Shuffle Questions (toggle)
├── Show Results Immediately (toggle)
└── Allow Review After Submission (toggle)

Step 3: Questions
├── Add Question Button
├── Question List (drag-drop reorder)
│   ├── Question Text
│   ├── 4 Options (A, B, C, D)
│   ├── Correct Answer Selection
│   ├── Points for Question
│   ├── Image Upload (optional)
│   ├── Code Snippet (optional)
│   └── Explanation (optional)
└── Delete Question

Step 4: Publishing
├── Institution Selection (multi-select)
└── For Each Institution:
    └── Class Selection (multi-select)

Step 5: Review
├── Summary of all details
├── Question preview
├── Publishing summary
└── Create Assessment Button
```

**Assessment Card Actions:**
- **View**: Opens AssessmentDetailsDialog showing full details + analytics
- **Edit**: Opens EditAssessmentDialog with tabbed interface for quick edits
- **Delete**: Confirmation dialog before deletion

#### 2.3.2 Innovation Officer Dashboard - Assessment Management

**Route:** `/officer/assessment-management`

**Tab Structure:**
| Tab | Function | Description |
|-----|----------|-------------|
| **All Assessments** | View assessments published to officer's institution | Lists System Admin assessments + Institution-specific assessments |
| **Create Assessment** | Create assessment ONLY for assigned institution | Same 5-step wizard but institution is auto-set |

**Key Difference from System Admin:**
```
System Admin:
- Can publish to ANY institution
- created_by_role = 'system_admin'
- institution_id = null

Innovation Officer:
- Can ONLY publish to assigned institution
- created_by_role = 'officer'
- institution_id = officer's assigned institution
- Class selection only shows classes from assigned institution
```

**All Assessments Tab Filtering:**
```typescript
// Officer sees assessments where:
// 1. published_to contains their institution_id, OR
// 2. institution_id === officer's institution_id (officer-created)

const officerAssessments = allAssessments.filter(assessment => 
  assessment.published_to.some(pub => pub.institution_id === officerInstitutionId) ||
  assessment.institution_id === officerInstitutionId
);
```

#### 2.3.3 Student Dashboard - Assessments

**Route:** `/student/assessments`

**Tab Structure:**
| Tab | Function | Data Source |
|-----|----------|-------------|
| **Available** | Assessments ready to take | status='published', within start/end time, not attempted |
| **Completed** | Assessments already submitted | Student's attempts with status='submitted' or 'evaluated' |
| **Upcoming** | Scheduled but not yet available | status='published', start_time > now |

**Available Tab Features:**
- Assessment cards with title, duration, question count, points
- "Start Assessment" button
- Time remaining indicator
- Countdown to deadline

**Completed Tab Features:**
- Score display (points and percentage)
- Pass/Fail badge
- "View Results" button (if allow_review_after_submission=true)
- Time taken display
- Certificate download (if passed and certificate attached)

**Upcoming Tab Features:**
- Assessment info cards
- Countdown to availability
- "Notify Me" option (optional)

**Taking Assessment Flow:**
```
1. Student clicks "Start Assessment"
2. System creates AssessmentAttempt with status='in_progress'
3. Timer starts (duration_minutes countdown)
4. Questions displayed (shuffled if shuffle_questions=true)
5. Student selects answers
6. Student clicks Submit OR timer runs out (auto_submit)
7. If auto_evaluate=true:
   - System grades immediately
   - Score calculated
   - passed = percentage >= pass_percentage
8. Attempt status = 'submitted' or 'auto_submitted'
9. If show_results_immediately=true:
   - Show results page with answers
   - If allow_review_after_submission=true: Show correct answers + explanations
10. If passed AND certificate_template_id exists:
    - Generate certificate
    - Add to student's certificates
```

#### 2.3.4 Management Dashboard - Assessments (View Only)

**Route:** `/management/assessment-analytics` (or tab within another page)

**Features:**
- View assessment performance for institution
- Analytics: completion rates, average scores, pass rates
- Student-wise breakdown
- Class-wise breakdown
- No creation/editing capabilities

---

## 3. Assignment Management System

### 3.1 System Overview

Flexible assignment system supporting multiple submission types with manual grading workflow.

**Key Features:**
- Multiple submission types (file, text, URL, multi-question)
- Rubric-based grading
- Late submission handling
- Feedback with file attachments
- Draft saving

### 3.2 Assignment Data Model

```typescript
type AssignmentType = 'file_upload' | 'text_submission' | 'url_submission' | 'multi_question';
type AssignmentStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
type SubmissionStatus = 'not_started' | 'draft' | 'submitted' | 'late_submitted' | 'graded' | 'returned';
type LateSubmissionPolicy = 'not_allowed' | 'allowed_with_penalty' | 'allowed_no_penalty';

interface StandaloneAssignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  assignment_type: AssignmentType;
  status: AssignmentStatus;
  
  // Timing
  start_date: string;
  due_date: string;
  end_date?: string;  // Hard deadline after which no submissions
  
  // Submission Settings
  max_file_size_mb?: number;
  allowed_file_types?: string[];
  max_files?: number;
  allow_late_submission: boolean;
  late_submission_policy: LateSubmissionPolicy;
  late_penalty_percentage?: number;
  
  // Grading
  total_points: number;
  pass_percentage: number;
  rubric?: AssignmentRubric[];
  
  // Publishing
  published_to: AssignmentPublishing[];
  
  // Questions (for multi_question type)
  questions?: AssignmentQuestion[];
  
  // Attachments (reference materials)
  attachments?: AssignmentAttachment[];
  
  // Certificate
  certificate_template_id?: string;
  
  // Metadata
  created_by: string;
  created_by_role: 'system_admin' | 'officer';
  institution_id?: string;
  created_at: string;
  updated_at: string;
}

interface AssignmentPublishing {
  institution_id: string;
  institution_name: string;
  class_ids: string[];
  class_names: string[];
}

interface AssignmentRubric {
  id: string;
  criteria: string;
  description?: string;
  max_points: number;
  levels: RubricLevel[];
}

interface RubricLevel {
  score: number;
  label: string;      // e.g., "Excellent", "Good", "Needs Improvement"
  description: string;
}

interface AssignmentQuestion {
  id: string;
  question_number: number;
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false' | 'fill_blank';
  options?: { id: string; text: string; is_correct?: boolean }[];
  correct_answer?: string;
  points: number;
  explanation?: string;
}

interface StandaloneAssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  institution_id: string;
  class_id: string;
  
  // Submission Content
  text_content?: string;
  url?: string;
  files?: SubmissionFile[];
  answers?: AssignmentAnswer[];
  
  // Status
  status: SubmissionStatus;
  submitted_at?: string;
  is_late: boolean;
  
  // Grading
  grade?: number;
  percentage?: number;
  passed?: boolean;
  feedback?: string;
  rubric_scores?: RubricScore[];
  feedback_files?: string[];
  
  graded_by?: string;
  graded_at?: string;
  
  // Draft
  draft_content?: string;
  draft_saved_at?: string;
}

interface SubmissionFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
}

interface AssignmentAnswer {
  question_id: string;
  answer_text?: string;
  selected_option_id?: string;
  is_correct?: boolean;
  points_earned?: number;
  feedback?: string;
}

interface RubricScore {
  rubric_id: string;
  level_selected: number;
  points_awarded: number;
  comments?: string;
}
```

### 3.3 Dashboard Breakdown

#### 3.3.1 System Admin Dashboard - Assignment Management

**Route:** `/system-admin/assignment-management`

**Tab Structure:**
| Tab | Function | Components |
|-----|----------|------------|
| **All Assignments** | View, filter, search all assignments | Assignment cards with status, actions |
| **Create Assignment** | 6-step wizard for creating assignments | Multi-step form |

**Create Assignment Wizard (6 Steps):**

```
Step 1: Basic Info
├── Title (required)
├── Description (required)
├── Instructions (optional, rich text)
├── Assignment Type Selection:
│   ├── File Upload
│   ├── Text Submission
│   ├── URL Submission
│   └── Multi-Question
├── Start Date (required)
├── Due Date (required)
├── End Date (optional - hard deadline)
└── Certificate Template (optional)

Step 2: Submission Settings
├── For File Upload:
│   ├── Max File Size (MB)
│   ├── Allowed File Types (multi-select)
│   └── Max Number of Files
├── Late Submission Settings:
│   ├── Allow Late Submission (toggle)
│   ├── Late Submission Policy:
│   │   ├── Not Allowed
│   │   ├── Allowed with Penalty
│   │   └── Allowed No Penalty
│   └── Late Penalty Percentage (if applicable)
└── Allow Draft Saving (toggle)

Step 3: Grading Configuration
├── Total Points (required)
├── Pass Percentage (required)
├── Rubric Builder (optional):
│   ├── Add Criteria
│   │   ├── Criteria Name
│   │   ├── Description
│   │   ├── Max Points
│   │   └── Levels (Excellent/Good/Fair/Poor with descriptions)
│   └── Reorder Criteria
└── Reference Attachments Upload

Step 4: Content/Questions (for multi_question type)
├── Add Question
│   ├── Question Type Selection
│   ├── Question Text
│   ├── Options (for MCQ/True-False)
│   ├── Correct Answer
│   ├── Points
│   └── Explanation
└── Question List with Reorder

Step 5: Publishing
├── Institution Selection (multi-select)
└── Per Institution:
    └── Class Selection (multi-select)

Step 6: Review
├── Summary of all settings
├── Questions preview (if applicable)
├── Publishing summary
└── Create Assignment Button
```

**Assignment Actions:**
- **View**: Opens submission management dialog
- **Edit**: Opens EditAssignmentDialog with tabbed interface
- **Delete**: Confirmation dialog

#### 3.3.2 Innovation Officer Dashboard - Assignment Management

**Route:** `/officer/assignment-management`

**Tab Structure:**
| Tab | Function |
|-----|----------|
| **All Assignments** | View assignments for institution + Grade submissions |
| **Create Assignment** | Create institution-specific assignments |

**All Assignments Tab Features:**
- Filter by status (ongoing, completed, etc.)
- View submission statistics per assignment
- "View Submissions" button → Opens grading interface

**Grading Interface:**
```
Submissions List View:
├── Student Name
├── Submission Date
├── Status (Submitted/Late/Graded)
├── Grade (if graded)
└── Actions: View | Grade

Grade Submission Dialog:
├── Student Info Header
├── Submission Content Display:
│   ├── For Files: File list with download links
│   ├── For Text: Rendered text content
│   ├── For URL: Clickable link with preview
│   └── For Questions: Answer display with auto-grade hints
├── Rubric Scoring (if rubric defined):
│   └── For each criteria: Level selection + comments
├── Manual Grade Input (if no rubric)
├── Feedback Text Area
├── Feedback File Upload
└── Submit Grade Button
```

#### 3.3.3 Student Dashboard - Assignments

**Route:** `/student/assignments`

**Tab Structure:**
| Tab | Function | Data Source |
|-----|----------|-------------|
| **Pending** | Assignments not yet submitted | status != 'submitted' && status != 'graded' |
| **Submitted** | Submitted, awaiting grading | status = 'submitted' or 'late_submitted' |
| **Graded** | Graded with feedback | status = 'graded' |

**Pending Tab Features:**
- Assignment cards with:
  - Title, description preview
  - Due date with countdown
  - Assignment type indicator
  - Total points
- "Start Assignment" button
- Late submission warning (if past due but still accepting)

**Submission Interface (by type):**

```
File Upload Assignment:
├── Drag & Drop Zone
├── File List with Remove
├── File type/size validation
├── Upload Progress
└── Submit Button

Text Submission Assignment:
├── Rich Text Editor
├── Character/Word Count
├── Save Draft Button
└── Submit Button

URL Submission Assignment:
├── URL Input Field
├── URL Validation
├── Preview (if possible)
└── Submit Button

Multi-Question Assignment:
├── Question Navigation
├── For Each Question:
│   ├── Question Text
│   ├── Answer Input (based on type)
│   └── Points indicator
├── Progress Bar
├── Save Draft Button
└── Submit Button
```

**Submitted Tab Features:**
- Submission confirmation
- Submitted date/time
- Files/content preview
- Status: "Awaiting Grading"

**Graded Tab Features:**
- Grade display (points and percentage)
- Pass/Fail indicator
- Rubric scores breakdown (if applicable)
- Feedback text
- Feedback files download
- Certificate download (if passed and certificate attached)

#### 3.3.4 Management Dashboard - Assignments (View Only)

**Features:**
- Assignment completion statistics
- Class-wise submission rates
- Grade distribution analytics

---

## 4. Event Management System

### 4.1 System Overview

Events and activities management with student interest tracking (simplified workflow without complex applications).

**Key Features:**
- Event creation and publishing
- Student interest registration (simple "I'm Interested" button)
- Interest tracking per institution
- Event participation badges on projects
- No complex application/approval workflow

### 4.2 Event Data Model

```typescript
type ActivityEventType = 
  | 'competition'
  | 'hackathon'
  | 'science_fair'
  | 'exhibition'
  | 'workshop'
  | 'seminar'
  | 'cultural'
  | 'sports'
  | 'other';

type EventStatus = 
  | 'draft'
  | 'published'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

interface ActivityEvent {
  id: string;
  title: string;
  description: string;
  event_type: ActivityEventType;
  status: EventStatus;
  
  // Dates
  registration_start: string;
  registration_end: string;
  event_start: string;
  event_end: string;
  
  // Details
  venue?: string;
  max_participants?: number;
  current_participants: number;  // Interest count
  eligibility_criteria?: string;
  rules?: string;
  prizes?: string[];
  
  // Targeting
  institution_ids: string[];  // Empty = all institutions
  class_ids?: string[];       // Empty = all classes
  
  // Project Linking
  linked_project_ids?: string[];  // Projects assigned to this event
  
  // Media
  banner_image?: string;
  attachments?: string[];
  
  // Certificate
  certificate_template_id?: string;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Simplified interest tracking (replaces complex EventApplication)
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

### 4.3 Dashboard Breakdown

#### 4.3.1 System Admin Dashboard - Event Management

**Route:** `/system-admin/event-management`

**Tab Structure:**
| Tab | Function |
|-----|----------|
| **All Events** | View, filter, manage all events |
| **Create Event** | Event creation form |
| **Interest Overview** | View all student interests across institutions |

**Create Event Form:**
```
Event Details:
├── Title (required)
├── Description (required, rich text)
├── Event Type Selection (dropdown)
├── Status (draft/published)
├── Venue (optional)
├── Max Participants (optional)
├── Eligibility Criteria (optional)
├── Rules (optional, rich text)
└── Prizes (optional, array input)

Dates:
├── Registration Start Date
├── Registration End Date
├── Event Start Date
└── Event End Date

Targeting:
├── Institution Selection:
│   ├── All Institutions (default)
│   └── Specific Institutions (multi-select)
└── Class Selection (optional):
    └── Specific Classes (multi-select)

Media:
├── Banner Image Upload
└── Attachments Upload

Certificate:
└── Certificate Template Selection (optional)
```

**Event Card Actions:**
- **View Details**: Full event information
- **Edit**: Opens edit dialog
- **View Interests**: Shows interested students grouped by institution
- **Delete**: Confirmation dialog

#### 4.3.2 Innovation Officer Dashboard - Events & Activities

**Route:** `/officer/events-activities`

**Tab Structure:**
| Tab | Function | Description |
|-----|----------|-------------|
| **Events Overview** | View all published events | List of events with details |
| **Student Interests** | View interested students from assigned institution | Institution-filtered interest list |

**Events Overview Tab:**
- Event cards with full details
- "View Details" button
- Interest count display
- Event status badges

**Student Interests Tab (Institution-Filtered):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Student Interests - [Institution Name]                          │
├─────────────────────────────────────────────────────────────────┤
│ Filter by Event: [Dropdown: All Events / Specific Event]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Event: Annual Science Fair 2024                              │ │
│ │ Interested Students: 15                                      │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ Student Name     │ Class    │ Section │ Registered At       │ │
│ │ ─────────────────┼──────────┼─────────┼─────────────────────│ │
│ │ Rahul Sharma     │ Class 10 │ A       │ Dec 10, 2024 10:30  │ │
│ │ Priya Patel      │ Class 9  │ B       │ Dec 10, 2024 11:45  │ │
│ │ Amit Kumar       │ Class 10 │ A       │ Dec 11, 2024 09:15  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Export to CSV [Button]                                          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Filtering Logic:**
```typescript
// Officer only sees interests from their assigned institution
const institutionInterests = allInterests.filter(
  interest => interest.institution_id === officerInstitutionId
);
```

#### 4.3.3 Student Dashboard - Events & Activities

**Route:** `/student/events-activities`

**Single View with Event Cards:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Events & Activities                                              │
├─────────────────────────────────────────────────────────────────┤
│ [Search Events...]  [Filter: All Types ▼]  [Status: Active ▼]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏆 Annual Science Fair 2024                                  │ │
│ │ ─────────────────────────────────────────────────────────── │ │
│ │ Type: Science Fair          Status: Published               │ │
│ │ Registration: Dec 1 - Dec 15, 2024                          │ │
│ │ Event Date: Jan 10-12, 2025                                 │ │
│ │ Venue: Main Auditorium                                      │ │
│ │                                                              │ │
│ │ [View Details]  [✓ I'm Interested] (already registered)     │ │
│ │ OR                                                           │ │
│ │ [View Details]  [I'm Interested] (not yet registered)       │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**View Details Dialog:**
- Full event description
- Eligibility criteria
- Rules
- Prizes list
- Registration dates
- Event dates
- Venue information
- Attachments download

**Interest Registration Flow:**
```
1. Student clicks "I'm Interested" button
2. System captures:
   - student_id
   - student_name
   - class_name
   - section
   - institution_id
   - institution_name
   - registered_at = current timestamp
3. Creates EventInterest record
4. Button changes to "✓ I'm Interested" (disabled/checked)
5. Interest syncs to:
   - Innovation Officer's "Student Interests" tab
   - Management's participation view
   - System Admin's overview
```

#### 4.3.4 Management Dashboard - Events & Activities

**Route:** `/management/events`

**Tab Structure:**
| Tab | Function |
|-----|----------|
| **All Events** | View all published events |
| **Our Participation** | View institution's student interests |

**All Events Tab:**
- Event cards with details
- View-only (no creation/editing)

**Our Participation Tab:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Our Participation - [Institution Name]                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Summary Cards:                                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│ │ Total Events │ │ Our Students │ │ Active       │             │
│ │     12       │ │     45       │ │ Registrations│             │
│ │              │ │ Interested   │ │     8        │             │
│ └──────────────┘ └──────────────┘ └──────────────┘             │
│                                                                  │
│ Event-wise Breakdown:                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Science Fair 2024          │ 15 students interested         │ │
│ │ Hackathon Championship     │ 8 students interested          │ │
│ │ Robotics Workshop          │ 22 students interested         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [Export Report]                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Bidirectional Data Flow

### 5.1 Assessment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ASSESSMENT BIDIRECTIONAL FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

                    CREATION FLOW (Top-Down)
                    ========================

    ┌──────────────────┐
    │   SYSTEM ADMIN   │
    │                  │
    │  Create Generic  │
    │  Assessment      │──────────┐
    │  (Multi-Inst)    │          │
    └──────────────────┘          │
                                  │
    ┌──────────────────┐          │     ┌─────────────────────────────────┐
    │   INNOVATION     │          │     │        ASSESSMENT DATABASE      │
    │   OFFICER        │          │     │                                 │
    │                  │          ├────▶│  • assessment record            │
    │  Create Inst-    │          │     │  • published_to array           │
    │  Specific        │──────────┘     │  • questions array              │
    │  Assessment      │                │                                 │
    └──────────────────┘                └───────────────┬─────────────────┘
                                                        │
                                                        │ Filter by
                                                        │ institution_id
                                                        │ + class_id
                                                        ▼
                                        ┌─────────────────────────────────┐
                                        │        STUDENT DASHBOARD        │
                                        │                                 │
                                        │  Available Assessments Tab      │
                                        │  ├── System Admin assessments   │
                                        │  └── Officer assessments        │
                                        └───────────────┬─────────────────┘
                                                        │
                                                        │ Student takes
                                                        │ assessment
                                                        ▼

                    RESULT FLOW (Bottom-Up)
                    =======================

                                        ┌─────────────────────────────────┐
                                        │       ASSESSMENT ATTEMPT        │
                                        │                                 │
                                        │  • student_id                   │
                                        │  • answers[]                    │
                                        │  • score, percentage            │
                                        │  • passed (auto-calculated)     │
                                        └───────────────┬─────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────────────────┐
                    │                                   │                                   │
                    ▼                                   ▼                                   ▼
    ┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
    │      STUDENT            │    │    INNOVATION OFFICER    │    │      SYSTEM ADMIN        │
    │      DASHBOARD          │    │    DASHBOARD             │    │      DASHBOARD           │
    │                         │    │                          │    │                          │
    │  Completed Tab:         │    │  Assessment Analytics:   │    │  Global Analytics:       │
    │  • Score & percentage   │    │  • Institution attempts  │    │  • All attempts          │
    │  • Pass/Fail badge      │    │  • Pass rates            │    │  • Institution breakdown │
    │  • Review answers       │    │  • Question analytics    │    │  • Pass rates            │
    │  • Download certificate │    │  • Student-wise scores   │    │  • Question analytics    │
    └──────────────────────────┘    └──────────────────────────┘    └──────────────────────────┘
```

### 5.2 Assignment Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ASSIGNMENT BIDIRECTIONAL FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

                    CREATION & PUBLISHING FLOW
                    ==========================

    SYSTEM ADMIN                          INNOVATION OFFICER
    ────────────                          ──────────────────
         │                                       │
         │  Create Assignment                    │  Create Institution-
         │  (publish to multiple                 │  Specific Assignment
         │   institutions)                       │
         │                                       │
         ▼                                       ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         ASSIGNMENTS DATABASE                             │
    │                                                                          │
    │  assignment {                                                            │
    │    id, title, type, status,                                             │
    │    published_to: [{ institution_id, class_ids }],                       │
    │    created_by_role: 'system_admin' | 'officer',                         │
    │    institution_id: null | 'officer-institution-id'                      │
    │  }                                                                       │
    └───────────────────────────────────────┬─────────────────────────────────┘
                                            │
                                            │ Filter by student's
                                            │ institution_id + class_id
                                            ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         STUDENT DASHBOARD                                │
    │                                                                          │
    │  Pending Tab: Assignments not yet submitted                              │
    │  └── Assignment Card → Start → Submit                                    │
    └───────────────────────────────────────┬─────────────────────────────────┘
                                            │
                                            │ Student submits
                                            ▼

                    SUBMISSION & GRADING FLOW
                    =========================

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         SUBMISSIONS DATABASE                             │
    │                                                                          │
    │  submission {                                                            │
    │    assignment_id, student_id,                                           │
    │    files[] | text_content | url | answers[],                            │
    │    status: 'submitted',                                                  │
    │    submitted_at                                                          │
    │  }                                                                       │
    └───────────────────────────────────────┬─────────────────────────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    │                                               │
                    ▼                                               ▼
    ┌──────────────────────────────┐            ┌──────────────────────────────┐
    │      INNOVATION OFFICER      │            │        SYSTEM ADMIN          │
    │                              │            │                              │
    │  View Submissions for        │            │  View All Submissions        │
    │  Institution Only            │            │  Across Institutions         │
    │                              │            │                              │
    │  Grade Submission:           │            │  Analytics & Reports         │
    │  ├── Rubric scoring          │            │                              │
    │  ├── Manual grade            │            │                              │
    │  ├── Feedback text           │            │                              │
    │  └── Feedback files          │            │                              │
    └──────────────────┬───────────┘            └──────────────────────────────┘
                       │
                       │ Officer grades
                       │ submission
                       ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         SUBMISSIONS DATABASE                             │
    │                                                                          │
    │  submission {                                                            │
    │    ...                                                                   │
    │    status: 'graded',                                                     │
    │    grade, percentage, passed,                                            │
    │    feedback, rubric_scores[],                                            │
    │    graded_by, graded_at                                                  │
    │  }                                                                       │
    └───────────────────────────────────────┬─────────────────────────────────┘
                                            │
                                            │ Syncs to student
                                            ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                         STUDENT DASHBOARD                                │
    │                                                                          │
    │  Graded Tab:                                                             │
    │  ├── Grade & percentage                                                  │
    │  ├── Pass/Fail badge                                                     │
    │  ├── Rubric breakdown                                                    │
    │  ├── Feedback text                                                       │
    │  ├── Download feedback files                                             │
    │  └── Download certificate (if passed)                                    │
    └─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENT BIDIRECTIONAL FLOW                            │
└─────────────────────────────────────────────────────────────────────────────┘

                    CREATION FLOW
                    =============

    ┌──────────────────┐
    │   SYSTEM ADMIN   │
    │                  │
    │  Create Event    │
    │  (target all or  │
    │   specific       │
    │   institutions)  │
    └────────┬─────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────────────┐
    │                           EVENTS DATABASE                                │
    │                                                                          │
    │  event {                                                                 │
    │    id, title, description, event_type, status,                          │
    │    institution_ids: [] | ['inst-1', 'inst-2'],  // empty = all          │
    │    class_ids: [] | ['class-1'],                 // empty = all          │
    │    registration_start, registration_end,                                 │
    │    event_start, event_end,                                              │
    │    current_participants: 0                                               │
    │  }                                                                       │
    └───────────────────────────────────────┬─────────────────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
    ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
    │ INNOVATION OFFICER │  │     MANAGEMENT     │  │      STUDENT       │
    │                    │  │                    │  │                    │
    │  Events Overview   │  │  All Events Tab    │  │  Events & Activity │
    │  Tab               │  │                    │  │  Page              │
    │                    │  │  View events for   │  │                    │
    │  View all events   │  │  awareness         │  │  View events       │
    └────────────────────┘  └────────────────────┘  └─────────┬──────────┘
                                                              │
                                                              │ Student clicks
                                                              │ "I'm Interested"
                                                              ▼

                    INTEREST REGISTRATION FLOW
                    ==========================

    ┌─────────────────────────────────────────────────────────────────────────┐
    │                       EVENT_INTERESTS DATABASE                           │
    │                                                                          │
    │  event_interest {                                                        │
    │    event_id,                                                             │
    │    student_id, student_name,                                             │
    │    class_name, section,                                                  │
    │    institution_id, institution_name,                                     │
    │    registered_at                                                         │
    │  }                                                                       │
    │                                                                          │
    │  Also updates: events.current_participants += 1                          │
    └───────────────────────────────────────┬─────────────────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
    ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
    │ INNOVATION OFFICER │  │     MANAGEMENT     │  │    SYSTEM ADMIN    │
    │                    │  │                    │  │                    │
    │ Student Interests  │  │ Our Participation  │  │ Interest Overview  │
    │ Tab                │  │ Tab                │  │ Tab                │
    │                    │  │                    │  │                    │
    │ Shows ONLY their   │  │ Shows ONLY their   │  │ Shows ALL          │
    │ institution's      │  │ institution's      │  │ interests across   │
    │ students           │  │ students           │  │ all institutions   │
    │                    │  │                    │  │                    │
    │ Filter: inst_id    │  │ Filter: inst_id    │  │ No filter          │
    └────────────────────┘  └────────────────────┘  └────────────────────┘
```

---

## 6. Database Schema

### 6.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────┘

erDiagram
    %% ASSESSMENT TABLES
    assessments {
        uuid id PK
        varchar title
        text description
        enum status "draft|published|unpublished|upcoming|ongoing|completed"
        timestamp start_time
        timestamp end_time
        int duration_minutes
        int total_points
        int pass_percentage
        boolean auto_submit
        boolean auto_evaluate
        boolean shuffle_questions
        boolean show_results_immediately
        boolean allow_review_after_submission
        uuid certificate_template_id FK
        uuid created_by FK
        enum created_by_role "system_admin|officer"
        uuid institution_id FK "nullable - for officer-created"
        timestamp created_at
        timestamp updated_at
    }
    
    assessment_publishing {
        uuid id PK
        uuid assessment_id FK
        uuid institution_id FK
        timestamp created_at
    }
    
    assessment_publishing_classes {
        uuid id PK
        uuid assessment_publishing_id FK
        uuid class_id FK
    }
    
    assessment_questions {
        uuid id PK
        uuid assessment_id FK
        int question_number
        text question_text
        enum question_type "mcq"
        varchar correct_option_id
        int points
        varchar image_url
        text code_snippet
        text explanation
        int order
        timestamp created_at
    }
    
    assessment_question_options {
        uuid id PK
        uuid question_id FK
        varchar option_label "A|B|C|D"
        text option_text
        int order
    }
    
    assessment_attempts {
        uuid id PK
        uuid assessment_id FK
        uuid student_id FK
        uuid institution_id FK
        uuid class_id FK
        timestamp started_at
        timestamp submitted_at
        int time_taken_seconds
        int score
        int total_points
        decimal percentage
        boolean passed
        enum status "in_progress|submitted|auto_submitted|evaluated"
        timestamp created_at
    }
    
    assessment_answers {
        uuid id PK
        uuid attempt_id FK
        uuid question_id FK
        uuid selected_option_id FK
        boolean is_correct
        int points_earned
        int time_spent_seconds
    }

    %% ASSIGNMENT TABLES
    assignments {
        uuid id PK
        varchar title
        text description
        text instructions
        enum assignment_type "file_upload|text_submission|url_submission|multi_question"
        enum status "draft|published|ongoing|completed|cancelled"
        timestamp start_date
        timestamp due_date
        timestamp end_date
        int max_file_size_mb
        varchar allowed_file_types "array"
        int max_files
        boolean allow_late_submission
        enum late_submission_policy "not_allowed|allowed_with_penalty|allowed_no_penalty"
        int late_penalty_percentage
        int total_points
        int pass_percentage
        uuid certificate_template_id FK
        uuid created_by FK
        enum created_by_role "system_admin|officer"
        uuid institution_id FK
        timestamp created_at
        timestamp updated_at
    }
    
    assignment_publishing {
        uuid id PK
        uuid assignment_id FK
        uuid institution_id FK
        timestamp created_at
    }
    
    assignment_publishing_classes {
        uuid id PK
        uuid assignment_publishing_id FK
        uuid class_id FK
    }
    
    assignment_rubrics {
        uuid id PK
        uuid assignment_id FK
        varchar criteria
        text description
        int max_points
        int order
    }
    
    assignment_rubric_levels {
        uuid id PK
        uuid rubric_id FK
        int score
        varchar label
        text description
        int order
    }
    
    assignment_questions {
        uuid id PK
        uuid assignment_id FK
        int question_number
        text question_text
        enum question_type "mcq|short_answer|long_answer|true_false|fill_blank"
        text correct_answer
        int points
        text explanation
        int order
    }
    
    assignment_question_options {
        uuid id PK
        uuid question_id FK
        text option_text
        boolean is_correct
        int order
    }
    
    assignment_attachments {
        uuid id PK
        uuid assignment_id FK
        varchar file_name
        varchar file_url
        int file_size
        timestamp uploaded_at
    }
    
    assignment_submissions {
        uuid id PK
        uuid assignment_id FK
        uuid student_id FK
        uuid institution_id FK
        uuid class_id FK
        text text_content
        varchar url
        enum status "not_started|draft|submitted|late_submitted|graded|returned"
        timestamp submitted_at
        boolean is_late
        int grade
        decimal percentage
        boolean passed
        text feedback
        uuid graded_by FK
        timestamp graded_at
        text draft_content
        timestamp draft_saved_at
        timestamp created_at
        timestamp updated_at
    }
    
    submission_files {
        uuid id PK
        uuid submission_id FK
        varchar file_name
        varchar file_url
        int file_size
        timestamp uploaded_at
    }
    
    submission_answers {
        uuid id PK
        uuid submission_id FK
        uuid question_id FK
        text answer_text
        uuid selected_option_id FK
        boolean is_correct
        int points_earned
        text feedback
    }
    
    submission_rubric_scores {
        uuid id PK
        uuid submission_id FK
        uuid rubric_id FK
        int level_selected
        int points_awarded
        text comments
    }
    
    submission_feedback_files {
        uuid id PK
        uuid submission_id FK
        varchar file_name
        varchar file_url
        int file_size
        timestamp uploaded_at
    }

    %% EVENT TABLES
    events {
        uuid id PK
        varchar title
        text description
        enum event_type "competition|hackathon|science_fair|exhibition|workshop|seminar|cultural|sports|other"
        enum status "draft|published|ongoing|completed|cancelled"
        timestamp registration_start
        timestamp registration_end
        timestamp event_start
        timestamp event_end
        varchar venue
        int max_participants
        int current_participants
        text eligibility_criteria
        text rules
        varchar prizes "array"
        varchar banner_image
        varchar attachments "array"
        uuid certificate_template_id FK
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    event_institutions {
        uuid id PK
        uuid event_id FK
        uuid institution_id FK
    }
    
    event_classes {
        uuid id PK
        uuid event_id FK
        uuid class_id FK
    }
    
    event_interests {
        uuid id PK
        uuid event_id FK
        uuid student_id FK
        uuid institution_id FK
        timestamp registered_at
    }
    
    event_projects {
        uuid id PK
        uuid event_id FK
        uuid project_id FK
        timestamp assigned_at
    }

    %% RELATIONSHIPS
    assessments ||--o{ assessment_publishing : "has"
    assessment_publishing ||--o{ assessment_publishing_classes : "has"
    assessments ||--o{ assessment_questions : "contains"
    assessment_questions ||--o{ assessment_question_options : "has"
    assessments ||--o{ assessment_attempts : "has"
    assessment_attempts ||--o{ assessment_answers : "contains"
    
    assignments ||--o{ assignment_publishing : "has"
    assignment_publishing ||--o{ assignment_publishing_classes : "has"
    assignments ||--o{ assignment_rubrics : "has"
    assignment_rubrics ||--o{ assignment_rubric_levels : "has"
    assignments ||--o{ assignment_questions : "contains"
    assignment_questions ||--o{ assignment_question_options : "has"
    assignments ||--o{ assignment_attachments : "has"
    assignments ||--o{ assignment_submissions : "has"
    assignment_submissions ||--o{ submission_files : "has"
    assignment_submissions ||--o{ submission_answers : "has"
    assignment_submissions ||--o{ submission_rubric_scores : "has"
    assignment_submissions ||--o{ submission_feedback_files : "has"
    
    events ||--o{ event_institutions : "targets"
    events ||--o{ event_classes : "targets"
    events ||--o{ event_interests : "has"
    events ||--o{ event_projects : "links"
```

### 6.2 SQL Table Definitions

```sql
-- =====================================================
-- ASSESSMENT TABLES
-- =====================================================

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'unpublished', 'upcoming', 'ongoing', 'completed')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    pass_percentage INTEGER NOT NULL DEFAULT 70,
    auto_submit BOOLEAN NOT NULL DEFAULT true,
    auto_evaluate BOOLEAN NOT NULL DEFAULT true,
    shuffle_questions BOOLEAN NOT NULL DEFAULT false,
    show_results_immediately BOOLEAN NOT NULL DEFAULT true,
    allow_review_after_submission BOOLEAN NOT NULL DEFAULT true,
    certificate_template_id UUID REFERENCES certificate_templates(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_by_role VARCHAR(50) NOT NULL 
        CHECK (created_by_role IN ('system_admin', 'officer')),
    institution_id UUID REFERENCES institutions(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE assessment_publishing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(assessment_id, institution_id)
);

CREATE TABLE assessment_publishing_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_publishing_id UUID NOT NULL REFERENCES assessment_publishing(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id),
    UNIQUE(assessment_publishing_id, class_id)
);

CREATE TABLE assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL DEFAULT 'mcq' CHECK (question_type = 'mcq'),
    correct_option_id UUID,
    points INTEGER NOT NULL DEFAULT 1,
    image_url VARCHAR(500),
    code_snippet TEXT,
    explanation TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE assessment_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
    option_label VARCHAR(5) NOT NULL CHECK (option_label IN ('A', 'B', 'C', 'D')),
    option_text TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    student_id UUID NOT NULL REFERENCES students(id),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMP,
    time_taken_seconds INTEGER,
    score INTEGER NOT NULL DEFAULT 0,
    total_points INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    passed BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress' 
        CHECK (status IN ('in_progress', 'submitted', 'auto_submitted', 'evaluated')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

CREATE TABLE assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assessment_questions(id),
    selected_option_id UUID REFERENCES assessment_question_options(id),
    is_correct BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    time_spent_seconds INTEGER NOT NULL DEFAULT 0,
    UNIQUE(attempt_id, question_id)
);

-- =====================================================
-- ASSIGNMENT TABLES
-- =====================================================

CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    assignment_type VARCHAR(50) NOT NULL 
        CHECK (assignment_type IN ('file_upload', 'text_submission', 'url_submission', 'multi_question')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
    start_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    max_file_size_mb INTEGER,
    allowed_file_types TEXT[],
    max_files INTEGER,
    allow_late_submission BOOLEAN NOT NULL DEFAULT false,
    late_submission_policy VARCHAR(50) NOT NULL DEFAULT 'not_allowed' 
        CHECK (late_submission_policy IN ('not_allowed', 'allowed_with_penalty', 'allowed_no_penalty')),
    late_penalty_percentage INTEGER,
    total_points INTEGER NOT NULL DEFAULT 100,
    pass_percentage INTEGER NOT NULL DEFAULT 70,
    certificate_template_id UUID REFERENCES certificate_templates(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_by_role VARCHAR(50) NOT NULL 
        CHECK (created_by_role IN ('system_admin', 'officer')),
    institution_id UUID REFERENCES institutions(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_publishing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(assignment_id, institution_id)
);

CREATE TABLE assignment_publishing_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_publishing_id UUID NOT NULL REFERENCES assignment_publishing(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id),
    UNIQUE(assignment_publishing_id, class_id)
);

CREATE TABLE assignment_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    criteria VARCHAR(255) NOT NULL,
    description TEXT,
    max_points INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE assignment_rubric_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rubric_id UUID NOT NULL REFERENCES assignment_rubrics(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    label VARCHAR(100) NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE assignment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL 
        CHECK (question_type IN ('mcq', 'short_answer', 'long_answer', 'true_false', 'fill_blank')),
    correct_answer TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    explanation TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE assignment_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES assignment_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE assignment_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id),
    student_id UUID NOT NULL REFERENCES students(id),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    text_content TEXT,
    url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' 
        CHECK (status IN ('not_started', 'draft', 'submitted', 'late_submitted', 'graded', 'returned')),
    submitted_at TIMESTAMP,
    is_late BOOLEAN NOT NULL DEFAULT false,
    grade INTEGER,
    percentage DECIMAL(5,2),
    passed BOOLEAN,
    feedback TEXT,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    draft_content TEXT,
    draft_saved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

CREATE TABLE submission_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES assignment_questions(id),
    answer_text TEXT,
    selected_option_id UUID REFERENCES assignment_question_options(id),
    is_correct BOOLEAN,
    points_earned INTEGER,
    feedback TEXT,
    UNIQUE(submission_id, question_id)
);

CREATE TABLE submission_rubric_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    rubric_id UUID NOT NULL REFERENCES assignment_rubrics(id),
    level_selected INTEGER NOT NULL,
    points_awarded INTEGER NOT NULL,
    comments TEXT,
    UNIQUE(submission_id, rubric_id)
);

CREATE TABLE submission_feedback_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- =====================================================
-- EVENT TABLES
-- =====================================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL 
        CHECK (event_type IN ('competition', 'hackathon', 'science_fair', 'exhibition', 'workshop', 'seminar', 'cultural', 'sports', 'other')),
    status VARCHAR(50) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
    registration_start TIMESTAMP NOT NULL,
    registration_end TIMESTAMP NOT NULL,
    event_start TIMESTAMP NOT NULL,
    event_end TIMESTAMP NOT NULL,
    venue VARCHAR(255),
    max_participants INTEGER,
    current_participants INTEGER NOT NULL DEFAULT 0,
    eligibility_criteria TEXT,
    rules TEXT,
    prizes TEXT[],
    banner_image VARCHAR(500),
    attachments TEXT[],
    certificate_template_id UUID REFERENCES certificate_templates(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE event_institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id),
    UNIQUE(event_id, institution_id)
);

CREATE TABLE event_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id),
    UNIQUE(event_id, class_id)
);

CREATE TABLE event_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    institution_id UUID NOT NULL REFERENCES institutions(id),
    registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, student_id)
);

CREATE TABLE event_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, project_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Assessment indexes
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_institution ON assessments(institution_id);
CREATE INDEX idx_assessments_created_by ON assessments(created_by);
CREATE INDEX idx_assessment_publishing_assessment ON assessment_publishing(assessment_id);
CREATE INDEX idx_assessment_publishing_institution ON assessment_publishing(institution_id);
CREATE INDEX idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX idx_assessment_attempts_institution ON assessment_attempts(institution_id);

-- Assignment indexes
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_institution ON assignments(institution_id);
CREATE INDEX idx_assignments_created_by ON assignments(created_by);
CREATE INDEX idx_assignment_publishing_assignment ON assignment_publishing(assignment_id);
CREATE INDEX idx_assignment_publishing_institution ON assignment_publishing(institution_id);
CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX idx_assignment_submissions_institution ON assignment_submissions(institution_id);
CREATE INDEX idx_assignment_submissions_status ON assignment_submissions(status);

-- Event indexes
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_dates ON events(registration_start, registration_end, event_start, event_end);
CREATE INDEX idx_event_interests_event ON event_interests(event_id);
CREATE INDEX idx_event_interests_student ON event_interests(student_id);
CREATE INDEX idx_event_interests_institution ON event_interests(institution_id);
```

---

## 7. API Endpoints Specification

### 7.1 Assessment Endpoints

```yaml
# =====================================================
# ASSESSMENT MANAGEMENT API
# =====================================================

# ----- System Admin: Assessment CRUD -----
POST /api/assessments
  Description: Create new assessment
  Auth: System Admin, Innovation Officer
  Body:
    title: string (required)
    description: string
    start_time: ISO datetime (required)
    end_time: ISO datetime (required)
    duration_minutes: integer (required)
    pass_percentage: integer (default: 70)
    auto_submit: boolean (default: true)
    auto_evaluate: boolean (default: true)
    shuffle_questions: boolean (default: false)
    show_results_immediately: boolean (default: true)
    allow_review_after_submission: boolean (default: true)
    certificate_template_id: uuid (optional)
    questions: QuestionInput[] (optional)
    publishing: PublishingInput[] (required)
  Response: { success: true, data: Assessment }

GET /api/assessments
  Description: Get all assessments (with filters)
  Auth: System Admin, Innovation Officer
  Query:
    status: string (optional)
    institution_id: uuid (optional) - Auto-set for officers
    created_by_role: 'system_admin' | 'officer' (optional)
    page: integer (default: 1)
    limit: integer (default: 20)
  Response: { success: true, data: Assessment[], pagination: {...} }

GET /api/assessments/:id
  Description: Get assessment by ID with questions
  Auth: System Admin, Innovation Officer, Student (if published to their class)
  Response: { success: true, data: Assessment }

PUT /api/assessments/:id
  Description: Update assessment
  Auth: System Admin, Innovation Officer (own assessments only)
  Body: Partial<Assessment>
  Response: { success: true, data: Assessment }

DELETE /api/assessments/:id
  Description: Delete assessment
  Auth: System Admin, Innovation Officer (own assessments only)
  Response: { success: true, message: "Assessment deleted" }

# ----- Publishing -----
POST /api/assessments/:id/publish
  Description: Publish assessment to institutions/classes
  Auth: System Admin, Innovation Officer
  Body:
    publishing: [
      {
        institution_id: uuid,
        class_ids: uuid[]
      }
    ]
  Response: { success: true, data: Assessment }

POST /api/assessments/:id/unpublish
  Description: Unpublish assessment
  Auth: System Admin, Innovation Officer
  Response: { success: true, data: Assessment }

# ----- Questions -----
POST /api/assessments/:id/questions
  Description: Add question to assessment
  Auth: System Admin, Innovation Officer
  Body:
    question_text: string (required)
    options: OptionInput[] (required, 4 options)
    correct_option_id: string (required)
    points: integer (required)
    image_url: string (optional)
    code_snippet: string (optional)
    explanation: string (optional)
  Response: { success: true, data: AssessmentQuestion }

GET /api/assessments/:id/questions
  Description: Get all questions for assessment
  Auth: System Admin, Innovation Officer, Student (during attempt)
  Response: { success: true, data: AssessmentQuestion[] }

PUT /api/assessments/questions/:questionId
  Description: Update question
  Auth: System Admin, Innovation Officer
  Body: Partial<AssessmentQuestion>
  Response: { success: true, data: AssessmentQuestion }

DELETE /api/assessments/questions/:questionId
  Description: Delete question
  Auth: System Admin, Innovation Officer
  Response: { success: true, message: "Question deleted" }

PUT /api/assessments/:id/questions/reorder
  Description: Reorder questions
  Auth: System Admin, Innovation Officer
  Body: { questionIds: uuid[] }
  Response: { success: true }

# ----- Student Attempts -----
GET /api/assessments/student
  Description: Get assessments for student
  Auth: Student
  Query:
    status: 'available' | 'completed' | 'upcoming' (optional)
  Response: { 
    success: true, 
    data: {
      available: Assessment[],
      completed: AssessmentAttempt[],
      upcoming: Assessment[]
    }
  }

POST /api/assessments/:id/start
  Description: Start assessment attempt
  Auth: Student
  Response: { 
    success: true, 
    data: {
      attempt: AssessmentAttempt,
      questions: AssessmentQuestion[] (shuffled if enabled)
    }
  }

POST /api/assessments/attempts/:attemptId/submit
  Description: Submit assessment attempt
  Auth: Student
  Body:
    answers: [
      {
        question_id: uuid,
        selected_option_id: uuid
      }
    ]
  Response: { 
    success: true, 
    data: {
      attempt: AssessmentAttempt,
      score: integer,
      percentage: decimal,
      passed: boolean
    }
  }

GET /api/assessments/attempts/:attemptId
  Description: Get attempt details with answers
  Auth: Student (own), System Admin, Innovation Officer
  Response: { success: true, data: AssessmentAttempt }

# ----- Analytics -----
GET /api/assessments/:id/analytics
  Description: Get assessment analytics
  Auth: System Admin, Innovation Officer
  Response: { 
    success: true, 
    data: {
      total_attempts: integer,
      completed_attempts: integer,
      average_score: decimal,
      pass_rate: decimal,
      institution_stats: [...],
      question_stats: [...]
    }
  }

GET /api/assessments/:id/attempts
  Description: Get all attempts for assessment
  Auth: System Admin, Innovation Officer
  Query:
    institution_id: uuid (optional) - Auto-filtered for officers
    class_id: uuid (optional)
    page: integer
    limit: integer
  Response: { success: true, data: AssessmentAttempt[], pagination: {...} }

GET /api/assessments/attempts/student/:studentId
  Description: Get all attempts by student
  Auth: System Admin, Innovation Officer, Student (own)
  Response: { success: true, data: AssessmentAttempt[] }
```

### 7.2 Assignment Endpoints

```yaml
# =====================================================
# ASSIGNMENT MANAGEMENT API
# =====================================================

# ----- System Admin: Assignment CRUD -----
POST /api/assignments
  Description: Create new assignment
  Auth: System Admin, Innovation Officer
  Body:
    title: string (required)
    description: string
    instructions: string
    assignment_type: 'file_upload' | 'text_submission' | 'url_submission' | 'multi_question' (required)
    start_date: ISO datetime (required)
    due_date: ISO datetime (required)
    end_date: ISO datetime (optional)
    max_file_size_mb: integer
    allowed_file_types: string[]
    max_files: integer
    allow_late_submission: boolean
    late_submission_policy: string
    late_penalty_percentage: integer
    total_points: integer (required)
    pass_percentage: integer
    rubric: RubricInput[] (optional)
    questions: QuestionInput[] (for multi_question type)
    attachments: File[] (optional)
    publishing: PublishingInput[] (required)
    certificate_template_id: uuid (optional)
  Response: { success: true, data: Assignment }

GET /api/assignments
  Description: Get all assignments
  Auth: System Admin, Innovation Officer
  Query:
    status: string
    institution_id: uuid
    page: integer
    limit: integer
    search: string
  Response: { success: true, data: Assignment[], pagination: {...} }

GET /api/assignments/:id
  Description: Get assignment by ID
  Auth: System Admin, Innovation Officer, Student
  Response: { success: true, data: Assignment }

PUT /api/assignments/:id
  Description: Update assignment
  Auth: System Admin, Innovation Officer (own only)
  Body: Partial<Assignment>
  Response: { success: true, data: Assignment }

DELETE /api/assignments/:id
  Description: Delete assignment
  Auth: System Admin, Innovation Officer (own only)
  Response: { success: true, message: "Assignment deleted" }

# ----- Publishing -----
POST /api/assignments/:id/publish
  Description: Publish assignment
  Auth: System Admin, Innovation Officer
  Body:
    publishing: PublishingInput[]
  Response: { success: true, data: Assignment }

# ----- Student Assignments -----
GET /api/assignments/student/my-assignments
  Description: Get student's assignments
  Auth: Student
  Query:
    status: 'pending' | 'submitted' | 'graded' (optional)
  Response: { 
    success: true, 
    data: {
      pending: Assignment[],
      submitted: AssignmentSubmission[],
      graded: AssignmentSubmission[]
    }
  }

GET /api/assignments/student/summary
  Description: Get student assignment summary stats
  Auth: Student
  Response: { 
    success: true, 
    data: {
      total_pending: integer,
      total_submitted: integer,
      total_graded: integer,
      average_grade: decimal
    }
  }

# ----- Submissions -----
POST /api/assignments/:id/submit
  Description: Submit assignment
  Auth: Student
  Body (multipart for files):
    text_content: string (for text_submission)
    url: string (for url_submission)
    files: File[] (for file_upload)
    answers: AnswerInput[] (for multi_question)
  Response: { success: true, data: AssignmentSubmission }

POST /api/assignments/:id/save-draft
  Description: Save draft
  Auth: Student
  Body:
    draft_content: string
    answers: AnswerInput[]
  Response: { success: true, data: { draft_saved_at: timestamp } }

GET /api/assignments/:id/submission
  Description: Get student's submission for assignment
  Auth: Student
  Response: { success: true, data: AssignmentSubmission }

GET /api/assignments/:id/submissions
  Description: Get all submissions for assignment
  Auth: System Admin, Innovation Officer
  Query:
    status: string
    class_id: uuid
    institution_id: uuid
    page: integer
    limit: integer
  Response: { success: true, data: AssignmentSubmission[], pagination: {...} }

# ----- Grading -----
PUT /api/assignments/submissions/:submissionId/grade
  Description: Grade submission
  Auth: System Admin, Innovation Officer
  Body:
    grade: integer (required)
    feedback: string
    rubric_scores: [
      {
        rubric_id: uuid,
        level_selected: integer,
        points_awarded: integer,
        comments: string
      }
    ]
    feedback_files: File[]
  Response: { success: true, data: AssignmentSubmission }

# ----- File Upload -----
POST /api/assignments/upload
  Description: Upload file for submission or feedback
  Auth: Student (submission), Innovation Officer (feedback)
  Body (multipart):
    file: File
    type: 'submission' | 'feedback'
  Response: { success: true, data: { file_id: uuid, url: string } }

# ----- Stats -----
GET /api/assignments/stats
  Description: Get assignment statistics
  Auth: System Admin, Innovation Officer
  Response: { 
    success: true, 
    data: {
      total: integer,
      ongoing: integer,
      upcoming: integer,
      completed: integer,
      overdue: integer
    }
  }
```

### 7.3 Event Endpoints

```yaml
# =====================================================
# EVENT MANAGEMENT API
# =====================================================

# ----- System Admin: Event CRUD -----
POST /api/events
  Description: Create new event
  Auth: System Admin
  Body:
    title: string (required)
    description: string (required)
    event_type: EventType (required)
    registration_start: ISO datetime (required)
    registration_end: ISO datetime (required)
    event_start: ISO datetime (required)
    event_end: ISO datetime (required)
    venue: string
    max_participants: integer
    eligibility_criteria: string
    rules: string
    prizes: string[]
    institution_ids: uuid[] (empty = all)
    class_ids: uuid[] (empty = all)
    banner_image: File
    attachments: File[]
    certificate_template_id: uuid
  Response: { success: true, data: Event }

GET /api/events
  Description: Get all events
  Auth: All roles
  Query:
    status: string
    event_type: string
    institution_id: uuid (for filtering)
    page: integer
    limit: integer
  Response: { success: true, data: Event[], pagination: {...} }

GET /api/events/:id
  Description: Get event by ID
  Auth: All roles
  Response: { success: true, data: Event }

PUT /api/events/:id
  Description: Update event
  Auth: System Admin
  Body: Partial<Event>
  Response: { success: true, data: Event }

DELETE /api/events/:id
  Description: Delete event
  Auth: System Admin
  Response: { success: true, message: "Event deleted" }

# ----- Student Interest -----
POST /api/events/:id/interest
  Description: Register student interest
  Auth: Student
  Response: { 
    success: true, 
    data: EventInterest,
    message: "Interest registered successfully"
  }

DELETE /api/events/:id/interest
  Description: Remove student interest
  Auth: Student
  Response: { success: true, message: "Interest removed" }

GET /api/events/:id/check-interest
  Description: Check if student has registered interest
  Auth: Student
  Response: { success: true, data: { is_interested: boolean } }

# ----- Interest Listing -----
GET /api/events/:id/interests
  Description: Get all interests for event
  Auth: System Admin, Innovation Officer, Management
  Query:
    institution_id: uuid (auto-filtered for officers/management)
    page: integer
    limit: integer
  Response: { 
    success: true, 
    data: EventInterest[],
    count: integer,
    pagination: {...}
  }

GET /api/events/interests/institution/:institutionId
  Description: Get all event interests for an institution
  Auth: Innovation Officer, Management
  Query:
    event_id: uuid (optional)
  Response: { success: true, data: EventInterest[] }

# ----- Student Events -----
GET /api/events/student
  Description: Get events for student
  Auth: Student
  Query:
    status: 'active' | 'past' | 'upcoming'
  Response: { 
    success: true, 
    data: {
      events: Event[],
      my_interests: EventInterest[]
    }
  }

# ----- Management -----
GET /api/events/institution/:institutionId/participation
  Description: Get institution's event participation
  Auth: Management
  Response: { 
    success: true, 
    data: {
      total_events: integer,
      total_interested_students: integer,
      active_registrations: integer,
      event_breakdown: [
        {
          event: Event,
          interested_count: integer
        }
      ]
    }
  }

# ----- Project Linking -----
POST /api/events/:eventId/projects/:projectId
  Description: Assign project to event
  Auth: Innovation Officer
  Response: { success: true, message: "Project assigned to event" }

DELETE /api/events/:eventId/projects/:projectId
  Description: Remove project from event
  Auth: Innovation Officer
  Response: { success: true, message: "Project removed from event" }

GET /api/events/:id/projects
  Description: Get projects assigned to event
  Auth: System Admin, Innovation Officer
  Response: { success: true, data: Project[] }

# ----- Analytics -----
GET /api/events/analytics
  Description: Get event analytics (System Admin)
  Auth: System Admin
  Response: { 
    success: true, 
    data: {
      total_events: integer,
      active_events: integer,
      total_interests: integer,
      interests_by_type: {...},
      interests_by_institution: {...}
    }
  }
```

---

## 8. Backend Infrastructure

### 8.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BACKEND INFRASTRUCTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   Express.js    │    │   Neon          │    │   Cloudflare    │          │
│  │   Node.js       │    │   PostgreSQL    │    │   R2            │          │
│  │                 │    │                 │    │                 │          │
│  │  • REST API     │───▶│  • Database     │    │  • File Storage │          │
│  │  • JWT Auth     │    │  • Prisma ORM   │    │  • CDN          │          │
│  │  • Middleware   │    │                 │    │                 │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│           │                      │                      │                    │
│           │                      │                      │                    │
│           ▼                      ▼                      ▼                    │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                         REDIS UPSTASH                            │        │
│  │                                                                  │        │
│  │  • Session caching                                               │        │
│  │  • Assessment attempt state                                      │        │
│  │  • Real-time participant counts                                  │        │
│  │  • Rate limiting                                                 │        │
│  │  • Leaderboard caching                                          │        │
│  └─────────────────────────────────────────────────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Caching Strategy (Redis Upstash)

```typescript
// Redis Key Patterns for Assessment/Assignment/Event Systems

// Assessment Caching
const assessmentKeys = {
  // Active assessment attempts (TTL: duration_minutes + 5 min buffer)
  attempt: (attemptId: string) => `assessment:attempt:${attemptId}`,
  
  // Assessment questions for active attempt (shuffled order)
  attemptQuestions: (attemptId: string) => `assessment:attempt:${attemptId}:questions`,
  
  // Student's answer progress during attempt
  attemptAnswers: (attemptId: string) => `assessment:attempt:${attemptId}:answers`,
  
  // Assessment analytics cache (TTL: 5 minutes)
  analytics: (assessmentId: string) => `assessment:analytics:${assessmentId}`,
  
  // Leaderboard cache (TTL: 1 minute)
  leaderboard: (assessmentId: string) => `assessment:leaderboard:${assessmentId}`,
};

// Assignment Caching
const assignmentKeys = {
  // Draft content auto-save (TTL: 24 hours)
  draft: (assignmentId: string, studentId: string) => 
    `assignment:draft:${assignmentId}:${studentId}`,
  
  // Submission statistics cache (TTL: 5 minutes)
  stats: (assignmentId: string) => `assignment:stats:${assignmentId}`,
};

// Event Caching
const eventKeys = {
  // Real-time participant count (TTL: none, updated on interest changes)
  participantCount: (eventId: string) => `event:participants:${eventId}`,
  
  // Student's interest status (TTL: 1 hour)
  studentInterest: (eventId: string, studentId: string) => 
    `event:interest:${eventId}:${studentId}`,
  
  // Institution interest count (TTL: 5 minutes)
  institutionInterests: (eventId: string, institutionId: string) => 
    `event:institution:${eventId}:${institutionId}`,
};
```

### 8.3 File Storage (Cloudflare R2)

```typescript
// R2 Bucket Structure for Assessment/Assignment/Event

const r2Paths = {
  // Assessment question images
  assessmentImages: 'assessments/questions/{assessmentId}/{questionId}/{filename}',
  
  // Assignment reference attachments (uploaded by admin/officer)
  assignmentAttachments: 'assignments/attachments/{assignmentId}/{filename}',
  
  // Student submission files
  submissionFiles: 'assignments/submissions/{assignmentId}/{studentId}/{filename}',
  
  // Officer feedback files
  feedbackFiles: 'assignments/feedback/{submissionId}/{filename}',
  
  // Event banner images
  eventBanners: 'events/banners/{eventId}/{filename}',
  
  // Event attachments
  eventAttachments: 'events/attachments/{eventId}/{filename}',
};

// Presigned URL generation for secure uploads/downloads
interface R2PresignedUrlRequest {
  bucket: string;
  key: string;
  operation: 'getObject' | 'putObject';
  expiresIn: number; // seconds
  contentType?: string; // for uploads
}
```

### 8.4 Real-Time Features

```typescript
// WebSocket events for real-time updates (optional enhancement)

// Assessment events
assessmentEvents = {
  // When student starts attempt
  'assessment:attempt:started': { attemptId, studentId, assessmentId },
  
  // When student submits
  'assessment:attempt:submitted': { attemptId, score, passed },
  
  // Real-time leaderboard updates
  'assessment:leaderboard:updated': { assessmentId, leaderboard: [...] },
};

// Event interest updates
eventEvents = {
  // When student registers interest
  'event:interest:registered': { eventId, institutionId, count },
  
  // Real-time participant count
  'event:participants:updated': { eventId, count },
};
```

---

## 9. Security Considerations

### 9.1 Role-Based Access Control (RBAC)

```typescript
// Permission Matrix for Assessment/Assignment/Event

const permissions = {
  assessment: {
    create: ['system_admin', 'officer'],
    read: ['system_admin', 'officer', 'management', 'student'],
    update: ['system_admin', 'officer'], // officer only own
    delete: ['system_admin', 'officer'], // officer only own
    publish: ['system_admin', 'officer'],
    take: ['student'],
    view_analytics: ['system_admin', 'officer', 'management'],
  },
  
  assignment: {
    create: ['system_admin', 'officer'],
    read: ['system_admin', 'officer', 'management', 'student'],
    update: ['system_admin', 'officer'],
    delete: ['system_admin', 'officer'],
    submit: ['student'],
    grade: ['system_admin', 'officer'],
    view_submissions: ['system_admin', 'officer', 'management'],
  },
  
  event: {
    create: ['system_admin'],
    read: ['system_admin', 'officer', 'management', 'student'],
    update: ['system_admin'],
    delete: ['system_admin'],
    register_interest: ['student'],
    view_interests: ['system_admin', 'officer', 'management'],
  },
};
```

### 9.2 Institutional Isolation Enforcement

```typescript
// Middleware for institutional data isolation

const institutionIsolationMiddleware = async (req, res, next) => {
  const user = req.user;
  
  // System Admin has global access
  if (user.role === 'system_admin') {
    return next();
  }
  
  // Innovation Officer - filter to assigned institution
  if (user.role === 'officer') {
    req.institutionFilter = user.assigned_institution_id;
  }
  
  // Management - filter to their institution
  if (user.role === 'management') {
    req.institutionFilter = user.institution_id;
  }
  
  // Student - filter to their institution and class
  if (user.role === 'student') {
    req.institutionFilter = user.institution_id;
    req.classFilter = user.class_id;
  }
  
  next();
};
```

### 9.3 Assessment Anti-Cheating Measures

```typescript
// Anti-cheating measures for assessments

const assessmentSecurity = {
  // Prevent multiple attempts
  uniqueAttemptConstraint: 'UNIQUE(assessment_id, student_id)',
  
  // Time validation
  validateSubmissionTime: (attempt, assessment) => {
    const elapsed = Date.now() - new Date(attempt.started_at).getTime();
    const maxTime = (assessment.duration_minutes + 1) * 60 * 1000; // 1 min buffer
    return elapsed <= maxTime;
  },
  
  // Question order tracking (if shuffled)
  storeQuestionOrder: (attemptId, shuffledOrder) => {
    // Store in Redis for the duration of attempt
  },
  
  // IP tracking
  trackAttemptIP: (attemptId, ipAddress) => {
    // Log IP for audit
  },
};
```

---

## 10. Frontend Components Reference

### 10.1 System Admin Components

```
src/pages/system-admin/
├── AssessmentManagement.tsx      # Main assessment management page
├── AssignmentManagement.tsx      # Main assignment management page
└── EventManagement.tsx           # Main event management page

src/components/assessments/
├── CreateAssessmentWizard.tsx    # 5-step creation wizard
├── EditAssessmentDialog.tsx      # Quick edit dialog
├── AssessmentDetailsDialog.tsx   # View details with analytics
├── PublishAssessmentDialog.tsx   # Institution/class selection
├── QuestionBuilder.tsx           # MCQ question creation
└── AssessmentAnalytics.tsx       # Analytics display

src/components/assignments/
├── CreateAssignmentWizard.tsx    # 6-step creation wizard
├── EditAssignmentDialog.tsx      # Quick edit dialog
├── RubricBuilder.tsx             # Rubric criteria builder
├── SubmissionGrading.tsx         # Grading interface
└── AssignmentSubmissionList.tsx  # Submissions list

src/components/events/
├── CreateEventForm.tsx           # Event creation form
├── EventDetailsDialog.tsx        # View event details
├── EventInterestsList.tsx        # List of interested students
└── EventAnalytics.tsx            # Event analytics
```

### 10.2 Innovation Officer Components

```
src/pages/officer/
├── AssessmentManagement.tsx      # Officer assessment page
├── AssignmentManagement.tsx      # Officer assignment page
└── EventsActivities.tsx          # Events with student interests tab

src/components/officer/
├── InstitutionAssessments.tsx    # Institution-filtered list
├── CreateInstitutionAssessment.tsx # Institution-specific creation
├── StudentInterestsTab.tsx       # Event interests from institution
└── GradeSubmissionDialog.tsx     # Assignment grading
```

### 10.3 Student Components

```
src/pages/student/
├── Assessments.tsx               # Student assessments page (3 tabs)
├── Assignments.tsx               # Student assignments page (3 tabs)
└── EventsActivities.tsx          # Events with interest button

src/components/student/
├── AvailableAssessments.tsx      # Available to take
├── TakeAssessment.tsx            # Assessment taking interface
├── AssessmentResults.tsx         # View results
├── PendingAssignments.tsx        # Pending submissions
├── SubmitAssignment.tsx          # Submission interface (by type)
├── GradedAssignment.tsx          # View grade and feedback
├── EventCard.tsx                 # Event display with interest button
└── EventDetailsModal.tsx         # Full event details
```

### 10.4 Management Components

```
src/pages/management/
└── Events.tsx                    # Management events page

src/components/management/
├── EventsViewTab.tsx             # View all events
├── InstitutionParticipationTab.tsx # Institution participation
└── AssessmentAnalyticsView.tsx   # Assessment analytics (read-only)
```

### 10.5 Shared Components

```
src/components/shared/
├── StatusBadge.tsx               # Status display badges
├── DateRangeDisplay.tsx          # Date/time display
├── FileUpload.tsx                # File upload with R2 integration
├── RichTextEditor.tsx            # Rich text for descriptions
├── CountdownTimer.tsx            # Timer for assessments
└── ProgressBar.tsx               # Progress display
```

---

## Summary

This documentation provides complete specifications for the Assessment, Assignment, and Event Management systems including:

1. **Multi-Dashboard Architecture**: How each role interacts with the systems
2. **Bidirectional Data Flow**: How data syncs across all dashboards
3. **Complete Database Schema**: All tables and relationships
4. **60+ API Endpoints**: Full CRUD and specialized operations
5. **Backend Infrastructure**: Neon PostgreSQL, Redis Upstash, Cloudflare R2
6. **Security Considerations**: RBAC, institutional isolation, anti-cheating

The systems are designed for seamless integration with the existing Meta-Innova platform architecture, supporting real-time synchronization and institutional data isolation.

---

*Document prepared for Meta-Innova Backend Development Team*
*December 2024*
