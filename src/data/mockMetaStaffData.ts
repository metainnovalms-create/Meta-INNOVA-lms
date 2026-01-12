import { User } from '@/types';
import { getPositionById } from './mockPositions';

const META_STAFF_STORAGE_KEY = 'meta_staff_users';
const CREDENTIAL_STATUS_STORAGE_KEY = 'credential_status';

export interface MetaStaffUser extends User {
  password?: string;
  must_change_password?: boolean;
  password_changed_at?: string;
  hourly_rate?: number;
  overtime_rate_multiplier?: number;
  normal_working_hours?: number;
}

// Default meta staff users
const defaultMetaStaff: MetaStaffUser[] = [
  {
    id: '6',
    email: 'system@metainnova.com',
    password: 'system123',
    name: 'System Admin CEO',
    role: 'system_admin',
    position_id: 'pos-ceo',
    position_name: 'ceo',
    is_ceo: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SystemAdmin',
    created_at: new Date().toISOString(),
    hourly_rate: 1500,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '7',
    email: 'md@metainnova.com',
    password: 'md123',
    name: 'Managing Director',
    role: 'system_admin',
    position_id: 'pos-md',
    position_name: 'md',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MD',
    created_at: new Date().toISOString(),
    hourly_rate: 1200,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '8',
    email: 'manager@metainnova.com',
    password: 'manager123',
    name: 'Operations Manager',
    role: 'system_admin',
    position_id: 'pos-manager',
    position_name: 'manager',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Manager',
    created_at: new Date().toISOString(),
    hourly_rate: 480,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '9',
    email: 'agm@metainnova.com',
    password: 'agm123',
    name: 'AGM Operations',
    role: 'system_admin',
    position_id: 'pos-agm',
    position_name: 'agm',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AGM',
    created_at: new Date().toISOString(),
    hourly_rate: 900,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '10',
    email: 'gm@metainnova.com',
    password: 'gm123',
    name: 'General Manager',
    role: 'system_admin',
    position_id: 'pos-gm',
    position_name: 'gm',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GM',
    created_at: new Date().toISOString(),
    hourly_rate: 720,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
  {
    id: '11',
    email: 'adminstaff@metainnova.com',
    password: 'staff123',
    name: 'Admin Staff',
    role: 'system_admin',
    position_id: 'pos-admin-staff',
    position_name: 'admin_staff',
    is_ceo: false,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminStaff',
    created_at: new Date().toISOString(),
    hourly_rate: 300,
    overtime_rate_multiplier: 1.5,
    normal_working_hours: 8,
  },
];

// Load meta staff from localStorage
export const loadMetaStaff = (): MetaStaffUser[] => {
  try {
    const stored = localStorage.getItem(META_STAFF_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Initialize with defaults
    localStorage.setItem(META_STAFF_STORAGE_KEY, JSON.stringify(defaultMetaStaff));
    return defaultMetaStaff;
  } catch (error) {
    console.error('Error loading meta staff from localStorage:', error);
    return defaultMetaStaff;
  }
};

// Save meta staff to localStorage
export const saveMetaStaff = (staff: MetaStaffUser[]): void => {
  try {
    localStorage.setItem(META_STAFF_STORAGE_KEY, JSON.stringify(staff));
  } catch (error) {
    console.error('Error saving meta staff to localStorage:', error);
  }
};

// Get meta staff by ID
export const getMetaStaffById = (id: string): MetaStaffUser | undefined => {
  const staff = loadMetaStaff();
  return staff.find(s => s.id === id);
};

// Get meta staff by position
export const getMetaStaffByPosition = (positionId: string): MetaStaffUser[] => {
  const staff = loadMetaStaff();
  return staff.filter(s => s.position_id === positionId);
};

// Get meta staff by email
export const getMetaStaffByEmail = (email: string): MetaStaffUser | undefined => {
  const staff = loadMetaStaff();
  return staff.find(s => s.email === email);
};

// Add new meta staff user
export const addMetaStaffUser = (user: MetaStaffUser): void => {
  const staff = loadMetaStaff();
  staff.push(user);
  saveMetaStaff(staff);
};

// Update meta staff user
export const updateMetaStaffUser = (id: string, updates: Partial<MetaStaffUser>): void => {
  const staff = loadMetaStaff();
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff[index] = { ...staff[index], ...updates };
    saveMetaStaff(staff);
  }
};

// Delete meta staff user
export const deleteMetaStaffUser = (id: string): void => {
  const staff = loadMetaStaff();
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff.splice(index, 1);
    saveMetaStaff(staff);
  }
};

// Update meta staff password
export const updateMetaStaffPassword = (id: string, password: string, mustChange: boolean = true): void => {
  const staff = loadMetaStaff();
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff[index] = {
      ...staff[index],
      password,
      must_change_password: mustChange,
      password_changed_at: new Date().toISOString(),
    };
    saveMetaStaff(staff);
  }
};

// Credential status management for institutions
export const loadCredentialStatus = (): Record<string, boolean> => {
  try {
    const stored = localStorage.getItem(CREDENTIAL_STATUS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error loading credential status:', error);
    return {};
  }
};

export const saveCredentialStatus = (status: Record<string, boolean>): void => {
  try {
    localStorage.setItem(CREDENTIAL_STATUS_STORAGE_KEY, JSON.stringify(status));
  } catch (error) {
    console.error('Error saving credential status:', error);
  }
};

export const markCredentialConfigured = (entityId: string): void => {
  const status = loadCredentialStatus();
  status[entityId] = true;
  saveCredentialStatus(status);
};

export const isCredentialConfigured = (entityId: string): boolean => {
  const status = loadCredentialStatus();
  return status[entityId] === true;
};

// Validate user credentials for login
export const validateMetaStaffCredentials = (email: string, password: string): MetaStaffUser | null => {
  const staff = loadMetaStaff();
  const user = staff.find(s => s.email === email && s.password === password);
  return user || null;
};

// Generate temporary password
export const generateTemporaryPassword = (): string => {
  return `Meta${Math.random().toString(36).slice(-8).toUpperCase()}!`;
};
