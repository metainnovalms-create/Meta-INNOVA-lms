import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AssessmentStatusBadge } from './AssessmentStatusBadge';
import { Assessment, AssessmentAttempt } from '@/types/assessment';
import { getAssessmentStatus, formatDuration, formatTimeRemaining } from '@/utils/assessmentHelpers';
import { Clock, Award, FileText, Calendar, CheckCircle, XCircle, Eye, PlayCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssessmentResultsDialog } from './AssessmentResultsDialog';

interface AssessmentCardProps {
  assessment: Assessment;
  attempt?: AssessmentAttempt;
  mode: 'take' | 'review' | 'upcoming';
}

export const AssessmentCard = ({ assessment, attempt, mode }: AssessmentCardProps) => {
  const navigate = useNavigate();
  const [timeUntilStart, setTimeUntilStart] = useState<number>(0);
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const status = getAssessmentStatus(assessment);

  // Get tenant path from localStorage
  const getTenantPath = () => {
    try {
      const tenant = localStorage.getItem('tenant');
      if (tenant) {
        const parsed = JSON.parse(tenant);
        return `/tenant/${parsed.slug}`;
      }
    } catch {}
    return '';
  };

  useEffect(() => {
    if (mode === 'upcoming') {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const start = new Date(assessment.start_time).getTime();
        const diff = Math.max(0, Math.floor((start - now) / 1000));
        setTimeUntilStart(diff);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, assessment.start_time]);

  const handleTakeAssessment = () => {
    const tenantPath = getTenantPath();
    navigate(`${tenantPath}/student/assessments/${assessment.id}/take`);
  };

  const handleViewResults = () => {
    setResultsDialogOpen(true);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold">{assessment.title}</h3>
                  <AssessmentStatusBadge status={status} />
                </div>
                <p className="text-sm text-muted-foreground">{assessment.description}</p>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{assessment.question_count} questions</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-muted-foreground" />
                <span>{assessment.total_points} points</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{formatDuration(assessment.duration_minutes)}</span>
              </div>
              {mode !== 'upcoming' && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Ends: {new Date(assessment.end_time).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Mode-specific content */}
            {mode === 'take' && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Pass Percentage: </span>
                  <span className="font-medium">{assessment.pass_percentage}%</span>
                </div>
                <Button onClick={handleTakeAssessment}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Start Assessment
                </Button>
              </div>
            )}

            {mode === 'review' && attempt && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {attempt.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {attempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {attempt.score}/{attempt.total_points}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {attempt.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Progress value={attempt.percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Completed: {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : 'N/A'}
                  </span>
                  {assessment.allow_review_after_submission && (
                    <Button variant="outline" size="sm" onClick={handleViewResults}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            )}

            {mode === 'upcoming' && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Starts in:</span>
                  <Badge variant="secondary" className="text-lg font-mono">
                    {formatTimeRemaining(timeUntilStart)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Scheduled: {new Date(assessment.start_time).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {attempt && (
        <AssessmentResultsDialog
          open={resultsDialogOpen}
          onOpenChange={setResultsDialogOpen}
          assessment={assessment}
          attempt={attempt}
        />
      )}
    </>
  );
};