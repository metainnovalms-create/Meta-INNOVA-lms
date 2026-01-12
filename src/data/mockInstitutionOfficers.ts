import { OfficerAssignment } from '@/types/institution';

const OFFICER_ASSIGNMENTS_KEY = 'institution_officer_assignments';

// Initial mock data with correct IDs
const initialMockInstitutionOfficers: Record<string, OfficerAssignment[]> = {
  'inst-msd-001': [
    {
      officer_id: 'off-msd-001',
      officer_name: 'Mr. Atif Ansari',
      employee_id: 'EMP-MSD-IOF-001',
      email: 'atif.ansari@modernschool.edu.in',
      phone: '+91-9876543210',
      avatar: undefined,
      assigned_date: '2025-04-01T00:00:00Z',
      total_courses: 4,
      total_teaching_hours: 28,
      status: 'active'
    }
  ],
  'inst-kga-001': [
    {
      officer_id: 'off-kga-001',
      officer_name: 'Mr. Saran T',
      employee_id: 'EMP-KGA-IOF-001',
      email: 'saran.t@kikaniacademy.com',
      phone: '+91-9876543211',
      avatar: undefined,
      assigned_date: '2024-06-01T00:00:00Z',
      total_courses: 5,
      total_teaching_hours: 35,
      status: 'active'
    },
    {
      officer_id: 'off-kga-002',
      officer_name: 'Mr. Sreeram R',
      employee_id: 'EMP-KGA-IOF-002',
      email: 'sreeram.r@kikaniacademy.com',
      phone: '+91-9876543212',
      avatar: undefined,
      assigned_date: '2025-01-15T00:00:00Z',
      total_courses: 3,
      total_teaching_hours: 21,
      status: 'active'
    }
  ]
};

// All officers for assignment selection
const initialMockAllOfficers: OfficerAssignment[] = [
  {
    officer_id: 'off-msd-001',
    officer_name: 'Mr. Atif Ansari',
    employee_id: 'EMP-MSD-IOF-001',
    email: 'atif.ansari@modernschool.edu.in',
    phone: '+91-9876543210',
    avatar: undefined,
    assigned_date: '2025-04-01T00:00:00Z',
    total_courses: 4,
    total_teaching_hours: 28,
    status: 'active'
  },
  {
    officer_id: 'off-kga-001',
    officer_name: 'Mr. Saran T',
    employee_id: 'EMP-KGA-IOF-001',
    email: 'saran.t@kikaniacademy.com',
    phone: '+91-9876543211',
    avatar: undefined,
    assigned_date: '2024-06-01T00:00:00Z',
    total_courses: 5,
    total_teaching_hours: 35,
    status: 'active'
  },
  {
    officer_id: 'off-kga-002',
    officer_name: 'Mr. Sreeram R',
    employee_id: 'EMP-KGA-IOF-002',
    email: 'sreeram.r@kikaniacademy.com',
    phone: '+91-9876543212',
    avatar: undefined,
    assigned_date: '2025-01-15T00:00:00Z',
    total_courses: 3,
    total_teaching_hours: 21,
    status: 'active'
  }
];

// localStorage functions
export function loadOfficerAssignments(): Record<string, OfficerAssignment[]> {
  try {
    const stored = localStorage.getItem(OFFICER_ASSIGNMENTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading officer assignments:', error);
  }
  // Initialize with mock data if not in localStorage
  saveOfficerAssignments(initialMockInstitutionOfficers);
  return initialMockInstitutionOfficers;
}

export function saveOfficerAssignments(assignments: Record<string, OfficerAssignment[]>): void {
  try {
    localStorage.setItem(OFFICER_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  } catch (error) {
    console.error('Error saving officer assignments:', error);
  }
}

export function getInstitutionOfficers(institutionId: string): OfficerAssignment[] {
  const assignments = loadOfficerAssignments();
  return assignments[institutionId] || [];
}

export function assignOfficerToInstitution(institutionId: string, officer: OfficerAssignment): void {
  const assignments = loadOfficerAssignments();
  if (!assignments[institutionId]) {
    assignments[institutionId] = [];
  }
  // Check if officer is already assigned
  const exists = assignments[institutionId].some(o => o.officer_id === officer.officer_id);
  if (!exists) {
    assignments[institutionId].push({
      ...officer,
      assigned_date: new Date().toISOString()
    });
    saveOfficerAssignments(assignments);
  }
}

export function removeOfficerFromInstitution(institutionId: string, officerId: string): void {
  const assignments = loadOfficerAssignments();
  if (assignments[institutionId]) {
    assignments[institutionId] = assignments[institutionId].filter(o => o.officer_id !== officerId);
    saveOfficerAssignments(assignments);
  }
}

export function updateOfficerAssignment(institutionId: string, officerId: string, updates: Partial<OfficerAssignment>): void {
  const assignments = loadOfficerAssignments();
  if (assignments[institutionId]) {
    assignments[institutionId] = assignments[institutionId].map(o =>
      o.officer_id === officerId ? { ...o, ...updates } : o
    );
    saveOfficerAssignments(assignments);
  }
}

export function getAvailableOfficers(institutionId: string): OfficerAssignment[] {
  const assignments = loadOfficerAssignments();
  const assigned = assignments[institutionId] || [];
  const assignedIds = assigned.map(o => o.officer_id);
  return initialMockAllOfficers.filter(o => !assignedIds.includes(o.officer_id));
}

export function getAllOfficers(): OfficerAssignment[] {
  return initialMockAllOfficers;
}

export function getOfficerById(officerId: string): OfficerAssignment | undefined {
  return initialMockAllOfficers.find(o => o.officer_id === officerId);
}

export function getInstitutionIdByOfficer(officerId: string): string | undefined {
  const assignments = loadOfficerAssignments();
  for (const [institutionId, officers] of Object.entries(assignments)) {
    if (officers.some(o => o.officer_id === officerId)) {
      return institutionId;
    }
  }
  return undefined;
}

// Legacy exports for backward compatibility
export const mockInstitutionOfficers = initialMockInstitutionOfficers;
export const mockAllOfficers = initialMockAllOfficers;
