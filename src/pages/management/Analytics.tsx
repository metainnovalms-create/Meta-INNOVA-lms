import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  Users, FileText, TrendingUp, Award, GraduationCap, 
  Target, CheckCircle, Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ClassPerformance {
  class_name: string;
  avg_score: number;
  pass_rate: number;
  total_students: number;
}

interface MonthlyTrend {
  month: string;
  assessments_avg: number;
  assignments_avg: number;
  pass_rate: number;
}

interface ScoreDistribution {
  grade: string;
  count: number;
  color: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const GRADE_COLORS: Record<string, string> = {
  'A (90-100%)': '#22c55e',
  'B (80-89%)': '#3b82f6',
  'C (70-79%)': '#f59e0b',
  'D (60-69%)': '#f97316',
  'F (Below 60%)': '#ef4444',
};

export default function ManagementAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAssessments: 0,
    totalAssignments: 0,
    avgPassRate: 0,
    avgScore: 0,
  });

  const institutionId = user?.institution_id || user?.tenant_id;

  useEffect(() => {
    if (institutionId) {
      fetchAnalytics();
    }
  }, [institutionId, selectedPeriod]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', institutionId);

      // Fetch assessment attempts with class info
      const { data: attempts } = await supabase
        .from('assessment_attempts')
        .select(`
          id, percentage, passed, submitted_at, class_id,
          classes:class_id (class_name, section)
        `)
        .eq('institution_id', institutionId)
        .in('status', ['completed', 'submitted', 'auto_submitted']);

      // Fetch assignment submissions with class info
      const { data: submissions } = await supabase
        .from('assignment_submissions')
        .select(`
          id, marks_obtained, submitted_at, class_id,
          assignments:assignment_id (total_marks, passing_marks),
          classes:class_id (class_name, section)
        `)
        .eq('institution_id', institutionId)
        .eq('status', 'graded');

      // Fetch assessment count
      const { data: assessmentAssignments } = await supabase
        .from('assessment_class_assignments')
        .select('assessment_id')
        .eq('institution_id', institutionId);

      // Fetch assignment count
      const { data: assignmentAssignments } = await supabase
        .from('assignment_class_assignments')
        .select('assignment_id')
        .eq('institution_id', institutionId);

      // Calculate stats
      const uniqueAssessments = new Set(assessmentAssignments?.map(a => a.assessment_id) || []);
      const uniqueAssignments = new Set(assignmentAssignments?.map(a => a.assignment_id) || []);

      const passedAttempts = attempts?.filter(a => a.passed) || [];
      const avgPassRate = attempts?.length ? (passedAttempts.length / attempts.length) * 100 : 0;
      const avgScore = attempts?.length 
        ? attempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / attempts.length 
        : 0;

      setStats({
        totalStudents: studentsCount || 0,
        totalAssessments: uniqueAssessments.size,
        totalAssignments: uniqueAssignments.size,
        avgPassRate,
        avgScore,
      });

      // Calculate class performance
      const classMap = new Map<string, { scores: number[], passed: number, total: number }>();
      attempts?.forEach(attempt => {
        const classInfo = attempt.classes as any;
        if (!classInfo) return;
        const className = classInfo.class_name;
        
        if (!classMap.has(className)) {
          classMap.set(className, { scores: [], passed: 0, total: 0 });
        }
        const data = classMap.get(className)!;
        data.scores.push(attempt.percentage || 0);
        data.total++;
        if (attempt.passed) data.passed++;
      });

      const classPerf: ClassPerformance[] = Array.from(classMap.entries()).map(([name, data]) => ({
        class_name: name,
        avg_score: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        pass_rate: (data.passed / data.total) * 100,
        total_students: data.total,
      }));
      setClassPerformance(classPerf);

      // Calculate monthly trends
      const months = selectedPeriod === '6months' ? 6 : 12;
      const trends: MonthlyTrend[] = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const monthAttempts = attempts?.filter(a => {
          const submittedAt = new Date(a.submitted_at || '');
          return submittedAt >= monthStart && submittedAt <= monthEnd;
        }) || [];

        const monthSubmissions = submissions?.filter(s => {
          const submittedAt = new Date(s.submitted_at || '');
          return submittedAt >= monthStart && submittedAt <= monthEnd;
        }) || [];

        const assessmentAvg = monthAttempts.length 
          ? monthAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / monthAttempts.length 
          : 0;

        const assignmentAvg = monthSubmissions.length 
          ? monthSubmissions.reduce((sum, s) => {
              const total = (s.assignments as any)?.total_marks || 100;
              return sum + ((s.marks_obtained || 0) / total) * 100;
            }, 0) / monthSubmissions.length 
          : 0;

        const passRate = monthAttempts.length 
          ? (monthAttempts.filter(a => a.passed).length / monthAttempts.length) * 100 
          : 0;

        trends.push({
          month: format(date, 'MMM yyyy'),
          assessments_avg: Math.round(assessmentAvg * 10) / 10,
          assignments_avg: Math.round(assignmentAvg * 10) / 10,
          pass_rate: Math.round(passRate * 10) / 10,
        });
      }
      setMonthlyTrends(trends);

      // Calculate score distribution
      const distribution = [
        { grade: 'A (90-100%)', count: 0, color: GRADE_COLORS['A (90-100%)'] },
        { grade: 'B (80-89%)', count: 0, color: GRADE_COLORS['B (80-89%)'] },
        { grade: 'C (70-79%)', count: 0, color: GRADE_COLORS['C (70-79%)'] },
        { grade: 'D (60-69%)', count: 0, color: GRADE_COLORS['D (60-69%)'] },
        { grade: 'F (Below 60%)', count: 0, color: GRADE_COLORS['F (Below 60%)'] },
      ];

      attempts?.forEach(attempt => {
        const pct = attempt.percentage || 0;
        if (pct >= 90) distribution[0].count++;
        else if (pct >= 80) distribution[1].count++;
        else if (pct >= 70) distribution[2].count++;
        else if (pct >= 60) distribution[3].count++;
        else distribution[4].count++;
      });

      setScoreDistribution(distribution);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Comprehensive performance insights for your institution
            </p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assessments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssessments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.avgPassRate.toFixed(1)}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Performance Trends */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Average scores and pass rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="assessments_avg" 
                      name="Assessment Avg" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.3} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="assignments_avg" 
                      name="Assignment Avg" 
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.3} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pass_rate" 
                      name="Pass Rate" 
                      stroke="#f59e0b" 
                      fill="#f59e0b" 
                      fillOpacity={0.3} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Class Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Class Comparison</CardTitle>
              <CardDescription>Average scores by class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {classPerformance.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No class data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="class_name" type="category" width={80} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Bar dataKey="avg_score" name="Avg Score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="pass_rate" name="Pass Rate" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Assessment scores by grade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {scoreDistribution.every(d => d.count === 0) ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No score data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={scoreDistribution.filter(d => d.count > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ grade, percent }) => `${grade.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {scoreDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers by Class */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Summary</CardTitle>
            <CardDescription>Detailed statistics for each class</CardDescription>
          </CardHeader>
          <CardContent>
            {classPerformance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No class performance data available
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classPerformance.map((cls) => (
                  <Card key={cls.class_name} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{cls.class_name}</CardTitle>
                        <Badge variant={cls.pass_rate >= 70 ? 'default' : 'secondary'}>
                          {cls.pass_rate.toFixed(0)}% Pass
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avg Score</span>
                        <span className="font-medium">{cls.avg_score.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Attempts</span>
                        <span className="font-medium">{cls.total_students}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
