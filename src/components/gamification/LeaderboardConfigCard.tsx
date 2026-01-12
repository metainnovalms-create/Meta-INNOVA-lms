import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LeaderboardConfig, StudentPerformance } from "@/types/gamification";
import { Trophy, Save } from "lucide-react";
import { toast } from "sonner";

interface LeaderboardConfigCardProps {
  config: LeaderboardConfig;
  students: StudentPerformance[];
  onSave: (config: LeaderboardConfig) => void;
}

export const LeaderboardConfigCard = ({ config, students, onSave }: LeaderboardConfigCardProps) => {
  const [editedConfig, setEditedConfig] = useState<LeaderboardConfig>(config);

  const handleSave = () => {
    onSave(editedConfig);
    toast.success("Leaderboard configuration saved");
  };

  const topStudents = students
    .filter(s => s.institution_id === config.institution_id)
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, editedConfig.top_n_display);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.institution_name}</CardTitle>
        <CardDescription>Configure leaderboard settings for this institution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Form */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scope">Scope</Label>
            <Select
              value={editedConfig.scope}
              onValueChange={(value: any) => setEditedConfig({ ...editedConfig, scope: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="institution">Institution</SelectItem>
                <SelectItem value="class">Class</SelectItem>
                <SelectItem value="course">Course</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time_period">Time Period</Label>
            <Select
              value={editedConfig.time_period}
              onValueChange={(value: any) => setEditedConfig({ ...editedConfig, time_period: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_time">All Time</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="top_n_display">Display Top N Students</Label>
            <Input
              id="top_n_display"
              type="number"
              value={editedConfig.top_n_display}
              onChange={(e) => setEditedConfig({ 
                ...editedConfig, 
                top_n_display: parseInt(e.target.value) 
              })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset_schedule">Reset Schedule</Label>
            <Select
              value={editedConfig.reset_schedule}
              onValueChange={(value: any) => setEditedConfig({ ...editedConfig, reset_schedule: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="is_public">Public Visibility</Label>
            <p className="text-sm text-muted-foreground">
              Allow students to view the leaderboard
            </p>
          </div>
          <Switch
            id="is_public"
            checked={editedConfig.is_public}
            onCheckedChange={(checked) => setEditedConfig({ ...editedConfig, is_public: checked })}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>

        {/* Live Preview */}
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Live Leaderboard Preview
          </h4>
          
          {topStudents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No students found for this institution
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topStudents.map((student, index) => (
                    <TableRow key={student.student_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                          {index === 1 && <Trophy className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Trophy className="h-4 w-4 text-amber-600" />}
                          <span className="font-semibold">#{index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{student.student_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.class_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {student.total_points.toLocaleString()} XP
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
