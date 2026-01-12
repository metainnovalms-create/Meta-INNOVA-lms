import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getProjectsByOfficer, updateProject, Project } from '@/data/mockProjectData';
import { mockActivityEvents } from '@/data/mockEventsData';
import { toast } from 'sonner';
import { Users, Target } from 'lucide-react';

interface AssignProjectToEventDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officerId: string;
}

export function AssignProjectToEventDialog({
  eventId,
  open,
  onOpenChange,
  officerId
}: AssignProjectToEventDialogProps) {
  const event = mockActivityEvents.find(e => e.id === eventId);
  const allProjects = getProjectsByOfficer(officerId);
  const assignedProjectIds = event?.linked_project_ids || [];
  
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(assignedProjectIds);

  const handleToggleProject = (projectId: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSave = () => {
    if (!event) return;

    // Update event with assigned projects
    event.linked_project_ids = selectedProjectIds;

    // Update each project with event assignment
    allProjects.forEach(project => {
      if (selectedProjectIds.includes(project.id)) {
        // Assign project to event
        updateProject(project.institution_id, project.id, {
          event_id: eventId,
          event_title: event.title
        });
      } else if (project.event_id === eventId) {
        // Unassign project from event
        updateProject(project.institution_id, project.id, {
          event_id: undefined,
          event_title: undefined
        });
      }
    });

    toast.success(`Successfully assigned ${selectedProjectIds.length} project(s) to participate in ${event.title}`);
    onOpenChange(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'approved': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'proposal': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Assign Projects to Event</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select which projects will participate in "{event.title}"
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-3 pr-4">
            {allProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                You don't have any projects yet. Create a project first in the Projects menu.
              </div>
            ) : (
              allProjects.map((project) => {
                const isSelected = selectedProjectIds.includes(project.id);
                const teamLeader = project.team_members.find(m => m.role === 'leader');

                return (
                  <div
                    key={project.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleToggleProject(project.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleProject(project.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-semibold">{project.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {project.description}
                            </p>
                          </div>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.team_members.length} member{project.team_members.length !== 1 ? 's' : ''}
                          </span>
                          {teamLeader && (
                            <span className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              Led by {teamLeader.name}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {project.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Assign {selectedProjectIds.length} Project{selectedProjectIds.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
