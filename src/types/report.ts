export interface Trainer {
  name: string;
  designation: string;
  attendance?: number; // percentage
}

export interface Activity {
  activity: string;
  remarks: string;
}

export interface Report {
  id: string;
  report_type: 'activity' | 'monthly';
  report_month: string;
  report_date: string;
  institution_id?: string;
  client_name: string;
  client_location?: string;
  trainers: Trainer[];
  hours_handled?: number;
  hours_unit?: string;
  portion_covered_percentage?: number;
  assessments_completed?: string;
  assessment_results?: string;
  activities: Activity[];
  signatory_name?: string;
  signatory_designation?: string;
  signature_url?: string;
  status: 'draft' | 'final';
  generated_pdf_url?: string;
  is_published?: boolean;
  published_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  report_type: 'activity' | 'monthly';
  report_month: string;
  report_date: string;
  institution_id?: string;
  client_name: string;
  client_location?: string;
  trainers: Trainer[];
  hours_handled?: number;
  hours_unit?: string;
  portion_covered_percentage?: number;
  assessments_completed?: string;
  assessment_results?: string;
  activities: Activity[];
  signatory_name?: string;
  signatory_designation?: string;
  signature_url?: string;
  status?: 'draft' | 'final';
}
