import { useState, useEffect } from 'react';
import { CheckCircle2, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { mockEnrollments } from '@/data/mockCourseData';
import { getSessionDelivery, updateSessionAttendance } from '@/utils/sessionHelpers';
import { recordStudentCompletions } from '@/utils/studentCompletionHelpers';
import { toast } from 'sonner';

interface StudentEngagementPanelProps {
  courseId: string;
  contentId: string | null;
  sessionId?: string;
  className?: string;
  onAttendanceSaved?: () => void;
}

export function StudentEngagementPanel({ 
  courseId, 
  contentId, 
  sessionId,
  className,
  onAttendanceSaved 
}: StudentEngagementPanelProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Get enrolled students for this course
  const enrolledStudents = mockEnrollments.filter(e => e.course_id === courseId);

  // Filter students by search query
  const filteredStudents = enrolledStudents.filter(student =>
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load initial attendance from session
  useEffect(() => {
    if (sessionId) {
      const session = getSessionDelivery(sessionId);
      if (session && session.students_present.length > 0) {
        setSelectedStudents(new Set(session.students_present));
      }
    }
  }, [sessionId]);

  const handleSelectAll = () => {
    setSelectedStudents(new Set(filteredStudents.map(s => s.student_id)));
    setHasChanges(true);
  };

  const handleClearAll = () => {
    setSelectedStudents(new Set());
    setHasChanges(true);
  };

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setHasChanges(true);
  };

  const handleSaveAttendance = () => {
    if (!sessionId) {
      toast.error("No active session");
      return;
    }

    const session = getSessionDelivery(sessionId);
    if (!session) {
      toast.error("Session not found");
      return;
    }

    // Update students_present array
    const studentIds = Array.from(selectedStudents);
    updateSessionAttendance(
      sessionId, 
      studentIds,
      enrolledStudents.length
    );

    // If any content is already marked complete, re-record completions for new students
    if (session.content_completed.length > 0) {
      session.content_completed.forEach(completedContentId => {
        recordStudentCompletions(
          sessionId,
          completedContentId,
          session.current_module_id,
          session.course_id,
          session.officer_id,
          studentIds
        );
      });
    }

    toast.success(`Attendance saved: ${studentIds.length} students present`);
    setHasChanges(false);
    onAttendanceSaved?.();
  };

  return (
    <div className="w-80 border-l bg-muted/30 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Student Attendance</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Mark attendance for this session
        </p>
      </div>

      {/* Bulk Actions */}
      <div className="p-4 border-b space-y-3 bg-card">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="font-mono">
            {selectedStudents.size} / {enrolledStudents.length}
          </Badge>
          <span className="text-sm text-muted-foreground">present</span>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSelectAll}
            size="sm"
            className="flex-1"
          >
            Mark All Present
          </Button>
          <Button 
            onClick={handleClearAll}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b bg-card">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Student List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {searchQuery ? 'No students found' : 'No enrolled students'}
              </p>
            </div>
          ) : (
            filteredStudents.map(student => (
              <div
                key={student.student_id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => handleToggleStudent(student.student_id)}
              >
                <Checkbox
                  checked={selectedStudents.has(student.student_id)}
                  onCheckedChange={() => handleToggleStudent(student.student_id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {student.student_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{student.student_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {student.student_id}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Save Button */}
      <div className="p-4 border-t bg-card">
        <Button
          onClick={handleSaveAttendance}
          className="w-full"
          disabled={!hasChanges || !sessionId}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Save Attendance
        </Button>
        {!sessionId && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            No active session
          </p>
        )}
      </div>
    </div>
  );
}
