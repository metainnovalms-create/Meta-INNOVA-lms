import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { holidayService } from '@/services/holiday.service';
import { HolidayCalendar } from '@/components/calendar/HolidayCalendar';
import { CreateHolidayInput } from '@/types/leave';

export default function CompanyHolidays() {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch holidays for multiple years (current, previous, and next 2 years)
  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['company-holidays', selectedYear],
    queryFn: async () => {
      // Fetch for a range of years to support calendar navigation
      const years = [selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2];
      const allHolidays = await Promise.all(
        years.map(year => holidayService.getCompanyHolidays(year))
      );
      return allHolidays.flat();
    }
  });

  const createMutation = useMutation({
    mutationFn: holidayService.createCompanyHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast.success('Holiday added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateHolidayInput> }) => 
      holidayService.updateCompanyHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast.success('Holiday updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: holidayService.deleteCompanyHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast.success('Holiday deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Company Calendar</h1>
            <p className="text-muted-foreground">Manage working days, weekends, and holidays for Meta staff payroll</p>
          </div>
        </div>

        <HolidayCalendar
          holidays={holidays}
          isLoading={isLoading}
          onAddHoliday={(data) => createMutation.mutate(data)}
          onUpdateHoliday={(id, data) => updateMutation.mutate({ id, data })}
          onDeleteHoliday={(id) => deleteMutation.mutate(id)}
          title="Company Calendar"
          isMutating={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
          onYearChange={setSelectedYear}
          calendarType="company"
          enableDayTypeMarking={true}
        />
      </div>
    </Layout>
  );
}
