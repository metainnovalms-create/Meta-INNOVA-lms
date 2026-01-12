import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Award, TrendingUp, Flame, Medal, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { gamificationDbService } from '@/services/gamification-db.service';
import { useStudentStreak } from '@/hooks/useStudentStreak';

interface GamificationData {
  total_points: number;
  current_rank: number;
  streak_days: number;
  badges_earned: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned_at: string;
  }>;
  badges_locked: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    threshold: number;
    progress: number;
    criteria_type: string;
  }>;
  points_breakdown: {
    sessions: number;
    projects: number;
    attendance: number;
    assessments: number;
  };
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  badges: number;
  isCurrentUser?: boolean;
  class_name?: string;
}

export default function Gamification() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GamificationData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardScope, setLeaderboardScope] = useState<'class' | 'institution'>('class');
  
  // Use realtime streak hook
  const { streak: realtimeStreak } = useStudentStreak(user?.id, user?.institution_id);

  useEffect(() => {
    if (user?.id) {
      loadGamificationData();
    }
  }, [user?.id, leaderboardScope]);

  const loadGamificationData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get student profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, institution_id, class_id')
        .eq('id', user.id)
        .single();
      
      const studentId = profile?.id || user.id;
      const institutionId = profile?.institution_id;
      const classId = profile?.class_id;
      
      // Fetch all data in parallel
      const [
        totalXP,
        xpBreakdown,
        studentBadges,
        streak,
        allBadges,
        leaderboardData,
        xpTransactionsResult
      ] = await Promise.all([
        gamificationDbService.getStudentTotalXP(studentId),
        gamificationDbService.getStudentXPBreakdown(studentId),
        gamificationDbService.getStudentBadges(studentId),
        gamificationDbService.getStudentStreak(studentId),
        gamificationDbService.getBadges(),
        leaderboardScope === 'class' && classId
          ? gamificationDbService.getClassLeaderboard(institutionId!, classId, 20)
          : gamificationDbService.getInstitutionLeaderboard(institutionId!, 20),
        supabase.from('student_xp_transactions').select('activity_type, activity_id').eq('student_id', studentId)
      ]);
      
      // Build activity counts
      const activityCounts: Record<string, number> = {};
      const uniqueActivities: Record<string, Set<string>> = {};
      xpTransactionsResult.data?.forEach(t => {
        activityCounts[t.activity_type] = (activityCounts[t.activity_type] || 0) + 1;
        if (!uniqueActivities[t.activity_type]) {
          uniqueActivities[t.activity_type] = new Set();
        }
        if (t.activity_id) {
          uniqueActivities[t.activity_type].add(t.activity_id);
        }
      });
      
      // Calculate rank
      const myRank = leaderboardData.findIndex(s => s.student_id === studentId) + 1 || leaderboardData.length + 1;
      
      // Process earned badges
      const earnedBadgeIds = new Set(studentBadges.map(b => b.badge?.id));
      
      // Calculate locked badges with progress
      const lockedBadges = allBadges
        .filter(b => b.is_active && !earnedBadgeIds.has(b.id))
        .map(b => {
          const criteria = b.unlock_criteria as any;
          const threshold = criteria?.threshold || 1;
          let progress = 0;
          let current = 0;
          
          switch (criteria?.type) {
            case 'points':
              current = totalXP;
              progress = Math.min(100, Math.round((current / threshold) * 100));
              break;
            case 'streak':
              current = streak?.current_streak || 0;
              progress = Math.min(100, Math.round((current / threshold) * 100));
              break;
            case 'assessments':
              current = activityCounts['assessment_completion'] || 0;
              progress = Math.min(100, Math.round((current / threshold) * 100));
              break;
            case 'projects':
              current = uniqueActivities['project_membership']?.size || 0;
              progress = Math.min(100, Math.round((current / threshold) * 100));
              break;
            case 'attendance':
              current = activityCounts['session_attendance'] || 0;
              progress = Math.min(100, Math.round((current / threshold) * 100));
              break;
            default:
              progress = 0;
          }
          
          return {
            id: b.id,
            name: b.name,
            description: b.description || '',
            icon: b.icon,
            threshold,
            progress,
            criteria_type: criteria?.type || 'unknown'
          };
        });
      
      setData({
        total_points: totalXP,
        current_rank: myRank,
        streak_days: streak?.current_streak || 0,
        badges_earned: studentBadges.map(b => ({
          id: b.badge?.id || '',
          name: b.badge?.name || '',
          description: b.badge?.description || '',
          icon: b.badge?.icon || '🏆',
          earned_at: b.earned_at
        })),
        badges_locked: lockedBadges,
        points_breakdown: {
          sessions: xpBreakdown['session_attendance'] || 0,
          projects: (xpBreakdown['project_membership'] || 0) + (xpBreakdown['project_award'] || 0),
          attendance: xpBreakdown['session_attendance'] || 0,
          assessments: (xpBreakdown['assessment_completion'] || 0) + (xpBreakdown['assessment_pass'] || 0) + (xpBreakdown['assessment_perfect_score'] || 0)
        }
      });
      
      // Build leaderboard
      const displayLeaderboard: LeaderboardEntry[] = leaderboardData.map((s, idx) => ({
        rank: idx + 1,
        name: s.student_id === studentId ? 'You' : s.student_name,
        points: s.total_points,
        badges: s.badges_earned,
        isCurrentUser: s.student_id === studentId,
        class_name: s.class_name
      }));
      
      setLeaderboard(displayLeaderboard);
      
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const totalBreakdown = data 
    ? Object.values(data.points_breakdown).reduce((a, b) => a + b, 0) || 1
    : 1;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Achievements & Leaderboard</h1>
          <p className="text-muted-foreground">Track your progress and compete with peers</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(data?.total_points || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Lifetime XP earned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Rank</CardTitle>
              <Medal className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{data?.current_rank || '-'}</div>
              <p className="text-xs text-muted-foreground">In your {leaderboardScope}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realtimeStreak?.current_streak || data?.streak_days || 0} days</div>
              <p className="text-xs text-muted-foreground">Keep it going!</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="badges" className="space-y-6">
          <TabsList>
            <TabsTrigger value="badges">
              <Award className="mr-2 h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <TrendingUp className="mr-2 h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="points">
              <Trophy className="mr-2 h-4 w-4" />
              Points
            </TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Earned Badges</CardTitle>
                <CardDescription>Your achievements and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.badges_earned.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No badges earned yet. Keep learning to unlock achievements!</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {data?.badges_earned.map((badge) => (
                      <div
                        key={badge.id}
                        className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 text-center"
                      >
                        <div className="text-4xl mb-2">{badge.icon}</div>
                        <div className="font-semibold">{badge.name}</div>
                        <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Locked Badges</CardTitle>
                <CardDescription>Keep working to unlock these achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {data?.badges_locked.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>You've unlocked all available badges! Amazing!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data?.badges_locked.map((badge) => (
                      <div key={badge.id} className="rounded-lg border p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl opacity-50">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-semibold">{badge.name}</div>
                              <Badge variant="outline">{badge.progress}%</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                            <Progress value={badge.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {badge.threshold} {badge.criteria_type} required
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{leaderboardScope === 'class' ? 'Class' : 'Institution'} Leaderboard</CardTitle>
                    <CardDescription>Top performers</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant={leaderboardScope === 'class' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setLeaderboardScope('class')}
                    >
                      Class
                    </Badge>
                    <Badge 
                      variant={leaderboardScope === 'institution' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setLeaderboardScope('institution')}
                    >
                      Institution
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No leaderboard data yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.rank}
                        className={`flex items-center justify-between rounded-lg p-4 ${
                          entry.isCurrentUser 
                            ? 'bg-primary/10 border-2 border-primary/30' 
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            entry.rank === 1 ? 'bg-yellow-500 text-white' :
                            entry.rank === 2 ? 'bg-gray-400 text-white' :
                            entry.rank === 3 ? 'bg-orange-600 text-white' :
                            'bg-muted-foreground/20'
                          } font-bold`}>
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-2">
                              {entry.name}
                              {entry.isCurrentUser && <Badge variant="secondary">You</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {entry.badges} badges earned
                              {entry.class_name && leaderboardScope === 'institution' && (
                                <span> • {entry.class_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-primary">{entry.points}</div>
                          <div className="text-xs text-muted-foreground">points</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="points">
            <Card>
              <CardHeader>
                <CardTitle>Points Breakdown</CardTitle>
                <CardDescription>See where your points come from</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {data && Object.entries(data.points_breakdown).map(([category, points]) => {
                  const percentage = (points / totalBreakdown) * 100;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="capitalize font-medium">{category}</span>
                        <span className="font-bold text-primary">{points} pts</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {percentage.toFixed(1)}% of total points
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
