// Performance Appraisal and HR Rating Data Layer with localStorage persistence

export interface ProjectSummary {
  id: string;
  project_title: string;
  grade_level: string;
  domain: string;
  contest_name: string;
  level: 'national' | 'international' | 'state' | 'district' | 'school';
  result: string;
}

export interface StudentFeedback {
  concept_clarity: number;
  responsiveness: number;
  mentorship_quality: number;
  contest_preparation: number;
  overall_satisfaction: number;
}

export interface ReviewSignOff {
  reviewer_name: string;
  reviewer_designation: string;
  comments: string;
  rating: number;
  signature_date: string;
}

export interface HRReview {
  hr_name: string;
  verification_status: 'verified' | 'pending' | 'rejected';
  comments: string;
  final_rating: number;
  signature_date: string;
}

export interface PerformanceAppraisal {
  id: string;
  // Section 1: Trainer Profile
  trainer_id: string;
  trainer_name: string;
  employee_id: string;
  institution_id: string;
  institution_name: string;
  reporting_period_from: string;
  reporting_period_to: string;
  
  // Section 2: Lab Domains
  lab_domains: ('IoT' | 'AI' | 'Robotics' | 'AR/VR' | 'Drones' | 'Digital Media')[];
  total_projects_mentored: number;
  total_instructional_hours: number;
  
  // Section 3: Projects Summary
  projects_summary: ProjectSummary[];
  
  // Section 4: Self-Reflection
  key_contributions: string[];
  innovations_introduced: string[];
  student_mentorship_experience: string;
  collaboration_coordination: string;
  
  // Forward Plan & Feedback
  student_feedback: StudentFeedback;
  student_comments_summary: string;
  future_goals: string[];
  planned_trainings: string[];
  support_needed: string;
  
  // Official Sign-Offs
  manager_review: ReviewSignOff | null;
  principal_review: ReviewSignOff | null;
  hr_review: HRReview | null;
  
  // Metadata
  status: 'draft' | 'submitted' | 'manager_reviewed' | 'principal_reviewed' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface HRRatingProject {
  id: string;
  project_title: string;
  competition_level: string;
  result: string;
  stars_earned: number;
  verified_by_hr: boolean;
  verified_date?: string;
}

export interface HRRating {
  id: string;
  trainer_id: string;
  trainer_name: string;
  employee_id: string;
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  
  project_ratings: HRRatingProject[];
  
  total_stars_quarter: number;
  cumulative_stars_year: number;
  
  created_at: string;
  updated_at: string;
  created_by: string;
}

// localStorage keys
const APPRAISALS_KEY = 'performance_appraisals';
const HR_RATINGS_KEY = 'hr_ratings';

// Initial mock data
const initialAppraisals: PerformanceAppraisal[] = [
  {
    id: 'appraisal-001',
    trainer_id: 'off-msd-001',
    trainer_name: 'Mr. Atif Ansari',
    employee_id: 'META-EMP-001',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    reporting_period_from: '2024-04-01',
    reporting_period_to: '2025-03-31',
    lab_domains: ['IoT', 'AI', 'Robotics'],
    total_projects_mentored: 12,
    total_instructional_hours: 480,
    projects_summary: [
      {
        id: 'proj-1',
        project_title: 'Smart Irrigation System',
        grade_level: 'Grade 10',
        domain: 'IoT',
        contest_name: 'National Science Fair',
        level: 'national',
        result: '2nd Place'
      },
      {
        id: 'proj-2',
        project_title: 'AI Traffic Management',
        grade_level: 'Grade 11',
        domain: 'AI',
        contest_name: 'Tech Innovate 2024',
        level: 'state',
        result: '1st Place'
      }
    ],
    key_contributions: [
      'Introduced hands-on IoT curriculum for Grade 9-10',
      'Organized inter-school robotics competition',
      'Developed AI learning modules'
    ],
    innovations_introduced: [
      'Implemented TinkerCAD for circuit simulation',
      'Introduced Python-based AI projects',
      'Created virtual lab sessions using AR'
    ],
    student_mentorship_experience: 'Successfully mentored 45 students in various STEM projects. Helped 8 students qualify for national-level competitions.',
    collaboration_coordination: 'Collaborated with school administration for lab upgrades. Coordinated with external mentors for advanced AI workshops.',
    student_feedback: {
      concept_clarity: 4.5,
      responsiveness: 4.8,
      mentorship_quality: 4.6,
      contest_preparation: 4.7,
      overall_satisfaction: 4.6
    },
    student_comments_summary: 'Students appreciate the hands-on approach and practical applications. Some requested more advanced topics.',
    future_goals: [
      'Expand drone programming curriculum',
      'Introduce blockchain basics',
      'Achieve 100% participation in national competitions'
    ],
    planned_trainings: [
      'Advanced AI/ML certification',
      'Drone pilot license',
      'AR/VR development workshop'
    ],
    support_needed: 'Additional lab equipment for robotics. Budget for competition registrations.',
    manager_review: {
      reviewer_name: 'Ms. Priya Sharma',
      reviewer_designation: 'Manager',
      comments: 'Excellent performance. Strong mentorship skills.',
      rating: 4.5,
      signature_date: '2025-04-05'
    },
    principal_review: null,
    hr_review: null,
    status: 'manager_reviewed',
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-04-05T14:30:00Z',
    created_by: 'off-msd-001'
  }
];

const initialHRRatings: HRRating[] = [
  {
    id: 'rating-001',
    trainer_id: 'off-msd-001',
    trainer_name: 'Mr. Atif Ansari',
    employee_id: 'META-EMP-001',
    period: 'Q1',
    year: 2025,
    project_ratings: [
      {
        id: 'pr-1',
        project_title: 'Smart Irrigation System',
        competition_level: 'National',
        result: '2nd Place',
        stars_earned: 4,
        verified_by_hr: true,
        verified_date: '2025-04-10'
      },
      {
        id: 'pr-2',
        project_title: 'AI Traffic Management',
        competition_level: 'State',
        result: '1st Place',
        stars_earned: 3,
        verified_by_hr: true,
        verified_date: '2025-04-10'
      }
    ],
    total_stars_quarter: 7,
    cumulative_stars_year: 7,
    created_at: '2025-04-10T10:00:00Z',
    updated_at: '2025-04-10T10:00:00Z',
    created_by: 'hr-admin'
  },
  {
    id: 'rating-002',
    trainer_id: 'off-kga-001',
    trainer_name: 'Mr. Saran T',
    employee_id: 'META-EMP-002',
    period: 'Q1',
    year: 2025,
    project_ratings: [
      {
        id: 'pr-3',
        project_title: 'Drone Delivery System',
        competition_level: 'International',
        result: '3rd Place',
        stars_earned: 5,
        verified_by_hr: true,
        verified_date: '2025-04-12'
      }
    ],
    total_stars_quarter: 5,
    cumulative_stars_year: 5,
    created_at: '2025-04-12T10:00:00Z',
    updated_at: '2025-04-12T10:00:00Z',
    created_by: 'hr-admin'
  }
];

// Load functions
export const loadPerformanceAppraisals = (): PerformanceAppraisal[] => {
  const stored = localStorage.getItem(APPRAISALS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data
  localStorage.setItem(APPRAISALS_KEY, JSON.stringify(initialAppraisals));
  return initialAppraisals;
};

export const loadHRRatings = (): HRRating[] => {
  const stored = localStorage.getItem(HR_RATINGS_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with mock data
  localStorage.setItem(HR_RATINGS_KEY, JSON.stringify(initialHRRatings));
  return initialHRRatings;
};

// Save functions
export const savePerformanceAppraisals = (appraisals: PerformanceAppraisal[]): void => {
  localStorage.setItem(APPRAISALS_KEY, JSON.stringify(appraisals));
};

export const saveHRRatings = (ratings: HRRating[]): void => {
  localStorage.setItem(HR_RATINGS_KEY, JSON.stringify(ratings));
};

// CRUD for Performance Appraisals
export const addPerformanceAppraisal = (appraisal: Omit<PerformanceAppraisal, 'id' | 'created_at' | 'updated_at'>): PerformanceAppraisal => {
  const appraisals = loadPerformanceAppraisals();
  const newAppraisal: PerformanceAppraisal = {
    ...appraisal,
    id: `appraisal-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  appraisals.push(newAppraisal);
  savePerformanceAppraisals(appraisals);
  return newAppraisal;
};

export const updatePerformanceAppraisal = (id: string, updates: Partial<PerformanceAppraisal>): PerformanceAppraisal | null => {
  const appraisals = loadPerformanceAppraisals();
  const index = appraisals.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  appraisals[index] = {
    ...appraisals[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  savePerformanceAppraisals(appraisals);
  return appraisals[index];
};

export const deletePerformanceAppraisal = (id: string): boolean => {
  const appraisals = loadPerformanceAppraisals();
  const filtered = appraisals.filter(a => a.id !== id);
  if (filtered.length === appraisals.length) return false;
  savePerformanceAppraisals(filtered);
  return true;
};

export const getAppraisalsByTrainer = (trainerId: string): PerformanceAppraisal[] => {
  return loadPerformanceAppraisals().filter(a => a.trainer_id === trainerId);
};

export const getAppraisalsByInstitution = (institutionId: string): PerformanceAppraisal[] => {
  return loadPerformanceAppraisals().filter(a => a.institution_id === institutionId);
};

// CRUD for HR Ratings
export const addHRRating = (rating: Omit<HRRating, 'id' | 'created_at' | 'updated_at'>): HRRating => {
  const ratings = loadHRRatings();
  const newRating: HRRating = {
    ...rating,
    id: `rating-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  ratings.push(newRating);
  saveHRRatings(ratings);
  return newRating;
};

export const updateHRRating = (id: string, updates: Partial<HRRating>): HRRating | null => {
  const ratings = loadHRRatings();
  const index = ratings.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  ratings[index] = {
    ...ratings[index],
    ...updates,
    updated_at: new Date().toISOString()
  };
  saveHRRatings(ratings);
  return ratings[index];
};

export const deleteHRRating = (id: string): boolean => {
  const ratings = loadHRRatings();
  const filtered = ratings.filter(r => r.id !== id);
  if (filtered.length === ratings.length) return false;
  saveHRRatings(filtered);
  return true;
};

export const getRatingsByTrainer = (trainerId: string): HRRating[] => {
  return loadHRRatings().filter(r => r.trainer_id === trainerId);
};

export const getRatingsByPeriod = (period: string, year: number): HRRating[] => {
  return loadHRRatings().filter(r => r.period === period && r.year === year);
};

export const calculateCumulativeStars = (trainerId: string, year: number): number => {
  const ratings = loadHRRatings().filter(r => r.trainer_id === trainerId && r.year === year);
  return ratings.reduce((sum, r) => sum + r.total_stars_quarter, 0);
};
