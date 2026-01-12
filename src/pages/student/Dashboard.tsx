import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Target, Trophy, TrendingUp, Flame, Award, Lock, ArrowRight, Loader2, FileText, CheckCircle, XCircle, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { gamificationDbService } from '@/services/gamification-db.service';
import { useStudentStreak } from '@/hooks/useStudentStreak';
import { StreakLeaderboard } from '@/components/gamification/StreakLeaderboard';
import { format } from 'date-fns';

interface StudentGamification {
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
    points_required: number;
    progress: number;
  }>;
  points_breakdown: {
    sessions: number;
    projects: number;
    courses: number;
    achievements: number;
    assessments: number;
  };
  weekly_points: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  badges: number;
  isCurrentUser?: boolean;
}

interface RecentAssessment {
  id: string;
  title: string;
  percentage: number;
  passed: boolean;
  submitted_at: string;
}

interface RecentAssignment {
  id: string;
  title: string;
  marks_obtained: number | null;
  total_marks: number;
  passing_marks: number;
  passed: boolean;
  submitted_at: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { tenantId } = useParams<{ tenantId: string }>();
  const [loading, setLoading] = useState(true);
  const [gamification, setGamification] = useState<StudentGamification | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [coursesEnrolled, setCoursesEnrolled] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [completedProjects, setCompletedProjects] = useState(0);
  const [recentAssessments, setRecentAssessments] = useState<RecentAssessment[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<RecentAssignment[]>([]);
  
  // Use realtime streak hook
  const { streak: realtimeStreak } = useStudentStreak(user?.id, user?.institution_id);

  const gamificationPath = tenantId ? `/tenant/${tenantId}/student/gamification` : '/student/gamification';

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
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
      
      // Parallel data fetching
      // Use class-scoped leaderboard if student has a class
      const classId = profile?.class_id;
      
      const [
        totalXP,
        xpBreakdown,
        studentBadges,
        streak,
        allBadges,
        leaderboardData,
        projectData,
        courseData,
        xpTransactions
      ] = await Promise.all([
        gamificationDbService.getStudentTotalXP(studentId),
        gamificationDbService.getStudentXPBreakdown(studentId),
        gamificationDbService.getStudentBadges(studentId),
        gamificationDbService.getStudentStreak(studentId),
        gamificationDbService.getBadges(),
        classId 
          ? gamificationDbService.getClassLeaderboard(institutionId!, classId, 20)
          : gamificationDbService.getInstitutionLeaderboard(institutionId!, 20),
        loadProjectData(user.id),
        loadCourseData(studentId),
        supabase.from('student_xp_transactions').select('activity_type, activity_id').eq('student_id', studentId)
      ]);
      
      // Update streak separately (side effect, not data we need)
      gamificationDbService.updateStreak(user.id, institutionId || undefined);
      
      // Build activity counts for badge progress
      const activityCounts: Record<string, number> = {};
      const uniqueActivities: Record<string, Set<string>> = {};
      xpTransactions.data?.forEach(t => {
        activityCounts[t.activity_type] = (activityCounts[t.activity_type] || 0) + 1;
        if (!uniqueActivities[t.activity_type]) {
          uniqueActivities[t.activity_type] = new Set();
        }
        if (t.activity_id) {
          uniqueActivities[t.activity_type].add(t.activity_id);
        }
      });
      
      // Calculate weekly points (last 7 days)
      const weeklyPoints = await getWeeklyPoints(studentId);
      
      // Calculate rank
      const myRank = leaderboardData.findIndex(s => s.student_id === studentId) + 1 || leaderboardData.length + 1;
      
      // Get earned badge IDs
      const earnedBadgeIds = new Set(studentBadges.map(b => b.badge?.id));
      
      // Calculate locked badges with progress based on all criteria types
      const lockedBadges = allBadges
        .filter(b => b.is_active && !earnedBadgeIds.has(b.id))
        .slice(0, 5)
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
            case 'custom':
              if (criteria.description?.includes('100%')) {
                current = activityCounts['assessment_perfect_score'] || 0;
              } else if (criteria.description?.includes('award')) {
                current = activityCounts['project_award'] || 0;
              }
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
            points_required: threshold,
            progress
          };
        });
      
      setGamification({
        total_points: totalXP,
        current_rank: myRank,
        streak_days: realtimeStreak?.current_streak || streak?.current_streak || 0,
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
          projects: (xpBreakdown['project_membership'] || 0) + (xpBreakdown['project_completion'] || 0),
          courses: xpBreakdown['level_completion'] || 0,
          achievements: xpBreakdown['project_award'] || 0,
          assessments: (xpBreakdown['assessment_completion'] || 0) + (xpBreakdown['assessment_pass'] || 0) + (xpBreakdown['assessment_perfect_score'] || 0)
        },
        weekly_points: weeklyPoints
      });
      
      // Build leaderboard for display
      const displayLeaderboard: LeaderboardEntry[] = leaderboardData.slice(0, 3).map((s, idx) => ({
        rank: idx + 1,
        name: s.student_name,
        points: s.total_points,
        badges: s.badges_earned,
        isCurrentUser: s.student_id === studentId
      }));
      
      // Add current user if not in top 3
      if (myRank > 3) {
        const myEntry = leaderboardData.find(s => s.student_id === studentId);
        displayLeaderboard.push({
          rank: myRank,
          name: 'You',
          points: totalXP,
          badges: studentBadges.length,
          isCurrentUser: true
        });
      }
      
      setLeaderboard(displayLeaderboard);
      setActiveProjects(projectData.active);
      setCompletedProjects(projectData.completed);
      setCoursesEnrolled(courseData);
      
      // Fetch recent performance data
      await loadPerformanceData(studentId);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadPerformanceData = async (studentId: string) => {
    try {
      // Fetch recent assessment attempts
      const { data: assessmentAttempts } = await supabase
        .from('assessment_attempts')
        .select(`
          id,
          assessment_id,
          percentage,
          passed,
          submitted_at
        `)
        .eq('student_id', studentId)
        .in('status', ['submitted', 'auto_submitted', 'evaluated', 'completed'])
        .order('submitted_at', { ascending: false })
        .limit(5);
      
      // Get assessment titles
      if (assessmentAttempts && assessmentAttempts.length > 0) {
        const assessmentIds = assessmentAttempts.map(a => a.assessment_id);
        const { data: assessments } = await supabase
          .from('assessments')
          .select('id, title')
          .in('id', assessmentIds);
        
        const assessmentMap = new Map((assessments || []).map(a => [a.id, a.title]));
        
        setRecentAssessments(assessmentAttempts.map(a => ({
          id: a.id,
          title: assessmentMap.get(a.assessment_id) || 'Unknown Assessment',
          percentage: a.percentage,
          passed: a.passed,
          submitted_at: a.submitted_at || '',
        })));
      }
      
      // Fetch recent assignment submissions
      const { data: assignmentSubmissions } = await supabase
        .from('assignment_submissions')
        .select(`
          id,
          assignment_id,
          marks_obtained,
          submitted_at
        `)
        .eq('student_id', studentId)
        .in('status', ['submitted', 'graded'])
        .order('submitted_at', { ascending: false })
        .limit(5);
      
      // Get assignment details
      if (assignmentSubmissions && assignmentSubmissions.length > 0) {
        const assignmentIds = assignmentSubmissions.map(s => s.assignment_id);
        const { data: assignments } = await supabase
          .from('assignments')
          .select('id, title, total_marks, passing_marks')
          .in('id', assignmentIds);
        
        const assignmentMap = new Map((assignments || []).map(a => [a.id, a]));
        
        setRecentAssignments(assignmentSubmissions.map(s => {
          const assignment = assignmentMap.get(s.assignment_id);
          const totalMarks = assignment?.total_marks || 100;
          const passingMarks = assignment?.passing_marks || 40;
          return {
            id: s.id,
            title: assignment?.title || 'Unknown Assignment',
            marks_obtained: s.marks_obtained,
            total_marks: totalMarks,
            passing_marks: passingMarks,
            passed: (s.marks_obtained || 0) >= passingMarks,
            submitted_at: s.submitted_at || '',
          };
        }));
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const getWeeklyPoints = async (studentId: string): Promise<number> => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const { data } = await supabase
      .from('student_xp_transactions')
      .select('points_earned')
      .eq('student_id', studentId)
      .gte('earned_at', weekAgo.toISOString());
    
    return data?.reduce((sum, t) => sum + t.points_earned, 0) || 0;
  };

  const loadProjectData = async (authUserId: string) => {
    // First get the student record ID from the students table
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', authUserId)
      .single();
    
    const studentRecordId = studentRecord?.id;
    if (!studentRecordId) {
      return { active: 0, completed: 0 };
    }
    
    const { data } = await supabase
      .from('project_members')
      .select('project_id, projects(status)')
      .eq('student_id', studentRecordId);
    
    const projects = data || [];
    return {
      active: projects.filter(p => (p.projects as any)?.status === 'ongoing' || (p.projects as any)?.status === 'yet_to_start').length,
      completed: projects.filter(p => (p.projects as any)?.status === 'completed').length
    };
  };

  const loadCourseData = async (studentId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('class_id')
      .eq('id', studentId)
      .single();
    
    if (!profile?.class_id) return 0;
    
    const { count } = await supabase
      .from('course_class_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', profile.class_id);
    
    return count || 0;
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

  const totalBreakdown = gamification 
    ? Object.values(gamification.points_breakdown).reduce((a, b) => a + b, 0) || 1
    : 1;

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Track your progress and achievements</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesEnrolled}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">{completedProjects} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(gamification?.total_points || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+{gamification?.weekly_points || 0} this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Rank</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">#{gamification?.current_rank || '-'}</div>
              <p className="text-xs text-muted-foreground">In your class</p>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Summary */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realtimeStreak?.current_streak || gamification?.streak_days || 0} days</div>
              <p className="text-xs text-muted-foreground">Keep it going!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Points</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{gamification?.weekly_points || 0}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gamification?.badges_earned.length || 0}</div>
              <p className="text-xs text-muted-foreground">{gamification?.badges_locked.length || 0} more to unlock</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Performance */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Assessments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Recent Assessments
                </CardTitle>
                <CardDescription>Your latest assessment results</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {recentAssessments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No assessments completed yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{assessment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assessment.submitted_at ? format(new Date(assessment.submitted_at), 'PP') : '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge variant={assessment.passed ? 'default' : 'secondary'} className="shrink-0">
                          {assessment.percentage.toFixed(0)}%
                        </Badge>
                        {assessment.passed ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Assignments
                </CardTitle>
                <CardDescription>Your latest assignment grades</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {recentAssignments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No assignments submitted yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{assignment.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {assignment.submitted_at ? format(new Date(assignment.submitted_at), 'PP') : '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <Badge variant={assignment.passed ? 'default' : 'secondary'} className="shrink-0">
                          {assignment.marks_obtained !== null ? `${assignment.marks_obtained}/${assignment.total_marks}` : 'Pending'}
                        </Badge>
                        {assignment.marks_obtained !== null && (
                          assignment.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Badges */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your latest earned badges</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to={gamificationPath}>
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {gamification?.badges_earned.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No badges earned yet. Keep learning to unlock achievements!</p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {gamification?.badges_earned.slice(0, 5).map((badge) => (
                  <div
                    key={badge.id}
                    className="flex-shrink-0 w-32 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4 text-center hover:border-primary/40 transition-colors"
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <div className="font-semibold text-sm">{badge.name}</div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboards and Points Breakdown */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Class XP Leaderboard */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Class Leaderboard</CardTitle>
                <CardDescription className="text-xs">Top performers by XP</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={gamificationPath}>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Trophy className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No data yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between rounded-lg p-2 transition-colors ${
                        entry.isCurrentUser 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-muted/50 hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          entry.rank === 1 ? 'bg-yellow-500 text-white' :
                          entry.rank === 2 ? 'bg-gray-400 text-white' :
                          entry.rank === 3 ? 'bg-orange-600 text-white' :
                          'bg-muted-foreground/20 text-muted-foreground'
                        }`}>
                          {entry.rank}
                        </div>
                        <div>
                          <div className="font-medium text-sm flex items-center gap-1">
                            {entry.name}
                            {entry.isCurrentUser && <Badge variant="secondary" className="text-[10px] px-1 py-0">You</Badge>}
                          </div>
                        </div>
                      </div>
                      <span className="font-bold text-primary text-sm">{entry.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Streak Leaderboard */}
          <StreakLeaderboard institutionId={user?.institution_id} limit={5} compact />

          <Card>
            <CardHeader>
              <CardTitle>Points Breakdown</CardTitle>
              <CardDescription>See where your points come from</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {gamification && Object.entries(gamification.points_breakdown).map(([category, points]) => {
                const percentage = (points / totalBreakdown) * 100;
                return (
                  <div key={category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="capitalize font-medium text-sm">{category}</span>
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
        </div>

        {/* Locked Badges */}
        {gamification?.badges_locked && gamification.badges_locked.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Locked Badges - Keep Working!</CardTitle>
              <CardDescription>Complete these goals to unlock achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {gamification.badges_locked.map((badge) => (
                  <div key={badge.id} className="rounded-lg border p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl opacity-60">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{badge.name}</div>
                          <Badge variant="outline">{badge.progress}%</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{badge.description}</p>
                        <Progress value={badge.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {badge.points_required} points required
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
