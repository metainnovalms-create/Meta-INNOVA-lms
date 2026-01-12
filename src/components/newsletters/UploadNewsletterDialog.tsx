import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNewsletterMutations } from "@/hooks/useNewsletters";
import { TargetAudience } from "@/services/newsletter.service";

interface UploadNewsletterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const audienceOptions: { value: TargetAudience; label: string }[] = [
  { value: 'all', label: 'All Users' },
  { value: 'management', label: 'Management' },
  { value: 'officer', label: 'Innovation Officers' },
  { value: 'student', label: 'Students' },
];

export function UploadNewsletterDialog({ open, onOpenChange }: UploadNewsletterDialogProps) {
  const { user } = useAuth();
  const { uploadNewsletter } = useNewsletterMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience[]>(['all']);
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleAudienceToggle = (audience: TargetAudience) => {
    if (audience === 'all') {
      setTargetAudience(['all']);
    } else {
      setTargetAudience(prev => {
        const filtered = prev.filter(a => a !== 'all');
        if (filtered.includes(audience)) {
          const result = filtered.filter(a => a !== audience);
          return result.length === 0 ? ['all'] : result;
        } else {
          return [...filtered, audience];
        }
      });
    }
  };
  
  const handleSubmit = async () => {
    if (!title.trim() || !file || !user) return;
    
    await uploadNewsletter.mutateAsync({
      title: title.trim(),
      file,
      target_audience: targetAudience,
      created_by: user.id,
      created_by_name: user?.name || 'Unknown',
    });
    
    // Reset form and close dialog
    setTitle('');
    setFile(null);
    setTargetAudience(['all']);
    onOpenChange(false);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Newsletter</DialogTitle>
          <DialogDescription>
            Upload a PDF newsletter to share with users
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter newsletter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          {/* File Upload */}
          <div className="space-y-2">
            <Label>PDF File</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-red-500" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop a PDF file here, or click to browse
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Target Audience */}
          <div className="space-y-3">
            <Label>Visible To</Label>
            <div className="grid grid-cols-2 gap-3">
              {audienceOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={targetAudience.includes(option.value)}
                    onCheckedChange={() => handleAudienceToggle(option.value)}
                  />
                  <label
                    htmlFor={option.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !file || uploadNewsletter.isPending}
          >
            {uploadNewsletter.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Upload Newsletter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
