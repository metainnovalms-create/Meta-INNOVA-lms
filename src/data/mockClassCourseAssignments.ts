import { ClassCourseAssignment } from '@/types/institution';

export const mockClassCourseAssignments: ClassCourseAssignment[] = [
  // Grade 9 Section A - Full Stack Development
  {
    id: 'assign-1-9a',
    class_id: 'class-1-9a',
    course_id: 'course-1',
    course_title: 'Full Stack Development',
    course_thumbnail: '/placeholder.svg',
    course_category: 'Web Development',
    assigned_modules: [
      {
        module_id: 'mod-fs-1',
        module_title: 'HTML & CSS Fundamentals',
        module_order: 1,
        unlock_mode: 'immediate',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 30
      },
      {
        module_id: 'mod-fs-2',
        module_title: 'JavaScript Basics',
        module_order: 2,
        unlock_mode: 'immediate',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 28
      },
      {
        module_id: 'mod-fs-3',
        module_title: 'React Fundamentals',
        module_order: 3,
        unlock_mode: 'immediate',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 22
      },
      {
        module_id: 'mod-fs-4',
        module_title: 'Node.js & Express',
        module_order: 4,
        unlock_mode: 'immediate',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 15
      }
    ],
    assigned_officers: ['off-1', 'off-2'],
    start_date: '2024-09-01',
    expected_end_date: '2024-12-15',
    status: 'active',
    created_at: '2024-08-15T10:00:00Z',
    updated_at: '2024-08-15T10:00:00Z'
  },

  // Grade 9 Section B - AI & Machine Learning
  {
    id: 'assign-1-9b',
    class_id: 'class-1-9b',
    course_id: 'course-2',
    course_title: 'AI & Machine Learning',
    course_thumbnail: '/placeholder.svg',
    course_category: 'Artificial Intelligence',
    assigned_modules: [
      {
        module_id: 'mod-ai-1',
        module_title: 'Introduction to AI',
        module_order: 1,
        unlock_mode: 'sequential',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 31
      },
      {
        module_id: 'mod-ai-2',
        module_title: 'Python for Data Science',
        module_order: 2,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-ai-1',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 25
      },
      {
        module_id: 'mod-ai-3',
        module_title: 'Machine Learning Algorithms',
        module_order: 3,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-ai-2',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 18
      },
      {
        module_id: 'mod-ai-4',
        module_title: 'Neural Networks',
        module_order: 4,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-ai-3',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 8
      },
      {
        module_id: 'mod-ai-5',
        module_title: 'Deep Learning',
        module_order: 5,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-ai-4',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 0
      },
      {
        module_id: 'mod-ai-6',
        module_title: 'AI Project',
        module_order: 6,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-ai-5',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: false,
          minimum_score_percent: 80
        },
        students_completed: 0
      }
    ],
    assigned_officers: ['off-1', 'off-3'],
    start_date: '2024-09-01',
    expected_end_date: '2025-03-31',
    status: 'active',
    created_at: '2024-08-15T10:00:00Z',
    updated_at: '2024-08-15T10:00:00Z'
  },

  // Grade 10 Section A - Cybersecurity Basics
  {
    id: 'assign-1-10a',
    class_id: 'class-1-10a',
    course_id: 'course-3',
    course_title: 'Cybersecurity Basics',
    course_thumbnail: '/placeholder.svg',
    course_category: 'Cybersecurity',
    assigned_modules: [
      {
        module_id: 'mod-cs-1',
        module_title: 'Introduction to Cybersecurity',
        module_order: 1,
        unlock_mode: 'date_based',
        unlock_date: '2024-09-01',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 28
      },
      {
        module_id: 'mod-cs-2',
        module_title: 'Network Security',
        module_order: 2,
        unlock_mode: 'date_based',
        unlock_date: '2024-10-01',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 24
      },
      {
        module_id: 'mod-cs-3',
        module_title: 'Ethical Hacking',
        module_order: 3,
        unlock_mode: 'date_based',
        unlock_date: '2024-11-01',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 16
      }
    ],
    assigned_officers: ['off-2', 'off-4'],
    start_date: '2024-09-01',
    expected_end_date: '2024-12-31',
    status: 'active',
    created_at: '2024-08-20T10:00:00Z',
    updated_at: '2024-08-20T10:00:00Z'
  },

  // Grade 11 Section A - IoT & Robotics
  {
    id: 'assign-1-11a',
    class_id: 'class-1-11a',
    course_id: 'course-4',
    course_title: 'IoT & Robotics',
    course_thumbnail: '/placeholder.svg',
    course_category: 'Emerging Technologies',
    assigned_modules: [
      {
        module_id: 'mod-iot-1',
        module_title: 'Introduction to IoT',
        module_order: 1,
        unlock_mode: 'immediate',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 26
      },
      {
        module_id: 'mod-iot-2',
        module_title: 'Sensors & Actuators',
        module_order: 2,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-iot-1',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 22
      },
      {
        module_id: 'mod-iot-3',
        module_title: 'Arduino Programming',
        module_order: 3,
        unlock_mode: 'date_based',
        unlock_date: '2024-10-15',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 18
      },
      {
        module_id: 'mod-iot-4',
        module_title: 'Robotics Basics',
        module_order: 4,
        unlock_mode: 'manual',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 75
        },
        students_completed: 12
      },
      {
        module_id: 'mod-iot-5',
        module_title: 'IoT Project',
        module_order: 5,
        unlock_mode: 'manual',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: false,
          minimum_score_percent: 80
        },
        students_completed: 0
      }
    ],
    assigned_officers: ['off-3', 'off-4'],
    start_date: '2024-09-10',
    expected_end_date: '2025-02-28',
    status: 'active',
    created_at: '2024-08-25T10:00:00Z',
    updated_at: '2024-08-25T10:00:00Z'
  },

  // Grade 12 Section A - Advanced Programming
  {
    id: 'assign-1-12a',
    class_id: 'class-1-12a',
    course_id: 'course-5',
    course_title: 'Advanced Programming & DSA',
    course_thumbnail: '/placeholder.svg',
    course_category: 'Computer Science',
    assigned_modules: [
      {
        module_id: 'mod-adv-1',
        module_title: 'Advanced Python',
        module_order: 1,
        unlock_mode: 'manual',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 80
        },
        students_completed: 23
      },
      {
        module_id: 'mod-adv-2',
        module_title: 'Data Structures',
        module_order: 2,
        unlock_mode: 'manual',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 80
        },
        students_completed: 20
      },
      {
        module_id: 'mod-adv-3',
        module_title: 'Algorithms',
        module_order: 3,
        unlock_mode: 'manual',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 80
        },
        students_completed: 18
      },
      {
        module_id: 'mod-adv-4',
        module_title: 'Dynamic Programming',
        module_order: 4,
        unlock_mode: 'manual',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 85
        },
        students_completed: 12
      },
      {
        module_id: 'mod-adv-5',
        module_title: 'Graph Algorithms',
        module_order: 5,
        unlock_mode: 'manual',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 85
        },
        students_completed: 8
      },
      {
        module_id: 'mod-adv-6',
        module_title: 'Advanced Topics',
        module_order: 6,
        unlock_mode: 'manual',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 85
        },
        students_completed: 0
      },
      {
        module_id: 'mod-adv-7',
        module_title: 'System Design',
        module_order: 7,
        unlock_mode: 'manual',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: false,
          minimum_score_percent: 80
        },
        students_completed: 0
      },
      {
        module_id: 'mod-adv-8',
        module_title: 'Capstone Project',
        module_order: 8,
        unlock_mode: 'manual',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: false,
          minimum_score_percent: 90
        },
        students_completed: 0
      }
    ],
    assigned_officers: ['off-1', 'off-2'],
    start_date: '2024-09-01',
    expected_end_date: '2025-05-31',
    status: 'active',
    created_at: '2024-08-10T10:00:00Z',
    updated_at: '2024-08-10T10:00:00Z'
  },

  // Legacy data - Springfield High School
  {
    id: 'assign-spring-1',
    class_id: 'class-spring-1',
    course_id: 'course-1',
    course_title: 'Introduction to AI & ML',
    course_thumbnail: '/placeholder.svg',
    course_category: 'Artificial Intelligence',
    assigned_modules: [
      {
        module_id: 'mod-1-1',
        module_title: 'Introduction to AI Concepts',
        module_order: 1,
        unlock_mode: 'immediate',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 28
      },
      {
        module_id: 'mod-1-2',
        module_title: 'Machine Learning Basics',
        module_order: 2,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-1-1',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 15
      },
      {
        module_id: 'mod-1-3',
        module_title: 'Neural Networks',
        module_order: 3,
        unlock_mode: 'sequential',
        prerequisite_module_id: 'mod-1-2',
        is_unlocked: false,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 70
        },
        students_completed: 0
      }
    ],
    assigned_officers: ['off-1', 'off-2'],
    start_date: '2024-09-01',
    expected_end_date: '2024-12-15',
    status: 'active',
    created_at: '2024-08-15T10:00:00Z',
    updated_at: '2024-08-15T10:00:00Z'
  },
  
  // Ryan International - Class 2D
  {
    id: 'assign-ryan-1',
    class_id: 'class-ryan-1',
    course_id: 'course-2',
    course_title: 'Web Development Fundamentals',
    course_thumbnail: '/placeholder.svg',
    course_category: 'Web Development',
    assigned_modules: [
      {
        module_id: 'mod-2-1',
        module_title: 'HTML & CSS Basics',
        module_order: 1,
        unlock_mode: 'immediate',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: false,
          minimum_score_percent: 60
        },
        students_completed: 22
      },
      {
        module_id: 'mod-2-2',
        module_title: 'JavaScript Fundamentals',
        module_order: 2,
        unlock_mode: 'date_based',
        unlock_date: '2024-10-01',
        is_unlocked: true,
        completion_requirement: {
          require_all_content: true,
          require_all_assignments: true,
          require_all_quizzes: true,
          minimum_score_percent: 65
        },
        students_completed: 18
      }
    ],
    assigned_officers: ['off-3'],
    start_date: '2024-09-10',
    expected_end_date: '2024-11-30',
    status: 'active',
    created_at: '2024-08-20T10:00:00Z',
    updated_at: '2024-08-20T10:00:00Z'
  }
];

export const getCourseAssignmentsByClass = (classId: string): ClassCourseAssignment[] => {
  return mockClassCourseAssignments.filter(assignment => assignment.class_id === classId);
};
