import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskPriority, TaskCategory } from '@/types/task';
import { AssigneeSelector } from './AssigneeSelector';
import { toast } from 'sonner';

interface Assignee {
  id: string;
  userId?: string;
  name: string;
  position: string;
  avatar?: string;
  type: 'meta_employee' | 'officer';
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    assigned_to_id: string;
    assigned_to_name: string;
    assigned_to_position: string;
    assigned_to_role: string;
    due_date: string;
  }) => void;
  currentUser: {
    id: string;
    name: string;
    position: string;
  };
}

export function CreateTaskDialog({ open, onOpenChange, onCreateTask, currentUser }: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'administrative' as TaskCategory,
    priority: 'medium' as TaskPriority,
    due_date: '',
  });
  const [selectedAssignee, setSelectedAssignee] = useState<Assignee | null>(null);

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a task description');
      return;
    }
    if (!selectedAssignee) {
      toast.error('Please select an assignee');
      return;
    }
    if (!formData.due_date) {
      toast.error('Please select a due date');
      return;
    }

    onCreateTask({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      priority: formData.priority,
      assigned_to_id: selectedAssignee.id,
      assigned_to_name: selectedAssignee.name,
      assigned_to_position: selectedAssignee.position,
      assigned_to_role: selectedAssignee.type === 'officer' ? 'officer' : 'system_admin',
      due_date: new Date(formData.due_date).toISOString(),
    });
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      category: 'administrative',
      priority: 'medium',
      due_date: '',
    });
    setSelectedAssignee(null);
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as TaskCategory }))}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrative">Administrative</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="strategic">Strategic</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskPriority }))}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To *</Label>
            <AssigneeSelector
              value={selectedAssignee?.id || ''}
              onValueChange={setSelectedAssignee}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date *</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
