import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Award, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProjectWithRelations } from "@/hooks/useProjects";
import { ProjectDetailsDialog } from "@/components/project/ProjectDetailsDialog";
import { SDGGoalBadges, SDG_GOALS } from "@/components/project/SDGGoalSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const STATUS_CONFIG = {
  yet_to_start: { label: 'Yet to Start', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  ongoing: { label: 'Ongoing', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  completed: { label: 'Completed', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

export default function StudentProjects() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // First get student ID from user_id
  const { data: studentData } = useQuery({
    queryKey: ['student-by-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Then get projects assigned to this student
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['student-projects', studentData?.id],
    queryFn: async () => {
      if (!studentData?.id) return [];
      
      // Get project IDs the student is a member of
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('student_id', studentData.id);
      
      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) return [];
      
      const projectIds = memberData.map(m => m.project_id);
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            id,
            student_id,
            role,
            student:students(id, student_name, class_id)
          ),
          project_achievements(
            id,
            title,
            type,
            event_name,
            event_date,
            certificate_url,
            created_at
          ),
          project_progress_updates(
            id,
            notes,
            progress_percentage,
            updated_by_officer_name,
            created_at
          )
        `)
        .in('id', projectIds)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ProjectWithRelations[];
    },
    enabled: !!studentData?.id,
  });

  const getMyRole = (project: ProjectWithRelations) => {
    const myMembership = project.project_members?.find(m => m.student_id === studentData?.id);
    return myMembership?.role || 'member';
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Innovation Projects</h1>
          <p className="text-muted-foreground">
            Track your innovation projects and collaborate with your team
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You are not part of any innovation project yet. Contact your innovation officer to join a project.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {projects.map((project) => {
              const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.yet_to_start;
              const myRole = getMyRole(project);
              const isLeader = myRole === 'leader';
              const latestUpdate = project.project_progress_updates
                ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
              
              return (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {project.title}
                          {isLeader && (
                            <Badge variant="outline" className="text-xs">Team Leader</Badge>
                          )}
                          {project.is_showcase && (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              ⭐ Showcase
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <Badge className={statusInfo.className}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Project Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                    </div>

                    {/* Project Details */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Team Members</h4>
                        <div className="space-y-1">
                          {project.project_members?.map((member) => (
                            <div key={member.id} className="flex items-center justify-between text-sm">
                              <span>{member.student?.student_name || 'Unknown'}</span>
                              {member.role === 'leader' && (
                                <Badge variant="outline" className="text-xs">Leader</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-2">Project Info</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mentor:</span>
                            <span className="font-medium">{project.created_by_officer_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium">{project.category}</span>
                          </div>
                          {project.start_date && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Started:</span>
                              <span className="font-medium">
                                {format(new Date(project.start_date), 'MMM dd, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SDG Goals */}
                    {project.sdg_goals && (project.sdg_goals as number[]).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">SDG Goals</h4>
                        <SDGGoalBadges goals={project.sdg_goals as number[]} maxDisplay={6} />
                      </div>
                    )}

                    {/* Achievements */}
                    {project.project_achievements && project.project_achievements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Achievements & Awards</h4>
                        <div className="space-y-2">
                          {project.project_achievements.map((achievement) => (
                            <div key={achievement.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-yellow-500" />
                                <span>{achievement.title}</span>
                              </div>
                              {achievement.certificate_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(achievement.certificate_url!, '_blank')}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Latest Update */}
                    {latestUpdate && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Latest Update</h4>
                        <div className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{format(new Date(latestUpdate.created_at), 'MMM dd, yyyy')}</span>
                            <span>by {latestUpdate.updated_by_officer_name}</span>
                          </div>
                          <p className="text-sm">{latestUpdate.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Full Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ProjectDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        project={selectedProject}
      />
    </Layout>
  );
}
