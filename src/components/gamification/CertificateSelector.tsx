import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { mockCertificateTemplates } from '@/data/mockCertificateTemplates';
import { CertificateTemplate } from '@/types/gamification';
import { Eye } from 'lucide-react';

interface CertificateSelectorProps {
  category: 'course' | 'assignment' | 'assessment' | 'event';
  selectedTemplateId?: string;
  onSelect: (templateId: string | undefined) => void;
}

export function CertificateSelector({ category, selectedTemplateId, onSelect }: CertificateSelectorProps) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);

  useEffect(() => {
    const filtered = mockCertificateTemplates.filter(
      t => t.category === category && t.is_active
    );
    setTemplates(filtered);
  }, [category]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <div className="space-y-2">
      <Label>Certificate (Optional)</Label>
      <div className="flex gap-2">
        <Select value={selectedTemplateId || 'none'} onValueChange={(v) => onSelect(v === 'none' ? undefined : v)}>
          <SelectTrigger>
            <SelectValue placeholder="No certificate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Certificate</SelectItem>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedTemplate && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => window.open(selectedTemplate.template_image_url, '_blank')}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Students will automatically receive this certificate upon completion
      </p>
    </div>
  );
}
