export interface InstitutionEngagement {
  institution_id: string;
  institution_name: string;
  period: string;
  
  course_metrics: {
    total_courses_assigned: number;
    courses_in_use: number;
    average_completion_rate: number;
    active_students: number;
    inactive_students: number;
    daily_active_users: number;
    weekly_active_users: number;
    most_used_courses: string[];
    least_used_courses: string[];
  };
  
  assessment_metrics: {
    total_assessments_created: number;
    assessments_completed: number;
    average_participation_rate: number;
    average_score: number;
    assessments_pending: number;
  };
  
  lab_metrics: {
    active_projects: number;
    students_participating: number;
    lab_sessions_conducted: number;
    equipment_utilization_rate: number;
  };
  
  engagement_score: number;
  engagement_trend: 'increasing' | 'stable' | 'declining';
  risk_level: 'low' | 'medium' | 'high';
  
  last_login_date: string;
  days_since_last_activity: number;
  
  support_tickets: {
    open: number;
    resolved: number;
    average_resolution_time: number;
  };
}

export const mockInstitutionEngagement: InstitutionEngagement[] = [
  {
    institution_id: 'modern-school-vv',
    institution_name: 'Modern School Vasant Vihar',
    period: 'November 2024',
    course_metrics: {
      total_courses_assigned: 45,
      courses_in_use: 42,
      average_completion_rate: 89,
      active_students: 1850,
      inactive_students: 50,
      daily_active_users: 1245,
      weekly_active_users: 1750,
      most_used_courses: ['Advanced Robotics', 'AI & ML Fundamentals', '3D Design'],
      least_used_courses: ['Basic Electronics', 'CAD Introduction']
    },
    assessment_metrics: {
      total_assessments_created: 128,
      assessments_completed: 110,
      average_participation_rate: 86,
      average_score: 78,
      assessments_pending: 18
    },
    lab_metrics: {
      active_projects: 38,
      students_participating: 456,
      lab_sessions_conducted: 124,
      equipment_utilization_rate: 88
    },
    engagement_score: 85,
    engagement_trend: 'stable',
    risk_level: 'low',
    last_login_date: '2024-11-24T09:30:00Z',
    days_since_last_activity: 0,
    support_tickets: {
      open: 2,
      resolved: 15,
      average_resolution_time: 24
    }
  },
  {
    institution_id: 'kga',
    institution_name: 'Kikani Global Academy',
    period: 'November 2024',
    course_metrics: {
      total_courses_assigned: 32,
      courses_in_use: 25,
      average_completion_rate: 78,
      active_students: 850,
      inactive_students: 50,
      daily_active_users: 520,
      weekly_active_users: 780,
      most_used_courses: ['IoT Projects', 'Solar Energy Systems', 'Sustainable Tech'],
      least_used_courses: ['Advanced Programming', 'Cloud Computing']
    },
    assessment_metrics: {
      total_assessments_created: 68,
      assessments_completed: 49,
      average_participation_rate: 72,
      average_score: 74,
      assessments_pending: 19
    },
    lab_metrics: {
      active_projects: 18,
      students_participating: 245,
      lab_sessions_conducted: 78,
      equipment_utilization_rate: 75
    },
    engagement_score: 75,
    engagement_trend: 'increasing',
    risk_level: 'low',
    last_login_date: '2024-11-24T11:15:00Z',
    days_since_last_activity: 0,
    support_tickets: {
      open: 3,
      resolved: 12,
      average_resolution_time: 36
    }
  },
  {
    institution_id: 'valley-view',
    institution_name: 'Valley View School',
    period: 'November 2024',
    course_metrics: {
      total_courses_assigned: 25,
      courses_in_use: 12,
      average_completion_rate: 42,
      active_students: 180,
      inactive_students: 320,
      daily_active_users: 45,
      weekly_active_users: 150,
      most_used_courses: ['Basic Robotics', 'Science Projects'],
      least_used_courses: ['Advanced Electronics', 'Programming Basics', 'AI Introduction']
    },
    assessment_metrics: {
      total_assessments_created: 35,
      assessments_completed: 12,
      average_participation_rate: 35,
      average_score: 58,
      assessments_pending: 23
    },
    lab_metrics: {
      active_projects: 4,
      students_participating: 28,
      lab_sessions_conducted: 15,
      equipment_utilization_rate: 22
    },
    engagement_score: 38,
    engagement_trend: 'declining',
    risk_level: 'high',
    last_login_date: '2024-11-10T14:20:00Z',
    days_since_last_activity: 14,
    support_tickets: {
      open: 8,
      resolved: 5,
      average_resolution_time: 72
    }
  },
  {
    institution_id: 'dps-network',
    institution_name: 'DPS Network',
    period: 'November 2024',
    course_metrics: {
      total_courses_assigned: 52,
      courses_in_use: 48,
      average_completion_rate: 92,
      active_students: 2450,
      inactive_students: 50,
      daily_active_users: 1850,
      weekly_active_users: 2380,
      most_used_courses: ['Advanced AI', 'Quantum Computing Intro', 'Robotics Engineering'],
      least_used_courses: ['Basic CAD']
    },
    assessment_metrics: {
      total_assessments_created: 185,
      assessments_completed: 163,
      average_participation_rate: 88,
      average_score: 82,
      assessments_pending: 22
    },
    lab_metrics: {
      active_projects: 45,
      students_participating: 680,
      lab_sessions_conducted: 156,
      equipment_utilization_rate: 92
    },
    engagement_score: 87,
    engagement_trend: 'increasing',
    risk_level: 'low',
    last_login_date: '2024-11-24T08:45:00Z',
    days_since_last_activity: 0,
    support_tickets: {
      open: 1,
      resolved: 22,
      average_resolution_time: 18
    }
  },
  {
    institution_id: 'ryan-int',
    institution_name: 'Ryan International',
    period: 'November 2024',
    course_metrics: {
      total_courses_assigned: 38,
      courses_in_use: 33,
      average_completion_rate: 87,
      active_students: 1650,
      inactive_students: 50,
      daily_active_users: 1120,
      weekly_active_users: 1580,
      most_used_courses: ['Smart Home Projects', 'Environmental Tech', 'Mobile App Dev'],
      least_used_courses: ['Blockchain Basics', 'Cybersecurity']
    },
    assessment_metrics: {
      total_assessments_created: 142,
      assessments_completed: 118,
      average_participation_rate: 83,
      average_score: 76,
      assessments_pending: 24
    },
    lab_metrics: {
      active_projects: 32,
      students_participating: 425,
      lab_sessions_conducted: 98,
      equipment_utilization_rate: 85
    },
    engagement_score: 82,
    engagement_trend: 'increasing',
    risk_level: 'low',
    last_login_date: '2024-11-24T10:20:00Z',
    days_since_last_activity: 0,
    support_tickets: {
      open: 2,
      resolved: 18,
      average_resolution_time: 28
    }
  },
  {
    institution_id: 'st-thomas',
    institution_name: 'St. Thomas Academy',
    period: 'November 2024',
    course_metrics: {
      total_courses_assigned: 28,
      courses_in_use: 16,
      average_completion_rate: 62,
      active_students: 520,
      inactive_students: 180,
      daily_active_users: 280,
      weekly_active_users: 450,
      most_used_courses: ['Robotics Basics', 'Science Experiments'],
      least_used_courses: ['Advanced Programming', 'Data Science', 'Machine Learning']
    },
    assessment_metrics: {
      total_assessments_created: 56,
      assessments_completed: 31,
      average_participation_rate: 55,
      average_score: 64,
      assessments_pending: 25
    },
    lab_metrics: {
      active_projects: 8,
      students_participating: 95,
      lab_sessions_conducted: 42,
      equipment_utilization_rate: 48
    },
    engagement_score: 54,
    engagement_trend: 'declining',
    risk_level: 'medium',
    last_login_date: '2024-11-20T13:30:00Z',
    days_since_last_activity: 4,
    support_tickets: {
      open: 6,
      resolved: 8,
      average_resolution_time: 52
    }
  }
];
