import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileImage, File, Download, Trash2 } from 'lucide-react';
import { OfficerDocument } from '@/services/systemadmin.service';

interface DocumentCardProps {
  document: OfficerDocument;
  onDownload: () => void;
  onDelete: () => void;
}

const getDocumentIcon = (fileType: string) => {
  if (fileType === 'pdf') {
    return <FileText className="h-5 w-5 text-red-500" />;
  } else if (fileType === 'jpg' || fileType === 'jpeg' || fileType === 'png') {
    return <FileImage className="h-5 w-5 text-blue-500" />;
  } else {
    return <File className="h-5 w-5 text-gray-500" />;
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function DocumentCard({
  document,
  onDownload,
  onDelete,
}: DocumentCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-muted rounded">
              {getDocumentIcon(document.file_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{document.document_name}</h4>
              <p className="text-sm text-muted-foreground">
                {document.file_size_mb.toFixed(2)} MB • Uploaded: {formatDate(document.uploaded_date)}
              </p>
              {document.description && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {document.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-1 ml-2">
            <Button variant="ghost" size="sm" onClick={onDownload} title="Download">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete} title="Delete">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
