import { ClassTeachingSession } from '@/types/classTeaching';

// Calculate completion percentage
export const calculateTeachingProgress = (
  completedModules: string[],
  totalModules: number
): number => {
  if (totalModules === 0) return 0;
  return Math.round((completedModules.length / totalModules) * 100);
};

// Format duration for display
export const formatTeachingDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
};

// Get status badge color
export const getTeachingStatusColor = (status: string): string => {
  switch (status) {
    case 'not_started':
      return 'secondary';
    case 'in_progress':
      return 'default';
    case 'completed':
      return 'success';
    default:
      return 'secondary';
  }
};

// Get status display text
export const getTeachingStatusText = (status: string): string => {
  switch (status) {
    case 'not_started':
      return 'Not Started';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
};

// Group sessions by date
export const groupSessionsByDate = (sessions: ClassTeachingSession[]): Record<string, ClassTeachingSession[]> => {
  return sessions.reduce((groups, session) => {
    const date = new Date(session.session_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, ClassTeachingSession[]>);
};

// Calculate total teaching time
export const calculateTotalTeachingTime = (sessions: ClassTeachingSession[]): number => {
  return sessions.reduce((total, session) => total + session.duration_minutes, 0);
};

// Get unique courses from sessions
export const getUniqueCourses = (sessions: ClassTeachingSession[]): string[] => {
  return [...new Set(sessions.map(s => s.course_id))];
};

// Calculate average session duration
export const calculateAverageSessionDuration = (sessions: ClassTeachingSession[]): number => {
  if (sessions.length === 0) return 0;
  const total = calculateTotalTeachingTime(sessions);
  return Math.round(total / sessions.length);
};
