import { Layout } from '@/components/layout/Layout';
import { StudentEventsView } from '@/components/events/StudentEventsView';

export default function StudentEvents() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground mt-1">
            Browse events and express your interest
          </p>
        </div>

        <StudentEventsView />
      </div>
    </Layout>
  );
}
