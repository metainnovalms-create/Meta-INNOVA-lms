import { Assessment, AssessmentQuestion, AssessmentAttempt, AssessmentAnalytics } from '@/types/assessment';

// localStorage keys
const ASSESSMENTS_STORAGE_KEY = 'assessments';
const ASSESSMENT_QUESTIONS_STORAGE_KEY = 'assessment_questions';
const ASSESSMENT_ATTEMPTS_STORAGE_KEY = 'assessment_attempts';

// Initial mock data with correct institution IDs
const initialAssessments: Assessment[] = [
  {
    id: 'assessment-1',
    title: 'JavaScript Fundamentals Quiz',
    description: 'Test your understanding of JavaScript basics including variables, functions, and data types',
    status: 'ongoing',
    start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 30,
    total_points: 50,
    pass_percentage: 70,
    auto_submit: true,
    auto_evaluate: true,
    shuffle_questions: true,
    show_results_immediately: true,
    allow_review_after_submission: true,
    published_to: [
      {
        institution_id: 'inst-msd-001',
        institution_name: 'Modern School Vasant Vihar',
        class_ids: ['class-msd-9a', 'class-msd-9b'],
        class_names: ['Grade 9 - Section A', 'Grade 9 - Section B']
      }
    ],
    question_count: 10,
    created_by: 'admin-1',
    created_by_role: 'system_admin',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'assessment-2',
    title: 'Python Data Structures Assessment',
    description: 'Comprehensive assessment covering lists, tuples, dictionaries, and sets',
    status: 'upcoming',
    start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 45,
    total_points: 75,
    pass_percentage: 75,
    auto_submit: true,
    auto_evaluate: true,
    shuffle_questions: false,
    show_results_immediately: false,
    allow_review_after_submission: true,
    published_to: [
      {
        institution_id: 'inst-msd-001',
        institution_name: 'Modern School Vasant Vihar',
        class_ids: ['class-msd-10a'],
        class_names: ['Grade 10 - Section A']
      },
      {
        institution_id: 'inst-kga-001',
        institution_name: 'Kikani Global Academy',
        class_ids: ['class-kga-10a', 'class-kga-10b'],
        class_names: ['Grade 10 - Section A', 'Grade 10 - Section B']
      }
    ],
    question_count: 15,
    created_by: 'admin-1',
    created_by_role: 'system_admin',
    created_at: '2024-01-12T14:00:00Z',
    updated_at: '2024-01-12T14:00:00Z'
  },
  {
    id: 'assessment-3',
    title: 'HTML & CSS Basics',
    description: 'Foundation assessment for web development students',
    status: 'completed',
    start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 40,
    total_points: 60,
    pass_percentage: 65,
    auto_submit: true,
    auto_evaluate: true,
    shuffle_questions: true,
    show_results_immediately: true,
    allow_review_after_submission: true,
    published_to: [
      {
        institution_id: 'inst-msd-001',
        institution_name: 'Modern School Vasant Vihar',
        class_ids: ['class-msd-9a', 'class-msd-9b'],
        class_names: ['Grade 9 - Section A', 'Grade 9 - Section B']
      }
    ],
    question_count: 12,
    created_by: 'admin-1',
    created_by_role: 'system_admin',
    created_at: '2024-01-05T09:00:00Z',
    updated_at: '2024-01-05T09:00:00Z'
  },
  {
    id: 'assessment-4',
    title: 'Database Management - SQL Queries',
    description: 'Test your SQL knowledge including SELECT, JOIN, and aggregate functions',
    status: 'draft',
    start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    total_points: 100,
    pass_percentage: 70,
    auto_submit: true,
    auto_evaluate: true,
    shuffle_questions: false,
    show_results_immediately: false,
    allow_review_after_submission: true,
    published_to: [],
    question_count: 20,
    created_by: 'admin-1',
    created_by_role: 'system_admin',
    created_at: '2024-01-13T11:00:00Z',
    updated_at: '2024-01-13T11:00:00Z'
  },
  {
    id: 'assessment-5',
    title: 'React Hooks and State Management',
    description: 'Advanced React assessment covering hooks, context API, and state patterns',
    status: 'published',
    start_time: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 50,
    total_points: 80,
    pass_percentage: 75,
    auto_submit: true,
    auto_evaluate: true,
    shuffle_questions: true,
    show_results_immediately: true,
    allow_review_after_submission: true,
    published_to: [
      {
        institution_id: 'inst-kga-001',
        institution_name: 'Kikani Global Academy',
        class_ids: ['class-kga-11a'],
        class_names: ['Grade 11 - Section A']
      }
    ],
    question_count: 16,
    created_by: 'admin-1',
    created_by_role: 'system_admin',
    created_at: '2024-01-11T15:00:00Z',
    updated_at: '2024-01-11T15:00:00Z'
  },
  // Officer-created assessments
  {
    id: 'assessment-6',
    title: 'IoT Fundamentals - Modern School Campus',
    description: 'Institution-specific assessment for IoT course students',
    status: 'ongoing',
    start_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 45,
    total_points: 60,
    pass_percentage: 70,
    auto_submit: true,
    auto_evaluate: true,
    shuffle_questions: false,
    show_results_immediately: true,
    allow_review_after_submission: true,
    published_to: [
      {
        institution_id: 'inst-msd-001',
        institution_name: 'Modern School Vasant Vihar',
        class_ids: ['class-msd-11a'],
        class_names: ['Grade 11 - Section A']
      }
    ],
    question_count: 12,
    created_by: 'off-msd-001',
    created_by_role: 'officer',
    institution_id: 'inst-msd-001',
    created_at: '2024-01-14T08:00:00Z',
    updated_at: '2024-01-14T08:00:00Z'
  },
  {
    id: 'assessment-7',
    title: 'Robotics Mid-term - Kikani Global Academy',
    description: 'Mid-term assessment for robotics course',
    status: 'upcoming',
    start_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    end_time: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    duration_minutes: 60,
    total_points: 100,
    pass_percentage: 75,
    auto_submit: true,
    auto_evaluate: true,
    shuffle_questions: true,
    show_results_immediately: false,
    allow_review_after_submission: true,
    published_to: [
      {
        institution_id: 'inst-kga-001',
        institution_name: 'Kikani Global Academy',
        class_ids: ['class-kga-12a'],
        class_names: ['Grade 12 - Section A']
      }
    ],
    question_count: 20,
    created_by: 'off-kga-001',
    created_by_role: 'officer',
    institution_id: 'inst-kga-001',
    created_at: '2024-01-13T16:00:00Z',
    updated_at: '2024-01-13T16:00:00Z'
  }
];

const initialQuestions: AssessmentQuestion[] = [
  {
    id: 'q-1-1',
    assessment_id: 'assessment-1',
    question_number: 1,
    question_text: 'What is the output of: console.log(typeof null)?',
    question_type: 'mcq',
    options: [
      { id: 'opt-1-1-a', option_label: 'A', option_text: 'null', order: 1 },
      { id: 'opt-1-1-b', option_label: 'B', option_text: 'undefined', order: 2 },
      { id: 'opt-1-1-c', option_label: 'C', option_text: 'object', order: 3 },
      { id: 'opt-1-1-d', option_label: 'D', option_text: 'number', order: 4 }
    ],
    correct_option_id: 'opt-1-1-c',
    points: 5,
    time_limit_seconds: 60,
    explanation: 'In JavaScript, typeof null returns "object" due to a historic bug in the language that has been kept for backward compatibility.',
    order: 1,
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'q-1-2',
    assessment_id: 'assessment-1',
    question_number: 2,
    question_text: 'Which keyword is used to declare a block-scoped variable in JavaScript?',
    question_type: 'mcq',
    options: [
      { id: 'opt-1-2-a', option_label: 'A', option_text: 'var', order: 1 },
      { id: 'opt-1-2-b', option_label: 'B', option_text: 'let', order: 2 },
      { id: 'opt-1-2-c', option_label: 'C', option_text: 'const', order: 3 },
      { id: 'opt-1-2-d', option_label: 'D', option_text: 'Both B and C', order: 4 }
    ],
    correct_option_id: 'opt-1-2-d',
    points: 5,
    time_limit_seconds: 45,
    explanation: 'Both let and const declare block-scoped variables. The difference is that const cannot be reassigned.',
    order: 2,
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'q-1-3',
    assessment_id: 'assessment-1',
    question_number: 3,
    question_text: 'What will be the output of: console.log(1 + "2" + 3)?',
    question_type: 'mcq',
    options: [
      { id: 'opt-1-3-a', option_label: 'A', option_text: '6', order: 1 },
      { id: 'opt-1-3-b', option_label: 'B', option_text: '123', order: 2 },
      { id: 'opt-1-3-c', option_label: 'C', option_text: '33', order: 3 },
      { id: 'opt-1-3-d', option_label: 'D', option_text: 'Error', order: 4 }
    ],
    correct_option_id: 'opt-1-3-b',
    points: 5,
    time_limit_seconds: 60,
    explanation: 'JavaScript performs type coercion. 1 + "2" results in "12" (string), then "12" + 3 results in "123".',
    order: 3,
    created_at: '2024-01-10T10:00:00Z'
  },
  {
    id: 'q-3-1',
    assessment_id: 'assessment-3',
    question_number: 1,
    question_text: 'Which HTML tag is used to create a hyperlink?',
    question_type: 'mcq',
    options: [
      { id: 'opt-3-1-a', option_label: 'A', option_text: '<link>', order: 1 },
      { id: 'opt-3-1-b', option_label: 'B', option_text: '<a>', order: 2 },
      { id: 'opt-3-1-c', option_label: 'C', option_text: '<href>', order: 3 },
      { id: 'opt-3-1-d', option_label: 'D', option_text: '<url>', order: 4 }
    ],
    correct_option_id: 'opt-3-1-b',
    points: 5,
    time_limit_seconds: 30,
    explanation: 'The <a> tag (anchor tag) is used to create hyperlinks in HTML.',
    order: 1,
    created_at: '2024-01-05T09:00:00Z'
  },
  {
    id: 'q-3-2',
    assessment_id: 'assessment-3',
    question_number: 2,
    question_text: 'What CSS property is used to change the text color?',
    question_type: 'mcq',
    options: [
      { id: 'opt-3-2-a', option_label: 'A', option_text: 'text-color', order: 1 },
      { id: 'opt-3-2-b', option_label: 'B', option_text: 'color', order: 2 },
      { id: 'opt-3-2-c', option_label: 'C', option_text: 'font-color', order: 3 },
      { id: 'opt-3-2-d', option_label: 'D', option_text: 'text-style', order: 4 }
    ],
    correct_option_id: 'opt-3-2-b',
    points: 5,
    time_limit_seconds: 30,
    explanation: 'The color property in CSS is used to change the text color.',
    order: 2,
    created_at: '2024-01-05T09:00:00Z'
  }
];

const initialAttempts: AssessmentAttempt[] = [
  {
    id: 'attempt-1',
    assessment_id: 'assessment-3',
    student_id: 'student-msd-001',
    student_name: 'Aarav Sharma',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    class_id: 'class-msd-9a',
    class_name: 'Grade 9 - Section A',
    started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000).toISOString(),
    time_taken_seconds: 1500,
    score: 52,
    total_points: 60,
    percentage: 86.67,
    passed: true,
    answers: [],
    status: 'evaluated'
  },
  {
    id: 'attempt-2',
    assessment_id: 'assessment-3',
    student_id: 'student-msd-002',
    student_name: 'Priya Patel',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    class_id: 'class-msd-9a',
    class_name: 'Grade 9 - Section A',
    started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
    time_taken_seconds: 1800,
    score: 45,
    total_points: 60,
    percentage: 75,
    passed: true,
    answers: [],
    status: 'evaluated'
  },
  {
    id: 'attempt-3',
    assessment_id: 'assessment-1',
    student_id: 'student-msd-001',
    student_name: 'Aarav Sharma',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    class_id: 'class-msd-9a',
    class_name: 'Grade 9 - Section A',
    started_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    submitted_at: undefined,
    time_taken_seconds: undefined,
    score: 0,
    total_points: 50,
    percentage: 0,
    passed: false,
    answers: [],
    status: 'in_progress'
  }
];

// localStorage functions
export function loadAssessments(): Assessment[] {
  try {
    const stored = localStorage.getItem(ASSESSMENTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading assessments from localStorage:', error);
  }
  // Initialize with default data
  saveAssessments(initialAssessments);
  return initialAssessments;
}

export function saveAssessments(assessments: Assessment[]): void {
  try {
    localStorage.setItem(ASSESSMENTS_STORAGE_KEY, JSON.stringify(assessments));
  } catch (error) {
    console.error('Error saving assessments to localStorage:', error);
  }
}

export function addAssessment(assessment: Assessment): void {
  const assessments = loadAssessments();
  assessments.push(assessment);
  saveAssessments(assessments);
}

export function updateAssessment(id: string, updates: Partial<Assessment>): void {
  const assessments = loadAssessments();
  const index = assessments.findIndex(a => a.id === id);
  if (index !== -1) {
    assessments[index] = { ...assessments[index], ...updates, updated_at: new Date().toISOString() };
    saveAssessments(assessments);
  }
}

export function deleteAssessment(id: string): void {
  const assessments = loadAssessments();
  const filtered = assessments.filter(a => a.id !== id);
  saveAssessments(filtered);
}

export function getAssessmentsByInstitution(institutionId: string): Assessment[] {
  const assessments = loadAssessments();
  return assessments.filter(a => 
    a.published_to.some(p => p.institution_id === institutionId) ||
    (a.created_by_role === 'officer' && a.institution_id === institutionId)
  );
}

export function getAssessmentsByClass(classId: string): Assessment[] {
  const assessments = loadAssessments();
  return assessments.filter(a => 
    a.published_to.some(p => p.class_ids.includes(classId))
  );
}

export function getAssessmentById(id: string): Assessment | undefined {
  const assessments = loadAssessments();
  return assessments.find(a => a.id === id);
}

// Questions functions
export function loadAssessmentQuestions(): AssessmentQuestion[] {
  try {
    const stored = localStorage.getItem(ASSESSMENT_QUESTIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading assessment questions from localStorage:', error);
  }
  localStorage.setItem(ASSESSMENT_QUESTIONS_STORAGE_KEY, JSON.stringify(initialQuestions));
  return initialQuestions;
}

export function saveAssessmentQuestions(questions: AssessmentQuestion[]): void {
  try {
    localStorage.setItem(ASSESSMENT_QUESTIONS_STORAGE_KEY, JSON.stringify(questions));
  } catch (error) {
    console.error('Error saving assessment questions to localStorage:', error);
  }
}

export function getQuestionsByAssessment(assessmentId: string): AssessmentQuestion[] {
  const questions = loadAssessmentQuestions();
  return questions.filter(q => q.assessment_id === assessmentId);
}

// Attempts functions
export function loadAssessmentAttempts(): AssessmentAttempt[] {
  try {
    const stored = localStorage.getItem(ASSESSMENT_ATTEMPTS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading assessment attempts from localStorage:', error);
  }
  localStorage.setItem(ASSESSMENT_ATTEMPTS_STORAGE_KEY, JSON.stringify(initialAttempts));
  return initialAttempts;
}

export function saveAssessmentAttempts(attempts: AssessmentAttempt[]): void {
  try {
    localStorage.setItem(ASSESSMENT_ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Error saving assessment attempts to localStorage:', error);
  }
}

export function getAttemptsByStudent(studentId: string): AssessmentAttempt[] {
  const attempts = loadAssessmentAttempts();
  return attempts.filter(a => a.student_id === studentId);
}

export function getAttemptsByAssessment(assessmentId: string): AssessmentAttempt[] {
  const attempts = loadAssessmentAttempts();
  return attempts.filter(a => a.assessment_id === assessmentId);
}

// Legacy exports for backward compatibility
export const mockAssessments = loadAssessments();
export const mockAssessmentQuestions = loadAssessmentQuestions();
export const mockAssessmentAttempts = loadAssessmentAttempts();

export const mockAssessmentAnalytics: AssessmentAnalytics[] = [
  {
    assessment_id: 'assessment-3',
    total_attempts: 45,
    completed_attempts: 45,
    in_progress_attempts: 0,
    average_score: 48.5,
    pass_rate: 82.2,
    average_time_taken_minutes: 32,
    institution_stats: [
      {
        institution_id: 'inst-msd-001',
        institution_name: 'Modern School Vasant Vihar',
        attempts: 45,
        average_score: 48.5,
        pass_rate: 82.2
      }
    ],
    question_stats: [
      {
        question_id: 'q-3-1',
        question_number: 1,
        correct_count: 42,
        incorrect_count: 3,
        accuracy_rate: 93.3,
        average_time_seconds: 25
      },
      {
        question_id: 'q-3-2',
        question_number: 2,
        correct_count: 40,
        incorrect_count: 5,
        accuracy_rate: 88.9,
        average_time_seconds: 28
      }
    ]
  },
  {
    assessment_id: 'assessment-1',
    total_attempts: 12,
    completed_attempts: 8,
    in_progress_attempts: 4,
    average_score: 38.5,
    pass_rate: 62.5,
    average_time_taken_minutes: 26,
    institution_stats: [
      {
        institution_id: 'inst-msd-001',
        institution_name: 'Modern School Vasant Vihar',
        attempts: 12,
        average_score: 38.5,
        pass_rate: 62.5
      }
    ],
    question_stats: [
      {
        question_id: 'q-1-1',
        question_number: 1,
        correct_count: 6,
        incorrect_count: 2,
        accuracy_rate: 75,
        average_time_seconds: 45
      },
      {
        question_id: 'q-1-2',
        question_number: 2,
        correct_count: 7,
        incorrect_count: 1,
        accuracy_rate: 87.5,
        average_time_seconds: 38
      }
    ]
  }
];
