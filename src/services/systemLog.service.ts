import { supabase } from '@/integrations/supabase/client';

export type ActionType = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'DOWNLOAD' | 'VIEW' | 'EXPORT' | 'SUBMIT' | 'APPROVE' | 'REJECT';

export interface SystemLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_email: string;
  user_role: string;
  institution_id: string | null;
  action_type: ActionType;
  entity_type: string;
  entity_id: string | null;
  description: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failed';
  created_at: string;
}

export interface LogEntry {
  action_type: ActionType;
  entity_type: string;
  entity_id?: string;
  description: string;
  metadata?: Record<string, any>;
  status?: 'success' | 'failed';
}

export interface LogFilters {
  action_type?: string;
  entity_type?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// Get current user info from localStorage
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch {
    return null;
  }
  return null;
};

// Core logging function
export async function logActivity(entry: LogEntry): Promise<void> {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.warn('No user found for logging activity');
      return;
    }

    const logData = {
      user_id: user.id,
      user_name: user.name || 'Unknown',
      user_email: user.email || 'Unknown',
      user_role: user.role || 'Unknown',
      institution_id: user.institution_id || null,
      action_type: entry.action_type,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      description: entry.description,
      metadata: entry.metadata || {},
      ip_address: null, // Could be fetched from an IP service if needed
      user_agent: navigator.userAgent,
      status: entry.status || 'success',
    };

    const { error } = await supabase
      .from('system_logs')
      .insert(logData);

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Error in logActivity:', err);
  }
}

// Helper functions for common actions
export async function logLogin(userId: string, userName: string, userEmail: string, userRole: string): Promise<void> {
  try {
    const logData = {
      user_id: userId,
      user_name: userName,
      user_email: userEmail,
      user_role: userRole,
      action_type: 'LOGIN',
      entity_type: 'Auth',
      entity_id: userId,
      description: `User ${userName} logged in`,
      metadata: { timestamp: new Date().toISOString() },
      user_agent: navigator.userAgent,
      status: 'success',
    };

    await supabase.from('system_logs').insert(logData);
  } catch (err) {
    console.error('Error logging login:', err);
  }
}

export async function logLogout(): Promise<void> {
  await logActivity({
    action_type: 'LOGOUT',
    entity_type: 'Auth',
    description: 'User logged out',
  });
}

export async function logCreate(entityType: string, entityId: string, description: string, metadata?: Record<string, any>): Promise<void> {
  await logActivity({
    action_type: 'CREATE',
    entity_type: entityType,
    entity_id: entityId,
    description,
    metadata,
  });
}

export async function logUpdate(entityType: string, entityId: string, description: string, metadata?: Record<string, any>): Promise<void> {
  await logActivity({
    action_type: 'UPDATE',
    entity_type: entityType,
    entity_id: entityId,
    description,
    metadata,
  });
}

export async function logDelete(entityType: string, entityId: string, description: string): Promise<void> {
  await logActivity({
    action_type: 'DELETE',
    entity_type: entityType,
    entity_id: entityId,
    description,
  });
}

export async function logDownload(entityType: string, entityId: string, description: string): Promise<void> {
  await logActivity({
    action_type: 'DOWNLOAD',
    entity_type: entityType,
    entity_id: entityId,
    description,
  });
}

export async function logExport(entityType: string, description: string): Promise<void> {
  await logActivity({
    action_type: 'EXPORT',
    entity_type: entityType,
    description,
  });
}

export async function logView(entityType: string, entityId: string, description: string): Promise<void> {
  await logActivity({
    action_type: 'VIEW',
    entity_type: entityType,
    entity_id: entityId,
    description,
  });
}

export async function logSubmit(entityType: string, entityId: string, description: string): Promise<void> {
  await logActivity({
    action_type: 'SUBMIT',
    entity_type: entityType,
    entity_id: entityId,
    description,
  });
}

export async function logApprove(entityType: string, entityId: string, description: string): Promise<void> {
  await logActivity({
    action_type: 'APPROVE',
    entity_type: entityType,
    entity_id: entityId,
    description,
  });
}

export async function logReject(entityType: string, entityId: string, description: string): Promise<void> {
  await logActivity({
    action_type: 'REJECT',
    entity_type: entityType,
    entity_id: entityId,
    description,
  });
}

// Query functions
export async function getSystemLogs(filters: LogFilters = {}): Promise<{ logs: SystemLog[]; total: number }> {
  let query = supabase
    .from('system_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters.action_type && filters.action_type !== 'all') {
    query = query.eq('action_type', filters.action_type);
  }

  if (filters.entity_type && filters.entity_type !== 'all') {
    query = query.eq('entity_type', filters.entity_type);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,user_name.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching system logs:', error);
    return { logs: [], total: 0 };
  }

  return { 
    logs: (data || []) as unknown as SystemLog[], 
    total: count || 0 
  };
}

// Export logs to CSV
export function exportLogsToCSV(logs: SystemLog[]): string {
  const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Description', 'Status', 'IP Address'];
  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.user_name,
    log.user_email,
    log.user_role,
    log.action_type,
    log.entity_type,
    log.entity_id || '',
    log.description,
    log.status,
    log.ip_address || '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
}

export const systemLogService = {
  logActivity,
  logLogin,
  logLogout,
  logCreate,
  logUpdate,
  logDelete,
  logDownload,
  logExport,
  logView,
  logSubmit,
  logApprove,
  logReject,
  getSystemLogs,
  exportLogsToCSV,
};
