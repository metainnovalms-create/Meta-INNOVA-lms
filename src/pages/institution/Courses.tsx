import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';

const mockAssignments = [
  {
    id: '1',
    course_code: 'CS301',
    course_name: 'Artificial Intelligence',
    teacher_id: '1',
    teacher_name: 'Dr. Sarah Johnson',
    department: 'Computer Science',
    semester: 6,
    credits: 4,
    students_enrolled: 45,
    max_capacity: 50,
    schedule: 'Mon, Wed 10:00-11:30',
  },
  {
    id: '2',
    course_code: 'EC401',
    course_name: 'VLSI Design',
    teacher_id: '2',
    teacher_name: 'Prof. Michael Chen',
    department: 'Electronics',
    semester: 8,
    credits: 3,
    students_enrolled: 38,
    max_capacity: 40,
    schedule: 'Tue, Thu 14:00-15:30',
  },
  {
    id: '3',
    course_code: 'ME202',
    course_name: 'Thermodynamics',
    teacher_id: '3',
    teacher_name: 'Dr. Emily Rodriguez',
    department: 'Mechanical',
    semester: 4,
    credits: 4,
    students_enrolled: 52,
    max_capacity: 60,
    schedule: 'Mon, Wed, Fri 09:00-10:00',
  },
];

export default function Courses() {
  const [assignments, setAssignments] = useState(mockAssignments);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [filterDepartment, setFilterDepartment] = useState('all');

  const handleAssignCourse = () => {
    toast.success('Course assigned successfully!');
    setIsDialogOpen(false);
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments(assignments.filter((a) => a.id !== id));
    toast.success('Course assignment removed!');
  };

  const departments = ['all', ...new Set(assignments.map((a) => a.department))];
  const filteredAssignments =
    filterDepartment === 'all'
      ? assignments
      : assignments.filter((a) => a.department === filterDepartment);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Course Assignment</h1>
            <p className="text-muted-foreground">Assign courses to teachers and manage capacity</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingAssignment(null)}>
                <Plus className="mr-2 h-4 w-4" />
                Assign Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingAssignment ? 'Edit Course Assignment' : 'Assign New Course'}
                </DialogTitle>
                <DialogDescription>Assign a course to a teacher with schedule details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="course_code">Course Code</Label>
                    <Input id="course_code" placeholder="CS301" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="course_name">Course Name</Label>
                    <Input id="course_name" placeholder="Artificial Intelligence" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="teacher">Assign Teacher</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Dr. Sarah Johnson</SelectItem>
                        <SelectItem value="2">Prof. Michael Chen</SelectItem>
                        <SelectItem value="3">Dr. Emily Rodriguez</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cs">Computer Science</SelectItem>
                        <SelectItem value="ec">Electronics</SelectItem>
                        <SelectItem value="me">Mechanical</SelectItem>
                        <SelectItem value="ce">Civil</SelectItem>
                        <SelectItem value="ee">Electrical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                          <SelectItem key={sem} value={sem.toString()}>
                            {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input id="credits" type="number" placeholder="4" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Max Capacity</Label>
                    <Input id="capacity" type="number" placeholder="50" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Input id="schedule" placeholder="Mon, Wed 10:00-11:30" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignCourse}>
                  {editingAssignment ? 'Update' : 'Assign'} Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-4">
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept === 'all' ? 'All Departments' : dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Course Assignments Grid */}
        <div className="grid gap-4">
          {filteredAssignments.map((assignment) => {
            const capacityPercent = (assignment.students_enrolled / assignment.max_capacity) * 100;
            const capacityColor =
              capacityPercent >= 90
                ? 'text-red-500'
                : capacityPercent >= 70
                ? 'text-yellow-500'
                : 'text-green-500';

            return (
              <Card key={assignment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {assignment.course_code} - {assignment.course_name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{assignment.department}</Badge>
                        <Badge variant="outline">Semester {assignment.semester}</Badge>
                        <Badge variant="outline">{assignment.credits} Credits</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setEditingAssignment(assignment);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Assigned Teacher</p>
                      <p className="font-medium">{assignment.teacher_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Schedule</p>
                      <p className="font-medium">{assignment.schedule}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Enrollment</p>
                      <div className="flex items-center gap-2">
                        <Users className={`h-4 w-4 ${capacityColor}`} />
                        <p className={`font-medium ${capacityColor}`}>
                          {assignment.students_enrolled}/{assignment.max_capacity}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          ({capacityPercent.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          capacityPercent >= 90
                            ? 'bg-red-500'
                            : capacityPercent >= 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
