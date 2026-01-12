import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { holidayService } from '@/services/holiday.service';
import { HolidayCalendar } from '@/components/calendar/HolidayCalendar';
import { CreateHolidayInput } from '@/types/leave';

interface Props {
  institutionId: string;
  institutionName?: string;
}

export function InstituteHolidayCalendar({ institutionId, institutionName }: Props) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['institution-holidays', institutionId, currentYear],
    queryFn: () => holidayService.getInstitutionHolidays(institutionId, currentYear),
    enabled: !!institutionId
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateHolidayInput) => holidayService.createInstitutionHoliday(institutionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-holidays', institutionId] });
      toast.success('Holiday added successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateHolidayInput> }) => 
      holidayService.updateInstitutionHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-holidays', institutionId] });
      toast.success('Holiday updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: holidayService.deleteInstitutionHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-holidays', institutionId] });
      toast.success('Holiday deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  return (
    <HolidayCalendar
      holidays={holidays}
      isLoading={isLoading}
      onAddHoliday={(data) => createMutation.mutate(data)}
      onUpdateHoliday={(id, data) => updateMutation.mutate({ id, data })}
      onDeleteHoliday={(id) => deleteMutation.mutate(id)}
      allowedTypes={['institution', 'academic', 'exam']}
      title={institutionName ? `${institutionName} Holidays` : 'Institution Holidays'}
      isMutating={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
      calendarType="institution"
      institutionId={institutionId}
      enableDayTypeMarking={true}
    />
  );
}
