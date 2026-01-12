import { supabase } from '@/integrations/supabase/client';
import { Report, CreateReportData, Trainer, Activity } from '@/types/report';
import { Json } from '@/integrations/supabase/types';

interface ReportFilters {
  report_type?: string;
  status?: string;
  institution_id?: string;
  search?: string;
}

const parseTrainers = (data: Json | null): Trainer[] => {
  if (!data || !Array.isArray(data)) return [];
  return data as unknown as Trainer[];
};

const parseActivities = (data: Json | null): Activity[] => {
  if (!data || !Array.isArray(data)) return [];
  return data as unknown as Activity[];
};

export const reportService = {
  async getReports(filters?: ReportFilters): Promise<Report[]> {
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.report_type) {
      query = query.eq('report_type', filters.report_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.institution_id) {
      query = query.eq('institution_id', filters.institution_id);
    }
    if (filters?.search) {
      query = query.ilike('client_name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(row => ({
      ...row,
      trainers: parseTrainers(row.trainers),
      activities: parseActivities(row.activities),
      report_type: row.report_type as 'activity' | 'monthly',
      status: row.status as 'draft' | 'final',
    }));
  },

  async getReportById(id: string): Promise<Report | null> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    
    if (!data) return null;
    
    return {
      ...data,
      trainers: parseTrainers(data.trainers),
      activities: parseActivities(data.activities),
      report_type: data.report_type as 'activity' | 'monthly',
      status: data.status as 'draft' | 'final',
    };
  },

  async createReport(reportData: CreateReportData): Promise<Report> {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('reports')
      .insert({
        report_type: reportData.report_type,
        report_month: reportData.report_month,
        report_date: reportData.report_date,
        institution_id: reportData.institution_id,
        client_name: reportData.client_name,
        client_location: reportData.client_location,
        trainers: reportData.trainers as unknown as Json,
        hours_handled: reportData.hours_handled,
        hours_unit: reportData.hours_unit,
        portion_covered_percentage: reportData.portion_covered_percentage,
        assessments_completed: reportData.assessments_completed,
        assessment_results: reportData.assessment_results,
        activities: reportData.activities as unknown as Json,
        signatory_name: reportData.signatory_name,
        signatory_designation: reportData.signatory_designation,
        signature_url: reportData.signature_url,
        status: reportData.status || 'draft',
        created_by: userData.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      trainers: parseTrainers(data.trainers),
      activities: parseActivities(data.activities),
      report_type: data.report_type as 'activity' | 'monthly',
      status: data.status as 'draft' | 'final',
    };
  },

  async updateReport(id: string, reportData: Partial<CreateReportData>): Promise<Report> {
    const updateData: Record<string, unknown> = { ...reportData };
    if (reportData.trainers) {
      updateData.trainers = reportData.trainers as unknown as Json;
    }
    if (reportData.activities) {
      updateData.activities = reportData.activities as unknown as Json;
    }
    
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      trainers: parseTrainers(data.trainers),
      activities: parseActivities(data.activities),
      report_type: data.report_type as 'activity' | 'monthly',
      status: data.status as 'draft' | 'final',
    };
  },

  async deleteReport(id: string): Promise<void> {
    // First fetch the report to check for stored PDF
    const report = await this.getReportById(id);
    
    // If there's a stored PDF in storage, delete it
    if (report?.generated_pdf_url) {
      try {
        const path = report.generated_pdf_url.split('/invoice-assets/')[1];
        if (path) {
          await supabase.storage.from('invoice-assets').remove([path]);
        }
      } catch (storageError) {
        console.error('Error deleting stored PDF:', storageError);
        // Continue with report deletion even if storage deletion fails
      }
    }

    // Delete the report record
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async publishReport(id: string): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .update({
        is_published: true,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      trainers: parseTrainers(data.trainers),
      activities: parseActivities(data.activities),
      report_type: data.report_type as 'activity' | 'monthly',
      status: data.status as 'draft' | 'final',
    };
  },

  async unpublishReport(id: string): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .update({
        is_published: false,
        published_at: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      ...data,
      trainers: parseTrainers(data.trainers),
      activities: parseActivities(data.activities),
      report_type: data.report_type as 'activity' | 'monthly',
      status: data.status as 'draft' | 'final',
    };
  },

  async getPublishedReportsForInstitution(institutionId: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('institution_id', institutionId)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      ...row,
      trainers: parseTrainers(row.trainers),
      activities: parseActivities(row.activities),
      report_type: row.report_type as 'activity' | 'monthly',
      status: row.status as 'draft' | 'final',
    }));
  },
};
