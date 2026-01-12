import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PlayCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useStudentCourses } from '@/hooks/useClassCourseAssignments';
import { useAuth } from '@/contexts/AuthContext';
import { StorageImage } from '@/components/course/StorageImage';

export default function Courses() {
  const navigate = useNavigate();
  const { tenantId } = useParams();
  const { user } = useAuth();

  // Fetch courses assigned to student's class
  const { data: assignedCourses, isLoading } = useStudentCourses(user?.id, user?.class_id);

  const handleViewCourse = (courseId: string) => {
    navigate(`/tenant/${tenantId}/student/courses/${courseId}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-2">Access your assigned courses</p>
        </div>

        {/* Assigned Courses */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignedCourses?.map((item) => {
            const course = item.course;
            if (!course) return null;
            
            // Count unlocked modules
            const unlockedModules = item.modules?.length || 0;
            
            return (
              <Card 
                key={item.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => handleViewCourse(course.id)}
              >
                <div className="relative h-40 overflow-hidden">
                  {course.thumbnail_url ? (
                    <StorageImage 
                      filePath={course.thumbnail_url} 
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary to-primary/50">
                      <BookOpen className="h-16 w-16 text-white" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex-1">
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="mt-1">{course.course_code}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                  
                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {(item as any).completedSessions || 0}/{(item as any).totalSessions || 0} Sessions
                      </span>
                    </div>
                    <Progress value={(item as any).progressPercentage || 0} className="h-2" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{unlockedModules} Levels</span>
                      </div>
                      {((item as any).progressPercentage || 0) === 100 ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : ((item as any).progressPercentage || 0) > 0 ? (
                        <Badge variant="secondary">{(item as any).progressPercentage}% Complete</Badge>
                      ) : null}
                    </div>
                  </div>

                  <Button className="w-full" onClick={(e) => { e.stopPropagation(); handleViewCourse(course.id); }}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    {((item as any).progressPercentage || 0) > 0 ? 'Continue Learning' : 'Start Learning'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {(!assignedCourses || assignedCourses.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Courses Assigned</h3>
              <p className="text-muted-foreground text-center">
                No courses have been assigned to your class yet. Please check back later.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}