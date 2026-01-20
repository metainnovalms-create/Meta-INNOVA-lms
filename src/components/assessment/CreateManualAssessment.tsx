import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { assessmentService } from '@/services/assessment.service';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

interface CreateManualAssessmentProps {
  restrictToInstitutionId?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

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
}

interface Institution {
  id: string;
  name: string;
}

export function CreateManualAssessment({ restrictToInstitutionId, onComplete, onCancel }: CreateManualAssessmentProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [classes, setClasses] = useState<{ id: string; class_name: string; institution_id: string }[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New assessment fields
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [passPercentage, setPassPercentage] = useState(70);
  
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(restrictToInstitutionId || '');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [conductedAt, setConductedAt] = useState(new Date().toISOString().slice(0, 10));
  const [manualNotes, setManualNotes] = useState('');
  const [results, setResults] = useState<ManualResult[]>([]);

  useEffect(() => {
    loadData();
  }, [restrictToInstitutionId]);

  useEffect(() => {
    if (selectedInstitutionId) {
      loadClasses(selectedInstitutionId);
    }
  }, [selectedInstitutionId]);

  useEffect(() => {
    if (selectedClassId) {
      loadStudents(selectedClassId);
    }
  }, [selectedClassId]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Load institutions (only if not restricted)
    if (!restrictToInstitutionId) {
      const { data: institutionsData } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('status', 'active');
      setInstitutions(institutionsData || []);
    }

    // Load classes if institution is pre-selected
    if (restrictToInstitutionId) {
      await loadClasses(restrictToInstitutionId);
    }

    setIsLoading(false);
  };

  const loadClasses = async (institutionId: string) => {
    const { data: classesData } = await supabase
      .from('classes')
      .select('id, class_name, institution_id')
      .eq('institution_id', institutionId);
    setClasses(classesData || []);
  };

  const loadStudents = async (classId: string) => {
    // Use the students table instead of profiles - officers have RLS access to students table
    const { data: studentsData, error } = await supabase
      .from('students')
      .select('id, student_name, email, user_id')
      .eq('class_id', classId)
      .eq('status', 'active');

    if (error) {
      console.error('Error loading students:', error);
    }

    const studentsList = (studentsData || []).map(s => ({
      id: s.user_id || s.id, // Use user_id for assessment attempts (profile id), fallback to student id
      name: s.student_name,
      email: s.email || ''
    }));
    
    setStudents(studentsList);

    // Initialize results
    setResults(studentsList.map(student => ({
      student_id: student.id,
      student_name: student.name,
      score: 0,
      passed: false,
      notes: ''
    })));
  };

  const handleScoreChange = (studentId: string, score: number) => {
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const passed = percentage >= passPercentage;

    setResults(results.map(r => 
      r.student_id === studentId ? { ...r, score, passed } : r
    ));
  };

  const handlePassedChange = (studentId: string, passed: boolean) => {
    setResults(results.map(r => 
      r.student_id === studentId ? { ...r, passed } : r
    ));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setResults(results.map(r => 
      r.student_id === studentId ? { ...r, notes } : r
    ));
  };

  const handleSubmit = async () => {
    if (!assessmentTitle.trim()) {
      toast.error('Please enter an assessment title');
      return;
    }
    if (!selectedClassId || !conductedAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    const institutionId = selectedInstitutionId || restrictToInstitutionId;
    if (!institutionId) {
      toast.error('Institution is required');
      return;
    }

    setIsSaving(true);

    try {
      // Get current user and their role
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in');
        setIsSaving(false);
        return;
      }

      // Determine user role for created_by_role
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      const createdByRole = userRoleData?.role || 'officer';
      
      // Create proper ISO timestamps (start of day and end of day for conducted date)
      const conductedDate = new Date(conductedAt);
      const startTime = new Date(conductedDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(conductedDate);
      endTime.setHours(23, 59, 59, 999);

      // 1. Create the manual assessment with valid status
      const { data: newAssessment, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          title: assessmentTitle,
          description: `Manual assessment conducted on ${conductedAt}`,
          status: 'published', // Valid status - 'completed' is UI-derived, not stored
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: 0,
          total_points: totalMarks,
          pass_percentage: passPercentage,
          auto_submit: false,
          auto_evaluate: false,
          shuffle_questions: false,
          show_results_immediately: false,
          allow_review_after_submission: false,
          created_by: user.id,
          created_by_role: createdByRole,
          institution_id: institutionId
        })
        .select()
        .single();

      if (assessmentError) {
        console.error('Assessment creation error:', assessmentError);
        toast.error(`Failed to create assessment: ${assessmentError.message}`);
        setIsSaving(false);
        return;
      }

      // 2. Create class assignment so assessment is visible to students/management
      const { error: assignmentError } = await supabase
        .from('assessment_class_assignments')
        .insert({
          assessment_id: newAssessment.id,
          institution_id: institutionId,
          class_id: selectedClassId,
          assigned_by: user.id
        });

      if (assignmentError) {
        console.error('Class assignment error:', assignmentError);
        // Continue anyway - assessment is created, just not assigned
      }

      // 3. Create manual attempts for each student
      let failedStudents: string[] = [];
      for (const result of results) {
        const percentage = totalMarks > 0 ? (result.score / totalMarks) * 100 : 0;
        
        const success = await assessmentService.createManualAttempt({
          assessment_id: newAssessment.id,
          student_id: result.student_id,
          class_id: selectedClassId,
          institution_id: institutionId,
          score: result.score,
          total_points: totalMarks,
          percentage,
          passed: result.passed,
          conducted_at: new Date(conductedAt).toISOString(),
          manual_notes: result.notes || manualNotes
        });

        if (!success) {
          failedStudents.push(result.student_name);
        }
      }

      if (failedStudents.length > 0) {
        toast.warning(`Assessment created but failed to save results for: ${failedStudents.join(', ')}`);
      } else {
        toast.success('Manual assessment created and results saved successfully');
      }
      
      onComplete?.();
    } catch (error: any) {
      console.error('Error saving manual assessment:', error);
      toast.error(`Failed to save assessment: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {onCancel && (
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold">Create Manual Assessment</h2>
          <p className="text-muted-foreground">Create a new offline assessment and record student results</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>Enter the assessment information and select the class</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Assessment Title *</Label>
              <Input
                id="title"
                placeholder="Enter assessment title (e.g., Mid-term Exam 2025)"
                value={assessmentTitle}
                onChange={(e) => setAssessmentTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                min={1}
                value={totalMarks}
                onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passPercentage">Pass Percentage *</Label>
              <Input
                id="passPercentage"
                type="number"
                min={0}
                max={100}
                value={passPercentage}
                onChange={(e) => setPassPercentage(parseInt(e.target.value) || 70)}
              />
            </div>

            {!restrictToInstitutionId && (
              <div className="space-y-2">
                <Label htmlFor="institution">Institution *</Label>
                <Select value={selectedInstitutionId} onValueChange={setSelectedInstitutionId}>
                  <SelectTrigger id="institution">
                    <SelectValue placeholder="Select institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="class">Class/Grade *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date Conducted *</Label>
              <Input
                id="date"
                type="date"
                value={conductedAt}
                onChange={(e) => setConductedAt(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">General Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this assessment..."
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClassId && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Student Results</CardTitle>
            <CardDescription>
              Enter scores for each student (out of {totalMarks} marks). Pass mark: {passPercentage}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-32">Score (/{totalMarks})</TableHead>
                  <TableHead className="w-24">Passed</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((result) => (
                  <TableRow key={result.student_id}>
                    <TableCell className="font-medium">{result.student_name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={totalMarks}
                        value={result.score}
                        onChange={(e) => handleScoreChange(result.student_id, parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={result.passed}
                        onCheckedChange={(checked) => handlePassedChange(result.student_id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Individual notes..."
                        value={result.notes}
                        onChange={(e) => handleNotesChange(result.student_id, e.target.value)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSubmit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Assessment...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create & Save Results
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedClassId && students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No students found in this class
          </CardContent>
        </Card>
      )}
    </div>
  );
}
