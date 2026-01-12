import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Loader2, ChevronLeft } from 'lucide-react';
import { useAllPublishedCourses } from '@/hooks/useClassCourseAssignments';
import { LMSCourseViewer } from '@/components/student/LMSCourseViewer';
import { Button } from '@/components/ui/button';

export default function ManagementCourseDetail() {
  const { courseId, tenantId } = useParams();
  const navigate = useNavigate();

  // Fetch all published courses
  const { data: courses, isLoading } = useAllPublishedCourses();
  
  // Find the specific course
  const course = courses?.find(c => c.id === courseId);

  if (isLoading) {
    return (
      <Layout hideNav>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <BookOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Course Not Found</h3>
            <p className="text-muted-foreground text-center">
              This course is not available or has not been published.
            </p>
            <Button variant="outline" onClick={() => navigate(`/tenant/${tenantId}/management/courses-sessions`)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout hideNav>
      <LMSCourseViewer 
        course={{
          id: course.id,
          title: course.title || '',
          course_code: course.course_code || '',
          description: course.description
        }} 
        modules={course.modules || []}
        viewOnly={true}
        backPath={`/tenant/${tenantId}/management/courses-sessions`}
      />
    </Layout>
  );
}