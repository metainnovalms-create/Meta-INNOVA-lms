import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, CheckCircle, BookOpen, Lock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ThumbnailImage } from '@/components/officer/ThumbnailImage';

interface ClassCourseLauncherProps {
  classId: string;
  className: string;
  officerId: string;
}

export function ClassCourseLauncher({ classId, className, officerId }: ClassCourseLauncherProps) {
  const { tenantId } = useParams();
  const navigate = useNavigate();

  // Fetch course class assignments for this class
  const { data: classAssignments, isLoading: loadingAssignments } = useQuery({
    queryKey: ['class-course-assignments', classId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_class_assignments')
        .select(`
          id,
          course_id,
          assigned_at,
          courses (
            id,
            title,
            course_code,
            description,
            thumbnail_url,
            status,
            difficulty
          )
        `)
        .eq('class_id', classId);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch module assignments for this class
  const { data: moduleAssignments, isLoading: loadingModules } = useQuery({
    queryKey: ['class-module-assignments', classId],
    queryFn: async () => {
      if (!classAssignments?.length) return [];
      
      const assignmentIds = classAssignments.map(ca => ca.id);
      const { data, error } = await supabase
        .from('class_module_assignments')
        .select(`
          id,
          class_assignment_id,
          module_id,
          is_unlocked,
          unlock_order,
          course_modules (
            id,
            title,
            description,
            display_order,
            course_id
          )
        `)
        .in('class_assignment_id', assignmentIds)
        .order('unlock_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!classAssignments?.length
  });

  // Fetch session assignments for this class
  const { data: sessionAssignments, isLoading: loadingSessions } = useQuery({
    queryKey: ['class-session-assignments', classId, moduleAssignments],
    queryFn: async () => {
      if (!moduleAssignments?.length) return [];
      
      const moduleAssignmentIds = moduleAssignments.map(ma => ma.id);
      const { data, error } = await supabase
        .from('class_session_assignments')
        .select(`
          id,
          class_module_assignment_id,
          session_id,
          is_unlocked,
          unlock_order,
          course_sessions (
            id,
            title,
            description,
            display_order,
            module_id
          )
        `)
        .in('class_module_assignment_id', moduleAssignmentIds)
        .order('unlock_order', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleAssignments?.length
  });

  const isLoading = loadingAssignments || loadingModules || loadingSessions;

  const handleLaunchCourse = (courseId: string, classAssignmentId: string) => {
    // Navigate to the teaching session page with class context
    const url = `/tenant/${tenantId}/officer/teaching/${courseId}?class_id=${classId}&class_name=${encodeURIComponent(className)}&assignment_id=${classAssignmentId}`;
    navigate(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assignedCourses = classAssignments?.map(ca => ({
    assignment: ca,
    course: ca.courses
  })).filter(item => item.course) || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Courses for {className}</h2>
        <p className="text-muted-foreground mt-1">
          Select a course to start teaching or continue from where you left off
        </p>
      </div>

      {assignedCourses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No courses assigned to this class yet
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Contact the system administrator to assign courses
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {assignedCourses.map(({ assignment, course }) => {
          // Get modules assigned to this class for this course
          const courseModules = moduleAssignments?.filter(
            m => m.class_assignment_id === assignment.id
          ) || [];
          
          const totalModules = courseModules.length;
          const unlockedModules = courseModules.filter(m => m.is_unlocked);
          const lockedModules = courseModules.filter(m => !m.is_unlocked);

          // Get sessions for each module
          const getModuleSessions = (moduleAssignmentId: string) => {
            return sessionAssignments?.filter(
              s => s.class_module_assignment_id === moduleAssignmentId
            ) || [];
          };

          return (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <ThumbnailImage 
                    thumbnailPath={course.thumbnail_url}
                    alt={course.title}
                    className="w-20 h-20 rounded-lg object-cover"
                    fallbackClassName="w-20 h-20 rounded-lg bg-muted flex items-center justify-center"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg leading-tight">{course.title}</CardTitle>
                        <CardDescription className="mt-1">{course.course_code}</CardDescription>
                      </div>
                      <Badge variant="default" className="shrink-0">
                        {course.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Module Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {unlockedModules.length} of {totalModules} levels available
                      </span>
                    </div>
                    
                    {/* Locked Modules Warning */}
                    {lockedModules.length > 0 && (
                      <div className="flex items-center gap-2 text-sm p-2 bg-amber-50 dark:bg-amber-950 rounded-md">
                        <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-700 dark:text-amber-300">
                          {lockedModules.length} {lockedModules.length === 1 ? 'level' : 'levels'} locked
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Module & Session List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {courseModules.map((moduleAssignment) => {
                      const sessions = getModuleSessions(moduleAssignment.id);
                      const unlockedSessions = sessions.filter(s => s.is_unlocked);
                      
                      return (
                        <div 
                          key={moduleAssignment.id}
                          className={`p-2 rounded-md border ${
                            moduleAssignment.is_unlocked 
                              ? 'bg-background border-border' 
                              : 'bg-muted/50 border-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {moduleAssignment.is_unlocked ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className={`text-sm font-medium ${
                              !moduleAssignment.is_unlocked ? 'text-muted-foreground' : ''
                            }`}>
                              {moduleAssignment.course_modules?.title || 'Level'}
                            </span>
                          </div>
                          {moduleAssignment.is_unlocked && sessions.length > 0 && (
                            <div className="ml-6 mt-1 space-y-1">
                              {sessions.map(session => (
                                <div 
                                  key={session.id}
                                  className="flex items-center gap-2 text-xs text-muted-foreground"
                                >
                                  {session.is_unlocked ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Lock className="h-3 w-3" />
                                  )}
                                  <span>{session.course_sessions?.title || 'Session'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <Button
                      className="w-full"
                      onClick={() => handleLaunchCourse(course.id, assignment.id)}
                      disabled={unlockedModules.length === 0}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Teaching
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}