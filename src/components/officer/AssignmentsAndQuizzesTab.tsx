import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClipboardCheck,
  FileQuestion,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
  Download,
} from 'lucide-react';
import { mockAssignments, mockQuizzes, mockSubmissions, mockQuizAttempts, mockCourses } from '@/data/mockCourseData';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function AssignmentsAndQuizzesTab() {
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [quizFilter, setQuizFilter] = useState<string>('all');

  // Filter assignments by course
  const filteredAssignments = selectedCourse === 'all' 
    ? mockAssignments 
    : mockAssignments.filter(a => a.course_id === selectedCourse);

  // Filter quizzes by course
  const filteredQuizzes = selectedCourse === 'all'
    ? mockQuizzes
    : mockQuizzes.filter(q => q.course_id === selectedCourse);

  // Get submission stats for an assignment
  const getAssignmentStats = (assignmentId: string) => {
    const submissions = mockSubmissions.filter(s => s.assignment_id === assignmentId);
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status === 'pending').length;
    const late = submissions.filter(s => s.is_late).length;
    
    return {
      total: submissions.length,
      graded,
      pending,
      late,
      submissionRate: submissions.length > 0 ? (submissions.length / 20) * 100 : 0 // Assuming 20 students
    };
  };

  // Get quiz attempt stats
  const getQuizStats = (quizId: string) => {
    const quiz = mockQuizzes.find(q => q.id === quizId);
    const attempts = mockQuizAttempts.filter(a => a.quiz_id === quizId);
    const submitted = attempts.filter(a => a.status === 'graded' || a.status === 'submitted').length;
    const passed = quiz ? attempts.filter(a => (a.percentage || 0) >= quiz.pass_percentage).length : 0;
    const avgScore = attempts.length > 0
      ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length
      : 0;

    return {
      total: attempts.length,
      completed: submitted,
      passed,
      avgScore: Math.round(avgScore),
      passRate: submitted > 0 ? (passed / submitted) * 100 : 0
    };
  };

  const handleGradeAssignment = (assignmentId: string) => {
    toast.info('Opening grading interface...');
    // TODO: Open grading dialog
  };

  const handleViewSubmissions = (assignmentId: string) => {
    toast.info('Viewing submissions...');
    // TODO: Open submissions view
  };

  const handleViewAttempts = (quizId: string) => {
    toast.info('Viewing quiz attempts...');
    // TODO: Open quiz attempts view
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) return { variant: 'destructive' as const, text: 'Overdue' };
    if (daysUntilDue === 0) return { variant: 'default' as const, text: 'Due Today' };
    if (daysUntilDue <= 3) return { variant: 'secondary' as const, text: `${daysUntilDue} days left` };
    return { variant: 'outline' as const, text: format(due, 'MMM dd, yyyy') };
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Select Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {mockCourses.slice(0, 3).map(course => (
              <SelectItem key={course.id} value={course.id}>
                {course.course_code} - {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for Assignments and Quizzes */}
      <Tabs defaultValue="assignments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="assignments">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Assignments ({filteredAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes">
            <FileQuestion className="h-4 w-4 mr-2" />
            Quizzes ({filteredQuizzes.length})
          </TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredAssignments.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Grades</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredAssignments.reduce((sum, a) => sum + getAssignmentStats(a.id).pending, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Submission Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredAssignments.length > 0
                    ? Math.round(
                        filteredAssignments.reduce((sum, a) => sum + getAssignmentStats(a.id).submissionRate, 0) /
                        filteredAssignments.length
                      )
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredAssignments.filter(a => isOverdue(a.due_date)).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Overview</CardTitle>
              <CardDescription>
                Manage assignments and track student submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Submissions</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssignments.map((assignment) => {
                    const stats = getAssignmentStats(assignment.id);
                    const course = mockCourses.find(c => c.id === assignment.course_id);
                    const dueDateStatus = getDueDateStatus(assignment.due_date);

                    return (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{assignment.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {assignment.total_points} pts
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {assignment.submission_type}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{course?.course_code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={dueDateStatus.variant}>
                            {dueDateStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {stats.total} submissions
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span className="text-green-600">{stats.graded} graded</span>
                              <span className="text-orange-600">{stats.pending} pending</span>
                              {stats.late > 0 && (
                                <span className="text-red-600">{stats.late} late</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2 min-w-[120px]">
                            <Progress value={stats.submissionRate} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {Math.round(stats.submissionRate)}% submitted
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSubmissions(assignment.id)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            {stats.pending > 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleGradeAssignment(assignment.id)}
                              >
                                Grade ({stats.pending})
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
                <FileQuestion className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredQuizzes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredQuizzes.reduce((sum, q) => sum + getQuizStats(q.id).total, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredQuizzes.length > 0
                    ? Math.round(
                        filteredQuizzes.reduce((sum, q) => sum + getQuizStats(q.id).avgScore, 0) /
                        filteredQuizzes.length
                      )
                    : 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {filteredQuizzes.length > 0
                    ? Math.round(
                        filteredQuizzes.reduce((sum, q) => sum + getQuizStats(q.id).passRate, 0) /
                        filteredQuizzes.length
                      )
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quizzes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Overview</CardTitle>
              <CardDescription>
                Monitor quiz performance and student attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Available Until</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuizzes.map((quiz) => {
                    const stats = getQuizStats(quiz.id);
                    const course = mockCourses.find(c => c.id === quiz.course_id);
                    const availableStatus = getDueDateStatus(quiz.available_to);

                    return (
                      <TableRow key={quiz.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{quiz.title}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {quiz.time_limit_minutes} min
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {quiz.attempts_allowed} {quiz.attempts_allowed === 1 ? 'attempt' : 'attempts'}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{course?.course_code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={availableStatus.variant}>
                            {availableStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{stats.total} attempts</div>
                            <div className="text-xs text-muted-foreground">
                              {stats.completed} completed
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2 min-w-[120px]">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Avg Score:</span>
                              <span className="font-medium">{stats.avgScore}%</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Pass Rate:</span>
                              <span className="font-medium text-green-600">
                                {Math.round(stats.passRate)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewAttempts(quiz.id)}
                          >
                            View Attempts
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
