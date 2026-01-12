import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventsListDB } from '@/components/events/EventsListDB';
import { CreateEventForm } from '@/components/events/CreateEventForm';
import { useCanManageEvents } from '@/hooks/useEvents';
import { Loader2 } from 'lucide-react';

export default function EventManagement() {
  const [activeTab, setActiveTab] = useState('events');
  const { data: canManage, isLoading } = useCanManageEvents();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">
            {canManage 
              ? 'Create and manage webinars, hackathons, science expos, competitions and more'
              : 'View events and track participation'}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">All Events</TabsTrigger>
            {canManage && (
              <TabsTrigger value="create">Create Event</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="events">
            <EventsListDB />
          </TabsContent>

          {canManage && (
            <TabsContent value="create">
              <CreateEventForm onSuccess={() => setActiveTab('events')} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
