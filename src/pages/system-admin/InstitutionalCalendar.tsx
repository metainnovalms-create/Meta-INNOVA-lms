import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { HolidayCalendar } from '@/components/calendar/HolidayCalendar';
import { holidayService } from '@/services/holiday.service';
import { CreateHolidayInput } from '@/types/leave';
import { toast } from 'sonner';

export default function InstitutionalCalendar() {
  const queryClient = useQueryClient();
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const currentYear = new Date().getFullYear();

  const { data: institutions = [], isLoading: loadingInstitutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutions')
        .select('id, name, code')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  // Company holidays
  const { data: companyHolidays = [], isLoading: loadingCompanyHolidays } = useQuery({
    queryKey: ['company-holidays', currentYear],
    queryFn: () => holidayService.getCompanyHolidays(currentYear)
  });

  // Institution holidays
  const { data: institutionHolidays = [], isLoading: loadingInstitutionHolidays } = useQuery({
    queryKey: ['institution-holidays', selectedInstitutionId, currentYear],
    queryFn: () => holidayService.getInstitutionHolidays(selectedInstitutionId, currentYear),
    enabled: !!selectedInstitutionId
  });

  // Company holiday mutations
  const createCompanyMutation = useMutation({
    mutationFn: holidayService.createCompanyHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast.success('Holiday added');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateHolidayInput> }) => 
      holidayService.updateCompanyHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast.success('Holiday updated');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: holidayService.deleteCompanyHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-holidays'] });
      toast.success('Holiday deleted');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  // Institution holiday mutations
  const createInstitutionMutation = useMutation({
    mutationFn: (data: CreateHolidayInput) => holidayService.createInstitutionHoliday(selectedInstitutionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-holidays', selectedInstitutionId] });
      toast.success('Holiday added');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const updateInstitutionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateHolidayInput> }) => 
      holidayService.updateInstitutionHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-holidays', selectedInstitutionId] });
      toast.success('Holiday updated');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const deleteInstitutionMutation = useMutation({
    mutationFn: holidayService.deleteInstitutionHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-holidays', selectedInstitutionId] });
      toast.success('Holiday deleted');
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const selectedInstitution = institutions.find(i => i.id === selectedInstitutionId);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Calendar Management</h1>
              <p className="text-muted-foreground">Manage working days, weekends, and holidays</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="company">Company Calendar</TabsTrigger>
            <TabsTrigger value="institution">Institution Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Company Calendar</strong> is used for Staff payroll calculations. 
                Mark working days, weekends, and company holidays here.
              </p>
            </div>
            <HolidayCalendar
              holidays={companyHolidays}
              isLoading={loadingCompanyHolidays}
              onAddHoliday={(data) => createCompanyMutation.mutate(data)}
              onUpdateHoliday={(id, data) => updateCompanyMutation.mutate({ id, data })}
              onDeleteHoliday={(id) => deleteCompanyMutation.mutate(id)}
              title="Company Calendar"
              isMutating={createCompanyMutation.isPending || updateCompanyMutation.isPending || deleteCompanyMutation.isPending}
              calendarType="company"
              enableDayTypeMarking={true}
            />
          </TabsContent>

          <TabsContent value="institution">
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Institution Calendar</strong> is used for Innovation Officers payroll calculations. 
                Each institution can have its own calendar for academic holidays and working days.
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Select Institution</span>
              </div>
              <Select 
                value={selectedInstitutionId} 
                onValueChange={setSelectedInstitutionId}
              >
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Choose an institution..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingInstitutions ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : institutions.length === 0 ? (
                    <SelectItem value="none" disabled>No institutions found</SelectItem>
                  ) : (
                    institutions.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name} {inst.code && `(${inst.code})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {!selectedInstitutionId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg bg-muted/30">
                <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold text-muted-foreground">Select an Institution</h2>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Choose an institution from the dropdown above to manage its calendar
                </p>
              </div>
            ) : (
              <HolidayCalendar
                holidays={institutionHolidays}
                isLoading={loadingInstitutionHolidays}
                onAddHoliday={(data) => createInstitutionMutation.mutate(data)}
                onUpdateHoliday={(id, data) => updateInstitutionMutation.mutate({ id, data })}
                onDeleteHoliday={(id) => deleteInstitutionMutation.mutate(id)}
                title={`${selectedInstitution?.name || 'Institution'} Calendar`}
                isMutating={createInstitutionMutation.isPending || updateInstitutionMutation.isPending || deleteInstitutionMutation.isPending}
                calendarType="institution"
                institutionId={selectedInstitutionId}
                enableDayTypeMarking={true}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
