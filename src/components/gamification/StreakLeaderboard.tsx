import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Flame, Crown, Medal, Award } from 'lucide-react';
import { gamificationDbService } from '@/services/gamification-db.service';

export interface StreakLeaderEntry {
  student_id: string;
  student_name: string;
  institution_id: string;
  institution_name: string;
  current_streak: number;
  longest_streak: number;
}

interface StreakLeaderboardProps {
  institutionId?: string;
  limit?: number;
  compact?: boolean;
}

export function StreakLeaderboard({ institutionId, limit = 10, compact = false }: StreakLeaderboardProps) {
  const [loading, setLoading] = useState(true);
  const [leaders, setLeaders] = useState<StreakLeaderEntry[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, [institutionId]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await gamificationDbService.getStreakLeaderboard(institutionId, limit);
      setLeaders(data);
    } catch (error) {
      console.error('Error loading streak leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (leaders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Streak Leaderboard
          </CardTitle>
          <CardDescription>Top students by consecutive login days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No streak data yet. Start logging in daily to build your streak!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Streak Leaderboard
        </CardTitle>
        {!compact && (
          <CardDescription>Top students by consecutive login days</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {leaders.map((leader, index) => (
            <div
              key={leader.student_id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8">
                  {getRankIcon(index + 1)}
                </div>
                <div>
                  <p className="font-medium text-sm">{leader.student_name}</p>
                  {!compact && (
                    <p className="text-xs text-muted-foreground">{leader.institution_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {leader.current_streak} days
                </Badge>
                {!compact && leader.longest_streak > leader.current_streak && (
                  <Badge variant="outline" className="text-xs">
                    Best: {leader.longest_streak}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
