import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, Calendar, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';

const mockCourses = [
  {
    id: '1',
    course_code: 'CS301',
    course_name: 'Artificial Intelligence & Machine Learning',
    department: 'Computer Science',
    semester: 6,
    credits: 4,
    students_enrolled: 45,
    schedule: 'Mon, Wed 10:00-11:30',
    room: 'Lab A',
  },
  {
    id: '2',
    course_code: 'CS302',
    course_name: 'Data Structures & Algorithms',
    department: 'Computer Science',
    semester: 4,
    credits: 4,
    students_enrolled: 52,
    schedule: 'Tue, Thu 09:00-10:30',
    room: 'Room 201',
  },
  {
    id: '3',
    course_code: 'CS401',
    course_name: 'Advanced Algorithms',
    department: 'Computer Science',
    semester: 8,
    credits: 3,
    students_enrolled: 38,
    schedule: 'Mon, Wed, Fri 14:00-15:00',
    room: 'Lab B',
  },
];

export default function TeacherCourses() {
  const [courses] = useState(mockCourses);
  const tenant = authService.getTenant();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Manage your assigned courses this semester</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">This semester</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.reduce((sum, c) => sum + c.students_enrolled, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Across all courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.reduce((sum, c) => sum + c.credits, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Teaching load</p>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <Card key={course.id} className="hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">
                        {course.course_code} - {course.course_name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{course.department}</Badge>
                      <Badge variant="outline">Semester {course.semester}</Badge>
                      <Badge variant="outline">{course.credits} Credits</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{course.students_enrolled} students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{course.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{course.room}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/tenant/${tenant?.slug}/teacher/grades?course=${course.id}`}>
                      View Grades
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/tenant/${tenant?.slug}/teacher/attendance?course=${course.id}`}>
                      Attendance
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link to={`/tenant/${tenant?.slug}/teacher/materials?course=${course.id}`}>
                      Materials
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
