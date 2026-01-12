import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Award, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutionProjects, useDeleteProject, ProjectWithRelations } from "@/hooks/useProjects";
import { ProjectDetailsDialog } from "@/components/project/ProjectDetailsDialog";
import { SDGGoalBadges } from "@/components/project/SDGGoalSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const STATUS_CONFIG = {
  yet_to_start: { label: 'Yet to Start', variant: 'secondary' as const },
  ongoing: { label: 'Ongoing', variant: 'default' as const },
  completed: { label: 'Completed', variant: 'outline' as const },
};

interface ProjectRegistryTabProps {
  projects: ProjectWithRelations[];
  isLoading: boolean;
  isCeo: boolean;
  onDelete: (projectId: string) => void;
}

const ProjectRegistryTab = ({ projects, isLoading, isCeo, onDelete }: ProjectRegistryTabProps) => {
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No projects found for this institution</p>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => {
            const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.yet_to_start;
            
            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                        {project.is_showcase && (
                          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            ⭐ Showcase
                          </Badge>
                        )}
                        {project.is_published && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Published
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsDetailsDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      {isCeo && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                              onDelete(project.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Team Members</p>
                      <p className="text-sm font-medium">{project.project_members?.length || 0} students</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Category</p>
                      <p className="text-sm font-medium">{project.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Officer</p>
                      <p className="text-sm font-medium">{project.created_by_officer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                      <p className="text-sm font-medium">
                        {project.start_date 
                          ? format(new Date(project.start_date), 'MMM dd, yyyy')
                          : 'Not set'}
                      </p>
                    </div>
                  </div>

                  {/* SDG Goals */}
                  {project.sdg_goals && (project.sdg_goals as number[]).length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">UN SDG Goals</p>
                      <SDGGoalBadges goals={project.sdg_goals as number[]} maxDisplay={6} />
                    </div>
                  )}

                  {/* Achievements */}
                  {project.project_achievements && project.project_achievements.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Achievements</p>
                      <div className="flex flex-wrap gap-2">
                        {project.project_achievements.map((achievement) => (
                          <Badge key={achievement.id} variant="outline" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {achievement.title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      <ProjectDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        project={selectedProject}
        canDelete={isCeo}
        onDelete={onDelete}
      />
    </div>
  );
};

export default function ProjectsAndCertificates() {
  const { user } = useAuth();
  const institutionId = user?.institution_id || null;
  const isCeo = (user as any)?.is_ceo === true;

  const { data: projects = [], isLoading } = useInstitutionProjects(institutionId);
  const deleteProject = useDeleteProject();

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject.mutateAsync(projectId);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Projects & Awards</h1>
          <p className="text-muted-foreground">View innovation projects and awards managed by officers</p>
          {isCeo && (
            <Badge variant="outline" className="mt-2 bg-purple-50 text-purple-700">
              CEO Access - You can delete projects
            </Badge>
          )}
        </div>

        <ProjectRegistryTab 
          projects={projects} 
          isLoading={isLoading} 
          isCeo={isCeo}
          onDelete={handleDeleteProject}
        />
      </div>
    </Layout>
  );
}
