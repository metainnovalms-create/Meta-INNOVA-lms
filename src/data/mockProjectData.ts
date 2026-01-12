// localStorage key for bidirectional sync
const PROJECTS_STORAGE_KEY = 'all_institution_projects';

export interface ProjectMember {
  id: string;
  name: string;
  role: 'leader' | 'member';
  class: string;
  section: string;
}

export interface ProgressUpdate {
  date: string;
  notes: string;
  updated_by: string;
  files?: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  
  // Team Information
  team_members: ProjectMember[];
  
  // Officer Information (preserved even if account deleted)
  created_by_officer_id: string;
  created_by_officer_name: string; // Stored as text for persistence
  
  // Institution
  institution_id: string;
  class: string;
  
  // Event Assignment
  event_id?: string; // Event this project is assigned to participate in
  event_title?: string; // Title of the assigned event (stored for persistence)
  
  // Project Lifecycle
  status: 'proposal' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  progress: number; // 0-100
  start_date: string;
  completion_date?: string;
  
  // SDG Goals
  sdg_goals: string[]; // SDG goal IDs (e.g., ['SDG11', 'SDG12'])
  
  // Progress Tracking
  last_updated: string;
  progress_updates: ProgressUpdate[];
  
  // Gallery/Awards (for showcase)
  is_showcase: boolean; // If true, appears in gallery
  achievements?: string[];
  awards?: string[];
  showcase_image?: string;
}

export const mockProjects: Record<string, Project[]> = {
  'inst-msd-001': [
    {
      id: 'proj-msd-001',
      title: 'Smart Waste Management System',
      description: 'IoT-based waste segregation and monitoring system for schools',
      category: 'IoT',
      team_members: [
        { id: 'stu-inst-msd-001-class-msd-9a-1', name: 'Aarav Sharma', role: 'leader', class: 'Grade 9', section: 'A' },
        { id: 'stu-inst-msd-001-class-msd-9a-2', name: 'Vivaan Verma', role: 'member', class: 'Grade 9', section: 'A' },
        { id: 'stu-inst-msd-001-class-msd-9b-1', name: 'Aditya Gupta', role: 'member', class: 'Grade 9', section: 'B' }
      ],
      created_by_officer_id: 'off-msd-001',
      created_by_officer_name: 'Mr. Atif Ansari',
      institution_id: 'inst-msd-001',
      class: 'Grade 9',
      status: 'in_progress',
      progress: 55,
      start_date: '2025-07-01',
      sdg_goals: ['SDG11', 'SDG12'],
      last_updated: '2025-09-15',
      progress_updates: [
        {
          date: '2025-09-15',
          notes: 'Prototype testing completed. Sensor integration successful.',
          updated_by: 'Mr. Atif Ansari'
        }
      ],
      is_showcase: false
    },
    {
      id: 'proj-msd-002',
      title: 'Solar-Powered Water Purifier',
      description: 'Low-cost water purification system using solar energy',
      category: 'Renewable Energy',
      team_members: [
        { id: 'stu-inst-msd-001-class-msd-10a-1', name: 'Ananya Verma', role: 'leader', class: 'Grade 10', section: 'A' },
        { id: 'stu-inst-msd-001-class-msd-10a-2', name: 'Diya Reddy', role: 'member', class: 'Grade 10', section: 'A' }
      ],
      created_by_officer_id: 'off-msd-001',
      created_by_officer_name: 'Mr. Atif Ansari',
      institution_id: 'inst-msd-001',
      class: 'Grade 10',
      event_id: 'evt-inspire-2025',
      event_title: 'Inspire Awards 2025',
      status: 'approved',
      progress: 30,
      start_date: '2025-08-01',
      sdg_goals: ['SDG6', 'SDG7'],
      last_updated: '2025-09-10',
      progress_updates: [
        {
          date: '2025-09-10',
          notes: 'Initial design approved. Working on solar panel integration.',
          updated_by: 'Mr. Atif Ansari'
        }
      ],
      is_showcase: false
    }
  ],
  'inst-kga-001': [
    {
      id: 'proj-kga-001',
      title: 'AI-Based Traffic Management',
      description: 'Machine learning system for optimizing traffic flow in urban areas',
      category: 'AI/ML',
      team_members: [
        { id: 'stu-inst-kga-001-class-kga-9a-1', name: 'Karthik Nair', role: 'leader', class: 'Grade 9', section: 'A' },
        { id: 'stu-inst-kga-001-class-kga-9a-2', name: 'Saran Kumar', role: 'member', class: 'Grade 9', section: 'A' },
        { id: 'stu-inst-kga-001-class-kga-9b-1', name: 'Meera Iyer', role: 'member', class: 'Grade 9', section: 'B' }
      ],
      created_by_officer_id: 'off-kga-001',
      created_by_officer_name: 'Mr. Saran T',
      institution_id: 'inst-kga-001',
      class: 'Grade 9',
      event_id: 'evt-ignitia-2025',
      event_title: 'Ignitia 2025 (Sahodaya)',
      status: 'completed',
      progress: 100,
      start_date: '2025-06-01',
      completion_date: '2025-09-01',
      sdg_goals: ['SDG9', 'SDG11'],
      last_updated: '2025-09-01',
      progress_updates: [
        {
          date: '2025-09-01',
          notes: 'Project completed. Secured 3rd place at Ignitia 2025!',
          updated_by: 'Mr. Saran T'
        }
      ],
      is_showcase: true,
      achievements: ['3rd Place - Ignitia 2025 (Sahodaya)'],
      showcase_image: '/placeholder.svg'
    },
    {
      id: 'proj-kga-002',
      title: 'Automated Plant Care System',
      description: 'IoT-based automated watering and monitoring system for plants',
      category: 'IoT',
      team_members: [
        { id: 'stu-inst-kga-001-class-kga-10a-1', name: 'Priya Iyer', role: 'leader', class: 'Grade 10', section: 'A' },
        { id: 'stu-inst-kga-001-class-kga-10a-2', name: 'Ravi Sharma', role: 'member', class: 'Grade 10', section: 'A' },
        { id: 'stu-inst-kga-001-class-kga-10b-1', name: 'Lakshmi Reddy', role: 'member', class: 'Grade 10', section: 'B' }
      ],
      created_by_officer_id: 'off-kga-002',
      created_by_officer_name: 'Mr. Sreeram R',
      institution_id: 'inst-kga-001',
      class: 'Grade 10',
      status: 'in_progress',
      progress: 70,
      start_date: '2025-07-15',
      sdg_goals: ['SDG12', 'SDG15'],
      last_updated: '2025-09-20',
      progress_updates: [
        {
          date: '2025-09-20',
          notes: 'Hardware assembly complete. Testing automation algorithms.',
          updated_by: 'Mr. Sreeram R'
        }
      ],
      is_showcase: false
    },
    {
      id: 'proj-kga-003',
      title: 'Smart Energy Monitor',
      description: 'Real-time electricity consumption tracking and optimization system',
      category: 'IoT',
      team_members: [
        { id: 'stu-inst-kga-001-class-kga-11a-1', name: 'Arun Krishnan', role: 'leader', class: 'Grade 11', section: 'A' },
        { id: 'stu-inst-kga-001-class-kga-11a-2', name: 'Divya Nair', role: 'member', class: 'Grade 11', section: 'A' }
      ],
      created_by_officer_id: 'off-kga-001',
      created_by_officer_name: 'Mr. Saran T',
      institution_id: 'inst-kga-001',
      class: 'Grade 11',
      event_id: 'evt-eureka-2025',
      event_title: 'Eureka Junior 2025',
      status: 'in_progress',
      progress: 45,
      start_date: '2025-08-10',
      sdg_goals: ['SDG7', 'SDG11', 'SDG12'],
      last_updated: '2025-09-25',
      progress_updates: [
        {
          date: '2025-09-25',
          notes: 'Selected for Eureka Junior Phase 2. Preparing for state level competition.',
          updated_by: 'Mr. Saran T'
        }
      ],
      is_showcase: false
    }
  ]
};

// Load from localStorage or use defaults - EXPORTED for use by pages
export const loadProjects = (): Record<string, Project[]> => {
  const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return mockProjects;
};

// Save to localStorage for bidirectional sync
export const saveProjects = (projects: Record<string, Project[]>): void => {
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
};

// Helper Functions
export const getProjectsByInstitution = (institutionId: string): Project[] => {
  const allProjects = loadProjects();
  return allProjects[institutionId] || [];
};

export const getProjectsByOfficer = (officerId: string): Project[] => {
  const allProjects = loadProjects();
  return Object.values(allProjects)
    .flat()
    .filter(p => p.created_by_officer_id === officerId);
};

export const getProjectsByStudent = (studentId: string): Project[] => {
  const allProjects = loadProjects();
  return Object.values(allProjects)
    .flat()
    .filter(p => p.team_members.some(member => member.id === studentId));
};

export const getShowcaseProjects = (institutionId: string): Project[] => {
  const allProjects = loadProjects();
  return (allProjects[institutionId] || [])
    .filter(p => p.is_showcase && p.status === 'completed');
};

export const updateProject = (institutionId: string, projectId: string, updates: Partial<Project>) => {
  const allProjects = loadProjects();
  const projects = allProjects[institutionId];
  if (!projects) return;
  
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects[index] = { 
      ...projects[index], 
      ...updates,
      last_updated: new Date().toISOString().split('T')[0]
    };
    saveProjects(allProjects);
  }
};

export const addProject = (institutionId: string, project: Project) => {
  const allProjects = loadProjects();
  if (!allProjects[institutionId]) {
    allProjects[institutionId] = [];
  }
  allProjects[institutionId].push(project);
  saveProjects(allProjects);
};

export const deleteProject = (institutionId: string, projectId: string) => {
  const allProjects = loadProjects();
  const projects = allProjects[institutionId];
  if (!projects) return;
  
  const index = projects.findIndex(p => p.id === projectId);
  if (index !== -1) {
    projects.splice(index, 1);
    saveProjects(allProjects);
  }
};

export const addProgressUpdate = (
  institutionId: string, 
  projectId: string, 
  update: ProgressUpdate
) => {
  const allProjects = loadProjects();
  const projects = allProjects[institutionId];
  if (!projects) return;
  
  const project = projects.find(p => p.id === projectId);
  if (project) {
    project.progress_updates.push(update);
    project.last_updated = update.date;
    saveProjects(allProjects);
  }
};

// Get all projects across all institutions with institution ID
export const getAllProjects = (): Array<Project & { institutionId: string }> => {
  const allProjects = loadProjects();
  return Object.entries(allProjects).flatMap(([institutionId, projects]) =>
    projects.map(p => ({ ...p, institutionId }))
  );
};

// Get projects by multiple institutions
export const getProjectsByInstitutions = (institutionIds: string[]): Project[] => {
  const allProjects = loadProjects();
  return institutionIds.flatMap(id => allProjects[id] || []);
};

// Get project statistics across all institutions
export const getProjectStatistics = () => {
  const allProjects = getAllProjects();
  return {
    total: allProjects.length,
    byStatus: {
      proposal: allProjects.filter(p => p.status === 'proposal').length,
      approved: allProjects.filter(p => p.status === 'approved').length,
      in_progress: allProjects.filter(p => p.status === 'in_progress').length,
      completed: allProjects.filter(p => p.status === 'completed').length,
      rejected: allProjects.filter(p => p.status === 'rejected').length,
    },
    totalStudents: allProjects.reduce((sum, p) => sum + p.team_members.length, 0),
    uniqueOfficers: new Set(allProjects.map(p => p.created_by_officer_id)).size,
    showcaseCount: allProjects.filter(p => p.is_showcase).length,
    avgProgress: allProjects.length > 0 
      ? Math.round(allProjects.reduce((sum, p) => sum + p.progress, 0) / allProjects.length)
      : 0,
  };
};
