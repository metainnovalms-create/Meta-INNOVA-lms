import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useOfficerByUserId } from '@/hooks/useOfficerProfile';
import { HolidayCalendar } from '@/components/calendar/HolidayCalendar';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function OfficerInstitutionCalendar() {
  const { user } = useAuth();
  const { data: officerProfile, isLoading: officerLoading } = useOfficerByUserId(user?.id);
  const [institution, setInstitution] = useState<{ id: string; name: string } | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const primaryInstitutionId = officerProfile?.assigned_institutions?.[0];

  // Fetch institution details
  useEffect(() => {
    if (!primaryInstitutionId) {
      setIsLoading(false);
      return;
    }

    const fetchInstitution = async () => {
      const { data } = await supabase
        .from('institutions')
        .select('id, name')
        .eq('id', primaryInstitutionId)
        .single();

      if (data) {
        setInstitution(data);
      }
      setIsLoading(false);
    };

    fetchInstitution();
  }, [primaryInstitutionId]);

  // Fetch holidays for the current year
  useEffect(() => {
    if (!primaryInstitutionId) return;

    const fetchHolidays = async () => {
      const year = new Date().getFullYear();
      const { data } = await supabase
        .from('institution_holidays')
        .select('*')
        .eq('institution_id', primaryInstitutionId)
        .gte('year', year - 1)
        .lte('year', year + 1);

      setHolidays(data || []);
    };

    fetchHolidays();
  }, [primaryInstitutionId]);

  if (officerLoading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!primaryInstitutionId || !institution) {
    return (
      <Layout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Institution Assigned</h3>
            <p className="text-muted-foreground">
              You are not assigned to any institution. Please contact your administrator.
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
          institutionId={primaryInstitutionId}
          enableDayTypeMarking={false}
        />
      </div>
    </Layout>
  );
}
