import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Assessment } from '@/types/assessment';
import { assessmentService } from '@/services/assessment.service';
import { Loader2, Save, Users, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTimeLocal } from '@/utils/assessmentHelpers';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface ManualResult {
  student_id: string;
  student_name: string;
  score: number;
  passed: boolean;
  notes: string;
  is_absent: boolean;
}

interface ManualAssessmentEntryProps {
  restrictToInstitutionId?: string;
  onComplete?: () => void;
}

export function ManualAssessmentEntry({ restrictToInstitutionId, onComplete }: ManualAssessmentEntryProps) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<{ id: string; class_name: string; section: string; institution_id: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [conductedAt, setConductedAt] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [results, setResults] = useState<ManualResult[]>([]);

  // Load assessments and classes on mount
  useEffect(() => {
    loadData();
  }, [restrictToInstitutionId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load assessments
      const assessmentsData = await assessmentService.getAssessments();
      setAssessments(assessmentsData);

      // Load classes
      let query = supabase.from('classes').select('id, class_name, section, institution_id').eq('status', 'active');
      if (restrictToInstitutionId) {
        query = query.eq('institution_id', restrictToInstitutionId);
      }
      const { data: classesData } = await query;
      setClasses(classesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load students when class changes
  useEffect(() => {
    if (selectedClassId) {
      loadStudents();
    } else {
      setStudents([]);
      setResults([]);
    }
  }, [selectedClassId]);

  const loadStudents = async () => {
    const { data: studentsData } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('class_id', selectedClassId)
      .order('name');

    if (studentsData) {
      setStudents(studentsData);
      // Initialize results for all students
      setResults(studentsData.map(s => ({
        student_id: s.id,
        student_name: s.name,
        score: 0,
        passed: false,
        notes: '',
        is_absent: false
      })));
    }
  };

  const handleScoreChange = (studentId: string, score: number) => {
    setResults(prev => prev.map(r => {
      if (r.student_id === studentId) {
        const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId);
        const passPercentage = selectedAssessment?.pass_percentage || 70;
        const totalPoints = selectedAssessment?.total_points || 100;
        const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
        return { ...r, score, passed: percentage >= passPercentage };
      }
      return r;
    }));
  };

  const handlePassedChange = (studentId: string, passed: boolean) => {
    setResults(prev => prev.map(r => 
      r.student_id === studentId ? { ...r, passed } : r
    ));
  };

  const handleAbsentChange = (studentId: string, isAbsent: boolean) => {
    setResults(prev => prev.map(r => {
      if (r.student_id === studentId) {
        return { 
          ...r, 
          is_absent: isAbsent,
          score: isAbsent ? 0 : r.score,
          passed: isAbsent ? false : r.passed
        };
      }
      return r;
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setResults(prev => prev.map(r => 
      r.student_id === studentId ? { ...r, notes } : r
    ));
  };

  const handleSubmit = async () => {
    if (!selectedAssessmentId || !selectedClassId || !conductedAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId);
      const selectedClass = classes.find(c => c.id === selectedClassId);
      const institutionId = selectedClass?.institution_id || restrictToInstitutionId || '';

      let successCount = 0;
      for (const result of results) {
        const success = await assessmentService.createManualAttempt({
          assessment_id: selectedAssessmentId,
          student_id: result.student_id,
          class_id: selectedClassId,
          institution_id: institutionId,
          score: result.score,
          total_points: selectedAssessment?.total_points || 0,
          percentage: selectedAssessment?.total_points ? (result.score / selectedAssessment.total_points) * 100 : 0,
          passed: result.passed,
          conducted_at: new Date(conductedAt).toISOString(),
          manual_notes: result.notes || manualNotes || undefined,
          is_absent: result.is_absent
        });
        if (success) successCount++;
      }

      toast.success(`${successCount} manual assessment results recorded successfully`);
      
      // Reset form
      setSelectedAssessmentId('');
      setSelectedClassId('');
      setConductedAt('');
      setManualNotes('');
      setResults([]);
      
      onComplete?.();
    } catch (error) {
      console.error('Error saving manual results:', error);
      toast.error('Failed to save manual assessment results');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAssessment = assessments.find(a => a.id === selectedAssessmentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Manual Assessment Entry
          </CardTitle>
          <CardDescription>
            Record results for offline or paper-based assessments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assessment">Assessment *</Label>
              <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.title} ({a.total_points} points)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.class_name} {c.section && `- ${c.section}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conductedAt">Date Conducted *</Label>
              <Input
                id="conductedAt"
                type="datetime-local"
                value={conductedAt}
                onChange={(e) => setConductedAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">General Notes</Label>
              <Input
                id="notes"
                placeholder="Optional notes for all entries"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
              />
            </div>
          </div>

          {selectedAssessment && (
            <div className="flex items-center gap-4 p-3 bg-muted rounded-lg text-sm">
              <span>Total Points: <strong>{selectedAssessment.total_points}</strong></span>
              <span>Pass Percentage: <strong>{selectedAssessment.pass_percentage}%</strong></span>
              <span>Pass Mark: <strong>{Math.ceil((selectedAssessment.pass_percentage / 100) * selectedAssessment.total_points)}</strong></span>
            </div>
          )}
        </CardContent>
      </Card>

      {students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Results ({students.length} students)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-24 text-center">Absent</TableHead>
                  <TableHead className="w-32">Score</TableHead>
                  <TableHead className="w-24 text-center">Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map(result => (
                  <TableRow key={result.student_id} className={result.is_absent ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">{result.student_name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={result.is_absent}
                        onCheckedChange={(checked) => handleAbsentChange(result.student_id, checked === true)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={selectedAssessment?.total_points || 100}
                        value={result.score}
                        onChange={(e) => handleScoreChange(result.student_id, Number(e.target.value))}
                        className="w-24"
                        disabled={result.is_absent}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      {result.is_absent ? (
                        <Badge variant="outline" className="bg-muted">Absent</Badge>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={result.passed}
                            onCheckedChange={(checked) => handlePassedChange(result.student_id, checked)}
                          />
                          <Badge variant={result.passed ? 'default' : 'secondary'}>
                            {result.passed ? 'Pass' : 'Fail'}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder={result.is_absent ? "Reason for absence" : "Individual notes"}
                        value={result.notes}
                        onChange={(e) => handleNotesChange(result.student_id, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-6">
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Manual Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
