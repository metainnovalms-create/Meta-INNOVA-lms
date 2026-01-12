import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentCourses } from '@/hooks/useClassCourseAssignments';
import { LMSCourseViewer } from '@/components/student/LMSCourseViewer';
import { useLevelCompletionCertificate } from '@/hooks/useLevelCompletionCertificate';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export default function StudentCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch the student record ID (different from user.id/profile ID)
  const { data: studentRecord } = useQuery({
    queryKey: ['student-record', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch student courses from Supabase
  const { data: assignedCourses, isLoading } = useStudentCourses(user?.id, user?.class_id);
  
  // Find the specific course assignment
  const courseAssignment = assignedCourses?.find(a => a.course_id === courseId);
  const course = courseAssignment?.course;
  const modules = courseAssignment?.modules || [];

  // Auto-issue certificates when levels are completed
  const { recheckCertificates } = useLevelCompletionCertificate(
    studentRecord?.id,     // studentRecordId
    modules,
    user?.institution_id,
    course?.title,
    courseId,              // courseId
    courseAssignment?.id   // classAssignmentId (course_class_assignments.id)
  );

  // Recheck certificates whenever modules completion status changes
  useEffect(() => {
    const completedCount = modules.filter(m => m.isModuleCompleted).length;
    if (completedCount > 0 && studentRecord?.id) {
      // Debounce the recheck to avoid too many calls
      const timer = setTimeout(() => {
        recheckCertificates();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [modules, studentRecord?.id, recheckCertificates]);

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
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
            <p className="text-muted-foreground text-center">
              This course is not available or has not been assigned to your class.
            </p>
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
          title: course.title,
          course_code: course.course_code,
          description: course.description
        }} 
        modules={modules}
      />
    </Layout>
  );
}