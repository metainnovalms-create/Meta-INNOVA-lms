import { Assessment, AssessmentQuestion, AssessmentAnswer, AssessmentStatus } from '@/types/assessment';

export const calculateTotalPoints = (questions: AssessmentQuestion[]): number => {
  return questions.reduce((total, question) => total + question.points, 0);
};

export const getAssessmentStatus = (assessment: Assessment): AssessmentStatus => {
  const now = new Date();
  const startTime = new Date(assessment.start_time);
  const endTime = new Date(assessment.end_time);
  
  if (assessment.status === 'draft') return 'draft';
  if (assessment.status === 'unpublished') return 'unpublished';
  if (assessment.published_to.length === 0) return 'unpublished';
  
  if (now < startTime) return 'upcoming';
  if (now > endTime) return 'completed';
  if (now >= startTime && now <= endTime) return 'ongoing';
  
  return 'published';
};

export const validateAssessment = (assessment: Partial<Assessment>): string[] => {
  const errors: string[] = [];
  
  if (!assessment.title || assessment.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!assessment.description || assessment.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!assessment.duration_minutes || assessment.duration_minutes <= 0) {
    errors.push('Duration must be greater than 0');
  }
  
  if (!assessment.start_time) {
    errors.push('Start time is required');
  }
  
  if (!assessment.end_time) {
    errors.push('End time is required');
  }
  
  if (assessment.start_time && assessment.end_time) {
    const startTime = new Date(assessment.start_time);
    const endTime = new Date(assessment.end_time);
    if (endTime <= startTime) {
      errors.push('End time must be after start time');
    }
  }
  
  if (assessment.pass_percentage !== undefined && (assessment.pass_percentage < 0 || assessment.pass_percentage > 100)) {
    errors.push('Pass percentage must be between 0 and 100');
  }
  
  if (assessment.question_count !== undefined && assessment.question_count < 1) {
    errors.push('At least one question is required');
  }
  
  return errors;
};

export const calculateScore = (
  answers: AssessmentAnswer[],
  questions: AssessmentQuestion[]
): { score: number; totalPoints: number; percentage: number } => {
  const totalPoints = calculateTotalPoints(questions);
  const score = answers.reduce((total, answer) => total + answer.points_earned, 0);
  const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
  
  return { score, totalPoints, percentage };
};

export const formatTimeRemaining = (seconds: number): string => {
  if (seconds <= 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const canPublishAssessment = (assessment: Assessment): { canPublish: boolean; reason?: string } => {
  if (assessment.question_count < 1) {
    return { canPublish: false, reason: 'Assessment must have at least one question' };
  }
  
  if (!assessment.start_time || !assessment.end_time) {
    return { canPublish: false, reason: 'Start and end times are required' };
  }
  
  if (assessment.published_to.length === 0) {
    return { canPublish: false, reason: 'Assessment must be published to at least one institution' };
  }
  
  return { canPublish: true };
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${mins} min`;
};

export const getStatusColor = (status: AssessmentStatus): string => {
  switch (status) {
    case 'draft':
      return 'bg-muted text-muted-foreground';
    case 'published':
      return 'bg-primary/10 text-primary';
    case 'unpublished':
      return 'bg-muted text-muted-foreground';
    case 'upcoming':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
    case 'ongoing':
      return 'bg-green-500/10 text-green-600 dark:text-green-400';
    case 'completed':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Timezone helpers for datetime-local inputs
// Convert UTC ISO string to local datetime-local format for input display
export const formatDateTimeLocal = (isoString: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Convert datetime-local input value to UTC ISO string for storage
export const parseLocalToUTC = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';
  // datetime-local input gives us local time, create Date from it
  // which JS interprets as local time when no timezone specified
  const date = new Date(localDateTimeString);
  return date.toISOString();
};
