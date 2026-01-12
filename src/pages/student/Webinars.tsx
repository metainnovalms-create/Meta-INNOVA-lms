import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { webinarService, Webinar } from '@/services/webinar.service';
import { WebinarCard } from '@/components/webinars/WebinarCard';
import { WebinarViewDialog } from '@/components/webinars/WebinarViewDialog';
import { Search, Video } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentWebinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState<Webinar | null>(null);

  useEffect(() => {
    const loadWebinars = async () => {
      try {
        setLoading(true);
        const data = await webinarService.getWebinars();
        setWebinars(data);
      } catch (error) {
        console.error('Error loading webinars:', error);
        toast.error('Failed to load webinars');
      } finally {
        setLoading(false);
      }
    };

    loadWebinars();
  }, []);

  const handleView = (webinar: Webinar) => {
    setSelectedWebinar(webinar);
    setViewDialogOpen(true);
  };

  const filteredWebinars = webinars.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.guest_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Webinars</h1>
          <p className="text-muted-foreground">Watch educational webinars and learn from experts</p>
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
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Video className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Webinars Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new educational content
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <WebinarViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        webinar={selectedWebinar}
      />
    </Layout>
  );
}
