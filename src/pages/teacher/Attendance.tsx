import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Save, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';

const mockCourses = [
  { id: '1', code: 'CS301', name: 'AI & ML' },
  { id: '2', code: 'CS302', name: 'Data Structures' },
];

const mockStudents = [
  {
    id: 'S001',
    name: 'John Student',
    roll_number: 'CS2021001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    attendance_percentage: 85,
  },
  {
    id: 'S002',
    name: 'Jane Doe',
    roll_number: 'CS2021002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
    attendance_percentage: 92,
  },
  {
    id: 'S003',
    name: 'Bob Wilson',
    roll_number: 'CS2021003',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    attendance_percentage: 78,
  },
  {
    id: 'S004',
    name: 'Alice Brown',
    roll_number: 'CS2021004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    attendance_percentage: 88,
  },
];

export default function TeacherAttendance() {
  const [selectedCourse, setSelectedCourse] = useState(mockCourses[0].id);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [topic, setTopic] = useState('');
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    Object.fromEntries(mockStudents.map((s) => [s.id, false]))
  );

  const handleToggleAttendance = (studentId: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleMarkAll = (present: boolean) => {
    setAttendance(Object.fromEntries(mockStudents.map((s) => [s.id, present])));
  };

  const handleSaveAttendance = () => {
    const presentCount = Object.values(attendance).filter(Boolean).length;
    toast.success(`Attendance saved! ${presentCount}/${mockStudents.length} students present`);
  };

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = mockStudents.length - presentCount;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mark Attendance</h1>
            <p className="text-muted-foreground">Track daily class attendance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleSaveAttendance}>
              <Save className="mr-2 h-4 w-4" />
              Save Attendance
            </Button>
          </div>
        </div>

        {/* Attendance Form */}
        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCourses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Topic Covered</Label>
                <Input
                  placeholder="Enter topic..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{mockStudents.length}</div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-500">{presentCount}</div>
              <p className="text-sm text-muted-foreground">Present</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-500">{absentCount}</div>
              <p className="text-sm text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">
                {((presentCount / mockStudents.length) * 100).toFixed(0)}%
              </div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Student List</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleMarkAll(true)}>
                Mark All Present
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleMarkAll(false)}>
                Mark All Absent
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Present</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Overall Attendance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockStudents.map((student) => {
                  const isPresent = attendance[student.id];
                  return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={isPresent}
                          onCheckedChange={() => handleToggleAttendance(student.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.avatar} />
                            <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{student.roll_number}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                student.attendance_percentage >= 75
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendance_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {student.attendance_percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isPresent ? 'default' : 'destructive'}
                          className={
                            isPresent
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-red-500/10 text-red-500'
                          }
                        >
                          {isPresent ? 'Present' : 'Absent'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
