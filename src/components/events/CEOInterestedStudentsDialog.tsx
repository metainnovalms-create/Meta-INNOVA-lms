import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllEventInterests, useEvent } from '@/hooks/useEvents';
import { Search, Download, Users, Loader2, Mail, Building } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface CEOInterestedStudentsDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CEOInterestedStudentsDialog({ 
  eventId, 
  open, 
  onOpenChange 
}: CEOInterestedStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const { toast } = useToast();
  
  const { data: event } = useEvent(eventId);
  const { data: interests, isLoading } = useAllEventInterests(eventId);

  // Get unique institutions for filter
  const uniqueInstitutions = [...new Set((interests || [])
    .filter(i => i.institution_name)
    .map(i => i.institution_name))] as string[];

  const filteredInterests = (interests || []).filter(interest => {
    const matchesSearch = 
      (interest.student_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (interest.class_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (interest.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (interest.institution_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesInstitution = institutionFilter === 'all' || 
      interest.institution_name === institutionFilter;
    
    return matchesSearch && matchesInstitution;
  });

  const handleExport = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Institution', 'Class', 'Registered At'].join(','),
      ...filteredInterests.map(i => [
        i.student_name || 'N/A',
        i.email || 'N/A',
        i.institution_name || 'N/A',
        i.class_name || 'N/A',
        format(new Date(i.registered_at), 'yyyy-MM-dd HH:mm')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-interested-students-${event?.title || 'event'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Exported ${filteredInterests.length} student records.`,
    });
  };

  // Group interests by institution for stats
  const institutionStats = (interests || []).reduce((acc, interest) => {
    const key = interest.institution_name || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            All Interested Students
          </DialogTitle>
          <DialogDescription>
            Students across all institutions who expressed interest in "{event?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{interests?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold">{Object.keys(institutionStats).length}</div>
              <div className="text-sm text-muted-foreground">Institutions</div>
            </div>
          </div>

          {/* Institution breakdown */}
          {Object.keys(institutionStats).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(institutionStats).map(([name, count]) => (
                <Badge key={name} variant="secondary" className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {name}: {count}
                </Badge>
              ))}
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, class, or institution..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by institution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Institutions</SelectItem>
                {uniqueInstitutions.map((inst) => (
                  <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExport} disabled={filteredInterests.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Registered At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {(interests?.length || 0) === 0 
                          ? 'No students have expressed interest yet.' 
                          : 'No students match your filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInterests.map((interest) => (
                      <TableRow key={interest.id}>
                        <TableCell className="font-medium">{interest.student_name || 'Unknown'}</TableCell>
                        <TableCell>
                          {interest.email ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {interest.email}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {interest.institution_name ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              {interest.institution_name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {interest.class_name ? (
                            <Badge variant="outline">{interest.class_name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(interest.registered_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}