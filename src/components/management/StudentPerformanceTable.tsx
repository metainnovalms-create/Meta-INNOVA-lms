import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StudentPerformance } from "@/utils/courseHelpers";
import { formatDistanceToNow } from "date-fns";

interface StudentPerformanceTableProps {
  students: StudentPerformance[];
  onStudentClick?: (studentId: string) => void;
}

const getStatusBadge = (status: StudentPerformance['status']) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Completed</Badge>;
    case 'at_risk':
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">At Risk</Badge>;
    case 'struggling':
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Struggling</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export function StudentPerformanceTable({ students, onStudentClick }: StudentPerformanceTableProps) {
  if (students.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No students enrolled in this course yet.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Roll No</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Assignments</TableHead>
            <TableHead>Quizzes</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow 
              key={student.student_id}
              className={onStudentClick ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => onStudentClick?.(student.student_id)}
            >
              <TableCell className="font-medium">{student.student_name}</TableCell>
              <TableCell>{student.roll_no}</TableCell>
              <TableCell>{student.class_level}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={student.progress_percentage} className="h-2" />
                  <span className="text-xs font-medium whitespace-nowrap">
                    {student.progress_percentage}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{student.assignment_avg.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">
                    {student.assignment_completed}/{student.assignment_total}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium text-sm">{student.quiz_avg.toFixed(1)}%</div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })}
              </TableCell>
              <TableCell>{getStatusBadge(student.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
