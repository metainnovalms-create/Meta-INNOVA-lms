import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddProjectAchievement, uploadCertificate } from '@/hooks/useProjectAchievements';
import { Upload, FileText, X } from 'lucide-react';

interface AddAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  officerId: string;
}

export function AddAchievementDialog({
  open,
  onOpenChange,
  projectId,
  officerId,
}: AddAchievementDialogProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'award' as 'award' | 'participation' | 'achievement',
    eventName: '',
    eventDate: '',
    description: '',
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const addAchievement = useAddProjectAchievement();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    setIsUploading(true);
    try {
      let certificateUrl: string | null = null;

      if (certificateFile) {
        certificateUrl = await uploadCertificate(certificateFile, projectId);
      }

      await addAchievement.mutateAsync({
        project_id: projectId,
        title: formData.title,
        type: formData.type,
        event_name: formData.eventName || undefined,
        event_date: formData.eventDate || undefined,
        description: formData.description || undefined,
        certificate_url: certificateUrl || undefined,
        added_by_officer_id: officerId,
      });

      // Reset form
      setFormData({
        title: '',
        type: 'award',
        eventName: '',
        eventDate: '',
        description: '',
      });
      setCertificateFile(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding achievement:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const isSubmitting = addAchievement.isPending || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Achievement / Award</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., 1st Place - Science Fair 2025"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'award' | 'participation' | 'achievement') => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="award">Award</SelectItem>
                <SelectItem value="participation">Participation</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventName">Event Name</Label>
            <Input
              id="eventName"
              value={formData.eventName}
              onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
              placeholder="e.g., District Science Fair"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of the achievement"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Certificate (PDF)</Label>
            {certificateFile ? (
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm flex-1 truncate">{certificateFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setCertificateFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-md cursor-pointer hover:border-primary/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload PDF</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim() || isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Achievement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
