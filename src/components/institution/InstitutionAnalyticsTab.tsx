import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Users, TrendingUp, UserCheck, UserX, GraduationCap, BookOpen, BarChart3, FileText, Download, Calendar } from 'lucide-react';
import { InstitutionAnalytics, ReportOptions } from '@/types/institution';
import { toast } from 'sonner';

interface InstitutionAnalyticsTabProps {
  institutionId: string;
  institutionName: string;
  analytics: InstitutionAnalytics;
  onGenerateReport: (options: ReportOptions) => Promise<void>;
}

export const InstitutionAnalyticsTab = ({
  institutionName,
  analytics,
  onGenerateReport
}: InstitutionAnalyticsTabProps) => {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportOptions['report_type']>('comprehensive');
  const [reportFormat, setReportFormat] = useState<ReportOptions['format']>('pdf');
  const [dateRange, setDateRange] = useState('current_month');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = async () => {
    const today = new Date();
    let startDate: Date;
    let endDate = today;

    switch (dateRange) {
      case 'current_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'current_year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    setIsGenerating(true);
    try {
      await onGenerateReport({
        report_type: reportType,
        date_range: { start: startDate, end: endDate },
        format: reportFormat
      });
      toast.success('Report generated successfully');
      setIsReportDialogOpen(false);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Institution Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Comprehensive performance metrics for {institutionName}
          </p>
        </div>
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Institution Report</DialogTitle>
              <DialogDescription>
                Configure report options and download
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Report Type</Label>
                <RadioGroup value={reportType} onValueChange={(value) => setReportType(value as ReportOptions['report_type'])}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="comprehensive" id="comprehensive" />
                    <Label htmlFor="comprehensive" className="font-normal cursor-pointer">
                      Comprehensive Report (All metrics)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enrollment" id="enrollment" />
                    <Label htmlFor="enrollment" className="font-normal cursor-pointer">
                      Student Enrollment Report
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="attendance" id="attendance" />
                    <Label htmlFor="attendance" className="font-normal cursor-pointer">
                      Attendance Summary Report
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="performance" id="performance" />
                    <Label htmlFor="performance" className="font-normal cursor-pointer">
                      Academic Performance Report
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="staff_utilization" id="staff_utilization" />
                    <Label htmlFor="staff_utilization" className="font-normal cursor-pointer">
                      Staff Utilization Report
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_month">Current Month</SelectItem>
                    <SelectItem value="last_month">Last Month</SelectItem>
                    <SelectItem value="current_year">Current Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Format</Label>
                <RadioGroup value={reportFormat} onValueChange={(value) => setReportFormat(value as ReportOptions['format'])}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="font-normal cursor-pointer">
                      PDF Document
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="font-normal cursor-pointer">
                      Excel Spreadsheet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="font-normal cursor-pointer">
                      CSV File
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsReportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleGenerateReport} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Student Metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Student Metrics
        </h4>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.student_metrics.total_students}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.student_metrics.active_students} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.student_metrics.new_enrollments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.student_metrics.attendance_rate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Institution average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dropout Rate</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.student_metrics.dropout_rate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Year to date
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Academic Performance */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Academic Performance
        </h4>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.academic_metrics.average_grade}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all subjects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performing</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{analytics.academic_metrics.top_performing_class}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Best class performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.academic_metrics.students_needing_attention}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Students below threshold
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Staff & Operational Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Staff Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Officers</span>
              <Badge variant="secondary">{analytics.staff_metrics.total_officers}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Utilization Rate</span>
              <Badge variant="default">{analytics.staff_metrics.officer_utilization_rate}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Staff Attendance</span>
              <Badge variant="default">{analytics.staff_metrics.staff_attendance_rate}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Teacher-Student Ratio</span>
              <Badge variant="outline">{analytics.staff_metrics.teacher_student_ratio}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Operational Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Classes</span>
              <Badge variant="secondary">{analytics.operational_metrics.total_classes}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lab Utilization</span>
              <Badge variant="default">{analytics.operational_metrics.lab_utilization}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Event Participation</span>
              <Badge variant="default">{analytics.operational_metrics.event_participation_rate}%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Project Completion</span>
              <Badge variant="default">{analytics.operational_metrics.project_completion_rate}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Subject-wise Performance</CardTitle>
          <CardDescription>Average scores across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.academic_metrics.subject_performance.map((subject) => (
              <div key={subject.subject} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{subject.subject}</span>
                    <span className="text-sm text-muted-foreground">{subject.average_score}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${subject.average_score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
