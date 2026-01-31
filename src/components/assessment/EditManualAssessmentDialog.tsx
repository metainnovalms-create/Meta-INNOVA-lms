import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Assessment } from '@/types/assessment';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface EditManualAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: Assessment | null;
  onSaved: () => void;
}

interface StudentAttempt {
  id: string;
  student_id: string;
  student_name: string;
  score: number;
  passed: boolean;
  notes: string;
  is_absent: boolean;
}

interface Institution {
  id: string;
  name: string;
}

interface ClassInfo {
  id: string;
  class_name: string;
  institution_id: string;
}

export function EditManualAssessmentDialog({ 
  open, 
  onOpenChange, 
  assessment, 
  onSaved 
}: EditManualAssessmentDialogProps) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [passPercentage, setPassPercentage] = useState(70);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [conductedAt, setConductedAt] = useState('');
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>([]);

  useEffect(() => {
    if (open && assessment) {
      loadData();
    }
  }, [open, assessment]);

  const loadData = async () => {
    if (!assessment) return;

    setIsLoading(true);

    try {
      // Load institutions
      const { data: institutionsData } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('status', 'active');
      setInstitutions(institutionsData || []);

      // Set form values from assessment
      setTitle(assessment.title);
      setTotalMarks(assessment.total_points);
      setPassPercentage(assessment.pass_percentage);

      // Get the class assignment for this assessment
      const { data: assignmentData } = await supabase
        .from('assessment_class_assignments')
        .select('institution_id, class_id')
        .eq('assessment_id', assessment.id)
        .maybeSingle();

      if (assignmentData) {
        setSelectedInstitutionId(assignmentData.institution_id);
        setSelectedClassId(assignmentData.class_id);

        // Load classes for selected institution
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, class_name, institution_id')
          .eq('institution_id', assignmentData.institution_id);
        setClasses(classesData || []);
      } else if (assessment.institution_id) {
        setSelectedInstitutionId(assessment.institution_id);
        
        const { data: classesData } = await supabase
          .from('classes')
          .select('id, class_name, institution_id')
          .eq('institution_id', assessment.institution_id);
        setClasses(classesData || []);
      }

      // Extract conducted date from start_time
      const startDate = new Date(assessment.start_time);
      setConductedAt(startDate.toISOString().slice(0, 10));

      // Get class ID from assignment
      const classId = assignmentData?.class_id || selectedClassId;

      // Load existing attempts with student names
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('assessment_attempts')
        .select(`
          id,
          student_id,
          score,
          passed,
          manual_notes,
          status
        `)
        .eq('assessment_id', assessment.id);

      console.log('Attempts loaded:', attemptsData, 'Error:', attemptsError);

      if (attemptsData && attemptsData.length > 0) {
        // Get student names from profiles
        const studentIds = attemptsData.map(a => a.student_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', studentIds);

        const profileMap = new Map(profilesData?.map(p => [p.id, p.name]) || []);

        setStudentAttempts(attemptsData.map(attempt => ({
          id: attempt.id,
          student_id: attempt.student_id,
          student_name: profileMap.get(attempt.student_id) || 'Unknown Student',
          score: attempt.score,
          passed: attempt.passed,
          notes: attempt.manual_notes || '',
          is_absent: attempt.status === 'absent'
        })));
      } else if (classId) {
        // No existing attempts - load students from class to allow entering scores
        const { data: studentsData } = await supabase
          .from('students')
          .select('id, student_name, user_id')
          .eq('class_id', classId)
          .eq('status', 'active');

        if (studentsData && studentsData.length > 0) {
          // These students don't have attempts yet - we'll need to create them on save
          setStudentAttempts(studentsData.map(student => ({
            id: `new-${student.user_id || student.id}`, // Mark as new
            student_id: student.user_id || student.id,
            student_name: student.student_name,
            score: 0,
            passed: false,
            notes: '',
            is_absent: false
          })));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load assessment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstitutionChange = async (institutionId: string) => {
    setSelectedInstitutionId(institutionId);
    setSelectedClassId('');

    const { data: classesData } = await supabase
      .from('classes')
      .select('id, class_name, institution_id')
      .eq('institution_id', institutionId);
    setClasses(classesData || []);
  };

  const handleScoreChange = (attemptId: string, score: number) => {
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const passed = percentage >= passPercentage;

    setStudentAttempts(prev => prev.map(a => 
      a.id === attemptId ? { ...a, score, passed } : a
    ));
  };

  const handlePassedChange = (attemptId: string, passed: boolean) => {
    setStudentAttempts(prev => prev.map(a => 
      a.id === attemptId ? { ...a, passed } : a
    ));
  };

  const handleNotesChange = (attemptId: string, notes: string) => {
    setStudentAttempts(prev => prev.map(a => 
      a.id === attemptId ? { ...a, notes } : a
    ));
  };

  const handleAbsentChange = (attemptId: string, isAbsent: boolean) => {
    setStudentAttempts(prev => prev.map(a => {
      if (a.id === attemptId) {
        return { 
          ...a, 
          is_absent: isAbsent,
          score: isAbsent ? 0 : a.score,
          passed: isAbsent ? false : a.passed
        };
      }
      return a;
    }));
  };

  const handleSave = async () => {
    if (!assessment) return;

    if (!title.trim()) {
      toast.error('Please enter an assessment title');
      return;
    }

    setIsSaving(true);

    try {
      // Create proper ISO timestamps
      const conductedDate = new Date(conductedAt);
      const startTime = new Date(conductedDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(conductedDate);
      endTime.setHours(23, 59, 59, 999);

      // Update assessment
      const { error: assessmentError } = await supabase
        .from('assessments')
        .update({
          title,
          total_points: totalMarks,
          pass_percentage: passPercentage,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          description: `Manual assessment conducted on ${conductedAt}`,
          institution_id: selectedInstitutionId || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', assessment.id);

      if (assessmentError) {
        throw assessmentError;
      }

      // Update class assignment if changed
      if (selectedClassId && selectedInstitutionId) {
        // Delete existing assignment
        await supabase
          .from('assessment_class_assignments')
          .delete()
          .eq('assessment_id', assessment.id);

        // Create new assignment
        const { error: assignmentError } = await supabase
          .from('assessment_class_assignments')
          .insert({
            assessment_id: assessment.id,
            institution_id: selectedInstitutionId,
            class_id: selectedClassId
          });

        if (assignmentError) {
          console.error('Class assignment error:', assignmentError);
        }
      }

      // Update or create student attempts
      for (const attempt of studentAttempts) {
        const percentage = totalMarks > 0 ? (attempt.score / totalMarks) * 100 : 0;

        if (attempt.id.startsWith('new-')) {
          // Create new attempt for this student
          const { error: insertError } = await supabase
            .from('assessment_attempts')
            .insert({
              assessment_id: assessment.id,
              student_id: attempt.student_id,
              institution_id: selectedInstitutionId,
              class_id: selectedClassId,
              score: attempt.score,
              total_points: totalMarks,
              percentage,
              passed: attempt.passed,
              manual_notes: attempt.notes,
              status: attempt.is_absent ? 'absent' : 'evaluated',
              is_manual: true,
              started_at: new Date().toISOString(),
              submitted_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`Error creating attempt for ${attempt.student_name}:`, insertError);
          }
        } else {
          // Update existing attempt
          const { error: attemptError } = await supabase
            .from('assessment_attempts')
            .update({
              score: attempt.score,
              total_points: totalMarks,
              percentage,
              passed: attempt.passed,
              manual_notes: attempt.notes,
              status: attempt.is_absent ? 'absent' : 'evaluated'
            })
            .eq('id', attempt.id);

          if (attemptError) {
            console.error(`Error updating attempt ${attempt.id}:`, attemptError);
          }
        }
      }

      toast.success('Manual assessment updated successfully');
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      toast.error(`Failed to save: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Manual Assessment</DialogTitle>
          <DialogDescription>
            Update assessment details and student marks
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Assessment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="edit-title">Assessment Title *</Label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-totalMarks">Total Marks *</Label>
                    <Input
                      id="edit-totalMarks"
                      type="number"
                      min={1}
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(parseInt(e.target.value) || 100)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-passPercentage">Pass Percentage *</Label>
                    <Input
                      id="edit-passPercentage"
                      type="number"
                      min={0}
                      max={100}
                      value={passPercentage}
                      onChange={(e) => setPassPercentage(parseInt(e.target.value) || 70)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-institution">Institution</Label>
                    <Select value={selectedInstitutionId} onValueChange={handleInstitutionChange}>
                      <SelectTrigger id="edit-institution">
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

                  <div className="space-y-2">
                    <Label htmlFor="edit-class">Class/Grade</Label>
                    <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                      <SelectTrigger id="edit-class">
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
                    <Label htmlFor="edit-date">Date Conducted *</Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={conductedAt}
                      onChange={(e) => setConductedAt(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Results */}
            {studentAttempts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Student Results</CardTitle>
                  <CardDescription>
                    Update scores (out of {totalMarks} marks). Pass mark: {passPercentage}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="w-24 text-center">Absent</TableHead>
                        <TableHead className="w-32">Score (/{totalMarks})</TableHead>
                        <TableHead className="w-24 text-center">Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentAttempts.map((attempt) => (
                        <TableRow key={attempt.id} className={attempt.is_absent ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{attempt.student_name}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={attempt.is_absent}
                              onCheckedChange={(checked) => handleAbsentChange(attempt.id, checked === true)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={totalMarks}
                              value={attempt.score}
                              onChange={(e) => handleScoreChange(attempt.id, parseInt(e.target.value) || 0)}
                              className="w-24"
                              disabled={attempt.is_absent}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {attempt.is_absent ? (
                              <Badge variant="outline" className="bg-muted">Absent</Badge>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <Switch
                                  checked={attempt.passed}
                                  onCheckedChange={(checked) => handlePassedChange(attempt.id, checked)}
                                />
                                <Badge variant={attempt.passed ? 'default' : 'secondary'}>
                                  {attempt.passed ? 'Pass' : 'Fail'}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              placeholder={attempt.is_absent ? "Reason for absence" : "Notes..."}
                              value={attempt.notes}
                              onChange={(e) => handleNotesChange(attempt.id, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
