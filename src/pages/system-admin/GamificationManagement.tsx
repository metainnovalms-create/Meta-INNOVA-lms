import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  Award, 
  TrendingUp, 
  Plus, 
  Pencil, 
  Trash2,
  BarChart3,
  FileText,
  Loader2
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { GamificationStatsCards } from "@/components/gamification/GamificationStatsCards";
import { ActivityFeed } from "@/components/gamification/ActivityFeed";
import { BadgeConfigDialog } from "@/components/gamification/BadgeConfigDialog";
import { XPRuleEditor } from "@/components/gamification/XPRuleEditor";
import { StudentPerformanceTable } from "@/components/gamification/StudentPerformanceTable";
import { StudentPerformanceModal } from "@/components/gamification/StudentPerformanceModal";
import { LeaderboardConfigCard } from "@/components/gamification/LeaderboardConfigCard";
import { CertificateTemplateManager } from "@/components/gamification/CertificateTemplateManager";
import { StreakLeaderboard } from "@/components/gamification/StreakLeaderboard";
import { gamificationDbService, DBBadge, DBXPRule } from "@/services/gamification-db.service";
import { BadgeConfig, XPRule, StudentPerformance, LeaderboardConfig, GamificationStats, ActivityLog } from "@/types/gamification";
import { toast } from "sonner";

export default function GamificationManagement() {
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeConfig[]>([]);
  const [xpRules, setXpRules] = useState<XPRule[]>([]);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [leaderboards, setLeaderboards] = useState<LeaderboardConfig[]>([]);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeConfig | undefined>();
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [institutionFilter, setInstitutionFilter] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [badgesData, rulesData, statsData, activityData, leaderboardData, studentsData] = await Promise.all([
        gamificationDbService.getBadges(),
        gamificationDbService.getXPRules(),
        gamificationDbService.getGamificationStats(),
        gamificationDbService.getRecentActivity(10),
        gamificationDbService.getLeaderboardConfigs(),
        gamificationDbService.getLeaderboard(undefined, 50)
      ]);

      setBadges(badgesData.map(b => ({
        id: b.id,
        name: b.name,
        description: b.description || '',
        icon: b.icon,
        category: b.category as BadgeConfig['category'],
        unlock_criteria: {
          type: (b.unlock_criteria as any)?.type || 'custom',
          threshold: (b.unlock_criteria as any)?.threshold || 0,
          description: (b.unlock_criteria as any)?.description || ''
        },
        xp_reward: b.xp_reward,
        is_active: b.is_active,
        created_at: b.created_at,
        created_by: b.created_by || ''
      })));

      setXpRules(rulesData.map(r => ({
        id: r.id,
        activity: r.activity as XPRule['activity'],
        points: r.points,
        multiplier: r.multiplier || undefined,
        description: r.description || '',
        is_active: r.is_active
      })));

      setStats(statsData);
      setActivityLogs(activityData);
      setLeaderboards(leaderboardData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
      toast.error('Failed to load gamification data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBadge = async (badge: Partial<BadgeConfig>) => {
    try {
      if (editingBadge) {
        await gamificationDbService.updateBadge(editingBadge.id, {
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          unlock_criteria: badge.unlock_criteria,
          xp_reward: badge.xp_reward,
          is_active: badge.is_active
        });
        toast.success('Badge updated successfully');
      } else {
        await gamificationDbService.createBadge({
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          unlock_criteria: badge.unlock_criteria,
          xp_reward: badge.xp_reward,
          is_active: badge.is_active
        });
        toast.success('Badge created successfully');
      }
      loadData();
      setEditingBadge(undefined);
    } catch (error) {
      console.error('Error saving badge:', error);
      toast.error('Failed to save badge');
    }
  };

  const handleDeleteBadge = async (id: string) => {
    try {
      await gamificationDbService.deleteBadge(id);
      toast.success('Badge deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting badge:', error);
      toast.error('Failed to delete badge');
    }
  };

  const handleUpdateXPRule = async (rule: XPRule) => {
    try {
      await gamificationDbService.updateXPRule(rule.id, {
        points: rule.points,
        multiplier: rule.multiplier,
        description: rule.description,
        is_active: rule.is_active
      });
      toast.success('XP rule updated');
      loadData();
    } catch (error) {
      console.error('Error updating XP rule:', error);
      toast.error('Failed to update XP rule');
    }
  };

  const handleViewStudentDetails = (student: StudentPerformance) => {
    setSelectedStudent(student);
    setPerformanceModalOpen(true);
  };

  const handleAdjustPoints = async (studentId: string, points: number, reason: string) => {
    // This would require additional implementation
    toast.info('Point adjustment feature coming soon');
  };

  const handleSaveLeaderboard = async (config: LeaderboardConfig) => {
    try {
      await gamificationDbService.updateLeaderboardConfig(config.institution_id, config);
      toast.success('Leaderboard config saved');
      loadData();
    } catch (error) {
      console.error('Error saving leaderboard:', error);
      toast.error('Failed to save leaderboard config');
    }
  };

  const filteredStudents = students.filter(s => {
    if (institutionFilter !== "all" && s.institution_id !== institutionFilter) return false;
    return true;
  });

  const institutions = Array.from(new Map(students.map(s => [s.institution_id, { id: s.institution_id, name: s.institution_name }])).values());

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Trophy className="h-8 w-8 text-primary" />
              Gamification Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure and monitor gamification across all institutions
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="badges">
              <Award className="h-4 w-4 mr-2" />
              Badges & XP
            </TabsTrigger>
            <TabsTrigger value="certificates">
              <FileText className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Student Performance
            </TabsTrigger>
            <TabsTrigger value="leaderboards">
              <Trophy className="h-4 w-4 mr-2" />
              Leaderboards
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview Dashboard */}
          <TabsContent value="overview" className="space-y-6">
            {stats && <GamificationStatsCards stats={stats} />}

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Institutions</CardTitle>
                  <CardDescription>By average student points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.top_institutions.length === 0 && (
                      <p className="text-muted-foreground text-sm">No data yet</p>
                    )}
                    {stats?.top_institutions.map((inst, index) => (
                      <div key={inst.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <span className="text-sm font-bold">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{inst.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {inst.total_students} students
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {inst.avg_points} XP avg
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <ActivityFeed activities={activityLogs} />
            </div>
          </TabsContent>

          {/* Tab 2: Badges & XP Configuration */}
          <TabsContent value="badges" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Badge Management</CardTitle>
                    <CardDescription>Create and configure badges for students to earn</CardDescription>
                  </div>
                  <Button onClick={() => {
                    setEditingBadge(undefined);
                    setBadgeDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Badge
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Icon</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Criteria</TableHead>
                        <TableHead>XP Reward</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {badges.map((badge) => (
                        <TableRow key={badge.id}>
                          <TableCell className="text-2xl">{badge.icon}</TableCell>
                          <TableCell className="font-medium">{badge.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{badge.category}</Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {badge.unlock_criteria.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">+{badge.xp_reward} XP</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={badge.is_active ? "default" : "secondary"}>
                              {badge.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingBadge(badge);
                                  setBadgeDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteBadge(badge.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>XP Rules Configuration</CardTitle>
                <CardDescription>Configure points awarded for different activities</CardDescription>
              </CardHeader>
              <CardContent>
                <XPRuleEditor rules={xpRules} onUpdate={handleUpdateXPRule} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Certificates */}
          <TabsContent value="certificates" className="space-y-6">
            <CertificateTemplateManager />
          </TabsContent>

          {/* Tab 5: Student Performance */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Student Performance</CardTitle>
                    <CardDescription>View and manage student points and rankings</CardDescription>
                  </div>
                  <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Filter by institution" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Institutions</SelectItem>
                      {institutions.map(inst => (
                        <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <StudentPerformanceTable 
                  performances={filteredStudents}
                  onViewDetails={handleViewStudentDetails}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Leaderboards */}
          <TabsContent value="leaderboards" className="space-y-6">
            {/* Streak Leaderboard */}
            <div className="grid md:grid-cols-2 gap-6">
              <StreakLeaderboard limit={10} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    XP Leaderboard
                  </CardTitle>
                  <CardDescription>Top students by total points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {students.slice(0, 5).map((student, idx) => (
                      <div key={student.student_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm">#{idx + 1}</span>
                          <div>
                            <p className="font-medium text-sm">{student.student_name}</p>
                            <p className="text-xs text-muted-foreground">{student.institution_name}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{student.total_points} XP</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Institution Leaderboard Configs */}
            <h3 className="text-lg font-semibold mt-6">Institution Leaderboard Configurations</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaderboards.length === 0 && (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Leaderboard Configurations</h3>
                    <p className="text-muted-foreground">Leaderboards will appear when institutions are configured</p>
                  </CardContent>
                </Card>
              )}
              {leaderboards.map(config => (
                <LeaderboardConfigCard
                  key={config.id}
                  config={config}
                  students={students}
                  onSave={handleSaveLeaderboard}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <BadgeConfigDialog
          open={badgeDialogOpen}
          onOpenChange={setBadgeDialogOpen}
          badge={editingBadge}
          onSave={handleSaveBadge}
        />

        <StudentPerformanceModal
          open={performanceModalOpen}
          onOpenChange={setPerformanceModalOpen}
          student={selectedStudent}
          onAdjustPoints={handleAdjustPoints}
        />
      </div>
    </Layout>
  );
}
