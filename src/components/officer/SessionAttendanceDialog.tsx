import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, CheckCircle2 } from 'lucide-react';
import { updateSessionAttendance, getSessionDelivery } from '@/utils/sessionHelpers';
import { mockStudents } from '@/data/mockStudentData';
import { toast } from 'sonner';

interface SessionAttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  className: string;
}

export function SessionAttendanceDialog({
  open,
  onOpenChange,
  sessionId,
  className,
}: SessionAttendanceDialogProps) {
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get students for this class
  const classStudents = mockStudents.filter(s => s.class === className);

  useEffect(() => {
    if (open && sessionId) {
      // Load existing attendance
      const session = getSessionDelivery(sessionId);
      if (session) {
        setSelectedStudents(new Set(session.students_present));
      }
    }
  }, [open, sessionId]);

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
  const filteredStudents = classStudents.filter(s => 
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );
    setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedStudents(new Set());
  };

  const handleSave = () => {
    if (!sessionId) return;

    updateSessionAttendance(
      sessionId,
      Array.from(selectedStudents),
      classStudents.length
    );

    const percentage = classStudents.length > 0 
      ? Math.round((selectedStudents.size / classStudents.length) * 100)
      : 0;

    toast.success(`Attendance recorded: ${selectedStudents.size}/${classStudents.length} students (${percentage}%)`);
    onOpenChange(false);
  };

  const filteredStudents = classStudents.filter(s => 
    s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const attendancePercentage = classStudents.length > 0 
    ? Math.round((selectedStudents.size / classStudents.length) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Record Attendance - {className}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold">{selectedStudents.size}/{classStudents.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold">{attendancePercentage}%</p>
              </div>
            </div>
            <Badge 
              variant={attendancePercentage >= 75 ? 'default' : 'destructive'}
              className="text-lg px-4 py-2"
            >
              {attendancePercentage >= 75 ? 'Good' : 'Low'}
            </Badge>
          </div>

          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Clear
            </Button>
          </div>

          {/* Student List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {filteredStudents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No students found
              </div>
            ) : (
              <div className="divide-y">
                {filteredStudents.map(student => {
                  const isPresent = selectedStudents.has(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleToggleStudent(student.id)}
                    >
                      <Checkbox
                        checked={isPresent}
                        onCheckedChange={() => handleToggleStudent(student.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{student.student_name}</p>
                        <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                      </div>
                      {isPresent && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
