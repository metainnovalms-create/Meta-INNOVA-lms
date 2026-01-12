import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { gamificationDbService } from '@/services/gamification-db.service';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  rank: number;
  student_id: string;
  student_name: string;
  total_points: number;
  badges_earned: number;
  class_name: string;
}

interface LeaderboardSectionProps {
  institutionId: string;
}

export function LeaderboardSection({ institutionId }: LeaderboardSectionProps) {
  const [loading, setLoading] = useState(true);
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classLeaderboard, setClassLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classes, setClasses] = useState<{ id: string; class_name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    if (institutionId) {
      loadData();
    }
  }, [institutionId]);

  useEffect(() => {
    if (selectedClass && institutionId) {
      loadClassLeaderboard();
    }
  }, [selectedClass, institutionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load classes and overall leaderboard in parallel
      const [classesResult, leaderboardData] = await Promise.all([
        supabase.from('classes').select('id, class_name').eq('institution_id', institutionId).order('class_name'),
        gamificationDbService.getInstitutionLeaderboard(institutionId, 10)
      ]);
      
      const classesData = classesResult.data || [];
      setClasses(classesData);
      
      // Set first class as default if available
      if (classesData.length > 0 && !selectedClass) {
        setSelectedClass(classesData[0].id);
      }
      
      // Map to LeaderboardEntry format
      setOverallLeaderboard(leaderboardData.map((s, idx) => ({
        rank: idx + 1,
        student_id: s.student_id,
        student_name: s.student_name,
        total_points: s.total_points,
        badges_earned: s.badges_earned,
        class_name: s.class_name
      })));
      
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassLeaderboard = async () => {
    try {
      const leaderboardData = await gamificationDbService.getClassLeaderboard(institutionId, selectedClass, 10);
      
      setClassLeaderboard(leaderboardData.map((s, idx) => ({
        rank: idx + 1,
        student_id: s.student_id,
        student_name: s.student_name,
        total_points: s.total_points,
        badges_earned: s.badges_earned,
        class_name: s.class_name
      })));
    } catch (error) {
      console.error('Error loading class leaderboard:', error);
    }
  };

  const renderLeaderboard = (entries: LeaderboardEntry[], showClass: boolean = false) => {
    if (entries.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No leaderboard data yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.student_id}
            className="flex items-center justify-between rounded-lg p-3 bg-muted hover:bg-muted/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                entry.rank === 1 ? 'bg-yellow-500 text-white' :
                entry.rank === 2 ? 'bg-gray-400 text-white' :
                entry.rank === 3 ? 'bg-orange-600 text-white' :
                'bg-muted-foreground/20 text-foreground'
              }`}>
                {entry.rank}
              </div>
              <div>
                <div className="font-medium text-sm">{entry.student_name}</div>
                <div className="text-xs text-muted-foreground">
                  {entry.badges_earned} badges
                  {showClass && entry.class_name && (
                    <span> • {entry.class_name}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-primary">{entry.total_points}</div>
              <div className="text-xs text-muted-foreground">pts</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          Student Leaderboards
        </h2>
        <p className="text-sm text-muted-foreground">Top performing students by XP points</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* Overall Institution Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Overall Leaderboard</CardTitle>
                <CardDescription>Top 10 across all classes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderLeaderboard(overallLeaderboard, true)}
          </CardContent>
        </Card>

        {/* Class-wise Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-lg">Class Leaderboard</CardTitle>
                  <CardDescription>Top students in selected class</CardDescription>
                </div>
              </div>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.class_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {renderLeaderboard(classLeaderboard)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
