export type ActivityEventType = 
  | 'webinar'
  | 'competition'
  | 'hackathon'
  | 'science_fair'
  | 'science_expo'
  | 'exhibition'
  | 'workshop'
  | 'seminar'
  | 'cultural'
  | 'sports'
  | 'other';

export type EventStatus = 
  | 'draft'
  | 'published'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export type ApplicationStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'shortlisted';

export const EVENT_TYPE_LABELS: Record<ActivityEventType, string> = {
  webinar: 'Webinar',
  competition: 'Competition',
  hackathon: 'Hackathon',
  science_fair: 'Science Fair',
  science_expo: 'Science Expo',
  exhibition: 'Exhibition',
  workshop: 'Workshop',
  seminar: 'Seminar',
  cultural: 'Cultural',
  sports: 'Sports',
  other: 'Other'
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

// New database-backed Event type
export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: ActivityEventType;
  venue?: string;
  
  // Dates
  registration_start?: string;
  registration_end?: string;
  event_start: string;
  event_end?: string;
  
  // Status
  status: EventStatus;
  
  // Attachments
  brochure_url?: string;
  attachments?: { name: string; url: string }[];
  
  // Metadata
  max_participants?: number;
  current_participants: number;
  eligibility_criteria?: string;
  rules?: string;
  prizes?: string[];
  
  // Creator info
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Legacy type for backward compatibility with existing components
export interface ActivityEvent {
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
  current_participants: number;
  eligibility_criteria?: string;
  rules?: string;
  prizes?: string[];
  
  // Targeting
  institution_ids: string[]; // Empty = all institutions
  class_ids?: string[]; // Empty = all classes
  
  // Project Linking
  linked_project_ids?: string[]; // Projects participating in this event
  
  // Media
  banner_image?: string;
  attachments?: string[];
  
  // Certificate
  certificate_template_id?: string; // Certificate template to award on participation
  
  // Metadata
  created_by: string; // System Admin ID
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  name: string;
  student_id?: string;
  class?: string;
  role?: string; // Team Lead, Member, etc.
}

export interface EventApplication {
  id: string;
  event_id: string;
  student_id: string;
  student_name: string;
  institution_id: string;
  class_id: string;
  
  // Application Details
  idea_title: string;
  idea_description: string;
  team_members?: TeamMember[];
  supporting_documents?: string[];
  
  // Status
  status: ApplicationStatus;
  applied_at: string;
  reviewed_by?: string; // Officer ID
  reviewed_at?: string;
  review_notes?: string;
  
  // Additional
  is_team_application: boolean;
}

export interface EventClassAssignment {
  id: string;
  event_id: string;
  institution_id: string;
  class_id: string;
  assigned_by?: string;
  assigned_at: string;
  // Joined data
  institution?: {
    id: string;
    name: string;
  };
  class?: {
    id: string;
    class_name: string;
    section?: string;
  };
}

export interface EventUpdate {
  id: string;
  event_id: string;
  title: string;
  content?: string;
  link_url?: string;
  created_by?: string;
  created_at: string;
}

export interface EventInterest {
  id: string;
  event_id: string;
  student_id: string;
  student_name?: string;
  email?: string;
  class_name?: string;
  institution_id: string;
  institution_name?: string;
  class_id?: string;
  registered_at: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_type: ActivityEventType;
  venue?: string;
  event_start: string;
  event_end?: string;
  registration_start?: string;
  registration_end?: string;
  brochure_url?: string;
  attachments?: { name: string; url: string }[];
  max_participants?: number;
  eligibility_criteria?: string;
  rules?: string;
  prizes?: string[];
}

export interface PublishEventData {
  event_id: string;
  assignments: {
    institution_id: string;
    class_id: string;
  }[];
}
