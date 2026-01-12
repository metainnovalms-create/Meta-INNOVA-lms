export interface Survey {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  deadline: string;
  target_audience: 'all_students' | 'specific_institution' | 'specific_class';
  target_ids?: string[];
  target_institution_name?: string;
  status: 'active' | 'closed';
  questions: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: 'mcq' | 'multiple_select' | 'rating' | 'text' | 'long_text' | 'linear_scale';
  options?: string[];
  required: boolean;
  scale_min?: number;
  scale_max?: number;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  student_id: string;
  responses: { question_id: string; answer: string | string[] | number }[];
  submitted_at: string;
  status: 'draft' | 'submitted';
}

// localStorage key for bidirectional sync
const SURVEYS_STORAGE_KEY = 'admin_surveys';

// Load from localStorage or use defaults - EXPORTED for use by pages
export const loadSurveys = (): Survey[] => {
  const stored = localStorage.getItem(SURVEYS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return defaultSurveys;
};

const defaultSurveys: Survey[] = [
  {
    id: 'survey-1',
    title: 'Course Feedback Survey - Spring 2024',
    description: 'Help us improve your learning experience by sharing your feedback on the courses you\'re enrolled in this semester.',
    created_by: 'meta-admin-1',
    created_by_name: 'Meta Admin Team',
    created_at: '2024-03-15T08:00:00Z',
    deadline: '2024-03-30T23:59:59Z',
    target_audience: 'all_students',
    status: 'active',
    questions: [
      {
        id: 'q1',
        question_text: 'How would you rate the overall quality of your courses this semester?',
        question_type: 'rating',
        required: true,
        scale_min: 1,
        scale_max: 5
      },
      {
        id: 'q2',
        question_text: 'Which course has been most valuable to you?',
        question_type: 'text',
        required: true
      },
      {
        id: 'q3',
        question_text: 'What aspects of the courses do you find most engaging? (Select all that apply)',
        question_type: 'multiple_select',
        options: [
          'Hands-on projects',
          'Interactive sessions',
          'Video lectures',
          'Reading materials',
          'Group discussions',
          'Assessments and quizzes'
        ],
        required: true
      },
      {
        id: 'q4',
        question_text: 'On a scale of 1-10, how challenging do you find the course content?',
        question_type: 'linear_scale',
        required: true,
        scale_min: 1,
        scale_max: 10
      },
      {
        id: 'q5',
        question_text: 'Please share any suggestions for improving the courses or learning experience.',
        question_type: 'long_text',
        required: false
      }
    ]
  },
  {
    id: 'survey-2',
    title: 'Innovation Lab Experience Survey',
    description: 'We value your input on the Innovation Lab facilities, equipment, and overall experience.',
    created_by: 'meta-admin-1',
    created_by_name: 'Meta Admin Team',
    created_at: '2024-03-10T10:00:00Z',
    deadline: '2024-03-25T23:59:59Z',
    target_audience: 'all_students',
    status: 'active',
    questions: [
      {
        id: 'q6',
        question_text: 'Have you used the Innovation Lab this semester?',
        question_type: 'mcq',
        options: ['Yes, frequently', 'Yes, occasionally', 'Once or twice', 'Never'],
        required: true
      },
      {
        id: 'q7',
        question_text: 'Rate the quality of equipment and tools available in the Innovation Lab',
        question_type: 'rating',
        required: true,
        scale_min: 1,
        scale_max: 5
      },
      {
        id: 'q8',
        question_text: 'What additional equipment or resources would you like to see in the Innovation Lab?',
        question_type: 'long_text',
        required: false
      },
      {
        id: 'q9',
        question_text: 'How helpful is the Innovation Officer support?',
        question_type: 'rating',
        required: true,
        scale_min: 1,
        scale_max: 5
      }
    ]
  },
  {
    id: 'survey-3',
    title: 'Mid-Semester Student Satisfaction Survey',
    description: 'Your feedback helps us enhance your overall educational experience. This survey covers various aspects of student life.',
    created_by: 'meta-admin-2',
    created_by_name: 'Student Affairs Team',
    created_at: '2024-03-12T09:00:00Z',
    deadline: '2024-03-28T23:59:59Z',
    target_audience: 'all_students',
    status: 'active',
    questions: [
      {
        id: 'q10',
        question_text: 'How satisfied are you with the communication from administration?',
        question_type: 'rating',
        required: true,
        scale_min: 1,
        scale_max: 5
      },
      {
        id: 'q11',
        question_text: 'What is your preferred method of communication?',
        question_type: 'mcq',
        options: ['Email', 'Platform notifications', 'SMS', 'WhatsApp', 'In-person'],
        required: true
      },
      {
        id: 'q12',
        question_text: 'Rate your overall satisfaction with the platform features',
        question_type: 'linear_scale',
        required: true,
        scale_min: 1,
        scale_max: 10
      },
      {
        id: 'q13',
        question_text: 'Which platform features do you use most? (Select all that apply)',
        question_type: 'multiple_select',
        options: [
          'Course content viewer',
          'Assignments',
          'Assessments/Quizzes',
          'Certificates',
          'Projects',
          'Events',
          'Gamification/Leaderboard',
          'Timetable'
        ],
        required: true
      },
      {
        id: 'q14',
        question_text: 'Any additional comments or suggestions?',
        question_type: 'long_text',
        required: false
      }
    ]
  },
  {
    id: 'survey-4',
    title: 'Event Participation Feedback - Tech Fest 2024',
    description: 'Thank you for participating in Tech Fest 2024! Share your experience with us.',
    created_by: 'meta-admin-1',
    created_by_name: 'Events Team',
    created_at: '2024-03-05T12:00:00Z',
    deadline: '2024-03-20T23:59:59Z',
    target_audience: 'all_students',
    status: 'active',
    questions: [
      {
        id: 'q15',
        question_text: 'Did you attend Tech Fest 2024?',
        question_type: 'mcq',
        options: ['Yes', 'No'],
        required: true
      },
      {
        id: 'q16',
        question_text: 'How would you rate the overall event organization?',
        question_type: 'rating',
        required: true,
        scale_min: 1,
        scale_max: 5
      },
      {
        id: 'q17',
        question_text: 'What did you enjoy most about the event?',
        question_type: 'long_text',
        required: false
      },
      {
        id: 'q18',
        question_text: 'Would you participate in future events?',
        question_type: 'mcq',
        options: ['Definitely', 'Probably', 'Maybe', 'Probably not', 'Definitely not'],
        required: true
      }
    ]
  },
  {
    id: 'survey-5',
    title: 'Innovation Lab Equipment Feedback',
    description: 'Help us understand what equipment and resources you need in the innovation lab',
    created_by: 'System Admin',
    created_by_name: 'System Admin',
    created_at: '2024-01-25',
    deadline: '2024-02-25',
    target_audience: 'specific_institution',
    target_ids: ['inst-msd-001'],
    target_institution_name: 'Modern School Vasant Vihar',
    status: 'active',
    questions: [
      {
        id: 'q1',
        question_text: 'What type of equipment would be most useful for your projects?',
        question_type: 'mcq',
        options: ['3D Printers', 'Robotics Kits', 'Arduino/Raspberry Pi', 'VR/AR Devices', 'Drones'],
        required: true
      },
      {
        id: 'q2',
        question_text: 'How often do you use the innovation lab?',
        question_type: 'rating',
        required: true
      },
      {
        id: 'q3',
        question_text: 'What additional resources would help your learning?',
        question_type: 'text',
        required: false
      }
    ]
  },
  {
    id: 'survey-6',
    title: 'Student Wellbeing Check-in',
    description: 'We care about your overall wellbeing and want to support you better',
    created_by: 'System Admin',
    created_by_name: 'System Admin',
    created_at: '2024-01-28',
    deadline: '2024-02-28',
    target_audience: 'all_students',
    status: 'active',
    questions: [
      {
        id: 'q1',
        question_text: 'How would you rate your current stress level?',
        question_type: 'linear_scale',
        required: true
      },
      {
        id: 'q2',
        question_text: 'Do you feel supported by your teachers and officers?',
        question_type: 'mcq',
        options: ['Very supported', 'Somewhat supported', 'Neutral', 'Not very supported', 'Not supported at all'],
        required: true
      },
      {
        id: 'q3',
        question_text: 'What can we do to improve your learning experience?',
        question_type: 'text',
        required: false
      }
    ]
  }
];

export const mockSurveys: Survey[] = loadSurveys();

// Save surveys helper
export const saveSurveys = (surveys: Survey[]) => {
  localStorage.setItem(SURVEYS_STORAGE_KEY, JSON.stringify(surveys));
};

export const mockSurveyResponses: SurveyResponse[] = [
  {
    id: 'response-1',
    survey_id: 'survey-4',
    student_id: 'student-1',
    responses: [
      { question_id: 'q15', answer: 'Yes' },
      { question_id: 'q16', answer: 4 },
      { question_id: 'q17', answer: 'The workshops were excellent and the networking opportunities were great!' },
      { question_id: 'q18', answer: 'Definitely' }
    ],
    submitted_at: '2024-03-18T15:30:00Z',
    status: 'submitted'
  }
];
