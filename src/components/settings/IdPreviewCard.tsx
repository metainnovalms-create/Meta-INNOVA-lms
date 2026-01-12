import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IdPreview } from '@/types/id-configuration';
import { Sparkles } from 'lucide-react';

interface IdPreviewCardProps {
  preview: IdPreview;
  entityType: 'employee' | 'institution' | 'student';
}

export function IdPreviewCard({ preview, entityType }: IdPreviewCardProps) {
  const entityLabels = {
    employee: 'Employee',
    institution: 'Institution',
    student: 'Student',
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Live Preview</CardTitle>
        </div>
        <CardDescription>
          How your {entityLabels[entityType]} IDs will look
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Pattern Template:</p>
          <Badge variant="outline" className="font-mono text-xs">
            {preview.pattern}
          </Badge>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Current Example:</p>
          <div className="p-3 bg-background rounded-lg border">
            <p className="font-mono text-lg font-semibold text-primary">
              {preview.example}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Next Generated ID:</p>
          <div className="p-3 bg-background rounded-lg border">
            <p className="font-mono text-lg font-semibold">
              {preview.next_id}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
