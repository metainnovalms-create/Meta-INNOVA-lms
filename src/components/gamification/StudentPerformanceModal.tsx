import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentPerformance } from "@/types/gamification";
import { Trophy, Award, Flame, TrendingUp, Coins } from "lucide-react";
import { toast } from "sonner";

interface StudentPerformanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: StudentPerformance | null;
  onAdjustPoints: (studentId: string, points: number, reason: string) => void;
}

export const StudentPerformanceModal = ({ 
  open, 
  onOpenChange, 
  student,
  onAdjustPoints 
}: StudentPerformanceModalProps) => {
  const [showAdjustment, setShowAdjustment] = useState(false);
  const [adjustmentPoints, setAdjustmentPoints] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState("");

  if (!student) return null;

  const handleAdjustment = () => {
    if (!adjustmentReason.trim()) {
      toast.error("Please provide a reason for the adjustment");
      return;
    }

    onAdjustPoints(student.student_id, adjustmentPoints, adjustmentReason);
    toast.success("Points adjusted successfully");
    setShowAdjustment(false);
    setAdjustmentPoints(0);
    setAdjustmentReason("");
  };

  const pointsData = [
    { label: 'Sessions', value: student.points_breakdown.sessions, icon: TrendingUp },
    { label: 'Projects', value: student.points_breakdown.projects, icon: Trophy },
    { label: 'Attendance', value: student.points_breakdown.attendance, icon: Flame },
    { label: 'Assessments', value: student.points_breakdown.assessments, icon: Award },
    { label: 'Levels', value: student.points_breakdown.levels, icon: Coins },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {student.student_name} - Performance Details
          </DialogTitle>
          <DialogDescription>
            {student.institution_name} • {student.class_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Points
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {student.total_points.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rank
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  #{student.rank}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Badges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {student.badges_earned}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-1">
                  <Flame className="h-5 w-5 text-orange-500" />
                  {student.streak_days}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Points Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Points Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointsData.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-48 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(item.value / student.total_points) * 100}%` }}
                        />
                      </div>
                      <Badge variant="secondary">
                        {item.value} XP
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Manual Adjustment */}
          {!showAdjustment ? (
            <Button onClick={() => setShowAdjustment(true)} variant="outline" className="w-full">
              Manual Point Adjustment
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Adjust Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="points">Points (use negative for deduction)</Label>
                  <Input
                    id="points"
                    type="number"
                    value={adjustmentPoints}
                    onChange={(e) => setAdjustmentPoints(parseInt(e.target.value) || 0)}
                    placeholder="e.g., 50 or -50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason *</Label>
                  <Textarea
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Explain the reason for this adjustment"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleAdjustment} className="flex-1">
                    Apply Adjustment
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowAdjustment(false);
                      setAdjustmentPoints(0);
                      setAdjustmentReason("");
                    }} 
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
