import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCw, Download, Star, FileText, Eye, Pencil, Trash2 } from 'lucide-react';
import { useAppraisals, useDeleteAppraisal, useRealtimeAppraisals, PerformanceAppraisal } from '@/hooks/usePerformanceAppraisals';
import { useHRRatings, useDeleteHRRating, useRealtimeHRRatings, HRRating } from '@/hooks/useHRRatings';
import { PerformanceAppraisalForm } from '@/components/performance/PerformanceAppraisalForm';
import { HRRatingForm } from '@/components/performance/HRRatingForm';
import { AppraisalViewDialog } from '@/components/performance/AppraisalViewDialog';
import { HRRatingViewDialog } from '@/components/performance/HRRatingViewDialog';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
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

export default function PerformanceRatings() {
  // React Query hooks for data fetching
  const { data: appraisals = [], isLoading: isLoadingAppraisals, refetch: refetchAppraisals } = useAppraisals();
  const { data: hrRatings = [], isLoading: isLoadingHRRatings, refetch: refetchHRRatings } = useHRRatings();
  
  // Mutation hooks
  const deleteAppraisalMutation = useDeleteAppraisal();
  const deleteRatingMutation = useDeleteHRRating();
  
  // Enable real-time subscriptions
  useRealtimeAppraisals();
  useRealtimeHRRatings();
  
  // Dialog states
  const [showAppraisalForm, setShowAppraisalForm] = useState(false);
  const [showHRRatingForm, setShowHRRatingForm] = useState(false);
  const [editingAppraisal, setEditingAppraisal] = useState<PerformanceAppraisal | null>(null);
  const [editingRating, setEditingRating] = useState<HRRating | null>(null);
  const [viewingAppraisal, setViewingAppraisal] = useState<PerformanceAppraisal | null>(null);
  const [viewingRating, setViewingRating] = useState<HRRating | null>(null);
  const [deleteAppraisalId, setDeleteAppraisalId] = useState<string | null>(null);
  const [deleteRatingId, setDeleteRatingId] = useState<string | null>(null);

  const isLoading = isLoadingAppraisals || isLoadingHRRatings;

  const handleRefresh = () => {
    refetchAppraisals();
    refetchHRRatings();
  };

  const handleDeleteAppraisal = async () => {
    if (deleteAppraisalId) {
      try {
        await deleteAppraisalMutation.mutateAsync(deleteAppraisalId);
        toast({ title: 'Appraisal deleted successfully' });
      } catch (error) {
        toast({ title: 'Failed to delete appraisal', variant: 'destructive' });
      }
      setDeleteAppraisalId(null);
    }
  };

  const handleDeleteRating = async () => {
    if (deleteRatingId) {
      try {
        await deleteRatingMutation.mutateAsync(deleteRatingId);
        toast({ title: 'HR Rating deleted successfully' });
      } catch (error) {
        toast({ title: 'Failed to delete HR rating', variant: 'destructive' });
      }
      setDeleteRatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Draft' },
      submitted: { variant: 'secondary', label: 'Submitted' },
      manager_reviewed: { variant: 'default', label: 'Manager Reviewed' },
      principal_reviewed: { variant: 'default', label: 'Principal Reviewed' },
      completed: { variant: 'default', label: 'Completed' }
    };
    const config = variants[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const exportToCSV = (type: 'appraisals' | 'ratings') => {
    const data = type === 'appraisals' ? appraisals : hrRatings;
    const headers = type === 'appraisals' 
      ? ['Trainer', 'Institution', 'Period', 'Status', 'Projects Mentored', 'Hours']
      : ['Trainer', 'Period', 'Year', 'Stars This Quarter', 'Cumulative Stars'];
    
    const rows = type === 'appraisals'
      ? appraisals.map(a => [a.trainer_name, a.institution_name, `${a.reporting_period_from} - ${a.reporting_period_to}`, a.status, a.total_projects_mentored, a.total_instructional_hours])
      : hrRatings.map(r => [r.trainer_name, r.period, r.year, r.total_stars_quarter, r.cumulative_stars_year]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance & Ratings</h1>
          <p className="text-muted-foreground">Manage trainer performance appraisals and star ratings</p>
        </div>

        <Tabs defaultValue="appraisal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="appraisal" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Performance Appraisal
            </TabsTrigger>
            <TabsTrigger value="rating" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              HR Rating
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appraisal" className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <Button onClick={() => { setEditingAppraisal(null); setShowAppraisalForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Appraisal
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToCSV('appraisals')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Appraisals</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAppraisals ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Trainer</th>
                          <th className="text-left p-3">Institution</th>
                          <th className="text-left p-3">Period</th>
                          <th className="text-left p-3">Projects</th>
                          <th className="text-left p-3">Hours</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appraisals.map(appraisal => (
                          <tr key={appraisal.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-medium">{appraisal.trainer_name}</td>
                            <td className="p-3">{appraisal.institution_name}</td>
                            <td className="p-3 text-xs">
                              {format(new Date(appraisal.reporting_period_from), 'MMM yyyy')} - {format(new Date(appraisal.reporting_period_to), 'MMM yyyy')}
                            </td>
                            <td className="p-3">{appraisal.total_projects_mentored}</td>
                            <td className="p-3">{appraisal.total_instructional_hours}</td>
                            <td className="p-3">{getStatusBadge(appraisal.status)}</td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewingAppraisal(appraisal)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingAppraisal(appraisal); setShowAppraisalForm(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteAppraisalId(appraisal.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {appraisals.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              No performance appraisals found. Create one to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rating" className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <Button onClick={() => { setEditingRating(null); setShowHRRatingForm(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create HR Rating
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportToCSV('ratings')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>HR Star Ratings</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingHRRatings ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Trainer</th>
                          <th className="text-left p-3">Employee ID</th>
                          <th className="text-left p-3">Period</th>
                          <th className="text-left p-3">Projects</th>
                          <th className="text-left p-3">Stars (Quarter)</th>
                          <th className="text-left p-3">Stars (Year)</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hrRatings.map(rating => (
                          <tr key={rating.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-medium">{rating.trainer_name}</td>
                            <td className="p-3">{rating.employee_id}</td>
                            <td className="p-3">{rating.period} {rating.year}</td>
                            <td className="p-3">{rating.project_ratings?.length || 0}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                {rating.total_stars_quarter}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                {rating.cumulative_stars_year}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => setViewingRating(rating)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => { setEditingRating(rating); setShowHRRatingForm(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteRatingId(rating.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {hrRatings.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              No HR ratings found. Create one to get started.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <PerformanceAppraisalForm
        open={showAppraisalForm}
        onOpenChange={setShowAppraisalForm}
        appraisal={editingAppraisal}
        onSuccess={() => refetchAppraisals()}
      />

      <HRRatingForm
        open={showHRRatingForm}
        onOpenChange={setShowHRRatingForm}
        rating={editingRating}
        onSuccess={() => refetchHRRatings()}
      />

      <AppraisalViewDialog
        open={!!viewingAppraisal}
        onOpenChange={(open) => !open && setViewingAppraisal(null)}
        appraisal={viewingAppraisal}
      />

      <HRRatingViewDialog
        open={!!viewingRating}
        onOpenChange={(open) => !open && setViewingRating(null)}
        rating={viewingRating}
      />

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={!!deleteAppraisalId} onOpenChange={() => setDeleteAppraisalId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appraisal?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the performance appraisal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppraisal} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRatingId} onOpenChange={() => setDeleteRatingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete HR Rating?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the HR rating record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRating} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
