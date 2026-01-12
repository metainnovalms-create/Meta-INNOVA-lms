import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  CheckCircle2, 
  Loader2, 
  UserCheck,
  UserX
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useSessionCompletion } from '@/hooks/useSessionCompletion';

interface Student {
  id: string;
  student_name: string;
  student_id: string;
  avatar?: string;
  isCompleted?: boolean;
}

interface TeachingStudentPanelProps {
  classId: string;
  sessionId: string | null;
  classAssignmentId: string;
  onCompletionMarked?: () => void;
}

export function TeachingStudentPanel({
  classId,
  sessionId,
  classAssignmentId,
  onCompletionMarked
}: TeachingStudentPanelProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const { markSessionComplete, isLoading: isMarking } = useSessionCompletion();

  // Fetch students in this class
  const { data: students, isLoading: loadingStudents, refetch: refetchStudents } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_name, student_id, avatar, status')
        .eq('class_id', classId)
        .eq('status', 'active')
        .order('student_name');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch completion status for each student for current session
  const { data: completions, refetch: refetchCompletions } = useQuery({
    queryKey: ['student-session-completions', sessionId, classAssignmentId],
    queryFn: async () => {
      if (!sessionId || !classAssignmentId) return new Map<string, boolean>();

      // Get all content in this session
      const { data: contentItems } = await supabase
        .from('course_content')
        .select('id')
        .eq('session_id', sessionId);

      if (!contentItems || contentItems.length === 0) return new Map<string, boolean>();

      const contentIds = contentItems.map(c => c.id);
      const totalContentCount = contentIds.length;

      // Get completions
      const { data: completionData } = await supabase
        .from('student_content_completions')
        .select('student_id, content_id')
        .in('content_id', contentIds)
        .eq('class_assignment_id', classAssignmentId);

      // Calculate completion status per student
      const studentCompletions = new Map<string, boolean>();
      if (students) {
        for (const student of students) {
          const studentCompletedCount = completionData?.filter(
            c => c.student_id === student.id
          ).length || 0;
          studentCompletions.set(student.id, studentCompletedCount >= totalContentCount);
        }
      }

      return studentCompletions;
    },
    enabled: !!sessionId && !!classAssignmentId && !!students
  });

  const toggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const selectAll = () => {
    if (students) {
      // Only select students who haven't completed
      const incompleteStudents = students.filter(s => !completions?.get(s.id));
      setSelectedStudents(new Set(incompleteStudents.map(s => s.id)));
    }
  };

  const deselectAll = () => {
    setSelectedStudents(new Set());
  };

  const handleMarkComplete = async () => {
    if (!sessionId) return;
    
    const success = await markSessionComplete(
      sessionId,
      Array.from(selectedStudents),
      classAssignmentId,
      classId
    );

    if (success) {
      setSelectedStudents(new Set());
      refetchCompletions();
      onCompletionMarked?.();
    }
  };

  const completedCount = students?.filter(s => completions?.get(s.id)).length || 0;
  const totalCount = students?.length || 0;

  if (loadingStudents) {
    return (
      <Card className="w-72 shrink-0 border-l rounded-none">
        <CardContent className="flex items-center justify-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-72 shrink-0 border-l rounded-none flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4" />
          Students
        </CardTitle>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{completedCount}/{totalCount} completed</span>
          <Badge variant={completedCount === totalCount ? "default" : "secondary"}>
            {Math.round((completedCount / Math.max(totalCount, 1)) * 100)}%
          </Badge>
        </div>
      </CardHeader>

      <div className="p-3 border-b flex gap-2">
        <Button variant="outline" size="sm" onClick={selectAll} className="flex-1 text-xs">
          <UserCheck className="h-3 w-3 mr-1" />
          Select All
        </Button>
        <Button variant="outline" size="sm" onClick={deselectAll} className="flex-1 text-xs">
          <UserX className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {students?.map((student) => {
            const isCompleted = completions?.get(student.id) || false;
            const isSelected = selectedStudents.has(student.id);

            return (
              <div
                key={student.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'hover:bg-muted'
                } ${isCompleted ? 'opacity-60' : ''}`}
                onClick={() => !isCompleted && toggleStudent(student.id)}
              >
                <Checkbox
                  checked={isSelected || isCompleted}
                  disabled={isCompleted}
                  onCheckedChange={() => !isCompleted && toggleStudent(student.id)}
                />
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={student.avatar} />
                  <AvatarFallback className="text-xs">
                    {student.student_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{student.student_name}</p>
                  <p className="text-xs text-muted-foreground">{student.student_id}</p>
                </div>

                {isCompleted && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                )}
              </div>
            );
          })}

          {(!students || students.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No students in this class</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Mark Complete Button */}
      <div className="p-3 border-t">
        <Button
          className="w-full"
          onClick={handleMarkComplete}
          disabled={selectedStudents.size === 0 || isMarking || !sessionId}
        >
          {isMarking ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-2" />
          )}
          Mark Session Complete ({selectedStudents.size})
        </Button>
        {!sessionId && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Select a session to mark complete
          </p>
        )}
      </div>
    </Card>
  );
}
