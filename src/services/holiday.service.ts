import { supabase } from '@/integrations/supabase/client';
import { CompanyHoliday, InstitutionHoliday, CreateHolidayInput, HolidayType } from '@/types/leave';

// =============================================
// COMPANY HOLIDAYS SERVICE
// =============================================

export const companyHolidayService = {
  // Get all company holidays for a year
  getByYear: async (year: number): Promise<CompanyHoliday[]> => {
    const { data, error } = await supabase
      .from('company_holidays')
      .select('*')
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(h => ({
      ...h,
      holiday_type: h.holiday_type as HolidayType
    }));
  },

  // Get all company holidays
  getAll: async (): Promise<CompanyHoliday[]> => {
    const { data, error } = await supabase
      .from('company_holidays')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(h => ({
      ...h,
      holiday_type: h.holiday_type as HolidayType
    }));
  },

  // Create a new company holiday
  create: async (input: CreateHolidayInput): Promise<CompanyHoliday> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('company_holidays')
      .insert({
        ...input,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      holiday_type: data.holiday_type as HolidayType
    };
  },

  // Update a company holiday
  update: async (id: string, input: Partial<CreateHolidayInput>): Promise<CompanyHoliday> => {
    const { data, error } = await supabase
      .from('company_holidays')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      holiday_type: data.holiday_type as HolidayType
    };
  },

  // Delete a company holiday
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('company_holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Check if a date is a company holiday
  isHoliday: async (date: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('company_holidays')
      .select('id')
      .lte('date', date)
      .or(`end_date.gte.${date},end_date.is.null`)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }
};

// =============================================
// INSTITUTION HOLIDAYS SERVICE
// =============================================

export const institutionHolidayService = {
  // Get all institution holidays for a year
  getByYear: async (institutionId: string, year: number): Promise<InstitutionHoliday[]> => {
    const { data, error } = await supabase
      .from('institution_holidays')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('year', year)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(h => ({
      ...h,
      holiday_type: h.holiday_type as HolidayType
    }));
  },

  // Get all institution holidays
  getByInstitution: async (institutionId: string): Promise<InstitutionHoliday[]> => {
    const { data, error } = await supabase
      .from('institution_holidays')
      .select('*')
      .eq('institution_id', institutionId)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(h => ({
      ...h,
      holiday_type: h.holiday_type as HolidayType
    }));
  },

  // Create a new institution holiday
  create: async (institutionId: string, input: CreateHolidayInput): Promise<InstitutionHoliday> => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('institution_holidays')
      .insert({
        ...input,
        institution_id: institutionId,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      holiday_type: data.holiday_type as HolidayType
    };
  },

  // Update an institution holiday
  update: async (id: string, input: Partial<CreateHolidayInput>): Promise<InstitutionHoliday> => {
    const { data, error } = await supabase
      .from('institution_holidays')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      holiday_type: data.holiday_type as HolidayType
    };
  },

  // Delete an institution holiday
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('institution_holidays')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Check if a date is an institution holiday
  isHoliday: async (institutionId: string, date: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('institution_holidays')
      .select('id')
      .eq('institution_id', institutionId)
      .lte('date', date)
      .or(`end_date.gte.${date},end_date.is.null`)
      .limit(1);

    if (error) throw error;
    return (data?.length || 0) > 0;
  }
};

// Unified holiday service for easy import
export const holidayService = {
  getCompanyHolidays: companyHolidayService.getByYear,
  createCompanyHoliday: companyHolidayService.create,
  updateCompanyHoliday: companyHolidayService.update,
  deleteCompanyHoliday: companyHolidayService.delete,
  getInstitutionHolidays: institutionHolidayService.getByYear,
  createInstitutionHoliday: institutionHolidayService.create,
  updateInstitutionHoliday: institutionHolidayService.update,
  deleteInstitutionHoliday: institutionHolidayService.delete
};
