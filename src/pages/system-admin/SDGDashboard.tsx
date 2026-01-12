import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SDG_GOALS, sdgService, getSDGByNumber } from "@/services/sdg.service";
import { SDGAnalytics } from "@/types/sdg";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Target, BookOpen, FolderKanban, Building2, Loader2, Users } from "lucide-react";

export default function SDGDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<SDGAnalytics[]>([]);
  const [institutionsCount, setInstitutionsCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [analyticsData, institutions] = await Promise.all([
          sdgService.getSDGAnalytics(),
          sdgService.getInstitutionsWithSDGs()
        ]);
        setAnalytics(analyticsData);
        setInstitutionsCount(institutions.length);
      } catch (error) {
        console.error('Error loading SDG analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter only SDGs that have courses or projects
  const activeSDGs = analytics.filter(a => a.course_count > 0 || a.project_count > 0);
  
  const totalCoursesWithSDG = activeSDGs.reduce((sum, a) => sum + a.course_count, 0);
  const totalProjectsWithSDG = activeSDGs.reduce((sum, a) => sum + a.project_count, 0);
  const totalStudentsImpacted = activeSDGs.reduce((sum, a) => sum + a.total_students_impacted, 0);
  const totalSDGsInUse = activeSDGs.length;

  // Prepare chart data
  const chartData = activeSDGs.map(a => ({
    name: `SDG ${a.sdg_info.number}`,
    courses: a.course_count,
    projects: a.project_count,
    color: a.sdg_info.color
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses with SDGs</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoursesWithSDG}</div>
            <p className="text-xs text-muted-foreground">Mapped to SDG goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects with SDGs</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjectsWithSDG}</div>
            <p className="text-xs text-muted-foreground">Student projects aligned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SDGs in Use</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSDGsInUse}</div>
            <p className="text-xs text-muted-foreground">Out of 17 goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students Impacted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsImpacted}</div>
            <p className="text-xs text-muted-foreground">In SDG projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Institutions Engaged</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutionsCount}</div>
            <p className="text-xs text-muted-foreground">Participating institutions</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>SDG Distribution</CardTitle>
            <p className="text-sm text-muted-foreground">Courses and projects mapped to each SDG goal</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Bar dataKey="courses" fill="hsl(var(--primary))" name="Courses" />
                <Bar dataKey="projects" fill="hsl(var(--secondary))" name="Projects" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* SDG Details Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Active SDG Goals</CardTitle>
          <p className="text-sm text-muted-foreground">Detailed view of all active SDG mappings</p>
        </CardHeader>
        <CardContent>
          {activeSDGs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No SDG mappings yet</p>
              <p className="text-sm">Map courses and projects to SDGs to see analytics</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSDGs.map((analyticsItem) => (
                <Card key={analyticsItem.sdg_goal}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: analyticsItem.sdg_info.color }}
                      />
                      <CardTitle className="text-base">
                        {analyticsItem.sdg_info.number}. {analyticsItem.sdg_info.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {analyticsItem.sdg_info.description}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {analyticsItem.course_count} {analyticsItem.course_count === 1 ? 'Course' : 'Courses'}
                      </Badge>
                      <Badge variant="outline">
                        {analyticsItem.project_count} {analyticsItem.project_count === 1 ? 'Project' : 'Projects'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
