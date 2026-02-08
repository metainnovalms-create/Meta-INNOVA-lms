import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, Award, GraduationCap, Zap, Trophy, FolderKanban, 
  BookOpen, TrendingUp, Target
} from 'lucide-react';
import { ClassPerformance, StudentPerformance } from '@/hooks/useComprehensiveAnalytics';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

interface ClassAnalyticsViewProps {
  classes: ClassPerformance[];
}

export function ClassAnalyticsView({ classes }: ClassAnalyticsViewProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.class_id || '');
  
  const selectedClass = classes.find(c => c.class_id === selectedClassId);

  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No class data available</p>
        </CardContent>
      </Card>
    );
  }

  const radarData = selectedClass ? [
    { metric: 'FA1 (20%)', value: (selectedClass.weighted_assessment?.fa1_score || 0) * 5, fullMark: 100 },
    { metric: 'FA2 (20%)', value: (selectedClass.weighted_assessment?.fa2_score || 0) * 5, fullMark: 100 },
    { metric: 'Final (40%)', value: (selectedClass.weighted_assessment?.final_score || 0) * 2.5, fullMark: 100 },
    { metric: 'Internal (20%)', value: (selectedClass.weighted_assessment?.internal_score || 0) * 5, fullMark: 100 },
    { metric: 'Course Progress', value: selectedClass.course_completion, fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Class Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Class Performance Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Weighted Assessment: FA1 20% + FA2 20% + Final 40% + Internal 20%
          </p>
        </div>
        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(cls => (
              <SelectItem key={cls.class_id} value={cls.class_id}>
                {cls.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedClass && (
        <>
          {/* Weighted Assessment Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Weighted Assessment Breakdown
              </CardTitle>
              <CardDescription>Class average scores per assessment category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                  <p className="text-sm font-medium text-muted-foreground">FA1 (20%)</p>
                  <p className="text-3xl font-bold text-blue-600">{selectedClass.weighted_assessment?.fa1_score || 0}</p>
                  <Progress value={(selectedClass.weighted_assessment?.fa1_score || 0) * 5} className="mt-2 h-1.5" />
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                  <p className="text-sm font-medium text-muted-foreground">FA2 (20%)</p>
                  <p className="text-3xl font-bold text-green-600">{selectedClass.weighted_assessment?.fa2_score || 0}</p>
                  <Progress value={(selectedClass.weighted_assessment?.fa2_score || 0) * 5} className="mt-2 h-1.5" />
                </div>
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Final (40%)</p>
                  <p className="text-3xl font-bold text-purple-600">{selectedClass.weighted_assessment?.final_score || 0}</p>
                  <Progress value={(selectedClass.weighted_assessment?.final_score || 0) * 2.5} className="mt-2 h-1.5" />
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
                  <p className="text-sm font-medium text-muted-foreground">Internal (20%)</p>
                  <p className="text-3xl font-bold text-orange-600">{selectedClass.weighted_assessment?.internal_score || 0}</p>
                  <Progress value={(selectedClass.weighted_assessment?.internal_score || 0) * 5} className="mt-2 h-1.5" />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                <span className="text-lg font-medium">Total Weighted Assessment</span>
                <span className="text-3xl font-bold text-primary">{selectedClass.weighted_assessment?.total_weighted || 0}%</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedClass.total_students}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Weighted Assessment</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedClass.assessment_avg}%</div>
                <p className="text-xs text-muted-foreground">class average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assignment Avg</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedClass.assignment_avg}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{selectedClass.overall_score}</div>
                <Progress value={selectedClass.overall_score} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedClass.total_xp.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  ~{Math.round(selectedClass.total_xp / (selectedClass.total_students || 1))} avg
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Badges</CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedClass.avg_badges}</div>
                <p className="text-xs text-muted-foreground">per student</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Projects</CardTitle>
                <FolderKanban className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedClass.avg_projects}</div>
                <p className="text-xs text-muted-foreground">per student</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Progress</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{selectedClass.course_completion}%</div>
                <Progress value={selectedClass.course_completion} className="mt-2 h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {selectedClass.class_name} Performance Profile
              </CardTitle>
              <CardDescription>Multi-dimensional performance view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar
                      name={selectedClass.class_name}
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Class Toppers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Class Toppers - Top 10
              </CardTitle>
              <CardDescription>
                Students with highest overall performance in {selectedClass.class_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedClass.topStudents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No student data available for this class
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedClass.topStudents.map((student, index) => (
                    <StudentRankCard key={student.student_id} student={student} rank={index + 1} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* All Classes Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Classes Comparison</CardTitle>
          <CardDescription>Side-by-side metrics for all classes (Weighted Assessment %)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Class</th>
                  <th className="text-center py-3 px-2 font-medium">Students</th>
                  <th className="text-center py-3 px-2 font-medium">FA1</th>
                  <th className="text-center py-3 px-2 font-medium">FA2</th>
                  <th className="text-center py-3 px-2 font-medium">Final</th>
                  <th className="text-center py-3 px-2 font-medium">Internal</th>
                  <th className="text-center py-3 px-2 font-medium">Total</th>
                  <th className="text-center py-3 px-2 font-medium">Overall</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((cls, index) => (
                  <tr 
                    key={cls.class_id} 
                    className={`border-b last:border-0 ${cls.class_id === selectedClassId ? 'bg-muted/50' : ''}`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                        <span className="font-medium">{cls.class_name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2">{cls.total_students}</td>
                    <td className="text-center py-3 px-2">{cls.weighted_assessment?.fa1_score || 0}</td>
                    <td className="text-center py-3 px-2">{cls.weighted_assessment?.fa2_score || 0}</td>
                    <td className="text-center py-3 px-2">{cls.weighted_assessment?.final_score || 0}</td>
                    <td className="text-center py-3 px-2">{cls.weighted_assessment?.internal_score || 0}</td>
                    <td className="text-center py-3 px-2">
                      <Badge variant={cls.weighted_assessment?.total_weighted && cls.weighted_assessment.total_weighted >= 40 ? 'default' : 'secondary'}>
                        {cls.weighted_assessment?.total_weighted || 0}%
                      </Badge>
                    </td>
                    <td className="text-center py-3 px-2">
                      <Badge variant="outline" className="font-semibold">
                        {cls.overall_score}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-center">
          <p className="font-semibold">{student.weighted_assessment?.total_weighted || 0}%</p>
          <p className="text-xs text-muted-foreground">Weighted</p>
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
