import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, Loader2 } from 'lucide-react';
import { Report } from '@/types/report';
import { ActivityReportPDF } from './pdf/ActivityReportPDF';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';

interface ViewReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
}

export function ViewReportDialog({ open, onOpenChange, report }: ViewReportDialogProps) {
  const [downloading, setDownloading] = useState(false);

  if (!report) return null;

  const handleDownload = async () => {
    setDownloading(true);
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
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const blob = await pdf(<ActivityReportPDF report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error printing report:', error);
      toast.error('Failed to print report');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{report.report_month} Activity Report - {report.client_name}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              <Button size="sm" onClick={handleDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-6 max-h-[70vh] overflow-y-auto">
          {/* Report Preview */}
          <div className="bg-background rounded-lg p-6 shadow-sm space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="text-sm text-muted-foreground">Metasage Alliance</div>
              <div className="text-sm">{new Date(report.report_date).toLocaleDateString()}</div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-center underline">
              {report.report_month.toUpperCase()} Activity Report
            </h2>

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex">
                <span className="font-semibold w-56">Client Name</span>
                <span>: {report.client_name}</span>
              </div>

              <div>
                <div className="flex">
                  <span className="font-semibold w-56">Trainer(s) Name and Designation</span>
                  <span>:</span>
                </div>
                <ul className="ml-8 mt-1 space-y-1">
                  {report.trainers.map((trainer, i) => (
                    <li key={i}>• {trainer.name}, {trainer.designation}</li>
                  ))}
                </ul>
              </div>

              {report.trainers.some(t => t.attendance) && (
                <div className="flex">
                  <span className="font-semibold w-56">Trainer(s) Attendance</span>
                  <span>: {report.trainers.filter(t => t.attendance).map(t => `${t.attendance}%`).join(' | ')}</span>
                </div>
              )}

              {report.hours_handled && (
                <div className="flex">
                  <span className="font-semibold w-56">No. of hours handled</span>
                  <span>: {report.hours_handled} {report.hours_unit}</span>
                </div>
              )}

              {report.portion_covered_percentage !== undefined && (
                <div className="flex">
                  <span className="font-semibold w-56">Percentage of portion covered</span>
                  <span>: {report.portion_covered_percentage}%</span>
                </div>
              )}

              <div className="flex">
                <span className="font-semibold w-56">No. of Assessment completed</span>
                <span>: {report.assessments_completed || '-'}</span>
              </div>

              <div className="flex">
                <span className="font-semibold w-56">Results of assessment</span>
                <span>: {report.assessment_results || '-'}</span>
              </div>
            </div>

            {/* Activities Table */}
            {report.activities.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold underline mb-3">Details of other activities completed</h3>
                <table className="w-full border-collapse border text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border p-2 text-left w-2/5">Activity</th>
                      <th className="border p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.activities.map((activity, i) => (
                      <tr key={i}>
                        <td className="border p-2">{activity.activity}</td>
                        <td className="border p-2">{activity.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature */}
            <div className="pt-10 text-right">
              <div className="inline-block text-center">
                <div className="text-lg mb-1">-SD-</div>
                <div className="text-sm">{report.signatory_designation}</div>
                <div className="text-sm">{report.signatory_name}</div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
