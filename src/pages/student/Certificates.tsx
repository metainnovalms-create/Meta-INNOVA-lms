import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CertificateCard } from '@/components/student/CertificateCard';
import { CertificatePreviewDialog } from '@/components/student/CertificatePreviewDialog';
import { gamificationDbService } from '@/services/gamification-db.service';
import { useAuth } from '@/contexts/AuthContext';
import { StudentCertificate } from '@/types/gamification';
import { Award, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DBCertificate {
  id: string;
  student_id: string;
  template_id: string;
  activity_type: string;
  activity_id: string | null;
  activity_name: string;
  institution_id: string;
  issued_date: string;
  verification_code: string;
  grade: string | null;
  certificate_templates?: {
    name: string;
    category: string;
    template_image_url: string | null;
  };
}

export default function Certificates() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<StudentCertificate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const loadCertificates = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Use user.id (profile/auth ID) directly - certificates are stored with profile ID
        const data = await gamificationDbService.getStudentCertificates(user.id);
        
        // Transform DB data to StudentCertificate format
        const transformedCerts: StudentCertificate[] = (data as DBCertificate[]).map(cert => ({
          id: cert.id,
          student_id: cert.student_id,
          student_name: user.name || 'Student',
          template_id: cert.template_id,
          activity_type: cert.activity_type as 'course' | 'level' | 'assessment' | 'event',
          activity_id: cert.activity_id || '',
          activity_name: cert.activity_name,
          institution_name: '',
          issued_date: cert.issued_date,
          completion_date: cert.issued_date,
          certificate_url: '',
          verification_code: cert.verification_code,
          qr_code_url: '',
          grade: cert.grade || undefined
        }));
        
        setCertificates(transformedCerts);
      } catch (error) {
        console.error('Error loading certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [user?.id]);

  const filteredCertificates = categoryFilter === 'all' 
    ? certificates 
    : certificates.filter(c => c.activity_type === categoryFilter);

  const handleViewCertificate = (certificate: StudentCertificate) => {
    setSelectedCertificate(certificate);
    setPreviewOpen(true);
  };

  const categoryCounts = {
    all: certificates.length,
    course: certificates.filter(c => c.activity_type === 'course').length,
    level: certificates.filter(c => c.activity_type === 'level').length,
    assessment: certificates.filter(c => c.activity_type === 'assessment').length,
    event: certificates.filter(c => c.activity_type === 'event').length
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Certificates</h1>
          <p className="text-muted-foreground">View and download your earned certificates</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('all')}
          >
            All ({categoryCounts.all})
          </Button>
          <Button
            variant={categoryFilter === 'course' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('course')}
          >
            Courses ({categoryCounts.course})
          </Button>
          <Button
            variant={categoryFilter === 'level' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('level')}
          >
            Levels ({categoryCounts.level})
          </Button>
          <Button
            variant={categoryFilter === 'assessment' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('assessment')}
          >
            Assessments ({categoryCounts.assessment})
          </Button>
          <Button
            variant={categoryFilter === 'event' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoryFilter('event')}
          >
            Events ({categoryCounts.event})
          </Button>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCertificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onView={() => handleViewCertificate(certificate)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Award className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
              <p className="text-muted-foreground">
                Complete courses, levels, assessments, and events to earn certificates
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedCertificate && (
        <CertificatePreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          certificate={selectedCertificate}
        />
      )}
    </Layout>
  );
}
