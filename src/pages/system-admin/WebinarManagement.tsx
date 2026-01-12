import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { webinarService, Webinar, WebinarFormData } from '@/services/webinar.service';
import { WebinarCard } from '@/components/webinars/WebinarCard';
import { WebinarFormDialog } from '@/components/webinars/WebinarFormDialog';
import { WebinarViewDialog } from '@/components/webinars/WebinarViewDialog';
import { Plus, Search, Video } from 'lucide-react';
import { toast } from 'sonner';
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

export default function WebinarManagement() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);

  const loadWebinars = async () => {
    try {
      setLoading(true);
      const data = await webinarService.getAllWebinars();
      setWebinars(data);
    } catch (error) {
      console.error('Error loading webinars:', error);
      toast.error('Failed to load webinars');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebinars();
  }, []);

  const handleCreate = () => {
    setSelectedWebinar(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setFormDialogOpen(true);
  };

  const handleView = (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setViewDialogOpen(true);
  };

  const handleDelete = (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (data: WebinarFormData) => {
    try {
      if (selectedWebinar) {
        await webinarService.updateWebinar(selectedWebinar.id, data);
        toast.success('Webinar updated successfully');
      } else {
        await webinarService.createWebinar(data);
        toast.success('Webinar created successfully');
      }
      loadWebinars();
    } catch (error) {
      console.error('Error saving webinar:', error);
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!selectedWebinar) return;
    
    try {
      await webinarService.deleteWebinar(selectedWebinar.id);
      toast.success('Webinar deleted successfully');
      loadWebinars();
    } catch (error) {
      console.error('Error deleting webinar:', error);
      toast.error('Failed to delete webinar');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedWebinar(null);
    }
  };

  const filteredWebinars = webinars.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.guest_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Webinar Management</h1>
            <p className="text-muted-foreground">Create and manage webinars for all users</p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Webinar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search webinars..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredWebinars.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredWebinars.map((webinar) => (
                  <WebinarCard
                    key={webinar.id}
                    webinar={webinar}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showActions
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Webinars Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first webinar to share with all users
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Webinar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WebinarFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        webinar={selectedWebinar}
        onSubmit={handleSubmit}
      />

      <WebinarViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        webinar={selectedWebinar}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Webinar</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedWebinar?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
