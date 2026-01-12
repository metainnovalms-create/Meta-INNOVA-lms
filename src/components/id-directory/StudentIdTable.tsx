import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, ArrowUpDown, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

interface StudentWithDetails {
  id: string;
  roll_number: string | null;
  admission_number: string | null;
  student_name: string;
  class_name: string | null;
  section: string | null;
  institution_name: string | null;
  status: string | null;
  created_at: string | null;
}

export function StudentIdTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'roll_number' | 'student_name' | 'created_at'>('roll_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students-directory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          roll_number,
          admission_number,
          student_name,
          status,
          created_at,
          classes:class_id (
            class_name,
            section
          ),
          institutions:institution_id (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        roll_number: s.roll_number,
        admission_number: s.admission_number,
        student_name: s.student_name,
        class_name: s.classes?.class_name || null,
        section: s.classes?.section || null,
        institution_name: s.institutions?.name || null,
        status: s.status,
        created_at: s.created_at,
      })) as StudentWithDetails[];
    },
  });

  const filteredAndSorted = useMemo(() => {
    let result = students.filter(student => 
      student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.admission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.institution_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      if (sortOrder === 'asc') {
        return String(aVal).localeCompare(String(bVal));
      }
      return String(bVal).localeCompare(String(aVal));
    });

    return result;
  }, [students, searchQuery, sortField, sortOrder]);

  const handleSort = (field: 'roll_number' | 'student_name' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Roll Number', 'Admission No', 'Name', 'Class', 'Institution'];
    const rows = filteredAndSorted.map(s => [
      s.roll_number || 'N/A',
      s.admission_number || 'N/A',
      s.student_name,
      s.class_name ? `${s.class_name}${s.section ? `-${s.section}` : ''}` : 'N/A',
      s.institution_name || 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-ids-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by roll number, admission no, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <GraduationCap className="h-4 w-4" />
        <span>{filteredAndSorted.length} students found</span>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('roll_number')}
                >
                  Roll Number
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('student_name')}
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Institution</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono font-medium">
                    {student.roll_number || 'N/A'}
                  </TableCell>
                  <TableCell className="font-mono">
                    {student.admission_number || 'N/A'}
                  </TableCell>
                  <TableCell>{student.student_name}</TableCell>
                  <TableCell>
                    {student.class_name 
                      ? `${student.class_name}${student.section ? `-${student.section}` : ''}`
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{student.institution_name || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
