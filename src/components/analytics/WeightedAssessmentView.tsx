import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Loader2, TrendingUp, Award, Percent, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateWeightedScore, WEIGHTAGE, getShortLabel } from '@/utils/assessmentWeightageCalculator';

interface WeightedAssessmentViewProps {
  classId: string;
  className: string;
  institutionId: string;
  academicYear?: string;
}

interface StudentWeightedScore {
  student_id: string;
  student_name: string;
  fa1: { score: number; percentage: number; status: string };
  fa2: { score: number; percentage: number; status: string };
  final: { score: number; percentage: number; status: string };
  internal: { score: number; percentage: number; status: string };
  total: number;
  rank?: number;
}

export function WeightedAssessmentView({
  classId,
  className,
  institutionId,
  academicYear = '2024-25',
}: WeightedAssessmentViewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['weighted-assessment-scores', classId, academicYear],
    queryFn: async (): Promise<StudentWeightedScore[]> => {
      // Fetch mapping
      const { data: mapping } = await supabase
        .from('class_assessment_mapping')
        .select('*')
        .eq('class_id', classId)
        .eq('academic_year', academicYear)
        .maybeSingle();

      // Fetch students
      const { data: students } = await supabase
        .from('students')
        .select('id, user_id, student_name')
        .eq('class_id', classId)
        .eq('status', 'active');

      if (!students || students.length === 0) return [];

      const studentUserIds = students.map(s => s.user_id).filter(Boolean) as string[];

      // Fetch assessment attempts for mapped assessments
      let fa1Attempts: any[] = [];
      let fa2Attempts: any[] = [];
      let finalAttempts: any[] = [];

      if (mapping?.fa1_assessment_id && studentUserIds.length > 0) {
        const { data } = await supabase
          .from('assessment_attempts')
          .select('student_id, score, total_points, percentage, status')
          .eq('assessment_id', mapping.fa1_assessment_id)
          .in('student_id', studentUserIds);
        fa1Attempts = data || [];
      }

      if (mapping?.fa2_assessment_id && studentUserIds.length > 0) {
        const { data } = await supabase
          .from('assessment_attempts')
          .select('student_id, score, total_points, percentage, status')
          .eq('assessment_id', mapping.fa2_assessment_id)
          .in('student_id', studentUserIds);
        fa2Attempts = data || [];
      }

      if (mapping?.final_assessment_id && studentUserIds.length > 0) {
        const { data } = await supabase
          .from('assessment_attempts')
          .select('student_id, score, total_points, percentage, status')
          .eq('assessment_id', mapping.final_assessment_id)
          .in('student_id', studentUserIds);
        finalAttempts = data || [];
      }

      // Fetch internal marks
      const { data: internalMarks } = await supabase
        .from('internal_assessment_marks')
        .select('student_id, marks_obtained, total_marks')
        .eq('class_id', classId)
        .eq('academic_year', academicYear);

      // Build scores for each student
      const scores: StudentWeightedScore[] = students
        .filter(s => s.user_id)
        .map(student => {
          const fa1Attempt = fa1Attempts.find(a => a.student_id === student.user_id);
          const fa2Attempt = fa2Attempts.find(a => a.student_id === student.user_id);
          const finalAttempt = finalAttempts.find(a => a.student_id === student.user_id);
          const internal = internalMarks?.find(m => m.student_id === student.user_id);

          const result = calculateWeightedScore(
            fa1Attempt || null,
            fa2Attempt || null,
            finalAttempt || null,
            internal ? { obtained: internal.marks_obtained, total: internal.total_marks } : null
          );

          return {
            student_id: student.id,
            student_name: student.student_name,
            fa1: {
              score: result.fa1_score,
              percentage: result.breakdown.fa1.percentage,
              status: result.breakdown.fa1.status,
            },
            fa2: {
              score: result.fa2_score,
              percentage: result.breakdown.fa2.percentage,
              status: result.breakdown.fa2.status,
            },
            final: {
              score: result.final_score,
              percentage: result.breakdown.final.percentage,
              status: result.breakdown.final.status,
            },
            internal: {
              score: result.internal_score,
              percentage: result.breakdown.internal.percentage,
              status: result.breakdown.internal.status,
            },
            total: result.total_weighted,
          };
        });

      // Sort by total and add rank
      scores.sort((a, b) => b.total - a.total);
      return scores.map((s, i) => ({ ...s, rank: i + 1 }));
    },
    enabled: !!classId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const scores = data || [];
  const avgTotal = scores.length > 0 
    ? Math.round((scores.reduce((sum, s) => sum + s.total, 0) / scores.length) * 10) / 10 
    : 0;

  const getStatusBadge = (status: string, percentage: number) => {
    if (status === 'absent') {
      return <Badge variant="destructive">Absent (0)</Badge>;
    }
    if (status === 'pending') {
      return <Badge variant="secondary">Pending</Badge>;
    }
    return <Badge variant="outline">{Math.round(percentage)}%</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">FA1 (20%)</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {scores.length > 0 
                ? Math.round((scores.reduce((sum, s) => sum + s.fa1.percentage, 0) / scores.length) * 10) / 10 
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">FA2 (20%)</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {scores.length > 0 
                ? Math.round((scores.reduce((sum, s) => sum + s.fa2.percentage, 0) / scores.length) * 10) / 10 
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Final (40%)</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {scores.length > 0 
                ? Math.round((scores.reduce((sum, s) => sum + s.final.percentage, 0) / scores.length) * 10) / 10 
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Internal (20%)</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {scores.length > 0 
                ? Math.round((scores.reduce((sum, s) => sum + s.internal.percentage, 0) / scores.length) * 10) / 10 
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary">Weighted Avg</span>
            </div>
            <div className="text-2xl font-bold mt-1 text-primary">{avgTotal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Student Scores Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Weighted Scores - {className}</CardTitle>
          <CardDescription>
            Breakdown by assessment category with weighted totals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No student data available. Ensure assessments are mapped and students have attempts.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">FA1 (20%)</TableHead>
                  <TableHead className="text-center">FA2 (20%)</TableHead>
                  <TableHead className="text-center">Final (40%)</TableHead>
                  <TableHead className="text-center">Internal (20%)</TableHead>
                  <TableHead className="text-right">Weighted Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell>
                      <Badge variant={student.rank! <= 3 ? 'default' : 'outline'}>
                        #{student.rank}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{student.student_name}</TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(student.fa1.status, student.fa1.percentage)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(student.fa2.status, student.fa2.percentage)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(student.final.status, student.final.percentage)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(student.internal.status, student.internal.percentage)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Progress value={student.total} className="w-20 h-2" />
                        <span className="font-bold w-12 text-right">{student.total}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
