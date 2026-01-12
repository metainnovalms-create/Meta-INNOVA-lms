import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StudentPerformance } from "@/types/gamification";
import { Eye, TrendingUp, Trophy, Award, Flame, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StudentPerformanceTableProps {
  performances: StudentPerformance[];
  onViewDetails: (student: StudentPerformance) => void;
}

export const StudentPerformanceTable = ({ performances, onViewDetails }: StudentPerformanceTableProps) => {
  const [search, setSearch] = useState("");

  const filteredPerformances = performances.filter(p =>
    p.student_name.toLowerCase().includes(search.toLowerCase()) ||
    p.institution_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ['Student Name', 'Institution', 'Class', 'Total Points', 'Rank', 'Badges', 'Streak', 'Last Active'].join(','),
      ...filteredPerformances.map(p => [
        p.student_name,
        p.institution_name,
        p.class_name,
        p.total_points,
        p.rank,
        p.badges_earned,
        p.streak_days,
        p.last_activity
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-performance.csv';
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search by student or institution name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Total Points</TableHead>
              <TableHead>Badges</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPerformances.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              filteredPerformances.map((student) => (
                <TableRow key={student.student_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {student.rank === 1 && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {student.rank === 2 && <Trophy className="h-4 w-4 text-gray-400" />}
                      {student.rank === 3 && <Trophy className="h-4 w-4 text-amber-600" />}
                      <span className="font-semibold">#{student.rank}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{student.student_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {student.institution_name}
                  </TableCell>
                  <TableCell className="text-sm">{student.class_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-primary">
                        {student.total_points.toLocaleString()} XP
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Award className="h-3 w-3" />
                      {student.badges_earned}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.streak_days >= 7 ? "default" : "outline"} className="gap-1">
                      <Flame className="h-3 w-3" />
                      {student.streak_days} days
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(student.last_activity), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewDetails(student)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
