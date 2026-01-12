import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, FolderKanban, Users, TrendingUp, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SDG_GOALS, getSDGByNumber } from '@/services/sdg.service';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ManagementSDGDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [sdgCounts, setSDGCounts] = useState<Record<number, number>>({});
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const loadInstitutionSDGData = async () => {
      if (!user?.tenant_id) return;
      setLoading(true);

      try {
        // Get projects for this institution
        const { data } = await supabase
          .from('projects')
          .select('id, title, sdg_goals, status, progress, category')
          .eq('institution_id', user.tenant_id);

        const institutionProjects = data || [];
        
        // Calculate SDG counts
        const counts: Record<number, number> = {};

        institutionProjects.forEach(p => {
          const goals = p.sdg_goals as number[] | null;
          goals?.forEach(g => {
            counts[g] = (counts[g] || 0) + 1;
          });
        });

        // Get project IDs that have SDGs assigned
        const sdgProjectIds = institutionProjects
          .filter(p => {
            const goals = p.sdg_goals as number[] | null;
            return goals && goals.length > 0;
          })
          .map(p => p.id);

        // Count unique students in SDG-aligned projects
        let studentsInSDGProjects = 0;
        if (sdgProjectIds.length > 0) {
          const { data: members } = await supabase
            .from('project_members')
            .select('student_id')
            .in('project_id', sdgProjectIds);
          
          const uniqueStudents = new Set(members?.map(m => m.student_id) || []);
          studentsInSDGProjects = uniqueStudents.size;
        }

        setProjects(institutionProjects);
        setSDGCounts(counts);
        setTotalStudents(studentsInSDGProjects);
      } catch (error) {
        console.error('Error loading SDG data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInstitutionSDGData();
  }, [user?.tenant_id]);

  const activeSDGs = Object.keys(sdgCounts).map(Number).sort((a, b) => a - b);

  // Prepare chart data
  const chartData = activeSDGs.map(num => {
    const sdg = getSDGByNumber(num);
    return {
      name: `SDG ${num}`,
      projects: sdgCounts[num] || 0,
      color: sdg?.color || '#666'
    };
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      proposal: 'bg-yellow-500',
      approved: 'bg-blue-500',
      in_progress: 'bg-purple-500',
      completed: 'bg-green-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SDG Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track your institution's contribution to UN Sustainable Development Goals
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active SDGs</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSDGs.length}</div>
              <p className="text-xs text-muted-foreground">out of 17 goals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">SDG-aligned projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Involved</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">across all projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SDG Coverage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((activeSDGs.length / 17) * 100)}%</div>
              <p className="text-xs text-muted-foreground">of all SDG goals</p>
            </CardContent>
          </Card>
        </div>

        {/* SDG Distribution Chart */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>SDG Distribution</CardTitle>
              <CardDescription>Number of projects per SDG goal</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
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
                  <Bar dataKey="projects" name="Projects">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Active SDG Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Active SDG Goals</CardTitle>
            <CardDescription>SDGs your institution is contributing to</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSDGs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No SDG-aligned projects yet</p>
                <p className="text-sm">Encourage students to create projects aligned with SDGs</p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {activeSDGs.map(num => {
                  const sdg = getSDGByNumber(num);
                  if (!sdg) return null;
                  
                  return (
                    <div 
                      key={num}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: sdg.color }}
                      >
                        {sdg.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{sdg.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {sdgCounts[num]} project{sdgCounts[num] !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by SDG</CardTitle>
            <CardDescription>All institution projects and their SDG alignment</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No projects yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map(project => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{project.title}</h3>
                        <p className="text-sm text-muted-foreground">{project.category}</p>
                      </div>
                      <Badge className={getStatusColor(project.status)}>
                        {project.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span>{project.progress || 0}% complete</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {(project.sdg_goals as number[] || []).map(num => {
                        const sdg = getSDGByNumber(num);
                        return sdg ? (
                          <Badge 
                            key={num}
                            style={{ backgroundColor: sdg.color, color: '#fff' }}
                            className="text-xs"
                          >
                            SDG {num}: {sdg.title}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
