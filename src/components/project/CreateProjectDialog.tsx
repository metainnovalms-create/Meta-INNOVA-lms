import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SDGGoalSelector } from './SDGGoalSelector';
import { ProjectStudentSelector } from './ProjectStudentSelector';
import { useCreateProject } from '@/hooks/useProjects';
import { useAddProjectMembers } from '@/hooks/useProjectMembers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionId: string;
  officerId: string;
  officerName: string;
}

const PROJECT_CATEGORIES = [
  'IoT & Electronics',
  'Software & Apps',
  'Environment & Sustainability',
  'Health & Medicine',
  'Agriculture & Food',
  'Education & Social',
  'Robotics & Automation',
  'AI & Machine Learning',
  'General',
  'Other',
];

export function CreateProjectDialog({
  open,
  onOpenChange,
  institutionId,
  officerId,
  officerName,
}: CreateProjectDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    status: 'yet_to_start' as 'yet_to_start' | 'ongoing' | 'completed',
    sdgGoals: [] as number[],
    remarks: '',
    startDate: '',
    targetCompletionDate: '',
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const createProject = useCreateProject();
  const addMembers = useAddProjectMembers();

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    try {
      const project = await createProject.mutateAsync({
        institution_id: institutionId,
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        status: formData.status,
        sdg_goals: formData.sdgGoals,
        remarks: formData.remarks || undefined,
        start_date: formData.startDate || undefined,
        target_completion_date: formData.targetCompletionDate || undefined,
        created_by_officer_id: officerId,
        created_by_officer_name: officerName,
      });

      // Add selected students as members
      if (selectedStudents.length > 0) {
        await addMembers.mutateAsync(
          selectedStudents.map((studentId, index) => ({
            project_id: project.id,
            student_id: studentId,
            role: index === 0 ? 'leader' : 'member',
            assigned_by_officer_id: officerId,
          }))
        );
      }

      // Reset form and close
      setFormData({
        title: '',
        description: '',
        category: 'General',
        status: 'yet_to_start',
        sdgGoals: [],
        remarks: '',
        startDate: '',
        targetCompletionDate: '',
      });
      setSelectedStudents([]);
      setActiveTab('details');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const isSubmitting = createProject.isPending || addMembers.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="sdg">SDG Goals</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the project objectives and scope"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'yet_to_start' | 'ongoing' | 'completed') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Completion</Label>
                <Input
                  id="targetDate"
                  type="date"
                  value={formData.targetCompletionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetCompletionDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any additional notes or remarks"
                rows={2}
              />
            </div>
          </TabsContent>

          <TabsContent value="sdg" className="mt-4">
            <div className="space-y-2">
              <Label>Select SDG Goals (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Choose the Sustainable Development Goals related to this project
              </p>
              <SDGGoalSelector
                selectedGoals={formData.sdgGoals}
                onChange={(goals) => setFormData(prev => ({ ...prev, sdgGoals: goals }))}
              />
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-4">
            <div className="space-y-2">
              <Label>Assign Students</Label>
              <p className="text-sm text-muted-foreground">
                Select students to add to this project. The first selected student will be assigned as team leader.
              </p>
              <ProjectStudentSelector
                institutionId={institutionId}
                selectedStudents={selectedStudents}
                onChange={setSelectedStudents}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim() || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
