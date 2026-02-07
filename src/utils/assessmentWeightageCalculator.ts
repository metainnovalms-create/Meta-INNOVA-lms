import { AssessmentAttempt } from '@/types/assessment';

export interface WeightageBreakdown {
  raw: number;
  total: number;
  percentage: number;
  weighted: number;
  status: 'completed' | 'absent' | 'pending';
}

export interface WeightedScoreResult {
  fa1_score: number;
  fa2_score: number;
  final_score: number;
  internal_score: number;
  total_weighted: number;
  breakdown: {
    fa1: WeightageBreakdown;
    fa2: WeightageBreakdown;
    final: WeightageBreakdown;
    internal: WeightageBreakdown;
  };
}

export const WEIGHTAGE = {
  FA1: 0.20,
  FA2: 0.20,
  FINAL: 0.40,
  INTERNAL: 0.20,
} as const;

export function calculateWeightedScore(
  fa1Attempt: AssessmentAttempt | null,
  fa2Attempt: AssessmentAttempt | null,
  finalAttempt: AssessmentAttempt | null,
  internalMarks: { obtained: number; total: number } | null
): WeightedScoreResult {
  // Helper to determine status and calculate percentage
  const getAttemptMetrics = (attempt: AssessmentAttempt | null): WeightageBreakdown => {
    if (!attempt) {
      return { raw: 0, total: 0, percentage: 0, weighted: 0, status: 'pending' };
    }
    
    // Check if absent
    if (attempt.status === 'absent') {
      return { 
        raw: 0, 
        total: attempt.total_points, 
        percentage: 0, 
        weighted: 0, 
        status: 'absent' 
      };
    }
    
    const percentage = attempt.total_points > 0 
      ? (attempt.score / attempt.total_points) * 100 
      : 0;
    
    return {
      raw: attempt.score,
      total: attempt.total_points,
      percentage,
      weighted: 0, // Will be calculated below
      status: 'completed',
    };
  };

  // Calculate FA1
  const fa1 = getAttemptMetrics(fa1Attempt);
  fa1.weighted = fa1.percentage * WEIGHTAGE.FA1;

  // Calculate FA2
  const fa2 = getAttemptMetrics(fa2Attempt);
  fa2.weighted = fa2.percentage * WEIGHTAGE.FA2;

  // Calculate Final
  const final = getAttemptMetrics(finalAttempt);
  final.weighted = final.percentage * WEIGHTAGE.FINAL;

  // Calculate Internal
  let internal: WeightageBreakdown;
  if (!internalMarks) {
    internal = { raw: 0, total: 100, percentage: 0, weighted: 0, status: 'pending' };
  } else {
    const percentage = internalMarks.total > 0 
      ? (internalMarks.obtained / internalMarks.total) * 100 
      : 0;
    internal = {
      raw: internalMarks.obtained,
      total: internalMarks.total,
      percentage,
      weighted: percentage * WEIGHTAGE.INTERNAL,
      status: 'completed',
    };
  }

  // Calculate total
  const total_weighted = fa1.weighted + fa2.weighted + final.weighted + internal.weighted;

  return {
    fa1_score: Math.round(fa1.weighted * 10) / 10,
    fa2_score: Math.round(fa2.weighted * 10) / 10,
    final_score: Math.round(final.weighted * 10) / 10,
    internal_score: Math.round(internal.weighted * 10) / 10,
    total_weighted: Math.round(total_weighted * 10) / 10,
    breakdown: { fa1, fa2, final, internal },
  };
}

export function getWeightageLabel(category: 'fa1' | 'fa2' | 'final' | 'internal'): string {
  const labels = {
    fa1: 'Formative Assessment 1 (20%)',
    fa2: 'Formative Assessment 2 (20%)',
    final: 'Final Assessment (40%)',
    internal: 'Internal Assessment (20%)',
  };
  return labels[category];
}

export function getShortLabel(category: 'fa1' | 'fa2' | 'final' | 'internal'): string {
  const labels = {
    fa1: 'FA1',
    fa2: 'FA2',
    final: 'Final',
    internal: 'Internal',
  };
  return labels[category];
}
