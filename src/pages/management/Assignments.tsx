import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, Search, Users, BarChart, Filter, Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { assignmentService, AssignmentWithClasses, AssignmentFormData } from '@/services/assignment.service';
import { format, isPast, isFuture } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ManagementAssignmentFormDialog } from '@/components/assignments/ManagementAssignmentFormDialog';
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

interface AssignmentWithClassesExtended extends AssignmentWithClasses {
  graded_count?: number;
}

export default function ManagementAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithClassesExtended[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [availableClasses, setAvailableClasses] = useState<{ id: string; name: string }[]>([]);
  const institutionId = user?.institution_id || user?.tenant_id;

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentWithClasses | null>(null);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithClasses | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<AssignmentWithClasses | null>(null);

  useEffect(() => {
    if (institutionId) {
      loadAssignments();
    }
  }, [institutionId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      // Use the service to get assignments for this institution
      const data = await assignmentService.getAssignmentsForInstitution(institutionId!);
      
      // Fetch graded counts
      const assignmentIds = data.map(a => a.id);
      let gradedCounts: Record<string, number> = {};
      
      if (assignmentIds.length > 0) {
        const { data: submissions } = await supabase
          .from('assignment_submissions')
          .select('assignment_id, status')
          .eq('institution_id', institutionId)
          .in('assignment_id', assignmentIds);
        
        if (submissions) {
          submissions.forEach(s => {
            if (s.status === 'graded') {
              gradedCounts[s.assignment_id] = (gradedCounts[s.assignment_id] || 0) + 1;
            }
          });
        }
      }

      // Extract unique classes
      const classesMap = new Map<string, { id: string; name: string }>();
      data.forEach(a => {
        a.classes.forEach(c => {
          classesMap.set(c.id, { id: c.id, name: c.class_name });
        });
      });
      setAvailableClasses(Array.from(classesMap.values()));

      // Add graded counts to assignments
      const assignmentsWithGraded = data.map(a => ({
        ...a,
        graded_count: gradedCounts[a.id] || 0
      }));

      setAssignments(assignmentsWithGraded);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (formData: AssignmentFormData, role: string) => {
    await assignmentService.createAssignment(formData, role);
    toast.success('Assignment created successfully');
    loadAssignments();
  };

  const handleUpdateAssignment = async (formData: AssignmentFormData) => {
    if (!editingAssignment) return;
    await assignmentService.updateAssignment(editingAssignment.id, formData);
    toast.success('Assignment updated successfully');
    setEditingAssignment(null);
    loadAssignments();
  };

  const handleDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    try {
      await assignmentService.deleteAssignment(deletingAssignment.id);
      toast.success('Assignment deleted successfully');
      setDeletingAssignment(null);
      setDeleteDialogOpen(false);
      loadAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const handleViewSubmissions = (assignment: AssignmentWithClasses) => {
    setSelectedAssignment(assignment);
    setSubmissionsDialogOpen(true);
  };

  const handleEditAssignment = (assignment: AssignmentWithClasses) => {
    setEditingAssignment(assignment);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (assignment: AssignmentWithClasses) => {
    setDeletingAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  const filteredAssignments = assignments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = selectedClass === 'all' || a.classes.some(c => c.id === selectedClass);
    return matchesSearch && matchesClass;
  });

  const getStatusBadge = (assignment: AssignmentWithClassesExtended) => {
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

  // Stats
  const activeCount = assignments.filter(a => {
    const now = new Date();
    return a.status === 'published' && 
           new Date(a.start_date) <= now && 
           new Date(a.submission_end_date) >= now;
  }).length;

  const completedCount = assignments.filter(a => 
    isPast(new Date(a.submission_end_date))
  ).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assignments Management</h1>
            <p className="text-muted-foreground">Create and manage assignments for your institution</p>
          </div>
          <Button onClick={() => { setEditingAssignment(null); setFormDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
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
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {availableClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery ? 'Try adjusting your search' : 'Create your first assignment to get started'}
              </p>
              {!searchQuery && (
                <Button onClick={() => { setEditingAssignment(null); setFormDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
              )}
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
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{assignment.submissions_count || 0} submissions ({assignment.graded_count || 0} graded)</span>
                  </div>
                  {assignment.total_marks && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BarChart className="h-4 w-4" />
                      <span>Total marks: {assignment.total_marks}</span>
                    </div>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewSubmissions(assignment)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Submissions
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditAssignment(assignment)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(assignment)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Assignment Dialog */}
      <ManagementAssignmentFormDialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          setFormDialogOpen(open);
          if (!open) setEditingAssignment(null);
        }}
        institutionId={institutionId || ''}
        assignment={editingAssignment}
        onSubmit={editingAssignment 
          ? async (data) => handleUpdateAssignment(data)
          : handleCreateAssignment
        }
      />

      {/* Submissions Dialog */}
      <AssignmentSubmissionsDialog
        open={submissionsDialogOpen}
        onOpenChange={setSubmissionsDialogOpen}
        assignment={selectedAssignment}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingAssignment?.title}"? This action cannot be undone and will also delete all submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAssignment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
