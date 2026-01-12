import { useState, useMemo } from 'react';
import { useOfficers } from '@/hooks/useOfficers';
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
import { Search, Download, ArrowUpDown, Users } from 'lucide-react';
import { format } from 'date-fns';

export function EmployeeIdTable() {
  const { data: officers = [], isLoading } = useOfficers();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'employee_id' | 'full_name' | 'join_date'>('employee_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSorted = useMemo(() => {
    let result = officers.filter(officer => 
      officer.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      officer.department?.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [officers, searchQuery, sortField, sortOrder]);

  const handleSort = (field: 'employee_id' | 'full_name' | 'join_date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Status', 'Join Date'];
    const rows = filteredAndSorted.map(o => [
      o.employee_id || 'N/A',
      o.full_name,
      o.department || 'N/A',
      o.status,
      o.join_date ? format(new Date(o.join_date), 'dd/MM/yyyy') : 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-ids-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
            placeholder="Search by ID, name, or department..."
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
        <Users className="h-4 w-4" />
        <span>{filteredAndSorted.length} employees found</span>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('employee_id')}
                >
                  Employee ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('full_name')}
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('join_date')}
                >
                  Join Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((officer) => (
                <TableRow key={officer.id}>
                  <TableCell className="font-mono font-medium">
                    {officer.employee_id || 'N/A'}
                  </TableCell>
                  <TableCell>{officer.full_name}</TableCell>
                  <TableCell>{officer.department || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={officer.status === 'active' ? 'default' : 'secondary'}>
                      {officer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {officer.join_date 
                      ? format(new Date(officer.join_date), 'dd MMM yyyy')
                      : 'N/A'
                    }
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
