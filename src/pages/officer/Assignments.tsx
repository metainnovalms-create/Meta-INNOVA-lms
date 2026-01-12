import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Calendar, Clock, Search, Users, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { assignmentService, AssignmentWithClasses } from '@/services/assignment.service';
import { format, isPast, isFuture } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { AssignmentSubmissionsDialog } from '@/components/assignments/AssignmentSubmissionsDialog';

export default function OfficerAssignments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssignmentWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithClasses | null>(null);

  useEffect(() => {
    if (user?.institution_id) {
      loadAssignments();
    }
  }, [user?.institution_id]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAssignments(user?.institution_id);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (assignment: AssignmentWithClasses) => {
    if (assignment.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    const now = new Date();
    const start = new Date(assignment.start_date);
    const end = new Date(assignment.submission_end_date);
    
    if (isFuture(start)) {
      return <Badge variant="outline">Upcoming</Badge>;
    } else if (isPast(end)) {
      return <Badge variant="destructive">Ended</Badge>;
    } else {
      return <Badge className="bg-green-500">Active</Badge>;
    }
  };

  const handleViewSubmissions = (assignment: AssignmentWithClasses) => {
    setSelectedAssignment(assignment);
    setSubmissionsDialogOpen(true);
  };
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground">View and manage class assignments</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No assignments found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery ? 'Try adjusting your search' : 'No assignments are available yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                    {getStatusBadge(assignment)}
                  </div>
                  {assignment.description && (
                    <CardDescription className="line-clamp-2">
                      {assignment.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {format(new Date(assignment.submission_end_date), 'PPP')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{assignment.classes?.length || 0} classes assigned</span>
                  </div>
                  {assignment.total_marks && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Total marks: {assignment.total_marks}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleViewSubmissions(assignment)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Submissions
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AssignmentSubmissionsDialog
          open={submissionsDialogOpen}
          onOpenChange={setSubmissionsDialogOpen}
          assignment={selectedAssignment}
        />
      </div>
    </Layout>
  );
}
