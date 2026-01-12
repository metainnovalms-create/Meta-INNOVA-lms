import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users, Target, TrendingUp, Award, ExternalLink, Trash2, FileText, Clock } from "lucide-react";
import { SDGGoalBadges, SDG_GOALS } from "./SDGGoalSelector";
import { format } from "date-fns";

// Support both old Project type and new ProjectWithRelations
interface BaseProject {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  category: string;
  progress: number;
  is_showcase?: boolean;
  created_by_officer_name: string;
  start_date?: string | null;
  target_completion_date?: string | null;
  actual_completion_date?: string | null;
  sdg_goals?: number[] | any[];
  remarks?: string | null;
  is_published?: boolean;
}

interface ProjectMember {
  id: string;
  student_id?: string;
  role: string;
  student?: {
    id: string;
    student_name: string;
    class_id?: string | null;
  } | null;
  // Old format support
  name?: string;
  class?: string;
  section?: string;
}

interface ProjectAchievement {
  id: string;
  title: string;
  type: string;
  event_name?: string | null;
  event_date?: string | null;
  certificate_url?: string | null;
  created_at: string;
}

interface ProjectProgressUpdate {
  id?: string;
  notes: string;
  progress_percentage?: number | null;
  updated_by_officer_name?: string;
  created_at?: string;
  // Old format support
  date?: string;
  updated_by?: string;
}

interface ProjectWithRelations extends BaseProject {
  project_members?: ProjectMember[];
  project_achievements?: ProjectAchievement[];
  project_progress_updates?: ProjectProgressUpdate[];
  // Old format support
  team_members?: ProjectMember[];
  progress_updates?: ProjectProgressUpdate[];
  achievements?: string[];
  awards?: string[];
  completion_date?: string;
  class?: string;
}

interface ProjectDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations | null;
  canDelete?: boolean;
  onDelete?: (projectId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  yet_to_start: { label: 'Yet to Start', className: 'bg-slate-500/10 text-slate-500 border-slate-500/20' },
  ongoing: { label: 'Ongoing', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  completed: { label: 'Completed', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  in_progress: { label: 'In Progress', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  approved: { label: 'Approved', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
  proposal: { label: 'Proposal', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export function ProjectDetailsDialog({
  open,
  onOpenChange,
  project,
  canDelete = false,
  onDelete,
}: ProjectDetailsDialogProps) {
  if (!project) return null;

  const statusConfig = STATUS_CONFIG[project.status] || { label: project.status, className: 'bg-muted text-muted-foreground' };
  
  // Support both new and old data formats
  const members = project.project_members || project.team_members || [];
  const achievements = project.project_achievements || [];
  const progressUpdates = project.project_progress_updates || project.progress_updates || [];
  const sdgGoals = (project.sdg_goals || []) as number[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">{project.title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Created by {project.created_by_officer_name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              {project.is_published && <Badge variant="outline" className="bg-green-50 text-green-700">Published</Badge>}
              {project.is_showcase && <Badge className="bg-yellow-500/10 text-yellow-600">⭐ Showcase</Badge>}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-2" />
            </div>

            {/* Description */}
            {project.description && (
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Category:</span>
                <span>{project.category}</span>
              </div>
              {project.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start:</span>
                  <span>{format(new Date(project.start_date), 'MMM dd, yyyy')}</span>
                </div>
              )}
              {project.target_completion_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Target:</span>
                  <span>{format(new Date(project.target_completion_date), 'MMM dd, yyyy')}</span>
                </div>
              )}
            </div>

            {/* SDG Goals */}
            {sdgGoals.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">SDG Goals</h4>
                <SDGGoalBadges goals={sdgGoals} maxDisplay={10} />
              </div>
            )}

            {/* Remarks */}
            {project.remarks && (
              <div>
                <h4 className="text-sm font-medium mb-2">Remarks</h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {project.remarks}
                </p>
              </div>
            )}

            <Separator />

            {/* Team Members */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Team Members ({members.length})
              </h4>
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member, idx) => {
                    const memberName = member.student?.student_name || member.name || 'Unknown Student';
                    return (
                      <div key={member.id || idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-md">
                        <span>{memberName}</span>
                        <Badge variant={member.role === 'leader' ? 'default' : 'secondary'} className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No team members assigned</p>
              )}
            </div>

            <Separator />

            {/* Achievements - New format */}
            {achievements.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Achievements & Awards ({achievements.length})
                </h4>
                <div className="space-y-2">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between text-sm p-3 border rounded-md">
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {achievement.event_name}
                          {achievement.event_date && ` • ${format(new Date(achievement.event_date), 'MMM dd, yyyy')}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {achievement.type}
                        </Badge>
                        {achievement.certificate_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(achievement.certificate_url!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements - Old format */}
            {project.achievements && project.achievements.length > 0 && !achievements.length && (
              <div>
                <h4 className="text-sm font-medium mb-2">Achievements</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {project.achievements.map((achievement, index) => (
                    <li key={index}>{achievement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Awards - Old format */}
            {project.awards && project.awards.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Awards</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {project.awards.map((award, index) => (
                    <li key={index}>{award}</li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Progress Updates - Timeline View */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Progress Timeline ({progressUpdates.length} updates)
              </h4>
              {progressUpdates.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                  
                  <div className="space-y-4">
                    {[...progressUpdates]
                      .sort((a, b) => {
                        const dateA = a.created_at || a.date || '';
                        const dateB = b.created_at || b.date || '';
                        return new Date(dateB).getTime() - new Date(dateA).getTime();
                      })
                      .map((update, idx) => {
                        const updateDate = update.created_at || update.date;
                        const updatedBy = update.updated_by_officer_name || update.updated_by || 'Unknown';
                        return (
                          <div key={update.id || idx} className="relative pl-8">
                            {/* Timeline dot */}
                            <div className="absolute left-1.5 top-2 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                            
                            <div className="text-sm p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                              {/* Date header - prominent */}
                              <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                                <Calendar className="h-4 w-4 text-primary" />
                                {updateDate ? (
                                  <div className="flex-1">
                                    <span className="font-semibold text-primary">
                                      {format(new Date(updateDate), 'EEEE, MMMM dd, yyyy')}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      at {format(new Date(updateDate), 'hh:mm a')}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">Date not available</span>
                                )}
                                {update.progress_percentage !== null && update.progress_percentage !== undefined && (
                                  <Badge variant="default" className="text-xs font-bold">
                                    {update.progress_percentage}%
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Remark/Notes */}
                              <div className="space-y-2">
                                <p className="text-foreground leading-relaxed">{update.notes}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Updated by {updatedBy}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border rounded-lg bg-muted/30">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No progress updates yet</p>
                </div>
              )}
            </div>

            {/* Delete Button for CEO */}
            {canDelete && onDelete && (
              <>
                <Separator />
                <div className="pt-2">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                        onDelete(project.id);
                        onOpenChange(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
