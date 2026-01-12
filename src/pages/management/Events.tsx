import { Layout } from '@/components/layout/Layout';
import { OfficerEventsView } from '@/components/events/OfficerEventsView';

export default function ManagementEvents() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">
            View events and track institutional participation
          </p>
        </div>

        <OfficerEventsView />
      </div>
    </Layout>
  );
}
