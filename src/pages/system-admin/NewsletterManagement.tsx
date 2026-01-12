import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  MoreVertical,
  Download,
  Trash2,
  FileText,
  RefreshCw,
  Loader2,
  Upload,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useNewsletters, useNewsletterMutations, useRealtimeNewsletters } from "@/hooks/useNewsletters";
import { UploadNewsletterDialog } from "@/components/newsletters/UploadNewsletterDialog";
import { Newsletter } from "@/services/newsletter.service";

export default function NewsletterManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteNewsletter, setDeleteNewsletter] = useState<Newsletter | null>(null);

  const { data: newsletters = [], isLoading, refetch } = useNewsletters({
    search: searchQuery || undefined,
  });

  const { deleteNewsletter: deleteNewsletterMutation, downloadNewsletter } = useNewsletterMutations();
  
  // Enable real-time updates
  useRealtimeNewsletters();

  // Statistics
  const stats = {
    total: newsletters.length,
    published: newsletters.filter(n => n.status === 'published').length,
    drafts: newsletters.filter(n => n.status === 'draft').length,
    downloads: newsletters.reduce((acc, n) => acc + (n.download_count || 0), 0),
  };

  const handleDownload = (newsletter: Newsletter) => {
    downloadNewsletter.mutate(newsletter.id);
  };

  const handleDelete = async () => {
    if (deleteNewsletter) {
      await deleteNewsletterMutation.mutateAsync(deleteNewsletter.id);
      setDeleteNewsletter(null);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getAudienceLabel = (audience: string[]) => {
    if (audience.includes('all')) return 'All Users';
    return audience.map(a => {
      switch (a) {
        case 'management': return 'Management';
        case 'officer': return 'Officers';
        case 'student': return 'Students';
        default: return a;
      }
    }).join(', ');
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Newsletter Management</h1>
            <p className="text-muted-foreground">
              Upload and manage PDF newsletters for all users
            </p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Newsletter
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Newsletters</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <FileText className="h-5 w-5 text-green-700 dark:text-green-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.published}</p>
                  <p className="text-xs text-muted-foreground">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <FileText className="h-5 w-5 text-yellow-700 dark:text-yellow-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.drafts}</p>
                  <p className="text-xs text-muted-foreground">Drafts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Download className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.downloads}</p>
                  <p className="text-xs text-muted-foreground">Total Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Newsletters Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>All Newsletters</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search newsletters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : newsletters.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No newsletters found</p>
                <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload your first newsletter
                </Button>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Newsletter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visible To</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newsletters.map((newsletter) => (
                      <TableRow key={newsletter.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium line-clamp-1">{newsletter.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {newsletter.file_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={newsletter.status === 'published' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            }
                          >
                            {newsletter.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">
                            {getAudienceLabel(newsletter.target_audience)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(newsletter.file_size)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Download className="h-4 w-4" />
                            {newsletter.download_count || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(newsletter.created_at), { addSuffix: true })}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownload(newsletter)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteNewsletter(newsletter)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <UploadNewsletterDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteNewsletter} onOpenChange={() => setDeleteNewsletter(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Newsletter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteNewsletter?.title}"? This will also remove the PDF file. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
