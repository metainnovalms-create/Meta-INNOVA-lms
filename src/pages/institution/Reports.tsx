import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { usePublishedReports } from '@/hooks/usePublishedReports';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ActivityReportPDF } from '@/components/reports/pdf/ActivityReportPDF';
import { pdf } from '@react-pdf/renderer';
import { Report } from '@/types/report';

export default function Reports() {
  const { slug } = useParams<{ slug: string }>();
  
  // Get institution ID from slug
  const { data: institution } = useQuery({
    queryKey: ['institution-by-slug', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: reports, isLoading } = usePublishedReports(institution?.id);

  const handleDownloadReport = async (report: Report) => {
    try {
      const blob = await pdf(<ActivityReportPDF report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.client_name}_${report.report_month}_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Monthly Reports</h1>
          <p className="text-muted-foreground">View and download published reports from {institution?.name || 'your organization'}</p>
        </div>

        {/* Published Reports */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Published Reports</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !reports || reports.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No published reports available yet</p>
                <p className="text-sm">Reports will appear here once they are published by your organization</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {report.report_month} Activity Report
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="default">{report.report_type}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {report.trainers?.length || 0} trainer(s) • {report.hours_handled || 0} hours
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReport(report)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Published on {report.published_at 
                            ? new Date(report.published_at).toLocaleDateString() 
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
