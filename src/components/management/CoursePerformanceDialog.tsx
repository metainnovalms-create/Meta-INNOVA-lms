import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentPerformanceTable } from "./StudentPerformanceTable";
import { getCoursePerformanceData, CoursePerformanceData } from "@/utils/courseHelpers";
import { 
  mockCourses, 
  mockEnrollments, 
  mockSubmissions, 
  mockQuizAttempts,
  mockAssignments,
  mockQuizzes
} from "@/data/mockCourseData";
import { Users, TrendingUp, Award, AlertTriangle, Clock, FileText, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CoursePerformanceDialogProps {
  courseId: string | null;
  institutionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoursePerformanceDialog({
  courseId,
  institutionId,
  open,
  onOpenChange,
}: CoursePerformanceDialogProps) {
  if (!courseId) return null;

  const performanceData = getCoursePerformanceData(
    courseId,
    institutionId,
    mockCourses,
    mockEnrollments,
    mockSubmissions,
    mockQuizAttempts,
    mockAssignments,
    mockQuizzes
  );

  if (!performanceData) return null;

  const { 
    course, 
    total_students, 
    active_students, 
    completed_students,
    completion_rate,
    avg_progress,
    class_breakdown,
    student_performance,
    assignments,
    quizzes,
    at_risk_count
  } = performanceData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{course.title}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {course.course_code} • {course.category.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {course.difficulty}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Course Description */}
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-medium">{course.duration_weeks} weeks</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prerequisites:</span>
                    <span className="ml-2 font-medium">{course.prerequisites || 'None'}</span>
                  </div>
                </div>
                {course.learning_outcomes.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">Learning Outcomes:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {course.learning_outcomes.map((outcome, idx) => (
                        <li key={idx}>{outcome}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrollment Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{total_students}</p>
                      <p className="text-xs text-muted-foreground">Total Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{active_students}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Award className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{completed_students}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{at_risk_count}</p>
                      <p className="text-xs text-muted-foreground">At Risk</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Average Progress</span>
                      <span className="text-sm font-bold">{avg_progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${avg_progress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Completion Rate</span>
                      <span className="text-sm font-bold">{completion_rate}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${completion_rate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* At-Risk Students Alert */}
            {at_risk_count > 0 && (
              <Card className="border-orange-200 dark:border-orange-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                    <AlertTriangle className="h-5 w-5" />
                    Students Needing Attention ({at_risk_count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {student_performance
                      .filter(sp => sp.status === 'at_risk' || sp.status === 'struggling')
                      .slice(0, 5)
                      .map(student => (
                        <div key={student.student_id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{student.student_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.class_level} • Progress: {student.progress_percentage}%
                            </p>
                          </div>
                          <Badge variant={student.status === 'struggling' ? 'destructive' : 'secondary'}>
                            {student.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <StudentPerformanceTable students={student_performance} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="mt-6">
            <div className="space-y-4">
              {class_breakdown.map((classData, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{classData.class_level}</CardTitle>
                      <Badge variant="secondary">{classData.student_count} students</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Avg Progress</p>
                        <p className="text-2xl font-bold">{classData.avg_progress}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Avg Assignment Score</p>
                        <p className="text-2xl font-bold">{classData.avg_assignment_score}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Avg Quiz Score</p>
                        <p className="text-2xl font-bold">{classData.avg_quiz_score}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="mt-6">
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const assignmentSubmissions = mockSubmissions.filter(
                  s => s.assignment_id === assignment.id
                );
                const totalStudents = total_students;
                const submissionRate = totalStudents > 0 
                  ? Math.round((assignmentSubmissions.length / totalStudents) * 100) 
                  : 0;
                const gradedCount = assignmentSubmissions.filter(s => s.status === 'graded').length;
                const avgScore = assignmentSubmissions.filter(s => s.grade !== undefined).length > 0
                  ? assignmentSubmissions
                      .filter(s => s.grade !== undefined)
                      .reduce((sum, s) => sum + (s.grade || 0), 0) / assignmentSubmissions.filter(s => s.grade !== undefined).length
                  : 0;

                const dueDate = new Date(assignment.due_date);
                const isUpcoming = dueDate > new Date();

                return (
                  <Card key={assignment.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                        </div>
                        <Badge variant={isUpcoming ? "default" : "secondary"}>
                          {isUpcoming ? "Upcoming" : "Past Due"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-medium">
                              {formatDistanceToNow(dueDate, { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-muted-foreground">Submissions</p>
                            <p className="font-medium">
                              {assignmentSubmissions.length}/{totalStudents} ({submissionRate}%)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-muted-foreground">Graded</p>
                            <p className="font-medium">{gradedCount}/{assignmentSubmissions.length}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <div>
                            <p className="text-muted-foreground">Avg Score</p>
                            <p className="font-medium">{avgScore.toFixed(1)}/{assignment.total_points}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {assignments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No assignments for this course yet.
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            <div className="space-y-4">
              {quizzes.map((quiz) => {
                const quizAttempts = mockQuizAttempts.filter(qa => qa.quiz_id === quiz.id);
                const totalStudents = total_students;
                const completionRate = totalStudents > 0 
                  ? Math.round((quizAttempts.length / totalStudents) * 100) 
                  : 0;
                const avgScore = quizAttempts.filter(qa => qa.percentage !== undefined).length > 0
                  ? quizAttempts
                      .filter(qa => qa.percentage !== undefined)
                      .reduce((sum, qa) => sum + (qa.percentage || 0), 0) / quizAttempts.filter(qa => qa.percentage !== undefined).length
                  : 0;
                const passCount = quizAttempts.filter(qa => (qa.percentage || 0) >= quiz.pass_percentage).length;
                const passRate = quizAttempts.length > 0 
                  ? Math.round((passCount / quizAttempts.length) * 100) 
                  : 0;

                return (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{quiz.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{quiz.description}</p>
                        </div>
                        <Badge variant="secondary">
                          {quiz.time_limit_minutes} min
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Completion</p>
                          <p className="font-medium">
                            {quizAttempts.length}/{totalStudents} ({completionRate}%)
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Score</p>
                          <p className="font-medium">{avgScore.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Pass Rate</p>
                          <p className="font-medium">{passRate}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Attempts Allowed</p>
                          <p className="font-medium">{quiz.attempts_allowed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {quizzes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No quizzes for this course yet.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
