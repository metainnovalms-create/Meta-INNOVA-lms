export interface Feedback {
  id: string;
  student_id: string;
  student_name?: string;
  institution_id: string;
  institution_name: string;
  category: 'course' | 'officer' | 'facility' | 'general' | 'other';
  subject: string;
  feedback_text: string;
  rating?: number;
  status: 'submitted' | 'under_review' | 'resolved' | 'dismissed';
  is_anonymous: boolean;
  related_course_id?: string;
  related_officer_id?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_response?: string;
  admin_response_at?: string;
}

const FEEDBACK_STORAGE_KEY = 'all_student_feedback';

const loadFeedback = (): Feedback[] => {
  const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  return defaultFeedback;
};

const defaultFeedback: Feedback[] = [
  {
    id: 'feedback-1',
    student_id: 'MSD-2024-001',
    student_name: 'Aarav Sharma',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    category: 'course',
    subject: 'Excellent AI Course Content',
    feedback_text: 'The AI & Machine Learning course has been incredibly insightful. The practical projects helped me understand complex concepts easily. I would love to see more advanced topics covered in future modules.',
    rating: 5,
    status: 'resolved',
    is_anonymous: false,
    related_course_id: 'course-ai-ml',
    submitted_at: '2024-01-10T10:30:00Z',
    reviewed_at: '2024-01-12T14:20:00Z',
    reviewed_by: 'System Admin',
    admin_response: 'Thank you for your positive feedback! We\'re glad you\'re enjoying the course. We\'ll definitely consider adding more advanced topics in the next semester.',
    admin_response_at: '2024-01-12T14:20:00Z'
  },
  {
    id: 'feedback-2',
    student_id: 'MSD-2024-012',
    student_name: 'Priya Patel',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    category: 'officer',
    subject: 'Great Teaching Style - Mr. Atif Ansari',
    feedback_text: 'Mr. Atif Ansari explains concepts very clearly and always takes time to answer our questions. His enthusiasm for robotics and IoT is contagious! The hands-on projects really help us understand better.',
    rating: 5,
    status: 'resolved',
    is_anonymous: false,
    related_officer_id: 'off-msd-001',
    submitted_at: '2024-01-15T14:45:00Z',
    reviewed_at: '2024-01-16T10:30:00Z',
    reviewed_by: 'System Admin',
    admin_response: 'Thank you for the wonderful feedback! We\'ve shared your comments with Mr. Ansari. He\'s delighted to hear about your progress.',
    admin_response_at: '2024-01-16T10:30:00Z'
  },
  {
    id: 'feedback-3',
    student_id: 'MSD-2024-025',
    student_name: 'Rahul Verma',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    category: 'facility',
    subject: 'Need More Computer Lab Access',
    feedback_text: 'The computer lab is excellent with good equipment, but it would be great if we could have extended hours for working on our projects, especially before submission deadlines. Sometimes we need more time to debug and test.',
    rating: 3,
    status: 'under_review',
    is_anonymous: false,
    submitted_at: '2024-01-18T16:20:00Z',
    reviewed_at: '2024-01-19T09:00:00Z',
    reviewed_by: 'System Admin'
  },
  {
    id: 'feedback-4',
    student_id: 'MSD-2024-045',
    student_name: 'Anonymous',
    institution_id: 'inst-msd-001',
    institution_name: 'Modern School Vasant Vihar',
    category: 'general',
    subject: 'Suggestion for Coding Club',
    feedback_text: 'I think it would be wonderful to have a weekly coding club where students from different grades can collaborate on projects and learn from each other. This could help build a stronger community.',
    rating: 4,
    status: 'submitted',
    is_anonymous: true,
    submitted_at: '2024-01-20T11:15:00Z'
  },
  {
    id: 'feedback-5',
    student_id: 'KGA-2024-015',
    student_name: 'Ananya Krishnan',
    institution_id: 'inst-kga-001',
    institution_name: 'Kikani Global Academy',
    category: 'course',
    subject: 'IoT Course - Great Practical Approach',
    feedback_text: 'The IoT Fundamentals course taught by Mr. Saran T is excellent! The hands-on approach with real sensors and devices makes learning so much more engaging. Would love more projects like smart home automation.',
    rating: 5,
    status: 'resolved',
    is_anonymous: false,
    related_course_id: 'course-iot',
    related_officer_id: 'off-kga-001',
    submitted_at: '2024-01-22T09:30:00Z',
    reviewed_at: '2024-01-23T11:00:00Z',
    reviewed_by: 'System Admin',
    admin_response: 'Thank you Ananya! We\'re thrilled you\'re enjoying the IoT course. Mr. Saran has noted your interest in smart home projects and will include them in upcoming sessions.',
    admin_response_at: '2024-01-23T11:00:00Z'
  },
  {
    id: 'feedback-6',
    student_id: 'KGA-2024-032',
    student_name: 'Rohan Menon',
    institution_id: 'inst-kga-001',
    institution_name: 'Kikani Global Academy',
    category: 'officer',
    subject: 'Excellent Support from Mr. Sreeram',
    feedback_text: 'Mr. Sreeram R has been incredibly supportive in our robotics project. He stays after class to help debug our code and provides valuable insights. His mentorship has really boosted our confidence.',
    rating: 5,
    status: 'resolved',
    is_anonymous: false,
    related_officer_id: 'off-kga-002',
    submitted_at: '2024-01-24T15:20:00Z',
    reviewed_at: '2024-01-25T10:15:00Z',
    reviewed_by: 'System Admin',
    admin_response: 'Thank you for sharing this wonderful feedback! Mr. Sreeram is dedicated to student success and we\'re glad he\'s making a positive impact on your learning.',
    admin_response_at: '2024-01-25T10:15:00Z'
  }
];

export const mockFeedback: Feedback[] = loadFeedback();

export const saveFeedback = (feedback: Feedback[]) => {
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedback));
};
