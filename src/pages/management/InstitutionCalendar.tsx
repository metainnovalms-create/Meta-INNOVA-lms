import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HolidayCalendar } from '@/components/calendar/HolidayCalendar';
import { useInstitutionStats } from '@/hooks/useInstitutionStats';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function ManagementInstitutionCalendar() {
  const location = useLocation();
  const institutionSlug = location.pathname.split('/')[2];
  const { institution, loading: institutionLoading } = useInstitutionStats(institutionSlug);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch holidays for the current year
  useEffect(() => {
    if (!institution?.id) {
      setIsLoading(false);
      return;
    }

    const fetchHolidays = async () => {
      const year = new Date().getFullYear();
      const { data } = await supabase
        .from('institution_holidays')
        .select('*')
        .eq('institution_id', institution.id)
        .gte('year', year - 1)
        .lte('year', year + 1);

      setHolidays(data || []);
      setIsLoading(false);
    };

    fetchHolidays();
  }, [institution?.id]);

  if (institutionLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!institution) {
    return (
      <Layout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Institution Not Found</h3>
            <p className="text-muted-foreground">
              Could not find the institution. Please check the URL or contact your administrator.
            </p>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{institution.name} - Holiday Calendar</h1>
          <p className="text-muted-foreground">
            View your institution's holidays, weekends, and working days
          </p>
        </div>

        <HolidayCalendar
          holidays={holidays}
          isLoading={isLoading}
          onAddHoliday={() => {}}
          onUpdateHoliday={() => {}}
          onDeleteHoliday={() => {}}
          title="Institution Calendar"
          calendarType="institution"
          institutionId={institution.id}
          enableDayTypeMarking={false}
        />
      </div>
    </Layout>
  );
}
