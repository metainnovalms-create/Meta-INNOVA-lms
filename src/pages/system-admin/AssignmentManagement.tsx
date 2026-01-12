import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Pencil, Trash2, FileText, Calendar, Clock, Eye, Users } from 'lucide-react';
import { assignmentService, AssignmentWithClasses, AssignmentFormData } from '@/services/assignment.service';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AssignmentFormDialog } from '@/components/assignments/AssignmentFormDialog';
import { AssignmentSubmissionsDialog } from '@/components/assignments/AssignmentSubmissionsDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AssignmentManagement() {
  const [assignments, setAssignments] = useState<AssignmentWithClasses[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithClasses | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await assignmentService.getAllAssignments();
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedAssignment(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (assignment: AssignmentWithClasses) => {
    setSelectedAssignment(assignment);
    setFormDialogOpen(true);
  };

  const handleDelete = (assignment: AssignmentWithClasses) => {
    setSelectedAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  const handleViewSubmissions = (assignment: AssignmentWithClasses) => {
    setSelectedAssignment(assignment);
    setSubmissionsDialogOpen(true);
  };

  const handleSubmit = async (data: AssignmentFormData) => {
    try {
      if (selectedAssignment) {
        await assignmentService.updateAssignment(selectedAssignment.id, data);
        toast.success('Assignment updated successfully');
      } else {
        await assignmentService.createAssignment(data);
        toast.success('Assignment created successfully');
      }
      loadAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!selectedAssignment) return;
    try {
      await assignmentService.deleteAssignment(selectedAssignment.id);
      toast.success('Assignment deleted successfully');
      setDeleteDialogOpen(false);
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const filteredAssignments = assignments.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/10 text-green-700">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assignment Management</h1>
            <p className="text-muted-foreground">Create and manage assignments for all institutions</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid gap-4">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No assignments found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAssignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {assignment.title}
                          {getStatusBadge(assignment.status)}
                          {!assignment.allow_resubmit && (
                            <Badge variant="outline" className="text-xs">No Resubmit</Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {assignment.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewSubmissions(assignment)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Submissions
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(assignment)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(assignment)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Start: {format(new Date(assignment.start_date), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Due: {format(new Date(assignment.submission_end_date), 'MMM d, yyyy')}
                    </div>
                    <div className="text-muted-foreground">
                      Total Marks: {assignment.total_marks}
                    </div>
                    <div className="text-muted-foreground">
                      Classes: {assignment.classes.length}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <AssignmentFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        assignment={selectedAssignment}
        onSubmit={handleSubmit}
      />

      <AssignmentSubmissionsDialog
        open={submissionsDialogOpen}
        onOpenChange={setSubmissionsDialogOpen}
        assignment={selectedAssignment}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAssignment?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
