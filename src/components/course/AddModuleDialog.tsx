import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CourseModule } from '@/types/course';

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (module: Partial<CourseModule>) => void;
  module?: CourseModule | null;
}

export function AddModuleDialog({ open, onOpenChange, onSave, module }: AddModuleDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (module) {
      setTitle(module.title);
      setDescription(module.description);
    } else {
      setTitle('');
      setDescription('');
    }
  }, [module, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim()
    });

    setTitle('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{module ? 'Edit Level' : 'Add New Level'}</DialogTitle>
          <DialogDescription>
            {module ? 'Update level information' : 'Create a new course level'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="module-title">Level Title *</Label>
            <Input
              id="module-title"
              placeholder="e.g., Introduction to AI"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="module-description">Description *</Label>
            <Textarea
              id="module-description"
              placeholder="Describe what students will learn in this level"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {module ? 'Save Changes' : 'Add Level'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
