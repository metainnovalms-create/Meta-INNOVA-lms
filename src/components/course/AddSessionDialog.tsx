import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CourseSession } from '@/types/course';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';

interface AddSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sessionData: Partial<CourseSession>) => void;
  session?: CourseSession | null;
  moduleName: string;
}

export function AddSessionDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  session,
  moduleName 
}: AddSessionDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>(['']);

  useEffect(() => {
    if (session) {
      setTitle(session.title);
      setDescription(session.description);
      setLearningObjectives(session.learning_objectives || ['']);
    } else {
      resetForm();
    }
  }, [session, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLearningObjectives(['']);
  };

  const handleAddObjective = () => {
    setLearningObjectives([...learningObjectives, '']);
  };

  const handleRemoveObjective = (index: number) => {
    const updated = learningObjectives.filter((_, i) => i !== index);
    setLearningObjectives(updated.length ? updated : ['']);
  };

  const handleObjectiveChange = (index: number, value: string) => {
    const updated = [...learningObjectives];
    updated[index] = value;
    setLearningObjectives(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a session title');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a session description');
      return;
    }

    const filteredObjectives = learningObjectives.filter(obj => obj.trim());

    const sessionData: Partial<CourseSession> = {
      title: title.trim(),
      description: description.trim(),
      learning_objectives: filteredObjectives.length ? filteredObjectives : undefined,
    };

    onSave(sessionData);
    resetForm();
    onOpenChange(false);
    toast.success(session ? 'Session updated successfully' : 'Session added successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {session ? 'Edit Session' : `Add Session to ${moduleName}`}
          </DialogTitle>
          <DialogDescription>
            Sessions are logical groupings of content within a module (like "Lesson 1", "Lesson 2")
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="session-title">Session Title *</Label>
            <Input
              id="session-title"
              placeholder="e.g., Introduction to AI Concepts"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="session-description">Description *</Label>
            <Textarea
              id="session-description"
              placeholder="Brief overview of what this session covers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          
          <div>
            <Label>Learning Objectives</Label>
            <div className="space-y-2">
              {learningObjectives.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Learning objective ${index + 1}`}
                    value={objective}
                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                  />
                  {learningObjectives.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveObjective(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleAddObjective}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Objective
            </Button>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {session ? 'Save Changes' : 'Add Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
