import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Eye } from 'lucide-react';
import { StudentCertificate } from '@/types/gamification';

interface CertificateCardProps {
  certificate: StudentCertificate;
  onView: () => void;
}

export function CertificateCard({ certificate, onView }: CertificateCardProps) {
  const handleDownload = () => {
    // In production, this would download the actual PDF
    window.open(certificate.certificate_url, '_blank');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{certificate.activity_name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{certificate.activity_type.replace('_', ' ')}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {new Date(certificate.completion_date).toLocaleDateString()}
              </Badge>
              {certificate.grade && (
                <Badge variant="secondary" className="text-xs">
                  Grade: {certificate.grade}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Verification: {certificate.verification_code}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={onView} className="flex-1">
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
