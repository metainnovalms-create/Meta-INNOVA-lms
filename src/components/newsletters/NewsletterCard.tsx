import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Newsletter } from "@/services/newsletter.service";

interface NewsletterCardProps {
  newsletter: Newsletter;
  onDownload: (newsletter: Newsletter) => void;
}

export function NewsletterCard({ newsletter, onDownload }: NewsletterCardProps) {
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer" onClick={() => onDownload(newsletter)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* PDF Icon */}
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
            <FileText className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
              {newsletter.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(newsletter.created_at), 'MMM d, yyyy')}
              </span>
              <span>•</span>
              <span>{formatFileSize(newsletter.file_size)}</span>
              <span>•</span>
              <span>{newsletter.download_count} downloads</span>
            </div>
          </div>
          
          {/* Download Button */}
          <Button
            variant="ghost"
            size="icon"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(newsletter);
            }}
          >
            <Download className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
