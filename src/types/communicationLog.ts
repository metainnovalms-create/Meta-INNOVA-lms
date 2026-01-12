export type CommunicationLogType = 'call' | 'email' | 'meeting' | 'visit' | 'follow_up';
export type CommunicationLogPriority = 'high' | 'medium' | 'low';
export type CommunicationLogStatus = 'completed' | 'pending' | 'follow_up_required';

export interface CommunicationLog {
  id: string;
  institution_id: string;
  institution_name: string;
  type: CommunicationLogType;
  date: string;
  subject: string;
  notes: string;
  contact_person: string;
  contact_role: string;
  conducted_by_id: string;
  conducted_by_name: string;
  priority: CommunicationLogPriority;
  status: CommunicationLogStatus;
  next_action?: string | null;
  next_action_date?: string | null;
  attachments?: CommunicationLogAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CommunicationLogAttachment {
  id: string;
  communication_log_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  public_url: string;
  uploaded_by_id: string;
  uploaded_by_name: string;
  created_at: string;
}

export interface CreateCommunicationLogInput {
  institution_id: string;
  institution_name: string;
  type: CommunicationLogType;
  date: string;
  subject: string;
  notes: string;
  contact_person: string;
  contact_role: string;
  conducted_by_id: string;
  conducted_by_name: string;
  priority: CommunicationLogPriority;
  status: CommunicationLogStatus;
  next_action?: string;
  next_action_date?: string;
}

export interface CommunicationLogFilters {
  institutionId?: string;
  type?: CommunicationLogType;
  status?: CommunicationLogStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}
