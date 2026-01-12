import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Download, Users, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ClassStudentsListProps {
  classId: string;
  className: string;
}

export function ClassStudentsList({ classId, className }: ClassStudentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch students for this class from Supabase
  const { data: students, isLoading } = useQuery({
    queryKey: ['class-students', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('roll_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Filter by search
  const filteredStudents = (students || []).filter(student =>
    student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    if (!filteredStudents.length) return;
    
    // Create CSV content
    const headers = ['Roll No.', 'Name', 'Email', 'Status'];
    const rows = filteredStudents.map(s => [
      s.roll_number || '',
      s.student_name,
      s.email || '',
      s.status || 'active'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${className}_students.csv`;
    link.click();
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Students in {className}</h2>
          <p className="text-muted-foreground mt-1">
            {students?.length || 0} students enrolled
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!filteredStudents.length}>
          <Download className="h-4 w-4 mr-2" />
          Export List
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Roster</CardTitle>
              <CardDescription>View and manage students in this class</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No students found matching your search' : 'No students in this class yet'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Roll No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.roll_number || '-'}</TableCell>
                    <TableCell>{student.student_name}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email || '-'}</TableCell>
                    <TableCell className="capitalize">{student.gender || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status || 'active'}
                      </Badge>
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