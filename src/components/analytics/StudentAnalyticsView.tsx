import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { 
  Users, Award, GraduationCap, Zap, FolderKanban, 
  BookOpen, Search, ChevronLeft, ChevronRight, User
} from 'lucide-react';
import { ClassPerformance, StudentPerformance } from '@/hooks/useComprehensiveAnalytics';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer
} from 'recharts';

interface StudentAnalyticsViewProps {
  classes: ClassPerformance[];
}

export function StudentAnalyticsView({ classes }: StudentAnalyticsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Gather all students from all classes
  const allStudents = useMemo(() => {
    const students: StudentPerformance[] = [];
    classes.forEach(cls => {
      cls.allStudents.forEach(student => {
        // Avoid duplicates
        if (!students.find(s => s.student_id === student.student_id)) {
          students.push(student);
        }
      });
    });
    return students.sort((a, b) => b.overall_score - a.overall_score);
  }, [classes]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = allStudents;
    
    if (selectedClassId !== 'all') {
      result = result.filter(s => s.class_id === selectedClassId);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.student_name.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [allStudents, selectedClassId, searchQuery]);

  // Paginate
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  const handleSelectStudent = (student: StudentPerformance) => {
    setSelectedStudent(student);
  };

  const radarData = selectedStudent ? [
    { metric: 'Assessments', value: selectedStudent.assessment_avg, fullMark: 100 },
    { metric: 'Pass Rate', value: selectedStudent.assessment_pass_rate, fullMark: 100 },
    { metric: 'Assignments', value: selectedStudent.assignment_avg, fullMark: 100 },
    { metric: 'Course Progress', value: selectedStudent.course_completion, fullMark: 100 },
    { metric: 'XP Score', value: Math.min(selectedStudent.total_xp / 10, 100), fullMark: 100 },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Individual Student Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Detailed performance metrics for each student
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select value={selectedClassId} onValueChange={(value) => {
          setSelectedClassId(value);
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(cls => (
              <SelectItem key={cls.class_id} value={cls.class_id}>
                {cls.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Student List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription>Click on a student to view detailed analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedStudents.map((student, index) => {
                  const globalRank = (currentPage - 1) * pageSize + index + 1;
                  return (
                    <div
                      key={student.student_id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedStudent?.student_id === student.student_id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                      onClick={() => handleSelectStudent(student)}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 justify-center">
                          {globalRank}
                        </Badge>
                        <div>
                          <p className="font-medium">{student.student_name}</p>
                          <p className="text-xs text-muted-foreground">{student.class_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold">{student.overall_score}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Detail */}
        <div className="space-y-4">
          {selectedStudent ? (
            <>
              {/* Student Profile Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{selectedStudent.student_name}</CardTitle>
                      <CardDescription>{selectedStudent.class_name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Metrics Grid */}
              <div className="grid gap-3 grid-cols-2">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Assessment Avg</span>
                      </div>
                      <span className="font-bold">{selectedStudent.assessment_avg}%</span>
                    </div>
                    <Progress value={selectedStudent.assessment_avg} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Pass Rate</span>
                      </div>
                      <span className="font-bold">{selectedStudent.assessment_pass_rate}%</span>
                    </div>
                    <Progress value={selectedStudent.assessment_pass_rate} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Assignment Avg</span>
                      </div>
                      <span className="font-bold">{selectedStudent.assignment_avg}%</span>
                    </div>
                    <Progress value={selectedStudent.assignment_avg} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">Course Progress</span>
                      </div>
                      <span className="font-bold">{selectedStudent.course_completion}%</span>
                    </div>
                    <Progress value={selectedStudent.course_completion} className="mt-2 h-1.5" />
                  </CardContent>
                </Card>
              </div>

              {/* Achievements Row */}
              <div className="grid gap-3 grid-cols-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{selectedStudent.total_xp}</p>
                    <p className="text-xs text-muted-foreground">XP Points</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <Award className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{selectedStudent.badges_count}</p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4 text-center">
                    <FolderKanban className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{selectedStudent.projects_count}</p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </CardContent>
                </Card>
              </div>

              {/* Overall Score */}
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Overall Performance Score</p>
                  <p className="text-4xl font-bold text-primary">{selectedStudent.overall_score}</p>
                  <Progress value={selectedStudent.overall_score} className="mt-4 h-2" />
                </CardContent>
              </Card>

              {/* Performance Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Performance Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" className="text-xs" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                        <Radar
                          name={selectedStudent.student_name}
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
            </>
          ) : (
            <Card className="h-full min-h-[400px]">
              <CardContent className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <User className="h-12 w-12 mb-4 opacity-50" />
                <p>Select a student to view detailed analytics</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
