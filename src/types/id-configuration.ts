export type IdEntityType = 'employee' | 'institution' | 'student' | 'roll_number';

export interface IdConfiguration {
  id: string;
  entity_type: IdEntityType;
  institution_id?: string; // For institution-specific configurations (students)
  prefix: string;
  suffix: string;
  separator: string; // e.g., '-', '_', ''
  pattern_template: string; // e.g., '{PREFIX}{SEPARATOR}{YEAR}{SEPARATOR}{COUNTER}'
  counter_padding: number; // e.g., 3 for '001', 4 for '0001'
  current_counter: number;
  reset_counter_annually: boolean;
  include_year: boolean;
  year_format: 'YY' | 'YYYY'; // '25' or '2025'
  include_month: boolean;
  custom_fields?: IdCustomField[];
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface IdCustomField {
  name: string;
  value: string;
  position: number; // Order in the pattern
}

export interface GeneratedId {
  id: string;
  entity_type: IdEntityType;
  entity_id: string; // ID of the employee/institution/student
  generated_id: string;
  configuration_id: string;
  institution_id?: string;
  generated_at: string;
}

export interface IdGenerationRequest {
  entity_type: IdEntityType;
  institution_id?: string;
  custom_values?: Record<string, string>;
}

export interface IdPattern {
  prefix: string;
  suffix: string;
  separator: string;
  include_year: boolean;
  year_format: 'YY' | 'YYYY';
  include_month: boolean;
  counter_padding: number;
  custom_fields?: IdCustomField[];
}

export interface IdPreview {
  pattern: string;
  example: string;
  next_id: string;
}
