import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Eye, Download, Trash2, FileText, Loader2, Send, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Report } from '@/types/report';
import { reportService } from '@/services/report.service';
import { CreateReportDialog } from '@/components/reports/CreateReportDialog';
import { ViewReportDialog } from '@/components/reports/ViewReportDialog';
import { ActivityReportPDF } from '@/components/reports/pdf/ActivityReportPDF';
import { pdf } from '@react-pdf/renderer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ReportsManagement() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [reportToPublish, setReportToPublish] = useState<Report | null>(null);
  const [publishAction, setPublishAction] = useState<'publish' | 'unpublish'>('publish');

  useEffect(() => {
    fetchReports();
  }, [statusFilter, searchQuery]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const filters: { status?: string; search?: string } = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      const data = await reportService.getReports(filters);
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setViewDialogOpen(true);
  };

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

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;
    
    try {
      await reportService.deleteReport(reportToDelete.id);
      toast.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Failed to delete report');
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handlePublishClick = (report: Report, action: 'publish' | 'unpublish') => {
    setReportToPublish(report);
    setPublishAction(action);
    setPublishDialogOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (!reportToPublish) return;
    
    try {
      if (publishAction === 'publish') {
        await reportService.publishReport(reportToPublish.id);
        toast.success('Report published successfully');
      } else {
        await reportService.unpublishReport(reportToPublish.id);
        toast.success('Report unpublished successfully');
      }
      fetchReports();
    } catch (error) {
      console.error('Error publishing report:', error);
      toast.error(`Failed to ${publishAction} report`);
    } finally {
      setPublishDialogOpen(false);
      setReportToPublish(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reports Management</h1>
            <p className="text-muted-foreground">Generate and manage activity reports for institutions</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Create Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Activity Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reports found</p>
                <p className="text-sm">Create your first activity report to get started</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Month</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Trainers</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.report_month}</TableCell>
                      <TableCell>{report.client_name}</TableCell>
                      <TableCell>
                        {report.trainers.slice(0, 2).map(t => t.name).join(', ')}
                        {report.trainers.length > 2 && ` +${report.trainers.length - 2}`}
                      </TableCell>
                      <TableCell>{report.hours_handled || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={report.status === 'final' ? 'default' : 'secondary'}>
                            {report.status}
                          </Badge>
                          {report.is_published && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Published
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(report.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewReport(report)}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownloadReport(report)}>
                              <Download className="h-4 w-4 mr-2" /> Download PDF
                            </DropdownMenuItem>
                            {report.is_published ? (
                              <DropdownMenuItem onClick={() => handlePublishClick(report, 'unpublish')}>
                                <EyeOff className="h-4 w-4 mr-2" /> Unpublish
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handlePublishClick(report, 'publish')}>
                                <Send className="h-4 w-4 mr-2" /> Publish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(report)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>
      </main>

      {/* Dialogs */}
      <CreateReportDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchReports}
      />

      <ViewReportDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        report={selectedReport}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this report for {reportToDelete?.client_name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {publishAction === 'publish' ? 'Publish Report' : 'Unpublish Report'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {publishAction === 'publish' 
                ? `Are you sure you want to publish this report? It will become visible to ${reportToPublish?.client_name}'s management.`
                : `Are you sure you want to unpublish this report? It will no longer be visible to ${reportToPublish?.client_name}'s management.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishConfirm}>
              {publishAction === 'publish' ? 'Publish' : 'Unpublish'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
