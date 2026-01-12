import { Notification } from '@/types/notification';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    recipient_id: 'off-001',
    recipient_role: 'officer',
    type: 'assignment_submission',
    title: 'New Assignment Submission',
    message: 'Aarav Sharma submitted "Build a Linear Regression Model"',
    link: '/tenant/springfield/officer/grading',
    metadata: {
      assignment_id: 'assign-1',
      student_id: 'springfield-8-A-001',
      submission_id: 'sub-sp-1',
      course_id: 'course-1'
    },
    read: false,
    created_at: '2024-03-14T18:30:00Z'
  },
  {
    id: 'notif-002',
    recipient_id: 'off-001',
    recipient_role: 'officer',
    type: 'quiz_completion',
    title: 'Quiz Completed',
    message: 'Vivaan Verma completed "AI Fundamentals Quiz"',
    link: '/tenant/springfield/officer/grading',
    metadata: {
      quiz_id: 'quiz-1',
      student_id: 'springfield-8-A-002',
      course_id: 'course-1'
    },
    read: false,
    created_at: '2024-03-14T16:15:00Z'
  }
];
