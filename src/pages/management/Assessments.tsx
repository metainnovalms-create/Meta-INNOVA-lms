import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Users, CheckCircle, Clock, Search, TrendingUp, Award, Eye, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { AssessmentAttemptsDialog } from '@/components/assessments/AssessmentAttemptsDialog';

interface AssessmentWithStats {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  pass_percentage: number;
  total_points: number;
  attempts_count: number;
  passed_count: number;
  average_score: number;
  classes: string[];
}

export default function ManagementAssessments() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentWithStats | null>(null);
  const [attemptsDialogOpen, setAttemptsDialogOpen] = useState(false);
  const institutionId = user?.institution_id || user?.tenant_id || '';

  useEffect(() => {
    const fetchAssessments = async () => {
      const institutionId = user?.institution_id || user?.tenant_id;
      if (!institutionId) return;
      setLoading(true);

      try {
        // Get assessments assigned to classes in this institution
        const { data: classAssignments } = await supabase
          .from('assessment_class_assignments')
          .select(`
            assessment_id,
            class_id,
            classes:class_id (class_name, section)
          `)
          .eq('institution_id', institutionId);

        if (!classAssignments || classAssignments.length === 0) {
          setAssessments([]);
          setLoading(false);
          return;
        }

        // Get unique assessment IDs
        const assessmentIds = [...new Set(classAssignments.map(a => a.assessment_id))];

        // Fetch assessment details
        const { data: assessmentData } = await supabase
          .from('assessments')
          .select('*')
          .in('id', assessmentIds);

        // Fetch attempts for statistics
        const { data: attempts } = await supabase
          .from('assessment_attempts')
          .select('assessment_id, score, percentage, passed, status')
          .eq('institution_id', institutionId)
          .in('status', ['completed', 'submitted', 'auto_submitted', 'evaluated']);

        // Extract unique classes
        const classesMap = new Map<string, { id: string; name: string }>();
        classAssignments.forEach(ca => {
        const classInfo = ca.classes as any;
        if (classInfo) {
          classesMap.set(ca.class_id, { id: ca.class_id, name: classInfo.class_name });
        }
        });
        setAvailableClasses(Array.from(classesMap.values()));

        // Combine data
        const assessmentsWithStats: AssessmentWithStats[] = (assessmentData || []).map(assessment => {
          const assignedClassAssignments = classAssignments.filter(ca => ca.assessment_id === assessment.id);
          const assignedClasses = assignedClassAssignments
            .map(ca => {
              const classInfo = ca.classes as any;
              return classInfo ? classInfo.class_name : '';
            })
            .filter(Boolean);

          const assessmentAttempts = (attempts || []).filter(a => a.assessment_id === assessment.id);
          const passedAttempts = assessmentAttempts.filter(a => a.passed);
          const avgScore = assessmentAttempts.length > 0
            ? assessmentAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / assessmentAttempts.length
            : 0;

          return {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            status: assessment.status,
            start_time: assessment.start_time,
            end_time: assessment.end_time,
            duration_minutes: assessment.duration_minutes,
            pass_percentage: assessment.pass_percentage,
            total_points: assessment.total_points,
            attempts_count: assessmentAttempts.length,
            passed_count: passedAttempts.length,
            average_score: avgScore,
            classes: assignedClasses,
            class_ids: assignedClassAssignments.map(ca => ca.class_id),
          };
        });

        setAssessments(assessmentsWithStats);
      } catch (error) {
        console.error('Error fetching assessments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [user?.institution_id, user?.tenant_id]);

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || (a as any).class_ids?.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  const stats = {
    total: assessments.length,
    active: assessments.filter(a => a.status === 'published').length,
    totalAttempts: assessments.reduce((sum, a) => sum + a.attempts_count, 0),
    avgPassRate: assessments.length > 0
      ? assessments.reduce((sum, a) => sum + (a.attempts_count > 0 ? (a.passed_count / a.attempts_count) * 100 : 0), 0) / assessments.filter(a => a.attempts_count > 0).length || 0
      : 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Published</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Completed</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-2">
            View assessment performance and analytics for your institution
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{stats.active} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground">completed submissions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgPassRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">across all assessments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">ongoing assessments</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {availableClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assessments Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Assessments</CardTitle>
            <CardDescription>Assessment performance and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAssessments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No assessments found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Classes</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead className="text-center">Attempts</TableHead>
                    <TableHead className="text-center">Pass Rate</TableHead>
                    <TableHead className="text-center">Avg Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssessments.map((assessment) => {
                    const passRate = assessment.attempts_count > 0
                      ? (assessment.passed_count / assessment.attempts_count) * 100
                      : 0;

                    return (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{assessment.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {assessment.total_points} points • Pass: {assessment.pass_percentage}%
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {assessment.classes.slice(0, 2).map((cls, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {cls}
                              </Badge>
                            ))}
                            {assessment.classes.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{assessment.classes.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{assessment.duration_minutes} min</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">{assessment.attempts_count}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2">
                            <Progress value={passRate} className="w-16 h-2" />
                            <span className="text-sm font-medium">{passRate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={assessment.average_score >= assessment.pass_percentage ? 'default' : 'secondary'}>
                            {assessment.average_score.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(assessment.status)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAssessment(assessment);
                              setAttemptsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Attempts Dialog */}
        <AssessmentAttemptsDialog
          open={attemptsDialogOpen}
          onOpenChange={setAttemptsDialogOpen}
          assessment={selectedAssessment}
          institutionId={institutionId}
        />
      </div>
    </Layout>
  );
}
