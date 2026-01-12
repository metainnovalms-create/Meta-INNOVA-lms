import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePublishedNewsletters, useNewsletterMutations, useRealtimeNewsletters } from "@/hooks/useNewsletters";
import { NewsletterCard } from "@/components/newsletters/NewsletterCard";

export default function Newsletters() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const userRole = user?.role || 'student';
  const { data: newsletters = [], isLoading, refetch } = usePublishedNewsletters(userRole);
  const { downloadNewsletter } = useNewsletterMutations();
  
  // Enable real-time updates
  useRealtimeNewsletters();
  
  // Filter newsletters by search query
  const filteredNewsletters = newsletters.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Newsletters</h1>
            <p className="text-muted-foreground">
              Download and view published newsletters
            </p>
          </div>
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

        {/* Newsletter List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredNewsletters.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">
              {searchQuery ? 'No newsletters match your search' : 'No newsletters available'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Check back later for new publications
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredNewsletters.map((newsletter) => (
              <NewsletterCard
                key={newsletter.id}
                newsletter={newsletter}
                onDownload={(n) => downloadNewsletter.mutate(n.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
