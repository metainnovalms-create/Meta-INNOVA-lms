import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InstitutionClass } from '@/types/student';
import { Users, TrendingUp, BookOpen, Calendar, MapPin, User, Pencil } from 'lucide-react';

interface ClassOverviewTabProps {
  classData: InstitutionClass;
  studentCount: number;
  attendanceRate: number;
  averageGrade: number;
  activeCourses: number;
  onEditClass: () => void;
}

export function ClassOverviewTab({
  classData,
  studentCount,
  attendanceRate,
  averageGrade,
  activeCourses,
  onEditClass
}: ClassOverviewTabProps) {
  const utilizationRate = classData.capacity > 0 
    ? Math.round((studentCount / classData.capacity) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-muted-foreground">
              {utilizationRate}% capacity utilization
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average class attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Class performance score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCourses}</div>
            <p className="text-xs text-muted-foreground">
              Courses assigned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Class Information</CardTitle>
              <CardDescription>Basic details and configuration</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onEditClass}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Class
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Class Name</div>
              <div className="font-medium">{classData.class_name}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Academic Year</div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{classData.academic_year}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Room Number</div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{classData.room_number || 'Not assigned'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Capacity</div>
              <div className="font-medium">
                {studentCount} / {classData.capacity} students
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge 
                variant={classData.status === 'active' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {classData.status}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Created Date</div>
              <div className="font-medium">
                {new Date(classData.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
