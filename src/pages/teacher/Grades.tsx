import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Save, Download, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';

const mockCourses = [
  { id: '1', code: 'CS301', name: 'AI & ML' },
  { id: '2', code: 'CS302', name: 'Data Structures' },
];

const mockGrades = [
  {
    id: '1',
    student_id: 'S001',
    student_name: 'John Student',
    roll_number: 'CS2021001',
    attendance_percentage: 85,
    internal_marks: 18,
    assignment_marks: 22,
    final_marks: 75,
    grade: 'A',
    status: 'pass' as const,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
  },
  {
    id: '2',
    student_id: 'S002',
    student_name: 'Jane Doe',
    roll_number: 'CS2021002',
    attendance_percentage: 92,
    internal_marks: 20,
    assignment_marks: 24,
    final_marks: 88,
    grade: 'A+',
    status: 'pass' as const,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jane',
  },
  {
    id: '3',
    student_id: 'S003',
    student_name: 'Bob Wilson',
    roll_number: 'CS2021003',
    attendance_percentage: 65,
    internal_marks: 12,
    assignment_marks: 15,
    final_marks: 45,
    grade: 'C',
    status: 'pass' as const,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
  },
];

export default function TeacherGrades() {
  const [selectedCourse, setSelectedCourse] = useState(mockCourses[0].id);
  const [grades, setGrades] = useState(mockGrades);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpdateGrade = (studentId: string, field: string, value: number) => {
    setGrades(
      grades.map((grade) =>
        grade.student_id === studentId ? { ...grade, [field]: value } : grade
      )
    );
  };

  const handleSaveGrades = () => {
    toast.success('Grades saved successfully!');
  };

  const handleSubmitGrades = () => {
    toast.success('Grades submitted for review!');
  };

  const getGradeBadge = (grade: string) => {
    const variants: Record<string, string> = {
      'A+': 'bg-green-500/10 text-green-500',
      A: 'bg-green-500/10 text-green-500',
      B: 'bg-blue-500/10 text-blue-500',
      C: 'bg-yellow-500/10 text-yellow-500',
      D: 'bg-orange-500/10 text-orange-500',
      F: 'bg-red-500/10 text-red-500',
    };
    return variants[grade] || variants.C;
  };

  const filteredGrades = grades.filter(
    (grade) =>
      grade.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      grade.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Student Grades & Assessment</h1>
            <p className="text-muted-foreground">Manage student grades and assessments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveGrades}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button onClick={handleSubmitGrades}>Submit Grades</Button>
          </div>
        </div>

        {/* Course Selector & Search */}
        <div className="flex gap-4">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[300px]">
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
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Grade Distribution */}
        <div className="grid gap-4 md:grid-cols-5">
          {['A+', 'A', 'B', 'C', 'F'].map((grade) => {
            const count = grades.filter((g) => g.grade === grade).length;
            return (
              <Card key={grade}>
                <CardContent className="pt-6 text-center">
                  <div className="text-3xl font-bold">{count}</div>
                  <p className="text-sm text-muted-foreground">Grade {grade}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Grades Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Attendance %</TableHead>
                  <TableHead>Internal (20)</TableHead>
                  <TableHead>Assignment (25)</TableHead>
                  <TableHead>Final (100)</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={grade.avatar} />
                          <AvatarFallback>{grade.student_name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{grade.student_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{grade.roll_number}</TableCell>
                    <TableCell>
                      <Badge variant={grade.attendance_percentage >= 75 ? 'default' : 'destructive'}>
                        {grade.attendance_percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        value={grade.internal_marks}
                        onChange={(e) =>
                          handleUpdateGrade(grade.student_id, 'internal_marks', Number(e.target.value))
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="25"
                        value={grade.assignment_marks}
                        onChange={(e) =>
                          handleUpdateGrade(
                            grade.student_id,
                            'assignment_marks',
                            Number(e.target.value)
                          )
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={grade.final_marks}
                        onChange={(e) =>
                          handleUpdateGrade(grade.student_id, 'final_marks', Number(e.target.value))
                        }
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge className={getGradeBadge(grade.grade || '')}>{grade.grade}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={grade.status === 'pass' ? 'default' : 'destructive'}>
                        {grade.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
