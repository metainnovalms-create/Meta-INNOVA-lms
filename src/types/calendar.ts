export type EventType = 'academic' | 'extra_curricular' | 'administrative' | 'important';
export type HolidayType = 'national' | 'regional' | 'institution' | 'optional';
export type AuditType = 'academic' | 'financial' | 'infrastructure' | 'performance' | 'compliance' | 'quality';
export type AuditStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface InstitutionEvent {
  id: string;
  title: string;
  description: string;
  institution_id?: string; // null/undefined means all institutions
  institution_name?: string;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string;
  location?: string;
  created_by: string;
  notify_participants: boolean;
  recurrence: RecurrenceType;
  color?: string; // Optional color tag (hex code)
  created_at: string;
}

export interface AcademicYear {
  id: string;
  year_label: string; // "2024-2025"
  start_date: string;
  end_date: string;
  num_terms: number;
  terms: AcademicTerm[];
  key_dates: KeyDate[];
  allow_institution_override: boolean;
  is_current: boolean;
  created_at: string;
}

export interface AcademicTerm {
  id: string;
  name: string; // "Term 1", "Fall Semester"
  start_date: string;
  end_date: string;
  exam_start?: string;
  exam_end?: string;
}

export interface KeyDate {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  end_date?: string; // if multi-day holiday
  type: HolidayType;
  applicable_to: string[]; // institution IDs, empty array means all
  description?: string;
  created_by: string;
  created_at: string;
}

export interface Audit {
  id: string;
  title: string;
  type: AuditType;
  institution_id: string;
  institution_name: string;
  audit_date: string;
  start_time: string;
  duration_hours: number;
  auditors: string[]; // user IDs or names
  scope: string;
  status: AuditStatus;
  pre_requirements?: string;
  meeting_link?: string;
  report_url?: string;
  findings?: string;
  action_items?: string[];
  follow_up_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
