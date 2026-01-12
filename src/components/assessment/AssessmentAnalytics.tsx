import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { assessmentService } from '@/services/assessment.service';
import { Assessment, AssessmentAttempt, AssessmentQuestion } from '@/types/assessment';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, Clock, Award, CheckCircle, XCircle, RotateCcw, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AssessmentAnalyticsProps {
  assessment: Assessment;
  institutionId?: string;
  onClose: () => void;
}

export function AssessmentAnalytics({ assessment, institutionId, onClose }: AssessmentAnalyticsProps) {
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttempt, setSelectedAttempt] = useState<AssessmentAttempt | null>(null);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [assessment.id, institutionId]);

  const loadData = async () => {
    setIsLoading(true);
    const [attemptsData, questionsData] = await Promise.all([
      assessmentService.getAssessmentAttempts(assessment.id, { institution_id: institutionId }),
      assessmentService.getQuestions(assessment.id)
    ]);
    setAttempts(attemptsData);
    setQuestions(questionsData);
    setIsLoading(false);
  };

  const handleAllowRetake = async (attemptId: string) => {
    const success = await assessmentService.allowRetake(attemptId);
    if (success) {
      toast.success('Retake allowed for student');
      await loadData();
    } else {
      toast.error('Failed to allow retake');
    }
  };

  const handleViewDetails = async (attempt: AssessmentAttempt) => {
    const fullAttempt = await assessmentService.getAttemptById(attempt.id);
    setSelectedAttempt(fullAttempt);
    setDetailDialogOpen(true);
  };

  // Calculate statistics
  const completedAttempts = attempts.filter(a => a.status !== 'in_progress');
  const totalAttempts = attempts.length;
  const completedCount = completedAttempts.length;
  const passedCount = completedAttempts.filter(a => a.passed).length;
  const averageScore = completedCount > 0 
    ? completedAttempts.reduce((sum, a) => sum + a.percentage, 0) / completedCount 
    : 0;
  const passRate = completedCount > 0 ? (passedCount / completedCount) * 100 : 0;
  const averageTime = completedCount > 0
    ? completedAttempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0) / completedCount / 60
    : 0;

  // Score distribution data
  const scoreRanges = [
    { range: '0-20%', min: 0, max: 20 },
    { range: '21-40%', min: 21, max: 40 },
    { range: '41-60%', min: 41, max: 60 },
    { range: '61-80%', min: 61, max: 80 },
    { range: '81-100%', min: 81, max: 100 }
  ];

  const scoreDistribution = scoreRanges.map(range => ({
    range: range.range,
    count: completedAttempts.filter(a => a.percentage >= range.min && a.percentage <= range.max).length
  }));

  // Pass/Fail pie chart data
  const passFailData = [
    { name: 'Passed', value: passedCount, color: 'hsl(var(--primary))' },
    { name: 'Failed', value: completedCount - passedCount, color: 'hsl(var(--destructive))' }
  ];

  // Get unique classes for filter
  const classes = Array.from(new Set(attempts.map(a => a.class_id))).map(classId => {
    const attempt = attempts.find(a => a.class_id === classId);
    return { id: classId, name: attempt?.class_name || 'Unknown' };
  });

  const filteredAttempts = filterClass === 'all' 
    ? attempts 
    : attempts.filter(a => a.class_id === filterClass);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{assessment.title} - Analytics</h2>
          <p className="text-muted-foreground">{assessment.question_count} questions • {assessment.total_points} points</p>
        </div>
        <Button variant="outline" onClick={onClose}>Close Analytics</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{totalAttempts}</div>
                <p className="text-sm text-muted-foreground">Total Attempts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{passRate.toFixed(1)}%</div>
                <p className="text-sm text-muted-foreground">Pass Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{averageTime.toFixed(1)}m</div>
                <p className="text-sm text-muted-foreground">Avg Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pass/Fail Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Student Performance</CardTitle>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAttempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attempts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">{attempt.student_name}</TableCell>
                    <TableCell>{attempt.class_name}</TableCell>
                    <TableCell>{attempt.score}/{attempt.total_points}</TableCell>
                    <TableCell>{attempt.percentage.toFixed(1)}%</TableCell>
                    <TableCell>
                      {attempt.status === 'in_progress' ? (
                        <Badge variant="outline">In Progress</Badge>
                      ) : attempt.passed ? (
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Passed
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                      {attempt.is_manual && (
                        <Badge variant="secondary" className="ml-1">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {attempt.time_taken_seconds 
                        ? `${Math.floor(attempt.time_taken_seconds / 60)}m ${attempt.time_taken_seconds % 60}s`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewDetails(attempt)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {attempt.status !== 'in_progress' && !attempt.retake_allowed && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleAllowRetake(attempt.id)}
                            title="Allow Retake"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {attempt.retake_allowed && (
                          <Badge variant="outline" className="text-xs">Retake Allowed</Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Question Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Question Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Q#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Correct %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, index) => {
                // Calculate correct percentage for this question
                const answersForQuestion = completedAttempts
                  .flatMap(a => a.answers || [])
                  .filter(ans => ans.question_id === question.id);
                const correctCount = answersForQuestion.filter(a => a.is_correct).length;
                const correctPercentage = answersForQuestion.length > 0 
                  ? (correctCount / answersForQuestion.length) * 100 
                  : 0;

                return (
                  <TableRow key={question.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="max-w-md truncate">{question.question_text}</TableCell>
                    <TableCell>{question.points}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${correctPercentage}%` }}
                          />
                        </div>
                        <span className="text-sm">{correctPercentage.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Attempt Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAttempt?.student_name} - Attempt Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAttempt && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="font-bold">{selectedAttempt.score}/{selectedAttempt.total_points}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Percentage</p>
                  <p className="font-bold">{selectedAttempt.percentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedAttempt.passed ? "default" : "destructive"}>
                    {selectedAttempt.passed ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Answers</h4>
                {questions.map((question, index) => {
                  const answer = selectedAttempt.answers?.find(a => a.question_id === question.id);
                  const selectedOption = question.options.find(o => o.id === answer?.selected_option_id);
                  const correctOption = question.options.find(o => o.id === question.correct_option_id);

                  return (
                    <Card key={question.id} className={answer?.is_correct ? 'border-green-500/50' : 'border-destructive/50'}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          {answer?.is_correct ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">Q{index + 1}: {question.question_text}</p>
                            <div className="mt-2 text-sm space-y-1">
                              <p>
                                <span className="text-muted-foreground">Selected: </span>
                                <span className={answer?.is_correct ? 'text-green-500' : 'text-destructive'}>
                                  {selectedOption?.option_text || 'No answer'}
                                </span>
                              </p>
                              {!answer?.is_correct && (
                                <p>
                                  <span className="text-muted-foreground">Correct: </span>
                                  <span className="text-green-500">{correctOption?.option_text}</span>
                                </p>
                              )}
                              <p className="text-muted-foreground">
                                Points: {answer?.points_earned || 0}/{question.points}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
