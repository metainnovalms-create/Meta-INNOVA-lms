import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  student_name: string;
  student_id: string;
  class_id: string | null;
  class?: {
    class_name: string;
  } | null;
}

interface ProjectStudentSelectorProps {
  institutionId: string;
  selectedStudents: string[];
  onChange: (studentIds: string[]) => void;
  excludeStudentIds?: string[];
}

export function ProjectStudentSelector({
  institutionId,
  selectedStudents,
  onChange,
  excludeStudentIds = [],
}: ProjectStudentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_name,
          student_id,
          class_id,
          class:classes(class_name)
        `)
        .eq('institution_id', institutionId)
        .eq('status', 'active')
        .order('student_name');
      
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!institutionId,
  });

  const filteredStudents = students.filter(student => {
    if (excludeStudentIds.includes(student.id)) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      student.student_name.toLowerCase().includes(query) ||
      student.student_id.toLowerCase().includes(query) ||
      student.class?.class_name?.toLowerCase().includes(query)
    );
  });

  const handleToggle = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      onChange(selectedStudents.filter(id => id !== studentId));
    } else {
      onChange([...selectedStudents, studentId]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredStudents.map(s => s.id);
    const allSelected = allFilteredIds.every(id => selectedStudents.includes(id));
    
    if (allSelected) {
      onChange(selectedStudents.filter(id => !allFilteredIds.includes(id)));
    } else {
      onChange([...new Set([...selectedStudents, ...allFilteredIds])]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {selectedStudents.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{selectedStudents.length} selected</Badge>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      <ScrollArea className="h-64 border rounded-md p-2">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No students found</div>
        ) : (
          <div className="space-y-1">
            {filteredStudents.length > 1 && (
              <div
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer border-b mb-2 hover:bg-muted/50"
                onClick={handleSelectAll}
              >
                <Checkbox
                  checked={filteredStudents.every(s => selectedStudents.includes(s.id))}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="cursor-pointer text-sm font-medium">
                  Select All ({filteredStudents.length})
                </Label>
              </div>
            )}
            {filteredStudents.map((student) => {
              const isSelected = selectedStudents.includes(student.id);
              return (
                <div
                  key={student.id}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                  onClick={() => handleToggle(student.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggle(student.id)}
                    className="pointer-events-none"
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{student.student_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {student.student_id}
                        {student.class?.class_name && ` • ${student.class.class_name}`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
