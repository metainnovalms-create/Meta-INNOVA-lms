import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useEventInterests, useEvent } from '@/hooks/useEvents';
import { Search, Download, Users, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface InterestedStudentsDialogProps {
  eventId: string;
  institutionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InterestedStudentsDialog({ 
  eventId, 
  institutionId, 
  open, 
  onOpenChange 
}: InterestedStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  
  const { data: event } = useEvent(eventId);
  const { data: interests, isLoading } = useEventInterests(eventId, institutionId);

  const filteredInterests = (interests || []).filter(interest =>
    (interest.student_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (interest.class_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (interest.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = [
      ['Student Name', 'Email', 'Class', 'Student ID', 'Registered At'].join(','),
      ...filteredInterests.map(i => [
        i.student_name || 'N/A',
        i.email || 'N/A',
        i.class_name || 'N/A',
        i.student_id,
        format(new Date(i.registered_at), 'yyyy-MM-dd HH:mm')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interested-students-${event?.title || 'event'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Exported ${filteredInterests.length} student records.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Interested Students
          </DialogTitle>
          <DialogDescription>
            Students from your institution who expressed interest in "{event?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="text-2xl font-bold">{interests?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Total Interested</div>
            </div>
          </div>

          {/* Search and Export */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" onClick={handleExport} disabled={filteredInterests.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
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
                    <TableHead>Class</TableHead>
                    <TableHead>Registered At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {(interests?.length || 0) === 0 
                          ? 'No students have expressed interest yet.' 
                          : 'No students match your search.'}
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