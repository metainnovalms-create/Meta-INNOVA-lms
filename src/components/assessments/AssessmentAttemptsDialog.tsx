import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download, Eye, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface AssessmentWithStats {
  id: string;
  title: string;
  pass_percentage: number;
  total_points: number;
}

interface AttemptWithStudent {
  id: string;
  student_id: string;
  student_name: string;
  class_name: string;
  score: number;
  percentage: number;
  passed: boolean;
  status: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
}

interface AssessmentAttemptsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: AssessmentWithStats | null;
  institutionId: string;
}

export function AssessmentAttemptsDialog({
  open,
  onOpenChange,
  assessment,
  institutionId,
}: AssessmentAttemptsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<AttemptWithStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (open && assessment) {
      fetchAttempts();
    }
  }, [open, assessment]);

  const fetchAttempts = async () => {
    if (!assessment) return;
    setLoading(true);

    try {
      const { data: attemptsData, error } = await supabase
        .from('assessment_attempts')
        .select(`
          id,
          student_id,
          score,
          percentage,
          passed,
          status,
          submitted_at,
          time_taken_seconds,
          class_id
        `)
        .eq('assessment_id', assessment.id)
        .eq('institution_id', institutionId)
        .in('status', ['completed', 'submitted', 'auto_submitted', 'evaluated']);

      if (error) throw error;

      // Fetch student and class details
      const studentIds = [...new Set((attemptsData || []).map(a => a.student_id))];
      const classIds = [...new Set((attemptsData || []).map(a => a.class_id))];

      const [profilesRes, classesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name')
          .in('id', studentIds),
        supabase
          .from('classes')
          .select('id, class_name, section')
          .in('id', classIds),
      ]);

      const profilesMap = new Map(
        (profilesRes.data || []).map(p => [p.id, p.name || 'Unknown'])
      );
      const classesMap = new Map(
        (classesRes.data || []).map(c => [c.id, `${c.class_name}${c.section ? ' ' + c.section : ''}`])
      );

      const attemptsWithDetails: AttemptWithStudent[] = (attemptsData || []).map(a => ({
        id: a.id,
        student_id: a.student_id,
        student_name: profilesMap.get(a.student_id) || 'Unknown',
        class_name: classesMap.get(a.class_id) || 'Unknown',
        score: a.score,
        percentage: a.percentage,
        passed: a.passed,
        status: a.status,
        submitted_at: a.submitted_at,
        time_taken_seconds: a.time_taken_seconds,
      }));

      setAttempts(attemptsWithDetails);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAttempts = attempts.filter(a => {
    const matchesSearch = a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.class_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'passed' && a.passed) ||
      (filterStatus === 'failed' && !a.passed);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: attempts.length,
    passed: attempts.filter(a => a.passed).length,
    failed: attempts.filter(a => !a.passed).length,
    avgScore: attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length
      : 0,
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const exportToCSV = () => {
    if (!assessment) return;
    
    const headers = ['Student Name', 'Class', 'Score', 'Percentage', 'Status', 'Time Taken', 'Submitted At'];
    const rows = filteredAttempts.map(a => [
      a.student_name,
      a.class_name,
      a.score.toString(),
      `${a.percentage.toFixed(1)}%`,
      a.passed ? 'Passed' : 'Failed',
      formatDuration(a.time_taken_seconds),
      a.submitted_at ? format(new Date(a.submitted_at), 'PPpp') : '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessment.title}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{assessment?.title} - Student Attempts</span>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Attempts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.passed}</p>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{stats.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.avgScore.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Avg Score</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name or class..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Attempts Table */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No attempts found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Percentage</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Time Taken</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="font-medium">{attempt.student_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{attempt.class_name}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.score}/{assessment?.total_points || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={attempt.percentage >= (assessment?.pass_percentage || 0) ? 'default' : 'secondary'}>
                        {attempt.percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {attempt.passed ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                          Passed
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDuration(attempt.time_taken_seconds)}
                    </TableCell>
                    <TableCell>
                      {attempt.submitted_at
                        ? format(new Date(attempt.submitted_at), 'PP p')
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}