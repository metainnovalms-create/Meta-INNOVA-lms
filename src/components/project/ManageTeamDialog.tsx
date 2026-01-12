import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProjectStudentSelector } from './ProjectStudentSelector';
import { 
  useAddProjectMembers, 
  useRemoveProjectMember, 
  useUpdateProjectMember 
} from '@/hooks/useProjectMembers';
import { ProjectWithRelations } from '@/hooks/useProjects';
import { User, Crown, Trash2, UserPlus } from 'lucide-react';

interface ManageTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectWithRelations;
  institutionId: string;
  officerId: string;
}

export function ManageTeamDialog({
  open,
  onOpenChange,
  project,
  institutionId,
  officerId,
}: ManageTeamDialogProps) {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [newMembers, setNewMembers] = useState<string[]>([]);

  const addMembers = useAddProjectMembers();
  const removeMember = useRemoveProjectMember();
  const updateMember = useUpdateProjectMember();

  const existingMemberIds = project.project_members?.map(m => m.student_id) || [];

  const handleAddMembers = async () => {
    if (newMembers.length === 0) return;

    await addMembers.mutateAsync(
      newMembers.map(studentId => ({
        project_id: project.id,
        student_id: studentId,
        role: 'member',
        assigned_by_officer_id: officerId,
      }))
    );

    setNewMembers([]);
    setShowAddMembers(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Remove this student from the project?')) {
      await removeMember.mutateAsync(memberId);
    }
  };

  const handleToggleLeader = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'leader' ? 'member' : 'leader';
    await updateMember.mutateAsync({ id: memberId, role: newRole as 'leader' | 'member' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Team</DialogTitle>
          <p className="text-sm text-muted-foreground">{project.title}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">
                Current Members ({project.project_members?.length || 0})
              </h4>
              {!showAddMembers && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddMembers(true)}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {project.project_members && project.project_members.length > 0 ? (
              <div className="space-y-2">
                {project.project_members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.student?.student_name}</p>
                        <Badge 
                          variant={member.role === 'leader' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {member.role === 'leader' && <Crown className="h-3 w-3 mr-1" />}
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLeader(member.id, member.role)}
                        title={member.role === 'leader' ? 'Remove as leader' : 'Make leader'}
                      >
                        <Crown className={`h-4 w-4 ${member.role === 'leader' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No members assigned yet
              </p>
            )}
          </div>

          {/* Add Members Section */}
          {showAddMembers && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Add Students</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddMembers(false);
                      setNewMembers([]);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
                <ProjectStudentSelector
                  institutionId={institutionId}
                  selectedStudents={newMembers}
                  onChange={setNewMembers}
                  excludeStudentIds={existingMemberIds}
                />
                <Button
                  className="w-full"
                  onClick={handleAddMembers}
                  disabled={newMembers.length === 0 || addMembers.isPending}
                >
                  {addMembers.isPending ? 'Adding...' : `Add ${newMembers.length} Student(s)`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
