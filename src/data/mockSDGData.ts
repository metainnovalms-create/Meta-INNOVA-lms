import { SDGInfo, SDGGoal, SDGMapping, SDGAnalytics } from '@/types/sdg';

// All 17 UN Sustainable Development Goals with official colors
export const sdgGoals: SDGInfo[] = [
  { id: 'SDG1', number: 1, title: 'No Poverty', description: 'End poverty in all its forms everywhere', color: '#E5243B' },
  { id: 'SDG2', number: 2, title: 'Zero Hunger', description: 'End hunger, achieve food security and improved nutrition', color: '#DDA63A' },
  { id: 'SDG3', number: 3, title: 'Good Health and Well-being', description: 'Ensure healthy lives and promote well-being for all', color: '#4C9F38' },
  { id: 'SDG4', number: 4, title: 'Quality Education', description: 'Ensure inclusive and equitable quality education', color: '#C5192D' },
  { id: 'SDG5', number: 5, title: 'Gender Equality', description: 'Achieve gender equality and empower all women and girls', color: '#FF3A21' },
  { id: 'SDG6', number: 6, title: 'Clean Water and Sanitation', description: 'Ensure availability and sustainable management of water', color: '#26BDE2' },
  { id: 'SDG7', number: 7, title: 'Affordable and Clean Energy', description: 'Ensure access to affordable, reliable, sustainable energy', color: '#FCC30B' },
  { id: 'SDG8', number: 8, title: 'Decent Work and Economic Growth', description: 'Promote sustained, inclusive and sustainable economic growth', color: '#A21942' },
  { id: 'SDG9', number: 9, title: 'Industry, Innovation and Infrastructure', description: 'Build resilient infrastructure, promote inclusive industrialization', color: '#FD6925' },
  { id: 'SDG10', number: 10, title: 'Reduced Inequalities', description: 'Reduce inequality within and among countries', color: '#DD1367' },
  { id: 'SDG11', number: 11, title: 'Sustainable Cities and Communities', description: 'Make cities and human settlements inclusive, safe, resilient', color: '#FD9D24' },
  { id: 'SDG12', number: 12, title: 'Responsible Consumption and Production', description: 'Ensure sustainable consumption and production patterns', color: '#BF8B2E' },
  { id: 'SDG13', number: 13, title: 'Climate Action', description: 'Take urgent action to combat climate change', color: '#3F7E44' },
  { id: 'SDG14', number: 14, title: 'Life Below Water', description: 'Conserve and sustainably use the oceans, seas and marine resources', color: '#0A97D9' },
  { id: 'SDG15', number: 15, title: 'Life on Land', description: 'Protect, restore and promote sustainable use of terrestrial ecosystems', color: '#56C02B' },
  { id: 'SDG16', number: 16, title: 'Peace, Justice and Strong Institutions', description: 'Promote peaceful and inclusive societies for sustainable development', color: '#00689D' },
  { id: 'SDG17', number: 17, title: 'Partnerships for the Goals', description: 'Strengthen the means of implementation and revitalize global partnership', color: '#19486A' },
];

// SDG mappings for courses
export const mockCourseSDGMappings: SDGMapping[] = [
  { entity_type: 'course', entity_id: 'course-1', sdg_goals: ['SDG4', 'SDG9'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Basic Electronics
  { entity_type: 'course', entity_id: 'course-2', sdg_goals: ['SDG9', 'SDG11'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // IoT
  { entity_type: 'course', entity_id: 'course-3', sdg_goals: ['SDG4', 'SDG9'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Robotics
  { entity_type: 'course', entity_id: 'course-4', sdg_goals: ['SDG4', 'SDG9'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // AI
  { entity_type: 'course', entity_id: 'course-5', sdg_goals: ['SDG4', 'SDG9'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Data Science
  { entity_type: 'course', entity_id: 'course-6', sdg_goals: ['SDG4', 'SDG9'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // AR/VR/MR/XR
  { entity_type: 'course', entity_id: 'course-7', sdg_goals: ['SDG9', 'SDG16'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Blockchain
  { entity_type: 'course', entity_id: 'course-8', sdg_goals: ['SDG9', 'SDG11'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Drones
  { entity_type: 'course', entity_id: 'course-9', sdg_goals: ['SDG9', 'SDG16'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Cybersecurity
  { entity_type: 'course', entity_id: 'course-10', sdg_goals: ['SDG8', 'SDG9', 'SDG12'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Design Thinking
  { entity_type: 'course', entity_id: 'course-11', sdg_goals: ['SDG9', 'SDG12'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Product Design
  { entity_type: 'course', entity_id: 'course-12', sdg_goals: ['SDG9', 'SDG12'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Prototyping
  { entity_type: 'course', entity_id: 'course-13', sdg_goals: ['SDG6', 'SDG7', 'SDG13', 'SDG15'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Environmental Technology
  { entity_type: 'course', entity_id: 'course-14', sdg_goals: ['SDG1', 'SDG2', 'SDG3', 'SDG4', 'SDG5', 'SDG6', 'SDG7', 'SDG8', 'SDG9', 'SDG10', 'SDG11', 'SDG12', 'SDG13', 'SDG14', 'SDG15', 'SDG16', 'SDG17'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // SDG Course
  { entity_type: 'course', entity_id: 'course-15', sdg_goals: ['SDG4', 'SDG16'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Ethics
  { entity_type: 'course', entity_id: 'course-16', sdg_goals: ['SDG4', 'SDG16'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Etiquettes
  { entity_type: 'course', entity_id: 'course-17', sdg_goals: ['SDG3', 'SDG4', 'SDG16'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Human Values
  { entity_type: 'course', entity_id: 'course-18', sdg_goals: ['SDG4', 'SDG8'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Digital Media
  { entity_type: 'course', entity_id: 'course-19', sdg_goals: ['SDG4', 'SDG8'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Communication
  { entity_type: 'course', entity_id: 'course-20', sdg_goals: ['SDG4', 'SDG9'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Prompt Engineering
  { entity_type: 'course', entity_id: 'course-21', sdg_goals: ['SDG8', 'SDG9'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Entrepreneurship
  { entity_type: 'course', entity_id: 'course-22', sdg_goals: ['SDG1', 'SDG8'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Financial Literacy
  { entity_type: 'course', entity_id: 'course-23', sdg_goals: ['SDG4', 'SDG8'], mapped_at: '2025-01-10', mapped_by: 'admin-1' }, // Career Preparation
];

// SDG mappings for projects
export const mockProjectSDGMappings: SDGMapping[] = [
  { entity_type: 'project', entity_id: 'proj-msd-001', sdg_goals: ['SDG11', 'SDG12'], mapped_at: '2025-07-01', mapped_by: 'off-msd-001' },
  { entity_type: 'project', entity_id: 'proj-msd-002', sdg_goals: ['SDG6', 'SDG7'], mapped_at: '2025-08-01', mapped_by: 'off-msd-001' },
  { entity_type: 'project', entity_id: 'proj-kga-001', sdg_goals: ['SDG9', 'SDG11'], mapped_at: '2025-06-01', mapped_by: 'off-kga-001' },
  { entity_type: 'project', entity_id: 'proj-kga-002', sdg_goals: ['SDG12', 'SDG15'], mapped_at: '2025-07-15', mapped_by: 'off-kga-002' },
  { entity_type: 'project', entity_id: 'proj-kga-003', sdg_goals: ['SDG7', 'SDG11', 'SDG12'], mapped_at: '2025-08-10', mapped_by: 'off-kga-001' },
];

// Helper function to get course SDGs
export const getCourseSDGs = (courseId: string): string[] => {
  const mapping = mockCourseSDGMappings.find(m => m.entity_id === courseId);
  return mapping?.sdg_goals || [];
};

// Helper function to get project SDGs
export const getProjectSDGs = (projectId: string): string[] => {
  const mapping = mockProjectSDGMappings.find(m => m.entity_id === projectId);
  return mapping?.sdg_goals || [];
};

// Helper function to get SDG info by ID
export const getSDGInfo = (sdgId: SDGGoal): SDGInfo | undefined => {
  return sdgGoals.find(sdg => sdg.id === sdgId);
};

// Helper function to calculate SDG analytics
export const getSDGAnalytics = (): SDGAnalytics[] => {
  return sdgGoals.map(sdg => {
    const coursesWithSDG = mockCourseSDGMappings.filter(m => 
      m.sdg_goals.includes(sdg.id)
    ).length;
    
    const projectsWithSDG = mockProjectSDGMappings.filter(m => 
      m.sdg_goals.includes(sdg.id)
    ).length;

    return {
      sdg_goal: sdg.id,
      sdg_info: sdg,
      course_count: coursesWithSDG,
      project_count: projectsWithSDG,
      total_students_impacted: projectsWithSDG * 3, // Rough estimate: 3 students per project
      total_officers_involved: coursesWithSDG > 0 ? 2 : 0 // Estimate
    };
  });
};
