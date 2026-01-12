import { useState, useMemo } from 'react';
import { useInstitutions } from '@/hooks/useInstitutions';
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
import { Search, Download, ArrowUpDown, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export function InstitutionIdTable() {
  const { institutions = [], isLoading } = useInstitutions();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'code' | 'name' | 'created_at'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredAndSorted = useMemo(() => {
    let result = institutions.filter(inst => 
      inst.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inst.type?.toLowerCase().includes(searchQuery.toLowerCase())
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
  }, [institutions, searchQuery, sortField, sortOrder]);

  const handleSort = (field: 'code' | 'name' | 'created_at') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const exportToCSV = () => {
    const headers = ['Institution Code', 'Name', 'Type', 'Status', 'Created'];
    const rows = filteredAndSorted.map(i => [
      i.code || 'N/A',
      i.name,
      i.type || 'N/A',
      i.subscription_status || 'active',
      i.created_at ? format(new Date(i.created_at), 'dd/MM/yyyy') : 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `institution-ids-${format(new Date(), 'yyyy-MM-dd')}.csv`;
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
            placeholder="Search by code, name, or type..."
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
        <Building2 className="h-4 w-4" />
        <span>{filteredAndSorted.length} institutions found</span>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('code')}
                >
                  Institution Code
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('name')}
                >
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => handleSort('created_at')}
                >
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No institutions found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((institution) => (
                <TableRow key={institution.id}>
                  <TableCell className="font-mono font-medium">
                    {institution.code || 'N/A'}
                  </TableCell>
                  <TableCell>{institution.name}</TableCell>
                  <TableCell className="capitalize">{institution.type || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={institution.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {institution.subscription_status || 'active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {institution.created_at 
                      ? format(new Date(institution.created_at), 'dd MMM yyyy')
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
