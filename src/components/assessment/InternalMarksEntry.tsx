import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Save, ArrowLeft, ClipboardEdit } from 'lucide-react';
import { useInternalMarks } from '@/hooks/useInternalMarks';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

interface InternalMarksEntryProps {
  classId: string;
  className: string;
  institutionId: string;
  academicYear?: string;
  onBack: () => void;
}

interface StudentMark {
  student_id: string;
  user_id: string | null;
  student_name: string;
  marks: number;
  notes: string;
  hasChanges: boolean;
}

export function InternalMarksEntry({
  classId,
  className,
  institutionId,
  academicYear = '2024-25',
  onBack,
}: InternalMarksEntryProps) {
  const { marks: existingMarks, isLoading: isLoadingMarks, saveBulkMarks, isSaving } = useInternalMarks(classId, academicYear);
  const [studentMarks, setStudentMarks] = useState<StudentMark[]>([]);

  // Fetch students for this class
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, user_id, student_name, email')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('student_name');

      if (error) throw error;
      return data || [];
    },
  });

  // Initialize student marks when data loads
  useEffect(() => {
    if (students) {
      const marksMap = new Map(existingMarks?.map(m => [m.student_id, m]) || []);
      
      setStudentMarks(
        students
          .filter(s => s.user_id) // Only show students with user_id (auth accounts)
          .map(student => {
            const existing = marksMap.get(student.user_id!);
            return {
              student_id: student.id,
              user_id: student.user_id,
              student_name: student.student_name,
              marks: existing?.marks_obtained ?? 0,
              notes: existing?.notes ?? '',
              hasChanges: false,
            };
          })
      );
    }
  }, [students, existingMarks]);

  const handleMarksChange = (studentId: string, value: string) => {
    const numValue = Math.min(100, Math.max(0, parseFloat(value) || 0));
    setStudentMarks(prev =>
      prev.map(s =>
        s.student_id === studentId
          ? { ...s, marks: numValue, hasChanges: true }
          : s
      )
    );
  };

  const handleNotesChange = (studentId: string, value: string) => {
    setStudentMarks(prev =>
      prev.map(s =>
        s.student_id === studentId
          ? { ...s, notes: value, hasChanges: true }
          : s
      )
    );
  };

  const handleSaveAll = () => {
    const changedMarks = studentMarks.filter(s => s.hasChanges && s.user_id);
    if (changedMarks.length === 0) {
      toast.info('No changes to save');
      return;
    }

    saveBulkMarks(
      changedMarks.map(s => ({
        class_id: classId,
        institution_id: institutionId,
        student_id: s.user_id!, // Use user_id (profiles.id) for the foreign key
        marks_obtained: s.marks,
        total_marks: 100,
        academic_year: academicYear,
        notes: s.notes || undefined,
      }))
    );

    // Reset change flags
    setStudentMarks(prev => prev.map(s => ({ ...s, hasChanges: false })));
  };

  const isLoading = isLoadingMarks || isLoadingStudents;
  const hasChanges = studentMarks.some(s => s.hasChanges);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Internal Assessment Marks</h2>
            <p className="text-muted-foreground">{className} - {academicYear}</p>
          </div>
        </div>
        <Button onClick={handleSaveAll} disabled={isSaving || !hasChanges}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardEdit className="h-5 w-5" />
            Enter Internal Marks
          </CardTitle>
          <CardDescription>
            Internal assessment contributes 20% to the overall weighted score.
            Enter marks out of 100 for each student.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {studentMarks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No students with active accounts found in this class.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[120px]">Marks (0-100)</TableHead>
                  <TableHead className="w-[200px]">Notes</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentMarks.map((student, index) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={student.marks}
                        onChange={(e) => handleMarksChange(student.student_id, e.target.value)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        placeholder="Optional notes..."
                        value={student.notes}
                        onChange={(e) => handleNotesChange(student.student_id, e.target.value)}
                        className="min-h-[40px] resize-none"
                        rows={1}
                      />
                    </TableCell>
                    <TableCell>
                      {student.hasChanges ? (
                        <Badge variant="outline" className="bg-muted text-muted-foreground">
                          Unsaved
                        </Badge>
                      ) : student.marks > 0 ? (
                        <Badge variant="default">Saved</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
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
