import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { InstitutionClass } from '@/types/institution';
import { AssignCourseToClassDialog } from './AssignCourseToClassDialog';
import { 
  useClassCourseAssignments, 
  useRemoveCourseFromClass, 
  useToggleModuleUnlock, 
  useToggleSessionUnlock,
  ClassCourseAssignmentWithDetails 
} from '@/hooks/useClassCourseAssignments';
import { BookOpen, Plus, Lock, Unlock, MoreHorizontal, Trash2, ChevronDown, ChevronRight, Loader2, Link2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ClassCoursesTabProps {
  classId: string;
  classData: InstitutionClass;
  courseAssignments?: any[]; // Legacy prop, not used
  onAssignCourse: (assignment: any) => Promise<void>;
  onUpdateAssignment?: (assignmentId: string, data: any) => Promise<void>;
  onRemoveAssignment?: (assignmentId: string) => Promise<void>;
  onUnlockModule?: (assignmentId: string, moduleId: string) => Promise<void>;
}

export function ClassCoursesTab({
  classId,
  classData,
  onAssignCourse,
}: ClassCoursesTabProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<ClassCourseAssignmentWithDetails | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const { data: assignments = [], isLoading } = useClassCourseAssignments(classId);
  const removeCourse = useRemoveCourseFromClass();
  const toggleModuleUnlock = useToggleModuleUnlock();
  const toggleSessionUnlock = useToggleSessionUnlock();

  const handleAssignCourse = async (assignment: any) => {
    await onAssignCourse(assignment);
    setShowAssignDialog(false);
  };

  const handleDeleteAssignment = async () => {
    if (assignmentToDelete) {
      await removeCourse.mutateAsync({ 
        assignmentId: assignmentToDelete.id, 
        classId 
      });
      setAssignmentToDelete(null);
    }
  };

  const handleModuleUnlockToggle = async (moduleAssignmentId: string, currentStatus: boolean) => {
    await toggleModuleUnlock.mutateAsync({
      moduleAssignmentId,
      isUnlocked: !currentStatus,
      classId,
    });
  };

  const handleSessionUnlockToggle = async (sessionAssignmentId: string, currentStatus: boolean) => {
    await toggleSessionUnlock.mutateAsync({
      sessionAssignmentId,
      isUnlocked: !currentStatus,
      classId,
    });
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Assignments</CardTitle>
                <CardDescription>
                  Manage courses and levels assigned to {classData.class_name}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAssignDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Course
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const totalModules = assignment.module_assignments?.length || 0;
                  const unlockedModules = assignment.module_assignments?.filter(m => m.is_unlocked).length || 0;

                  return (
                    <Card key={assignment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{assignment.course?.title}</h3>
                                <Badge variant="secondary" className="capitalize">
                                  {assignment.course?.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {assignment.course?.course_code}
                              </p>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  {totalModules} levels assigned
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">
                                  {unlockedModules} unlocked
                                </span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setAssignmentToDelete(assignment)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Assignment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Level List */}
                        {assignment.module_assignments?.map((moduleAssignment) => (
                          <Collapsible 
                            key={moduleAssignment.id}
                            open={expandedModules.has(moduleAssignment.id)}
                            onOpenChange={() => toggleModuleExpand(moduleAssignment.id)}
                          >
                            <div className="border rounded-lg">
                              <div className="flex items-center justify-between p-3">
                                <div className="flex items-center gap-3">
                                  <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                      {expandedModules.has(moduleAssignment.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <div className="flex-shrink-0">
                                    {moduleAssignment.is_unlocked ? (
                                      <Unlock className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <Lock className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <span className="font-medium text-sm">
                                      {moduleAssignment.module?.title}
                                    </span>
                                    <p className="text-xs text-muted-foreground">
                                      {moduleAssignment.session_assignments?.length || 0} sessions
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {(moduleAssignment as any).unlock_mode === 'sequential' ? (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Link2 className="h-3 w-3" />
                                      Sequential
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      {moduleAssignment.is_unlocked ? 'Unlocked' : 'Locked'}
                                    </span>
                                  )}
                                  <Switch
                                    checked={moduleAssignment.is_unlocked}
                                    onCheckedChange={() => handleModuleUnlockToggle(
                                      moduleAssignment.id, 
                                      moduleAssignment.is_unlocked
                                    )}
                                    disabled={toggleModuleUnlock.isPending}
                                  />
                                </div>
                              </div>

                              <CollapsibleContent>
                                <div className="border-t px-3 py-2 space-y-2 bg-muted/30">
                                  {moduleAssignment.session_assignments?.map((sessionAssignment) => (
                                    <div 
                                      key={sessionAssignment.id}
                                      className="flex items-center justify-between p-2 rounded border bg-background"
                                    >
                                      <div className="flex items-center gap-2">
                                        {sessionAssignment.is_unlocked ? (
                                          <Unlock className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <Lock className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm">
                                          {sessionAssignment.session?.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {(sessionAssignment as any).unlock_mode === 'sequential' ? (
                                          <Badge variant="outline" className="text-xs gap-1">
                                            <Link2 className="h-3 w-3" />
                                            Sequential
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            {sessionAssignment.is_unlocked ? 'Unlocked' : 'Locked'}
                                          </span>
                                        )}
                                        <Switch
                                          checked={sessionAssignment.is_unlocked}
                                          onCheckedChange={() => handleSessionUnlockToggle(
                                            sessionAssignment.id, 
                                            sessionAssignment.is_unlocked
                                          )}
                                          disabled={toggleSessionUnlock.isPending}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                  {(!moduleAssignment.session_assignments || moduleAssignment.session_assignments.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      No sessions assigned
                                    </p>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                        {(!assignment.module_assignments || assignment.module_assignments.length === 0) && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No levels assigned to this course
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No courses assigned to this class yet
                </p>
                <Button onClick={() => setShowAssignDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign First Course
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AssignCourseToClassDialog
        isOpen={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        classData={classData}
        onAssignCourse={handleAssignCourse}
      />

      <AlertDialog open={!!assignmentToDelete} onOpenChange={() => setAssignmentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Course Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {assignmentToDelete?.course?.title} from {classData.class_name}? Students will lose access to this course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAssignment}
              disabled={removeCourse.isPending}
            >
              {removeCourse.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
