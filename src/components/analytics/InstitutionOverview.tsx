import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, Award, GraduationCap, Zap, Trophy, FolderKanban, 
  BookOpen, TrendingUp, Target, Star
} from 'lucide-react';
import { InstitutionPerformance, StudentPerformance } from '@/hooks/useComprehensiveAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';

interface InstitutionOverviewProps {
  data: InstitutionPerformance;
  institutionName: string;
}

export function InstitutionOverview({ data, institutionName }: InstitutionOverviewProps) {
  const radarData = [
    { metric: 'Assessments', value: data.assessment_avg, fullMark: 100 },
    { metric: 'Pass Rate', value: data.assessment_pass_rate, fullMark: 100 },
    { metric: 'Assignments', value: data.assignment_avg, fullMark: 100 },
    { metric: 'Course Progress', value: data.course_completion, fullMark: 100 },
    { metric: 'Engagement', value: Math.min(data.total_xp / (data.total_students || 1) / 10, 100), fullMark: 100 },
  ];

  const classComparisonData = data.classPerformance.map(cls => ({
    name: cls.class_name,
    'Avg Score': cls.assessment_avg,
    'Pass Rate': cls.assessment_pass_rate,
    'Overall': cls.overall_score,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_students}</div>
            <p className="text-xs text-muted-foreground">{data.total_classes} classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessment Avg</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.assessment_avg}%</div>
            <p className="text-xs text-muted-foreground">{data.assessment_pass_rate}% pass rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Avg</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.assignment_avg}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total XP Earned</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_xp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ~{Math.round(data.total_xp / (data.total_students || 1))} per student
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Course Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.course_completion}%</div>
            <Progress value={data.course_completion} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Achievements Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_badges}</div>
            <p className="text-xs text-muted-foreground">
              ~{(data.total_badges / (data.total_students || 1)).toFixed(1)} per student
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Participated</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_projects}</div>
            <p className="text-xs text-muted-foreground">
              ~{(data.total_projects / (data.total_students || 1)).toFixed(1)} per student
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance Radar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance Overview
            </CardTitle>
            <CardDescription>Institution-wide performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name={institutionName}
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Class Performance Comparison
            </CardTitle>
            <CardDescription>Average scores by class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {classComparisonData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No class data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparisonData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Legend />
                    <Bar dataKey="Avg Score" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Pass Rate" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Institution Toppers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Institution Toppers - Top 10
          </CardTitle>
          <CardDescription>Students with highest overall performance score</CardDescription>
        </CardHeader>
        <CardContent>
          {data.topStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No student data available
            </div>
          ) : (
            <div className="space-y-3">
              {data.topStudents.map((student, index) => (
                <StudentRankCard key={student.student_id} student={student} rank={index + 1} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentRankCard({ student, rank }: { student: StudentPerformance; rank: number }) {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🥇 1st</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2nd</Badge>;
    if (rank === 3) return <Badge className="bg-orange-600 text-white">🥉 3rd</Badge>;
    return <Badge variant="outline">#{rank}</Badge>;
  };

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-4">
        {getRankBadge(rank)}
        <div>
          <p className="font-medium">{student.student_name}</p>
          <p className="text-sm text-muted-foreground">{student.class_name}</p>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="font-semibold">{student.assessment_avg}%</p>
          <p className="text-xs text-muted-foreground">Assessments</p>
        </div>
        <div className="text-center">
          <p className="font-semibold">{student.assignment_avg}%</p>
          <p className="text-xs text-muted-foreground">Assignments</p>
        </div>
        <div className="text-center">
          <p className="font-semibold flex items-center gap-1">
            <Zap className="h-3 w-3 text-yellow-500" />
            {student.total_xp}
          </p>
          <p className="text-xs text-muted-foreground">XP</p>
        </div>
        <div className="text-center">
          <p className="font-semibold flex items-center gap-1">
            <Award className="h-3 w-3 text-purple-500" />
            {student.badges_count}
          </p>
          <p className="text-xs text-muted-foreground">Badges</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-primary">{student.overall_score}</p>
          <p className="text-xs text-muted-foreground">Overall</p>
        </div>
      </div>
    </div>
  );
}
