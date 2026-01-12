import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InstitutionHeader } from "@/components/management/InstitutionHeader";
import { getInstitutionBySlug } from "@/data/mockInstitutionData";
import { useLocation } from "react-router-dom";
import { usePublishedReports } from "@/hooks/usePublishedReports";
import { useInstitutionPerformanceMetrics } from "@/hooks/useInstitutionPerformanceMetrics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ActivityReportPDF } from "@/components/reports/pdf/ActivityReportPDF";
import { pdf } from "@react-pdf/renderer";
import { toast } from "sonner";

// Hook to get institution ID from slug
function useInstitutionId(slug: string | undefined) {
  return useQuery({
    queryKey: ['institution-id', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('institutions')
        .select('id')
        .eq('slug', slug)
        .single();
      if (error) throw error;
      return data?.id;
    },
    enabled: !!slug,
  });
}

// Performance Analytics Tab
const PerformanceAnalyticsTab = ({ institutionId }: { institutionId: string | undefined }) => {
  const [period, setPeriod] = useState("monthly");
  const { data: metrics, isLoading } = useInstitutionPerformanceMetrics(institutionId);

  const performanceMetrics = [
    {
      id: "1",
      metricName: "Student Pass Rate",
      category: "academic" as const,
      currentValue: metrics?.passRate ?? 0,
      targetValue: 90,
    },
    {
      id: "2",
      metricName: "Average Attendance",
      category: "attendance" as const,
      currentValue: metrics?.avgAttendance ?? 0,
      targetValue: 95,
    },
    {
      id: "3",
      metricName: "Student Engagement Score",
      category: "engagement" as const,
      currentValue: metrics?.engagementScore ?? 0,
      targetValue: 85,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Analytics</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="annual">Annual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!metrics?.hasData && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No performance data recorded yet for this institution.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {performanceMetrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{metric.metricName}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{metric.currentValue}%</span>
                <span className="text-sm text-muted-foreground">
                  Target: {metric.targetValue}%
                </span>
              </div>
              <Badge variant="outline" className="capitalize">
                {metric.category}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Monthly Reports Tab - Now uses real published reports
const MonthlyReportsTab = ({ institutionId }: { institutionId: string | undefined }) => {
  const [typeFilter, setTypeFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { data: publishedReports, isLoading } = usePublishedReports(institutionId);

  const filteredReports = (publishedReports || []).filter((report) => {
    if (typeFilter === "all") return true;
    return report.report_type?.toLowerCase() === typeFilter;
  });

  const handleDownloadReport = async (report: any) => {
    try {
      setDownloadingId(report.id);
      const blob = await pdf(<ActivityReportPDF report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.client_name}_${report.report_month}_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Published Reports</h2>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Reports</CardTitle>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No published reports available yet.</p>
              <p className="text-sm">Reports will appear here once published by the administration.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <FileText className="h-10 w-10 text-blue-500" />
                        <div className="space-y-1 flex-1">
                          <h3 className="font-semibold">{report.client_name} - {report.report_month}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {report.published_at 
                                ? format(new Date(report.published_at), 'MMM dd, yyyy')
                                : format(new Date(report.created_at), 'MMM dd, yyyy')
                              }
                            </div>
                            <Badge variant="default">Published</Badge>
                            <Badge variant="outline" className="capitalize">
                              {report.report_type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadReport(report)}
                          disabled={downloadingId === report.id}
                        >
                          {downloadingId === report.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Reports = () => {
  // Extract institution from URL
  const location = useLocation();
  const institutionSlug = location.pathname.split('/')[2];
  const institution = getInstitutionBySlug(institutionSlug);
  
  // Get real institution ID from database
  const { data: institutionId } = useInstitutionId(institutionSlug);

  return (
    <Layout>
      <div className="space-y-6">
        {institution && (
          <InstitutionHeader 
            institutionName={institution.name}
            establishedYear={institution.established_year}
            location={institution.location}
            totalStudents={institution.total_students}
            academicYear={institution.academic_year}
            userRole="Management Portal"
            assignedOfficers={institution.assigned_officers.map(o => o.officer_name)}
          />
        )}
        
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Performance analytics and reports</p>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
            <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="analytics" className="mt-6">
            <PerformanceAnalyticsTab institutionId={institutionId} />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            <MonthlyReportsTab institutionId={institutionId} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Reports;
