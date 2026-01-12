import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Target, Award, Users, FileText, ClipboardCheck, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { getInstitutionBySlug } from "@/data/mockInstitutionData";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface PerformanceData {
  assignments: {
    total: number;
    submitted: number;
    graded: number;
    avgScore: number;
    passRate: number;
  };
  assessments: {
    total: number;
    completed: number;
    avgScore: number;
    passRate: number;
  };
  topStudents: Array<{
    id: string;
    name: string;
    avgScore: number;
    completedCount: number;
  }>;
}

const Performance = () => {
  const [period, setPeriod] = useState("monthly");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  
  const location = useLocation();
  const institutionSlug = location.pathname.split('/')[2];
  const institution = getInstitutionBySlug(institutionSlug);
  const institutionId = user?.institution_id;

  useEffect(() => {
    if (institutionId) {
      loadPerformanceData();
    }
  }, [institutionId, period]);

  const loadPerformanceData = async () => {
    if (!institutionId) return;
    
    setLoading(true);
    try {
      // Fetch assignment stats
      const { data: assignments } = await (supabase as any)
        .from('assignments')
        .select('id, total_marks, passing_marks')
        .eq('institution_id', institutionId)
        .eq('status', 'published');

      const assignmentIds = (assignments || []).map((a: any) => a.id);
      
      let assignmentSubmissions: any[] = [];
      if (assignmentIds.length > 0) {
        const { data: subs } = await (supabase as any)
          .from('assignment_submissions')
          .select('*')
          .in('assignment_id', assignmentIds);
        assignmentSubmissions = subs || [];
      }

      const gradedAssignments = assignmentSubmissions.filter((s: any) => s.status === 'graded');
      const passedAssignments = gradedAssignments.filter((s: any) => {
        const assignment = (assignments || []).find((a: any) => a.id === s.assignment_id);
        return assignment && s.marks_obtained >= (assignment.passing_marks || 40);
      });

      // Fetch assessment stats
      const { data: assessmentAssignments } = await (supabase as any)
        .from('assessment_class_assignments')
        .select('assessment_id')
        .eq('institution_id', institutionId);

      const assessmentIds = [...new Set((assessmentAssignments || []).map((a: any) => a.assessment_id))];
      
      let assessmentAttempts: any[] = [];
      if (assessmentIds.length > 0) {
        const { data: attempts } = await (supabase as any)
          .from('assessment_attempts')
          .select('*')
          .eq('institution_id', institutionId);
        assessmentAttempts = attempts || [];
      }

      const completedAttempts = assessmentAttempts.filter((a: any) => 
        a.status === 'submitted' || a.status === 'auto_submitted'
      );
      const passedAttempts = completedAttempts.filter((a: any) => a.passed);

      // Calculate averages
      const assignmentAvgScore = gradedAssignments.length > 0
        ? gradedAssignments.reduce((acc: number, s: any) => {
            const assignment = (assignments || []).find((a: any) => a.id === s.assignment_id);
            if (!assignment) return acc;
            return acc + (s.marks_obtained / assignment.total_marks) * 100;
          }, 0) / gradedAssignments.length
        : 0;

      const assessmentAvgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((acc: number, a: any) => acc + a.percentage, 0) / completedAttempts.length
        : 0;

      // Fetch top students
      const { data: studentProfiles } = await (supabase as any)
        .from('profiles')
        .select('id, name')
        .eq('institution_id', institutionId)
        .eq('role', 'student')
        .limit(50);

      const studentScores = (studentProfiles || []).map((student: any) => {
        const studentAssignments = gradedAssignments.filter((s: any) => s.student_id === student.id);
        const studentAttempts = completedAttempts.filter((a: any) => a.student_id === student.id);
        
        const totalItems = studentAssignments.length + studentAttempts.length;
        if (totalItems === 0) return { ...student, avgScore: 0, completedCount: 0 };

        let totalScore = 0;
        studentAssignments.forEach((s: any) => {
          const assignment = (assignments || []).find((a: any) => a.id === s.assignment_id);
          if (assignment) {
            totalScore += (s.marks_obtained / assignment.total_marks) * 100;
          }
        });
        studentAttempts.forEach((a: any) => {
          totalScore += a.percentage;
        });

        return {
          id: student.id,
          name: student.name || 'Unknown Student',
          avgScore: Math.round(totalScore / totalItems),
          completedCount: totalItems
        };
      });

      const topStudents = studentScores
        .filter((s: any) => s.completedCount > 0)
        .sort((a: any, b: any) => b.avgScore - a.avgScore)
        .slice(0, 10);

      setPerformanceData({
        assignments: {
          total: (assignments || []).length,
          submitted: assignmentSubmissions.length,
          graded: gradedAssignments.length,
          avgScore: Math.round(assignmentAvgScore),
          passRate: gradedAssignments.length > 0 
            ? Math.round((passedAssignments.length / gradedAssignments.length) * 100) 
            : 0
        },
        assessments: {
          total: assessmentIds.length,
          completed: completedAttempts.length,
          avgScore: Math.round(assessmentAvgScore),
          passRate: completedAttempts.length > 0 
            ? Math.round((passedAttempts.length / completedAttempts.length) * 100) 
            : 0
        },
        topStudents
      });
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value: number, target: number) => {
    if (value >= target) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (value < target - 10) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <Layout>
      <div className="space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institution.established_year}
            location={institution.location}
            totalStudents={institution.total_students}
            academicYear={institution.academic_year}
            userRole="Management Portal"
            assignedOfficers={institution.assigned_officers.map(o => o.officer_name)}
          />
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance Metrics</h1>
            <p className="text-muted-foreground">Track student performance in assignments and assessments</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : performanceData && (
          <>
            {/* Assignment & Assessment Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Assignment Submissions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.assignments.submitted}</div>
                  <p className="text-xs text-muted-foreground">
                    {performanceData.assignments.graded} graded out of {performanceData.assignments.submitted}
                  </p>
                  <Progress 
                    value={performanceData.assignments.submitted > 0 
                      ? (performanceData.assignments.graded / performanceData.assignments.submitted) * 100 
                      : 0
                    } 
                    className="h-2 mt-2" 
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Assignment Pass Rate</CardTitle>
                  {getTrendIcon(performanceData.assignments.passRate, 70)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.assignments.passRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Avg Score: {performanceData.assignments.avgScore}%
                  </p>
                  <Progress value={performanceData.assignments.passRate} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Assessment Attempts</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.assessments.completed}</div>
                  <p className="text-xs text-muted-foreground">
                    Across {performanceData.assessments.total} assessments
                  </p>
                  <Progress value={100} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Assessment Pass Rate</CardTitle>
                  {getTrendIcon(performanceData.assessments.passRate, 70)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{performanceData.assessments.passRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Avg Score: {performanceData.assessments.avgScore}%
                  </p>
                  <Progress value={performanceData.assessments.passRate} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Top Students Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performing Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceData.topStudents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No student performance data available yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {performanceData.topStudents.map((student, index) => (
                      <div key={student.id} className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-gray-300 text-gray-700' :
                          index === 2 ? 'bg-amber-600 text-amber-950' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {student.completedCount} items completed
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{student.avgScore}%</p>
                          <p className="text-xs text-muted-foreground">avg score</p>
                        </div>
                        <Progress value={student.avgScore} className="w-24 h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium">Assignments</span>
                    </div>
                    <p className="text-2xl font-bold">{performanceData.assignments.avgScore}%</p>
                    <p className="text-xs text-muted-foreground">Average score</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Assessments</span>
                    </div>
                    <p className="text-2xl font-bold">{performanceData.assessments.avgScore}%</p>
                    <p className="text-xs text-muted-foreground">Average score</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium">Total Submissions</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {performanceData.assignments.submitted + performanceData.assessments.completed}
                    </p>
                    <p className="text-xs text-muted-foreground">Combined count</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium">Overall Pass Rate</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {Math.round((performanceData.assignments.passRate + performanceData.assessments.passRate) / 2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average pass rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Performance;