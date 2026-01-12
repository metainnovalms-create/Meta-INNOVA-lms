import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Upload, Award, Users, Globe, ToggleLeft, ToggleRight, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useInstitutionProjects, useUpdateProject, useDeleteProject, ProjectWithRelations } from "@/hooks/useProjects";
import { CreateProjectDialog } from "@/components/project/CreateProjectDialog";
import { EditProjectDialog } from "@/components/project/EditProjectDialog";
import { AddProgressDialog } from "@/components/project/AddProgressDialog";
import { ProjectDetailsDialog } from "@/components/project/ProjectDetailsDialog";
import { AddAchievementDialog } from "@/components/project/AddAchievementDialog";
import { ManageTeamDialog } from "@/components/project/ManageTeamDialog";
import { SDGGoalBadges } from "@/components/project/SDGGoalSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { useOfficerByUserId } from "@/hooks/useOfficerProfile";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const STATUS_CONFIG = {
  yet_to_start: { label: 'Yet to Start', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  ongoing: { label: 'Ongoing', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  completed: { label: 'Completed', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
};

export default function OfficerProjects() {
  const { user } = useAuth();
  const { data: officerProfile } = useOfficerByUserId(user?.id);
  
  const institutionId = user?.institution_id || null;
  const officerId = officerProfile?.id || '';
  const officerName = officerProfile?.full_name || user?.name || '';

  const { data: projects = [], isLoading } = useInstitutionProjects(institutionId);
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAchievementDialogOpen, setIsAchievementDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithRelations | null>(null);

  const filteredProjects = projects.filter(project => 
    filterStatus === "all" || project.status === filterStatus
  );

  const handleTogglePublish = async (project: ProjectWithRelations) => {
    await updateProject.mutateAsync({
      id: project.id,
      is_published: !project.is_published,
    });
  };

  const handleToggleShowcase = async (project: ProjectWithRelations) => {
    await updateProject.mutateAsync({
      id: project.id,
      is_showcase: !project.is_showcase,
    });
  };

  const handleStatusChange = async (project: ProjectWithRelations, newStatus: 'yet_to_start' | 'ongoing' | 'completed') => {
    const updates: any = { id: project.id, status: newStatus };
    if (newStatus === 'completed') {
      updates.progress = 100;
      updates.actual_completion_date = new Date().toISOString().split('T')[0];
    }
    await updateProject.mutateAsync(updates);
  };

  const handleDeleteProject = async () => {
    if (selectedProject) {
      await deleteProject.mutateAsync(selectedProject.id);
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    }
  };

  const yetToStartCount = projects.filter(p => p.status === 'yet_to_start').length;
  const ongoingCount = projects.filter(p => p.status === 'ongoing').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Innovation Projects</h1>
          <p className="text-muted-foreground">
            Create, manage, and mentor student innovation projects
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Yet to Start</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{yetToStartCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ongoing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ongoingCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              <SelectItem value="yet_to_start">Yet to Start</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setIsCreateDialogOpen(true)} disabled={!officerId}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </div>

        {/* Projects List */}
        {isLoading ? (
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
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((project) => {
              const statusInfo = STATUS_CONFIG[project.status] || STATUS_CONFIG.yet_to_start;
              
              return (
                <Card key={project.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {project.title}
                          {project.is_showcase && (
                            <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                              ⭐ Showcase
                            </Badge>
                          )}
                          {project.is_published && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                              Published
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={project.status}
                          onValueChange={(value: 'yet_to_start' | 'ongoing' | 'completed') => 
                            handleStatusChange(project, value)
                          }
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yet_to_start">Yet to Start</SelectItem>
                            <SelectItem value="ongoing">Ongoing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} />
                    </div>

                    {/* SDG Goals */}
                    {project.sdg_goals && (project.sdg_goals as number[]).length > 0 && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <SDGGoalBadges goals={project.sdg_goals as number[]} maxDisplay={4} />
                      </div>
                    )}

                    {/* Project Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Category</span>
                        <p className="font-medium">{project.category}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Team</span>
                        <p className="font-medium">{project.project_members?.length || 0} students</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Achievements</span>
                        <p className="font-medium">{project.project_achievements?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Created by</span>
                        <p className="font-medium truncate">{project.created_by_officer_name}</p>
                      </div>
                    </div>

                    {/* Remarks */}
                    {project.remarks && (
                      <div className="text-sm p-3 bg-muted/50 rounded-md">
                        <span className="text-muted-foreground">Remarks: </span>
                        {project.remarks}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
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

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsTeamDialogOpen(true);
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Manage Team
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsProgressDialogOpen(true);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Update Progress
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsAchievementDialogOpen(true);
                        }}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Add Achievement
                      </Button>

                      <Button
                        variant={project.is_published ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTogglePublish(project)}
                      >
                        {project.is_published ? (
                          <ToggleRight className="h-4 w-4 mr-2" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 mr-2" />
                        )}
                        {project.is_published ? 'Unpublish' : 'Publish'}
                      </Button>

                      {project.status === 'completed' && (
                        <Button
                          variant={project.is_showcase ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleShowcase(project)}
                        >
                          {project.is_showcase ? '★ Showcased' : '☆ Showcase'}
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedProject(project);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredProjects.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {projects.length === 0 
                      ? "No projects yet. Create your first project!" 
                      : "No projects found for the selected filter"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      {institutionId && officerId && (
        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          institutionId={institutionId}
          officerId={officerId}
          officerName={officerName}
        />
      )}

      {selectedProject && (
        <>
          <EditProjectDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            project={selectedProject}
          />

          <AddProgressDialog
            open={isProgressDialogOpen}
            onOpenChange={setIsProgressDialogOpen}
            projectId={selectedProject.id}
            projectTitle={selectedProject.title}
            currentProgress={selectedProject.progress}
            officerId={officerId}
            officerName={officerName}
          />

          <ProjectDetailsDialog
            open={isDetailsDialogOpen}
            onOpenChange={setIsDetailsDialogOpen}
            project={selectedProject}
          />

          <AddAchievementDialog
            open={isAchievementDialogOpen}
            onOpenChange={setIsAchievementDialogOpen}
            projectId={selectedProject.id}
            officerId={officerId}
          />

          {institutionId && (
            <ManageTeamDialog
              open={isTeamDialogOpen}
              onOpenChange={setIsTeamDialogOpen}
              project={selectedProject}
              institutionId={institutionId}
              officerId={officerId}
            />
          )}
        </>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedProject?.title}"? This action cannot be undone.
              All project members, achievements, and progress updates will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
