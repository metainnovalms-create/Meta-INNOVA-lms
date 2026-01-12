import { ActivityEvent, EventApplication, EventInterest } from '@/types/events';

// localStorage keys
const EVENTS_STORAGE_KEY = 'activity_events';
const EVENT_INTERESTS_STORAGE_KEY = 'event_interests';

// ============= localStorage Functions =============

export function loadEvents(): ActivityEvent[] {
  const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing events from localStorage:', e);
    }
  }
  // Initialize from mock data if empty
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(mockActivityEvents));
  return mockActivityEvents;
}

export function saveEvents(events: ActivityEvent[]): void {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
}

export function addEvent(event: ActivityEvent): void {
  const events = loadEvents();
  events.push(event);
  saveEvents(events);
}

export function updateEvent(eventId: string, updates: Partial<ActivityEvent>): void {
  const events = loadEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates, updated_at: new Date().toISOString() };
    saveEvents(events);
  }
}

export function deleteEvent(eventId: string): void {
  const events = loadEvents();
  const filtered = events.filter(e => e.id !== eventId);
  saveEvents(filtered);
}

export function getEventById(eventId: string): ActivityEvent | undefined {
  return loadEvents().find(e => e.id === eventId);
}

// ============= Event Interests localStorage Functions =============

export function loadEventInterests(): EventInterest[] {
  const stored = localStorage.getItem(EVENT_INTERESTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing event interests from localStorage:', e);
    }
  }
  // Initialize from mock data if empty
  localStorage.setItem(EVENT_INTERESTS_STORAGE_KEY, JSON.stringify(mockEventInterests));
  return mockEventInterests;
}

export function saveEventInterests(interests: EventInterest[]): void {
  localStorage.setItem(EVENT_INTERESTS_STORAGE_KEY, JSON.stringify(interests));
}

export function addEventInterest(interest: EventInterest): void {
  const interests = loadEventInterests();
  interests.push(interest);
  saveEventInterests(interests);
  
  // Update participant count in event
  const events = loadEvents();
  const eventIndex = events.findIndex(e => e.id === interest.event_id);
  if (eventIndex !== -1) {
    events[eventIndex].current_participants = (events[eventIndex].current_participants || 0) + 1;
    saveEvents(events);
  }
}

export function removeEventInterest(studentId: string, eventId: string): void {
  const interests = loadEventInterests();
  const filtered = interests.filter(i => !(i.student_id === studentId && i.event_id === eventId));
  saveEventInterests(filtered);
  
  // Update participant count in event
  const events = loadEvents();
  const eventIndex = events.findIndex(e => e.id === eventId);
  if (eventIndex !== -1 && events[eventIndex].current_participants > 0) {
    events[eventIndex].current_participants -= 1;
    saveEvents(events);
  }
}

export function getEventInterestsByEvent(eventId: string): EventInterest[] {
  return loadEventInterests().filter(i => i.event_id === eventId);
}

export function getEventInterestsByInstitution(institutionId: string): EventInterest[] {
  return loadEventInterests().filter(i => i.institution_id === institutionId);
}

export function getEventInterestsByStudent(studentId: string): EventInterest[] {
  return loadEventInterests().filter(i => i.student_id === studentId);
}

export function hasStudentExpressedInterest(studentId: string, eventId: string): boolean {
  return loadEventInterests().some(i => i.student_id === studentId && i.event_id === eventId);
}

export function getEventInterestsByEventAndInstitution(eventId: string, institutionId: string): EventInterest[] {
  return loadEventInterests().filter(i => i.event_id === eventId && i.institution_id === institutionId);
}

// ============= Mock Data =============

export const mockActivityEvents: ActivityEvent[] = [
  {
    id: 'evt-001',
    title: 'National Innovation Hackathon 2025',
    description: 'Build innovative solutions to real-world problems using AI, IoT, and emerging technologies. This 48-hour hackathon brings together the brightest minds to create impactful solutions for society.',
    event_type: 'hackathon',
    status: 'published',
    registration_start: '2025-02-01T00:00:00Z',
    registration_end: '2025-03-15T23:59:59Z',
    event_start: '2025-04-01T09:00:00Z',
    event_end: '2025-04-03T18:00:00Z',
    venue: 'Innovation Center, Tech Park',
    max_participants: 200,
    current_participants: 45,
    eligibility_criteria: 'Students from grade 8-12 can participate in teams of 2-4 members.',
    rules: '1. Each team must have 2-4 members\n2. All code must be original\n3. Use of open-source libraries is allowed\n4. Projects must be submitted by the deadline\n5. Mentors will be available throughout the event',
    prizes: ['₹50,000 (First Prize)', '₹30,000 (Second Prize)', '₹20,000 (Third Prize)', 'Certificates for all participants'],
    institution_ids: [],
    linked_project_ids: [],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-20T14:30:00Z'
  },
  {
    id: 'evt-eureka-2025',
    title: 'Eureka Junior 2025',
    description: 'National level innovation competition for school students to showcase their innovative projects and ideas.',
    event_type: 'competition',
    status: 'ongoing',
    registration_start: '2025-06-01T00:00:00Z',
    registration_end: '2025-08-31T23:59:59Z',
    event_start: '2025-10-15T09:00:00Z',
    event_end: '2025-10-15T17:00:00Z',
    venue: 'State Innovation Center',
    max_participants: 150,
    current_participants: 23,
    eligibility_criteria: 'Open to all school students from grades 6-12.',
    rules: '1. Projects must be original\n2. Maximum 3 members per team\n3. Display boards must follow guidelines\n4. Phase 2 selection based on project evaluation',
    prizes: ['National Recognition', 'State Level Awards', 'Participation Certificate'],
    institution_ids: [],
    linked_project_ids: ['proj-msd-002', 'proj-kga-003'],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2025-06-01T10:00:00Z',
    updated_at: '2025-09-01T11:00:00Z'
  },
  {
    id: 'evt-inspire-2025',
    title: 'Inspire Awards 2025',
    description: 'Innovation competition promoting science and technology among school students.',
    event_type: 'competition',
    status: 'published',
    registration_start: '2025-07-01T00:00:00Z',
    registration_end: '2025-09-30T23:59:59Z',
    event_start: '2025-11-20T09:00:00Z',
    event_end: '2025-11-20T17:00:00Z',
    venue: 'District Science Center',
    max_participants: 100,
    current_participants: 5,
    eligibility_criteria: 'Open to all school students from grades 8-12.',
    rules: '1. Projects must address real-world problems\n2. Maximum 2 members per team\n3. All submissions must be original work',
    prizes: ['Cash Prize', 'District Recognition', 'State Qualification'],
    institution_ids: [],
    linked_project_ids: [],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2025-07-01T10:00:00Z',
    updated_at: '2025-08-15T11:00:00Z'
  },
  {
    id: 'evt-ignitia-2025',
    title: 'Ignitia 2025 (Sahodaya)',
    description: 'Inter-school innovation and project exhibition organized by Sahodaya Schools Complex.',
    event_type: 'exhibition',
    status: 'completed',
    registration_start: '2025-05-01T00:00:00Z',
    registration_end: '2025-07-31T23:59:59Z',
    event_start: '2025-08-25T09:00:00Z',
    event_end: '2025-08-25T17:00:00Z',
    venue: 'Sahodaya Convention Center, Coimbatore',
    max_participants: 120,
    current_participants: 110,
    eligibility_criteria: 'Open to all Sahodaya member schools.',
    rules: '1. Projects must be innovative\n2. Maximum 4 members per team\n3. Presentation time: 10 minutes',
    prizes: ['1st Place Trophy', '2nd Place Trophy', '3rd Place Trophy', 'Participation Certificate'],
    institution_ids: [],
    linked_project_ids: ['proj-kga-001'],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2025-05-01T10:00:00Z',
    updated_at: '2025-08-25T18:00:00Z'
  },
  {
    id: 'evt-003',
    title: 'Inter-School Robotics Competition',
    description: 'Design, build, and program robots to compete in various challenges. Show your engineering and coding skills!',
    event_type: 'competition',
    status: 'published',
    registration_start: '2025-02-15T00:00:00Z',
    registration_end: '2025-04-10T23:59:59Z',
    event_start: '2025-05-01T10:00:00Z',
    event_end: '2025-05-01T16:00:00Z',
    venue: 'Central Sports Arena',
    max_participants: 80,
    current_participants: 23,
    eligibility_criteria: 'Teams of 3-5 students from grades 6-12.',
    rules: '1. Robot must fit within size constraints\n2. No remote control - autonomous only\n3. Safety guidelines must be followed',
    prizes: ['Trophy + ₹25,000', '₹15,000', '₹10,000'],
    institution_ids: [],
    linked_project_ids: [],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2025-02-01T09:00:00Z',
    updated_at: '2025-02-10T10:00:00Z'
  },
  {
    id: 'evt-004',
    title: 'Innovation Exhibition 2025',
    description: 'Showcase your innovative ideas, prototypes, and projects to industry experts, investors, and fellow students.',
    event_type: 'exhibition',
    status: 'published',
    registration_start: '2025-03-01T00:00:00Z',
    registration_end: '2025-04-30T23:59:59Z',
    event_start: '2025-06-15T10:00:00Z',
    event_end: '2025-06-17T18:00:00Z',
    venue: 'Convention Center, Downtown',
    max_participants: 150,
    current_participants: 34,
    eligibility_criteria: 'All students with innovative projects are welcome.',
    rules: '1. Booth space will be provided\n2. Project demo required\n3. Poster presentation mandatory',
    prizes: ['Best Innovation Award', 'Best Presentation', 'People\'s Choice Award'],
    institution_ids: [],
    linked_project_ids: [],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2025-02-20T11:00:00Z',
    updated_at: '2025-02-25T15:00:00Z'
  },
  {
    id: 'evt-005',
    title: 'AI & ML Workshop Series',
    description: 'Hands-on workshop series covering fundamentals of Artificial Intelligence and Machine Learning with practical projects.',
    event_type: 'workshop',
    status: 'published',
    registration_start: '2025-02-01T00:00:00Z',
    registration_end: '2025-03-20T23:59:59Z',
    event_start: '2025-04-05T14:00:00Z',
    event_end: '2025-04-07T17:00:00Z',
    venue: 'Online (Zoom)',
    max_participants: 300,
    current_participants: 89,
    eligibility_criteria: 'Students from grades 9-12 with basic programming knowledge.',
    rules: '1. Laptop required\n2. Install prerequisites before workshop\n3. Active participation mandatory',
    prizes: ['Certificates of Completion', 'Best Project Award'],
    institution_ids: [],
    linked_project_ids: [],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2025-01-25T08:00:00Z',
    updated_at: '2025-02-05T09:30:00Z'
  },
  {
    id: 'evt-006',
    title: 'Math Olympiad 2025',
    description: 'Test your mathematical prowess in this challenging competition featuring problem-solving, logical reasoning, and advanced mathematics.',
    event_type: 'competition',
    status: 'completed',
    registration_start: '2024-12-01T00:00:00Z',
    registration_end: '2025-01-15T23:59:59Z',
    event_start: '2025-02-01T10:00:00Z',
    event_end: '2025-02-01T13:00:00Z',
    venue: 'University Auditorium',
    max_participants: 250,
    current_participants: 234,
    eligibility_criteria: 'Individual participation for grades 8-12.',
    prizes: ['Gold Medal + ₹10,000', 'Silver Medal + ₹7,000', 'Bronze Medal + ₹5,000'],
    institution_ids: [],
    linked_project_ids: [],
    banner_image: '/placeholder.svg',
    created_by: 'sysadmin-001',
    created_at: '2024-11-20T10:00:00Z',
    updated_at: '2025-02-02T16:00:00Z'
  }
];

// Mock Event Interests data
export const mockEventInterests: EventInterest[] = [
  // Modern School Vasant Vihar students
  {
    id: 'int-001',
    event_id: 'evt-001',
    student_id: 'MSD-2024-0001',
    student_name: 'Arjun Sharma',
    class_name: 'Grade 10-A',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    registered_at: '2025-02-10T15:30:00Z'
  },
  {
    id: 'int-002',
    event_id: 'evt-001',
    student_id: 'MSD-2024-0015',
    student_name: 'Priya Kapoor',
    class_name: 'Grade 11-B',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    registered_at: '2025-02-11T09:15:00Z'
  },
  {
    id: 'int-003',
    event_id: 'evt-003',
    student_id: 'MSD-2024-0022',
    student_name: 'Rahul Verma',
    class_name: 'Grade 9-A',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    registered_at: '2025-02-20T11:00:00Z'
  },
  {
    id: 'int-004',
    event_id: 'evt-004',
    student_id: 'MSD-2024-0008',
    student_name: 'Sneha Reddy',
    class_name: 'Grade 12-A',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    registered_at: '2025-03-05T14:20:00Z'
  },
  {
    id: 'int-005',
    event_id: 'evt-005',
    student_id: 'MSD-2024-0030',
    student_name: 'Aditya Mehta',
    class_name: 'Grade 10-B',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    registered_at: '2025-02-08T10:45:00Z'
  },
  // Kikani Global Academy students
  {
    id: 'int-006',
    event_id: 'evt-001',
    student_id: 'KGA-2024-0012',
    student_name: 'Karthik Subramaniam',
    class_name: 'Grade 11-A',
    institution_id: 'inst-kga-001',
    institution_name: 'Kikani Global Academy',
    registered_at: '2025-02-12T08:30:00Z'
  },
  {
    id: 'int-007',
    event_id: 'evt-001',
    student_id: 'KGA-2024-0025',
    student_name: 'Lakshmi Narayanan',
    class_name: 'Grade 10-B',
    institution_id: 'inst-kga-001',
    institution_name: 'Kikani Global Academy',
    registered_at: '2025-02-13T16:00:00Z'
  },
  {
    id: 'int-008',
    event_id: 'evt-eureka-2025',
    student_id: 'KGA-2024-0033',
    student_name: 'Ananya Krishnan',
    class_name: 'Grade 9-C',
    institution_id: 'inst-kga-001',
    institution_name: 'Kikani Global Academy',
    registered_at: '2025-06-15T11:20:00Z'
  },
  {
    id: 'int-009',
    event_id: 'evt-003',
    student_id: 'KGA-2024-0018',
    student_name: 'Vijay Kumar',
    class_name: 'Grade 8-A',
    institution_id: 'inst-kga-001',
    institution_name: 'Kikani Global Academy',
    registered_at: '2025-02-22T09:45:00Z'
  },
  {
    id: 'int-010',
    event_id: 'evt-005',
    student_id: 'KGA-2024-0041',
    student_name: 'Divya Raman',
    class_name: 'Grade 11-B',
    institution_id: 'inst-kga-001',
    institution_name: 'Kikani Global Academy',
    registered_at: '2025-02-09T13:30:00Z'
  }
];

// Legacy mock applications (kept for backward compatibility)
export const mockEventApplications: EventApplication[] = [
  {
    id: 'app-001',
    event_id: 'evt-001',
    student_id: 'MSD-2024-0001',
    student_name: 'Arjun Sharma',
    institution_id: 'inst-msd-001',
    class_id: 'class-10-A',
    idea_title: 'Smart Waste Management System using IoT',
    idea_description: 'An IoT-based system that monitors waste levels in bins and optimizes collection routes using AI algorithms.',
    team_members: [
      { name: 'Arjun Sharma', student_id: 'MSD-2024-0001', role: 'Team Lead' },
      { name: 'Priya Kapoor', student_id: 'MSD-2024-0015', role: 'Developer' },
    ],
    is_team_application: true,
    status: 'pending',
    applied_at: '2025-02-10T15:30:00Z'
  },
  {
    id: 'app-002',
    event_id: 'evt-001',
    student_id: 'KGA-2024-0012',
    student_name: 'Karthik Subramaniam',
    institution_id: 'inst-kga-001',
    class_id: 'class-11-A',
    idea_title: 'AI-Powered Personal Health Assistant',
    idea_description: 'A mobile app that uses AI to provide personalized health recommendations.',
    team_members: [
      { name: 'Karthik Subramaniam', student_id: 'KGA-2024-0012', role: 'Team Lead' },
      { name: 'Lakshmi Narayanan', student_id: 'KGA-2024-0025', role: 'Backend Developer' }
    ],
    is_team_application: true,
    status: 'shortlisted',
    applied_at: '2025-02-12T10:15:00Z',
    reviewed_by: 'off-kga-001',
    reviewed_at: '2025-02-15T14:20:00Z',
    review_notes: 'Excellent idea with clear implementation plan.'
  }
];
