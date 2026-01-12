export interface InstitutionClass {
  id: string;
  institution_id: string;
  class_name: string;
  display_order: number;
  academic_year: string;
  capacity?: number;
  class_teacher_id?: string;
  room_number?: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'archived';
}

export interface Student {
  id: string;
  student_id: string; // Unique lifelong ID generated from ID configuration
  student_name: string;
  email: string; // Student login email
  password?: string; // Student login password (hashed/managed by auth)
  roll_number: string;
  admission_number: string;
  class: string;
  section: string;
  class_id: string; // Required - links student to specific class
  admission_date: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  parent_name: string;
  parent_phone: string;
  address: string;
  avatar?: string;
  institution_id: string;
  blood_group: string; // Required blood group
  previous_school?: string;
  created_at: string;
}

export interface ClassSummary {
  class_name: string;
  total_students: number;
  boys: number;
  girls: number;
  sections: string[];
  average_attendance: number;
}

export interface BulkUploadResult {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  duplicates?: string[];
  errors?: Array<{ row: number; roll_number: string; error: string }>;
}
