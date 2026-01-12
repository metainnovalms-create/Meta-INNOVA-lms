import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  officerId: string;
  documentType?: string;
  onUploadSuccess: (
    file: File,
    documentType: string,
    documentName: string,
    description?: string
  ) => void;
}

const documentTypes = [
  { value: 'appointment_letter', label: 'Appointment Letter' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'id_card', label: 'ID Card' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

export default function DocumentUploadDialog({
  isOpen,
  onOpenChange,
  documentType,
  onUploadSuccess,
}: DocumentUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState(documentType || '');
  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Allowed: PDF, JPG, PNG, DOCX');
      return;
    }

    setSelectedFile(file);
    // Auto-fill document name if empty
    if (!documentName) {
      setDocumentName(file.name.split('.')[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (!selectedType) {
      toast.error('Please select a document type');
      return;
    }

    if (!documentName.trim()) {
      toast.error('Please enter a document name');
      return;
    }

    onUploadSuccess(selectedFile, selectedType, documentName.trim(), description.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedType(documentType || '');
    setDocumentName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleFileSelect}
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="mx-auto h-12 w-12 text-primary" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                    <span>Change File</span>
                  </Button>
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop your file here, or click to browse
                </p>
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Select File
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, JPG, PNG, DOCX (Max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Document Type */}
          <div>
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select document type..." />
              </SelectTrigger>
              <SelectContent>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Name */}
          <div>
            <Label htmlFor="document-name">Document Name</Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g., MBA Certificate 2023"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any additional notes about this document..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
