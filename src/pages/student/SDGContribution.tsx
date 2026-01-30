import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, BookOpen, FolderKanban, TrendingUp, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sdgService, SDG_GOALS, getSDGByNumber } from '@/services/sdg.service';
import { supabase } from '@/integrations/supabase/client';

export default function SDGContribution() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [activeSDGs, setActiveSDGs] = useState<number[]>([]);

  useEffect(() => {
    const loadStudentSDGData = async () => {
      if (!user?.id) return;
      setLoading(true);

      try {
        // Step 1: Get student record from students table using auth user_id
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        let studentProjects: any[] = [];
        
        if (studentRecord?.id) {
          // Step 2: Get projects where student is a member using students.id
          const { data: memberProjects } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('student_id', studentRecord.id);

          const projectIds = memberProjects?.map(m => m.project_id) || [];

          if (projectIds.length > 0) {
            const { data } = await supabase
              .from('projects')
              .select('id, title, sdg_goals, status, progress, category')
              .in('id', projectIds);
            studentProjects = data || [];
          }
        }

        // Get courses assigned to student's class
        const { data: profile } = await supabase
          .from('profiles')
          .select('class_id')
          .eq('id', user.id)
          .single();

        let studentCourses: any[] = [];
        if (profile?.class_id) {
          const { data: assignments } = await supabase
            .from('course_class_assignments')
            .select(`
              courses (id, title, sdg_goals, course_code)
            `)
            .eq('class_id', profile.class_id);

          studentCourses = assignments?.map(a => a.courses).filter(Boolean) || [];
        }

        // Aggregate SDGs
        const sdgSet = new Set<number>();
        
        studentProjects.forEach(p => {
          const goals = p.sdg_goals as number[] | null;
          goals?.forEach(g => sdgSet.add(g));
        });

        studentCourses.forEach(c => {
          const goals = c?.sdg_goals as number[] | null;
          goals?.forEach(g => sdgSet.add(g));
        });

        setProjects(studentProjects);
        setCourses(studentCourses);
        setActiveSDGs(Array.from(sdgSet).sort((a, b) => a - b));
      } catch (error) {
        console.error('Error loading SDG data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentSDGData();
  }, [user?.id]);

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
          <h1 className="text-3xl font-bold tracking-tight">My SDG Contribution</h1>
          <p className="text-muted-foreground mt-2">
            Track your contribution to UN Sustainable Development Goals
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
              <p className="text-xs text-muted-foreground">Goals I'm working on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-xs text-muted-foreground">SDG-aligned projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
              <p className="text-xs text-muted-foreground">Courses with SDG alignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((activeSDGs.length / 17) * 100)}%</div>
              <p className="text-xs text-muted-foreground">of 17 SDG goals</p>
            </CardContent>
          </Card>
        </div>

        {/* SDG Goals I'm Working On */}
        <Card>
          <CardHeader>
            <CardTitle>SDG Goals I'm Contributing To</CardTitle>
            <CardDescription>UN Sustainable Development Goals covered by my work</CardDescription>
          </CardHeader>
          <CardContent>
            {activeSDGs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No SDG contributions yet</p>
                <p className="text-sm">Join projects or enroll in courses aligned with SDGs</p>
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
                        className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: sdg.color }}
                      >
                        {sdg.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{sdg.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{sdg.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Projects by SDG */}
        <Card>
          <CardHeader>
            <CardTitle>My Projects</CardTitle>
            <CardDescription>Projects I'm contributing to and their SDG alignment</CardDescription>
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
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>

                    <div className="flex flex-wrap gap-1 mt-3">
                      {(project.sdg_goals as number[] || []).map(num => {
                        const sdg = getSDGByNumber(num);
                        return sdg ? (
                          <Badge 
                            key={num}
                            style={{ backgroundColor: sdg.color, color: '#fff' }}
                            className="text-xs"
                          >
                            SDG {num}
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

        {/* My Courses Contributing to SDGs */}
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Courses I'm enrolled in and their SDG contributions</CardDescription>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No courses with SDG alignment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {courses.map(course => (
                  <div key={course.id} className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">{course.course_code}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(course.sdg_goals as number[] || []).map(num => {
                        const sdg = getSDGByNumber(num);
                        return sdg ? (
                          <Badge 
                            key={num}
                            style={{ backgroundColor: sdg.color, color: '#fff' }}
                            className="text-xs"
                          >
                            SDG {num}
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
