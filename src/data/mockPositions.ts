import { CustomPosition, SystemAdminFeature } from '@/types/permissions';

const POSITIONS_STORAGE_KEY = 'meta_positions';
const POSITIONS_VERSION_KEY = 'meta_positions_version';
const CURRENT_VERSION = 2; // Increment when defaults change

// Default positions migrated from old enum-based system
const defaultPositions: CustomPosition[] = [
  {
    id: 'pos-ceo',
    position_name: 'ceo',
    display_name: 'CEO (System Admin)',
    visible_features: [
      'institution_management',
      'course_management',
      'assessment_management',
      'assignment_management',
      'event_management',
      'officer_management',
      'project_management',
      'inventory_management',
      'attendance_payroll',
      'leave_approvals',
      'institutional_calendar',
      'reports_analytics',
      'sdg_management',
      'task_management',
      'task_allotment',
      'credential_management',
      'gamification',
      'id_configuration',
      'survey_feedback',
      'performance_ratings'
    ],
    description: 'Complete system access and permission management',
    created_at: new Date().toISOString(),
    created_by: 'system',
    is_ceo_position: true
  },
  {
    id: 'pos-md',
    position_name: 'md',
    display_name: 'Managing Director',
    visible_features: [
      'institution_management',
      'officer_management',
      'reports_analytics',
      'leave_approvals',
      'attendance_payroll',
      'task_management',
      'task_allotment',
      'credential_management'
    ],
    description: 'Senior management with oversight access',
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'pos-agm',
    position_name: 'agm',
    display_name: 'Assistant General Manager',
    visible_features: [
      'institution_management',
      'course_management',
      'officer_management',
      'reports_analytics',
      'task_management',
      'task_allotment',
      'credential_management',
      'id_configuration'
    ],
    description: 'Operational management access',
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'pos-gm',
    position_name: 'gm',
    display_name: 'General Manager',
    visible_features: [
      'institution_management',
      'reports_analytics',
      'leave_approvals',
      'attendance_payroll',
      'task_management',
      'task_allotment',
      'credential_management',
      'gamification'
    ],
    description: 'General management operations',
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'pos-manager',
    position_name: 'manager',
    display_name: 'Manager',
    visible_features: [
      'course_management',
      'assessment_management',
      'assignment_management',
      'project_management',
      'task_allotment',
      'gamification'
    ],
    description: 'Academic operations management',
    created_at: new Date().toISOString(),
    created_by: 'system'
  },
  {
    id: 'pos-admin-staff',
    position_name: 'admin_staff',
    display_name: 'Admin Staff',
    visible_features: [
      'officer_management',
      'inventory_management',
      'institutional_calendar',
      'task_allotment',
      'gamification'
    ],
    description: 'Administrative support functions',
    created_at: new Date().toISOString(),
    created_by: 'system'
  }
];

// Clear outdated cache when version changes
const checkAndClearCache = (): void => {
  try {
    const storedVersion = localStorage.getItem(POSITIONS_VERSION_KEY);
    if (storedVersion !== String(CURRENT_VERSION)) {
      localStorage.removeItem(POSITIONS_STORAGE_KEY);
      localStorage.setItem(POSITIONS_VERSION_KEY, String(CURRENT_VERSION));
    }
  } catch (error) {
    console.error('Error checking positions cache version:', error);
  }
};

// Load positions from localStorage or use defaults
export const loadPositions = (): CustomPosition[] => {
  try {
    checkAndClearCache();
    const stored = localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with defaults if no stored data
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(defaultPositions));
    return defaultPositions;
  } catch (error) {
    console.error('Error loading positions from localStorage:', error);
    return defaultPositions;
  }
};

// Save positions to localStorage
export const savePositions = (positions: CustomPosition[]): void => {
  try {
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
  } catch (error) {
    console.error('Error saving positions to localStorage:', error);
  }
};

// Get position by ID
export const getPositionById = (id: string): CustomPosition | undefined => {
  const positions = loadPositions();
  return positions.find(p => p.id === id);
};

// Get position by name
export const getPositionByName = (name: string): CustomPosition | undefined => {
  const positions = loadPositions();
  return positions.find(p => p.position_name === name);
};

// Add a new position
export const addPosition = (position: CustomPosition): void => {
  const positions = loadPositions();
  positions.push(position);
  savePositions(positions);
};

// Update an existing position
export const updatePositionInStore = (id: string, position: CustomPosition): void => {
  const positions = loadPositions();
  const index = positions.findIndex(p => p.id === id);
  if (index !== -1) {
    positions[index] = position;
    savePositions(positions);
  }
};

// Delete a position
export const deletePositionFromStore = (id: string): void => {
  const positions = loadPositions();
  const index = positions.findIndex(p => p.id === id);
  if (index !== -1) {
    positions.splice(index, 1);
    savePositions(positions);
  }
};

// Get all positions
export const getAllPositions = (): CustomPosition[] => {
  return loadPositions();
};

// For backward compatibility - expose as mutable array reference
// This will be deprecated, prefer using functions above
export const mockPositions = loadPositions();
